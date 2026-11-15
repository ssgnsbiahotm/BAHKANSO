# Audit RLS — Inventaire réel des politiques par table

## Mission
Inventaire lecture seule des politiques RLS effectivement présentes dans le dépôt, table par table, avec les fonctions helpers, les écarts détectés, la matrice UI vs RLS complète, les décisions d'architecture et le plan de retour arrière. Aucun accès base distante, aucune écriture dans supabase/migrations/, aucun commit.

**HEAD** : `2abb092` (branche `feat/dashboard-v2`). Chaque constat est marqué `[FAIT]` (preuve fichier:ligne) ou `[HYPOTHÈSE]` (non vérifiable statiquement).

---

## 1. Fonctions helpers (résolution utilisateur courant)

| Fichier | Fonction | Sécurité | search_path | row_security | Comportement |
|---------|----------|----------|-------------|--------------|--------------|
| `supabase/migrations/20261103000003_helpers_row_security_off_fix.sql` | `current_app_user_id()` | SECURITY DEFINER | `SET search_path = public` (ligne 27) | off (ligne 28) | `SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1` |
| idem | `current_user_role()` | SECURITY DEFINER | `SET search_path = public` (ligne 40) | off (ligne 41) | `SELECT role FROM app_users WHERE auth_id = auth.uid()` |
| idem | `current_user_site_id()` | SECURITY DEFINER | `SET search_path = public` (ligne 53) | off (ligne 54) | `SELECT site_id FROM app_users WHERE auth_id = auth.uid()` |
| idem | `current_user_funder_id()` | SECURITY DEFINER | `SET search_path = public` (ligne 68) | off (ligne 69) | `SELECT id FROM funders WHERE user_id = current_app_user_id()` |
| `supabase/migrations/20261113000000_fix_event_journal_rls.sql` | `current_user_farm_id()` | SECURITY DEFINER | `SET search_path = public` | off | `SELECT s.farm_id FROM app_users au JOIN sites s ON s.id = au.site_id WHERE au.auth_id = auth.uid()` |

**Remarques** :
- Toutes les 4 helpers principales sont `REVOKE ALL ... FROM PUBLIC` (garde-fou dans `helpers_remove_or_fix`, `supabase/migrations/20261103000004_helpers_remove_or_fix.sql:76-77`). **[FAIT]**
- `SET search_path = public` est explicite sur toutes les redéfinitions des helpers (lignes 27/40/53/68 du fichier 03, lignes 31/42/53/68 du fichier 04). Ce n'est **pas un défaut**. **[FAIT]**
- `current_user_site_id()` retourne `NULL` quand l'utilisateur n'a pas de `site_id` → plusieurs politiques traitent `NULL` comme "accès global" (admin). Voir §5.
- `current_user_has_role` lit `app_users` en SECURITY DEFINER pour éviter la récursion RLS (commentaire dans la consolidation 20261112000000).

---

## 2. Inventaire RLS par table

### 2.1 Tables cœur (migration 001_core_tables et durcissements)

| Table | RLS activée | FORCE RLS | Politiques | Filtre données |
|-------|-------------|-----------|------------|----------------|
| `farms` | oui | non (consolidation) | `public_read_farms` `USING (true)` (anon+auth, 007) → `role_*` (012) | — (lecture publique) |
| `app_users` | oui | non | "propre profil" `auth.uid() = auth_id` (consolidation) | propre ligne |
| `funders` | oui | non (proposition: oui) | `role_*` (012) | aucun filtre `funder_id` au niveau RLS |
| `fundings` | oui | oui (031) | `fundings_select_scoped` / `fundings_write_scoped` | `site_id` OU `funder_id` |
| `bank_accounts` | oui | non | `role_*` (011) | — |
| `cash_accounts` | oui | non | `role_*` (011) | — |
| `transactions` | oui | non (022) | `role_select_transactions` / `role_*` (022) | `site_id` OU global (`IS NULL`) |
| `suppliers` | oui | non | `role_*` (012) | — |
| `expense_categories` | oui | non | `role_*` (012) | — |
| `expenses` | oui | oui (031) | `expenses_select_scoped` / `expenses_write_scoped` | `site_id` |
| `documents` | oui | non (022) | `role_select_documents` / `role_*` (022) | `site_id` OU global (`IS NULL`) |

