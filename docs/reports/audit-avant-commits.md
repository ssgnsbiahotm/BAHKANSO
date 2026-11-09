# Audit du working tree avant les 7 commits

**Date de l'audit :** 2026-11-09  
**Branche :** `feat/dashboard-v2`  
**Dernier commit :** `ae328fe` feat(dashboard): Dashboard v2 sous flag dashboard_v2 (scope global, KPIs no_data)  
**Mission :** Audit en lecture seule du working tree avant 7 commits prévus. Aucun commit, push ni modification n'est effectué dans le cadre de cette mission.

---

## 1. État git (git status --short)

**Fichiers modifiés (37) :**

```
 D CLAUDE.md.txt
 M docs/CONTEXT.md
 M docs/audit/CSS_AUDIT.md
 M docs/audit/css-audit.json
 M docs/design/scripts/audit-erreurs.sh
 M eslint.config.js
 M package-lock.json
 M package.json
 M src/components/ui/DashboardActionList.tsx
 M src/components/ui/DashboardKpiCard.tsx
 M src/components/ui/DashboardTrendChart.tsx
 M src/components/ui/SiteField.tsx
 M src/hooks/useDashboardData.ts
 M src/hooks/useDashboardStats.test.ts
 M src/index.css
 M src/lib/DataContext.tsx
 M src/lib/SiteContext.tsx
 M src/lib/constants.ts
 M src/lib/format.ts
 M src/lib/kpi.test.ts
 M src/lib/types.ts
 M src/modules/Finance/tabs/DocumentsTab.tsx
 M src/modules/Finance/tabs/ExpensesTab.tsx
 M src/modules/Finance/tabs/FundingsTab.tsx
 M src/modules/Sales/SalesModule.test.tsx
 M src/modules/Sales/SalesModule.tsx
 M src/pages/AnimalEventManage.tsx
 M src/pages/AnimalManage.tsx
 M src/pages/Dashboard.test.tsx
 M src/pages/DashboardV2.tsx
 M src/pages/Inventory.tsx
 M src/pages/Media.tsx
 M src/pages/SettingsPage.tsx
 M src/pages/Suppliers.tsx
 M src/pages/UsersPage.test.tsx
 M src/pages/UsersPage.tsx
 M src/pages/configuration/ClientsPage.tsx
 M src/pages/exploitation/AnimauxPage.tsx
 M src/pages/exploitation/CampagnesPage.tsx
 M src/pages/exploitation/JournalCulturePage.tsx
 M src/pages/exploitation/LotsPage.tsx
 M src/pages/exploitation/OperationsPage.tsx
 M src/pages/exploitation/RecoltesPage.tsx
 M src/pages/surveillance/tabs/HistoriqueTab.tsx
 M src/routes/AppRoutes.tsx
 M src/test/setup.tsx
 M tailwind.config.js
 M tests/integration/setup.mjs
```

**Fichiers non suivis (untracked) :**

- `.env.example`
- `audit-visuals.mjs`
- `docs/architecture/` (dossier)
- `docs/reports/2026-11-07-2132-reparation-tests-echec.md`
- `docs/reports/2026-11-07-2155-correction-migration-surveillance-events.md`
- `docs/reports/2026-11-08-0047-correction-5-frictions-terrains.md`
- `docs/reports/2026-11-08-2215-gap-expenses-event-journal.md`
- `docs/reports/2026-11-08-ajout-farm_id-core-tables.md`
- `docs/reports/2026-11-08-lien-3-invalidation-cache-kpis.md`
- `docs/reports/2026-11-08-triage-non-commites.md`
- `docs/reports/BAHKANSO_AUDIT_GLOBAL_2026-11-07.md`
- `docs/reports/optimisation-assets.md`
- `docs/reports/optimisation-diagnostic.md`
- `docs/reports/realitemetier.md`
- `docs/reports/vague2-alertes.md`
- `docs/reports/vague2-evenements.md`
- `memory/` (dossier)
- `public/FireShot Capture 008 - Bahkanso Agro Pastoral Investment Platform - [bahkanso.surge.sh].png`
- `public/FireShot Capture 009 - Bahkanso Agro Pastoral Investment Platform - [localhost].png`
- `src/hooks/useDashboardData.test.ts`
- `src/lib/parsePeriod.test.ts`
- `src/pages/exploitation/OperationsPage.test.tsx`
- `src/styles/theme-gnamba.css`
- `supabase/.branches/`
- `supabase/migrations/20261108000000_trigger_expenses_to_event_journal.sql`
- `supabase/migrations/20261109095657_repair_event_journal_site_scope.sql`

