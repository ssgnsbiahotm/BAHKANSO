-- Migration 010: RLS par rôle (pilot sur 4 tables critiques)
-- Remplace les policies auth_*/staff_* par des policies basées sur app_users.role
-- Date: 2026-10-21

-- 1. Fonction utilitaire : vérifie si l'utilisateur courant a l'un des rôles autorisés
CREATE OR REPLACE FUNCTION public.current_user_has_role(allowed_roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_id = auth.uid()
    AND active = true
    AND role = ANY(allowed_roles)
  );
$$;

COMMENT ON FUNCTION public.current_user_has_role(text[]) IS
'Vérifie si l''utilisateur authentifié a un rôle dans la liste fournie. Utilisée dans les policies RLS pour autoriser par rôle applicatif.';

-- 2. TABLE: expenses (module finance)
-- Rôles read: tous (8 rôles)
-- Rôles write: administrateur, propriétaire, financeur, gestionnaire, comptable, responsable_agricole, responsable_élevage
-- Rôles delete: administrateur, comptable

DROP POLICY IF EXISTS auth_select_expenses ON expenses;
DROP POLICY IF EXISTS staff_select_expenses ON expenses;
CREATE POLICY "role_select_expenses" ON expenses FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_expenses ON expenses;
DROP POLICY IF EXISTS staff_insert_expenses ON expenses;
CREATE POLICY "role_insert_expenses" ON expenses FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_expenses ON expenses;
DROP POLICY IF EXISTS staff_update_expenses ON expenses;
CREATE POLICY "role_update_expenses" ON expenses FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_expenses ON expenses;
DROP POLICY IF EXISTS staff_delete_expenses ON expenses;
CREATE POLICY "role_delete_expenses" ON expenses FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','comptable']));

-- 3. TABLE: animals (module livestock)
-- Rôles read: administrateur, propriétaire, gestionnaire, responsable_élevage, auditeur
-- Rôles write: administrateur, gestionnaire, responsable_élevage
-- Rôles delete: administrateur, responsable_élevage

DROP POLICY IF EXISTS auth_select_animals ON animals;
DROP POLICY IF EXISTS staff_select_animals ON animals;
CREATE POLICY "role_select_animals" ON animals FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_animals ON animals;
DROP POLICY IF EXISTS staff_insert_animals ON animals;
CREATE POLICY "role_insert_animals" ON animals FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_animals ON animals;
DROP POLICY IF EXISTS staff_update_animals ON animals;
CREATE POLICY "role_update_animals" ON animals FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','gestionnaire','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_animals ON animals;
DROP POLICY IF EXISTS staff_delete_animals ON animals;
CREATE POLICY "role_delete_animals" ON animals FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','responsable_élevage']));

-- 4. TABLE: fundings (module finance)
-- Rôles read: tous (8 rôles)
-- Rôles write: administrateur, propriétaire, financeur, gestionnaire, comptable, responsable_agricole, responsable_élevage
-- Rôles delete: administrateur, comptable

DROP POLICY IF EXISTS auth_select_fundings ON fundings;
DROP POLICY IF EXISTS staff_select_fundings ON fundings;
CREATE POLICY "role_select_fundings" ON fundings FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur']));

DROP POLICY IF EXISTS auth_insert_fundings ON fundings;
DROP POLICY IF EXISTS staff_insert_fundings ON fundings;
CREATE POLICY "role_insert_fundings" ON fundings FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_update_fundings ON fundings;
DROP POLICY IF EXISTS staff_update_fundings ON fundings;
CREATE POLICY "role_update_fundings" ON fundings FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

DROP POLICY IF EXISTS auth_delete_fundings ON fundings;
DROP POLICY IF EXISTS staff_delete_fundings ON fundings;
CREATE POLICY "role_delete_fundings" ON fundings FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','comptable']));

-- 5. TABLE: app_users (module users)
-- Rôles read: administrateur, propriétaire, gestionnaire, auditeur
-- Rôles write: administrateur, propriétaire, gestionnaire
-- Rôles delete: administrateur

DROP POLICY IF EXISTS auth_select_app_users ON app_users;
DROP POLICY IF EXISTS staff_select_app_users ON app_users;
CREATE POLICY "role_select_app_users" ON app_users FOR SELECT TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','auditeur']));

DROP POLICY IF EXISTS auth_insert_app_users ON app_users;
DROP POLICY IF EXISTS staff_insert_app_users ON app_users;
CREATE POLICY "role_insert_app_users" ON app_users FOR INSERT TO authenticated
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire']));

DROP POLICY IF EXISTS auth_update_app_users ON app_users;
DROP POLICY IF EXISTS staff_update_app_users ON app_users;
CREATE POLICY "role_update_app_users" ON app_users FOR UPDATE TO authenticated
USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire']))
WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire']));

DROP POLICY IF EXISTS auth_delete_app_users ON app_users;
DROP POLICY IF EXISTS staff_delete_app_users ON app_users;
CREATE POLICY "role_delete_app_users" ON app_users FOR DELETE TO authenticated
USING (current_user_has_role(ARRAY['administrateur']));

-- Note: Les policies auth_*/staff_* sur les autres tables restent inchangées pour ce pilot.
-- Une migration ultérieure étendra ce pattern à toutes les tables métier.