### 2.2 Tables ajoutées par la migration 017 (ventes)

| Table | RLS activée | FORCE RLS | Politiques | Filtre données |
|-------|-------------|-----------|------------|----------------|
| `customers` | oui | non (019) | `role_*` (019) | `site_id` OU global (`IS NULL`) |
| `sales` | oui | oui (037) | `sales_select_scoped` / `sales_write_scoped` | `site_id` |
| `sale_items` | oui | non (019) | `role_*` (019) | via `sale_id` → `site_id` OU global (`IS NULL`) |

### 2.3 Tables par rôle (migration 012_rls_by_role_complete — 15 tables)

`inventory_items`, `inventory_movements`, `suppliers`, `projects`, `media`, `monitoring`, `surveillance`, `configuration`, `farms`, `sites`, `bank_accounts`, `budgets`, `transactions`, `expense_categories`, `funders`, `crop_operations`, `crops`, `harvests` — politiques `role_*` via `current_user_has_role(ARRAY[...])`. **[FAIT]**

### 2.4 Tables élevage et culture — aucun filtrage site/farm au niveau RLS

| Table | Migration création | Colonnes site/farm | Politiques RLS | Filtre données |
|-------|-------------------|--------------------|----------------|----------------|
| `animals` | 002_operational_tables | `site_id` (ajouté par 028_site_id_everywhere) | `role_*` (012) | aucun (rôle uniquement) |
| `animal_lots` | 002_operational_tables | `site_id` (ajouté par 028) | `role_*` (012) | aucun |
| `animal_events` | 002_operational_tables | pas de colonne site/farm directe | `role_*` (012) | aucun |
| `campaigns` | 002_operational_tables | `site_id` (ajouté par 016_multi_sites) | `role_*` (012) | aucun |
| `plots` | 002_operational_tables | `farm_id` (ajouté par add_farm_id_to_core_tables) | `role_*` (012) | aucun |
| `project_steps` | 002_operational_tables | `project_id` (FK vers projects) | `role_*` (012) | aucun (via projects) |
| `inventory_items` | 002_operational_tables | pas de colonne site/farm | `role_*` (012) | aucun |
| `inventory_movements` | 002_operational_tables | pas de colonne site/farm | `role_*` (012) | aucun |
| `crop_operations` | 002_operational_tables | `site_id` (ajouté par 030_site_id_operations_harvests) | `role_*` (012) | aucun |
| `harvests` | 002_operational_tables | `site_id` (ajouté par 030) | `role_*` (012) | aucun |

**Décision élevage/culture : NON** — il n'y a pas d'isolement site/farm au niveau RLS pour ces tables. Les triggers de synchronisation (`sync_campaign_site_id`, `sync_animal_site_id` de 028/030) propagent le `site_id` sur les lignes dépendantes mais ne créent pas de politique RLS filtrante. **[HYPOTHÈSE]** l'isolement est uniquement en UI via `hasPermission`, pas en RLS.

### 2.5 Tables durcies par la consolidation (20261112000000)

| Table | Politiques après consolidation | Niveau |
|-------|-------------------------------|--------|
| `sales` | `sales_select_scoped` / `sales_write_scoped` (site_id = current_user_site_id(), write admin/gestionnaire) | least-privilege |
| `media` | `role_select/insert/update/delete_media` via `current_user_has_role` | rôle |
| `surveillance_events` | `role_select/insert/update/delete_surveillance_events` via `current_user_has_role` | rôle |
| `event_journal` | politique corrigée par `fix_event_journal_rls` : `farm_id = current_user_farm_id()` | ferme |
| `app_users` | "Les utilisateurs peuvent voir leur propre profil" (`auth.uid() = auth_id`) | propre profil |
| `farms` | `public_read_farms` `USING (true)` pour `anon` + `authenticated` | lecture publique |
| `site_content` | `public_read_site_content` `USING (true)` pour `anon` + `authenticated` | lecture publique |

