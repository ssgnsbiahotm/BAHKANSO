CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = extensions, public;
BEGIN;
SELECT plan(37);

CREATE TEMP TABLE expected_app_tables (name text PRIMARY KEY) ON COMMIT DROP;
INSERT INTO expected_app_tables (name) VALUES
  ('farms'), ('app_users'), ('funders'), ('fundings'), ('bank_accounts'),
  ('cash_accounts'), ('transactions'), ('suppliers'), ('expense_categories'),
  ('expenses'), ('documents'), ('sites'), ('plots'), ('crops'), ('campaigns'),
  ('crop_operations'), ('harvests'), ('animals'), ('animal_lots'),
  ('animal_events'), ('projects'), ('project_steps'), ('inventory_items'),
  ('inventory_movements'), ('inventory_counts'), ('budgets'), ('alerts'),
  ('notifications'), ('audit_logs'), ('site_content'), ('recipes');

SELECT is(
  (SELECT count(*) FROM expected_app_tables),
  31::bigint,
  'the expected full application table inventory is complete'
);
SELECT is(
  (
    SELECT count(*)
    FROM expected_app_tables t
    JOIN pg_class c ON c.oid = to_regclass(format('public.%I', t.name))
    WHERE c.relrowsecurity
  ),
  31::bigint,
  'RLS is enabled on every application table'
);
SELECT is(
  (
    SELECT count(*)
    FROM expected_app_tables t
    WHERE has_any_column_privilege('anon', format('public.%I', t.name), 'SELECT')
  ),
  0::bigint,
  'anon has no effective SELECT privileges on application tables'
);
SELECT is(
  (
    SELECT count(*)
    FROM expected_app_tables t
    WHERE has_any_column_privilege('authenticated', format('public.%I', t.name), 'SELECT')
  ),
  3::bigint,
  'authenticated can select only profiles, funders, and fundings'
);
SELECT is(
  (
    SELECT count(*)
    FROM expected_app_tables t
    WHERE t.name NOT IN ('app_users', 'funders', 'fundings')
      AND has_any_column_privilege('authenticated', format('public.%I', t.name), 'SELECT')
  ),
  0::bigint,
  'all other application domains have no effective SELECT privilege'
);
SELECT is(
  (
    SELECT count(*)
    FROM expected_app_tables t
    WHERE has_table_privilege('anon', format('public.%I', t.name), 'INSERT')
       OR has_table_privilege('anon', format('public.%I', t.name), 'UPDATE')
       OR has_table_privilege('anon', format('public.%I', t.name), 'DELETE')
       OR has_table_privilege('anon', format('public.%I', t.name), 'TRUNCATE')
       OR has_any_column_privilege('anon', format('public.%I', t.name), 'INSERT')
       OR has_any_column_privilege('anon', format('public.%I', t.name), 'UPDATE')
       OR has_table_privilege('authenticated', format('public.%I', t.name), 'INSERT')
       OR has_table_privilege('authenticated', format('public.%I', t.name), 'UPDATE')
       OR has_table_privilege('authenticated', format('public.%I', t.name), 'DELETE')
       OR has_table_privilege('authenticated', format('public.%I', t.name), 'TRUNCATE')
       OR has_any_column_privilege('authenticated', format('public.%I', t.name), 'INSERT')
       OR has_any_column_privilege('authenticated', format('public.%I', t.name), 'UPDATE')
  ),
  0::bigint,
  'anon and authenticated have no table-level write privileges'
);
SELECT is(
  (
    SELECT count(*)
    FROM pg_policies
    WHERE schemaname = 'public' AND 'anon' = ANY (roles)
  ),
  0::bigint,
  'permissive historical anon policies are absent from public tables'
);
SELECT is(
  (
    SELECT count(*)
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        coalesce(qual, '') = 'true'
        OR coalesce(with_check, '') = 'true'
      )
  ),
  0::bigint,
  'broad unconditional public policies are absent after the candidates'
);
SELECT is(
  (
    SELECT count(*)
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND p.proname <> 'handle_new_user'
      AND (
        has_function_privilege('anon', p.oid, 'EXECUTE')
        OR has_function_privilege('authenticated', p.oid, 'EXECUTE')
      )
  ),
  0::bigint,
  'no other public SECURITY DEFINER function is executable by client roles'
);
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger t
    WHERE t.tgrelid = 'auth.users'::regclass
      AND t.tgname = 'on_auth_user_created'
      AND NOT t.tgisinternal
      AND t.tgfoid = 'public.handle_new_user()'::regprocedure
  ),
  'the real Auth profile trigger remains installed'
);
SELECT ok(
  NOT has_function_privilege('anon', 'public.generate_expense_reference()', 'EXECUTE'),
  'anon cannot execute the reference generator'
);
SELECT ok(
  has_function_privilege('authenticated', 'public.generate_expense_reference()', 'EXECUTE'),
  'the authenticated reference-generator grant from migration 007 remains'
);
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  $$SELECT public.generate_expense_reference()$$,
  '42501', NULL, 'the invoker reference generator cannot read locked expense data'
);
RESET ROLE;
SELECT ok(
  NOT has_function_privilege('authenticated', 'public.handle_new_user()', 'EXECUTE'),
  'the trigger function is not directly executable by authenticated clients'
);
SET LOCAL ROLE anon;
SELECT throws_ok(
  $$SELECT * FROM public.site_content$$,
  '42501', NULL, 'anonymous access to public landing-page content is denied by this candidate set'
);
SELECT throws_ok(
  $$SELECT * FROM public.fundings$$,
  '42501', NULL, 'anon receives an explicit privilege refusal on funding'
);
RESET ROLE;
SELECT is(
  (
    SELECT count(*)
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname IN (
        'public_read_app_assets',
        'auth_insert_app_assets',
        'auth_update_app_assets',
        'auth_delete_app_assets'
      )
  ),
  4::bigint,
  'the historical app-assets Storage policies are present for separate review'
);
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'public_read_app_assets'
      AND 'anon' = ANY (roles)
  ),
  'app-assets objects remain publicly readable under migration 009'
);
SELECT is(
  (
    SELECT count(DISTINCT view_class.oid)
    FROM pg_class view_class
    JOIN pg_namespace view_ns ON view_ns.oid = view_class.relnamespace
    JOIN pg_rewrite rw ON rw.ev_class = view_class.oid
    JOIN pg_depend d ON d.objid = rw.oid AND d.refclassid = 'pg_class'::regclass
    JOIN pg_class source_table ON source_table.oid = d.refobjid
    JOIN expected_app_tables t ON t.name = source_table.relname
    WHERE view_ns.nspname = 'public' AND view_class.relkind IN ('v', 'm')
  ),
  0::bigint,
  'the reconstructed migration set has no public views over application tables'
);

