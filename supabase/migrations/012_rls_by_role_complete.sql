-- Migration 012: RLS par rôle (complétion — 15 tables restantes)
-- Modules: inventory, suppliers, projects, media, monitoring, surveillance, configuration
-- Date: 2026-10-21

-- ============================================================
-- INVENTORY (module inventory)
-- Rôles read: admin, proprio, gestionnaire, comptable, resp_agri, resp_élevage, auditeur (7)
-- Rôles write: admin, gestionnaire, comptable, resp_agri, resp_élevage (5)
-- Rôles delete: admin (1)
-- ============================================================

-- inventory_items
DROP POLICY IF EXISTS auth_select_inventory_items ON inventory_items;
DROP POLICY IF EXISTS staff_select_inventory_items ON inventory_items;
CREATE POLICY "role_select_inventory_items" ON inventory_items FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_inventory_items ON inventory_items;
DROP POLICY IF EXISTS staff_insert_inventory_items ON inventory_items;
CREATE POLICY "role_insert_inventory_items" ON inventory_items FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_inventory_items ON inventory_items;
DROP POLICY IF EXISTS staff_update_inventory_items ON inventory_items;
CREATE POLICY "role_update_inventory_items" ON inventory_items FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','gestionnaire','comptable','responsable_agricole','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_inventory_items ON inventory_items;
DROP POLICY IF EXISTS staff_delete_inventory_items ON inventory_items;
CREATE POLICY "role_delete_inventory_items" ON inventory_items FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur']));

-- inventory_counts
DROP POLICY IF EXISTS auth_select_inventory_counts ON inventory_counts;
DROP POLICY IF EXISTS staff_select_inventory_counts ON inventory_counts;
CREATE POLICY "role_select_inventory_counts" ON inventory_counts FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_inventory_counts ON inventory_counts;
DROP POLICY IF EXISTS staff_insert_inventory_counts ON inventory_counts;
CREATE POLICY "role_insert_inventory_counts" ON inventory_counts FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_inventory_counts ON inventory_counts;
DROP POLICY IF EXISTS staff_update_inventory_counts ON inventory_counts;
CREATE POLICY "role_update_inventory_counts" ON inventory_counts FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','gestionnaire','comptable','responsable_agricole','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_inventory_counts ON inventory_counts;
DROP POLICY IF EXISTS staff_delete_inventory_counts ON inventory_counts;
CREATE POLICY "role_delete_inventory_counts" ON inventory_counts FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur']));

-- inventory_movements
DROP POLICY IF EXISTS auth_select_inventory_movements ON inventory_movements;
DROP POLICY IF EXISTS staff_select_inventory_movements ON inventory_movements;
CREATE POLICY "role_select_inventory_movements" ON inventory_movements FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_inventory_movements ON inventory_movements;
DROP POLICY IF EXISTS staff_insert_inventory_movements ON inventory_movements;
CREATE POLICY "role_insert_inventory_movements" ON inventory_movements FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_inventory_movements ON inventory_movements;
DROP POLICY IF EXISTS staff_update_inventory_movements ON inventory_movements;
CREATE POLICY "role_update_inventory_movements" ON inventory_movements FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','gestionnaire','comptable','responsable_agricole','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_inventory_movements ON inventory_movements;
DROP POLICY IF EXISTS staff_delete_inventory_movements ON inventory_movements;
CREATE POLICY "role_delete_inventory_movements" ON inventory_movements FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur']));

-- recipes
DROP POLICY IF EXISTS auth_select_recipes ON recipes;
DROP POLICY IF EXISTS staff_select_recipes ON recipes;
CREATE POLICY "role_select_recipes" ON recipes FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_recipes ON recipes;
DROP POLICY IF EXISTS staff_insert_recipes ON recipes;
CREATE POLICY "role_insert_recipes" ON recipes FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_recipes ON recipes;
DROP POLICY IF EXISTS staff_update_recipes ON recipes;
CREATE POLICY "role_update_recipes" ON recipes FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','gestionnaire','comptable','responsable_agricole','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_recipes ON recipes;
DROP POLICY IF EXISTS staff_delete_recipes ON recipes;
CREATE POLICY "role_delete_recipes" ON recipes FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur']));

