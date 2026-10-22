/*
# Bahkanso — Migration 020 : Seed utilisateur E2E
## Objectif
Créer un utilisateur de test pour les tests Playwright E2E.
Hash bcrypt précalculé pour 'password123' (coût 10) : $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
*/

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Vérifier si l'utilisateur existe déjà
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'e2e@bahkanso.ci';

  IF v_user_id IS NULL THEN
    -- Créer l'utilisateur dans auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'e2e@bahkanso.ci',
      '$2b$10$bsIe0YrO79J9p1ky4zEhsO7OG2lMC2lxbu7JXkCgyQ4BlSxt8/m6y',
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{}',
      false,
      '',
      '',
      '',
      ''
    ) RETURNING id INTO v_user_id;
  END IF;

  -- Insérer/mettre à jour dans app_users
  IF v_user_id IS NOT NULL THEN
    INSERT INTO app_users (
      auth_id,
      name,
      email,
      role,
      active,
      created_at
    ) VALUES (
      v_user_id,
      'E2E Test Admin',
      'e2e@bahkanso.ci',
      'administrateur',
      true,
      now()
    ) ON CONFLICT (auth_id) DO UPDATE SET
      role = 'administrateur',
      active = true,
      name = 'E2E Test Admin';
  END IF;
END $$;