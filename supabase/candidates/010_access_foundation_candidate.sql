-- CANDIDATE ONLY: NOT APPLIED, NOT READY TO DEPLOY.
-- Requires reviewed output from ../diagnostics/access_audit.sql and real anon/authenticated tests.
-- This intentionally fails unless at least one active, linked administrator exists.
-- It locks business tables until domain-specific RLS is designed in a later migration.
BEGIN;

DO $preflight$
DECLARE
  role_type text;
  active_type text;
  auth_id_type text;
  force_rls boolean;
  table_name text;
  policy_name text;
  column_name text;
  view_row record;
  function_row record;
  app_tables text[] := ARRAY[
    'farms', 'app_users', 'funders', 'fundings', 'bank_accounts', 'cash_accounts',
    'transactions', 'suppliers', 'expense_categories', 'expenses', 'documents',
    'sites', 'plots', 'crops', 'campaigns', 'crop_operations', 'harvests',
    'animals', 'animal_lots', 'animal_events', 'projects', 'project_steps',
    'inventory_items', 'inventory_movements', 'inventory_counts', 'budgets',
    'alerts', 'notifications', 'audit_logs', 'site_content', 'recipes'
  ];
BEGIN
  IF to_regclass('public.app_users') IS NULL OR to_regclass('auth.users') IS NULL THEN
    RAISE EXCEPTION 'Required app_users/auth.users relation is missing; candidate stopped';
  END IF;
  IF to_regprocedure('public.handle_new_user()') IS NULL
     OR NOT EXISTS (
       SELECT 1
       FROM pg_trigger t
       WHERE t.tgrelid = 'auth.users'::regclass
         AND t.tgname = 'on_auth_user_created'
         AND NOT t.tgisinternal
         AND t.tgfoid = to_regprocedure('public.handle_new_user()')
     ) THEN
    RAISE EXCEPTION 'Expected Auth profile trigger is missing or differs; review before applying';
  END IF;

  SELECT format_type(a.atttypid, a.atttypmod)
  INTO role_type
  FROM pg_attribute a
  WHERE a.attrelid = 'public.app_users'::regclass AND a.attname = 'role' AND NOT a.attisdropped;

  SELECT format_type(a.atttypid, a.atttypmod)
  INTO active_type
  FROM pg_attribute a
  WHERE a.attrelid = 'public.app_users'::regclass AND a.attname = 'active' AND NOT a.attisdropped;

  SELECT format_type(a.atttypid, a.atttypmod)
  INTO auth_id_type
  FROM pg_attribute a
  WHERE a.attrelid = 'public.app_users'::regclass AND a.attname = 'auth_id' AND NOT a.attisdropped;

  IF role_type IS DISTINCT FROM 'text'
     OR active_type IS DISTINCT FROM 'boolean'
     OR auth_id_type IS DISTINCT FROM 'uuid' THEN
    RAISE EXCEPTION 'Unexpected app_users types (role %, active %, auth_id %); candidate stopped',
      role_type, active_type, auth_id_type;
  END IF;

  SELECT c.relforcerowsecurity
  INTO force_rls
  FROM pg_class c
  WHERE c.oid = 'public.app_users'::regclass;
  IF force_rls THEN
    RAISE EXCEPTION 'app_users has FORCE ROW LEVEL SECURITY; trigger owner behavior must be reviewed first';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute a
    WHERE a.attrelid = 'public.app_users'::regclass
      AND a.attname = 'name' AND NOT a.attisdropped
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_attribute a
    WHERE a.attrelid = 'public.app_users'::regclass
      AND a.attname = 'phone' AND NOT a.attisdropped
  ) THEN
    RAISE EXCEPTION 'app_users.name and app_users.phone are required for the personal-profile policy';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
    WHERE c.conrelid = 'public.app_users'::regclass
      AND c.contype = 'u' AND cardinality(c.conkey) = 1 AND a.attname = 'auth_id'
  ) THEN
    RAISE EXCEPTION 'app_users.auth_id must have a unique constraint before applying';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_attribute source_column
      ON source_column.attrelid = c.conrelid AND source_column.attnum = c.conkey[1]
    JOIN pg_attribute target_column
      ON target_column.attrelid = c.confrelid AND target_column.attnum = c.confkey[1]
    WHERE c.conrelid = 'public.app_users'::regclass
      AND c.confrelid = 'auth.users'::regclass
      AND c.contype = 'f' AND cardinality(c.conkey) = 1 AND cardinality(c.confkey) = 1
      AND source_column.attname = 'auth_id' AND target_column.attname = 'id'
  ) THEN
    RAISE EXCEPTION 'app_users.auth_id must reference auth.users(id) before applying';
  END IF;

  FOR function_row IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.proname <> 'handle_new_user'
      AND (
        has_function_privilege('anon', p.oid, 'EXECUTE')
        OR has_function_privilege('authenticated', p.oid, 'EXECUTE')
      )
  LOOP
    RAISE EXCEPTION 'Exposed SECURITY DEFINER function % must be reviewed before applying',
      function_row.signature;
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM pg_auth_members m
    JOIN pg_roles member_role ON member_role.oid = m.member
    WHERE member_role.rolname IN ('anon', 'authenticated')
  ) THEN
    RAISE EXCEPTION 'anon/authenticated have role memberships; review inherited privileges before applying';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.app_users u
    JOIN auth.users au ON au.id = u.auth_id
    WHERE u.role::text = 'administrateur' AND u.active IS TRUE
  ) THEN
    RAISE EXCEPTION 'No active Auth-linked administrator; establish and verify controlled bootstrap first';
  END IF;

  FOREACH table_name IN ARRAY app_tables LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      EXECUTE format(
        'REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC, anon, authenticated',
        table_name
      );
      FOR column_name IN
        SELECT a.attname FROM pg_attribute a
        WHERE a.attrelid = to_regclass(format('public.%I', table_name))
          AND a.attnum > 0 AND NOT a.attisdropped
      LOOP
        EXECUTE format(
          'REVOKE ALL PRIVILEGES (%I) ON TABLE public.%I FROM PUBLIC, anon, authenticated',
          column_name, table_name
        );
      END LOOP;
      FOR policy_name IN
        SELECT p.policyname FROM pg_policies p
        WHERE p.schemaname = 'public' AND p.tablename = table_name
      LOOP
        EXECUTE format('DROP POLICY %I ON public.%I', policy_name, table_name);
      END LOOP;
    END IF;
  END LOOP;

  -- Close views that expose any of the business tables; do not alter their definitions.
  FOR view_row IN
    SELECT DISTINCT view_ns.nspname, view_class.relname
    FROM pg_class view_class
    JOIN pg_namespace view_ns ON view_ns.oid = view_class.relnamespace
    JOIN pg_rewrite rw ON rw.ev_class = view_class.oid
    JOIN pg_depend d ON d.objid = rw.oid AND d.refclassid = 'pg_class'::regclass
    JOIN pg_class source_table ON source_table.oid = d.refobjid
    WHERE view_ns.nspname = 'public'
      AND view_class.relkind IN ('v', 'm')
      AND source_table.relname = ANY(app_tables)
  LOOP
    EXECUTE format(
      'REVOKE ALL PRIVILEGES ON TABLE %I.%I FROM PUBLIC, anon, authenticated',
      view_row.nspname, view_row.relname
    );
    FOR column_name IN
      SELECT a.attname FROM pg_attribute a
      WHERE a.attrelid = format('%I.%I', view_row.nspname, view_row.relname)::regclass
        AND a.attnum > 0 AND NOT a.attisdropped
    LOOP
      EXECUTE format(
        'REVOKE ALL PRIVILEGES (%I) ON TABLE %I.%I FROM PUBLIC, anon, authenticated',
        column_name, view_row.nspname, view_row.relname
      );
    END LOOP;
  END LOOP;