-- ============================================================
-- SUPPLIERS (module suppliers)
-- Rôles read: admin, proprio, gestionnaire, comptable, resp_agri, resp_élevage, auditeur (7)
-- Rôles write: admin, gestionnaire, comptable, resp_agri, resp_élevage (5)
-- Rôles delete: admin (1)
-- ============================================================

-- suppliers
DROP POLICY IF EXISTS auth_select_suppliers ON suppliers;
DROP POLICY IF EXISTS staff_select_suppliers ON suppliers;
CREATE POLICY "role_select_suppliers" ON suppliers FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_suppliers ON suppliers;
DROP POLICY IF EXISTS staff_insert_suppliers ON suppliers;
CREATE POLICY "role_insert_suppliers" ON suppliers FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_suppliers ON suppliers;
DROP POLICY IF EXISTS staff_update_suppliers ON suppliers;
CREATE POLICY "role_update_suppliers" ON suppliers FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','gestionnaire','comptable','responsable_agricole','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_suppliers ON suppliers;
DROP POLICY IF EXISTS staff_delete_suppliers ON suppliers;
CREATE POLICY "role_delete_suppliers" ON suppliers FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur']));

-- ============================================================
-- PROJECTS (module projects)
-- Rôles read: admin, proprio, financeur, gestionnaire, resp_agri, resp_élevage, auditeur (7)
-- Rôles write: admin, proprio, gestionnaire, resp_agri, resp_élevage (5)
-- Rôles delete: admin (1)
-- ============================================================

-- projects
DROP POLICY IF EXISTS auth_select_projects ON projects;
DROP POLICY IF EXISTS staff_select_projects ON projects;
CREATE POLICY "role_select_projects" ON projects FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_projects ON projects;
DROP POLICY IF EXISTS staff_insert_projects ON projects;
CREATE POLICY "role_insert_projects" ON projects FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_projects ON projects;
DROP POLICY IF EXISTS staff_update_projects ON projects;
CREATE POLICY "role_update_projects" ON projects FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_projects ON projects;
DROP POLICY IF EXISTS staff_delete_projects ON projects;
CREATE POLICY "role_delete_projects" ON projects FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur']));

-- project_steps
DROP POLICY IF EXISTS auth_select_project_steps ON project_steps;
DROP POLICY IF EXISTS staff_select_project_steps ON project_steps;
CREATE POLICY "role_select_project_steps" ON project_steps FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_project_steps ON project_steps;
DROP POLICY IF EXISTS staff_insert_project_steps ON project_steps;
CREATE POLICY "role_insert_project_steps" ON project_steps FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_project_steps ON project_steps;
DROP POLICY IF EXISTS staff_update_project_steps ON project_steps;
CREATE POLICY "role_update_project_steps" ON project_steps FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_project_steps ON project_steps;
DROP POLICY IF EXISTS staff_delete_project_steps ON project_steps;
CREATE POLICY "role_delete_project_steps" ON project_steps FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur']));

-- ============================================================
-- MEDIA (module media)
-- Rôles read: tous (8)
-- Rôles write: admin, gestionnaire, resp_agri, resp_élevage (4)
-- Rôles delete: admin (1)
-- ============================================================

-- media
DROP POLICY IF EXISTS auth_select_media ON media;
DROP POLICY IF EXISTS staff_select_media ON media;
CREATE POLICY "role_select_media" ON media FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_media ON media;
DROP POLICY IF EXISTS staff_insert_media ON media;
CREATE POLICY "role_insert_media" ON media FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_media ON media;
DROP POLICY IF EXISTS staff_update_media ON media;
CREATE POLICY "role_update_media" ON media FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_media ON media;
DROP POLICY IF EXISTS staff_delete_media ON media;
CREATE POLICY "role_delete_media" ON media FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur']));

-- ============================================================
-- MONITORING (module monitoring)
-- Rôles read: admin, proprio, gestionnaire, resp_agri, resp_élevage, auditeur (6)
-- Rôles write: admin, gestionnaire, resp_agri, resp_élevage (4)
-- Rôles delete: admin (1)
-- ============================================================

