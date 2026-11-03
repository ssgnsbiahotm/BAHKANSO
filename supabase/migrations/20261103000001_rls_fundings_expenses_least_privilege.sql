-- ============================================================================
-- RLS least-privilege sur fundings et expenses
-- Date : 2026-11-03
-- ============================================================================

-- ============================================================================
-- Helpers : résolution de l'utilisateur courant
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
-- Nettoyage des politiques permissives de la migration 012 (role_*)
-- Ces politiques tournent en USING (true) et se combinent en OR avec les
-- nouvelles politiques *_scoped, neutralisant le least-privilege.
-- Elles doivent être dropées AVANT la création des politiques ciblées.
-- ============================================================================
DROP POLICY IF EXISTS "role_select_fundings" ON public.fundings;
DROP POLICY IF EXISTS "role_insert_fundings" ON public.fundings;
DROP POLICY IF EXISTS "role_update_fundings" ON public.fundings;
DROP POLICY IF EXISTS "role_delete_fundings" ON public.fundings;

DROP POLICY IF EXISTS "role_select_expenses" ON public.expenses;
DROP POLICY IF EXISTS "role_insert_expenses" ON public.expenses;
DROP POLICY IF EXISTS "role_update_expenses" ON public.expenses;
DROP POLICY IF EXISTS "role_delete_expenses" ON public.expenses;

-- ============================================================================
-- FUNDINGS — SELECT
-- ============================================================================
DROP POLICY IF EXISTS "fundings_select" ON public.fundings;
DROP POLICY IF EXISTS "fundings_all_authenticated" ON public.fundings;
DROP POLICY IF EXISTS "auth_select_fundings" ON public.fundings;

CREATE POLICY "fundings_select_scoped" ON public.fundings
FOR SELECT TO authenticated
USING (
  (
    public.current_user_role() IN
      ('proprietaire','administrateur','gestionnaire','comptable','auditeur')
    AND fundings.site_id = public.current_user_site_id()
  )
  OR
  (
    public.current_user_role() = 'financeur'
    AND fundings.funder_id = public.current_user_funder_id()
  )
);

-- ============================================================================
-- FUNDINGS — INSERT / UPDATE / DELETE
-- Option A : financeur peut écrire sur son funder uniquement.
-- USING et WITH CHECK doivent être symétriques (sinon le financeur peut
-- déplacer un funding vers un autre funder).
-- ============================================================================
DROP POLICY IF EXISTS "fundings_write" ON public.fundings;
DROP POLICY IF EXISTS "fundings_insert" ON public.fundings;
DROP POLICY IF EXISTS "fundings_update" ON public.fundings;
DROP POLICY IF EXISTS "fundings_delete" ON public.fundings;

CREATE POLICY "fundings_write_scoped" ON public.fundings
FOR ALL TO authenticated
USING (
  (
    public.current_user_role() IN ('administrateur','gestionnaire')
    AND fundings.site_id = public.current_user_site_id()
  )
  OR
  (
    public.current_user_role() = 'financeur'
    AND fundings.funder_id = public.current_user_funder_id()
  )
)
WITH CHECK (
  (
    public.current_user_role() IN ('administrateur','gestionnaire')
    AND fundings.site_id = public.current_user_site_id()
  )
  OR
  (
    public.current_user_role() = 'financeur'
    AND fundings.funder_id = public.current_user_funder_id()
  )
);

-- ============================================================================
-- EXPENSES — SELECT
-- ============================================================================
DROP POLICY IF EXISTS "expenses_select" ON public.expenses;
DROP POLICY IF EXISTS "expenses_all_authenticated" ON public.expenses;
DROP POLICY IF EXISTS "auth_select_expenses" ON public.expenses;

CREATE POLICY "expenses_select_scoped" ON public.expenses
FOR SELECT TO authenticated
USING (
  public.current_user_role() IN
    ('proprietaire','administrateur','gestionnaire','comptable','auditeur','chef_chantier')
  AND expenses.site_id = public.current_user_site_id()
);

-- ============================================================================
-- EXPENSES — INSERT / UPDATE / DELETE
-- Q1 : comptable LECTURE SEULE. Seuls administrateur, gestionnaire et
-- chef_chantier écrivent, et uniquement sur leur site.
-- ============================================================================
DROP POLICY IF EXISTS "expenses_write" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete" ON public.expenses;

CREATE POLICY "expenses_write_scoped" ON public.expenses
FOR ALL TO authenticated
USING (
  -- Lecture : tout rôle finance du site voit ses propres expenses.
  -- Le comptable y est inclus (lecture seule) afin qu'un UPDATE sur une
  -- ligne qu'il possède trouve la ligne et soit ensuite bloqué par WITH CHECK
  -- (qui lève 42501 au lieu de retourner silencieusement 0 lignes).
  public.current_user_role() IN
    ('proprietaire','administrateur','gestionnaire','comptable','auditeur','chef_chantier')
  AND expenses.site_id = public.current_user_site_id()
)
WITH CHECK (
  -- Écriture : seuls administrateur, gestionnaire et chef_chantier sur leur site.
  public.current_user_role() IN ('administrateur','gestionnaire','chef_chantier')
  AND expenses.site_id = public.current_user_site_id()
);

-- ============================================================================
-- FORCE ROW LEVEL SECURITY
-- RLS s'applique aussi au propriétaire de la table (postgres). Nécessaire
-- pour que les tests pgTAP en connexion directe soient réalistes. Le
-- service_role (BYPASSRLS) et authenticated restent inchangés.
-- ============================================================================
ALTER TABLE public.fundings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.expenses FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- GARDE-FOU : aucune politique USING (true) / WITH CHECK (true)
-- et FORCE ROW LEVEL SECURITY présent sur les deux tables
-- ============================================================================
DO $$
DECLARE
  pol record;
  tbl record;
BEGIN
  -- Vérifier FORCE ROW LEVEL SECURITY
  FOR tbl IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('fundings', 'expenses')
      AND c.relkind = 'r'
  LOOP
    IF NOT (SELECT relforcerowsecurity FROM pg_class
            WHERE oid = ('public.' || tbl.relname)::regclass) THEN
      RAISE EXCEPTION 'FORCE ROW LEVEL SECURITY manquant sur %', tbl.relname;
    END IF;
  END LOOP;

  -- Vérifier qu'aucune politique permissive ne subsiste
  FOR pol IN
    SELECT polname, polqual, polwithcheck, polrelid::regclass::text AS tbl
    FROM pg_policy
    WHERE polrelid IN ('public.fundings'::regclass, 'public.expenses'::regclass)
  LOOP
    IF pol.polqual IS NOT NULL AND trim(pol.polqual) IN ('true', '(true)') THEN
      RAISE EXCEPTION 'Politique USING permissive détectée : % sur %',
        pol.polname, pol.tbl;
    END IF;
    IF pol.polwithcheck IS NOT NULL AND trim(pol.polwithcheck) IN ('true', '(true)') THEN
      RAISE EXCEPTION 'Politique WITH CHECK permissive détectée : % sur %',
        pol.polname, pol.tbl;
    END IF;
  END LOOP;
END $$;