SELECT set_config(
  'request.jwt.claim.sub',
  (SELECT id::text FROM auth.users WHERE email = 'full-owner@bahkanso.example.test'),
  true
);
SET LOCAL ROLE authenticated;
SELECT is(
  (SELECT count(*) FROM public.fundings),
  1::bigint,
  'active owner sees the synthetic funding row'
);
SELECT is(
  (
    SELECT count(*)
    FROM public.fundings funding
    JOIN public.funders funder ON funder.id = funding.funder_id
    WHERE funder.name = 'Financeur complet synthétique'
  ),
  1::bigint,
  'owner sees only the permitted funder name through the funding relation'
);
SELECT throws_ok(
  $$UPDATE public.fundings SET comment = 'forbidden' WHERE reference = 'FULL-SCHEMA-FND-001'$$,
  '42501', NULL, 'owner receives an explicit UPDATE privilege refusal on funding'
);
SELECT throws_ok(
  $$DELETE FROM public.fundings WHERE reference = 'FULL-SCHEMA-FND-001'$$,
  '42501', NULL, 'owner receives an explicit DELETE privilege refusal on funding'
);
SELECT ok(
  NOT has_column_privilege('authenticated', 'public.app_users', 'role', 'UPDATE'),
  'authenticated cannot update the profile role column'
);
SELECT throws_ok(
  $$UPDATE public.app_users SET role = 'administrateur' WHERE auth_id = (SELECT auth.uid())$$,
  '42501', NULL, 'owner cannot self-assign a privileged role'
);
SELECT throws_ok(
  $$UPDATE public.app_users SET active = false WHERE auth_id = (SELECT auth.uid())$$,
  '42501', NULL, 'owner cannot change profile activation'
);
SELECT throws_ok(
  $$UPDATE public.app_users SET auth_id = NULL WHERE auth_id = (SELECT auth.uid())$$,
  '42501', NULL, 'owner cannot alter the Auth link'
);
RESET ROLE;
SELECT is(
  (
    SELECT count(*)
    FROM public.app_users
    WHERE email = 'full-owner@bahkanso.example.test'
      AND role = 'propriétaire' AND active IS TRUE AND auth_id IS NOT NULL
  ),
  1::bigint,
  'rejected profile updates leave role, active, and auth_id unchanged'
);
SELECT is(
  (SELECT comment FROM public.fundings WHERE reference = 'FULL-SCHEMA-FND-001'),
  'Donnée synthétique pour validation locale',
  'rejected funding writes leave the stored row unchanged'
);

