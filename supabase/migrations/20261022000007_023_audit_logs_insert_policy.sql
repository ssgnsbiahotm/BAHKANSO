-- Autoriser l'insertion dans audit_logs par tout utilisateur authentifié actif
DROP POLICY IF EXISTS "auth_insert_audit_logs" ON audit_logs;
CREATE POLICY "auth_insert_audit_logs" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','financeur','gestionnaire','comptable','responsable_agricole','responsable_élevage','auditeur']));
