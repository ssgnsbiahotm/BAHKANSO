INSERT INTO auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, created_at, updated_at
)
VALUES
  ('40000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'owner@bahkanso.example.test', '{"provider":"email","providers":["email"]}', '{"name":"Owner synthetic"}', false, now(), now()),
  ('40000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'admin@bahkanso.example.test', '{"provider":"email","providers":["email"]}', '{"name":"Admin synthetic"}', false, now(), now()),
  ('40000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'funder@bahkanso.example.test', '{"provider":"email","providers":["email"]}', '{"name":"Funder synthetic"}', false, now(), now()),
  ('40000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'inactive@bahkanso.example.test', '{"provider":"email","providers":["email"]}', '{"name":"Inactive synthetic"}', false, now(), now()),
  ('40000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'unknown-role@bahkanso.example.test', '{"provider":"email","providers":["email"]}', '{"name":"Unknown role synthetic"}', false, now(), now())
ON CONFLICT (id) DO UPDATE
SET aud = EXCLUDED.aud,
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    raw_app_meta_data = EXCLUDED.raw_app_meta_data,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = EXCLUDED.updated_at;
