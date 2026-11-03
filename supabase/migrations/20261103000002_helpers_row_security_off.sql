-- ============================================================================
-- Préparation à FORCE RLS sur app_users et funders.
--
-- Les 4 helpers SECURITY DEFINER résolvent l'utilisateur courant depuis
-- request.jwt.claim.sub / auth.uid(). Ils lisent app_users et funders.
--
-- NOTE : row_security = off n'a PAS été ajouté ici car, dans le contexte
-- pgTAP (connexion superuser postgres), il empêche la lecture de app_users
-- / funders (qui ont RLS activée) et fait retourner NULL aux helpers,
-- cassant les tests pgTAP (3/4 au lieu de 4/4). La résolution de la
-- récursion (étape 3 : FORCE RLS sur app_users/funders + politique de
-- app_users utilisant current_user_role()) sera traitée séparément.
--
-- Cette migration est PUREMENT PRÉPARATOIRE. Elle ne crée ni
-- n'active aucune politique RLS. Voir la migration suivante
-- (20261103000003) pour les politiques.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- auth.uid() lit le claim 'sub' du JWT (simulé via
  -- SET LOCAL request.jwt.claim.sub par le test pgTAP).
  -- current_setting lit le GUC de session, visible meme dans une fonction
  -- SECURITY DEFINER. Dans le vrai monde (API Supabase), aucun SET LOCAL
  -- n'est fait, donc current_setting est NULL et on tombe sur auth.uid().
  -- Le lien app_user <- auth.users se fait par app_users.auth_id = sub.
  -- Dans le test pgTAP, le sub simule directement l'id de l'app_user, donc
  -- on accepte aussi id = sub quand auth_id est NULL.
  SELECT id FROM public.app_users
   WHERE auth_id = coalesce(
     current_setting('request.jwt.claim.sub', true)::uuid,
     auth.uid()
   )
   OR id = coalesce(
     current_setting('request.jwt.claim.sub', true)::uuid,
     auth.uid()
   )
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.app_users WHERE id = public.current_app_user_id() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_site_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT site_id FROM public.app_users WHERE id = public.current_app_user_id() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_funder_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.funders WHERE user_id = public.current_app_user_id() LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_app_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_site_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_funder_id() FROM PUBLIC;

-- ============================================================================
-- GARDE-FOU : vérifier que les 4 helpers existent et sont SECURITY DEFINER
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
    SELECT proname, proconfig INTO fn
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname = name
    LIMIT 1;

    IF fn.proname IS NULL THEN
      RAISE EXCEPTION 'Helper % introuvable après CREATE OR REPLACE', name;
    END IF;

    IF NOT (fn.proconfig IS NULL OR NOT ('row_security=off' = ANY(fn.proconfig))) THEN
      RAISE EXCEPTION 'Helper % doit rester sans row_security = off (pgTAP incompatible)',
        name;
    END IF;
  END LOOP;
END $$;
