-- Correction des helpers d'authentification et des politiques RLS
--
-- 1. Les fonctions current_* utilisent auth.uid() qui, dans une fonction
--    SECURITY DEFINER (row_security=off), retourne l'UID du propriétaire
--    (postgres) au lieu de l'UID de l'utilisateur authentifie.
--    Correction : lire le sub du JWT via current_setting('request.jwt.claims').
--
-- 2. fundings_write_scoped autorise un financeur a ecrire sur n'importe quel
--    site (pas de contrainte site_id). Correction : ajouter site_id =
--    current_user_site_id() pour les financeurs.
--
-- 3. sales_select_scoped / sales_write_scoped (migration 017/019) coexistent
--    avec rls_select_sales / rls_*_sales (migration 20261116000001).
--    PostgreSQL combine en OR, ce qui cree des conflits. Suppression des
--    politiques en double.

-- ============================================================
-- 1. Fonctions helpers : lire depuis le JWT claim 'sub'
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_auth_uid uuid;
BEGIN
  v_auth_uid := (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid;
  IF v_auth_uid IS NULL THEN
    v_auth_uid := auth.uid();
  END IF;
  RETURN (SELECT id FROM public.app_users WHERE auth_id = v_auth_uid LIMIT 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_auth_uid uuid;
BEGIN
  v_auth_uid := (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid;
  IF v_auth_uid IS NULL THEN
    v_auth_uid := auth.uid();
  END IF;
  RETURN (SELECT role FROM public.app_users WHERE auth_id = v_auth_uid LIMIT 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_site_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_auth_uid uuid;
BEGIN
  v_auth_uid := (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid;
  IF v_auth_uid IS NULL THEN
    v_auth_uid := auth.uid();
  END IF;
  RETURN (SELECT site_id FROM public.app_users WHERE auth_id = v_auth_uid LIMIT 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_funder_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_auth_uid uuid;
BEGIN
  v_auth_uid := (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid;
  IF v_auth_uid IS NULL THEN
    v_auth_uid := auth.uid();
  END IF;
  RETURN (SELECT f.id FROM public.funders f WHERE f.user_id = (
    SELECT id FROM public.app_users WHERE auth_id = v_auth_uid LIMIT 1
  ) LIMIT 1);
END;
$$;

-- ============================================================
-- 2. Nettoyage politiques RLS en double sur sales
-- ============================================================
DROP POLICY IF EXISTS sales_select_scoped ON sales;
DROP POLICY IF EXISTS sales_write_scoped ON sales;

-- ============================================================
-- 3. Correction fundings_write_scoped : contrainte site_id pour les financeurs
-- ============================================================
DROP POLICY IF EXISTS fundings_write_scoped ON fundings;
CREATE POLICY fundings_write_scoped ON fundings
  FOR ALL TO authenticated
  USING (
    (current_user_role() = ANY (ARRAY['administrateur', 'gestionnaire']) AND site_id = current_user_site_id())
    OR (current_user_role() = 'financeur' AND funder_id = current_user_funder_id() AND site_id = current_user_site_id())
  )
  WITH CHECK (
    (current_user_role() = ANY (ARRAY['administrateur', 'gestionnaire']) AND site_id = current_user_site_id())
    OR (current_user_role() = 'financeur' AND funder_id = current_user_funder_id() AND site_id = current_user_site_id())
  );

-- Recréer fundings_select_scoped avec la meme logique
DROP POLICY IF EXISTS fundings_select_scoped ON fundings;
CREATE POLICY fundings_select_scoped ON fundings
  FOR SELECT TO authenticated
  USING (
    current_user_role() = ANY (ARRAY['administrateur', 'proprietaire'])
    OR (current_user_role() = ANY (ARRAY['gestionnaire', 'comptable', 'auditeur']) AND site_id = current_user_site_id())
    OR (current_user_role() = 'financeur' AND funder_id = current_user_funder_id() AND site_id = current_user_site_id())
  );

ALTER TABLE public.fundings FORCE ROW LEVEL SECURITY;
