INSERT INTO auth.users (
  id, aud, role, email, encrypted_password, confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  synthetic.email,
  '',
  now(),
  '{}'::jsonb,
  jsonb_build_object('name', 'Compte synthétique full-schema'),
  now(),
  now()
FROM (VALUES
  ('full-owner@bahkanso.example.test'),
  ('full-admin@bahkanso.example.test'),
  ('full-funder@bahkanso.example.test'),
  ('full-manager@bahkanso.example.test'),
  ('full-agriculture@bahkanso.example.test'),
  ('full-livestock@bahkanso.example.test'),
  ('full-projects@bahkanso.example.test'),
  ('full-inactive@bahkanso.example.test'),
  ('full-unknown@bahkanso.example.test'),
  ('full-no-profile@bahkanso.example.test'),
  ('full-pending@bahkanso.example.test')
) AS synthetic(email)
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users existing WHERE existing.email = synthetic.email
);

INSERT INTO public.funders (id, name, organization, email)
VALUES (
  '11000000-0000-4000-8000-000000000001',
  'Financeur complet synthétique',
  'Organisation locale synthétique',
  'full-funder-record@bahkanso.example.test'
), (
  '11000000-0000-4000-8000-000000000002',
  'Autre financeur synthétique',
  'Autre organisation locale',
  'other-funder-record@bahkanso.example.test'
);

UPDATE public.app_users
SET role = CASE email
  WHEN 'full-owner@bahkanso.example.test' THEN 'propriétaire'
  WHEN 'full-admin@bahkanso.example.test' THEN 'administrateur'
  WHEN 'full-funder@bahkanso.example.test' THEN 'financeur'
  WHEN 'full-manager@bahkanso.example.test' THEN 'gestionnaire'
  WHEN 'full-agriculture@bahkanso.example.test' THEN 'responsable_agricole'
  WHEN 'full-livestock@bahkanso.example.test' THEN 'responsable_élevage'
  WHEN 'full-projects@bahkanso.example.test' THEN 'responsable_chantier'
  WHEN 'full-inactive@bahkanso.example.test' THEN 'propriétaire'
  WHEN 'full-unknown@bahkanso.example.test' THEN 'role_inconnu'
  WHEN 'full-no-profile@bahkanso.example.test' THEN 'gestionnaire'
END,
active = email <> 'full-inactive@bahkanso.example.test',
funder_id = CASE
  WHEN email = 'full-funder@bahkanso.example.test'
    THEN '11000000-0000-4000-8000-000000000001'::uuid
  ELSE NULL
END
WHERE email IN (
  'full-owner@bahkanso.example.test',
  'full-admin@bahkanso.example.test',
  'full-funder@bahkanso.example.test',
  'full-manager@bahkanso.example.test',
  'full-agriculture@bahkanso.example.test',
  'full-livestock@bahkanso.example.test',
  'full-projects@bahkanso.example.test',
  'full-inactive@bahkanso.example.test',
  'full-unknown@bahkanso.example.test',
  'full-no-profile@bahkanso.example.test'
);

DO $synthetic_profiles$
BEGIN
  IF (
    SELECT count(*)
    FROM public.app_users
    WHERE email IN (
      'full-owner@bahkanso.example.test',
      'full-admin@bahkanso.example.test',
      'full-funder@bahkanso.example.test',
      'full-manager@bahkanso.example.test',
      'full-agriculture@bahkanso.example.test',
      'full-livestock@bahkanso.example.test',
      'full-projects@bahkanso.example.test',
      'full-inactive@bahkanso.example.test',
      'full-unknown@bahkanso.example.test',
      'full-no-profile@bahkanso.example.test'
    )
      AND auth_id IS NOT NULL
  ) <> 10 THEN
    RAISE EXCEPTION 'Expected ten synthetic Auth-linked profiles';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.app_users
    WHERE email = 'full-admin@bahkanso.example.test'
      AND role = 'administrateur' AND active IS TRUE AND auth_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'The candidate requires an active synthetic linked administrator';
  END IF;
END
$synthetic_profiles$;

DELETE FROM public.app_users
WHERE email = 'full-no-profile@bahkanso.example.test';

INSERT INTO public.fundings (
  id, reference, funder_id, amount_sent, date_sent, comment
)
VALUES (
  '21000000-0000-4000-8000-000000000001',
  'FULL-SCHEMA-FND-001',
  '11000000-0000-4000-8000-000000000001',
  100,
  DATE '2026-01-15',
  'Donnée synthétique pour validation locale'
);

INSERT INTO public.audit_logs (id, action)
VALUES (
  '31000000-0000-4000-8000-000000000001',
  'Événement synthétique de validation'
);

INSERT INTO public.plots (id, name, area_hectares)
VALUES ('41000000-0000-4000-8000-000000000001', 'Parcelle synthétique', 2);

INSERT INTO public.animal_lots (id, identifier, species, count)
VALUES ('42000000-0000-4000-8000-000000000001', 'LOT-TEST', 'Bovin', 4);

INSERT INTO public.projects (id, name, initial_budget)
VALUES ('43000000-0000-4000-8000-000000000001', 'Projet synthétique', 100);

INSERT INTO public.expenses (id, reference, amount, category, status)
VALUES ('44000000-0000-4000-8000-000000000001', 'DEP-TEST-001', 10, 'Test', 'brouillon');

INSERT INTO public.transactions (id, amount, description, direction)
VALUES (
  '45000000-0000-4000-8000-000000000001',
  10,
  'Mouvement synthétique',
  'out'
);

INSERT INTO public.documents (id, reference, type, name, status)
VALUES (
  '46000000-0000-4000-8000-000000000001',
  'DOC-TEST-001',
  'facture',
  'Justificatif synthétique',
  'à vérifier'
);
