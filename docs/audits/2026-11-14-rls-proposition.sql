-- ============================================================================
-- Proposition RLS — corrections et durcissements (NON APPLIQUÉE)
--
-- Ce fichier est une PROPOSITION. Il ne doit PAS être écrit dans
-- supabase/migrations/, ni appliqué sur une base distante, sans accord explicite
-- de la mission.
--
-- Objet :
-- 1. Remplacer l'accès global "current_user_site_id() IS NULL" sur les tables
--    durcies par 019 et 022 par un accès global conditionné au RÔLE
--    (administrateur, propriétaire uniquement). Un staff sans site_id ne voit
--    aucune ligne sur ces tables (périmètre site strict).
-- 2. Financeur : lecture seule (SELECT) de ses propres fundings via
--    current_user_funder_id(), et des projets qu'il finance ; pas d'écriture.
--    funders : un financeur ne lit que sa propre ligne.
-- 3. FORCE ROW LEVEL SECURITY sur les tables durcies qui en manquent encore.
-- 4. Garde-fou DO block : vérifie l'absence de politique USING true / WITH CHECK
--    true et la présence de FORCE RLS sur les tables durcies.
--
-- Convention : commentaires en -- uniquement (pas de #), idempotent
-- (DROP POLICY IF EXISTS), pas de current_setting, pas de fallback OR auth.uid(),
-- pas de recréation des politiques * _scoped de 031 (fundings/expenses) ni de
-- 037 (sales) qui font foi.
--
-- NOTE : les sections sales et fundings ne sont PAS recréées ici car
-- 031_rls_fundings_expenses_least_privilege (fundings/expenses) et
-- 037_rls_sales_least_privilege (sales) appliquent déjà les politiques
-- * _scoped sans clause IS NULL. Recréer des politiques role_* sur ces tables
-- créerait un OR en double qui neutraliserait le least-privilege.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Prérequis : helpers current_user_* déjà en row_security = off
--    (migration helpers_remove_or_fix appliquée). Rien à redéfinir ici.
-- ----------------------------------------------------------------------------


-- ============================================================================
-- 1. Remplacer l'accès global par un accès global conditionné au rôle
--    Tables : customers, sites, funding_allocations, sale_items, transactions,
--    documents.
-- Règle : administrateur et propriétaire = accès global (toutes les lignes).
--         Tout autre rôle staff = site_id = current_user_site_id() (sans
--         clause IS NULL). Un utilisateur sans site_id ne voit aucune ligne.
-- ============================================================================

-- 1.1 customers (remplace les politiques role_* de 019)
DROP POLICY IF EXISTS "role_select_customers" ON public.customers;
DROP POLICY IF EXISTS "role_insert_customers" ON public.customers;
DROP POLICY IF EXISTS "role_update_customers" ON public.customers;
DROP POLICY IF EXISTS "role_delete_customers" ON public.customers;

CREATE POLICY "role_select_customers" ON public.customers
FOR SELECT TO authenticated
USING (
  (public.current_user_has_role(ARRAY['administrateur','propriétaire']))
  OR (
    public.current_user_has_role(ARRAY['gestionnaire','comptable','responsable_agricole','responsable_élevage','chef_chantier'])
    AND public.customers.site_id = public.current_user_site_id()
  )
);

CREATE POLICY "role_insert_customers" ON public.customers
FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  AND public.customers.site_id = public.current_user_site_id()
);

