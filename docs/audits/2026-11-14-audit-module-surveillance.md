# Audit module Surveillance — 2026-11-14

## 📊 Résumé exécutif

Le module Surveillance est une page (`src/pages/surveillance/SurveillancePage.tsx`) accessible via `/app/surveillance`, protégée par `RequireModule module="surveillance" action="read"`. Elle se compose de trois onglets : **Alertes** (5 règles de détection automatique + résolution), **Événements** (CRUD des événements de surveillance avec soft-delete `deleted_at`, `RotatingCard`, hook `useSurveillance`/`useSurveillanceMutations`) et **Historique** (lecture directe de la table `audit_logs`). Les mutations d'événements utilisent `logAudit`. Les alertes sont chargées via le DataContext (`alerts` dans GLOBAL_SOURCES).

**Écarts : 🔴 1 critique, 🟠 5 importants, 🟡 3 améliorations, ⚪ 3 décisions métier.**

---

## ✅ Ce qui fonctionne bien

| Élément | Preuve |
|---------|--------|
| RBAC lecture sur la route `/app/surveillance` | `src/routes/AppRoutes.tsx:177-183` `<RequireModule module="surveillance" action="read">` |
| `alerts` dans GLOBAL_SOURCES (toujours chargé) | `src/lib/DataContext.tsx:47` |
| `logAudit` sur CREATE/UPDATE/DELETE des événements | `src/pages/surveillance/tabs/EvenementsTab.tsx:128,163,191` |
| Suppression soft-delete (`deleted_at`) avec fermeture du modal en `finally` | `EvenementsTab.tsx:124-135` |
| `useSurveillance` exclut les `deleted_at IS NULL` | `src/hooks/useSurveillance.ts:28` |
| 5 règles d'alerte (stock faible, justificatif manquant, projet en retard, financement en transit, client inactif) | `src/pages/surveillance/tabs/AlertesTab.tsx:45-234` |
| Déduplication des alertes (vérifie `existing` avant insert) | `AlertesTab.tsx:58-77`, `:94-112`, etc. |
| `RotatingCard` `flipLabel`/`backLabel` rendus sur les événements | `EvenementsTab.tsx:262-265` |
| KPIs (alertes ouvertes/haute/moyenne/résolues ; événements total/planifiés/en cours/en retard) | `AlertesTab.tsx:22-28`, `EvenementsTab.tsx:87-95` |

---

## 🗺️ Inventaire

### Écran et onglets

| Écran | Fichier | Route | Onglets |
|-------|---------|-------|---------|
| SurveillancePage | `src/pages/surveillance/SurveillancePage.tsx` | `/app/surveillance` | alertes / evenements / historique (pilotés par `?tab=`) |
| AlertesTab | `src/pages/surveillance/tabs/AlertesTab.tsx` | (sous-composant) | règles + résolution |
| EvenementsTab | `src/pages/surveillance/tabs/EvenementsTab.tsx` | (sous-composant) | CRUD événements |
| HistoriqueTab | `src/pages/surveillance/tabs/HistoriqueTab.tsx` | (sous-composant) | lecture `audit_logs` |

### Données

| Table | Fichier de type | Colonnes clés | Registre DataContext |
|-------|-----------------|---------------|----------------------|
| `alerts` | `src/lib/types.ts:369` | id, title, description, severity, category, object_type, object_id, status, resolved_at | GLOBAL_SOURCES (DataContext.tsx:47) |
| `surveillance_events` | `src/lib/types.ts:414` | id, type, site_id, plot_id, campaign_id, lot_id, animal_id, project_id, label, description, scheduled_at, completed_at, status, cost_amount, responsible_id, details, deleted_at | **non enregistré** |
| `audit_logs` | `src/lib/types.ts` (AuditLog) | id, user_id, user_name, action, object_type, object_id, title, description, created_at | **non enregistré** |

### Hooks

| Hook | Fichier | Rôle |
|------|---------|------|
| `useSurveillance` | `src/hooks/useSurveillance.ts:11` | liste paginée des `surveillance_events` (exclut `deleted_at`) |
| `useSurveillanceMutations` | `:84` | create/update/markCompleted/softDelete via `useAsyncAction` |
| `isOverdue` | `:176` | calcule si un événement planifié est en retard |

