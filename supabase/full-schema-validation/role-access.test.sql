CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = extensions, public;
BEGIN;
SELECT plan(45);
SELECT set_config(
  'test.owner_id',
  (SELECT auth_id::text FROM public.app_users WHERE email = 'full-owner@bahkanso.example.test'),
  true
);
SELECT set_config(
  'test.admin_id',
  (SELECT auth_id::text FROM public.app_users WHERE email = 'full-admin@bahkanso.example.test'),
  true
);
SELECT set_config(
  'test.manager_id',
  (SELECT auth_id::text FROM public.app_users WHERE email = 'full-manager@bahkanso.example.test'),
  true
);
SELECT set_config(
  'test.agriculture_id',
  (SELECT auth_id::text FROM public.app_users WHERE email = 'full-agriculture@bahkanso.example.test'),
  true
);
SELECT set_config(
  'test.livestock_id',
  (SELECT auth_id::text FROM public.app_users WHERE email = 'full-livestock@bahkanso.example.test'),
  true
);
SELECT set_config(
  'test.projects_id',
  (SELECT auth_id::text FROM public.app_users WHERE email = 'full-projects@bahkanso.example.test'),
  true
);
SELECT set_config(
  'test.funder_id',
  (SELECT auth_id::text FROM public.app_users WHERE email = 'full-funder@bahkanso.example.test'),
  true
);
SELECT set_config(
  'test.inactive_id',
  (SELECT auth_id::text FROM public.app_users WHERE email = 'full-inactive@bahkanso.example.test'),
  true
);
SELECT set_config(
  'test.unknown_id',
  (SELECT auth_id::text FROM public.app_users WHERE email = 'full-unknown@bahkanso.example.test'),
  true
);
SELECT set_config(
  'test.no_profile_id',
  (SELECT id::text FROM auth.users WHERE email = 'full-no-profile@bahkanso.example.test'),
  true
);
SELECT set_config(
  'test.pending_id',
  (SELECT auth_id::text FROM public.app_users WHERE email = 'full-pending@bahkanso.example.test'),
  true
);

