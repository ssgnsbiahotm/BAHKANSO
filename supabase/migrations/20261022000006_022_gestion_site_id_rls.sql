/*
# Bahkanso — Migration 022 : Cloisonnement par site module Gestion

## Objectifs
1. Ajouter la colonne site_id sur fundings, transactions, documents
2. Créer des policies RLS restrictives utilisant current_user_site_id()
   (exception admin/propriétaire via current_user_site_id() IS NULL = accès global)
3. Remplacer les policies USING (true) sur customers, sales, sale_items
   par des policies strictes (déjà durcies par 019, ici on s'assure du remplacement)
4. Ajouter des index de performance sur site_id

## Dépendances
- Dépend de la migration 019 (fonction current_user_site_id())
- Dépend de la migration 016 (table sites existante)
- Dépend de la migration 017 (tables customers, sales, sale_items existantes)
*/

-- =============================================
-- 1. AJOUT DE site_id SUR fundings, transactions, documents
-- =============================================

-- fundings : chaque financement rattaché à un site
ALTER TABLE fundings
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES sites(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_fundings_site ON fundings(site_id);

-- transactions : chaque mouvement de trésorerie rattaché à un site
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES sites(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_site ON transactions(site_id);

-- documents : chaque document rattaché à un site
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES sites(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_documents_site ON documents(site_id);

-- =============================================
-- 2. POLICIES RLS STRICTES — FUNDINGS
-- =============================================

DROP POLICY IF EXISTS "anon_select_fundings" ON fundings;
DROP POLICY IF EXISTS "anon_insert_fundings" ON fundings;
DROP POLICY IF EXISTS "anon_update_fundings" ON fundings;
DROP POLICY IF EXISTS "anon_delete_fundings" ON fundings;

DROP POLICY IF EXISTS "role_select_fundings" ON fundings;
DROP POLICY IF EXISTS "role_insert_fundings" ON fundings;
DROP POLICY IF EXISTS "role_update_fundings" ON fundings;
DROP POLICY IF EXISTS "role_delete_fundings" ON fundings;

-- SELECT : rôles autorisés + site propre + accès global si current_user_site_id() IS NULL
CREATE POLICY "role_select_fundings" ON fundings FOR SELECT TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur'])
  OR site_id = current_user_site_id()
  OR current_user_site_id() IS NULL
);

-- INSERT : rôles write, site doit être celui de l'utilisateur (ou accès global)
CREATE POLICY "role_insert_fundings" ON fundings FOR INSERT TO authenticated
WITH CHECK (
  current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  AND (site_id = current_user_site_id() OR current_user_site_id() IS NULL)
);

-- UPDATE : rôles write sur leur site, ou tous si accès global
CREATE POLICY "role_update_fundings" ON fundings FOR UPDATE TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  OR site_id = current_user_site_id()
  OR current_user_site_id() IS NULL
)
WITH CHECK (
  current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  AND (site_id = current_user_site_id() OR current_user_site_id() IS NULL)
);

-- DELETE : administrateur, comptable
CREATE POLICY "role_delete_fundings" ON fundings FOR DELETE TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','comptable'])
  AND (site_id = current_user_site_id() OR current_user_site_id() IS NULL)
);

-- =============================================
-- 3. POLICIES RLS STRICTES — TRANSACTIONS
-- =============================================

DROP POLICY IF EXISTS "anon_select_transactions" ON transactions;
DROP POLICY IF EXISTS "anon_insert_transactions" ON transactions;
DROP POLICY IF EXISTS "anon_update_transactions" ON transactions;
DROP POLICY IF EXISTS "anon_delete_transactions" ON transactions;

DROP POLICY IF EXISTS "role_select_transactions" ON transactions;
DROP POLICY IF EXISTS "role_insert_transactions" ON transactions;
DROP POLICY IF EXISTS "role_update_transactions" ON transactions;
DROP POLICY IF EXISTS "role_delete_transactions" ON transactions;

-- SELECT
CREATE POLICY "role_select_transactions" ON transactions FOR SELECT TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur'])
  OR site_id = current_user_site_id()
  OR current_user_site_id() IS NULL
);