### Tests

| Test | Fichier | Couvre la surveillance ? |
|------|---------|-------------------------|
| `src/hooks/useSurveillance.test.ts` | existe (voir CONTEXT.md) | partiel (hook uniquement) |
| Aucun test sur AlertesTab/EvenementsTab/HistoriqueTab | — | ❌ |

---

## 🔗 Matrice de cohérence (champs critiques)

| Champ | UI | Zod / TS | SQL CHECK | Statut |
|-------|----|----------|-----------|--------|
| `surveillance_events.type` | `phyto_traitement`/`equip_panne` (EvenementsTab.tsx:27-29) | `SurveillanceEventType` union (types.ts:411) | — | ✅ enum TS |
| `surveillance_events.status` | `planifie`/`en_cours`/`termine`/`annule` (:31-36) | `SurveillanceEventStatus` union (types.ts:412) | — | ✅ enum TS |
| `alerts.severity` | `high`/`medium`/`low` (AlertesTab.tsx:24-26) | `Alert` type (types.ts:369) | — | ⚠️ à confirmer |
| `alerts.status` | `ouverte`/`résolue` (:23, :26) | — | — | ⚠️ pas d'enum confirmé |
| `surveillance_events.deleted_at` | soft-delete (useSurveillance.ts:148) | — | — | ✅ soft-delete |

---

## 🔴 Écarts critiques (preuves)

### S1 — Règle 5 « Client inactif » ne vérifie pas réellement l'inactivité (>60 jours sans vente)

- **Preuve** : `src/pages/surveillance/tabs/AlertesTab.tsx:196-234` — le commentaire admet : « Cette règle est simplifiée : on crée l'alerte si le client existe (la détection de "sans sales" nécessiterait une jointure avec transactions/sales) ». Aucune vérification de date de dernière vente n'est effectuée.
- **Conséquence** : une alerte « Client inactif » est créée pour **chaque client** existant, même très actif. Faux positifs systématiques. **À corriger ou désactiver jusqu'à implémentation réelle.**

---

## 🟠 Écarts importants (preuves)

### I1 — `surveillance_events` et `audit_logs` non enregistrés dans le registre MODULE_SOURCES

- **Preuve** : `src/lib/DataContext.tsx:52-60` — aucun module `surveillance` dans `MODULE_SOURCES` ; `surveillance_events` et `audit_logs` ne figurent dans aucune source (ni GLOBAL_SOURCES, ni MODULE_SOURCES). `EvenementsTab` utilise `useSurveillance` (requête directe, pas DataContext) ; `HistoriqueTab` lit `audit_logs` directement.
- **Conséquence** : ces deux tables ne bénéficient pas du mécanisme de chargement par module, du suivi de statut (idle/loading/success/error) ni du `refresh()` global.

### I2 — `EvenementsTab` ne déclare pas `loadModule('surveillance')`

- **Preuve** : `src/pages/surveillance/tabs/EvenementsTab.tsx` — aucun appel à `loadModule`. Seul `sites` est lu via `useData()` (ligne 60).
- **Conséquence** : cohérence avec les autres modules (qui déclarent `loadModule`) non respectée ; mais comme `surveillance` n'est pas dans le registre, l'appel serait sans effet.

### I3 — `HistoriqueTab` utilise `useAuth()` sans vérifier le résultat ni utiliser l'utilisateur

- **Preuve** : `src/pages/surveillance/tabs/HistoriqueTab.tsx:15` — `useAuth();` appelé mais le retour n'est pas utilisé ; la lecture de `audit_logs` n'est pas filtrée par utilisateur ni protégée au-delà du `RequireModule` de la route parente.
- **Conséquence** : appel inutile à `useAuth` ; pas de contrôle granulaire sur qui peut lire l'historique.

### I4 — `EvenementsTab` formulaire sans validation Zod (champs manipulés directement dans l'état)

