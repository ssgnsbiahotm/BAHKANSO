# Audit global — Patterns systémiques

## Résumé exécutif (10 lignes)

4 patterns systémiques identifiés sur 9 modules audités. 3 modules sur 9 manquent de `site_id` dans leur formulaire, 4 entités utilisent un identifiant saisi manuellement (risque de doublons), 11 tables n'ont pas de trigger `event_journal`, et 7 écrans de liste n'ont aucun filtre. Effort batch estimé ~6h contre ~40h en traitant module par module. Ordre d'attaque recommandé : A → B → C → D.

---

## Pattern A — Site_id manquant

### Modules concernés

| Module | Form site_id ? | Preuve |
|---|---|---|
| Exploitation (Parcelles) | ✅ | `ParcellesPage.tsx:23,36,101` |
| Exploitation (Campagnes) | ❌ | pas de `site_id` dans le form (affiche seulement, `CampagnesPage.tsx:221,292`) |
| Exploitation (JournalCulture) | ❌ | `JournalCulturePage.tsx` sans `site_id` |
| Exploitation (Recoltes) | ❌ | `RecoltesPage.tsx` sans `site_id` |
| Exploitation (Operations) | ❌ | `OperationsPage.tsx` sans `site_id` |
| Finance (Expenses) | ⚠️ | `site_id` nullable en zod, pas de select form (`ExpensesTab.tsx:32`) |
| Finance (Fundings) | ⚠️ | `site_id` en DEFAULT, pas de select (`FundingsTab.tsx:31,46,243`) |
| Finance (Documents) | ⚠️ | `site_id` nullable en zod, pas de select (`DocumentsTab.tsx:28,39`) |
| Sales (SaleFormModal) | ✅ | `site_id` depuis `appUser.site_id` (`SaleFormModal.tsx:48,93`) |
| Configuration (Clients) | ⚠️ | `site_id: ''` par défaut, pas de select (`ClientsPage.tsx:30,76,87`) |
| Configuration (Bailleurs) | ❌ | `BailleursPage.tsx` sans `site_id` |
| Configuration (Sites) | N/A | `SitesPage` gère les sites eux-mêmes |
| Inventory | ❌ | `Inventory.tsx` sans `site_id` |
| Projects | ✅ | `projects` et `project_steps` ont `site_id` en DB (migration) |
| Suppliers | ❌ | `Suppliers.tsx` sans `site_id` (table `suppliers` sans `site_id` en DB) |
| Media | ✅ | `media` a `site_id` en DB |
| Surveillance (Evenements) | ❌ | `EvenementsTab.tsx` sans `site_id` |

### Preuves
- `ParcellesPage.tsx:23` — `site_id: z.string().min(1, 'Le site est obligatoire')` (modèle de référence)
- `JournalCulturePage.tsx` — aucune occurrence de `site_id`
- `Inventory.tsx` — aucune occurrence de `site_id`

### Fix batch proposé
Ajouter un `FormSelect` "Site" (source `sites` de `useData()` ou `currentSiteId` de `useSite()`) + `site_id` requis dans le zod + payload d'insert. Patrimoine réutilisable : le bloc de `ParcellesPage.tsx:23-36,101`.

---

## Pattern B — Identifiant manuel

### Entités concernées

| Entité | Module | Champ | Preuve | Risque doublon |
|---|---|---|---|---|
| Parcelle | Exploitation | `reference` (requis) | `ParcellesPage.tsx:16,433` | Oui (saisie libre) |
| Dépense | Finance | `reference` (requis) | `ExpensesTab.tsx:21` | Oui |
| Financement | Finance | `reference` (requis) | `FundingsTab.tsx:20` | Oui |
| Document | Finance | `reference` (requis) | `DocumentsTab.tsx:21` | Oui |

### Preuves
- `ParcellesPage.tsx:16` — `reference: z.string().min(1, 'La référence est obligatoire')`
- `ExpensesTab.tsx:21` — `reference: z.string().min(1, 'Référence obligatoire')`
- `FundingsTab.tsx:20` — `reference: z.string().min(1, 'Référence obligatoire')`
- `DocumentsTab.tsx:21` — `reference: z.string().min(1, 'Référence obligatoire')`

### Fix batch proposé
Appliquer le pattern `src/lib/animal-ids.ts` (préfixe + numéro séquentiel) à chaque entité, champ `readOnly`, pré-génération à l'ouverture du formulaire. Préfixes suggérés : `PAR`, `EXP`, `FND`, `DOC`.

---

## Pattern C — Trigger event_journal manquant

### Tables sources et triggers existants

