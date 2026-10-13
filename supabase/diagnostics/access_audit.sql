-- Diagnostic strictement en lecture seule; à exécuter manuellement après validation.
-- Précondition: connexion à la base cible avec accès aux catalogues PostgreSQL.
-- Résultats/catalogues et ACL ne remplacent pas des tests RLS avec de vrais JWT.
BEGIN;
SET TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '30s';

-- Rôles API présents, attributs, appartenances et capacité BYPASSRLS.
SELECT r.rolname, r.rolsuper, r.rolinherit, r.rolcreaterole, r.rolcreatedb,
       r.rolcanlogin, r.rolreplication, r.rolbypassrls,
       ARRAY(
         SELECT member_role.rolname
         FROM pg_auth_members m
         JOIN pg_roles member_role ON member_role.oid = m.roleid
         WHERE m.member = r.oid
         ORDER BY member_role.rolname
       ) AS member_of
FROM pg_roles r
WHERE r.rolname IN ('anon', 'authenticated', 'authenticator', 'service_role', 'supabase_admin')
ORDER BY r.rolname;

-- Tables, partitions, views/materialized views, owner, RLS and effective table ACLs.
SELECT n.nspname AS schema_name, c.relname AS object_name,
       c.relkind, pg_get_userbyid(c.relowner) AS owner,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls,
       CASE WHEN c.relkind IN ('v', 'm') THEN
         (SELECT option_value
          FROM unnest(coalesce(c.reloptions, ARRAY[]::text[])) option_value
          WHERE option_value LIKE 'security_invoker=%'
          LIMIT 1)
       END AS security_invoker_option,
       has_schema_privilege('anon', n.oid, 'USAGE') AS anon_schema_usage,
       has_schema_privilege('authenticated', n.oid, 'USAGE') AS authenticated_schema_usage,
       has_table_privilege('anon', c.oid, 'SELECT') AS anon_select,
       has_table_privilege('anon', c.oid, 'INSERT') AS anon_insert,
       has_table_privilege('anon', c.oid, 'UPDATE') AS anon_update,
       has_table_privilege('anon', c.oid, 'DELETE') AS anon_delete,
       has_table_privilege('authenticated', c.oid, 'SELECT') AS authenticated_select,
       has_table_privilege('authenticated', c.oid, 'INSERT') AS authenticated_insert,
       has_table_privilege('authenticated', c.oid, 'UPDATE') AS authenticated_update,
       has_table_privilege('authenticated', c.oid, 'DELETE') AS authenticated_delete,
       c.relacl AS declared_acl
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
ORDER BY c.relkind, c.relname;

-- Declared RLS policy definitions and role targets.
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Effective column-level access, complementing (not replacing) relation ACLs.
SELECT table_schema, table_name, column_name, grantee, privilege_type, is_grantable
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'PUBLIC')
ORDER BY table_name, column_name, grantee, privilege_type;

-- Sequences and effective privileges.
SELECT n.nspname AS schema_name, c.relname AS sequence_name,
       pg_get_userbyid(c.relowner) AS owner, c.relacl AS declared_acl,
       has_sequence_privilege('anon', c.oid, 'USAGE') AS anon_usage,
       has_sequence_privilege('anon', c.oid, 'SELECT') AS anon_select,
       has_sequence_privilege('anon', c.oid, 'UPDATE') AS anon_update,
       has_sequence_privilege('authenticated', c.oid, 'USAGE') AS authenticated_usage,
       has_sequence_privilege('authenticated', c.oid, 'SELECT') AS authenticated_select,
       has_sequence_privilege('authenticated', c.oid, 'UPDATE') AS authenticated_update
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'S'
ORDER BY c.relname;

-- Default ACLs that may grant access to future application objects.
SELECT pg_get_userbyid(d.defaclrole) AS grantor,
       n.nspname AS schema_name, d.defaclobjtype,
       d.defaclacl AS declared_default_acl
FROM pg_default_acl d
LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace
WHERE n.nspname = 'public' OR d.defaclnamespace = 0
ORDER BY grantor, schema_name, d.defaclobjtype;

-- All public-schema RPC candidates; effective EXECUTE is transitive through PUBLIC.
-- Only security-relevant search_path values are emitted from proconfig.
SELECT n.nspname AS schema_name, p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS identity_arguments,
       pg_get_userbyid(p.proowner) AS owner, p.prosecdef AS security_definer,
       p.provolatile, p.proacl AS declared_acl,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
       (SELECT setting FROM unnest(coalesce(p.proconfig, ARRAY[]::text[])) setting
        WHERE setting LIKE 'search_path=%' LIMIT 1) AS search_path_setting
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY p.proname, identity_arguments;

-- Profil type/key check requested before writing app_users-specific policy assumptions.
SELECT column_name, data_type, udt_schema, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'app_users'
  AND column_name IN ('id', 'auth_id', 'role', 'active', 'email')
ORDER BY ordinal_position;

-- Actual key/foreign-key definitions for app_users/Auth correspondence.
SELECT conname, contype, pg_get_constraintdef(oid, true) AS definition,
       convalidated
FROM pg_constraint
WHERE conrelid = to_regclass('public.app_users')
ORDER BY conname;

-- Auth/profile linkage and active administrator precondition counts; no personal values emitted.
SELECT count(*) FILTER (WHERE u.auth_id IS NOT NULL) AS linked_profiles,
       count(*) FILTER (WHERE u.auth_id IS NULL) AS unlinked_legacy_profiles,
       count(*) FILTER (
         WHERE u.auth_id IS NOT NULL AND u.active IS TRUE
           AND u.role::text = 'administrateur' AND a.id IS NOT NULL
       ) AS active_auth_linked_administrators,
       count(*) FILTER (
         WHERE u.auth_id IS NOT NULL AND a.id IS NULL
       ) AS profiles_with_missing_auth_account
FROM public.app_users u
LEFT JOIN auth.users a ON a.id = u.auth_id;

ROLLBACK;