- **Preuve** : `src/pages/surveillance/tabs/EvenementsTab.tsx:461-521` — le formulaire de création/édition modifie directement `editingEvent` dans l'état (`setEditingEvent({...})`) sans schéma Zod ni validation des champs obligatoires (label, scheduled_at, etc.).
- **Conséquence** : pas de validation côté client avant l'envoi à Supabase ; les erreurs ne sont gérées qu'à la réponse API.

### I5 — `TYPE_LABELS` en dur ne couvre que 2 types et est dupliqué avec `getTypeLabel` du hook

- **Preuve** : `EvenementsTab.tsx:18-21` (`TYPE_LABELS`) vs `useSurveillance.ts:184-189` (`getTypeLabel`). Même chose pour `TYPE_COLORS`/STATUS_COLORS vs `getTypeColor`/`getStatusColor`.
- **Conséquence** : duplication de la logique d'affichage entre le composant et le hook ; risque de divergence si un type est ajouté.

### I6 — `resolveAlert` (AlertesTab) ne vérifie pas que l'alerte est déjà résolue avant de mettre à jour

- **Preuve** : `src/pages/surveillance/tabs/AlertesTab.tsx:30-39` — `resolveAlert` met à jour `status='résolue'` sans vérifier le statut courant ; un double clic renvoie une update inutile (mais pas d'erreur car `update` est idempotent).
- **Conséquence** : mineure, mais pas de protection anti double-soumission explicite sur le bouton « Résoudre ».

---

## 🟡 Améliorations

### A1 — Pas de test unitaire sur AlertesTab, EvenementsTab, HistoriqueTab

- **Preuve** : seuls `useSurveillance.test.ts` existent (hook uniquement).
- **Conséquence** : pas de couverture sur les 5 règles d'alerte, le soft-delete, le CRUD événements, ni l'historique.

### A2 — `HistoriqueTab` lie vers `/app/${object_type}/?id=...` (target="_blank") qui peut pointer vers des routes inexistantes

- **Preuve** : `src/pages/surveillance/tabs/HistoriqueTab.tsx:233` — `<a href={/app/${log.object_type}/?id=...} target="_blank" rel="noopener noreferrer">`.
- **Conséquence** : le lien peut aboutir sur une route non gérée (404) selon `object_type` (ex. `expense` n'a pas de route dédiée).

### A3 — `checkAlerts` déclenche 5 requêtes parallèles sans protection contre les exécutions répétées rapides

- **Preuve** : `AlertesTab.tsx:41-238` — `checkAlerts` crée des alertes une par une (insert en boucle) sans verrou d'exécution ni taux de rafraîchissement.
- **Conséquence** : un utilisateur peut cliquer « Vérifier les alertes » plusieurs fois et créer des insertions redondantes (atténué par la vérification `existing`, mais pas de verrou au-delà de `checkAlertsRunning` qui désactive le bouton pendant l'exécution).

---

## ⚪ Décisions métier

### D1 — Sévérité et déclenchement des alertes

- Les sévérités (low/medium/high) et les règles (seuil 14 jours pour financement, 60 jours pour client inactif) sont codées en dur. **Décision nécessaire** : confirmer avec le responsable métier que ces seuils et sévérités sont les valeurs canoniques (CLAUDE.md §11 interdit d'inventer ces règles).

### D2 — Comportement de la règle 5 « Client inactif »

- Actuellement boîteuse (faux positifs). **Décision nécessaire** : soit implémenter la jointure avec les ventes pour détecter la véritable inactivité, soit désactiver la règle jusqu'à implémentation.

### D3 — Conservation des logs d'audit

- `HistoriqueTab` lit `audit_logs` avec `.limit(100)` sans pagination ni archivage. **Décision nécessaire** : confirmer si les logs sont conservés indéfiniment ou purgés, et si une pagination est nécessaire.

---

## 🧪 Couverture de test

- `src/hooks/useSurveillance.test.ts` : couvre le hook `useSurveillance` uniquement (filtres, pagination, exclusion `deleted_at`).
- Aucun test sur `AlertesTab`, `EvenementsTab`, `HistoriqueTab` (règles d'alerte, soft-delete, CRUD, historique).

---

## 🔗 Liens avec autres modules

| Module cible | Lien depuis la surveillance | Statut |
|-------------|---------------------------|--------|
| Stocks (inventory) | Règle alerte stock faible lit `inventory_items` | ✅ présent |
| Finance (dépenses) | Règle alerte justificatif manquant lit `expenses` | ✅ présent |
| Projets/Chantiers | Règle alerte projet en retard lit `projects` | ✅ présent |
| Finance (financements) | Règle alerte financement en transit lit `fundings` | ✅ présent |
| Ventes (clients) | Règle alerte client inactif lit `customers` | ⚠️ boîteuse |
| Élevage | `surveillance_events` liée à `animal_lots`, `animals`, `lots` | ✅ présent (relations) |
| Exploitation | `surveillance_events` liée à `plots`, `campagnes`, `projects` | ✅ présent (relations) |
| Dashboard | KPIs alertes (non dans DASHBOARD_SOURCES) | ⚠️ `alerts` n'est pas dans `DASHBOARD_SOURCES` (DataContext.tsx:25-35) |

---

## 🎯 Plan de correction (3 vagues)

### Vague 1 — Correction critique (immédiat)

1. Corriger ou désactiver la règle 5 « Client inactif » (impliquer la vérification réelle d'absence de ventes >60 jours) — corrige S1.

### Vague 2 — Robustesse et cohérence (important)

2. Ajouter un module `surveillance` dans `MODULE_SOURCES` avec `surveillance_events` (et éventuellement `alerts`, `audit_logs`) — corrige I1.
3. Ajouter `loadModule('surveillance')` dans `EvenementsTab` (après enregistrement du module) — corrige I2.
4. Retirer l'appel inutile `useAuth()` dans `HistoriqueTab` — corrige I3.
5. Ajouter une validation Zod sur le formulaire de création/édition d'événement — corrige I4.
6. Factoriser `TYPE_LABELS`/`TYPE_COLORS`/`STATUS_LABELS`/`STATUS_COLORS` en utilisant `getTypeLabel`/`getTypeColor`/`getStatusLabel`/`getStatusColor` du hook — corrige I5.

### Vague 3 — UX et qualité (amélioration)

7. Ajouter des tests unitaires sur AlertesTab (5 règles), EvenementsTab (CRUD + soft-delete), HistoriqueTab — corrige A1.
8. Corriger le lien `target="_blank"` dans `HistoriqueTab` pour éviter les routes inexistantes — corrige A2.
9. Ajouter un verrou d'exécution sur `checkAlerts` (au-delà du bouton désactivé) — corrige A3.

---

## 📝 Annexe — Preuves techniques

Extrait règle 5 client inactif (`AlertesTab.tsx:207-210`) :
```ts
// On vérifie s'il n'y a pas eu de sales récentes pour ce client
// Cette règle est simplifiée : on crée l'alerte si le client existe
// (la détection de "sans sales" nécessiterait une jointure avec transactions/sales)
```

Extrait absence du module surveillance dans MODULE_SOURCES (`DataContext.tsx:52-60`) :
```ts
const MODULE_SOURCES: Record<string, string[]> = {
  dashboard: [...],
  exploitation: [...],
  finance: [...],
  elevage: [...],
  ventes: ['customers'],
  stock: ['inventoryItems', 'inventoryMovements'],
  projets: ['projects', 'projectSteps', 'expenses'],
  // pas de 'surveillance'
};
```

Extrait soft-delete (`useSurveillance.ts:148-153`) :
```ts
const softDelete = async (id: string): Promise<boolean> => {
  const result = await executeAction(async () => {
    const { error } = await supabase
      .from('surveillance_events')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    // ...
  });
};
```

Extrait exclusion des supprimés (`useSurveillance.ts:28`) :
```ts
f.push({ column: 'deleted_at', operation: 'is', value: null });
```

---

**Fichiers modifiés : aucun** (audit en lecture seule, aucun commit).

**Prochaine étape : ** écrire l'audit du module Projets/Chantiers (docs/audits/2026-11-14-audit-module-projets.md).
