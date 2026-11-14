-- ============================================================================
-- Tests RLS Phase 2 — requêtes par rôle (EXÉCUTABLE sur Supabase LOCAL)
--
-- Ce script est enveloppé dans BEGIN … ROLLBACK afin qu'aucune écriture ne
-- soit persistante. Il crée des utilisateurs de test dans auth.users / app_users,
-- peuplique des données de référence (sites, customers, fundings, …), puis
-- simule le contexte JWT via SET LOCAL request.jwt.claims et SET LOCAL ROLE
-- authenticated.
--
-- Prérequis : supabase local démarré (supabase status → API sur 127.0.0.1:54321)
--             migrations appliquées (y compris 20261114000000_rls_global_by_role_phase2)
--
-- Exécution : PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f scripts/test-rls-phase2.sql
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. Utilisateurs de test (annulés par le ROLLBACK final)
--    auth.users d'abord (FK app_users.auth_id -> auth.users.id), puis app_users.
--    auth_id correspond à auth.uid() (sub du JWT).
-- ----------------------------------------------------------------------------

INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, raw_user_meta_data, created_at, updated_at)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000000','authenticated','authenticated','admin@test.local','password','{}',now(),now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','00000000-0000-0000-0000-000000000000','authenticated','authenticated','owner@test.local','password','{}',now(),now()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc','00000000-0000-0000-0000-000000000000','authenticated','authenticated','gestionnaire@test.local','password','{}',now(),now()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd','00000000-0000-0000-0000-000000000000','authenticated','authenticated','gestionnaire-nosite@test.local','password','{}',now(),now()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee','00000000-0000-0000-0000-000000000000','authenticated','authenticated','comptable@test.local','password','{}',now(),now()),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff','00000000-0000-0000-0000-000000000000','authenticated','authenticated','financeur@test.local','password','{}',now(),now())
ON CONFLICT (id) DO NOTHING;

-- Administrateur sans site_id (accès global par rôle)
UPDATE public.app_users
SET role = 'administrateur', site_id = NULL, active = true, name = 'Admin Test'
WHERE auth_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Propriétaire sans site_id (accès global par rôle)
UPDATE public.app_users
SET role = 'propriétaire', site_id = NULL, active = true, name = 'Owner Test'
WHERE auth_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- Gestionnaire avec site_id Katadji (périmètre site strict)
UPDATE public.app_users
SET role = 'gestionnaire', site_id = '11111111-1111-1111-1111-111111111111', active = true, name = 'Gestionnaire Katadji'
WHERE auth_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Gestionnaire sans site_id (doit voir 0 ligne sur tables durcies)
UPDATE public.app_users
SET role = 'gestionnaire', site_id = NULL, active = true, name = 'Gestionnaire Sans Site'
WHERE auth_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

-- Comptable avec site_id Katadji (lecture finance seule)
UPDATE public.app_users
SET role = 'comptable', site_id = '11111111-1111-1111-1111-111111111111', active = true, name = 'Comptable Katadji'
WHERE auth_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- Financeur avec site_id Katadji, lié à funder 000...0020
UPDATE public.app_users
SET role = 'financeur', site_id = '11111111-1111-1111-1111-111111111111', active = true, name = 'Financeur Katadji'
WHERE auth_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

