/*
# Bahkanso — Migration 019 : Durcissement RLS Ventes + Séquence VTE

## Objectifs
1. Fonction current_user_site_id() pour cloisonnement par site
2. Policies RLS strictes sur sales, customers, sale_items, sites, funding_allocations
3. Séquence PostgreSQL pour génération VTE-YYYY-NNNNN sans race condition
*/

-- =============================================
-- 1. FONCTION current_user_site_id()
-- =============================================

CREATE OR REPLACE FUNCTION public.current_user_site_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT site_id FROM app_users
  WHERE auth_id = auth.uid()
  AND active = true
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.current_user_site_id() IS
'SECURITY DEFINER : retourne le site_id de l''utilisateur courant pour RLS par site. NULL = accès global (admin).';

-- =============================================
-- 2. POLICIES RLS STRICTES — SITES
-- =============================================

DROP POLICY IF EXISTS "auth_select_sites" ON sites;
DROP POLICY IF EXISTS "auth_insert_sites" ON sites;
DROP POLICY IF EXISTS "auth_update_sites" ON sites;
DROP POLICY IF EXISTS "auth_delete_sites" ON sites;

-- SELECT : admin/propriétaire/financeur/gestionnaire/comptable voient tous les sites
-- autres voient seulement leur site (via site_id)
CREATE POLICY "role_select_sites" ON sites FOR SELECT TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable'])
  OR id = current_user_site_id()
  OR current_user_site_id() IS NULL
);

-- INSERT : admin/propriétaire/gestionnaire uniquement
CREATE POLICY "role_insert_sites" ON sites FOR INSERT TO authenticated
WITH CHECK (
  current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire'])
);

-- UPDATE : admin/propriétaire/gestionnaire sur tous ; autres sur leur site seulement
CREATE POLICY "role_update_sites" ON sites FOR UPDATE TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire'])
  OR id = current_user_site_id()
)
WITH CHECK (
  current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire'])
  OR id = current_user_site_id()
);

-- DELETE : admin/propriétaire uniquement
CREATE POLICY "role_delete_sites" ON sites FOR DELETE TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','propriétaire'])
);

-- =============================================
-- 3. POLICIES RLS STRICTES — FUNDING_ALLOCATIONS
-- =============================================

DROP POLICY IF EXISTS "auth_select_funding_allocations" ON funding_allocations;
DROP POLICY IF EXISTS "auth_insert_funding_allocations" ON funding_allocations;
DROP POLICY IF EXISTS "auth_update_funding_allocations" ON funding_allocations;
DROP POLICY IF EXISTS "auth_delete_funding_allocations" ON funding_allocations;

CREATE POLICY "role_select_funding_allocations" ON funding_allocations FOR SELECT TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable'])
  OR site_id = current_user_site_id()
  OR current_user_site_id() IS NULL
);

CREATE POLICY "role_insert_funding_allocations" ON funding_allocations FOR INSERT TO authenticated
WITH CHECK (
  current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire'])
);

CREATE POLICY "role_update_funding_allocations" ON funding_allocations FOR UPDATE TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire'])
  OR site_id = current_user_site_id()
)
WITH CHECK (
  current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire'])
  OR site_id = current_user_site_id()
);

CREATE POLICY "role_delete_funding_allocations" ON funding_allocations FOR DELETE TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','propriétaire','financeur'])
);

-- =============================================
-- 4. POLICIES RLS STRICTES — CUSTOMERS
-- =============================================

DROP POLICY IF EXISTS "auth_select_customers" ON customers;
DROP POLICY IF EXISTS "auth_insert_customers" ON customers;
DROP POLICY IF EXISTS "auth_update_customers" ON customers;
DROP POLICY IF EXISTS "auth_delete_customers" ON customers;

CREATE POLICY "role_select_customers" ON customers FOR SELECT TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  OR site_id = current_user_site_id()
  OR current_user_site_id() IS NULL
);

CREATE POLICY "role_insert_customers" ON customers FOR INSERT TO authenticated
WITH CHECK (
  current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  AND (site_id = current_user_site_id() OR current_user_site_id() IS NULL)
);