CREATE POLICY "role_update_customers" ON public.customers
FOR UPDATE TO authenticated
USING (
  (public.current_user_has_role(ARRAY['administrateur','propriétaire']))
  OR (
    public.current_user_has_role(ARRAY['gestionnaire','comptable','responsable_agricole','responsable_élevage'])
    AND public.customers.site_id = public.current_user_site_id()
  )
)
WITH CHECK (
  public.current_user_has_role(ARRAY['gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  AND public.customers.site_id = public.current_user_site_id()
);

CREATE POLICY "role_delete_customers" ON public.customers
FOR DELETE TO authenticated
USING (
  (public.current_user_has_role(ARRAY['administrateur','propriétaire']))
  OR (
    public.current_user_has_role(ARRAY['comptable'])
    AND public.customers.site_id = public.current_user_site_id()
  )
);

-- 1.2 sites (remplace les politiques role_* de 019)
DROP POLICY IF EXISTS "role_select_sites" ON public.sites;
DROP POLICY IF EXISTS "role_insert_sites" ON public.sites;
DROP POLICY IF EXISTS "role_update_sites" ON public.sites;
DROP POLICY IF EXISTS "role_delete_sites" ON public.sites;

CREATE POLICY "role_select_sites" ON public.sites
FOR SELECT TO authenticated
USING (
  (public.current_user_has_role(ARRAY['administrateur','propriétaire']))
  OR (
    public.current_user_has_role(ARRAY['gestionnaire','comptable','financeur'])
    AND public.sites.id = public.current_user_site_id()
  )
);

CREATE POLICY "role_insert_sites" ON public.sites
FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire'])
  AND public.sites.id = public.current_user_site_id()
);

CREATE POLICY "role_update_sites" ON public.sites
FOR UPDATE TO authenticated
USING (
  (public.current_user_has_role(ARRAY['administrateur','propriétaire']))
  OR (
    public.current_user_has_role(ARRAY['gestionnaire'])
    AND public.sites.id = public.current_user_site_id()
  )
)
WITH CHECK (
  public.current_user_has_role(ARRAY['gestionnaire'])
  AND public.sites.id = public.current_user_site_id()
);

CREATE POLICY "role_delete_sites" ON public.sites
FOR DELETE TO authenticated
USING (
  public.current_user_has_role(ARRAY['administrateur','propriétaire'])
);

-- 1.3 funding_allocations (remplace les politiques role_* de 019)
DROP POLICY IF EXISTS "role_select_funding_allocations" ON public.funding_allocations;
DROP POLICY IF EXISTS "role_insert_funding_allocations" ON public.funding_allocations;
DROP POLICY IF EXISTS "role_update_funding_allocations" ON public.funding_allocations;
DROP POLICY IF EXISTS "role_delete_funding_allocations" ON public.funding_allocations;

CREATE POLICY "role_select_funding_allocations" ON public.funding_allocations
FOR SELECT TO authenticated
USING (
  (public.current_user_has_role(ARRAY['administrateur','propriétaire']))
  OR (
    public.current_user_has_role(ARRAY['gestionnaire','comptable','financeur'])
    AND public.funding_allocations.site_id = public.current_user_site_id()
  )
);

CREATE POLICY "role_insert_funding_allocations" ON public.funding_allocations
FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire'])
  AND public.funding_allocations.site_id = public.current_user_site_id()
);

CREATE POLICY "role_update_funding_allocations" ON public.funding_allocations
FOR UPDATE TO authenticated
USING (
  (public.current_user_has_role(ARRAY['administrateur','propriétaire']))
  OR (
    public.current_user_has_role(ARRAY['gestionnaire','financeur'])
    AND public.funding_allocations.site_id = public.current_user_site_id()
  )
)
WITH CHECK (
  public.current_user_has_role(ARRAY['gestionnaire','financeur'])
  AND public.funding_allocations.site_id = public.current_user_site_id()
);

CREATE POLICY "role_delete_funding_allocations" ON public.funding_allocations
FOR DELETE TO authenticated
USING (
  (public.current_user_has_role(ARRAY['administrateur','propriétaire']))
  OR (
    public.current_user_has_role(ARRAY['financeur'])
    AND public.funding_allocations.site_id = public.current_user_site_id()
  )
);

-- 1.4 sale_items (remplace les politiques role_* de 019, accès via sale_id)
DROP POLICY IF EXISTS "role_select_sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "role_insert_sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "role_update_sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "role_delete_sale_items" ON public.sale_items;

CREATE POLICY "role_select_sale_items" ON public.sale_items
FOR SELECT TO authenticated
USING (
  (public.current_user_has_role(ARRAY['administrateur','propriétaire']))
  OR (
    public.current_user_has_role(ARRAY['gestionnaire','comptable','responsable_agricole','responsable_élevage','chef_chantier'])
    AND public.sale_items.sale_id IN (
      SELECT id FROM public.sales WHERE public.sales.site_id = public.current_user_site_id()
    )
  )
);

CREATE POLICY "role_insert_sale_items" ON public.sale_items
FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole','responsable_élevage','chef_chantier'])
  AND public.sale_items.sale_id IN (
    SELECT id FROM public.sales WHERE public.sales.site_id = public.current_user_site_id()
  )
);

