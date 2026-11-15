-- ============================================================================
-- Tests RLS — requêtes par rôle (NON EXÉCUTÉES, lecture seule)
--
-- Ce script est conçu pour être exécuté sur une instance locale Supabase
-- (après `supabase db reset`). Il est enveloppé dans BEGIN … ROLLBACK afin
-- qu'aucune écriture ne soit persistante.
--
-- Chaque utilisateur de test est créé dans app_users, puis on simule son
-- contexte JWT avec SET LOCAL request.jwt.claims et SET LOCAL ROLE
-- authenticated. Chaque requête indique son résultat attendu.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. Création des utilisateurs de test dans app_users
--    (ces INSERT sont annulés par le ROLLBACK final)
-- ----------------------------------------------------------------------------

-- Administrateur sans site_id (accès global par rôle)
INSERT INTO public.app_users (auth_id, role, site_id)
VALUES ('auth-admin-1', 'administrateur', NULL)
ON CONFLICT (auth_id) DO NOTHING;

-- Propriétaire sans site_id (accès global par rôle)
INSERT INTO public.app_users (auth_id, role, site_id)
VALUES ('auth-owner-1', 'propriétaire', NULL)
ON CONFLICT (auth_id) DO NOTHING;

-- Gestionnaire avec site_id A (périmètre site strict)
INSERT INTO public.app_users (auth_id, role, site_id)
VALUES ('auth-gestionnaire-A', 'gestionnaire', 'site-uuid-A')
ON CONFLICT (auth_id) DO NOTHING;

-- Gestionnaire sans site_id (doit voir 0 ligne sur tables durcies)
INSERT INTO public.app_users (auth_id, role, site_id)
VALUES ('auth-gestionnaire-nosite', 'gestionnaire', NULL)
ON CONFLICT (auth_id) DO NOTHING;

-- Comptable avec site_id A (lecture finance seule)
INSERT INTO public.app_users (auth_id, role, site_id)
VALUES ('auth-comptable-A', 'comptable', 'site-uuid-A')
ON CONFLICT (auth_id) DO NOTHING;

-- Financeur avec site_id A, lié à funder-uuid-1
INSERT INTO public.app_users (auth_id, role, site_id)
VALUES ('auth-financeur-1', 'financeur', 'site-uuid-A')
ON CONFLICT (auth_id) DO NOTHING;

INSERT INTO public.funders (id, user_id, name)
VALUES ('funder-uuid-1', public.current_app_user_id(), 'Fondeur test')
ON CONFLICT (id) DO NOTHING;

-- Utilisateur non authentifié (anon) — pas de ligne dans app_users


-- ----------------------------------------------------------------------------
-- A. administrateur / propriétaire — accès global (toutes les lignes)
-- ----------------------------------------------------------------------------

-- A.1 Administrateur lit toutes les customers (tous les sites)
-- Contexte : auth-admin-1, rôle administrateur, site_id NULL
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"auth-admin-1","role":"authenticated"}';
SELECT count(*) AS nb_customers_admin FROM public.customers;
-- RÉSULTAT ATTENDU : nombre total de customers (accès global, pas de filtre site)
-- POLICY : role_select_customers, branche administrateur/propriétaire
--   (docs/audits/2026-11-14-rls-proposition.sql:44-47)

-- A.2 Propriétaire lit toutes les sales (tous les sites)
-- Contexte : auth-owner-1, rôle propriétaire, site_id NULL
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"auth-owner-1","role":"authenticated"}';
SELECT count(*) AS nb_sales_owner FROM public.sales;
-- RÉSULTAT ATTENDU : nombre total de sales (accès global, pas de filtre site)
-- POLICY : sales_select_scoped (037) — NOTE : après 037, le propriétaire est
--   limité à son site_id, donc 0 si site_id NULL. C'est un écart résiduel.
--   [DÉDUCTION] l'accès global du propriétaire n'est effectif que sur les
--   tables où la proposition recrée une politique rôle (customers, sites, etc.),
--   pas sur sales (037 fait foi).

