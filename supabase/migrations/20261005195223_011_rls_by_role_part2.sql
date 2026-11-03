-- Migration 011: RLS par rôle (suite — 6 tables critiques)
-- Étend le pattern role_* aux tables : documents, animal_lots, animal_events, plots, campaigns, cash_accounts
-- Date: 2026-10-21

-- 1. TABLE: documents (module finance)
-- Rôles read: tous (8 rôles)
-- Rôles write: administrateur, propriétaire, financeur, gestionnaire, comptable, responsable_agricole, responsable_élevage
-- Rôles delete: administrateur, comptable

DROP POLICY IF EXISTS auth_select_documents ON documents;
DROP POLICY IF EXISTS staff_select_documents ON documents;
CREATE POLICY "role_select_documents" ON documents FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_documents ON documents;
DROP POLICY IF EXISTS staff_insert_documents ON documents;
CREATE POLICY "role_insert_documents" ON documents FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_documents ON documents;
DROP POLICY IF EXISTS staff_update_documents ON documents;
CREATE POLICY "role_update_documents" ON documents FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_documents ON documents;
DROP POLICY IF EXISTS staff_delete_documents ON documents;
CREATE POLICY "role_delete_documents" ON documents FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','comptable']));

-- 2. TABLE: animal_lots (module livestock)
-- Rôles read: administrateur, propriétaire, gestionnaire, responsable_élevage, auditeur
-- Rôles write: administrateur, gestionnaire, responsable_élevage
-- Rôles delete: administrateur, responsable_élevage

DROP POLICY IF EXISTS auth_select_animal_lots ON animal_lots;
DROP POLICY IF EXISTS staff_select_animal_lots ON animal_lots;
CREATE POLICY "role_select_animal_lots" ON animal_lots FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_animal_lots ON animal_lots;
DROP POLICY IF EXISTS staff_insert_animal_lots ON animal_lots;
CREATE POLICY "role_insert_animal_lots" ON animal_lots FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_animal_lots ON animal_lots;
DROP POLICY IF EXISTS staff_update_animal_lots ON animal_lots;
CREATE POLICY "role_update_animal_lots" ON animal_lots FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_animal_lots ON animal_lots;
DROP POLICY IF EXISTS staff_delete_animal_lots ON animal_lots;
CREATE POLICY "role_delete_animal_lots" ON animal_lots FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','responsable_élevage']));

-- 3. TABLE: animal_events (module livestock)
-- Rôles read: administrateur, propriétaire, gestionnaire, responsable_élevage, auditeur
-- Rôles write: administrateur, gestionnaire, responsable_élevage
-- Rôles delete: administrateur, responsable_élevage

DROP POLICY IF EXISTS auth_select_animal_events ON animal_events;
DROP POLICY IF EXISTS staff_select_animal_events ON animal_events;
CREATE POLICY "role_select_animal_events" ON animal_events FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_animal_events ON animal_events;
DROP POLICY IF EXISTS staff_insert_animal_events ON animal_events;
CREATE POLICY "role_insert_animal_events" ON animal_events FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_animal_events ON animal_events;
DROP POLICY IF EXISTS staff_update_animal_events ON animal_events;
CREATE POLICY "role_update_animal_events" ON animal_events FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_animal_events ON animal_events;
DROP POLICY IF EXISTS staff_delete_animal_events ON animal_events;
CREATE POLICY "role_delete_animal_events" ON animal_events FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','responsable_élevage']));

-- 4. TABLE: plots (module agriculture)
-- Rôles read: administrateur, propriétaire, gestionnaire, responsable_agricole, auditeur
-- Rôles write: administrateur, gestionnaire, responsable_agricole
-- Rôles delete: administrateur, responsable_agricole

DROP POLICY IF EXISTS auth_select_plots ON plots;
DROP POLICY IF EXISTS staff_select_plots ON plots;
CREATE POLICY "role_select_plots" ON plots FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole','auditeur']));

DROP POLICY IF EXISTS auth_insert_plots ON plots;
DROP POLICY IF EXISTS staff_insert_plots ON plots;
CREATE POLICY "role_insert_plots" ON plots FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole']));

DROP POLICY IF EXISTS auth_update_plots ON plots;
DROP POLICY IF EXISTS staff_update_plots ON plots;
CREATE POLICY "role_update_plots" ON plots FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole']));

DROP POLICY IF EXISTS auth_delete_plots ON plots;
DROP POLICY IF EXISTS staff_delete_plots ON plots;
CREATE POLICY "role_delete_plots" ON plots FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','responsable_agricole']));

-- 5. TABLE: campaigns (module agriculture)
-- Rôles read: administrateur, propriétaire, gestionnaire, responsable_agricole, auditeur
-- Rôles write: administrateur, gestionnaire, responsable_agricole
-- Rôles delete: administrateur, responsable_agricole

DROP POLICY IF EXISTS auth_select_campaigns ON campaigns;
DROP POLICY IF EXISTS staff_select_campaigns ON campaigns;
CREATE POLICY "role_select_campaigns" ON campaigns FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole','auditeur']));

DROP POLICY IF EXISTS auth_insert_campaigns ON campaigns;
DROP POLICY IF EXISTS staff_insert_campaigns ON campaigns;
CREATE POLICY "role_insert_campaigns" ON campaigns FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole']));

DROP POLICY IF EXISTS auth_update_campaigns ON campaigns;
DROP POLICY IF EXISTS staff_update_campaigns ON campaigns;
CREATE POLICY "role_update_campaigns" ON campaigns FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_agricole']));

DROP POLICY IF EXISTS auth_delete_campaigns ON campaigns;
DROP POLICY IF EXISTS staff_delete_campaigns ON campaigns;
CREATE POLICY "role_delete_campaigns" ON campaigns FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','responsable_agricole']));

-- 6. TABLE: cash_accounts (module finance)
-- Rôles read: tous (8 rôles)
-- Rôles write: administrateur, propriétaire, financeur, gestionnaire, comptable, responsable_agricole, responsable_élevage
-- Rôles delete: administrateur, comptable

DROP POLICY IF EXISTS auth_select_cash_accounts ON cash_accounts;
DROP POLICY IF EXISTS staff_select_cash_accounts ON cash_accounts;
CREATE POLICY "role_select_cash_accounts" ON cash_accounts FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_cash_accounts ON cash_accounts;
DROP POLICY IF EXISTS staff_insert_cash_accounts ON cash_accounts;
CREATE POLICY "role_insert_cash_accounts" ON cash_accounts FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_cash_accounts ON cash_accounts;
DROP POLICY IF EXISTS staff_update_cash_accounts ON cash_accounts;
CREATE POLICY "role_update_cash_accounts" ON cash_accounts FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_cash_accounts ON cash_accounts;
DROP POLICY IF EXISTS staff_delete_cash_accounts ON cash_accounts;
CREATE POLICY "role_delete_cash_accounts" ON cash_accounts FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','comptable']));