UPDATE public.app_users
SET role = CASE email
  WHEN 'full-owner@bahkanso.example.test' THEN 'propriétaire'
  WHEN 'full-admin@bahkanso.example.test' THEN 'administrateur'
  WHEN 'full-funder@bahkanso.example.test' THEN 'financeur'
  WHEN 'full-inactive@bahkanso.example.test' THEN 'propriétaire'
  WHEN 'full-unknown@bahkanso.example.test' THEN 'role_inconnu'
  WHEN 'full-no-profile@bahkanso.example.test' THEN 'gestionnaire'
END,
active = email <> 'full-inactive@bahkanso.example.test'
WHERE email IN (
  'full-owner@bahkanso.example.test',
  'full-admin@bahkanso.example.test',
  'full-funder@bahkanso.example.test',
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
      'full-inactive@bahkanso.example.test',
      'full-unknown@bahkanso.example.test',
      'full-no-profile@bahkanso.example.test'
    )
      AND auth_id IS NOT NULL
  ) <> 6 THEN
    RAISE EXCEPTION 'Expected six synthetic Auth-linked profiles';
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

INSERT INTO public.funders (id, name, organization, email)
VALUES (
  '11000000-0000-4000-8000-000000000001',
  'Financeur complet synthétique',
  'Organisation locale synthétique',
  'full-funder-record@bahkanso.example.test'
);

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