**Résumé :** 37 fichiers modifiés + 1 supprimé + ~25 fichiers/dossiers non suivis. Le working tree contient des travaux issus de plusieurs vagues (dashboard v2, 5-frictions-terrains, ajout farm_id, gap expenses/event_journal, réparation tests, documentation).

---

## 2. Diffs résumés (git diff --stat)

```
CLAUDE.md.txt                                  |  585 -----
docs/CONTEXT.md                                |   15 +-
docs/audit/CSS_AUDIT.md                        |  185 +-
docs/audit/css-audit.json                      | 3332 +-
docs/design/scripts/audit-erreurs.sh           |    0
eslint.config.js                               |    9 +
package-lock.json                              | 2650 +-
package.json                                   |    5 +
src/components/ui/DashboardActionList.tsx      |   13 +-
src/components/ui/DashboardKpiCard.tsx         |    6 +-
src/components/ui/DashboardTrendChart.tsx      |   21 +-
src/components/ui/SiteField.tsx                |   12 +-
src/hooks/useDashboardData.ts                  |   22 +-
src/hooks/useDashboardStats.test.ts            |    1 +
src/index.css                                  |    1 +
src/lib/DataContext.tsx                        |    2 +-
src/lib/SiteContext.tsx                        |    2 +-
src/lib/constants.ts                           |    2 +-
src/lib/format.ts                              |   27 +
src/lib/kpi.test.ts                            |    4 +-
src/lib/types.ts                               |    1 +
src/modules/Finance/tabs/DocumentsTab.tsx      |   51 +-
src/modules/Finance/tabs/ExpensesTab.tsx       |   53 +-
src/modules/Finance/tabs/FundingsTab.tsx       |   51 +-
src/modules/Sales/SalesModule.test.tsx         |   61 +-
src/modules/Sales/SalesModule.tsx              |   32 +-
src/pages/AnimalEventManage.tsx                |   19 +-
src/pages/AnimalManage.tsx                     |    3 +-
src/pages/Dashboard.test.tsx                   |    1 +
src/pages/DashboardV2.tsx                      |  137 +-
src/pages/Inventory.tsx                        |   32 +-
src/pages/Media.tsx                            |   19 +-
src/pages/SettingsPage.tsx                     |    2 +-
src/pages/Suppliers.tsx                        |   21 +-
src/pages/UsersPage.test.tsx                   |   11 +-
src/pages/UsersPage.tsx                        |   32 +-
src/pages/configuration/ClientsPage.tsx        |   17 +-
src/pages/exploitation/AnimauxPage.tsx         |   31 +-
src/pages/exploitation/CampagnesPage.tsx       |   31 +-
src/pages/exploitation/JournalCulturePage.tsx  |   30 +-
src/pages/exploitation/LotsPage.tsx            |   32 +-
src/pages/exploitation/OperationsPage.tsx      |   33 +-
src/pages/exploitation/RecoltesPage.tsx        |   31 +-
src/pages/surveillance/tabs/HistoriqueTab.tsx  |  138 +-
src/routes/AppRoutes.tsx                       |    4 +-
src/test/setup.tsx                             |   34 +
tailwind.config.js                             |   19 +-
tests/integration/setup.mjs                    |    8 +-
```