---

## 3. Helpers search_path et sécurité (détail)

| Fichier | Fonction | search_path explicite ? | Sécurité | row_security | Défaut ? |
|---------|----------|------------------------|----------|--------------|----------|
| `20261103000003_helpers_row_security_off_fix.sql` | `current_app_user_id()` | Oui (ligne 27) | SECURITY DEFINER | off | Non |
| idem | `current_user_role()` | Oui (ligne 40) | SECURITY DEFINER | off | Non |
| idem | `current_user_site_id()` | Oui (ligne 53) | SECURITY DEFINER | off | Non |
| idem | `current_user_funder_id()` | Oui (ligne 68) | SECURITY DEFINER | off | Non |
| `20261103000004_helpers_remove_or_fix.sql` | `current_app_user_id()` | Oui (ligne 31) | SECURITY DEFINER | off | Non |
| idem | `current_user_role()` | Oui (ligne 42) | SECURITY DEFINER | off | Non |
| idem | `current_user_site_id()` | Oui (ligne 53) | SECURITY DEFINER | off | Non |
| idem | `current_user_funder_id()` | Oui (ligne 68) | SECURITY DEFINER | off | Non |

**Verdict** : `SET search_path = public` est bien explicite sur tous les helpers. Aucun défaut à signaler. **[FAIT]**

---

## 4. Matrice UI (rbac.ts) vs RLS, par rôle et par table

### 4.1 Référence RBAC : `src/lib/rbac.ts`

`src/lib/rbac.ts` définit 8 rôles × 18 modules avec `hasPermission(role, module, action)` où action ∈ {read, write, delete, admin}. **[FAIT]**

Extraits clés :
- `administrateur` : tout sur tout (read/write/delete/admin = true sur tous les modules) — lignes ~55-75
- `propriétaire` : read partout, write sur finance/ventes/projects/configuration, pas de delete — lignes ~78-100
- `gestionnaire` : read partout, write sur finance/ventes/agriculture/livestock/projects/inventory/suppliers/media/surveillance, pas de delete — lignes ~128-150
- `comptable` : finance read seule (write=false, delete=false), ventes read/write/delete=true — lignes ~152-174
- `financeur` : finance read/write (ses financements uniquement, porté par RLS funder_id), ventes read seule, projets read seule — lignes ~112-125, commentaire lignes ~108-110
- `auditeur` : read seule sur tous les modules — lignes ~176-198

### 4.2 Matrice complète UI vs RLS