SET LOCAL ROLE anon;
SELECT throws_ok(
  $$SELECT * FROM public.fundings$$,
  '42501', NULL, 'anonymous users cannot read business data'
);
SELECT throws_ok(
  $$INSERT INTO public.fundings (id, amount_sent, date_sent) VALUES ('51000000-0000-4000-8000-000000000001', 1, DATE '2026-01-01')$$,
  '42501', NULL, 'anonymous users cannot create a funding'
);
SELECT throws_ok(
  $$SELECT * FROM public.audit_logs$$,
  '42501', NULL, 'anonymous users cannot read the audit trail'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('test.inactive_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT is((SELECT count(*) FROM public.fundings), 0::bigint, 'inactive profiles cannot read business data');
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('test.unknown_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT is((SELECT count(*) FROM public.fundings), 0::bigint, 'unknown roles cannot read business data');
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('test.no_profile_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT is((SELECT count(*) FROM public.fundings), 0::bigint, 'Auth users without an application profile cannot read business data');
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('test.pending_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT is((SELECT count(*) FROM public.fundings), 0::bigint, 'pending signups cannot read business data');
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('test.owner_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT is((SELECT count(*) FROM public.fundings), 1::bigint, 'owner can read all fundings');
SELECT is((SELECT count(*) FROM public.plots), 1::bigint, 'owner can read agriculture data');
SELECT is((SELECT count(*) FROM public.animal_lots), 1::bigint, 'owner can read livestock data');
SELECT throws_ok(
  $$INSERT INTO public.expenses (id, reference, amount, category) VALUES ('52000000-0000-4000-8000-000000000001', 'OWNER-DENIED', 1, 'Test')$$,
  '42501', NULL, 'owner cannot create business records through direct API writes'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('test.admin_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT is((SELECT count(*) FROM public.app_users), 10::bigint, 'administrator can list linked profiles');
SELECT lives_ok(
  $$UPDATE public.plots SET name = 'Parcelle administrée' WHERE id = '41000000-0000-4000-8000-000000000001'$$,
  'administrator can update operational records'
);
SELECT lives_ok(
  $$UPDATE public.app_users SET role = 'gestionnaire' WHERE email = 'full-unknown@bahkanso.example.test'$$,
  'administrator can assign a role to another profile'
);
SELECT throws_ok(
  $$UPDATE public.app_users SET role = 'propriétaire' WHERE auth_id = auth.uid()$$,
  '42501', NULL, 'administrator cannot change their own role'
);
SELECT throws_ok(
  $$UPDATE public.audit_logs SET action = 'tampered' WHERE id = '31000000-0000-4000-8000-000000000001'$$,
  '42501', NULL, 'administrator cannot update audit events'
);
SELECT throws_ok(
  $$DELETE FROM public.audit_logs WHERE id = '31000000-0000-4000-8000-000000000001'$$,
  '42501', NULL, 'administrator cannot delete audit events'
);
SELECT throws_ok(
  $$INSERT INTO public.audit_logs (action) VALUES ('forged')$$,
  '42501', NULL, 'administrator cannot forge audit events directly'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('test.manager_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT is((SELECT count(*) FROM public.fundings), 1::bigint, 'manager can prepare and read fundings');
SELECT is((SELECT count(*) FROM public.expenses), 1::bigint, 'manager can read expenses');
SELECT throws_ok(
  $$UPDATE public.expenses SET status = 'validée' WHERE id = '44000000-0000-4000-8000-000000000001'$$,
  '42501', NULL, 'manager cannot validate an expense'
);
SELECT throws_ok(
  $$INSERT INTO public.expenses (id, reference, amount, category, status) VALUES ('53000000-0000-4000-8000-000000000001', 'MANAGER-VALIDATION-DENIED', 1, 'Test', 'validée')$$,
  '42501', NULL, 'manager cannot create a pre-validated expense'
);
SELECT lives_ok(
  $$INSERT INTO public.expenses (id, reference, amount, category, status) VALUES ('53000000-0000-4000-8000-000000000002', 'MANAGER-DRAFT', 1, 'Test', 'brouillon')$$,
  'manager can prepare a draft expense'
);
SELECT lives_ok(
  $$UPDATE public.expenses SET status = 'en attente' WHERE id = '53000000-0000-4000-8000-000000000002'$$,
  'manager can submit a draft expense for validation'
);
SELECT throws_ok(
  $$UPDATE public.expenses SET status = 'rejetée' WHERE id = '53000000-0000-4000-8000-000000000002'$$,
  '42501', NULL, 'manager cannot reject a submitted expense'
);
SELECT throws_ok(
  $$UPDATE public.documents SET status = 'vérifié' WHERE id = '46000000-0000-4000-8000-000000000001'$$,
  '42501', NULL, 'manager cannot verify a document'
);
SELECT throws_ok(
  $$UPDATE public.fundings SET status = 'reçu' WHERE id = '21000000-0000-4000-8000-000000000001'$$,
  '42501', NULL, 'manager cannot mark a funding as received'
);
SELECT is(
  (WITH changed AS (
    UPDATE public.transactions SET description = 'manager changed ledger'
    WHERE id = '45000000-0000-4000-8000-000000000001' RETURNING id
  ) SELECT count(*) FROM changed),
  0::bigint,
  'manager cannot mutate posted treasury transactions'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('test.agriculture_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT is((SELECT count(*) FROM public.plots), 1::bigint, 'agriculture lead can read plots');
SELECT is((SELECT count(*) FROM public.animal_lots), 0::bigint, 'agriculture lead cannot read livestock');
SELECT lives_ok(
  $$INSERT INTO public.plots (id, name, area_hectares) VALUES ('54000000-0000-4000-8000-000000000001', 'Nouvelle parcelle', 1)$$,
  'agriculture lead can create a plot'
);
SELECT throws_ok(
  $$INSERT INTO public.animal_lots (id, identifier, species, count) VALUES ('54000000-0000-4000-8000-000000000002', 'AGRI-DENIED', 'Bovin', 1)$$,
  '42501', NULL, 'agriculture lead cannot create livestock records'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('test.livestock_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT is((SELECT count(*) FROM public.animal_lots), 1::bigint, 'livestock lead can read animal lots');
SELECT is((SELECT count(*) FROM public.plots), 0::bigint, 'livestock lead cannot read plots');
SELECT lives_ok(
  $$INSERT INTO public.animal_lots (id, identifier, species, count) VALUES ('55000000-0000-4000-8000-000000000001', 'LOT-NEW', 'Bovin', 1)$$,
  'livestock lead can create an animal lot'
);
SELECT throws_ok(
  $$INSERT INTO public.plots (id, name, area_hectares) VALUES ('55000000-0000-4000-8000-000000000002', 'ELEVAGE-DENIED', 1)$$,
  '42501', NULL, 'livestock lead cannot create agriculture records'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('test.projects_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT is((SELECT count(*) FROM public.projects), 1::bigint, 'project lead can read projects');
SELECT lives_ok(
  $$INSERT INTO public.projects (id, name, initial_budget) VALUES ('56000000-0000-4000-8000-000000000001', 'Nouveau projet', 1)$$,
  'project lead can create projects'
);
SELECT throws_ok(
  $$INSERT INTO public.plots (id, name, area_hectares) VALUES ('56000000-0000-4000-8000-000000000002', 'CHANTIER-DENIED', 1)$$,
  '42501', NULL, 'project lead cannot create agriculture records'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('test.funder_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT is((SELECT count(*) FROM public.fundings), 1::bigint, 'financeur can read linked funding');
SELECT is(
  (SELECT count(*) FROM public.funders WHERE id = '11000000-0000-4000-8000-000000000001'),
  1::bigint,
  'financeur can read their own funder record'
);
SELECT is(
  (SELECT count(*) FROM public.funders WHERE id = '11000000-0000-4000-8000-000000000002'),
  0::bigint,
  'financeur cannot read another funder'
);
SELECT is((SELECT count(*) FROM public.expenses), 0::bigint, 'financeur cannot read expenses');
SELECT throws_ok(
  $$INSERT INTO public.fundings (id, amount_sent, date_sent) VALUES ('57000000-0000-4000-8000-000000000001', 1, DATE '2026-01-01')$$,
  '42501', NULL, 'financeur cannot create a funding'
);
RESET ROLE;

SELECT is(
  (
    SELECT actor_id
    FROM public.audit_logs
    WHERE object_type = 'plots'
      AND object_id = '54000000-0000-4000-8000-000000000001'
    ORDER BY created_at DESC
    LIMIT 1
  ),
  (SELECT id FROM public.app_users WHERE email = 'full-agriculture@bahkanso.example.test'),
  'database audit trigger records the authenticated actor'
);

SELECT * FROM finish();
ROLLBACK;