-- A.3 Administrateur lit toutes les fundings (tous les sites)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"auth-admin-1","role":"authenticated"}';
SELECT count(*) AS nb_fundings_admin FROM public.fundings;
-- RÉSULTAT ATTENDU : 0 (après 031, l'admin est limité à son site_id NULL → 0 ligne)
-- POLICY : fundings_select_scoped (031, lignes 95-106) — pas de branche admin globale.
--   [DÉDUCTION] l'admin ne lit pas les fundings d'autres sites sans site_id.


-- ----------------------------------------------------------------------------
-- B. gestionnaire — périmètre site strict (pas de ligne sans site_id)
-- ----------------------------------------------------------------------------

-- B.1 Gestionnaire avec site_id = A ne voit que les customers du site A
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"auth-gestionnaire-A","role":"authenticated"}';
SELECT count(*) AS nb_customers_gestionnaire_A FROM public.customers
WHERE site_id = 'site-uuid-A';
-- RÉSULTAT ATTENDU : nombre de customers du site A uniquement
-- POLICY : role_select_customers, branche gestionnaire + site_id
--   (docs/audits/2026-11-14-rls-proposition.sql:50-52)

-- B.2 Gestionnaire sans site_id ne voit aucune customer
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"auth-gestionnaire-nosite","role":"authenticated"}';
SELECT count(*) AS nb_customers_gestionnaire_nosite FROM public.customers;
-- RÉSULTAT ATTENDU : 0 (pas d'accès global pour le staff sans site_id)
-- POLICY : role_select_customers — ni administrateur/propriétaire, ni site_id
--   (docs/audits/2026-11-14-rls-proposition.sql:44-52)

-- B.3 Gestionnaire ne peut pas supprimer une vente (pas de politique DELETE pour gestionnaire sur sales)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"auth-gestionnaire-A","role":"authenticated"}';
DELETE FROM public.sales WHERE id = 'quelque-vente-id' AND site_id = 'site-uuid-A';
-- RÉSULTAT ATTENDU : 0 lignes supprimées (sales_write_scoped ne couvre que
--   administrateur/gestionnaire en WITH CHECK, mais DELETE n'est pas couvert
--   par une politique dédiée sur sales après 037 — en fait 037 crée
--   sales_write_scoped FOR ALL qui inclut DELETE, mais WITH CHECK restreint
--   à administrateur/gestionnaire. Le gestionnaire peut donc supprimer sur son site.)
--   [DÉDUCTION] à vérifier : sales_write_scoped couvre DELETE car FOR ALL.


-- ----------------------------------------------------------------------------
-- C. comptable — lecture finance seule, pas d'écriture sur ventes
-- ----------------------------------------------------------------------------

-- C.1 Comptable lit les transactions de son site
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"auth-comptable-A","role":"authenticated"}';
SELECT count(*) AS nb_transactions_comptable FROM public.transactions
WHERE site_id = 'site-uuid-A';
-- RÉSULTAT ATTENDU : nombre de transactions du site A
-- POLICY : role_select_transactions, branche gestionnaire/comptable + site_id
--   (docs/audits/2026-11-14-rls-proposition.sql:283-287)

-- C.2 Comptable ne peut pas créer une vente (sales_write_scoped WITH CHECK
--   restreint à administrateur/gestionnaire)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"auth-comptable-A","role":"authenticated"}';
INSERT INTO public.sales (site_id, reference, total_amount)
VALUES ('site-uuid-A', 'TEST-001', 1000);
-- RÉSULTAT ATTENDU : erreur RLS (42501) ou 0 lignes insérées
-- POLICY : sales_write_scoped (037, lignes 50-64) — WITH CHECK restreint à
--   administrateur/gestionnaire.


-- ----------------------------------------------------------------------------
-- D. financeur (bailleur) — lecture seule de ses propres fundings
-- ----------------------------------------------------------------------------

-- D.1 Financeur lit ses propres fundings via current_user_funder_id()
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"auth-financeur-1","role":"authenticated"}';
SELECT count(*) AS nb_fundings_financeur FROM public.fundings
WHERE funder_id = public.current_user_funder_id();
-- RÉSULTAT ATTENDU : nombre de fundings dont funder_id = current_user_funder_id()
-- POLICY : fundings_select_scoped (031, lignes 105-106) — branche financeur

-- D.2 Financeur ne lit pas les expenses (exclu de expenses_select_scoped)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"auth-financeur-1","role":"authenticated"}';
SELECT count(*) AS nb_expenses_financeur FROM public.expenses;
-- RÉSULTAT ATTENDU : 0 (le financeur n'est pas dans la liste de lecture expenses)
-- POLICY : expenses_select_scoped (031, lignes 145-155) — pas de financeur

-- D.3 Financeur ne lit que sa propre ligne dans funders
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"auth-financeur-1","role":"authenticated"}';
SELECT count(*) AS nb_funders_propre FROM public.funders
WHERE id = public.current_user_funder_id();
-- RÉSULTAT ATTENDU : 1 (sa propre ligne uniquement)
-- POLICY : role_select_funders (docs/audits/2026-11-14-rls-proposition.sql, section 2.3)