-- alerts
DROP POLICY IF EXISTS auth_select_alerts ON alerts;
DROP POLICY IF EXISTS staff_select_alerts ON alerts;
CREATE POLICY "role_select_alerts" ON alerts FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_alerts ON alerts;
DROP POLICY IF EXISTS staff_insert_alerts ON alerts;
CREATE POLICY "role_insert_alerts" ON alerts FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_alerts ON alerts;
DROP POLICY IF EXISTS staff_update_alerts ON alerts;
CREATE POLICY "role_update_alerts" ON alerts FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_alerts ON alerts;
DROP POLICY IF EXISTS staff_delete_alerts ON alerts;
CREATE POLICY "role_delete_alerts" ON alerts FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur']));

-- notifications
DROP POLICY IF EXISTS auth_select_notifications ON notifications;
DROP POLICY IF EXISTS staff_select_notifications ON notifications;
CREATE POLICY "role_select_notifications" ON notifications FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_notifications ON notifications;
DROP POLICY IF EXISTS staff_insert_notifications ON notifications;
CREATE POLICY "role_insert_notifications" ON notifications FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_notifications ON notifications;
DROP POLICY IF EXISTS staff_update_notifications ON notifications;
CREATE POLICY "role_update_notifications" ON notifications FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_notifications ON notifications;
DROP POLICY IF EXISTS staff_delete_notifications ON notifications;
CREATE POLICY "role_delete_notifications" ON notifications FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur']));

-- ============================================================
-- SURVEILLANCE (module surveillance)
-- Rôles read: tous (8)
-- Rôles write: admin, gestionnaire, resp_agri, resp_élevage (4)
-- Rôles delete: admin (1)
-- ============================================================

-- surveillance_events
DROP POLICY IF EXISTS auth_select_surveillance_events ON surveillance_events;
DROP POLICY IF EXISTS staff_select_surveillance_events ON surveillance_events;
CREATE POLICY "role_select_surveillance_events" ON surveillance_events FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_surveillance_events ON surveillance_events;
DROP POLICY IF EXISTS staff_insert_surveillance_events ON surveillance_events;
CREATE POLICY "role_insert_surveillance_events" ON surveillance_events FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_surveillance_events ON surveillance_events;
DROP POLICY IF EXISTS staff_update_surveillance_events ON surveillance_events;
CREATE POLICY "role_update_surveillance_events" ON surveillance_events FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_surveillance_events ON surveillance_events;
DROP POLICY IF EXISTS staff_delete_surveillance_events ON surveillance_events;
CREATE POLICY "role_delete_surveillance_events" ON surveillance_events FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur']));

-- ============================================================
-- CONFIGURATION (module configuration)
-- Rôles read: tous (8)
-- Rôles write: admin, proprio, gestionnaire (3)
-- Rôles delete: admin (1)
-- ============================================================

-- site_content
DROP POLICY IF EXISTS auth_select_site_content ON site_content;
DROP POLICY IF EXISTS staff_select_site_content ON site_content;
CREATE POLICY "role_select_site_content" ON site_content FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_site_content ON site_content;
DROP POLICY IF EXISTS staff_insert_site_content ON site_content;
CREATE POLICY "role_insert_site_content" ON site_content FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire']));

DROP POLICY IF EXISTS auth_update_site_content ON site_content;
DROP POLICY IF EXISTS staff_update_site_content ON site_content;
CREATE POLICY "role_update_site_content" ON site_content FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire']));

DROP POLICY IF EXISTS auth_delete_site_content ON site_content;
DROP POLICY IF EXISTS staff_delete_site_content ON site_content;
CREATE POLICY "role_delete_site_content" ON site_content FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur']));

-- farms
DROP POLICY IF EXISTS auth_select_farms ON farms;
DROP POLICY IF EXISTS staff_select_farms ON farms;
CREATE POLICY "role_select_farms" ON farms FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_farms ON farms;
DROP POLICY IF EXISTS staff_insert_farms ON farms;
CREATE POLICY "role_insert_farms" ON farms FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire']));