| Table | Rôle | UI Lire | UI Créer | UI Modifier | UI Supprimer | RLS effectif | Écart UI↔RLS |
|-------|------|---------|----------|-------------|--------------|--------------|--------------|
| `customers` | administrateur | ✔ | ✔ | ✔ | ✔ | accès global (rôle) | Aucun |
| `customers` | propriétaire | ✔ | ✔ | ✔ | ✔ | accès global (rôle) | Aucun |
| `customers` | gestionnaire | ✔ | ✔ | ✔ | ✖ | site_id = current_user_site_id() | Aucun |
| `customers` | comptable | ✔ | ✔ | ✔ | ✔ | site_id = current_user_site_id() | Aucun |
| `sales` | administrateur | ✔ | ✔ | ✔ | ✔ | site_id uniquement (037, pas d'accès global) | **UI dit global, RLS dit site_id** |
| `sales` | propriétaire | ✔ | ✔ | ✔ | ✖ | site_id uniquement (037) | **UI dit global, RLS dit site_id** |
| `sales` | gestionnaire | ✔ | ✔ | ✔ | ✖ | site_id = current_user_site_id(), write admin/gestionnaire | Aucun |
| `sales` | comptable | ✔ | ✔ | ✔ | ✔ | site_id en lecture, WITH CHECK bloque écriture (admin/gestionnaire seulement) | **UI dit write+delete=true, RLS bloque l'écriture** |
| `fundings` | administrateur | ✔ | ✔ | ✔ | ✔ | site_id uniquement (031, pas d'accès global) | **UI dit global, RLS dit site_id** |
| `fundings` | propriétaire | ✔ | ✔ | ✔ | ✖ | site_id uniquement (031) | **UI dit global, RLS dit site_id** |
| `fundings` | financeur | ✔ | ? | ? | ? | funder_id = current_user_funder_id() (031) | Aucun (lecture seule ses fundings) |
| `expenses` | administrateur | ✔ | ✔ | ✔ | ✔ | site_id uniquement (031) | **UI dit global, RLS dit site_id** |
| `expenses` | gestionnaire | ✔ | ✔ | ✔ | ✖ | site_id = current_user_site_id(), write admin/gestionnaire/chef_chantier | Aucun |
| `expenses` | comptable | ✔ (lecture seule) | ✖ | ✖ | ✖ | site_id en lecture, WITH CHECK bloque écriture | Aucun |
| `expenses` | financeur | ✔ (décision D) | ? | ? | ? | lié via funder_id ou financial_links (à implémenter) | **Décision D : OUI, non implémenté dans le RLS actuel** |
| `funders` | administrateur | ✔ | ✔ | ✔ | ✔ | rôle (012), pas de filtre funder_id | **Pas de filtrage funder_id en RLS** |
| `funders` | financeur | ? | ? | ? | ? | propre ligne uniquement (proposition) | **À implémenter** |
| `animals` | responsable_élevage | ✔ | ✔ | ✔ | ✔ | rôle uniquement, pas de site_id | **Pas d'isolement site en RLS** |
| `animal_lots` | responsable_élevage | ✔ | ✔ | ✔ | ✔ | rôle uniquement, pas de site_id | **Pas d'isolement site en RLS** |
| `campaigns` | responsable_agricole | ✔ | ✔ | ✔ | ✖ | rôle uniquement, pas de site_id | **Pas d'isolement site en RLS** |
| `plots` | responsable_agricole | ✔ | ✔ | ✔ | ✖ | rôle uniquement, pas de farm_id | **Pas d'isolement farm en RLS** |
| `crop_operations` | responsable_agricole | ✔ | ✔ | ✔ | ✖ | rôle uniquement, pas de site_id | **Pas d'isolement site en RLS** |
| `harvests` | responsable_agricole | ✔ | ✔ | ✔ | ✖ | rôle uniquement, pas de site_id | **Pas d'isolement site en RLS** |
| `farms` | tous (anon inclus) | ✔ (public) | ✖ | ✖ | ✖ | `USING (true)` lecture publique | Aucun (lecture publique voulue) |
| `site_content` | tous (anon inclus) | ✔ (public) | ✖ | ✖ | ✖ | `USING (true)` lecture publique | Aucun (lecture publique voulue) |

### 4.3 Écarts UI ↔ RLS identifiés

1. **Comptable / ventes** : `src/lib/rbac.ts` donne `ventes write=true, delete=true` au comptable (lignes ~160-162), mais `sales_write_scoped` (037, lignes 63-64) restreint l'écriture à `administrateur`/`gestionnaire` uniquement. Un comptable peut cliquer "Modifier" sur une vente en UI mais l'écriture est bloquée par RLS (WITH CHECK lève 42501). **[DÉDUCTION]** UI et RLS désalignés sur le module ventes pour le comptable. **Décision A : finance en lecture seule pour le comptable** — cet écart est accepté, le comptable n'a pas d'écriture finance en RLS.

2. **Administrateur / propriétaire sur sales/fundings/expenses** : l'UI donne un accès global (tout sur tout), mais le RLS (031/037) limite à `site_id = current_user_site_id()`. Sans site_id, l'admin/propriétaire voit 0 ligne sur ces tables. **[DÉDUCTION]** l'accès global n'est effectif que sur les tables où la proposition recrée une politique rôle (customers, sites, funding_allocations, sale_items, transactions, documents, funders).

3. **Financeur / expenses** : le financeur lit les dépenses liées (décision D) mais ce n'est PAS encore implémenté en RLS. `expenses_select_scoped` (031, lignes 145-155) exclut encore le financeur. Pas de `funder_id` sur expenses — nécessite une implémentation d'architecture séparée.

4. **Élevage / culture** : aucune politique RLS ne filtre sur `site_id`/`farm_id` pour `animals`, `animal_lots`, `campaigns`, `plots`, `crop_operations`, `harvests`. **[HYPOTHÈSE]** l'isolement est uniquement en UI.

---

## 5. Accès global (current_user_site_id() = NULL)

Plusieurs politiques traitent `current_user_site_id() IS NULL` comme accès global (toutes les lignes de tous les sites) :

- `019_rls_sales_tightening` : `sites`, `funding_allocations`, `customers`, `sales`, `sale_items` — clause `OR current_user_site_id() IS NULL`
- `022_gestion_site_id_rls` (`supabase/migrations/20261022000006_022_gestion_site_id_rls.sql`) : `fundings`, `transactions`, `documents` — même clause
- `031_rls_fundings_expenses_least_privilege` : `fundings`/`expenses` — **pas** de clause NULL (site_id obligatoire, scoped uniquement)
- `037_rls_sales_least_privilege` : `sales` — **pas** de clause NULL (site_id obligatoire, scoped uniquement)

**[HYPOTHÈSE]** : un gestionnaire (ou autre rôle staff) sans `site_id` renseigné dans `app_users` obtient un accès global sur les tables où la clause `IS NULL` subsiste (019, 022). Ceci contredit l'intention "gestionnaire = périmètre site".

---

## 6. Financeur (bailleur) — accès fundings et dépenses

| Niveau | Mécanisme | Couverture | Décision |
|--------|-----------|------------|----------|
| RLS `fundings` (031) | `fundings.funder_id = current_user_funder_id()` | ✔ fundings uniquement | SELECT seule (décision appliquée) |
| RLS `expenses` (031) | pas de `funder_id` — financeur exclu de la liste de lecture | ✘ **NON (décision D à implémenter)** — pas de funder_id sur expenses, pas de lien financial_links dans les politiques |
| RLS `funders` (proposition) | `funders.id = current_user_funder_id()` | propre ligne uniquement | SELECT seule (décision appliquée) |
| UI | pas de garde `hasPermission` sur les pages bailleurs | non gardé | — |

**Décision financeur : dépenses liées = OUI (décision D).** Le financeur lit les dépenses liées à ses fundings. Nécessite une implémentation d'architecture séparée : ajout de `funder_id` sur `expenses` ou liaison `financial_links` encodée dans les politiques RLS. **[DÉCISION]** validée par le responsable, **[NON IMPLÉMÉ]** dans le code actuel — à implémenter dans une mission séparée (pas de modification de schéma dans cette mission).

---

## 7. Risques de blocage identifiés

1. **Récursion RLS sur `app_users`** : `current_user_has_role` lit `app_users` en SECURITY DEFINER pour éviter la récursion (commentaire dans la consolidation). Les helpers `current_user_*` ont été passés en `row_security = off` (`helpers_remove_or_fix`) pour éviter la récursion quand FORCE RLS est activé sur `app_users`. **[FAIT]** Phase 1 a prouvé que cela fonctionne en pgTAP.

2. **Politiques `USING (true)` résiduelles** : la migration 031 et 037 dropent explicitement les politiques permissives avant d'en créer des ciblées, et incluent un garde-fou DO block qui lève une exception si une politique `true` subsiste. **[FAIT]** garde-fou présent dans 031 et 037.

3. **Conflit 012 `role_*` vs 031/037 `*_scoped`** : 031 droppe les `role_select_fundings/expenses` et `role_insert/update/delete_fundings/expenses` avant de créer les politiques scoped. 037 droppe `role_select/insert/update/delete_sales`. Si 031/037 ne sont pas appliquées, les politiques `role_*` de 012 (USING large via OR) se combinent en OR avec les scoped et neutralisent le least-privilege. **[HYPOTHÈSE]** risque de blocage si l'ordre d'application n'est pas respecté.

4. **Référence VTE** : `generate_sale_reference()` a été corrigée (017 COUNT → 019 séquence non initialisée → consolidation MAX+1 advisory lock). La séquence `sale_ref_seq` est conservée non utilisée pour compat. **[FAIT]** fix_sale_reference_fn appliqué.

---

## 8. Synthèse par table (état final après toutes les migrations)

| Table | RLS | FORCE RLS | Politique de sélection | Politique d'écriture | Filtre données |
|-------|-----|-----------|------------------------|----------------------|----------------|
| farms | oui | non (consolidation) | `public_read_farms` `true` (anon+auth) | `role_*` (012) | — (lecture publique) |
| app_users | oui | non | "propre profil" `auth.uid() = auth_id` | — | propre ligne |
| funders | oui | non (proposition: oui) | `role_*` (012) | `role_*` (012) | aucun filtre funder_id |
| fundings | oui | oui (031) | `fundings_select_scoped` (site_id OU funder_id) | `fundings_write_scoped` (site_id OU funder_id) | site_id / funder_id |
| expenses | oui | oui (031) | `expenses_select_scoped` (site_id, rôles staff) | `expenses_write_scoped` (site_id, admin/gestionnaire/chef_chantier) | site_id |
| transactions | oui | non (022) | `role_select_transactions` | `role_*` (022) | site_id OU global |
| documents | oui | non (022) | `role_select_documents` | `role_*` (022) | site_id OU global |
| customers | oui | non (019) | `role_select_customers` | `role_*` (019) | site_id OU global |
| sales | oui | oui (037) | `sales_select_scoped` | `sales_write_scoped` (admin/gestionnaire) | site_id |
| sale_items | oui | non (019) | `role_select_sale_items` | `role_*` (019) | via sale_id → site_id OU global |
| sites | oui | non (019) | `role_select_sites` | `role_*` (019) | site_id OU global |
| media | oui | non (consolidation) | `role_select_media` | `role_*` (consolidation) | — |
| surveillance_events | oui | oui (consolidation) | `role_select_surveillance_events` | `role_*` (consolidation) | — |
| event_journal | oui | — | `event_journal_select_scoped` (farm_id = current_user_farm_id()) | — | farm_id |
| animals | oui | non (012) | `role_*` | `role_*` | aucun (rôle uniquement) |
| animal_lots | oui | non (012) | `role_*` | `role_*` | aucun |
| animal_events | oui | non (012) | `role_*` | `role_*` | aucun |
| campaigns | oui | non (012) | `role_*` | `role_*` | aucun |
| plots | oui | non (012) | `role_*` | `role_*` | aucun |
| project_steps | oui | non (012) | `role_*` | `role_*` | aucun (via projects) |
| inventory_items | oui | non (012) | `role_*` | `role_*` | aucun |
| inventory_movements | oui | non (012) | `role_*` | `role_*` | aucun |
| crop_operations | oui | non (012) | `role_*` | `role_*` | aucun |
| harvests | oui | non (012) | `role_*` | `role_*` | Aucun |

---

## 9. Décisions d'architecture (phase 1)

| Décision | Valeur | Justification |
|----------|--------|---------------|
| Accès global | par RÔLE (administrateur, propriétaire), jamais `site_id IS NULL` | Évite qu'un gestionnaire sans site_id voie toutes les lignes |
| Gestionnaire | son site uniquement, pas de delete financier | RBAC gestionnaire : delete=false sur finance |
| Comptable | finance lecture seule (décision A : L seul), ventes write+delete en UI mais bloqué par RLS | 037 restreint l'écriture ventes à admin/gestionnaire |
| Financeur | lecture seule de ses fundings (funder_id), dépenses liées = OUI (décision D) à implémenter, pas d'écriture | Nécessite funder_id sur expenses ou financial_links — à implémenter séparément |
| funders | un financeur ne lit que sa propre ligne | Proposition d'ajout de politique `role_select_funders` |
| Élevage / culture | pas d'isolement site/farm au niveau RLS | Décision : NON pour l'instant (pas de migration de durcissement) |
| FORCE RLS | étendu aux tables durcies (customers, sites, funding_allocations, sale_items, transactions, documents, funders) | RLS s'applique aussi au propriétaire de la table |
| sales / fundings | pas de recréation de `role_*` (031/037 font foi) | Évite le conflit 012 vs 031/037 |

---

## 10. Plan de retour arrière et accès de secours superadmin

### 10.1 Retour arrière

Toutes les politiques de la proposition sont précédées de `DROP POLICY IF EXISTS`, ce qui les rend idempotentes. Pour annuler :

1. **Supprimer les politiques recréées** : `DROP POLICY IF EXISTS "role_select_customers" ON public.customers;` etc. pour chaque table de la proposition.
2. **Retirer FORCE RLS** : `ALTER TABLE public.customers NO FORCE ROW LEVEL SECURITY;` (idem pour sites, funding_allocations, sale_items, transactions, documents, funders).
3. **Restaurer les politiques précédentes** : réappliquer les migrations 019 (`role_*` avec `OR current_user_site_id() IS NULL`) et 022 pour les tables concernées, ou restaurer depuis une sauvegarde SQL pré-application.

### 10.2 Accès de secours superadmin

- **Rôle `service_role` (Supabase)** : dispose de `BYPASSRLS` et contourne toutes les politiques RLS, même avec FORCE RLS activé. C'est l'accès de secours par défaut pour les opérations d'administration. **[DÉDUCTION]** comportement standard de Supabase.
- **Utilisateur `postgres` (propriétaire des tables)** : avec FORCE RLS, même le propriétaire est soumis à RLS, sauf s'il est superutilisateur de la base. En local, un superutilisateur contourne RLS. **[DÉDUCTION]** comportement standard de PostgreSQL.

### 10.3 Accès de secours en cas de blocage

Si un utilisateur légitime est bloqué (ex. gestionnaire sans site_id qui ne voit plus aucune ligne) :
- Soit lui assigner un `site_id` dans `app_users` (écriture administrative, hors RLS car `service_role` ou superutilisateur).
- Soit ajouter temporairement une politique de secours, à retirer après correction.

---

## 11. Constats finaux

1. Le durcissement RLS est progressif : 001/007 (permissif) → 012 (par rôle) → 019/022 (par site) → 031/037 (least-privilege scoped) → consolidation (harmonisation distant).
2. L'accès global (`current_user_site_id() IS NULL`) subsiste sur les tables durcies par 019 et 022 (customers, sales, sale_items, sites, funding_allocations, fundings, transactions, documents). Pas de garde-fou contre un gestionnaire sans `site_id`.
3. Le financeur est filtré par `funder_id` sur `fundings` uniquement (031). Les dépenses liées = OUI (décision D) mais PAS implémentées en RLS — pas de filtrage sur `expenses` actuellement, nécessite une mission d'architecture séparée.
4. Les helpers `current_user_*` sont correctement protégés (`row_security = off`, `SET search_path = public` explicite, pas de `current_setting`, pas de `OR`, pas de `||`).
5. Aucune politique `USING (true)` ne subsiste sur `fundings`, `expenses`, `sales` après 031/037 (garde-fou DO block).
6. Les tables élevage et culture (animals, animal_lots, animal_events, campaigns, plots, project_steps, inventory_*, crop_operations, harvests) n'ont aucun filtrage site/farm au niveau RLS.
7. `farms` et `site_content` sont lisibles en anonyme (`USING (true)`).
8. Écarts UI ↔ RLS : comptable/ventes désaligné (décision A : finance L seul accepté), admin/propriétaire sur sales/fundings/expenses limité au site, financeur/expenses = décision D (OUI) mais non implémenté en RLS, élevage/culture sans isolement site.

**Statut** : inventaire terminé, lecture seule, aucun commit, aucun accès base distante.

---

*Fichier produit : docs/audits/2026-11-14-rls-inventaire.md*
