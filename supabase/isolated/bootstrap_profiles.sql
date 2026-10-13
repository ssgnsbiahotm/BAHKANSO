UPDATE public.app_users
SET role = CASE email
  WHEN 'owner@bahkanso.example.test' THEN 'propriétaire'
  WHEN 'admin@bahkanso.example.test' THEN 'administrateur'
  WHEN 'funder@bahkanso.example.test' THEN 'financeur'
  WHEN 'inactive@bahkanso.example.test' THEN 'propriétaire'
  WHEN 'unknown-role@bahkanso.example.test' THEN 'role_inconnu'
  WHEN 'owner-mission05@bahkanso.example.test' THEN 'propriétaire'
  WHEN 'admin-mission05@bahkanso.example.test' THEN 'administrateur'
  WHEN 'funder-mission05@bahkanso.example.test' THEN 'financeur'
  WHEN 'inactive-mission05@bahkanso.example.test' THEN 'propriétaire'
  WHEN 'unknown-role-mission05@bahkanso.example.test' THEN 'role_inconnu'
END,
active = email NOT IN (
  'inactive@bahkanso.example.test',
  'inactive-mission05@bahkanso.example.test'
)
WHERE email IN (
  'owner@bahkanso.example.test',
  'admin@bahkanso.example.test',
  'funder@bahkanso.example.test',
  'inactive@bahkanso.example.test',
  'unknown-role@bahkanso.example.test',
  'owner-mission05@bahkanso.example.test',
  'admin-mission05@bahkanso.example.test',
  'funder-mission05@bahkanso.example.test',
  'inactive-mission05@bahkanso.example.test',
  'unknown-role-mission05@bahkanso.example.test'
);

DO $check$
BEGIN
  IF (SELECT count(*) FROM public.app_users WHERE email IN (
    'owner@bahkanso.example.test',
    'admin@bahkanso.example.test',
    'funder@bahkanso.example.test',
    'inactive@bahkanso.example.test',
    'unknown-role@bahkanso.example.test',
    'owner-mission05@bahkanso.example.test',
    'admin-mission05@bahkanso.example.test',
    'funder-mission05@bahkanso.example.test',
    'inactive-mission05@bahkanso.example.test',
    'unknown-role-mission05@bahkanso.example.test'
  )) <> 10 THEN
    RAISE EXCEPTION 'Expected ten synthetic Auth-linked profiles before applying candidates';
  END IF;
END
$check$;
