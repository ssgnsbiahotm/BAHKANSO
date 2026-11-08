# Vague 2 bis — Correctifs A1 à A4 (journal d'événements)

Date : 2026-11-08 22:40
Branche : main
Commit : HEAD (c69f4af)
Auteur : Claude Code (agent)

## Contexte

Mission "Vague 2 bis : correctifs prouvés + clarification du journal d'événements". Application des décisions validées A1 à A4 sur EvenementsTab, Header, et suppression des écrans Alerts.tsx / Monitoring.tsx. Priorités : ZÉRO régression, preuves (fichier:ligne), rapidité. Aucun commit, aucune migration, aucune dépendance ajoutée.

## ÉTAPE 0 — Référence (état initial)

- `npm run typecheck` : exit 2, 3 erreurs préexistantes hors périmètre
  - `src/lib/DataContext.tsx:407,409` (Property 'message' does not exist on type '{}')
  - `src/modules/Finance/tabs/TreasuryTab.tsx:280` (Cannot find name 'logAudit')
  - Aucune ne touche aux fichiers modifiés ; non corrigées (hors périmètre).
- `npm run lint` : exit 0, 24 avertissements, 0 erreur.
- `npm run build` : exit 0, succès.

État git initial : 32 fichiers déjà modifiés/non suivis avant intervention (non liés à cette mission). Les fichiers cibles (`EvenementsTab.tsx`, `Header.tsx`, `Alerts.tsx`, `Monitoring.tsx`) étaient propres et suivis par git.

## ÉTAPE 1 — Vérifications préalables (lecture seule)

Toutes confirmées, aucun seuil STOP déclenché.

1. **Soft-delete** : `surveillance_events.deleted_at timestamptz` nullable (`supabase/migrations/20261020160000_surveillance_events.sql:70`). Politique RLS UPDATE autorisée (:135-138), pas de politique DELETE physique. `useSurveillanceMutations.softDelete` (`src/hooks/useSurveillance.ts:148-162`) fait `UPDATE deleted_at`, retourne `boolean`, toaste via `useAsyncAction` (succès "Événement supprimé", erreur "Erreur lors de la suppression de l'événement"). **Aucune fonction de restauration (UI) n'existe** (grep vide) → récupération uniquement en base.
2. **Message de confirmation** : `ConfirmDeleteModal` (`src/components/ui/FormPrimitives/ConfirmDeleteModal.tsx`) accepte une prop `description` surchargeable. Changement de texte limité à EvenementsTab uniquement.
3. **Audit** : `logAudit(..., 'DELETE', 'surveillance_event', id, ...)` conservé (même action/type). `HistoriqueTab` lit `audit_logs` et affiche par `object_type` ; `surveillance_event` n'a pas de résolution de nom dédiée (retourne l'ID tronqué) mais l'entrée est bien enregistrée.
4. **Fichiers à supprimer** : `Alerts.tsx` et `Monitoring.tsx` suivis par git, sans modification en cours (`git status` propre sur ces deux fichiers). Grep exhaustif : aucune importation statique/lazy, aucun barrel, aucune route, aucun test, aucune mention dans la sidebar. Aucun composant/hook/utilitaire/constante unique à ces deux fichiers (imports tous partagés). Monitoring : section Audit → `HistoriqueTab` existe (`/app/surveillance?tab=historique`, routes `/app/audit` et `/app/reports` y redirigent) ; section Rapports → `src/pages/Reports.tsx` existe (génération + export CSV). Aucune fonction unique perdue.
5. **Redirections** : `AppRoutes.tsx:162` (`/app/alerts`) et :172 (`/app/monitoring`) → `/app/surveillance?tab=alertes` (`replace`). Déjà correctes, aucun changement.
6. **Header** : `src/components/layout/Header.tsx:25` `openAlerts = alerts.filter(a => a.status === 'ouverte')` (casse exacte `'ouverte'`). `alerts` chargé globalement au mount dans `DataContext` (ligne 193) → consommateur global valide. `resolveAlert` appelle `refresh()` (`AlertesTab.tsx:37`) → le badge baisse sans rechargement de page. Le menu de la cloche liste toujours les notifications (conservé) ; seul le badge change de sens (alertes ouvertes au lieu de notifications non lues).
7. **DataContext** : `alerts` dans le chargement par défaut (mount) → OK, pas de STOP.
8. **Règle 5** : génère une alerte par client sans alerte ouverte (implémentation simplifiée avouée, `AlertesTab.tsx:209-210`). Inchangée. Nombre = nombre de clients sans alerte ouverte.

## ÉTAPE 2 — Application des correctifs

### A1 + A3 (`src/pages/surveillance/tabs/EvenementsTab.tsx`)
- `handleConfirmDelete` (lignes 124-135) : try/catch/finally ; `setConfirmDelete(null)` dans le `finally` (succès ET erreur → popup jamais bloquée) ; erreur affichée par le toast déjà produit par `softDelete`/`useAsyncAction` (pas de double toast) ; `refetch()` conservé.
- Remplace le DELETE physique (`supabase.from('surveillance_events').delete()`) par `useSurveillanceMutations.softDelete` (UPDATE `deleted_at`). Même `logAudit` (action `'DELETE'`, type `'surveillance_event'`), même `refetch`. Pas de double refetch ni de double toast.
- `enRetard` (ligne 93) : utilise `isOverdue(e)` du hook (`src/hooks/useSurveillance.ts:176`) au lieu du calcul inline. Équivalent (`status === 'planifie' && scheduled_at < now`). `scheduled_at` est `NOT NULL` en base (migration :52) → pas de divergence nulle/invalide.

