-- ============================================================================
-- Phase 2 RLS — Accès global par rôle (administrateur, propriétaire)
-- + périmètre site strict pour le staff (rôle ET site_id, sans IS NULL)
-- Tables : fundings, expenses, sales, customers, sale_items, sites,
--          funding_allocations, transactions, documents, funders
-- Date : 2026-11-14
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Prérequis : colonne site_id sur transactions et documents
--    (absente du schéma local, présente uniquement sur le distant via
--    consolidation. Nécessaire pour les politiques RLS ci-dessous.)
-- ----------------------------------------------------------------------------

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_site ON public.transactions(site_id);
CREATE INDEX IF NOT EXISTS idx_documents_site ON public.documents(site_id);


-- ============================================================================
-- 1. FUNDINGS — modifier fundings_select_scoped (031)
--    Ajout d'une branche admin/propriétaire avec accès global (sans site_id)
-- ============================================================================

DROP POLICY IF EXISTS "fundings_select_scoped" ON public.fundings;

CREATE POLICY "fundings_select_scoped" ON public.fundings
FOR SELECT TO authenticated
USING (
  (
    public.current_user_role() IN ('administrateur','propriétaire')
  )
  OR
  (
    public.current_user_role() IN ('gestionnaire','comptable','auditeur')
    AND public.fundings.site_id = public.current_user_site_id()
  )
  OR
  (
    public.current_user_role() = 'financeur'
    AND public.fundings.funder_id = public.current_user_funder_id()
  )
);

-- fundings_write_scoped (031) conservé tel quel : administrateur/gestionnaire +
-- site_id, ou financeur + funder_id. Aucune modification.


-- ============================================================================
-- 2. EXPENSES — modifier expenses_select_scoped (031)
--    Ajout d'une branche admin/propriétaire avec accès global (sans site_id)
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
    public.current_user_role() IN ('gestionnaire','comptable','auditeur','chef_chantier')
    AND public.expenses.site_id = public.current_user_site_id()
  )
);

-- expenses_write_scoped (031) conservé tel kept.


-- ============================================================================
-- 3. SALES — modifier sales_select_scoped (037)
--    Ajout d'une branche admin/propriétaire avec accès global (sans site_id)
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
    public.current_user_role() IN ('gestionnaire','comptable','auditeur','chef_chantier')
    AND public.sales.site_id = public.current_user_site_id()
  )
);

-- sales_write_scoped (037) conservé tel quel.


-- ============================================================================
-- 4. CUSTOMERS — nouvelles politiques rôle (remplace role_* de 019)
-- ============================================================================

DROP POLICY IF EXISTS "role_select_customers" ON public.customers;
DROP POLICY IF EXISTS "role_insert_customers" ON public.customers;
DROP POLICY IF EXISTS "role_update_customers" ON public.customers;
DROP POLICY IF EXISTS "role_delete_customers" ON public.customers;

CREATE POLICY "role_select_customers" ON public.customers
FOR SELECT TO authenticated
USING (
  (public.current_user_role() IN ('administrateur','propriétaire'))
  OR (
    public.current_user_role() IN ('gestionnaire','comptable','responsable_agricole','responsable_élevage','chef_chantier')
    AND public.customers.site_id = public.current_user_site_id()
  )
);

CREATE POLICY "role_insert_customers" ON public.customers
FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_role() IN ('administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage')
  AND public.customers.site_id = public.current_user_site_id()
);

CREATE POLICY "role_update_customers" ON public.customers
FOR UPDATE TO authenticated
USING (
  (public.current_user_role() IN ('administrateur','propriétaire'))
  OR (
    public.current_user_role() IN ('gestionnaire','comptable','responsable_agricole','responsable_élevage')
    AND public.customers.site_id = public.current_user_site_id()
  )
)
WITH CHECK (
  public.current_user_role() IN ('gestionnaire','comptable','responsable_agricole','responsable_élevage')
  AND public.customers.site_id = public.current_user_site_id()
);

CREATE POLICY "role_delete_customers" ON public.customers
FOR DELETE TO authenticated
USING (
  public.current_user_role() IN ('administrateur','propriétaire','comptable')
  AND public.customers.site_id = public.current_user_site_id()
);


-- ============================================================================
-- 5. SALE_ITEMS — nouvelles politiques rôle (remplace role_* de 019)
--    Accès via sale_id → sales.site_id
-- ============================================================================