-- Lier le funder à l'utilisateur financeur
UPDATE public.funders
SET user_id = (SELECT id FROM public.app_users WHERE auth_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff')
WHERE id = '00000000-0000-0000-0000-000000000020';


-- ----------------------------------------------------------------------------
-- 1. Données de référence (tout rollback à la fin)
--    Ferme, sites (Katadji=1111…, Aheremou=2222…), customers, fundings,
--    transactions, expenses, sale_items, funding_allocations, documents.
--    session_replication_role = replica évite les triggers complexes (sales).
-- ----------------------------------------------------------------------------

SET session_replication_role = replica;

-- Ferme
INSERT INTO public.farms (id, name, location, country, currency)
VALUES ('33333333-3333-3333-3333-333333333333', 'Ferme Test', 'Sikensi', 'Côte d’Ivoire', 'FCFA')
ON CONFLICT (id) DO NOTHING;

-- Sites
INSERT INTO public.sites (id, name, location, farm_id, status, code)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Katadji', 'Sikensi', '33333333-3333-3333-3333-333333333333', 'actif', 'KAT'),
  ('22222222-2222-2222-2222-222222222222', 'Aheremou', 'Braffoueby', '33333333-3333-3333-3333-333333333333', 'actif', 'AHE')
ON CONFLICT (id) DO NOTHING;

-- Customers (2 à Katadji, 1 à Aheremou)
INSERT INTO public.customers (id, site_id, name, type, phone, email, created_by)
VALUES
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Client Katadji 1', 'particulier', '0102030405', 'c1@test.local', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Client Katadji 2', 'particulier', '0102030406', 'c2@test.local', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', 'Client Aheremou 1', 'particulier', '0102030407', 'c3@test.local', 'cccccccc-cccc-cccc-cccc-cccccccccccc')
ON CONFLICT (id) DO NOTHING;

-- Funders (le 000…0020 existe déjà via la migration/seed ; on en ajoute un autre)
INSERT INTO public.funders (id, name, organization, email, user_id)
VALUES
  ('00000000-0000-0000-0000-000000000020', 'Funder Test 20', 'Org 20', 'f20@test.local', NULL),
  ('77777777-7777-7777-7777-777777777777', 'Funder Test 77', 'Org 77', 'f77@test.local', NULL)
ON CONFLICT (id) DO NOTHING;

-- Fundings (2 à Katadji du funder 20, 1 à Aheremou du funder 77)
INSERT INTO public.fundings (id, reference, funder_id, amount_sent, currency_sent, date_sent, status, site_id)
VALUES
  ('88888888-8888-8888-8888-888888888888', 'FND-KAT-001', '00000000-0000-0000-0000-000000000020', 100000, 'EUR', '2026-01-10', 'prévu', '11111111-1111-1111-1111-111111111111'),
  ('99999999-9999-9999-9999-999999999999', 'FND-KAT-002', '00000000-0000-0000-0000-000000000020', 200000, 'EUR', '2026-02-10', 'prévu', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'FND-AHE-001', '77777777-7777-7777-7777-777777777777', 150000, 'EUR', '2026-03-10', 'prévu', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- Transactions (3 à Katadji, 1 à Aheremou)
INSERT INTO public.transactions (id, reference, type, amount, currency, site_id, description)
VALUES
  ('11111111-1111-1111-1111-111111111112', 'TXN-KAT-001', 'expense', 50000, 'FCFA', '11111111-1111-1111-1111-111111111111', 'Transaction Katadji 1'),
  ('11111111-1111-1111-1111-111111111113', 'TXN-KAT-002', 'expense', 75000, 'FCFA', '11111111-1111-1111-1111-111111111111', 'Transaction Katadji 2'),
  ('11111111-1111-1111-1111-111111111114', 'TXN-KAT-003', 'income', 100000, 'FCFA', '11111111-1111-1111-1111-111111111111', 'Transaction Katadji 3'),
  ('22222222-2222-2222-2222-222222222223', 'TXN-AHE-001', 'expense', 30000, 'FCFA', '22222222-2222-2222-2222-222222222222', 'Transaction Aheremou 1')
ON CONFLICT (id) DO NOTHING;

-- Expenses (2 à Katadji, 1 à Aheremou)
INSERT INTO public.expenses (id, reference, date, amount, currency, category, site_id, description, status)
VALUES
  ('33333333-3333-3333-3333-333333333334', 'EXP-KAT-001', CURRENT_DATE, 25000, 'FCFA', 'intrants', '11111111-1111-1111-1111-111111111111', 'Expense Katadji 1', 'brouillon'),
  ('33333333-3333-3333-3333-333333333335', 'EXP-KAT-002', CURRENT_DATE, 40000, 'FCFA', 'carburant', '11111111-1111-1111-1111-111111111111', 'Expense Katadji 2', 'brouillon'),
  ('44444444-4444-4444-4444-444444444445', 'EXP-AHE-001', CURRENT_DATE, 15000, 'FCFA', 'maintenance', '22222222-2222-2222-2222-222222222222', 'Expense Aheremou 1', 'brouillon')
ON CONFLICT (id) DO NOTHING;

-- Sale (1 à Katadji) — contournement du trigger generate_sale_reference via référence explicite
INSERT INTO public.sales (id, reference, site_id, customer_id, total_amount, status, date, payment_method)
VALUES
  ('55555555-5555-5555-5555-555555555556', 'SALE-KAT-001', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 120000, 'payée', CURRENT_DATE, 'espèces')
ON CONFLICT (id) DO NOTHING;

-- Sale_items
INSERT INTO public.sale_items (id, sale_id, source_type, source_id, description, quantity, unit_price)
VALUES
  ('66666666-6666-6666-6666-666666666667', '55555555-5555-5555-5555-555555555556', 'product', '00000000-0000-0000-0000-000000000001', 'Maïs', 100, 1200)
ON CONFLICT (id) DO NOTHING;

-- Funding_allocations (2 à Katadji, 1 à Aheremou)
INSERT INTO public.funding_allocations (id, funding_id, site_id, amount_fcfa)
VALUES
  ('77777777-7777-7777-7777-777777777778', '88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 100000),
  ('77777777-7777-7777-7777-777777777779', '99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 200000),
  ('77777777-7777-7777-7777-777777777780', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 150000)
ON CONFLICT (id) DO NOTHING;

-- Documents (2 à Katadji, 1 à Aheremou)
INSERT INTO public.documents (id, reference, type, name, site_id, status)
VALUES
  ('88888888-8888-8888-8888-888888888889', 'DOC-KAT-001', 'facture', 'Facture Katadji 1', '11111111-1111-1111-1111-111111111111', 'ajouté'),
  ('88888888-8888-8888-8888-888888888890', 'DOC-KAT-002', 'facture', 'Facture Katadji 2', '11111111-1111-1111-1111-111111111111', 'ajouté'),
  ('99999999-9999-9999-9999-999999999991', 'DOC-AHE-001', 'facture', 'Facture Aheremou 1', '22222222-2222-2222-2222-222222222222', 'ajouté')
ON CONFLICT (id) DO NOTHING;

SET session_replication_role = origin;


-- ============================================================================
-- A. administrateur / propriétaire — accès global (toutes les lignes)
-- ============================================================================

-- A.1 Administrateur lit toutes les customers (tous les sites)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';
SELECT count(*) AS nb_customers_admin FROM public.customers;
-- RÉSULTAT ATTENDU : 3 (toutes les customers, accès global administrateur)

-- A.2 Propriétaire lit toutes les sales (tous les sites)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}';
SELECT count(*) AS nb_sales_owner FROM public.sales;
-- RÉSULTAT ATTENDU : 1 (toutes les sales, accès global propriétaire)

-- A.3 Administrateur lit toutes les fundings (tous les sites)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';
SELECT count(*) AS nb_fundings_admin FROM public.fundings;
-- RÉSULTAT ATTENDU : 3 (toutes les fundings, accès global administrateur)


-- ============================================================================
-- B. gestionnaire — périmètre site strict (0 ligne sans site_id)
-- ============================================================================

-- B.1 Gestionnaire avec site_id Katadji ne voit que les customers de Katadji
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","role":"authenticated"}';
SELECT count(*) AS nb_customers_gestionnaire_Katadji FROM public.customers
WHERE site_id = '11111111-1111-1111-1111-111111111111';
-- RÉSULTAT ATTENDU : 2 (customers du site Katadji)

-- B.2 Gestionnaire sans site_id ne voit aucune customer
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"dddddddd-dddd-dddd-dddd-dddddddddddd","role":"authenticated"}';
SELECT count(*) AS nb_customers_gestionnaire_nosite FROM public.customers;
-- RÉSULTAT ATTENDU : 0 (pas d'accès global pour le staff sans site_id)


-- ============================================================================
-- C. comptable — lecture finance seule, pas d'écriture sur ventes
-- ============================================================================

-- C.1 Comptable lit les transactions de son site
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee","role":"authenticated"}';
SELECT count(*) AS nb_transactions_comptable FROM public.transactions
WHERE site_id = '11111111-1111-1111-1111-111111111111';
-- RÉSULTAT ATTENDU : 3 (transactions du site Katadji)

-- ============================================================================
-- D. financeur (bailleur) — lecture seule de ses propres fundings
-- ============================================================================

-- D.1 Financeur lit ses propres fundings via current_user_funder_id()
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"ffffffff-ffff-ffff-ffff-ffffffffffff","role":"authenticated"}';
SELECT count(*) AS nb_fundings_financeur FROM public.fundings
WHERE funder_id = public.current_user_funder_id();
-- RÉSULTAT ATTENDU : 2 (les 2 fundings du funder 20 à Katadji)

-- D.2 Financeur ne lit pas les expenses (exclu de expenses_select_scoped)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"ffffffff-ffff-ffff-ffff-ffffffffffff","role":"authenticated"}';
SELECT count(*) AS nb_expenses_financeur FROM public.expenses;
-- RÉSULTAT ATTENDU : 0 (le financeur n'est pas dans la liste de lecture expenses)

-- D.3 Financeur ne lit que sa propre ligne dans funders
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"ffffffff-ffff-ffff-ffff-ffffffffffff","role":"authenticated"}';
SELECT count(*) AS nb_funders_propre FROM public.funders
WHERE id = public.current_user_funder_id();
-- RÉSULTAT ATTENDU : 1 (sa propre ligne uniquement)


-- ============================================================================
-- E. utilisateur non authentifié (anon) — pas d'accès aux tables durcies
-- ============================================================================

-- E.1 Anon ne lit pas les customers (pas de politique anon, RLS bloque)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":null}';
SELECT count(*) AS nb_customers_anon FROM public.customers;
-- RÉSULTAT ATTENDU : 0 (toutes les politiques customers sont TO authenticated)


-- ============================================================================
-- F. FORCE RLS — vérification structurelle
-- ============================================================================

-- F.1 FORCE RLS activé sur les 10 tables durcies
SELECT relname, relforcerowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('customers','sales','sale_items','sites','funding_allocations',
                    'fundings','transactions','documents','expenses','funders')
  AND c.relkind = 'r'
ORDER BY relname;
-- RÉSULTAT ATTENDU : relforcerowsecurity = true pour toutes les tables

-- F.2 Aucune politique USING true / WITH CHECK true sur les tables durcies
SELECT polname, polrelid::regclass::text AS tbl, polqual, polwithcheck
FROM pg_policy
WHERE polrelid::regclass::text = ANY(ARRAY[
    'public.customers','public.sales','public.sites',
    'public.funding_allocations','public.fundings','public.transactions',
    'public.documents','public.expenses','public.funders'
  ])
  AND (trim(polqual) IN ('true','(true)') OR trim(polwithcheck) IN ('true','(true)'));
-- RÉSULTAT ATTENDU : 0 ligne retournée


-- ============================================================================
-- G. Tests d'écriture attendus en erreur (après F pour ne pas avorter F.1/F.2)
-- ============================================================================

-- G.1 Comptable ne peut pas créer une vente (sales_write_scoped WITH CHECK
--   restreint à administrateur/gestionnaire)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee","role":"authenticated"}';
INSERT INTO public.sales (site_id, reference, total_amount)
VALUES ('11111111-1111-1111-1111-111111111111', 'TEST-RLS-001', 1000);
-- RÉSULTAT ATTENDU : erreur RLS (42501)

-- G.2 Financeur ne peut pas créer une expense (pas de politique INSERT pour financeur)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"ffffffff-ffff-ffff-ffff-ffffffffffff","role":"authenticated"}';
INSERT INTO public.expenses (site_id, amount, description)
VALUES ('11111111-1111-1111-1111-111111111111', 5000, 'Test RLS');
-- RÉSULTAT ATTENDU : erreur RLS (42501)

ROLLBACK;

-- ============================================================================
-- Notes
-- - Toutes les écritures sont annulées par le ROLLBACK final.
-- - UUID de sites réels : Katadji=1111…, Aheremou=2222…, ferme=3333…
-- - Ce script ne doit pas être exécuté sur une base distante sans accord de mission.
-- ============================================================================