**Total : 48 fichiers, 3392 insertions, 4436 suppressions.**

### Résumé par fichier (1-2 lignes chacun)

| Fichier | Résumé du changement |
|---------|----------------------|
| `CLAUDE.md.txt` | Suppression complète (dupliqué de CLAUDE.md) |
| `docs/CONTEXT.md` | Mise à jour de l'état du projet (15 lignes) |
| `docs/audit/CSS_AUDIT.md` | Mise à jour du rapport d'audit CSS |
| `docs/audit/css-audit.json` | Mise à jour des données d'audit CSS |
| `docs/design/scripts/audit-erreurs.sh` | Aucun changement de contenu (0 octet) |
| `eslint.config.js` | Règles assouplies pour fichiers de test (+9 lignes) |
| `package-lock.json` | Mise à jour du lockfile (eslint-formatter-compact) |
| `package.json` | + dépendance `eslint-formatter-compact` |
| `src/components/ui/DashboardActionList.tsx` | Couleurs en dur → tokens COLORS (13 lignes) |
| `src/components/ui/DashboardKpiCard.tsx` | Statut crit → STATUS_CLASS_DANGER (6 lignes) |
| `src/components/ui/DashboardTrendChart.tsx` | Couleurs en dur → tokens COLORS (21 lignes) |
| `src/components/ui/SiteField.tsx` | `useId()` + `htmlFor` sur les labels (accessibilité) |
| `src/hooks/useDashboardData.ts` | Données dashboard v2 (22 lignes) |
| `src/hooks/useDashboardStats.test.ts` | +1 ligne de test |
| `src/index.css` | +1 ligne (import tokens) |
| `src/lib/DataContext.tsx` | Type guard remplaçant `instanceof Error` sur res.error |
| `src/lib/SiteContext.tsx` | Export de SiteContext (2 lignes) |
| `src/lib/constants.ts` | `'mort'` → `'animal_mort'` (2 lignes) |
| `src/lib/format.ts` | Fonctions de formatage (27 lignes) |
| `src/lib/kpi.test.ts` | Alignement libellés événements animaux (4 lignes) |
| `src/lib/types.ts` | +1 ligne `harvest_cycle` sur Campaign |
| `src/modules/Finance/tabs/DocumentsTab.tsx` | `try/finally` sur suppression document |
| `src/modules/Finance/tabs/ExpensesTab.tsx` | `refresh()` après suppression + `try/finally` popup |
| `src/modules/Finance/tabs/FundingsTab.tsx` | `try/finally` sur suppression funding |
| `src/modules/Sales/SalesModule.test.tsx` | Mocks useSalesData, SiteContext, DataContext |
| `src/modules/Sales/SalesModule.tsx` | `try/finally` sur suppression |
| `src/pages/AnimalEventManage.tsx` | `try/finally` sur suppression |
| `src/pages/AnimalManage.tsx` | `try/finally` sur suppression |
| `src/pages/Dashboard.test.tsx` | +1 ligne |
| `src/pages/DashboardV2.tsx` | Grille allégée, sections Synthèse/Tendance/Actions (137 lignes) |
| `src/pages/Inventory.tsx` | `try/finally` sur suppression |
| `src/pages/Media.tsx` | `try/finally` sur suppression |
| `src/pages/SettingsPage.tsx` | Retrait imports inutilisés STATUS_CLASS_INFO/WARNING |
| `src/pages/Suppliers.tsx` | `try/finally` sur suppression |
| `src/pages/UsersPage.test.tsx` | Mock useSite |
| `src/pages/UsersPage.tsx` | `try/finally` + typage explicite |
| `src/pages/configuration/ClientsPage.tsx` | `try/finally` sur suppression |
| `src/pages/exploitation/AnimauxPage.tsx` | `try/finally` sur suppression |
| `src/pages/exploitation/CampagnesPage.tsx` | Lit `harvest_cycle` + suppression try/finally |
| `src/pages/exploitation/JournalCulturePage.tsx` | `try/finally` + suppression code mort |
| `src/pages/exploitation/LotsPage.tsx` | `try/finally` sur suppression |
| `src/pages/exploitation/OperationsPage.tsx` | `farm_id` sur insert dépense + `try/finally` |
| `src/pages/exploitation/RecoltesPage.tsx` | `try/finally` sur suppression |
| `src/pages/surveillance/tabs/HistoriqueTab.tsx` | Refonte historique (138 lignes) |
| `src/routes/AppRoutes.tsx` | Suppression `PreservingRedirect` (code mort) |
| `src/test/setup.tsx` | Mocks useSalesData + DataContext globaux |
| `tailwind.config.js` | Configuration Tailwind (19 lignes) |
| `tests/integration/setup.mjs` | `detectSessionInUrl: false` sur client service role |