SELECT set_config(
  'request.jwt.claim.sub',
  (SELECT id::text FROM auth.users WHERE email = 'full-admin@bahkanso.example.test'),
  true
);
SET LOCAL ROLE authenticated;
SELECT is(
  (SELECT count(*) FROM public.fundings),
  0::bigint,
  'technical administrator has no implicit funding access'
);
RESET ROLE;

SELECT set_config(
  'request.jwt.claim.sub',
  (SELECT id::text FROM auth.users WHERE email = 'full-funder@bahkanso.example.test'),
  true
);
SET LOCAL ROLE authenticated;
SELECT is(
  (SELECT count(*) FROM public.fundings),
  0::bigint,
  'unlinked funder has no funding access'
);
RESET ROLE;

SELECT set_config(
  'request.jwt.claim.sub',
  (SELECT id::text FROM auth.users WHERE email = 'full-inactive@bahkanso.example.test'),
  true
);
SET LOCAL ROLE authenticated;
SELECT is(
  (SELECT count(*) FROM public.fundings),
  0::bigint,
  'inactive owner has no funding access'
);
RESET ROLE;

SELECT set_config(
  'request.jwt.claim.sub',
  (SELECT id::text FROM auth.users WHERE email = 'full-unknown@bahkanso.example.test'),
  true
);
SET LOCAL ROLE authenticated;
SELECT is(
  (SELECT count(*) FROM public.fundings),
  0::bigint,
  'unknown role has no funding access'
);
RESET ROLE;

SELECT set_config(
  'request.jwt.claim.sub',
  (SELECT id::text FROM auth.users WHERE email = 'full-no-profile@bahkanso.example.test'),
  true
);
SET LOCAL ROLE authenticated;
SELECT is(
  (SELECT count(*) FROM public.fundings),
  0::bigint,
  'Auth identity without an app profile has no funding access'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT throws_ok(
  $$UPDATE public.audit_logs SET action = 'forbidden' WHERE id = '31000000-0000-4000-8000-000000000001'$$,
  '42501', NULL, 'authenticated receives an explicit UPDATE refusal on audit'
);
SELECT throws_ok(
  $$DELETE FROM public.audit_logs WHERE id = '31000000-0000-4000-8000-000000000001'$$,
  '42501', NULL, 'authenticated receives an explicit DELETE refusal on audit'
);
RESET ROLE;
SELECT is(
  (SELECT action FROM public.audit_logs WHERE id = '31000000-0000-4000-8000-000000000001'),
  'Événement synthétique de validation',
  'rejected audit writes leave the event unchanged'
);

SELECT * FROM finish();
ROLLBACK;
