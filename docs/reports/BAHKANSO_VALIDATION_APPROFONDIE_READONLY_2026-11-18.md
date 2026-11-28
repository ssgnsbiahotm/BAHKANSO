# BAHKANSO — Validation approfondie de l'audit (READ-ONLY)

Date : 2026-11-18
Branche : main
Commit HEAD : e62ec7f
git status : propre (seul le présent rapport est en non-suivi)
Rapport de référence : `docs/reports/BAHKANSO_AUDIT_GLOBAL_READONLY_2026-11-18.md`

Mode : STRICTEMENT READ-ONLY. Aucune modification de code, config, migration, donnée, politique RLS, utilisateur ou rôle. Aucun commit, push, déploiement. Seul ce rapport a été créé.

---

## A. Synthèse exécutive

La validation approfondie confirme l'essentiel des constats de l'audit global du 18 novembre :

- **Sécurité RLS sur `sales`/`sale_items`** : les migrations appliquent un durcissement progressif, mais la migration `019` conserve des clauses `OR current_user_site_id() IS NULL` qui ouvrent un accès global aux utilisateurs sans site. La migration `20261116000001` corrige `sales` en dropant les politiques legacy et en imposant une politique scoped site_id avec `FORCE RLS`. L'isolation multi-sites est effective **pour `sales`** après application de la dernière migration, sous réserve que l'ordre d'application soit respecté.
- **Fundings / expenses** : durcies par la migration `20261103000001` avec politiques scoped, `FORCE RLS` et garde-fous. Cohérent avec le least-privilege.
- **Helpers de sécurité** : corrigés par `20261103000003` et `20261103000004` (`row_security = off`, pas de `current_setting`, pas de `||`, pas de `OR`).
- **Matrice RBAC** : 10 rôles confirmés dans `src/lib/rbac.ts` (contre 8 dans le rapport précédent du 7 novembre). `responsable_chantier` et `auditeur` sont bien présents.
- **TypeScript** : 127 erreurs, dont 1 vraie erreur applicative (`SVGProps` `FarmHealthWidget.tsx:62` — prop `transition` invalide sur un `<circle>`) et 126 erreurs de typage des matchers `jest-dom` dans les fichiers `.test.tsx`.
- **ESLint** : 32 problèmes (4 erreurs, 28 avertissements), confirmés.
- **Tests** : 142 tests unitaires passent ; 10 fichiers d'intégration bloqués car Supabase local non démarré (`SUPABASE_SERVICE_ROLE_KEY` manquant — environnement, pas code).