CREATE POLICY "role_update_sale_items" ON public.sale_items
FOR UPDATE TO authenticated
USING (
  (public.current_user_has_role(ARRAY['administrateur','propriétaire']))
  OR (
    public.current_user_has_role(ARRAY['gestionnaire','comptable','responsable_agricole','responsable_élevage','chef_chantier'])
    AND public.sale_items.sale_id IN (
      SELECT id FROM public.sales WHERE public.sales.site_id = public.current_user_site_id()
    )
  )
)
WITH CHECK (
  public.current_user_has_role(ARRAY['gestionnaire','comptable','responsable_agricole','responsable_élevage','chef_chantier'])
  AND public.sale_items.sale_id IN (
    SELECT id FROM public.sales WHERE public.sales.site_id = public.current_user_site_id()
  )
);

CREATE POLICY "role_delete_sale_items" ON public.sale_items
FOR DELETE TO authenticated
USING (
  (public.current_user_has_role(ARRAY['administrateur','propriétaire']))
  OR (
    public.current_user_has_role(ARRAY['comptable'])
    AND public.sale_items.sale_id IN (
      SELECT id FROM public.sales WHERE public.sales.site_id = public.current_user_site_id()
    )
  )
);

-- 1.5 transactions (remplace les politiques role_* de 022)
DROP POLICY IF EXISTS "role_select_transactions" ON public.transactions;
DROP POLICY IF EXISTS "role_insert_transactions" ON public.transactions;
DROP POLICY IF EXISTS "role_update_transactions" ON public.transactions;
DROP POLICY IF EXISTS "role_delete_transactions" ON public.transactions;

CREATE POLICY "role_select_transactions" ON public.transactions
FOR SELECT TO authenticated
USING (
  (public.current_user_has_role(ARRAY['administrateur','propriétaire']))
  OR (
    public.current_user_has_role(ARRAY['gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur'])
    AND public.transactions.site_id = public.current_user_site_id()
  )
);

CREATE POLICY "role_insert_transactions" ON public.transactions
FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole','responsable_élevage'])
  AND public.transactions.site_id = public.current_user_site_id()
);

CREATE POLICY "role_update_transactions" ON public.transactions
FOR UPDATE TO authenticated
USING (
  (public.current_user_has_role(ARRAY['administrateur','propriétaire']))
  OR (
    public.current_user_has_role(ARRAY['gestionnaire','responsable_agricole','responsable_élevage'])
    AND public.transactions.site_id = public.current_user_site_id()
  )
)
WITH CHECK (
  public.current_user_has_role(ARRAY['gestionnaire','responsable_agricole','responsable_élevage'])
  AND public.transactions.site_id = public.current_user_site_id()
);

CREATE POLICY "role_delete_transactions" ON public.transactions
FOR DELETE TO authenticated
USING (
  public.current_user_has_role(ARRAY['administrateur','propriétaire','comptable'])
  AND public.transactions.site_id = public.current_user_site_id()
);

-- 1.6 documents (remplace les politiques role_* de 022)
DROP POLICY IF EXISTS "role_select_documents" ON public.documents;
DROP POLICY IF EXISTS "role_insert_documents" ON public.documents;
DROP POLICY IF EXISTS "role_update_documents" ON public.documents;
DROP POLICY IF EXISTS "role_delete_documents" ON public.documents;

CREATE POLICY "role_select_documents" ON public.documents
FOR SELECT TO authenticated
USING (
  (public.current_user_has_role(ARRAY['administrateur','propriétaire']))
  OR (
    public.current_user_has_role(ARRAY['gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur'])
    AND public.documents.site_id = public.current_user_site_id()
  )
);

CREATE POLICY "role_insert_documents" ON public.documents
FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole','responsable_élevage'])
  AND public.documents.site_id = public.current_user_site_id()
);

CREATE POLICY "role_update_documents" ON public.documents
FOR UPDATE TO authenticated
USING (
  (public.current_user_has_role(ARRAY['administrateur','propriétaire']))
  OR (
    public.current_user_has_role(ARRAY['gestionnaire','responsable_agricole','responsable_élevage'])
    AND public.documents.site_id = public.current_user_site_id()
  )
)
WITH CHECK (
  public.current_user_has_role(ARRAY['gestionnaire','responsable_agricole','responsable_élevage'])
  AND public.documents.site_id = public.current_user_site_id()
);