DROP POLICY IF EXISTS "role_select_sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "role_insert_sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "role_update_sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "role_delete_sale_items" ON public.sale_items;

CREATE POLICY "role_select_sale_items" ON public.sale_items
FOR SELECT TO authenticated
USING (
  (public.current_user_role() IN ('administrateur','propriétaire'))
  OR (
    public.current_user_role() IN ('gestionnaire','comptable','responsable_agricole','responsable_élevage','chef_chantier')
    AND public.sale_items.sale_id IN (
      SELECT id FROM public.sales WHERE public.sales.site_id = public.current_user_site_id()
    )
  )
);

CREATE POLICY "role_insert_sale_items" ON public.sale_items
FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_role() IN ('administrateur','propriétaire','gestionnaire','responsable_agricole','responsable_élevage','chef_chantier')
  AND public.sale_items.sale_id IN (
    SELECT id FROM public.sales WHERE public.sales.site_id = public.current_user_site_id()
  )
);

CREATE POLICY "role_update_sale_items" ON public.sale_items
FOR UPDATE TO authenticated
USING (
  (public.current_user_role() IN ('administrateur','propriétaire'))
  OR (
    public.current_user_role() IN ('gestionnaire','comptable','responsable_agricole','responsable_élevage','chef_chantier')
    AND public.sale_items.sale_id IN (
      SELECT id FROM public.sales WHERE public.sales.site_id = public.current_user_site_id()
    )
  )
)
WITH CHECK (
  public.current_user_role() IN ('gestionnaire','comptable','responsable_agricole','responsable_élevage','chef_chantier')
  AND public.sale_items.sale_id IN (
    SELECT id FROM public.sales WHERE public.sales.site_id = public.current_user_site_id()
  )
);

CREATE POLICY "role_delete_sale_items" ON public.sale_items
FOR DELETE TO authenticated
USING (
  (public.current_user_role() IN ('administrateur','propriétaire'))
  OR (
    public.current_user_role() = 'comptable'
    AND public.sale_items.sale_id IN (
      SELECT id FROM public.sales WHERE public.sales.site_id = public.current_user_site_id()
    )
  )
);


-- ============================================================================
-- 6. SITES — nouvelles politiques rôle (remplace role_* de 019)
--    sites.id est l'identifiant du site
-- ============================================================================

DROP POLICY IF EXISTS "role_select_sites" ON public.sites;
DROP POLICY IF EXISTS "role_insert_sites" ON public.sites;
DROP POLICY IF EXISTS "role_update_sites" ON public.sites;
DROP POLICY IF EXISTS "role_delete_sites" ON public.sites;

CREATE POLICY "role_select_sites" ON public.sites
FOR SELECT TO authenticated
USING (
  (public.current_user_role() IN ('administrateur','propriétaire'))
  OR (
    public.current_user_role() IN ('gestionnaire','comptable','financeur')
    AND public.sites.id = public.current_user_site_id()
  )
);

CREATE POLICY "role_insert_sites" ON public.sites
FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_role() IN ('administrateur','propriétaire','gestionnaire')
  AND public.sites.id = public.current_user_site_id()
);

CREATE POLICY "role_update_sites" ON public.sites
FOR UPDATE TO authenticated
USING (
  (public.current_user_role() IN ('administrateur','propriétaire'))
  OR (
    public.current_user_role() = 'gestionnaire'
    AND public.sites.id = public.current_user_site_id()
  )
)
WITH CHECK (
  public.current_user_role() = 'gestionnaire'
  AND public.sites.id = public.current_user_site_id()
);

CREATE POLICY "role_delete_sites" ON public.sites
FOR DELETE TO authenticated
USING (
  public.current_user_role() IN ('administrateur','propriétaire')
);


-- ============================================================================
-- 7. FUNDING_ALLOCATIONS — nouvelles politiques rôle (remplace role_* de 019)
-- ============================================================================

DROP POLICY IF EXISTS "role_select_funding_allocations" ON public.funding_allocations;
DROP POLICY IF EXISTS "role_insert_funding_allocations" ON public.funding_allocations;
DROP POLICY IF EXISTS "role_update_funding_allocations" ON public.funding_allocations;
DROP POLICY IF EXISTS "role_delete_funding_allocations" ON public.funding_allocations;

