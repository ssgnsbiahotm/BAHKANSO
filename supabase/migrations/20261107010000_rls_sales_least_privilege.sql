-- ============================================================================
-- RLS least-privilege sur la table sales
-- Date : 2026-11-07
-- ============================================================================

-- ============================================================================
-- Nettoyage des anciennes politiques permissives sur sales (migration 017)
-- Ces politiques tournent en USING (true) / WITH CHECK (true) et se combinent
-- en OR avec les nouvelles politiques *_scoped, neutralisant le least-privilege.
-- Elles doivent être dropées AVANT la création des politiques ciblées.
-- ============================================================================

DROP POLICY IF EXISTS "auth_select_sales" ON public.sales;
DROP POLICY IF EXISTS "auth_insert_sales" ON public.sales;
DROP POLICY IF EXISTS "auth_update_sales" ON public.sales;
DROP POLICY IF EXISTS "auth_delete_sales" ON public.sales;

-- Politiques role_* de la migration 012/028 (trop permissives, USING/OR)
-- Elles se combinent en OR avec les nouvelles politiques *_scoped et
-- neutralisent le least-privilege. Elles doivent être dropées aussi.
DROP POLICY IF EXISTS "role_select_sales" ON public.sales;
DROP POLICY IF EXISTS "role_insert_sales" ON public.sales;
DROP POLICY IF EXISTS "role_update_sales" ON public.sales;
DROP POLICY IF EXISTS "role_delete_sales" ON public.sales;

-- ============================================================================
-- SALES — SELECT
-- Lecture par site pour les rôles staff (administrateur, gestionnaire,
-- comptable, auditeur, chef_chantier).
-- ============================================================================

DROP POLICY IF EXISTS "sales_select_scoped" ON public.sales;

CREATE POLICY "sales_select_scoped" ON public.sales
FOR SELECT TO authenticated
USING (
  public.current_user_role() IN
    ('proprietaire','administrateur','gestionnaire','comptable','auditeur','chef_chantier')
  AND sales.site_id = public.current_user_site_id()
);

-- ============================================================================
-- SALES — INSERT / UPDATE / DELETE
-- Écriture restreinte aux administrateurs et gestionnaires sur leur site.
-- USING et WITH CHECK doivent être symétriques.
-- ============================================================================

DROP POLICY IF EXISTS "sales_write_scoped" ON public.sales;

CREATE POLICY "sales_write_scoped" ON public.sales
FOR ALL TO authenticated
USING (
  -- Lecture : tous les rôles staff du site voient leurs ventes.
  -- Le comptable y est inclus afin qu'un UPDATE sur une ligne qu'il voit
  -- trouve la ligne et soit ensuite bloqué par WITH CHECK (42501 au lieu
  -- de retourner silencieusement 0 lignes).
  public.current_user_role() IN
    ('proprietaire','administrateur','gestionnaire','comptable','auditeur','chef_chantier')
  AND sales.site_id = public.current_user_site_id()
)
WITH CHECK (
  -- Écriture : seuls administrateur et gestionnaire sur leur site.
  public.current_user_role() IN ('administrateur','gestionnaire')
  AND sales.site_id = public.current_user_site_id()
);

-- ============================================================================
-- FORCE ROW LEVEL SECURITY
-- RLS s'applique aussi au propriétaire de la table (postgres). Nécessaire
-- pour que les tests pgTAP en connexion directe soient réalistes.
-- ============================================================================

ALTER TABLE public.sales FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- GARDE-FOU : aucune politique USING (true) / WITH CHECK (true) sur sales
-- et FORCE ROW LEVEL SECURITY présent
-- ============================================================================

DO $$
DECLARE
  pol record;
BEGIN
  IF NOT (SELECT relforcerowsecurity FROM pg_class
          WHERE oid = 'public.sales'::regclass) THEN
    RAISE EXCEPTION 'FORCE ROW LEVEL SECURITY manquant sur sales';
  END IF;

  FOR pol IN
    SELECT polname, polqual, polwithcheck
    FROM pg_policy
    WHERE polrelid = 'public.sales'::regclass
  LOOP
    IF pol.polqual IS NOT NULL AND trim(pol.polqual) IN ('true', '(true)') THEN
      RAISE EXCEPTION 'Politique USING permissive détectée : % sur sales', pol.polname;
    END IF;
    IF pol.polwithcheck IS NOT NULL AND trim(pol.polwithcheck) IN ('true', '(true)') THEN
      RAISE EXCEPTION 'Politique WITH CHECK permissive détectée : % sur sales', pol.polname;
    END IF;
  END LOOP;
END $$;