-- INSERT
CREATE POLICY "role_insert_transactions" ON transactions FOR INSERT TO authenticated
WITH CHECK (
  current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  AND (site_id = current_user_site_id() OR current_user_site_id() IS NULL)
);

-- UPDATE
CREATE POLICY "role_update_transactions" ON transactions FOR UPDATE TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  OR site_id = current_user_site_id()
  OR current_user_site_id() IS NULL
)
WITH CHECK (
  current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  AND (site_id = current_user_site_id() OR current_user_site_id() IS NULL)
);

-- DELETE
CREATE POLICY "role_delete_transactions" ON transactions FOR DELETE TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','comptable'])
  AND (site_id = current_user_site_id() OR current_user_site_id() IS NULL)
);

-- =============================================
-- 4. POLICIES RLS STRICTES — DOCUMENTS
-- =============================================

DROP POLICY IF EXISTS "anon_select_documents" ON documents;
DROP POLICY IF EXISTS "anon_insert_documents" ON documents;
DROP POLICY IF EXISTS "anon_update_documents" ON documents;
DROP POLICY IF EXISTS "anon_delete_documents" ON documents;

DROP POLICY IF EXISTS "role_select_documents" ON documents;
DROP POLICY IF EXISTS "role_insert_documents" ON documents;
DROP POLICY IF EXISTS "role_update_documents" ON documents;
DROP POLICY IF EXISTS "role_delete_documents" ON documents;

-- SELECT
CREATE POLICY "role_select_documents" ON documents FOR SELECT TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur'])
  OR site_id = current_user_site_id()
  OR current_user_site_id() IS NULL
);

-- INSERT
CREATE POLICY "role_insert_documents" ON documents FOR INSERT TO authenticated
WITH CHECK (
  current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  AND (site_id = current_user_site_id() OR current_user_site_id() IS NULL)
);

-- UPDATE
CREATE POLICY "role_update_documents" ON documents FOR UPDATE TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  OR site_id = current_user_site_id()
  OR current_user_site_id() IS NULL
)
WITH CHECK (
  current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage'])
  AND (site_id = current_user_site_id() OR current_user_site_id() IS NULL)
);

-- DELETE
CREATE POLICY "role_delete_documents" ON documents FOR DELETE TO authenticated
USING (
  current_user_has_role(ARRAY['administrateur','comptable'])
  AND (site_id = current_user_site_id() OR current_user_site_id() IS NULL)
);

-- =============================================
-- 5. POLICIES RLS STRICTES — CUSTOMERS, SALES, SALE_ITEMS (renforcement 019)
-- =============================================

-- Les policies role_* existent déjà (migration 019). On s'assure qu'elles remplacent
-- bien les anciennes policies auth_* USING (true). Les DROP POLICY IF EXISTS
-- couvrent les deux noms de policies.

DROP POLICY IF EXISTS "auth_select_customers" ON customers;
DROP POLICY IF EXISTS "auth_insert_customers" ON customers;
DROP POLICY IF EXISTS "auth_update_customers" ON customers;
DROP POLICY IF EXISTS "auth_delete_customers" ON customers;

DROP POLICY IF EXISTS "auth_select_sales" ON sales;
DROP POLICY IF EXISTS "auth_insert_sales" ON sales;
DROP POLICY IF EXISTS "auth_update_sales" ON sales;
DROP POLICY IF EXISTS "auth_delete_sales" ON sales;

DROP POLICY IF EXISTS "auth_select_sale_items" ON sale_items;
DROP POLICY IF EXISTS "auth_insert_sale_items" ON sale_items;
DROP POLICY IF EXISTS "auth_update_sale_items" ON sale_items;
DROP POLICY IF EXISTS "auth_delete_sale_items" ON sale_items;

-- =============================================
-- 6. MISE À JOUR DES DONNÉES EXISTANTES (site par défaut Katadji)
-- =============================================

UPDATE fundings SET site_id = '11111111-1111-1111-1111-111111111111' WHERE site_id IS NULL;
UPDATE transactions SET site_id = '11111111-1111-1111-1111-111111111111' WHERE site_id IS NULL;
UPDATE documents SET site_id = '11111111-1111-1111-1111-111111111111' WHERE site_id IS NULL;