CREATE POLICY "role_select_funding_allocations" ON public.funding_allocations
FOR SELECT TO authenticated
USING (
  (public.current_user_role() IN ('administrateur','propriétaire'))
  OR (
    public.current_user_role() IN ('gestionnaire','comptable','financeur')
    AND public.funding_allocations.site_id = public.current_user_site_id()
  )
);

CREATE POLICY "role_insert_funding_allocations" ON public.funding_allocations
FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_role() IN ('administrateur','propriétaire','gestionnaire')
  AND public.funding_allocations.site_id = public.current_user_site_id()
);

CREATE POLICY "role_update_funding_allocations" ON public.funding_allocations
FOR UPDATE TO authenticated
USING (
  (public.current_user_role() IN ('administrateur','propriétaire'))
  OR (
    public.current_user_role() IN ('gestionnaire','financeur')
    AND public.funding_allocations.site_id = public.current_user_site_id()
  )
)
WITH CHECK (
  public.current_user_role() IN ('gestionnaire','financeur')
  AND public.funding_allocations.site_id = public.current_user_site_id()
);

CREATE POLICY "role_delete_funding_allocations" ON public.funding_allocations
FOR DELETE TO authenticated
USING (
  (public.current_user_role() IN ('administrateur','propriétaire'))
  OR (
    public.current_user_role() = 'financeur'
    AND public.funding_allocations.site_id = public.current_user_site_id()
  )
);


-- ============================================================================
-- 8. TRANSACTIONS — nouvelles politiques rôle (remplace role_* de 022)
--    site_id ajouté à l'étape 0
-- ============================================================================

DROP POLICY IF EXISTS "role_select_transactions" ON public.transactions;
DROP POLICY IF EXISTS "role_insert_transactions" ON public.transactions;
DROP POLICY IF EXISTS "role_update_transactions" ON public.transactions;
DROP POLICY IF EXISTS "role_delete_transactions" ON public.transactions;

CREATE POLICY "role_select_transactions" ON public.transactions
FOR SELECT TO authenticated
USING (
  (public.current_user_role() IN ('administrateur','propriétaire'))
  OR (
    public.current_user_role() IN ('gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur')
    AND public.transactions.site_id = public.current_user_site_id()
  )
);

CREATE POLICY "role_insert_transactions" ON public.transactions
FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_role() IN ('administrateur','propriétaire','gestionnaire','responsable_agricole','responsable_élevage')
  AND public.transactions.site_id = public.current_user_site_id()
);

CREATE POLICY "role_update_transactions" ON public.transactions
FOR UPDATE TO authenticated
USING (
  (public.current_user_role() IN ('administrateur','propriétaire'))
  OR (
    public.current_user_role() IN ('gestionnaire','responsable_agricole','responsable_élevage')
    AND public.transactions.site_id = public.current_user_site_id()
  )
)
WITH CHECK (
  public.current_user_role() IN ('gestionnaire','responsable_agricole','responsable_élevage')
  AND public.transactions.site_id = public.current_user_site_id()
);

CREATE POLICY "role_delete_transactions" ON public.transactions
FOR DELETE TO authenticated
USING (
  public.current_user_role() IN ('administrateur','propriétaire','comptable')
  AND public.transactions.site_id = public.current_user_site_id()
);


-- ============================================================================
-- 9. DOCUMENTS — nouvelles politiques rôle (remplace role_* de 022)
--    site_id ajouté à l'étape 0
-- ============================================================================

DROP POLICY IF EXISTS "role_select_documents" ON public.documents;
DROP POLICY IF EXISTS "role_insert_documents" ON public.documents;
DROP POLICY IF EXISTS "role_update_documents" ON public.documents;
DROP POLICY IF EXISTS "role_delete_documents" ON public.documents;

CREATE POLICY "role_select_documents" ON public.documents
FOR SELECT TO authenticated
USING (
  (public.current_user_role() IN ('administrateur','propriétaire'))
  OR (
    public.current_user_role() IN ('gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur')
    AND public.documents.site_id = public.current_user_site_id()
  )
);

CREATE POLICY "role_insert_documents" ON public.documents
FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_role() IN ('administrateur','propriétaire','gestionnaire','responsable_agricole','responsable_élevage')
  AND public.documents.site_id = public.current_user_site_id()
);

