-- Migration 014: Correction race condition handle_new_user (B1)
-- Rend le trigger idempotent + logging + gestion conflits
-- Date: 2026-10-21

-- 1. Supprimer l'ancien trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Fonction sécurisée : idempotente, logging, sans exception bloquante
CREATE OR REPLACE FUNCTION public.handle_new_user_safe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_role text := 'membre';
  v_active boolean := true;
  v_display_name text := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
BEGIN
  -- Log de l'événement (table d'audit si existe, sinon notice)
  RAISE NOTICE 'handle_new_user_safe: new auth user id=%, email=%', NEW.id, NEW.email;

  -- Insérer ou ignorer si déjà présent (idempotent)
  INSERT INTO public.app_users (auth_id, email, role, active, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    v_role,
    v_active,
    v_display_name,
    NOW(),
    NOW()
  )
  ON CONFLICT (auth_id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    updated_at = NOW()
  -- Ne pas toucher au role/active s'ils existent déjà (préserver l'assignation admin)
  WHERE public.app_users.auth_id = NEW.id;

  -- Log succès
  RAISE NOTICE 'handle_new_user_safe: app_users upsert ok for auth_id=%', NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Ne jamais faire échouer la création auth.users
    -- Logger l'erreur pour investigation
    RAISE WARNING 'handle_new_user_safe: ERROR for auth_id=%: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Recréer le trigger sur auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_safe();

-- 4. Supprimer l'ancienne fonction (après vérification)
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 5. Renommer la nouvelle pour compatibilité
ALTER FUNCTION public.handle_new_user_safe() RENAME TO handle_new_user;

COMMENT ON FUNCTION public.handle_new_user() IS
'Trigger AFTER INSERT sur auth.users → upsert idempotent dans app_users.
Ne lève jamais d''exception (RETURN NEW en tout cas).
ON CONFLICT DO UPDATE préserve role/active existants.
SECURITY DEFINER requis pour écrire dans app_users depuis auth trigger.';