DROP POLICY IF EXISTS auth_update_farms ON farms;
DROP POLICY IF EXISTS staff_update_farms ON farms;
CREATE POLICY "role_update_farms" ON farms FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire']));

DROP POLICY IF EXISTS auth_delete_farms ON farms;
DROP POLICY IF EXISTS staff_delete_farms ON farms;
CREATE POLICY "role_delete_farms" ON farms FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur']));

-- sites
DROP POLICY IF EXISTS auth_select_sites ON sites;
DROP POLICY IF EXISTS staff_select_sites ON sites;
CREATE POLICY "role_select_sites" ON sites FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_sites ON sites;
DROP POLICY IF EXISTS staff_insert_sites ON sites;
CREATE POLICY "role_insert_sites" ON sites FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire']));

DROP POLICY IF EXISTS auth_update_sites ON sites;
DROP POLICY IF EXISTS staff_update_sites ON sites;
CREATE POLICY "role_update_sites" ON sites FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire']));

DROP POLICY IF EXISTS auth_delete_sites ON sites;
DROP POLICY IF EXISTS staff_delete_sites ON sites;
CREATE POLICY "role_delete_sites" ON sites FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur']));

-- ============================================================
-- FINANCE (tables restantes du module finance)
-- Rôles read: tous (8)
-- Rôles write: admin, proprio, financeur, gestionnaire, comptable, resp_agri, resp_élevage (7)
-- Rôles delete: admin, comptable (2)
-- ============================================================

-- bank_accounts
DROP POLICY IF EXISTS auth_select_bank_accounts ON bank_accounts;
DROP POLICY IF EXISTS staff_select_bank_accounts ON bank_accounts;
CREATE POLICY "role_select_bank_accounts" ON bank_accounts FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_bank_accounts ON bank_accounts;
DROP POLICY IF EXISTS staff_insert_bank_accounts ON bank_accounts;
CREATE POLICY "role_insert_bank_accounts" ON bank_accounts FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_bank_accounts ON bank_accounts;
DROP POLICY IF EXISTS staff_update_bank_accounts ON bank_accounts;
CREATE POLICY "role_update_bank_accounts" ON bank_accounts FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_bank_accounts ON bank_accounts;
DROP POLICY IF EXISTS staff_delete_bank_accounts ON bank_accounts;
CREATE POLICY "role_delete_bank_accounts" ON bank_accounts FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','comptable']));

-- budgets
DROP POLICY IF EXISTS auth_select_budgets ON budgets;
DROP POLICY IF EXISTS staff_select_budgets ON budgets;
CREATE POLICY "role_select_budgets" ON budgets FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_budgets ON budgets;
DROP POLICY IF EXISTS staff_insert_budgets ON budgets;
CREATE POLICY "role_insert_budgets" ON budgets FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_budgets ON budgets;
DROP POLICY IF EXISTS staff_update_budgets ON budgets;
CREATE POLICY "role_update_budgets" ON budgets FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_budgets ON budgets;
DROP POLICY IF EXISTS staff_delete_budgets ON budgets;
CREATE POLICY "role_delete_budgets" ON budgets FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','comptable']));

-- transactions
DROP POLICY IF EXISTS auth_select_transactions ON transactions;
DROP POLICY IF EXISTS staff_select_transactions ON transactions;
CREATE POLICY "role_select_transactions" ON transactions FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_transactions ON transactions;
DROP POLICY IF EXISTS staff_insert_transactions ON transactions;
CREATE POLICY "role_insert_transactions" ON transactions FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_transactions ON transactions;
DROP POLICY IF EXISTS staff_update_transactions ON transactions;
CREATE POLICY "role_update_transactions" ON transactions FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_transactions ON transactions;
DROP POLICY IF EXISTS staff_delete_transactions ON transactions;
CREATE POLICY "role_delete_transactions" ON transactions FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','comptable']));

