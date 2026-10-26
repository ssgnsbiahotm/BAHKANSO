-- Autoriser la lecture des logs d'audit par les utilisateurs authentifiés
DROP POLICY IF EXISTS "auth_select_audit_logs" ON audit_logs;
CREATE POLICY "auth_select_audit_logs" ON audit_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- (Optionnel) Permettre aux admins de supprimer d'anciens logs
DROP POLICY IF EXISTS "auth_delete_audit_logs" ON audit_logs;
CREATE POLICY "auth_delete_audit_logs" ON audit_logs
  FOR DELETE
  TO authenticated
  USING (current_user_has_role(ARRAY['administrateur']));