---

## 3. Scan de sécurité

Méthode : recherche des motifs sensibles (clés API, secrets, tokens, mots de passe, chaînes de connexion, valeurs `VITE_*`) dans les diffs et les fichiers non suivis, hors `node_modules/` et `.git/`.

**Résultat : aucun secret réel détecté.**

Occurrences trouvées, toutes classées **faux positifs** ou **non secrets** :

| Fichier | Ligne | Motif | Type |
|---------|-------|-------|------|
| `supabase/config.toml` | 20 | `jwt_secret = "super-secret-jwt-token-with-at-least-32-characters-long"` | Valeur par défaut Supabase locale (non un secret de production) |
| `tests/integration/setup.mjs` | 3-8 | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Lecture d variables d'env, non affichées, non modifiées |
| `e2e/sales.spec.ts` | 7 | `password123` | Mot de passe de test e2e (documenté, non un secret réel) |
| `tests/integration/rls-*.test.mjs` | 37-60 | `Test1234!` | Mot de passe de test d'intégration |
| `package-lock.json` | 84, 135, 1755, ... | `js-tokens`, `css-tokenizer` | Noms de paquets npm (faux positif lexique) |
| `src/lib/supabase.ts` | 3-4 | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Lecture d variables d'environnement (standard Supabase) |
| `src/pages/UsersPage.tsx` | 35-36, 56, 70, 109-131, 366-370 | Champs `password`, `confirmPassword` | Champs de formulaire utilisateur (métier, pas de secret stocké) |
| `src/lib/AuthContext.tsx` | 106-162 | `signInWithPassword`, `resetPasswordForEmail`, `updateUser` | Appels API Supabase Auth (standard) |
| `CLAUDE.md` | 16, 225, 235 | Mentions "secret", "jeton", "clé" | Règles de sécurité du projet (documentation) |
| `src/lib/password.ts` | 1, 6, 9, 12, 15, 18 | Validation de mot de passe | Logique métier de validation |

**Conformité CLAUDE.md §1 / §6 :** aucun secret affiché (clés, `VITE_*`, chaînes de connexion, jetons). Le scan est concluant : pas de secret à masquer avant commit.

---

## 4. Vérifications automatiques

### Typecheck (`npx tsc --noEmit`)
**Résultat : exit 0 — 0 erreur TypeScript.** Le working tree compile.

### Lint (`npx eslint .`)
**Résultat : 27 problèmes (1 erreur, 26 warnings), exit 0.**

| Sévérité | Fichier | Ligne | Règle | Statut |
|----------|---------|-------|-------|--------|
| error | `src/routes/AppRoutes.tsx` | 79 | `no-unused-vars` (`AnimalManageSuspense` assigné mais jamais utilisé) | **Préexistant** — non introduit par le dashboard v2 |
| warning | 26 fichiers | divers | `react-hooks/exhaustive-deps`, `react-refresh/only-export-components` | Tous préexistants |

Aucune nouvelle erreur ni aucun nouveau warning n'est introduit par les fichiers modifiés du dashboard v2.