-- expense_categories
DROP POLICY IF EXISTS auth_select_expense_categories ON expense_categories;
DROP POLICY IF EXISTS staff_select_expense_categories ON expense_categories;
CREATE POLICY "role_select_expense_categories" ON expense_categories FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_expense_categories ON expense_categories;
DROP POLICY IF EXISTS staff_insert_expense_categories ON expense_categories;
CREATE POLICY "role_insert_expense_categories" ON expense_categories FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_expense_categories ON expense_categories;
DROP POLICY IF EXISTS staff_update_expense_categories ON expense_categories;
CREATE POLICY "role_update_expense_categories" ON expense_categories FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_expense_categories ON expense_categories;
DROP POLICY IF EXISTS staff_delete_expense_categories ON expense_categories;
CREATE POLICY "role_delete_expense_categories" ON expense_categories FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','comptable']));

-- funders
DROP POLICY IF EXISTS auth_select_funders ON funders;
DROP POLICY IF EXISTS staff_select_funders ON funders;
CREATE POLICY "role_select_funders" ON funders FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_funders ON funders;
DROP POLICY IF EXISTS staff_insert_funders ON funders;
CREATE POLICY "role_insert_funders" ON funders FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_funders ON funders;
DROP POLICY IF EXISTS staff_update_funders ON funders;
CREATE POLICY "role_update_funders" ON funders FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_funders ON funders;
DROP POLICY IF EXISTS staff_delete_funders ON funders;
CREATE POLICY "role_delete_funders" ON funders FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','comptable']));

-- ============================================================
-- AGRICULTURE (tables restantes)
-- ============================================================

-- crop_operations
DROP POLICY IF EXISTS auth_select_crop_operations ON crop_operations;
DROP POLICY IF EXISTS staff_select_crop_operations ON crop_operations;
CREATE POLICY "role_select_crop_operations" ON crop_operations FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole','auditeur']));

DROP POLICY IF EXISTS auth_insert_crop_operations ON crop_operations;
DROP POLICY IF EXISTS staff_insert_crop_operations ON crop_operations;
CREATE POLICY "role_insert_crop_operations" ON crop_operations FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole']));

DROP POLICY IF EXISTS auth_update_crop_operations ON crop_operations;
DROP POLICY IF EXISTS staff_update_crop_operations ON crop_operations;
CREATE POLICY "role_update_crop_operations" ON crop_operations FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole']));

DROP POLICY IF EXISTS auth_delete_crop_operations ON crop_operations;
DROP POLICY IF EXISTS staff_delete_crop_operations ON crop_operations;
CREATE POLICY "role_delete_crop_operations" ON crop_operations FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','responsable_agricole']));

-- crops
DROP POLICY IF EXISTS auth_select_crops ON crops;
DROP POLICY IF EXISTS staff_select_crops ON crops;
CREATE POLICY "role_select_crops" ON crops FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole','auditeur']));

DROP POLICY IF EXISTS auth_insert_crops ON crops;
DROP POLICY IF EXISTS staff_insert_crops ON crops;
CREATE POLICY "role_insert_crops" ON crops FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole']));

DROP POLICY IF EXISTS auth_update_crops ON crops;
DROP POLICY IF EXISTS staff_update_crops ON crops;
CREATE POLICY "role_update_crops" ON crops FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole']));

DROP POLICY IF EXISTS auth_delete_crops ON crops;
DROP POLICY IF EXISTS staff_delete_crops ON crops;
CREATE POLICY "role_delete_crops" ON crops FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','responsable_agricole']));

-- harvests
DROP POLICY IF EXISTS auth_select_harvests ON harvests;
DROP POLICY IF EXISTS staff_select_harvests ON harvests;
CREATE POLICY "role_select_harvests" ON harvests FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole','auditeur']));

DROP POLICY IF EXISTS auth_insert_harvests ON harvests;
DROP POLICY IF EXISTS staff_insert_harvests ON harvests;
CREATE POLICY "role_insert_harvests" ON harvests FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole']));

DROP POLICY IF EXISTS auth_update_harvests ON harvests;
DROP POLICY IF EXISTS staff_update_harvests ON harvests;
CREATE POLICY "role_update_harvests" ON harvests FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole']));

DROP POLICY IF EXISTS auth_delete_harvests ON harvests;
DROP POLICY IF EXISTS staff_delete_harvests ON harvests;
CREATE POLICY "role_delete_harvests" ON harvests FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','responsable_agricole']));