| Table | Trigger journal ? | Preuve |
|---|---|---|
| animal_events | ✅ | `TG_TABLE_NAME = 'animal_events'` (migration 20261106000002) |
| expenses | ✅ | `TG_TABLE_NAME = 'expenses'` (migration 20261106000000) |
| harvests | ✅ | `TG_TABLE_NAME = 'harvests'` (migration 20261106000001) |
| project_steps | ✅ | `TG_TABLE_NAME = 'project_steps'` (migration 20261106000003) |
| sales | ✅ | `TG_TABLE_NAME = 'sales'` (migration 20261106000001) |
| plots | ❌ | aucune occurrence `log_event` pour `plots` |
| campaigns | ❌ | aucune |
| crop_operations | ❌ | aucune |
| inventory_items | ❌ | aucune |
| inventory_movements | ❌ | aucune |
| projects | ❌ | aucune |
| suppliers | ❌ | aucune |
| media | ❌ | aucune |
| clients | ❌ | aucune |
| bailleurs | ❌ | aucune |
| sites | ❌ | aucune |
| funders | ❌ | aucune |
| fundings | ❌ | aucune |
| documents | ❌ | aucune |

### Preuves
- `grep` sur `supabase/migrations/202611060000*.sql` : seules 5 tables ont un trigger `log_event` (`animal_events`, `expenses`, `harvests`, `project_steps`, `sales`)

### Fix batch proposé
Créer une migration par table manquante avec le même pattern `log_event()` SECURITY DEFINER + `row_security = off`. Priorité : `plots`, `campaigns`, `inventory_items`, `projects`.

---

## Pattern D — Filtres incomplets

### Écrans de liste sans filtre

| Écran | Module | Filtres ? | Preuve |
|---|---|---|---|
| ParcellesPage | Exploitation | ❌ | aucune occurrence `FILTERS`/`filterType` |
| CampagnesPage | Exploitation | ❌ | aucune |
| RecoltesPage | Exploitation | ❌ | aucune |
| OperationsPage | Exploitation | ❌ | aucune |
| Inventory | Inventory | ❌ | aucune |
| Suppliers | Suppliers | ❌ | aucune |
| Media | Media | ❌ | aucune |
| BailleursPage | Configuration | ❌ | aucune |
| ClientsPage | Configuration | ❌ | aucune |
| EvenementsTab | Surveillance | ✅ partiel | `filterType` + `filterStatus` (`EvenementsTab.tsx:95-104`) |
| Projects | Projects | ✅ partiel | `filter` état simple (`Projects.tsx:53,281`) |
| AnimalEventManage | Élevage | ✅ complet | `TYPE_FILTERS` (déjà fixé) |

### Fix batch proposé
Ajouter une barre de filtres type `TYPE_FILTERS` (déjà utilisée dans `AnimalEventManage.tsx`) sur chaque écran de liste, filtrant sur les colonnes métier pertinentes.

---

## Points module-spécifiques (hors batch)

### Exploitation
- `JournalCulturePage.tsx`, `RecoltesPage.tsx`, `OperationsPage.tsx` : pas de `site_id` ni de filtre, pas de trigger journal sur leurs tables sources.
- `CampagnesPage.tsx` : affiche le site en lecture seule (`:221,292`) mais ne le capture pas à la création.

### Finance
- `ExpensesTab.tsx`, `FundingsTab.tsx`, `DocumentsTab.tsx` : `site_id` présent en schéma/DEFAULT mais pas de champ de sélection dans l'UI (incohérent avec le modèle DB).

### Autres modules
- `Suppliers.tsx` : table `suppliers` sans `site_id` en DB, pas de filtre.
- `BailleursPage.tsx` : pas de `site_id`, pas de filtre.

---

## Plan d'attaque recommandé

### Batch 1 — Site_id (≈2h)
Modules : Exploitation (4 écrans), Finance (3 tabs), Configuration (Clients, Bailleurs), Inventory, Suppliers, Surveillance.

### Batch 2 — Identifiant auto (≈2h)
Entités : Parcelle, Dépense, Financement, Document. Réutiliser `src/lib/animal-ids.ts`.

### Batch 3 — Triggers journal (≈1h)
Tables : plots, campaigns, crop_operations, inventory_items, inventory_movements, projects, suppliers, media, clients, bailleurs, sites, funders, fundings, documents.

### Batch 4 — Filtres (≈1h)
Écrans : Parcelles, Campagnes, Recoltes, Operations, Inventory, Suppliers, Media, Bailleurs, Clients.

### Total batch : ≈6h (vs ≈40h module-par-module)

---

## Annexe — Fichiers scannés

Migrations : `supabase/migrations/20260929171038_001_core_tables.sql`, `20260929171114_002_operational_tables.sql`, `20261022000001_017_sales_module.sql`, `20261031000001_create_media_table.sql`, `202611060000{0,1,2,3}_*.sql`

Types : `src/lib/types.ts`

Modules audités : Exploitation, Finance, Sales, Surveillance, Configuration, Inventory, Projects, Suppliers, Media.
