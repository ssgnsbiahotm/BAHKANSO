# Vague 2 — Diagnostic : Alertes (constats B1)

Date : 2026-11-08
Branche : main
Commit : HEAD (c69f4af)
Auteur : Claude Code (agent) + validation humaine en attente

## Contexte

Dans le cadre de la mission "Danse du Cobra, Vague 2 : correctifs UI sûrs + clarification métier", le constat de terrain "Alertes inconnu" signale une absence de lisibilité sur l'endroit où sont gérées les alertes et sur le lien entre les alertes affichées et les notifications du header. Ce diagnostic est en lecture seule : aucune modification de code, aucune migration, aucun commit.

## Environnement

- Stack : React 18, TypeScript, Vite 5, Supabase JS, TanStack React Query, Tailwind CSS
- Base : Supabase local (config.toml)
- Entrée de navigation : `/app/surveillance` (SurveillancePage) avec sous-onglets Alertes / Événements / Historique
- Redirections legacy : `/app/alerts` → `/app/surveillance?tab=alertes` ; `/app/monitoring` → `/app/surveillance?tab=alertes` (AppRoutes.tsx:162,172)

## Constats

### 1. Deux écrans "Alertes" coexistent

- `src/pages/Alerts.tsx` — page standalone "Alertes" (non routée dans AppRoutes, pas de route `/app/alerts` active). Contient les KPI (ouvertes, haute priorité, moyenne, résolues), la liste des alertes avec bouton "Résoudre" par alerte, et l'icône de catégorie dynamique (`categoryIcons` ligne 39-44).
- `src/pages/surveillance/tabs/AlertesTab.tsx` — onglet "Alertes" intégré dans SurveillancePage (SurveillancePage.tsx:47). Même KPI, même liste, même bouton "Résoudre", plus un bouton "Vérifier les alertes" qui déclenche `checkAlerts()` (ligne 41) créant des alertes selon 5 règles métier (stock faible, justificatif manquant, projet en retard, financement en transit, client inactif), et des filtres (statut, sévérité, recherche).

Les deux écrans partagent la même source de données : `alerts` depuis `useData()` (DataContext.tsx:88, 140), chargées via `supabase.from('alerts').select('*')` (DataContext.tsx:193, 390).

### 2. Le module Monitoring est une fusion redondante

`src/pages/Monitoring.tsx` fusionne Audit + Alertes + Rapports en un seul écran avec navigation latérale interne (Monitoring.tsx:41-47). Sa sous-section "Alertes" (Monitoring.tsx:406-454) réimplète la liste des alertes et le bouton "Résoudre" (`resolveAlert` ligne 159-169). Cette page n'est pas routée (AppRoutes redirige `/app/monitoring` vers SurveillancePage). C'est un doublon fonctionnel de la sous-section Alertes de SurveillancePage.

### 3. Le header affiche un badge de notifications déconnecté des alertes

`src/components/layout/Header.tsx` :
- Ligne 17 : reçoit `notifications` et `alerts` de `useData()`.
- Ligne 24 : `unreadCount` compte les notifications non lues (`notifications.filter(n => !n.read)`) — c'est le badge affiché sur la cloche (ligne 69-73).
- Ligne 25 : `openAlerts` compte les alertes ouvertes mais n'est utilisé que dans le libellé du bouton "Voir les {openAlerts.length} alertes" (ligne 82), qui redirige vers `/app/surveillance?tab=alertes`.
- Il n'existe aucun lien direct entre le badge de la cloche (notifications) et les alertes : le badge peut afficher 0 alors qu'il y a des alertes ouvertes, et inversement.

### 4. Les 5 règles de création d'alertes (checkAlerts) ne couvrent pas tous les domaines

`src/pages/surveillance/tabs/AlertesTab.tsx:41-194` :
1. Stock faible (`inventory_items` : current_stock <= min_stock) — catégorie "Stocks", severity high.
2. Justificatif manquant (`expenses` : has_justificatif=false et status != 'brouillon') — catégorie "Justificatifs", severity medium.
3. Projet en retard (`projects` : expected_end_date < today et status != 'terminé') — catégorie "Chantiers", severity high.
4. Financement en transit > 14 jours (`fundings` : status='en transit') — catégorie "Finance", severity low.
5. Client inactif (`customers`) — catégorie "Ventes", severity low — **implémentation simplifiée** : le commentaire lignes 209-210 admet que la détection "sans sales depuis 60 jours" nécessiterait une jointure avec transactions/sales ; actuellement l'alerte est créée pour tout client existant sans alerte ouverte.

Aucune règle ne couvre l'élevage (animal_events), les opérations culturales, ou les livraisons fournisseurs.

### 5. La résolution d'alerte met à jour Supabase mais ne recharge pas systématiquement

`AlertesTab.resolveAlert` (ligne 30-38) et `Alerts.resolveAlert` (ligne 28-37) appellent `supabase.from('alerts').update(...)` puis `refresh()` (DataContext.reload de 29 tables) en cas de succès. En cas d'erreur, seule un toast est affiché, pas de retry ni de rollback. Le statut passe directement à 'résolue' sans intermédiaire.

### 6. Aucune notification n'est créée à partir d'une alerte

Le flux est unidirectionnel : les alertes sont créées par `checkAlerts` (règles métier) et lues dans `AlertesTab`/`Alerts`/`Monitoring`. Il n'existe aucun mécanisme qui transforme une alerte en notification (`notifications` dans DataContext). Le header ne peut donc pas alerter l'utilisateur en temps réel sur une nouvelle alerte ouverte.

## Conclusion

Le module alertes est fonctionnel mais fragmenté : trois implémentations parallèles (page standalone Alerts.tsx, onglet AlertesTab dans SurveillancePage, sous-section dans Monitoring.tsx) partagent la même source `alerts` du DataContext. Le header affiche un badge de notifications distinct des alertes, sans lien entre les deux. Les règles de création automatique couvrent stock, justificatifs, projets, financements et clients (implémentation partielle pour les clients), mais pas l'élevage ni les opérations. La résolution fonctionne côté Supabase mais ne génère pas de notification.

## Décisions humaines requises

1. Conserver les trois écrans d'alertes ou en fusionner en un seul (supprimer Monitoring.tsx ou Alerts.tsx en doublon) ?
2. Relier le badge de la cloche (header) aux alertes ouvertes, ou maintenir notifications et alertes comme deux flux séparés ?
3. Compléter la règle 5 "client inactif" avec une vraie jointure ventes/transactions ?
4. Ajouter des règles d'alerte pour l'élevage (animal_events) et les opérations culturales ?

## Fichiers modifiés

Aucun (diagnostic en lecture seule).

## Prochaine étape

Rédiger le rapport frère `docs/reports/vague2-evenements.md` (B2 — diagnostic événements), puis présenter les deux constats pour décision produit.
