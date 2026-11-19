-- Migration : FORCE ROW LEVEL SECURITY sur sale_items + politiques scopées site_id
-- Objectif : garantir qu'une requête API directe sur /rest/v1/sale_items ne peut
-- pas contourner le RLS en s'appuyant sur une héritage implicite via sale_id.
-- Chaque politique vérifie que le sale_id parent appartient au site_id de l'utilisateur
-- (via current_user_site_id() + jointure sur sales).
--
-- Idempotente : FORCE ROW LEVEL SECURITY est ré-applicable sans erreur ; les politiques
-- sont recréées via DROP POLICY IF EXISTS + CREATE POLICY.
--
-- Rollback (en commentaire) :
--   ALTER TABLE public.sale_items NO FORCE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "rls_select_sale_items" ON public.sale_items;
--   DROP POLICY IF EXISTS "rls_insert_sale_items" ON public.sale_items;
--   DROP POLICY IF EXISTS "rls_update_sale_items" ON public.sale_items;
--   DROP POLICY IF EXISTS "rls_delete_sale_items" ON public.sale_items;

-- ============================================================================
-- 1. FORCE ROW LEVEL SECURITY sur sale_items
-- ============================================================================
ALTER TABLE public.sale_items FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. Politiques d'accès scopées par site_id (via vente parente -> sales.site_id)
-- ============================================================================

DROP POLICY IF EXISTS "rls_select_sale_items" ON public.sale_items;
CREATE POLICY "rls_select_sale_items" ON public.sale_items
FOR SELECT TO authenticated
USING (
  public.current_user_role() IN ('administrateur', 'propriétaire')
  OR (
    public.current_user_role() IN (
      'gestionnaire', 'comptable', 'responsable_agricole',
      'responsable_élevage', 'chef_chantier'
    )
    AND EXISTS (
      SELECT 1
      FROM public.sales
      WHERE public.sales.id = public.sale_items.sale_id
        AND public.sales.site_id = public.current_user_site_id()
    )
  )
);

DROP POLICY IF EXISTS "rls_insert_sale_items" ON public.sale_items;
CREATE POLICY "rls_insert_sale_items" ON public.sale_items
FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_role() IN (
    'administrateur', 'propriétaire', 'gestionnaire',
    'responsable_agricole', 'responsable_élevage', 'chef_chantier'
  )
  AND EXISTS (
    SELECT 1
    FROM public.sales
    WHERE public.sales.id = public.sale_items.sale_id
      AND public.sales.site_id = public.current_user_site_id()
  )
);

DROP POLICY IF EXISTS "rls_update_sale_items" ON public.sale_items;
CREATE POLICY "rls_update_sale_items" ON public.sale_items
FOR UPDATE TO authenticated
USING (
  public.current_user_role() IN ('administrateur', 'propriétaire')
  OR (
    public.current_user_role() IN (
      'gestionnaire', 'comptable', 'responsable_agricole',
      'responsable_élevage', 'chef_chantier'
    )
    AND EXISTS (
      SELECT 1
      FROM public.sales
      WHERE public.sales.id = public.sale_items.sale_id
        AND public.sales.site_id = public.current_user_site_id()
    )
  )
)
WITH CHECK (
  public.current_user_role() IN (
    'gestionnaire', 'comptable', 'responsable_agricole',
    'responsable_élevage', 'chef_chantier'
  )
  AND EXISTS (
    SELECT 1
    FROM public.sales
    WHERE public.sales.id = public.sale_items.sale_id
      AND public.sales.site_id = public.current_user_site_id()
  )
);

DROP POLICY IF EXISTS "rls_delete_sale_items" ON public.sale_items;
CREATE POLICY "rls_delete_sale_items" ON public.sale_items
FOR DELETE TO authenticated
USING (
  public.current_user_role() IN ('administrateur', 'propriétaire')
  OR (
    public.current_user_role() = 'comptable'
    AND EXISTS (
      SELECT 1
      FROM public.sales
      WHERE public.sales.id = public.sale_items.sale_id
        AND public.sales.site_id = public.current_user_site_id()
    )
  )
);