CREATE POLICY "role_update_documents" ON public.documents
FOR UPDATE TO authenticated
USING (
  (public.current_user_role() IN ('administrateur','propriétaire'))
  OR (
    public.current_user_role() IN ('gestionnaire','responsable_agricole','responsable_élevage')
    AND public.documents.site_id = public.current_user_site_id()
  )
)
WITH CHECK (
  public.current_user_role() IN ('gestionnaire','responsable_agricole','responsable_élevage')
  AND public.documents.site_id = public.current_user_site_id()
);

CREATE POLICY "role_delete_documents" ON public.documents
FOR DELETE TO authenticated
USING (
  public.current_user_role() IN ('administrateur','propriétaire','comptable')
  AND public.documents.site_id = public.current_user_site_id()
);


-- ============================================================================
-- 10. FUNDERS — politique lecture seule pour financeur (sa propre ligne)
-- ============================================================================

DROP POLICY IF EXISTS "role_select_funders" ON public.funders;
DROP POLICY IF EXISTS "role_insert_funders" ON public.funders;
DROP POLICY IF EXISTS "role_update_funders" ON public.funders;
DROP POLICY IF EXISTS "role_delete_funders" ON public.funders;

CREATE POLICY "role_select_funders" ON public.funders
FOR SELECT TO authenticated
USING (
  (public.current_user_role() IN ('administrateur','propriétaire','gestionnaire','comptable'))
  OR (
    public.current_user_role() = 'financeur'
    AND public.funders.id = public.current_user_funder_id()
  )
);

CREATE POLICY "role_insert_funders" ON public.funders
FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_role() IN ('administrateur','propriétaire','gestionnaire')
);

CREATE POLICY "role_update_funders" ON public.funders
FOR UPDATE TO authenticated
USING (
  public.current_user_role() IN ('administrateur','propriétaire','gestionnaire')
);

CREATE POLICY "role_delete_funders" ON public.funders
FOR DELETE TO authenticated
USING (
  public.current_user_role() IN ('administrateur','propriétaire')
);


-- ============================================================================
-- 11. FORCE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.customers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sites FORCE ROW LEVEL SECURITY;
ALTER TABLE public.funding_allocations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.documents FORCE ROW LEVEL SECURITY;
ALTER TABLE public.funders FORCE ROW LEVEL SECURITY;

-- fundings, expenses, sales déjà FORCE RLS (031, 037). Redéclaré pour idempotence.
ALTER TABLE public.fundings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.expenses FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sales FORCE ROW LEVEL SECURITY;


-- ============================================================================
-- 12. GARDE-FOU : absence de politique USING true / WITH CHECK true
--     et présence de FORCE RLS sur les tables durcies
-- ============================================================================

DO $$
DECLARE
  pol record;
  tbl record;
  expected_tables text[] := ARRAY[
    'customers','sale_items','sites','funding_allocations',
    'transactions','documents','funders','fundings','expenses','sales'
  ];
BEGIN
  -- Vérifier FORCE ROW LEVEL SECURITY
  FOR tbl IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = ANY(expected_tables)
      AND c.relkind = 'r'
  LOOP
    IF NOT (SELECT relforcerowsecurity FROM pg_class
            WHERE oid = ('public.' || tbl.relname)::regclass) THEN
      RAISE EXCEPTION 'FORCE ROW LEVEL SECURITY manquant sur %', tbl.relname;
    END IF;
  END LOOP;

  -- Vérifier qu'aucune politique permissive ne subsiste sur ces tables
  FOR pol IN
    SELECT polname, polqual, polwithcheck, polrelid::regclass::text AS tbl
    FROM pg_policy
    WHERE polrelid::regclass::text = ANY(ARRAY[
      'public.customers','public.sale_items','public.sites',
      'public.funding_allocations','public.transactions',
      'public.documents','public.funders','public.fundings',
      'public.expenses','public.sales'
    ])
  LOOP
    IF pol.polqual IS NOT NULL AND trim(pol.polqual) IN ('true', '(true)') THEN
      RAISE EXCEPTION 'Politique USING permissive détectée : % sur %', pol.polname, pol.tbl;
    END IF;
    IF pol.polwithcheck IS NOT NULL AND trim(pol.polwithcheck) IN ('true', '(true)') THEN
      RAISE EXCEPTION 'Politique WITH CHECK permissive détectée : % sur %', pol.polname, pol.tbl;
    END IF;
  END LOOP;
END $$;
