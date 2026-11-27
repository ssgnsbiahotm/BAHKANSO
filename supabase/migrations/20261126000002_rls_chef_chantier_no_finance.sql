-- Correction RLS : retrait des accès financiers du rôle chef_chantier (D1)
--
-- Le rôle chef_chantier est exclusivement opérationnel et ne doit disposer
-- d'aucun accès financier (lecture ni écriture) sur les dépenses, ventes
-- et lignes de vente.
--
-- Cette migration est additive : elle ne modifie aucune migration historique.
-- Elle recrée les politiques concernées sans chef_chantier, de façon idempotente
-- (DROP POLICY IF EXISTS + CREATE POLICY).
--
-- Tables concernées :
--   expenses    : retrait de chef_chantier de SELECT et WRITE
--   sales       : retrait de chef_chantier de SELECT
--   sale_items  : retrait de chef_chantier de INSERT/UPDATE/DELETE
--
-- Rollback (en commentaire) : restaurer les politiques précédentes incluant chef_chantier.

-- ============================================================================
-- 1. EXPENSES — retrait de chef_chantier de la sélection et de l'écriture
-- ============================================================================

DROP POLICY IF EXISTS "expenses_select_scoped" ON public.expenses;
CREATE POLICY "expenses_select_scoped" ON public.expenses
FOR SELECT TO authenticated
USING (
  (
    public.current_user_role() IN ('administrateur','propriétaire')
  )
  OR
  (
    public.current_user_role() IN ('gestionnaire','comptable','auditeur','responsable_chantier')
    AND public.expenses.site_id = public.current_user_site_id()
  )
);

DROP POLICY IF EXISTS "expenses_write_scoped" ON public.expenses;
CREATE POLICY "expenses_write_scoped" ON public.expenses
FOR ALL TO authenticated
USING (
  public.current_user_role() IN
    ('proprietaire','administrateur','gestionnaire','responsable_chantier')
  AND public.expenses.site_id = public.current_user_site_id()
)
WITH CHECK (
  public.current_user_role() IN ('administrateur','gestionnaire','responsable_chantier')
  AND public.expenses.site_id = public.current_user_site_id()
);

-- ============================================================================
-- 2. SALES — retrait de chef_chantier de la sélection
-- ============================================================================

DROP POLICY IF EXISTS "sales_select_scoped" ON public.sales;
CREATE POLICY "sales_select_scoped" ON public.sales
FOR SELECT TO authenticated
USING (
  (
    public.current_user_role() IN ('administrateur','propriétaire')
  )
  OR
  (
    public.current_user_role() IN ('gestionnaire','comptable','auditeur')
    AND public.sales.site_id = public.current_user_site_id()
  )
);

-- ============================================================================
-- 3. SALE_ITEMS — retrait de chef_chantier des écritures
-- ============================================================================

DROP POLICY IF EXISTS "rls_insert_sale_items" ON public.sale_items;
CREATE POLICY "rls_insert_sale_items" ON public.sale_items
FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_role() IN (
    'administrateur', 'propriétaire', 'gestionnaire',
    'responsable_agricole', 'responsable_élevage'
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
      'responsable_élevage'
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
    'responsable_élevage'
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

-- ============================================================================
-- 4. SALE_ITEMS — retrait de chef_chantier de la sélection (cohérence RBAC)
-- rbac.ts retire toutes les permissions ventes à chef_chantier ; la politique
-- SELECT de sale_items doit l'en retirer aussi pour éviter une lecture non
-- autorisée des lignes de vente.
-- ============================================================================

DROP POLICY IF EXISTS "rls_select_sale_items" ON public.sale_items;
CREATE POLICY "rls_select_sale_items" ON public.sale_items
FOR SELECT TO authenticated
USING (
  public.current_user_role() IN ('administrateur', 'propriétaire')
  OR (
    public.current_user_role() IN (
      'gestionnaire', 'comptable', 'responsable_agricole',
      'responsable_élevage'
    )
    AND EXISTS (
      SELECT 1
      FROM public.sales
      WHERE public.sales.id = public.sale_items.sale_id
        AND public.sales.site_id = public.current_user_site_id()
    )
  )
);