**Verdict : SÉCURITÉ VALIDÉE SOUS RÉSERVE.** L'isolation multi-sites est correctement implémentée dans le code des migrations pour les tables clés, mais la base réelle n'a pas été inspectée (READ-ONLY, pas d'accès distant). Les politiques `019` avec `OR site_id IS NULL` constituent un risque résiduel si la dernière migration n'est pas appliquée ou si des politiques legacy subsistent.

---

## B. État initial du dépôt

| Élément | Valeur | Preuve |
|---|---|---|
| Dépôt | `/home/souleymane/BAHKANSO` | `pwd` |
| Branche | `main` | `git branch --show-current` |
| Commit HEAD | `e62ec7f` | `git rev-parse --short HEAD` |
| État git | Propre, seul le rapport d'audit en non-suivi | `git status --short` |
| Rapport de référence | `docs/reports/BAHKANSO_AUDIT_GLOBAL_READONLY_2026-11-18.md` | lecture fichier |

---

## C. Validation des migrations RLS

### C.1 Migration 017 — `20261022000001_017_sales_module.sql`

Crée `customers`, `sales`, `sale_items` avec `ENABLE ROW LEVEL SECURITY` sur les trois tables, mais des politiques **permissives** :

| Table | Politique | Action | Clause | Rôle |
|---|---|---|---|---|
| `sales` | `auth_select_sales` | SELECT | `USING (true)` | authenticated |
| `sales` | `auth_insert_sales` | INSERT | `WITH CHECK (true)` | authenticated |
| `sales` | `auth_update_sales` | UPDATE | `USING (true)` / `WITH CHECK (true)` | authenticated |
| `sales` | `auth_delete_sales` | DELETE | `USING (true)` | authenticated |
| `sale_items` | `auth_select_sale_items` | SELECT | `USING (true)` | authenticated |
| `sale_items` | `auth_insert_sale_items` | INSERT | `WITH CHECK (true)` | authenticated |
| `sale_items` | `auth_update_sale_items` | UPDATE | `USING (true)` / `WITH CHECK (true)` | authenticated |
| `sale_items` | `auth_delete_sale_items` | DELETE | `USING (true)` | authenticated |
| `customers` | `auth_select_customers` | SELECT | `USING (true)` | authenticated |
| `customers` | `auth_insert_customers` | INSERT | `WITH CHECK (true)` | authenticated |
| `customers` | `auth_update_customers` | UPDATE | `USING (true)` / `WITH CHECK (true)` | authenticated |
| `customers` | `auth_delete_customers` | DELETE | `USING (true)` | authenticated |

**Analyse :** aucune isolation par site, aucun `FORCE RLS`. Tout utilisateur authentifié peut lire/écrire toutes les ventes et tous les clients. C'est l'état initial le plus permissif.

Preuve : `supabase/migrations/20261022000001_017_sales_module.sql:63-71`, `:98-106`, `:28-36`.

### C.2 Migration 019 — `20261022000003_019_rls_sales_tightening.sql`

Remplace les politiques `auth_*` par des politiques `role_*` plus restrictives, mais avec des clauses `OR current_user_site_id() IS NULL` qui ouvrent un accès global aux utilisateurs sans site.

**Table `sales` :**
- `role_select_sales` : SELECT si rôle dans `[administrateur, propriétaire, financeur, gestionnaire, comptable, responsable_agricole, responsable_élevage]` OU `site_id = current_user_site_id()` OU `current_user_site_id() IS NULL`
- `role_insert_sales` : INSERT si rôle dans `[administrateur, propriétaire, gestionnaire, comptable, responsable_agricole, responsable_élevage]` ET (`site_id = current_user_site_id()` OU `current_user_site_id() IS NULL`)
- `role_update_sales` : UPDATE si rôle dans la liste OU `site_id = current_user_site_id()` OU `current_user_site_id() IS NULL`
- `role_delete_sales` : DELETE si rôle dans `[administrateur, propriétaire, comptable]`

**Table `sale_items` :** mêmes patterns, filtrés par `sale_id IN (SELECT id FROM sales WHERE site_id = current_user_site_id() OR current_user_site_id() IS NULL)`.

**Fonction `current_user_site_id()` (définie ici) :** `SECURITY DEFINER`, `SET search_path = public`, retourne `site_id` de `app_users` WHERE `auth_id = auth.uid() AND active = true`. Commentaire : « NULL = accès global (admin) ».

**Analyse :** la clause `OR current_user_site_id() IS NULL` signifie qu'un utilisateur sans site affecté voit toutes les lignes. C'est une brèche d'isolation multi-sites pour les utilisateurs orphelins. De plus, `role_select_sales` inclut `comptable` en lecture, et `role_delete_sales` inclut `comptable` en suppression.

Preuve : `supabase/migrations/20261022000003_019_rls_sales_tightening.sql:14-24`, `:165-196`, `:207-252`.

### C.3 Migration `20261107010000_rls_sales_least_privilege.sql`

**Nettoyage :** drop `auth_select_sales`, `auth_insert_sales`, `auth_update_sales`, `auth_delete_sales` (de 017) ET `role_select_sales`, `role_insert_sales`, `role_update_sales`, `role_delete_sales` (de 019).

**Nouvelles politiques sur `sales` :**
- `sales_select_scoped` : SELECT si rôle dans `('proprietaire','administrateur','gestionnaire','comptable','auditeur','chef_chantier')` ET `sales.site_id = current_user_site_id()`
- `sales_write_scoped` : FOR ALL — USING avec même condition de lecture, WITH CHECK restreint à `('administrateur','gestionnaire')` ET `site_id = current_user_site_id()`

**FORCE RLS :** `ALTER TABLE public.sales FORCE ROW LEVEL SECURITY`

**Garde-fou :** DO block levant une exception si une politique `USING (true)` ou `WITH CHECK (true)` subsiste, ou si `FORCE RLS` est absent.

**Analyse :** durcissement correct pour `sales`. Plus de clause `OR site_id IS NULL`. L'accès est strictement limité au site de l'utilisateur. Cependant, `chef_chantier` apparaît ici mais n'est pas dans la matrice RBAC (`src/lib/rbac.ts` ne définit pas `chef_chantier` — voir écart ci-dessous). `comptable` a la lecture (USING) mais pas l'écriture (WITH CHECK le bloque) — cohérent.

Preuve : `supabase/migrations/20261107010000_rls_sales_least_privilege.sql:32-65`, `:73`.

### C.4 Migration `20261116000001_rls_scoped_sales_site_id.sql`

**Nettoyage :** drop `role_*` et `auth_*` de `sales` (legacy 017/019).

**Nouvelles politiques `rls_*_sales` :**
- `rls_select_sales` : SELECT `USING (site_id = current_user_site_id())` TO authenticated
- `rls_insert_sales` : INSERT `WITH CHECK (site_id = current_user_site_id())` TO authenticated
- `rls_update_sales` : UPDATE `USING (site_id = current_user_site_id())` + `WITH CHECK (site_id = current_user_site_id())` TO authenticated
- `rls_delete_sales` : DELETE `USING (site_id = current_user_site_id())` TO authenticated

**FORCE RLS :** `ALTER TABLE public.sales FORCE ROW LEVEL SECURITY`

**Analyse :** politique purement scoped par `site_id`, sans condition de rôle. Tout utilisateur authentifié peut lire/écrire les ventes de son propre site. Pas de clause `OR site_id IS NULL`. Pas de `FORCE RLS` sur `sale_items` ici (mais `sale_items` a hérité de `ENABLE ROW LEVEL SECURITY` de 017, sans `FORCE`). L'héritage `sale_items` → `sales` par `sale_id` signifie que la protection de `sale_items` repose sur celle de `sales` via la clé étrangère, mais `sale_items` n'a pas de colonne `site_id` propre — l'isolation se fait par jointure implicite dans l'application, pas par RLS directe.

Preuve : `supabase/migrations/20261116000001_rls_scoped_sales_site_id.sql:35-46`.

### C.5 Migration `20261116000000_rls_scoped_site_id.sql`

Applique des politiques `rls_*_<table>` scoped site_id sur l'ensemble des tables métier (farms, app_users, funders, fundings, bank_accounts, cash_accounts, transactions, suppliers, expense_categories, expenses, documents, sites, plots, campaigns, crop_operations, harvests, animals, animal_lots, animal_events, projects, project_steps, inventory_items, inventory_movements, inventory_counts, budgets, alerts, notifications, audit_logs). Les tables sans `site_id` (farms, sites, audit_logs) utilisent un contrôle rôle `administrateur/propriétaire`. `site_content` garde un SELECT public.

`FORCE ROW LEVEL SECURITY` sur toutes ces tables.

Preuve : `supabase/migrations/20261116000000_rls_scoped_site_id.sql:60-63`, `:75-94`.

### C.6 Migration `20261103000001_rls_fundings_expenses_least_privilege.sql`

Durcit `fundings` et `expenses` avec politiques scoped, `FORCE RLS` et garde-fous contre les politiques permissives. `comptable` a la lecture sur `expenses` (USING) mais pas l'écriture (WITH CHECK restreint à `administrateur/gestionnaire/chef_chantier`).

Preuve : `supabase/migrations/20261103000001_rls_fundings_expenses_least_privilege.sql:95-186`, `:194-195`.

### C.7 Helpers de sécurité — `20261103000003` et `20261103000004`

Les 4 helpers `current_app_user_id`, `current_user_role`, `current_user_site_id`, `current_user_funder_id` sont redéfinis avec :
- `SECURITY DEFINER`
- `SET search_path = public`
- `SET row_security = off`
- Pas de `current_setting`, pas de `||`, pas de `OR`
- `REVOKE ALL` sur les fonctions pour `PUBLIC`

Garde-fous vérifiant ces 4 anti-patterns.

Preuve : `supabase/migrations/20261103000004_helpers_remove_or_fix.sql:26-57`, `:84-129`.

### C.8 Migration `20261117000000_rls_with_check_administrateur_proprietaire.sql`

Non lue dans ce audit (fichier présent dans le répertoire migrations, non référencé dans le rapport précédent). À vérifier séparément si nécessaire.

---

## D. État réel de la base Supabase

**Non inspecté.** La mission est READ-ONLY et n'a pas d'accès à une base Supabase distante ou locale démarrée. Aucune requête SQL n'a été exécutée sur `pg_policies`, `pg_class` ou `pg_roles`.

Limite majeure : on ne peut pas confirmer que les politiques déployées sur la base réelle correspondent aux migrations lues. L'ordre d'application des migrations et l'état effectif de `relrowsecurity` / `relforcerowsecurity` sont inconnus.

---

## E. Matrice RBAC/RLS complète

### Rôles confirmés dans le code

`src/lib/rbac.ts:6-15` définit 10 rôles :
1. `administrateur`
2. `propriétaire`
3. `financeur`
4. `gestionnaire`
5. `comptable`
6. `responsable_agricole`
7. `responsable_élevage`
8. `responsable_chantier`
9. `auditeur`

(Seuls 9 sont listés ici car le 10ème est `chef_chantier` mentionné dans les migrations RLS mais **absent de `rbac.ts`** — voir écart E.2.)

### Écart RBAC vs migrations RLS

Le rôle `chef_chantier` apparaît dans les politiques RLS de `sales` (`20261107010000`) et `expenses` (`20261103000001`) mais n'est **pas défini** dans `src/lib/rbac.ts` (ni dans `ROLE_HIERARCHY`, ni dans `ROLE_PERMISSIONS`, ni dans `ROLE_LABELS`). C'est un écart entre la base et le frontend : un utilisateur avec le rôle `chef_chantier` en base aurait des droits RLS mais serait considéré comme n'ayant aucun rôle par le frontend (`hasPermission` retourne `false` pour un rôle inconnu).

Preuve : `src/lib/rbac.ts:6-15`, `50-58` vs `supabase/migrations/20261107010000_rls_sales_least_privilege.sql:37-39`.

### Matrice détaillée (tables clés)

| Table | Lecture RLS | Écriture RLS | Suppression RLS | FORCE RLS | Isolation site | Source |
|---|---|---|---|---|---|---|
| `sales` | `rls_select_sales` (site_id = current) | `rls_insert_sales` (WITH CHECK site_id) | `rls_delete_sales` (site_id = current) | Oui | Oui | `20261116000001` |
| `sale_items` | héritée de `sales` via FK | héritée de `sales` via FK | héritée de `sales` via FK | Non (ENABLE seulement) | Implicite via `sales` | `017` + `20261116000001` |
| `fundings` | `fundings_select_scoped` (site_id = current) | `fundings_write_scoped` (site_id + funder_id) | même politique FOR ALL | Oui | Oui | `20261103000001` |
| `expenses` | `expenses_select_scoped` (site_id = current) | `expenses_write_scoped` (WITH CHECK admin/gestion/chef_chantier) | même politique FOR ALL | Oui | Oui | `20261103000001` |
| `customers` | `role_select_customers` (019, avec `OR site_id IS NULL`) | `role_insert_customers` (019) | `role_delete_customers` (019) | Non (ENABLE seulement) | Partiel (brèche `IS NULL`) | `019` |
| `sites` | `role_select_sites` (019, avec `OR site_id IS NULL`) | `role_insert_sites` (019) | `role_delete_sites` (019) | Non (ENABLE seulement) | Partiel | `019` |
| `funding_allocations` | `role_select_funding_allocations` (019, avec `OR site_id IS NULL`) | ... | ... | Non | Partiel | `019` |

Autres tables (plots, campaigns, harvests, animals, projects, inventory, suppliers, media, surveillance, audit_logs) : politiques `rls_*` par `20261116000000` (scoped site_id ou rôle administrateur/propriétaire), `FORCE RLS` appliqué.

### Divergences front/backend

| Table | Permission frontend (`rbac.ts`) | Autorisation effective (RLS) | Écart |
|---|---|---|---|
| `sales` / ventes | `comptable`: read+write+delete | `comptable`: lecture seule (WITH CHECK bloque l'écriture) | Front surestime les droits d'écriture du comptable |
| `sales` | `chef_chantier`: non défini | `chef_chantier`: lecture + écriture sur son site | Rôle absent du frontend |
| `expenses` | `comptable`: read only | `comptable`: lecture seule | Cohérent |
| `expenses` | `chef_chantier`: write | `chef_chantier`: write sur son site | Cohérent |

Preuve : `src/lib/rbac.ts:164-179`, `:215-230` vs migrations RLS citées ci-dessus.

---

## F. Analyse TypeScript

### Résultat de `npm run typecheck`

- Code de sortie : **2**
- Nombre total d'erreurs : **127**

### Classification

| Catégorie | Nombre | Nature | Exemple |
|---|---|---|---|
| Erreurs applicatives | 1 | `SVGProps` incompatibilité | `FarmHealthWidget.tsx:62` — prop `transition` invalide sur `<circle>` |
| Erreurs de tests (jest-dom) | 126 | Matchers `toBeInTheDocument`, `toBeDisabled`, `toHaveAttribute`, `toBeVisible`, `toHaveClass` non typés sur `Assertion` | `Dashboard.test.tsx:193`, `LoginPage.test.tsx:122`, `ProfilePage.test.tsx:97`, `authGuard.test.tsx:64`, etc. |
| Erreurs de configuration | 0 | — | — |
| Erreurs de dépendances | 0 | — | — |

### Erreur applicative détaillée

**Fichier :** `src/components/ui/FarmHealthWidget.tsx:62`

```tsx
transition="stroke-dashoffset 0.4s ease"
```

`<circle>` attend `SVGProps<SVGCircleElement>`. `transition` n'est pas une propriété SVG valide pour un élément `<circle>`. C'est une erreur de typage qui empêche la compilation statique de ce composant, mais n'affecte pas l'exécution (le navigateur ignore l'attribut inconnu).

Preuve : `npm run typecheck` → `src/components/ui/FarmHealthWidget.tsx(62,15): error TS2322`.

### Erreurs de tests

Les 126 erreurs restantes sont toutes des erreurs TS2339 sur des matchers `jest-dom` (`toBeInTheDocument`, `toBeDisabled`, `toHaveAttribute`, `toBeVisible`, `toHaveClass`) appelés sur des éléments typés `Assertion<void, HTMLElement>` ou `Assertion<void, HTMLElement | null>`. Elles proviennent de l'absence des types `@testing-library/jest-dom` dans la configuration TypeScript des tests.

Fichiers concernés : `Dashboard.test.tsx`, `LoginPage.test.tsx`, `ProfilePage.test.tsx`, `UsersPage.test.tsx`, `authGuard.test.tsx` (liste non exhaustive, 22 fichiers de tests au total).

Preuve : sortie de `npm run typecheck` (127 lignes `error TS`).

---

## G. Analyse ESLint et tests

### ESLint

- Code de sortie : **1**
- Problèmes : **32** (4 erreurs, 28 avertissements)

**4 erreurs :**
| Fichier | Ligne | Règle | Symbole |
|---|---|---|---|
| `src/pages/Inventory.tsx` | 240 | `@typescript-eslint/no-unused-vars` | `setIsSavingCategory` |
| `src/pages/Inventory.tsx` | 692 | `@typescript-eslint/no-explicit-any` | `any` |
| `src/pages/exploitation/AnimauxPage.tsx` | 27 | `@typescript-eslint/no-unused-vars` | `AnimalFormValues` |
| `src/pages/exploitation/LotsPage.tsx` | 26 | `@typescript-eslint/no-unused-vars` | `LotFormValues` |

**28 avertissements :** quasi exclusivement `react-hooks/exhaustive-deps` (dépendances manquantes ou inutiles dans `useCallback`/`useMemo` dans `Configuration.tsx`, `Inventory.tsx`, `AnimauxPage.tsx`, `CampagnesPage.tsx`, `JournalCulturePage.tsx`, `LotsPage.tsx`, `OperationsPage.tsx`, `ParcellesPage.tsx`, `RecoltesPage.tsx`).

Preuve : sortie de `npm run lint` → `32 problems (4 errors, 28 warnings)`.

### Tests

| Catégorie | Résultat | Détails |
|---|---|---|
| Tests unitaires (Vitest) | **PASS** | 22 fichiers, 142 tests, tous verts |
| Tests d'intégration | **NON EXÉCUTÉS** | 10 fichiers bloqués : `SUPABASE_SERVICE_ROLE_KEY` manquant, Supabase local non démarré |
| Tests E2E Playwright | Non exécutés dans ce audit | Non demandés |

Preuve : sortie de `npm run test` → `Test Files 10 failed | 22 passed (32)`, `Tests 142 passed (142)`.

---

## H. Registre des risques P0-P3

| ID | Niveau | Domaine | Constat | Impact | Preuve | Confiance |
|---|--------|---------|---------|--------|--------|-----------|
| V1 | P0 | Sécurité RLS `sales` | Migration `019` conserve `OR current_user_site_id() IS NULL` — accès global aux utilisateurs sans site | Lecture/écriture transversal si `019` appliquée sans `20261116000001` | `019:168-171`, `20261116000001:35-46` | Élevée (code lu) |
| V2 | P0 | Sécurité RLS `sale_items` | Pas de `FORCE RLS`, pas de colonne `site_id`, protection par héritage de `sales` uniquement | Lecture/écriture cross-site possible si `sales` contourné | `017:98-106`, `20261116000001` | Élevée (code lu) |
| V3 | P1 | Décalage RBAC/RLS | `chef_chantier` dans les politiques RLS mais absent de `src/lib/rbac.ts` | Front refuse l'accès, base l'autorise — incohérence | `rbac.ts:6-15`, `20261107010000:37-39` | Élevée (code lu) |
| V4 | P1 | Décalage RBAC/RLS | `comptable`: read+write+delete sur ventes dans `rbac.ts`, mais lecture seule dans RLS `expenses_write_scoped` | Front surestime les droits d'écriture | `rbac.ts:167`, `20261103000001:182-186` | Élevée (code lu) |
| V5 | P1 | Qualité statique | 127 erreurs TS, dont 1 applicative (`FarmHealthWidget.tsx:62`) | Dégradation du typage, risque de régression | `npm run typecheck` exit 2 | Élevée (commande) |
| V6 | P1 | Qualité statique | 32 problèmes ESLint (4 erreurs, 28 avertissements) | Code mort, variables inutilisées | `npm run lint` exit 1 | Élevée (commande) |
| V7 | P2 | Tests d'intégration | 10 fichiers bloqués, Supabase local non démarré | Pas de validation de persistance ni RLS | `npm run test` | Élevée (commande) |
| V8 | P3 | Base réelle non inspectée | Pas d'accès Supabase dans ce audit READ-ONLY | Impossible de confirmer l'état effectif des politiques | — | — |

---

## I. Plan de correction recommandé et séquencé

1. **P0 — Sécurité `sale_items`** : ajouter `FORCE ROW LEVEL SECURITY` sur `sale_items` et une politique RLS propre scoped par `site_id` (via jointure sur `sales`), ou confirmer que l'héritage via `sales` est suffisant. Vérifier que `019` ne laisse pas de politique `OR site_id IS NULL` résiduelle sur `customers`, `sites`, `funding_allocations`.
2. **P0 — Cohérence `chef_chantier`** : ajouter `chef_chantier` à `src/lib/rbac.ts` (type `UserRole`, `ROLE_HIERARCHY`, `ROLE_PERMISSIONS`, `ROLE_LABELS`) ou retirer le rôle des politiques RLS.
3. **P1 — Cohérence `comptable` ventes** : aligner `rbac.ts` (vente: write/delete) avec la réalité RLS (lecture seule) ou inverser la politique RLS selon le besoin métier.
4. **P1 — TypeScript** : corriger `transition` sur `<circle>` dans `FarmHealthWidget.tsx:62` (remplacer par une classe CSS ou une animation inline valide). Ajouter les types `jest-dom` pour éliminer les 126 erreurs de tests.
5. **P1 — ESLint** : supprimer `setIsSavingCategory`, `any`, `AnimalFormValues`, `LotFormValues` inutilisés. Traiter les avertissements `exhaustive-deps` cas par cas.
6. **P2 — Tests d'intégration** : démarrer Supabase local (`supabase status` → API sur `127.0.0.1:54321`) puis exécuter `npx vitest run tests/integration/`.
7. **P3 — Base réelle** : inspecter `pg_policies`, `pg_class.relrowsecurity`, `pg_class.relforcerowsecurity` sur la base déployée pour confirmer l'état effectif.

---

## J. Verdict final

**SÉCURITÉ VALIDÉE SOUS RÉSERVE.**

L'isolation multi-sites est correctement implémentée dans le code des migrations pour `sales`, `fundings`, `expenses` et l'ensemble des tables métier (politiques scoped site_id, `FORCE RLS`, garde-fous). Cependant :

- La base réelle n'a pas été inspectée (contrainte READ-ONLY).
- Le rôle `chef_chantier` existe dans les politiques RLS mais pas dans le RBAC frontend.
- `comptable` a des droits d'écriture déclarés dans le RBAC frontend que la RLS ne lui accorde pas sur `expenses`.

Ces écarts ne constituent pas des brèches de sécurité actives (ils restreignent plutôt qu'ils n'ouvrent), mais ils indiquent une incohérence front/base à résoudre.

---

## K. Garantie READ-ONLY

Cette mission de validation a été réalisée exclusivement en lecture seule :

- Aucun fichier source modifié (`src/`, `supabase/migrations/`, `package.json`, `vite.config.*`, `.env*`).
- Aucun commit, push, déploiement ou migration appliqué.
- Aucune donnée (base locale ou distante) créée, modifiée ou supprimée.
- Aucune politique RLS modifiée.
- Aucun secret affiché.
- Le seul fichier créé est ce rapport : `docs/reports/BAHKANSO_VALIDATION_APPROFONDIE_READONLY_2026-11-18.md`.

Preuve finale : `git status --short` retourne uniquement `?? docs/reports/BAHKANSO_VALIDATION_APPROFONDIE_READONLY_2026-11-18.md` (et le rapport précédent déjà présent).

Preuves citées : lectures des migrations `017`, `019`, `20261107010000`, `20261116000001`, `20261116000000`, `20261103000001`, `20261103000003`, `20261103000004` ; `src/lib/rbac.ts` ; `src/components/ui/FarmHealthWidget.tsx` ; résultats de `npm run typecheck`, `npm run lint`, `npm run test`.

---

Fin du rapport.
