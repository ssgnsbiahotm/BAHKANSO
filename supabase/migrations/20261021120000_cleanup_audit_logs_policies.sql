-- =============================================
-- NETTOYAGE : Suppression des anciennes policies auth_*/staff_* sur audit_logs
-- Ces policies doublonnent les nouvelles policies role_* et génèrent
-- le warning "multiple permissive policies" du linter Supabase.
-- =============================================

DROP POLICY IF EXISTS auth_select_audit_logs ON audit_logs;
DROP POLICY IF EXISTS auth_insert_audit_logs ON audit_logs;
DROP POLICY IF EXISTS auth_update_audit_logs ON audit_logs;
DROP POLICY IF EXISTS auth_delete_audit_logs ON audit_logs;

DROP POLICY IF EXISTS staff_select_audit_logs ON audit_logs;
DROP POLICY IF EXISTS staff_insert_audit_logs ON audit_logs;
DROP POLICY IF EXISTS staff_update_audit_logs ON audit_logs;
DROP POLICY IF EXISTS staff_delete_audit_logs ON audit_logs;

-- Vérification : seules les policies role_* doivent rester sur audit_logs
-- SELECT policyname, cmd FROM pg_policies WHERE schemaname='public' AND tablename='audit_logs';