CREATE POLICY "role_update_customers" ON customers FOR UPDATE TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  OR site_id = current_user_site_id()
  OR current_user_site_id() IS NULL
)
WITH CHECK (
  current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  AND (site_id = current_user_site_id() OR current_user_site_id() IS NULL)
);

CREATE POLICY "role_delete_customers" ON customers FOR DELETE TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','propriétaire','comptable'])
);

-- =============================================
-- 5. POLICIES RLS STRICTES — SALES
-- =============================================

DROP POLICY IF EXISTS "auth_select_sales" ON sales;
DROP POLICY IF EXISTS "auth_insert_sales" ON sales;
DROP POLICY IF EXISTS "auth_update_sales" ON sales;
DROP POLICY IF EXISTS "auth_delete_sales" ON sales;

CREATE POLICY "role_select_sales" ON sales FOR SELECT TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  OR site_id = current_user_site_id()
  OR current_user_site_id() IS NULL
);

CREATE POLICY "role_insert_sales" ON sales FOR INSERT TO authenticated
WITH CHECK (
  current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  AND (site_id = current_user_site_id() OR current_user_site_id() IS NULL)
);

CREATE POLICY "role_update_sales" ON sales FOR UPDATE TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  OR site_id = current_user_site_id()
  OR current_user_site_id() IS NULL
)
WITH CHECK (
  current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  AND (site_id = current_user_site_id() OR current_user_site_id() IS NULL)
);

CREATE POLICY "role_delete_sales" ON sales FOR DELETE TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','propriétaire','comptable'])
);

-- =============================================
-- 6. POLICIES RLS STRICTES — SALE_ITEMS
-- =============================================

DROP POLICY IF EXISTS "auth_select_sale_items" ON sale_items;
DROP POLICY IF EXISTS "auth_insert_sale_items" ON sale_items;
DROP POLICY IF EXISTS "auth_update_sale_items" ON sale_items;
DROP POLICY IF EXISTS "auth_delete_sale_items" ON sale_items;

CREATE POLICY "role_select_sale_items" ON sale_items FOR SELECT TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  OR sale_id IN (
    SELECT id FROM sales
    WHERE site_id = current_user_site_id() OR current_user_site_id() IS NULL
  )
);

CREATE POLICY "role_insert_sale_items" ON sale_items FOR INSERT TO authenticated
WITH CHECK (
  current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  AND sale_id IN (
    SELECT id FROM sales
    WHERE site_id = current_user_site_id() OR current_user_site_id() IS NULL
  )
);

CREATE POLICY "role_update_sale_items" ON sale_items FOR UPDATE TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  OR sale_id IN (
    SELECT id FROM sales
    WHERE site_id = current_user_site_id() OR current_user_site_id() IS NULL
  )
)
WITH CHECK (
  current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  AND sale_id IN (
    SELECT id FROM sales
    WHERE site_id = current_user_site_id() OR current_user_site_id() IS NULL
  )
);

CREATE POLICY "role_delete_sale_items" ON sale_items FOR DELETE TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','propriétaire','comptable'])
  OR sale_id IN (
    SELECT id FROM sales
    WHERE site_id = current_user_site_id() OR current_user_site_id() IS NULL
  )
);

-- =============================================
-- 7. SÉQUENCE POUR RÉFÉRENCE VTE-YYYY-NNNNN
-- =============================================

-- Une séquence par année pour gérer le cycle annuel
CREATE SEQUENCE IF NOT EXISTS sale_ref_seq;

-- Fonction mise à jour utilisant la séquence (atomic, sans race condition)
CREATE OR REPLACE FUNCTION generate_sale_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $$
DECLARE
  current_year int := extract(year from now());
  seq_num int;
BEGIN
  -- Utiliser nextval sur une séquence (atomic, thread-safe)
  -- La séquence est globale ; on réinitialise via cycle ou manuellement chaque année
  seq_num := nextval('sale_ref_seq');
  NEW.reference := 'VTE-' || current_year || '-' || lpad(seq_num::text, 5, '0');
  RETURN NEW;
END;
$$;

-- =============================================
-- 8. INDEX SUPPLÉMENTAIRES POUR PERF RLS
-- =============================================

CREATE INDEX IF NOT EXISTS idx_app_users_auth_id_active ON app_users(auth_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_app_users_role_site ON app_users(role, site_id) WHERE active = true;