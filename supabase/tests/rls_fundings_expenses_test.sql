-- supabase/tests/rls_fundings_expenses_test.sql
-- Preuve que les politiques RLS actuelles sur fundings, expenses et app_users
-- sont TROP PERMISSIVES (USING (true) / WITH CHECK (true)).
-- Ces tests DOIVENT ÉCHOUER contre les politiques actuelles.

begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

-- === Setup : deux utilisateurs, deux funders, deux fundings ===
-- Site utilisé par tout le setup (filtre RLS par site).
insert into sites (id, name) values ('99999999-9999-9999-9999-999999999999', 'Site Test');

-- Chaque app_user a un site_id (filtre RLS par site).
-- Le sub du JWT (auth.uid()) simule directement l'id de l'app_user.
insert into app_users (id, name, email, role, site_id) values
  ('11111111-1111-1111-1111-111111111111', 'Admin Test', 'admin@test', 'administrateur', '99999999-9999-9999-9999-999999999999'),
  ('22222222-2222-2222-2222-222222222222', 'Financeur Test', 'financeur@test', 'financeur', '99999999-9999-9999-9999-999999999999'),
  ('88888888-8888-8888-8888-888888888888', 'Comptable Test', 'comptable@test', 'comptable', '99999999-9999-9999-9999-999999999999');

-- Chaque funder a un user_id = id de l'app_user financeur (lien RLS funder_id)
insert into funders (id, name, user_id) values
  ('33333333-3333-3333-3333-333333333333', 'Funder A', '22222222-2222-2222-2222-222222222222'),
  ('44444444-4444-4444-4444-444444444444', 'Funder B', NULL);

-- Fundings : 1 pour le funder du financeur (visible par lui), 1 pour un autre funder (invisible)
-- Tous du même site (site_id = 9999...) pour que l'admin voie les 2
insert into fundings (id, reference, funder_id, amount_sent, date_sent, status, site_id) values
  ('55555555-5555-5555-5555-555555555555', 'FUND-001', '33333333-3333-3333-3333-333333333333', 1000, '2026-01-01', 'prévu', '99999999-9999-9999-9999-999999999999'),
  ('66666666-6666-6666-6666-666666666666', 'FUND-002', '44444444-4444-4444-4444-444444444444', 2000, '2026-01-02', 'prévu', '99999999-9999-9999-9999-999999999999');

-- Expenses : 1 expense du site, créée par le comptable (role comptable => lecture seule)
insert into expenses (id, reference, date, amount, status, site_id, created_by) values
  ('77777777-7777-7777-7777-777777777777', 'DEP-001', '2026-01-01', 500, 'brouillon', '99999999-9999-9999-9999-999999999999', '88888888-8888-8888-8888-888888888888');

-- Contexte par défaut : financeur authentifié (sub = auth_id du financeur)
set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

-- === ASSERTION 1 : le financeur ne doit voir QUE son funding ===
-- Résultat actuel : il voit TOUS les fundings (USING (true)) -> le test ÉCHOUE
select results_eq(
  'select count(*) from fundings',
  ARRAY[1::bigint],
  'financeur ne voit que son funding (FAILLE : voit tous les fundings)'
);

-- === ASSERTION 2 : le financeur ne doit PAS pouvoir insérer dans fundings ===
-- SQLSTATE 42501 confirmé = blocage RLS réel. Le message varie selon pgTAP,
-- on ne vérifie que le code (message NULL = accepte n'importe quel libellé).
select throws_ok(
  $$insert into fundings (reference, funder_id, amount_sent, date_sent, status)
     values ('FUND-003', '44444444-4444-4444-4444-444444444444', 500, '2026-01-03', 'prevu')$$,
  '42501',
  NULL,
  'financeur ne peut pas écrire dans fundings dun autre funder (RLS 42501)'
);

-- === ASSERTION 3 : le comptable ne doit PAS pouvoir modifier expenses ===
-- Résultat actuel : il peut modifier (USING (true)) -> le test ÉCHOUE
-- Contexte : comptable authentifié (sub = auth_id du comptable)
set local request.jwt.claim.sub = '88888888-8888-8888-8888-888888888888';
select throws_ok(
  $$update expenses set amount = 9999 where id = '77777777-7777-7777-7777-777777777777'$$,
  '42501',
  NULL,
  'comptable ne peut pas modifier expenses (RLS write bloquee)'
);

-- === ASSERTION 4 : l'administrateur DOIT voir tous les fundings ===
-- Résultat actuel : il voit tous (USING (true)) -> le test PASSE
-- On ne compte que les deux fundings insérés par le setup du test :
-- les 5 fundings de seed polluent le comptage brut (7 au total).
-- Contexte : administrateur authentifié (sub = auth_id de l'admin)
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select results_eq(
  $$select count(*) from fundings
   where id in (
     '55555555-5555-5555-5555-555555555555',
     '66666666-6666-6666-6666-666666666666'
   )$$,
  ARRAY[2::bigint],
  'administrateur voit les deux fundings du test'
);

select * from finish();
rollback;
