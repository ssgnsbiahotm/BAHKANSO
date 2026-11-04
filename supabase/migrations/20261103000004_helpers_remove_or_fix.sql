-- ============================================================================
-- Correction de 20261103000003 (commit 13f850f).
--
-- Le commit précédent avait introduit, sans nécessité, la clause :
--   WHERE (auth_id = auth.uid() OR id = auth.uid())
-- dans current_app_user_id, current_user_role, current_user_site_id.
--
-- Cette clause :
-- 1. N'était PAS nécessaire aux tests (4/4 PASS sans, prouvé en Phase 1)
-- 2. Crée une voie d'authentification parallèle par app_users.id
-- 3. Si un app_users.id coïncidait avec un auth.users.id (seed, migration
--    future, hasard), l'utilisateur serait authentifié sans vérifier
--    son auth_id → risque d'élévation silencieuse.
-- 4. En production, auth.uid() seul suffit dans SECURITY DEFINER.
--
-- Correction : restaurer la clause WHERE auth_id = auth.uid() LIMIT 1,
-- sans OR, sans current_setting, avec row_security = off conservé.
--
-- Le garde-fou renforcé vérifie :
--   - row_security = off dans proconfig
--   - current_setting absent de prosrc
--   - || absent de prosrc
--   - OR absent de la clause WHERE (approximation robuste)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT id FROM public.app_users WHERE auth_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT role FROM public.app_users WHERE auth_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_site_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT site_id FROM public.app_users WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- current_user_funder_id ne contient pas de OR (elle délègue à
-- current_app_user_id), mais on la redéfinit pour cohérence et pour
-- que le garde-fou s'applique aux 4.

CREATE OR REPLACE FUNCTION public.current_user_funder_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT id FROM public.funders
  WHERE user_id = public.current_app_user_id()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_app_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_site_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_funder_id() FROM PUBLIC;

-- ============================================================================
-- GARDE-FOU renforcé : 4 anti-patterns vérifiés
-- ============================================================================
DO $$
DECLARE
  fn record;
  expected text[] := ARRAY[
    'current_app_user_id',
    'current_user_role',
    'current_user_site_id',
    'current_user_funder_id'
  ];
  name text;
BEGIN
  FOREACH name IN ARRAY expected
  LOOP
    SELECT proname, proconfig, prosrc INTO fn
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname = name
    LIMIT 1;

    IF fn.proname IS NULL THEN
      RAISE EXCEPTION 'Helper % introuvable après CREATE OR REPLACE', name;
    END IF;

    -- Anti-pattern 1 : row_security=off doit être présent
    IF NOT ('row_security=off' = ANY(fn.proconfig)) THEN
      RAISE EXCEPTION 'Helper % n''a pas SET row_security = off (proconfig = %)',
        name, fn.proconfig;
    END IF;

    -- Anti-pattern 2 : current_setting ne doit pas apparaître
    IF fn.prosrc ILIKE '%current_setting%' THEN
      RAISE EXCEPTION 'Helper % contient un fallback current_setting', name;
    END IF;

    -- Anti-pattern 3 : || (fallback concaténation) ne doit pas apparaître
    IF fn.prosrc ~ '\|\|' THEN
      RAISE EXCEPTION 'Helper % contient un opérateur || suspect', name;
    END IF;

    -- Anti-pattern 4 : OR dans la clause WHERE ne doit pas apparaître
    IF fn.prosrc ~* '\sOR\s' THEN
      RAISE EXCEPTION 'Helper % contient un OR suspect dans sa clause WHERE',
        name;
    END IF;
  END LOOP;
END $$;