END
$preflight$;

-- No self-service signup privilege: uninvited Auth users receive a disabled pending profile.
ALTER TABLE public.app_users ALTER COLUMN role SET DEFAULT 'pending';
ALTER TABLE public.app_users ALTER COLUMN active SET DEFAULT false;

-- The trigger remains the only creation path for pending profiles; it cannot grant access.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.app_users (auth_id, name, email, role, active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'pending',
    false
  );
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Users can read their own linked profile and edit only personal name/phone.
GRANT SELECT ON TABLE public.app_users TO authenticated;
GRANT UPDATE (name, phone) ON TABLE public.app_users TO authenticated;
CREATE POLICY app_users_read_own_linked_profile
  ON public.app_users FOR SELECT TO authenticated
  USING (auth_id = (SELECT auth.uid()));
CREATE POLICY app_users_update_own_contact
  ON public.app_users FOR UPDATE TO authenticated
  USING (auth_id = (SELECT auth.uid()))
  WITH CHECK (auth_id = (SELECT auth.uid()));

-- Revoke privileges on app-owned serial/identity sequences, not unrelated schema sequences.
DO $sequences$
DECLARE
  sequence_row record;
BEGIN
  FOR sequence_row IN
    SELECT DISTINCT sequence_ns.nspname, sequence_class.relname
    FROM pg_class sequence_class
    JOIN pg_namespace sequence_ns ON sequence_ns.oid = sequence_class.relnamespace
    JOIN pg_depend d ON d.objid = sequence_class.oid AND d.classid = 'pg_class'::regclass
    JOIN pg_class table_class ON table_class.oid = d.refobjid
    JOIN pg_namespace table_ns ON table_ns.oid = table_class.relnamespace
    WHERE sequence_class.relkind = 'S'
      AND table_ns.nspname = 'public'
      AND table_class.relname = ANY(ARRAY[
        'farms', 'app_users', 'funders', 'fundings', 'bank_accounts', 'cash_accounts',
        'transactions', 'suppliers', 'expense_categories', 'expenses', 'documents',
        'sites', 'plots', 'crops', 'campaigns', 'crop_operations', 'harvests',
        'animals', 'animal_lots', 'animal_events', 'projects', 'project_steps',
        'inventory_items', 'inventory_movements', 'inventory_counts', 'budgets',
        'alerts', 'notifications', 'audit_logs', 'site_content', 'recipes'
      ])
  LOOP
    EXECUTE format(
      'REVOKE ALL PRIVILEGES ON SEQUENCE %I.%I FROM PUBLIC, anon, authenticated',
      sequence_row.nspname, sequence_row.relname
    );
  END LOOP;
END
$sequences$;

-- Do not grant app RPCs or audit-log writes here. Functions, audit insertion, invitations,
-- and every business-domain policy require a separate reviewed design.
COMMIT;