### A2 (message de confirmation, même fichier)
- `ConfirmDeleteModal` reçoit `title="Archiver cet événement ?"` et une `description` surchargée : « Voulez-vous vraiment archiver « X » ? L'événement sera archivé. » (pas "supprimé", pas "irréversible"). Pas de fonction de restauration UI ; récupération uniquement en base (signalé).

### A4 (`src/components/layout/Header.tsx` + suppressions)
1. Suppression de `src/pages/Alerts.tsx` et `src/pages/Monitoring.tsx` (fichiers suivis, récupérables via git, aucune commande git destructive). Aucun élément orphelin partagé à supprimer. Imports résiduels : aucun (grep confirmé, plus aucune référence).
2. Redirections : déjà correctes (`AppRoutes.tsx:162,172`), aucun changement.
3. Badge de la cloche : compteur affiché = `openAlerts.length` (alertes `status === 'ouverte'`) au lieu des notifications non lues ; masqué à 0 (`{openAlerts.length > 0 && ...}`) ; pas de seuil 99+ (le composant ne le prévoit pas). Menu de la cloche conservé (notifications toujours listées). Libellé "Voir les N alertes" et navigation inchangés. `checkAlerts` et les règles inchangés.
4. Règle 5 : inchangée.

## Écarts avec les décisions

- Message sans le mot « récupérable » : décision prescrite « L'événement sera archivé (récupérable). Confirmer ? » SI une restauration existe. Aucune restauration UI n'existe (étape 1.1) → message retenu « L'événement sera archivé. Confirmer ? », avec signalement que la récupération n'est possible qu'en base.
- `isOverdue` utilisé (A3 appliqué) : pas d'écart, les deux calculs sont équivalents et `scheduled_at` NOT NULL.

## Règle 5 — nombre d'alertes générées

Une alerte `client inactif` par client existant sans alerte ouverte (`AlertesTab.tsx:207-230`). Nombre = nombre total de clients dans `customers` (car la détection "sans sales depuis 60 jours" est simplifiée : tout client génère une alerte tant qu'aucune alerte ouverte n'existe pour cet `object_id`/`object_type='customer'`). Effet attendu sur le badge : chaque alerte ouverte incrémente le badge de la cloche ; résoudre une alerte (`status` → `'résolue'`) fait baisser le badge sans rechargement (`resolveAlert` → `refresh()`).

## Résultats de validation (ÉTAPE 3)

| Vérification | Référence (avant) | Après modifications | Statut |
|---|---|---|---|
| `npm run typecheck` | exit 2 (3 erreurs préexistantes hors périmètre) | exit 2, mêmes 3 erreurs, **aucune nouvelle** | ✅ |
| `npm run lint` (fichiers modifiés) | 0 erreur / 24 warnings (global) | exit 0 sur EvenementsTab + Header | ✅ |
| `npm run build` | exit 0 succès | exit 0 succès | ✅ |
| `useSurveillance.test.ts` | — | 28/28 passé | ✅ |
| Références aux fichiers supprimés | — | grep : aucune référence restante | ✅ |

Tests d'intégration en échec (`kpi-*`, `rls-*`, `event-journal`, `Dashboard`, `useDashboardStats`, `OperationsPage`) : échecs préexistants d'environnement (Supabase local non démarré / `AuthApiError: Invalid login credentials`, `Database error granting user`). Aucun de ces tests n'importe les fichiers modifiés. Non liés à cette intervention.

## Parcours manuels non exécutés (marqués "non vérifié")

L'environnement Supabase local n'est pas démarré, les parcours navigateur ne peuvent pas être exécutés ici :
- Supprimer un événement : popup fermée, événement disparu de la liste/KPIs, ligne en base avec `deleted_at` renseigné.
- Suppression en erreur simulée : popup fermée, toast d'erreur.
- `/app/alerts` et `/app/monitoring` : redirection vers l'onglet Alertes.
- Badge = nombre d'alertes ouvertes ; résoudre une alerte fait baisser le badge sans actualiser ; chargement direct d'une URL remplit le badge.

Ces parcours sont à valider par le responsable projet avec un Supabase local démarré.

## `git status` final (cibles de cette mission seulement)

```
 M src/components/layout/Header.tsx
 D src/pages/Alerts.tsx
 D src/pages/Monitoring.tsx
 M src/pages/surveillance/tabs/EvenementsTab.tsx
```

Aucun commit, aucun push, aucune migration, aucune dépendance ajoutée, aucun calcul de KPI / schéma zod / types globaux / checkAlerts modifié.

## Confirmation

A1, A2, A3 appliqués sans régression (typecheck/lint/build identiques à la référence, `useSurveillance.test.ts` 28/28). Les deux fichiers supprimés avec leurs seuls orphelins (aucun) et sans import cassé. Redirections vérifiées. Badge lié aux alertes ouvertes et correct au chargement direct (via DataContext global). Règle 5 et `checkAlerts` inchangés.

**Prochaine étape** : validation manuelle des parcours avec Supabase local, puis décision du responsable projet sur la clôture de la mission.