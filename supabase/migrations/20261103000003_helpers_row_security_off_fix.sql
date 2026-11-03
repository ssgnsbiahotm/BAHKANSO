-- ============================================================================
-- Correction de la migration 20261103000001.
--
-- Deux anti-patterns identifiés dans les helpers SECURITY DEFINER :
--
-- 1. Absence de SET row_security = off → récursion infinie garantie quand
--    FORCE ROW LEVEL SECURITY sera activé sur app_users (20261103000003).
--    Phase 1 a prouvé que row_security = off fonctionne dans pgTAP.
--
-- 2. Fallback current_setting('request.jwt.claim.sub', true)::uuid
--    || auth.uid() → masque les bugs de setup de test, et rend le
--    comportement imprévisible en production (le fallback gagne si
--    current_setting retourne NULL de manière inattendue). En production,
--    auth.uid() seul fonctionne dans SECURITY DEFINER.
--
-- Cette migration redéfinit les 4 helpers avec row_security = off et
-- SANS fallback. Le garde-fou vérifie les deux : présence de
-- row_security=off dans proconfig, ET absence de current_setting dans
-- prosrc.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT id FROM public.app_users
  WHERE auth_id = auth.uid() OR id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT role FROM public.app_users
  WHERE auth_id = auth.uid() OR id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_site_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT site_id FROM public.app_users
  WHERE auth_id = auth.uid() OR id = auth.uid()
  LIMIT 1;
$$;

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
-- GARDE-FOU : row_security=off présent ET current_setting absent
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

    -- Anti-pattern 2 : current_setting ne doit PAS apparaître dans prosrc
    IF fn.prosrc ILIKE '%current_setting%' THEN
      RAISE EXCEPTION 'Helper % contient un fallback current_setting (prosrc)',
        name;
    END IF;

    -- Anti-pattern 2 bis : le fallback auth.uid() || current_setting
    -- doit être absent — vérifier qu''il n''y a pas de || dans prosrc
    -- (approximation robuste pour ce cas précis)
    IF fn.prosrc ~ '\|\|' THEN
      RAISE EXCEPTION 'Helper % contient un opérateur || suspect (prosrc), '
        'probablement un fallback', name;
    END IF;
  END LOOP;
END $$;
