-- ============================================================================
-- Fix : Synchronisation auth.users ↔ app_users + trigger robuste
-- Date : 2026-11-02
-- ============================================================================

SET LOCAL session_replication_role = replica;

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT u.id AS correct_id, au.id AS wrong_id, u.email
    FROM auth.users u
    INNER JOIN public.app_users au ON LOWER(u.email) = LOWER(au.email)
    WHERE u.id != au.id
  LOOP
    UPDATE public.customers SET created_by = rec.correct_id WHERE created_by = rec.wrong_id;
    UPDATE public.documents SET uploaded_by = rec.correct_id WHERE uploaded_by = rec.wrong_id;
    UPDATE public.documents SET verified_by = rec.correct_id WHERE verified_by = rec.wrong_id;
    UPDATE public.expenses SET created_by = rec.correct_id WHERE created_by = rec.wrong_id;
    UPDATE public.funders SET user_id = rec.correct_id WHERE user_id = rec.wrong_id;
    UPDATE public.fundings SET created_by = rec.correct_id WHERE created_by = rec.wrong_id;
    UPDATE public.media SET uploaded_by = rec.correct_id WHERE uploaded_by = rec.wrong_id;
    UPDATE public.notifications SET user_id = rec.correct_id WHERE user_id = rec.wrong_id;
    UPDATE public.sales SET created_by = rec.correct_id WHERE created_by = rec.wrong_id;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'surveillance_events') THEN
      UPDATE public.surveillance_events SET responsible_id = rec.correct_id WHERE responsible_id = rec.wrong_id;
    END IF;
    UPDATE public.app_users SET id = rec.correct_id WHERE id = rec.wrong_id;
  END LOOP;
END $$;

INSERT INTO public.app_users (id, email, name, role, active)
SELECT 
  u.id,
  LOWER(u.email),
  COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'role', 'gestionnaire'),
  true
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM public.app_users)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.app_users (id, email, name, role, active)
  VALUES (
    NEW.id,
    LOWER(NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'gestionnaire'),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, app_users.name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

SET LOCAL session_replication_role = DEFAULT;

-- ============================================================================
-- CORRECTION : auth_id n'était jamais rempli
-- ============================================================================
-- Cause racine : auth_id est la colonne utilisée par AuthContext.tsx
-- (`.eq('auth_id', uid)`), mais elle restait NULL. Le backfill résout les
-- users existants, et le trigger corrigé remplit auth_id pour les futurs.

-- DÉROGATION 2026-11-03 : filtre sur auth.users existants pour éviter
-- la violation FK sur les app_users orphelins. Voir docs/migrations/
-- 20261103-derogation-backfill-auth-id.md
UPDATE public.app_users
SET auth_id = id
WHERE auth_id IS NULL
  AND id IN (SELECT id FROM auth.users);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.app_users (id, auth_id, email, name, role, active)
  VALUES (
    NEW.id,
    NEW.id,
    LOWER(NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'gestionnaire'),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    auth_id = EXCLUDED.auth_id,
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, app_users.name);
  RETURN NEW;
END;
$$;