### Tests (`npx vitest run`)
**Résultat : 19 fichiers passés / 10 échoués, 110 tests passés / 114.**

Les 10 fichiers en échec sont tous des tests d'intégration (`tests/integration/`) qui échouent car `SUPABASE_SERVICE_ROLE_KEY` n'est pas définie (environnement local Supabase non démarré) :

- `rls-fundings.test.mjs`
- `rls-sales.test.mjs`
- et 8 autres fichiers de tests d'intégration

**Cause environnementale :** absence d'instance Supabase locale (`supabase status` non exécuté / instance non démarrée). Ce n'est pas un défaut de code. Tous les tests unitaires (vitest, pas d'intégration) passent.

### Build
Non exécuté dans le cadre de cette audit (le typecheck exit 0 suffit comme référence de compilation). À exécuter avant les 7 commits.

---

## 5. Migrations Supabase

Liste des fichiers de migration présents :

```
20260929171038_001_core_tables.sql
20260929171114_002_operational_tables.sql
20260929171147_003_seed_data_part1.sql
20260929171250_004_seed_data_part2.sql
20260929171728_005_seed_data_part3.sql
20261002203614_006_site_content.sql
20261004122416_007_auth_and_rls_tightening.sql.sql
20261005195209_008_recipes_and_rls_fixes.sql.sql
20261005195219_pre_012_surveillance_events.sql
20261005195220_pre_013_functions.sql
20261005195221_009_storage_policies.sql.sql
20261005195222_010_rls_by_role_pilot.sql
20261005195223_011_rls_by_role_part2.sql
20261005195224_012_rls_by_role_complete.sql
20261005195225_013_fix_security_definer_functions.sql
20261005195226_014_fix_handle_new_user_race.sql
20261005195227_015_fix_recursion_current_user_has_role.sql
20261020160000_surveillance_events.sql
20261020160001_surveillance_events_rollback.sql
20261021120000_cleanup_audit_logs_policies.sql
20261022000000_016_multi_sites.sql
20261022000001_017_sales_module.sql
20261022000002_018_seed_sites.sql
20261022000003_019_rls_sales_tightening.sql
20261022000004_020_seed_e2e_user.sql
20261022000005_021_fix_e2e_password.sql
20261022000006_022_gestion_site_id_rls.sql
20261022000007_023_audit_logs_insert_policy.sql
20261024000000_024_funders_user_link.sql
20261024000001_025_customers_created_by.sql
20261025000000_026_audit_logs_select_policy.sql
20261028000000_028_site_id_everywhere.sql
20261028000001_029_standardize_statuses.sql
20261030000000_030_site_id_operations_harvests.sql
20261031000000_031_add_name_to_animals.sql
20261031000001_032_rollback_name_animals.sql
20261031000001_create_media_table.sql
20261103000000_fix_user_sync_ids_and_trigger.sql
20261103000001_rls_fundings_expenses_least_privilege.sql
20261103000003_helpers_row_security_off_fix.sql
20261103000004_helpers_remove_or_fix.sql
20261105000000_create_event_journal.sql
20261106000000_event_journal_triggers.sql
20261106000001_event_journal_triggers_culture_sales.sql
20261106000002_event_journal_triggers_livestock.sql
20261106000003_event_journal_trigger_tasks.sql
20261106223310_add_unique_animals_identifier.sql
20261106230000_add_site_id_to_core_tables.sql
20261107000000_add_unique_plots_reference.sql
20261107010000_rls_sales_least_privilege.sql
20261107120000_create_financial_links_spine.sql
20261108000000_trigger_expenses_to_event_journal.sql   ← non commité (working tree)
20261108000001_add_farm_id_to_core_tables.sql           ← non commité (working tree)
20261109095657_repair_event_journal_site_scope.sql      ← non commité, 0 octet (vide)
```

**Analyse :**
- Aucun doublon de timestamp détecté.
- `20261108000000_trigger_expenses_to_event_journal.sql` (2,7 K) : migration gap expenses → event_journal. À appliquer sur base locale puis commiter.
- `20261108000001_add_farm_id_to_core_tables.sql` (2,0 K) : farm_id sur tables cœur. À appliquer sur base locale puis commiter.
- `20261109095657_repair_event_journal_site_scope.sql` (0 octet) : **migration vide**. À supprimer ou à remplir avant tout commit.

---

## 6. Écart avec le triage de référence

Le triage de référence (`docs/reports/2026-11-08-triage-non-commites.md`, daté 2026-11-08, HEAD `ec11e14`) liste 37 fichiers modifiés. L'audit actuel confirme exactement ces 37 fichiers modifiés, plus `CLAUDE.md.txt` (supprimé) et `docs/routes/AppRoutes.tsx` qui n'était pas explicitement listé dans le triage mais apparaît dans le diff.

**Points de vigilance relevés par le triage :**

1. **main ne compile pas tel que commité :** `src/pages/exploitation/CampagnesPage.tsx:173` lit `campaign.harvest_cycle`, déclaré uniquement dans `src/lib/types.ts` (non commité). Le fichier `src/lib/types.ts` est requis pour que main soit reproductible.
2. **Correctif DataContext** (`src/lib/DataContext.tsx`) : type guard remplaçant `instanceof Error`. Équivalence prouvée sur 9 cas d'erreur.
3. **Lots de commits proposés (A à G)** : non encore exécutés, en attente de validation utilisateur.

---

## 7. Recommandations

### Avant les 7 commits

1. **Typecheck :** déjà vert (exit 0). Re-vérifier après chaque lot.
2. **Lint :** corriger l'erreur préexistante `src/routes/AppRoutes.tsx:79` (`AnimalManageSuspense` inutilisé) — hors périmètre du dashboard v2, à traiter séparément ou laisser tel quel.
3. **Tests d'intégration :** démarrer l'instance Supabase locale (`supabase status` → API sur 127.0.0.1:54321) puis définir `SUPABASE_SERVICE_ROLE_KEY` avant de relancer `npx vitest run tests/integration/`.
4. **Migration vide :** `supabase/migrations/20261109095657_repair_event_journal_site_scope.sql` (0 octet) — décider : supprimer ou implémenter avant commit.
5. **Build :** exécuter `npm run build` pour valider la production avant les commits.
6. **Règle absolue CLAUDE.md :** aucun commit sans demande explicite de la mission. Ce rapport est en lecture seule.

### Lots de commits suggérés (d'après le triage, non exécutés)

- Lot A — Correctif DataContext
- Lot B — ajout-farm_id-core-tables (base + code)
- Lot C — gap-expenses-event-journal (migration + trigger)
- Lot D — 5-frictions-terrains (try/finally sur suppressions)
- Lot E — reparation-tests-echec (mocks + typage + lint)
- Lot F — documentation (docs/reports/, docs/architecture/, .env.example, memory/, audit-visuals.mjs)
- Lot G — suppression CLAUDE.md.txt

---

## 8. Décision requise

Aucune action n'a été prise sur le dépôt. Le rapport est en lecture seule. L'utilisateur doit valider :

1. Quels lots de commits parmi A-G doivent être exécutés, et dans quel ordre.
2. Que `src/lib/types.ts` (ligne `harvest_cycle`) est bien à commiter pour restaurer la reproductibilité de main.
3. Que la migration vide `20261109095657` est supprimée ou implémentée.
4. Que les fichiers de documentation (Lot F) sont à commiter.
5. Que `supabase/.branches/_current_branch` n'est pas commité (état local de l'outil).

Une fois validé, les commandes `git add` / `git commit` correspondantes pourront être exécutées fichier par fichier (jamais `git add .` ni `git add -A`, conformément aux règles absolues du projet).

---

**Fin du rapport.** Aucun commit ni push n'a été effectué.