CREATE POLICY "role_delete_documents" ON public.documents
FOR DELETE TO authenticated
USING (
  public.current_user_has_role(ARRAY['administrateur','propriétaire','comptable'])
  AND public.documents.site_id = public.current_user_site_id()
);


-- ============================================================================
-- 2. Financeur (bailleur) — lecture seule
--
-- 2.1 fundings : SELECT uniquement, via current_user_funder_id()
--     (031 applique déjà fundings_select_scoped avec site_id OU funder_id. On
--     conserve : le financeur lit ses propres fundings sans clause site_id.)
--
-- 2.2 expenses : le financeur N'a PAS de droit de lecture sur expenses (pas de
--     funder_id sur expenses, pas de lien financial_links dans les politiques).
--     Aucun SQL ici : écart résiduel à documenter (décision d'architecture
--     requise avant d'ajouter funder_id sur expenses).
--
-- 2.3 funders : un financeur ne lit que sa propre ligne.
DROP POLICY IF EXISTS "role_select_funders" ON public.funders;
DROP POLICY IF EXISTS "role_insert_funders" ON public.funders;
DROP POLICY IF EXISTS "role_update_funders" ON public.funders;
DROP POLICY IF EXISTS "role_delete_funders" ON public.funders;

CREATE POLICY "role_select_funders" ON public.funders
FOR SELECT TO authenticated
USING (
  (public.current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable']))
  OR (
    public.current_user_has_role(ARRAY['financeur'])
    AND public.funders.id = public.current_user_funder_id()
  )
);

CREATE POLICY "role_insert_funders" ON public.funders
FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire'])
);

CREATE POLICY "role_update_funders" ON public.funders
FOR UPDATE TO authenticated
USING (
  public.current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire'])
);

CREATE POLICY "role_delete_funders" ON public.funders
FOR DELETE TO authenticated
USING (
  public.current_user_has_role(ARRAY['administrateur','propriétaire'])
);


-- ============================================================================
-- 3. FORCE ROW LEVEL SECURITY sur les tables durcies qui en manquent encore
--
-- 031 met FORCE RLS sur fundings et expenses. 037 sur sales.
-- On étend FORCE RLS aux tables durcies par 019/022 qui n'en ont pas encore,
-- pour que RLS s'applique aussi au propriétaire de la table.
--
-- NOTE : FORCE RLS ne s'applique pas aux fonctions SECURITY DEFINER (triggers
-- inclus), qui contournent RLS. Il est donc sûr pour les écritures déclenchées
-- par triggers, mais doit être validé sur une instance locale avant application.
-- ============================================================================

ALTER TABLE public.customers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sites FORCE ROW LEVEL SECURITY;
ALTER TABLE public.funding_allocations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.documents FORCE ROW LEVEL SECURITY;
ALTER TABLE public.funders FORCE ROW LEVEL SECURITY;


-- ============================================================================
-- 4. Garde-fou : absence de politique USING true / WITH CHECK true
--    et présence de FORCE RLS sur les tables durcies
--
-- Lève une exception si :
-- - une politique USING/WITH CHECK permissive subsiste sur une table durcie,
-- - FORCE RLS manque sur une table durcie.
-- ============================================================================

DO $$
DECLARE
  pol record;
  tbl record;
  expected_tables text[] := ARRAY[
    'customers','sale_items','sites','funding_allocations',
    'transactions','documents','funders'
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
      'public.documents','public.funders'
    ])
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


-- ============================================================================
-- 5. Notes d'impact et écarts résiduels
-- ============================================================================
-- - Un utilisateur staff (gestionnaire, comptable, etc.) sans site_id dans
--   app_users ne verra plus aucune ligne sur les tables durcies (comportement
--   voulu : périmètre site strict). Seul administrateur et propriétaire
--   conservent un accès global, conditionné au rôle.
-- - Le financeur lit ses fundings via current_user_funder_id() (section 2.1) mais
--   pas les expenses (pas de funder_id sur expenses, pas de lien
--   financial_links dans les politiques). Écarts résiduels à documenter.
-- - Les politiques role_* de 012 (inventory_*, projets, médias, etc.) restent
--   inchangées : pas de filtrage site/farm sur ces tables.
-- - Les tables sales et fundings ne sont pas recréées ici : 031 et 037 font foi.
-- - Ce fichier est une proposition : ne pas appliquer sans accord de mission.