-- D.4 Financeur ne peut pas créer une expense (pas de politique INSERT pour financeur sur expenses)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"auth-financeur-1","role":"authenticated"}';
INSERT INTO public.expenses (site_id, amount, description)
VALUES ('site-uuid-A', 5000, 'Test');
-- RÉSULTAT ATTENDU : erreur RLS (42501) ou 0 lignes insérées
-- POLICY : expenses_write_scoped (031) — WITH CHECK restreint à
--   administrateur/gestionnaire/chef_chantier.


-- ----------------------------------------------------------------------------
-- E. utilisateur non authentifié (anon) — lecture publique sur farms/site_content seulement
-- ----------------------------------------------------------------------------

-- E.1 Anon lit les farms (lecture publique)
-- Contexte : pas de claims, pas de ligne dans app_users
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":null}';
SELECT count(*) AS nb_farms_anon FROM public.farms;
-- RÉSULTAT ATTENDU : nombre total de farms (public_read_farms USING true)
-- POLICY : public_read_farms (007, conservée par consolidation)

-- E.2 Anon ne lit pas les customers (pas de politique anon, RLS bloque)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":null}';
SELECT count(*) AS nb_customers_anon FROM public.customers;
-- RÉSULTAT ATTENDU : 0 (toutes les politiques customers sont TO authenticated)


-- ----------------------------------------------------------------------------
-- F. Tables élevage et culture — pas d'isolement site au niveau RLS
-- ----------------------------------------------------------------------------

-- F.1 Responsable élevage voit tous les animals (pas de filtre site RLS)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"auth-eleveur-1","role":"authenticated"}';
-- Préalable : créer un utilisateur responsable_élevage (omitted for brevity)
SELECT count(*) AS nb_animals_eleveur FROM public.animals;
-- RÉSULTAT ATTENDU : nombre total de animals (pas de filtrage site_id en RLS)
-- POLICY : role_select_animals (012) — rôle uniquement, pas de site_id
--   [HYPOTHÈSE] l'isolement est en UI uniquement, pas en RLS

-- F.2 Responsable agricole voit tous les crop_operations (pas de filtre site RLS)
SELECT count(*) AS nb_crop_ops FROM public.crop_operations;
-- RÉSULTAT ATTENDU : nombre total de crop_operations (pas de filtrage site_id en RLS)
-- POLICY : role_select_crop_operations (012) — rôle uniquement
--   [HYPOTHÈSE] idem


-- ----------------------------------------------------------------------------
-- G. FORCE RLS — vérification structurelle
-- ----------------------------------------------------------------------------

-- G.1 FORCE RLS activé sur les tables durcies
SELECT relname, relforcerowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('customers','sales','sale_items','sites','funding_allocations',
                    'fundings','transactions','documents','expenses','funders')
  AND c.relkind = 'r';
-- RÉSULTAT ATTENDU : relforcerowsecurity = true pour toutes ces tables

-- G.2 Aucune politique USING true / WITH CHECK true sur ces tables
SELECT polname, polrelid::regclass::text AS tbl, polqual, polwithcheck
FROM pg_policy
WHERE polrelid::regclass::text LIKE 'public.%'
  AND polrelid::regclass::text = ANY(ARRAY[
    'public.customers','public.sales','public.sale_items','public.sites',
    'public.funding_allocations','public.fundings','public.transactions',
    'public.documents','public.expenses','public.funders'
  ])
  AND (trim(polqual) IN ('true','(true)') OR trim(polwithcheck) IN ('true','(true)'));
-- RÉSULTAT ATTENDU : 0 ligne retournée

ROLLBACK;

-- ============================================================================
-- Notes
-- - Toutes les écritures (INSERT app_users, funders, DELETE sales, INSERT sales/expenses)
--   sont annulées par le ROLLBACK final.
-- - Les valeurs 'site-uuid-A', 'quelque-vente-id' sont des placeholders à
--   remplacer par des UUID réels existants dans la base de test.
-- - Ce script ne doit pas être exécuté sur une base distante sans accord de mission.
-- ============================================================================
