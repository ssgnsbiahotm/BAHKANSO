-- ============================================================================
-- Helpers de base requis par la migration 013 (fix_security_definer_functions)
-- Créées AVANT 013 car celle-ci ne fait que des ALTER FUNCTION sur elles.
-- Date : 2026-10-21
-- ============================================================================

-- ---------- set_updated_at() ----------
-- Fonction déclencheur générique : met à jour updated_at sur UPDATE.
-- Idempotente : recréée uniquement si absente (garde pg_proc).
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION public.set_updated_at()
    RETURNS trigger
    LANGUAGE plpgsql
    SET search_path = public
    AS $body$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $body$;
  END IF;
END $do$;

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;

-- ---------- rls_auto_enable() ----------
-- Active FORCE ROW LEVEL SECURITY sur une table cible.
-- SECURITY DEFINER + row_security = off pour éviter la récursion infinie
-- quand FORCE RLS est déjà actif sur les tables lues par cette fonction.
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger LANGUAGE plpgsql AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table', 'table rewrite')
  LOOP
    IF cmd.schema_name = 'public' THEN
      EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', cmd.object_identity);
    END IF;
  END LOOP;
END;
$$;


-- ---------- is_staff() ----------
-- Retourne true si l'utilisateur courant (auth.uid()) a un rôle staff
-- (administrateur ou gestionnaire). SECURITY DEFINER + row_security = off
-- pour lire public.app_users sans récursion sur FORCE RLS.
-- NOTE : la migration 013 (20261005195225) bascule cette fonction en
-- SECURITY INVOKER, révoque EXECUTE sur anon/authenticated et ne l'accorde
-- à aucun rôle ; elle est de facto dépréciée au profit de
-- current_user_has_role() (migration 010) après application de 013.
-- Elle est définie ici uniquement parce que 013 fait des ALTER FUNCTION
-- dessus et requiert son existence préalable.
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT role IN ('administrateur', 'gestionnaire')
  FROM public.app_users
  WHERE auth_id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC;

-- ---------- handle_new_user() ----------
-- Crée/met à jour la ligne app_users à la création d'un auth.users.
-- Version antérieure à l'ajout de la colonne auth_id (migration 20261103000000).
-- Nécessaire pour que la migration 013 puisse faire ses ALTER FUNCTION/REVOKE.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
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

REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

COMMENT ON FUNCTION public.set_updated_at() IS 'Trigger helper : met à jour updated_at à now() sur UPDATE.';
COMMENT ON FUNCTION public.rls_auto_enable() IS 'Active ENABLE + FORCE ROW LEVEL SECURITY sur une table (admin uniquement).';
COMMENT ON FUNCTION public.is_staff() IS 'Retourne true si l''utilisateur courant est administrateur ou gestionnaire.';
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger auth.users → insert app_users. SECURITY DEFINER requis, EXECUTE révoqué sur anon/authenticated.';
