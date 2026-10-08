CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = extensions, public;
BEGIN;
SELECT plan(34);

SET LOCAL ROLE anon;
SELECT throws_ok(
  $$SELECT * FROM public.fundings$$,
  '42501', NULL, 'anon cannot read fundings'
);
SELECT throws_ok(
  $$SELECT * FROM public.funders$$,
  '42501', NULL, 'anon cannot read funders'
);
SELECT throws_ok(
  $$INSERT INTO public.fundings (id, amount_sent, date_sent) VALUES ('20000000-0000-4000-8000-000000000002', 1, DATE '2026-01-01')$$,
  '42501', NULL, 'anon cannot insert funding'
);
SELECT throws_ok(
  $$UPDATE public.fundings SET comment = 'forbidden' WHERE id = '20000000-0000-4000-8000-000000000001'$$,
  '42501', NULL, 'anon cannot update funding'
);
SELECT throws_ok(
  $$DELETE FROM public.fundings WHERE id = '20000000-0000-4000-8000-000000000001'$$,
  '42501', NULL, 'anon cannot delete funding'
);
SELECT throws_ok(
  $$UPDATE public.audit_logs SET action = 'forbidden' WHERE id = '30000000-0000-4000-8000-000000000001'$$,
  '42501', NULL, 'anon cannot update audit'
);
SELECT throws_ok(
  $$DELETE FROM public.audit_logs WHERE id = '30000000-0000-4000-8000-000000000001'$$,
  '42501', NULL, 'anon cannot delete audit'
);

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '40000000-0000-4000-8000-000000000001',
  true
);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT is((SELECT count(*) FROM public.fundings), 1::bigint, 'active owner reads the synthetic funding');
SELECT is((SELECT count(*) FROM public.funders), 1::bigint, 'active owner reads the linked funder name');
SELECT is((SELECT count(*) FROM public.app_users), 1::bigint, 'owner can read only the linked profile');
SELECT lives_ok(
  $$UPDATE public.app_users SET name = 'Owner Updated' WHERE auth_id = auth.uid()$$,
  'owner can update a personal contact field'
);
SELECT is(
  (SELECT name FROM public.app_users WHERE auth_id = auth.uid()),
  'Owner Updated',
  'personal contact update is persisted'
);
SELECT throws_ok(
  $$UPDATE public.app_users SET role = 'administrateur' WHERE auth_id = auth.uid()$$,
  '42501', NULL, 'owner cannot self-assign a role'
);
SELECT throws_ok(
  $$UPDATE public.app_users SET active = false WHERE auth_id = auth.uid()$$,
  '42501', NULL, 'owner cannot change own active state'
);
SELECT throws_ok(
  $$INSERT INTO public.fundings (id, amount_sent, date_sent) VALUES ('20000000-0000-4000-8000-000000000003', 1, DATE '2026-01-01')$$,
  '42501', NULL, 'owner cannot insert funding'
);
SELECT throws_ok(
  $$UPDATE public.fundings SET comment = 'forbidden' WHERE id = '20000000-0000-4000-8000-000000000001'$$,
  '42501', NULL, 'owner cannot update funding'
);
SELECT throws_ok(
  $$DELETE FROM public.fundings WHERE id = '20000000-0000-4000-8000-000000000001'$$,
  '42501', NULL, 'owner cannot delete funding'
);
SELECT throws_ok(
  $$UPDATE public.audit_logs SET action = 'forbidden' WHERE id = '30000000-0000-4000-8000-000000000001'$$,
  '42501', NULL, 'owner cannot update audit'
);
SELECT throws_ok(
  $$DELETE FROM public.audit_logs WHERE id = '30000000-0000-4000-8000-000000000001'$$,
  '42501', NULL, 'owner cannot delete audit'
);
SELECT is((SELECT count(*) FROM public.fundings), 1::bigint, 'forbidden writes leave funding rows unchanged');
SELECT is(
  (SELECT comment FROM public.fundings WHERE id = '20000000-0000-4000-8000-000000000001'),
  'Fixture synthétique locale',
  'forbidden writes leave the funding contents unchanged'
);
RESET ROLE;
SELECT is(
  (SELECT action FROM public.audit_logs WHERE id = '30000000-0000-4000-8000-000000000001'),
  'Fixture synthétique',
  'forbidden writes leave the audit record unchanged'
);

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '40000000-0000-4000-8000-000000000002',
  true
);
SELECT is((SELECT count(*) FROM public.fundings), 0::bigint, 'technical admin cannot read funding');
SELECT is((SELECT count(*) FROM public.funders), 0::bigint, 'technical admin cannot read funders');
SELECT throws_ok(
  $$SELECT * FROM public.audit_logs$$,
  '42501', NULL, 'technical admin cannot read audit by default'
);

SELECT set_config(
  'request.jwt.claim.sub',
  '40000000-0000-4000-8000-000000000003',
  true
);
SELECT is((SELECT count(*) FROM public.fundings), 0::bigint, 'unlinked funder cannot read funding');
SELECT is((SELECT count(*) FROM public.funders), 0::bigint, 'unlinked funder cannot read funders');

SELECT set_config(
  'request.jwt.claim.sub',
  '40000000-0000-4000-8000-000000000004',
  true
);
SELECT is((SELECT count(*) FROM public.fundings), 0::bigint, 'inactive owner cannot read funding');
SELECT is((SELECT count(*) FROM public.funders), 0::bigint, 'inactive owner cannot read funders');

SELECT set_config(
  'request.jwt.claim.sub',
  '40000000-0000-4000-8000-000000000005',
  true
);
SELECT is((SELECT count(*) FROM public.fundings), 0::bigint, 'unknown role cannot read funding');
SELECT is((SELECT count(*) FROM public.funders), 0::bigint, 'unknown role cannot read funders');

RESET ROLE;
SELECT lives_ok(
  $$INSERT INTO auth.users (
    id, aud, role, email, confirmed_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, created_at, updated_at
  ) VALUES (
    '40000000-0000-4000-8000-000000000006',
    'authenticated',
    'authenticated',
    'new-user@bahkanso.example.test',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"New synthetic user"}',
    false,
    now(),
    now()
  )$$,
  'Auth profile trigger accepts a new synthetic user'
);
SELECT is(
  (SELECT role FROM public.app_users WHERE auth_id = '40000000-0000-4000-8000-000000000006'),
  'pending',
  'new Auth user receives a pending role'
);
SELECT is(
  (SELECT active FROM public.app_users WHERE auth_id = '40000000-0000-4000-8000-000000000006'),
  false,
  'new Auth user receives an inactive profile'
);

SELECT * FROM finish();
ROLLBACK;
