-- Role-based access for the single-farm Bahkanso deployment.
-- New Auth accounts remain pending until an administrator assigns an approved role.
BEGIN;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS funder_id uuid;

DO $funder_relation$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.app_users'::regclass
      AND conname = 'app_users_funder_id_fkey'
  ) THEN
    ALTER TABLE public.app_users
      ADD CONSTRAINT app_users_funder_id_fkey
      FOREIGN KEY (funder_id) REFERENCES public.funders(id) ON DELETE SET NULL;
  END IF;
END
$funder_relation$;

CREATE INDEX IF NOT EXISTS idx_app_users_funder_id
  ON public.app_users(funder_id)
  WHERE funder_id IS NOT NULL;

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS user_name text,
  ADD COLUMN IF NOT EXISTS object_type text,
  ADD COLUMN IF NOT EXISTS object_id text,
  ADD COLUMN IF NOT EXISTS old_value jsonb,
  ADD COLUMN IF NOT EXISTS new_value jsonb,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS actor_id uuid
  REFERENCES public.app_users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION private.current_app_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT profile.role::text
  FROM public.app_users AS profile
  WHERE profile.auth_id = (SELECT auth.uid())
    AND profile.active IS TRUE
  LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION private.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT profile.id
  FROM public.app_users AS profile
  WHERE profile.auth_id = (SELECT auth.uid())
    AND profile.active IS TRUE
  LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION private.current_app_funder_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT profile.funder_id
  FROM public.app_users AS profile
  WHERE profile.auth_id = (SELECT auth.uid())
    AND profile.active IS TRUE
    AND profile.role::text = 'financeur'
  LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION private.has_any_role(allowed_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT (SELECT private.current_app_role()) = ANY (allowed_roles)
$function$;

REVOKE ALL ON FUNCTION private.current_app_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.current_app_user_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.current_app_funder_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.has_any_role(text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.current_app_role() TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_app_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_app_funder_id() TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_any_role(text[]) TO authenticated;

-- Protect role, activation and funder assignments from self-escalation.
CREATE OR REPLACE FUNCTION private.guard_app_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;

  IF NEW.auth_id IS DISTINCT FROM OLD.auth_id
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.last_login IS DISTINCT FROM OLD.last_login THEN
    RAISE EXCEPTION 'Auth linkage and login metadata are managed by the identity service'
      USING ERRCODE = '42501';
  END IF;

  IF (NEW.role IS DISTINCT FROM OLD.role
      OR NEW.active IS DISTINCT FROM OLD.active
      OR NEW.funder_id IS DISTINCT FROM OLD.funder_id)
     AND (
       (SELECT private.current_app_role()) IS DISTINCT FROM 'administrateur'
       OR OLD.auth_id = (SELECT auth.uid())
     ) THEN
    RAISE EXCEPTION 'Only an administrator may change another user’s role, status, or funder'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END
$function$;

DROP TRIGGER IF EXISTS guard_app_user_update ON public.app_users;
CREATE TRIGGER guard_app_user_update
  BEFORE UPDATE ON public.app_users
  FOR EACH ROW EXECUTE FUNCTION private.guard_app_user_update();
REVOKE ALL ON FUNCTION private.guard_app_user_update() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.guard_manager_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  IF (SELECT private.current_app_role()) = 'gestionnaire' THEN
    IF TG_TABLE_NAME = 'expenses'
       AND NOT (
         (OLD.status = 'brouillon' AND NEW.status IN ('brouillon', 'en attente'))
         OR (OLD.status = 'en attente' AND NEW.status = 'en attente')
         OR (OLD.status = 'rejetée' AND NEW.status IN ('rejetée', 'en attente'))
       ) THEN
      RAISE EXCEPTION 'Managers may prepare expenses but cannot validate or reject them'
        USING ERRCODE = '42501';
    END IF;

    IF TG_TABLE_NAME = 'documents' AND NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Managers may not verify or reject documents'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END
$function$;
REVOKE ALL ON FUNCTION private.guard_manager_status_transition() FROM PUBLIC, anon, authenticated;

-- Audit entries are created by this trigger, never accepted directly from the browser.
CREATE OR REPLACE FUNCTION private.audit_row_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  actor uuid;
  actor_name text;
  old_row jsonb;
  new_row jsonb;
  changed_id text;
BEGIN
  actor := (SELECT private.current_app_user_id());
  IF actor IS NOT NULL THEN
    SELECT profile.name INTO actor_name
    FROM public.app_users AS profile
    WHERE profile.id = actor;
  END IF;

  IF TG_OP <> 'INSERT' THEN
    old_row := to_jsonb(OLD);
  END IF;
  IF TG_OP <> 'DELETE' THEN
    new_row := to_jsonb(NEW);
  END IF;
  changed_id := COALESCE(new_row ->> 'id', old_row ->> 'id');

  INSERT INTO public.audit_logs (
    actor_id, user_name, action, object_type, object_id,
    old_value, new_value, description
  )
  VALUES (
    actor,
    COALESCE(actor_name, 'Système'),
    TG_OP,
    TG_TABLE_NAME,
    changed_id,
    old_row,
    new_row,
    TG_OP || ' ' || TG_TABLE_NAME
  );

  RETURN NULL;
END
$function$;

REVOKE ALL ON FUNCTION private.audit_row_change() FROM PUBLIC, anon, authenticated;

-- Close all old policies and inherited grants on application tables and dependent views.
DO $lockdown$
DECLARE
  table_name text;
  column_name text;
  view_row record;
  sequence_row record;
  policy_row record;
  app_tables text[] := ARRAY[
    'farms', 'app_users', 'funders', 'fundings', 'bank_accounts', 'cash_accounts',
    'transactions', 'suppliers', 'expense_categories', 'expenses', 'documents',
    'sites', 'plots', 'crops', 'campaigns', 'crop_operations', 'harvests',
    'animals', 'animal_lots', 'animal_events', 'projects', 'project_steps',
    'inventory_items', 'inventory_movements', 'inventory_counts', 'budgets',
    'alerts', 'notifications', 'audit_logs', 'site_content', 'recipes'
  ];
BEGIN
  FOREACH table_name IN ARRAY app_tables LOOP
    IF to_regclass(format('public.%I', table_name)) IS NULL THEN
      RAISE EXCEPTION 'Required application table public.% is missing', table_name;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC, anon, authenticated',
      table_name
    );
    FOR column_name IN
      SELECT attribute.attname
      FROM pg_attribute AS attribute
      WHERE attribute.attrelid = to_regclass(format('public.%I', table_name))
        AND attribute.attnum > 0
        AND NOT attribute.attisdropped
    LOOP
      EXECUTE format(
        'REVOKE ALL PRIVILEGES (%I) ON TABLE public.%I FROM PUBLIC, anon, authenticated',
        column_name, table_name
      );
    END LOOP;

    FOR policy_row IN
      SELECT policy.policyname
      FROM pg_policies AS policy
      WHERE policy.schemaname = 'public'
        AND policy.tablename = table_name
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', policy_row.policyname, table_name);
    END LOOP;
  END LOOP;

  FOR view_row IN
    SELECT DISTINCT view_ns.nspname, view_class.relname
    FROM pg_class AS view_class
    JOIN pg_namespace AS view_ns ON view_ns.oid = view_class.relnamespace
    JOIN pg_rewrite AS rewrite ON rewrite.ev_class = view_class.oid
    JOIN pg_depend AS dependency
      ON dependency.objid = rewrite.oid
      AND dependency.refclassid = 'pg_class'::regclass
    JOIN pg_class AS source_table ON source_table.oid = dependency.refobjid
    WHERE view_ns.nspname = 'public'
      AND view_class.relkind IN ('v', 'm')
      AND source_table.relname = ANY (app_tables)
  LOOP
    EXECUTE format(
      'REVOKE ALL PRIVILEGES ON TABLE %I.%I FROM PUBLIC, anon, authenticated',
      view_row.nspname, view_row.relname
    );
    FOR column_name IN
      SELECT attribute.attname
      FROM pg_attribute AS attribute
      WHERE attribute.attrelid = format('%I.%I', view_row.nspname, view_row.relname)::regclass
        AND attribute.attnum > 0
        AND NOT attribute.attisdropped
    LOOP
      EXECUTE format(
        'REVOKE ALL PRIVILEGES (%I) ON TABLE %I.%I FROM PUBLIC, anon, authenticated',
        column_name, view_row.nspname, view_row.relname
      );
    END LOOP;
  END LOOP;

  FOR sequence_row IN
    SELECT DISTINCT sequence_ns.nspname, sequence_class.relname
    FROM pg_class AS sequence_class
    JOIN pg_namespace AS sequence_ns ON sequence_ns.oid = sequence_class.relnamespace
    JOIN pg_depend AS dependency
      ON dependency.objid = sequence_class.oid
      AND dependency.classid = 'pg_class'::regclass
    JOIN pg_class AS table_class ON table_class.oid = dependency.refobjid
    WHERE sequence_class.relkind = 'S'
      AND table_class.relnamespace = 'public'::regnamespace
      AND table_class.relname = ANY (app_tables)
  LOOP
    EXECUTE format(
      'REVOKE ALL PRIVILEGES ON SEQUENCE %I.%I FROM PUBLIC, anon, authenticated',
      sequence_row.nspname, sequence_row.relname
    );
  END LOOP;
END
$lockdown$;

CREATE TRIGGER guard_manager_expense_status
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION private.guard_manager_status_transition();
CREATE TRIGGER guard_manager_document_status
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION private.guard_manager_status_transition();

ALTER TABLE public.app_users ALTER COLUMN role SET DEFAULT 'pending';
ALTER TABLE public.app_users ALTER COLUMN active SET DEFAULT false;

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
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'pending',
    false
  );
  RETURN NEW;
END
$function$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_admin;

GRANT SELECT ON TABLE public.app_users TO authenticated;
GRANT UPDATE (name, phone, role, active, funder_id)
  ON TABLE public.app_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.farms, public.funders, public.fundings, public.bank_accounts, public.cash_accounts,
  public.transactions, public.suppliers, public.expense_categories, public.expenses,
  public.documents, public.sites, public.plots, public.crops, public.campaigns,
  public.crop_operations, public.harvests, public.animals, public.animal_lots,
  public.animal_events, public.projects, public.project_steps, public.inventory_items,
  public.inventory_movements, public.inventory_counts, public.budgets, public.alerts,
  public.notifications, public.site_content, public.recipes
  TO authenticated;
GRANT SELECT ON TABLE public.audit_logs TO authenticated;

CREATE POLICY app_users_read_own_or_lead
  ON public.app_users FOR SELECT TO authenticated
  USING (
    auth_id = (SELECT auth.uid())
    OR (SELECT private.has_any_role(ARRAY['administrateur', 'propriétaire']::text[]))
  );
CREATE POLICY app_users_update_own_or_admin
  ON public.app_users FOR UPDATE TO authenticated
  USING (
    auth_id = (SELECT auth.uid())
    OR (SELECT private.has_any_role(ARRAY['administrateur']::text[]))
  )
  WITH CHECK (
    auth_id = (SELECT auth.uid())
    OR (SELECT private.has_any_role(ARRAY['administrateur']::text[]))
  );
CREATE POLICY audit_logs_read_admin_or_owner
  ON public.audit_logs FOR SELECT TO authenticated
  USING ((SELECT private.has_any_role(ARRAY['administrateur', 'propriétaire']::text[])));

DO $policies$
DECLARE
  table_name text;
  select_roles text[];
  write_roles text[];
  update_condition text;
  insert_condition text;
  delete_condition text;
  app_tables text[] := ARRAY[
    'farms', 'funders', 'fundings', 'bank_accounts', 'cash_accounts', 'transactions',
    'suppliers', 'expense_categories', 'expenses', 'documents', 'sites', 'plots', 'crops',
    'campaigns', 'crop_operations', 'harvests', 'animals', 'animal_lots', 'animal_events',
    'projects', 'project_steps', 'inventory_items', 'inventory_movements', 'inventory_counts',
    'budgets', 'alerts', 'notifications', 'site_content', 'recipes'
  ];
BEGIN
  FOREACH table_name IN ARRAY app_tables LOOP
    select_roles := ARRAY['administrateur', 'propriétaire', 'gestionnaire']::text[];
    write_roles := ARRAY['administrateur']::text[];
    update_condition := NULL;
    insert_condition := NULL;
    delete_condition := NULL;

    CASE table_name
      WHEN 'farms' THEN
        NULL;
      WHEN 'fundings' THEN
        NULL;
      WHEN 'funders' THEN
        NULL;
      WHEN 'bank_accounts', 'cash_accounts', 'transactions' THEN
        NULL;
      WHEN 'sites', 'plots', 'crops', 'campaigns', 'crop_operations', 'harvests' THEN
        select_roles := select_roles || ARRAY['responsable_agricole']::text[];
        write_roles := write_roles || ARRAY['gestionnaire', 'responsable_agricole']::text[];
      WHEN 'animals', 'animal_lots', 'animal_events' THEN
        select_roles := select_roles || ARRAY['responsable_élevage']::text[];
        write_roles := write_roles || ARRAY['gestionnaire', 'responsable_élevage']::text[];
      WHEN 'projects', 'project_steps' THEN
        select_roles := select_roles || ARRAY['responsable_chantier']::text[];
        write_roles := write_roles || ARRAY['gestionnaire', 'responsable_chantier']::text[];
      WHEN 'inventory_items', 'inventory_movements', 'inventory_counts' THEN
        select_roles := select_roles || ARRAY[
          'responsable_agricole', 'responsable_élevage'
        ]::text[];
        write_roles := write_roles || ARRAY[
          'gestionnaire', 'responsable_agricole', 'responsable_élevage'
        ]::text[];
      WHEN 'suppliers', 'expense_categories', 'expenses', 'budgets', 'alerts', 'notifications',
           'site_content', 'recipes' THEN
        write_roles := write_roles || ARRAY['gestionnaire']::text[];
      WHEN 'documents' THEN
        NULL;
    END CASE;

    IF table_name = 'fundings' THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (
          (SELECT private.has_any_role(ARRAY[''administrateur'', ''propriétaire'', ''gestionnaire'']::text[]))
          OR (funder_id = (SELECT private.current_app_funder_id()))
        )',
        'app_select_' || table_name, table_name
      );
      write_roles := ARRAY['administrateur', 'gestionnaire']::text[];
      insert_condition := 'private.has_any_role(ARRAY[''administrateur'']::text[]) OR (private.has_any_role(ARRAY[''gestionnaire'']::text[]) AND status = ''prévu'')';
      update_condition := 'private.has_any_role(ARRAY[''administrateur'']::text[]) OR (private.has_any_role(ARRAY[''gestionnaire'']::text[]) AND status = ''prévu'')';
      delete_condition := 'private.has_any_role(ARRAY[''administrateur'']::text[]) OR (private.has_any_role(ARRAY[''gestionnaire'']::text[]) AND status = ''prévu'')';
    ELSIF table_name = 'funders' THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (
          (SELECT private.has_any_role(ARRAY[''administrateur'', ''propriétaire'', ''gestionnaire'']::text[]))
          OR (id = (SELECT private.current_app_funder_id()))
        )',
        'app_select_' || table_name, table_name
      );
      write_roles := ARRAY['administrateur']::text[];
    ELSIF table_name = 'expenses' THEN
      write_roles := ARRAY['administrateur', 'gestionnaire']::text[];
      insert_condition := 'private.has_any_role(ARRAY[''administrateur'']::text[]) OR (private.has_any_role(ARRAY[''gestionnaire'']::text[]) AND status = ''brouillon'')';
      update_condition := 'private.has_any_role(ARRAY[''administrateur'']::text[]) OR (private.has_any_role(ARRAY[''gestionnaire'']::text[]) AND status IN (''brouillon'', ''en attente'', ''rejetée''))';
      delete_condition := 'private.has_any_role(ARRAY[''administrateur'']::text[]) OR (private.has_any_role(ARRAY[''gestionnaire'']::text[]) AND status = ''brouillon'')';
    ELSIF table_name = 'documents' THEN
      write_roles := ARRAY['administrateur', 'gestionnaire']::text[];
      insert_condition := 'private.has_any_role(ARRAY[''administrateur'']::text[]) OR (private.has_any_role(ARRAY[''gestionnaire'']::text[]) AND status IN (''ajouté'', ''à vérifier''))';
      update_condition := 'private.has_any_role(ARRAY[''administrateur'']::text[]) OR (private.has_any_role(ARRAY[''gestionnaire'']::text[]) AND status IN (''ajouté'', ''à vérifier''))';
      delete_condition := 'private.has_any_role(ARRAY[''administrateur'']::text[]) OR (private.has_any_role(ARRAY[''gestionnaire'']::text[]) AND status IN (''ajouté'', ''à vérifier''))';
    ELSIF table_name = 'notifications' THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (
          user_id = (SELECT private.current_app_user_id())
          OR (SELECT private.has_any_role(ARRAY[''administrateur'', ''propriétaire'', ''gestionnaire'']::text[]))
        )',
        'app_select_' || table_name, table_name
      );
      write_roles := ARRAY['administrateur', 'gestionnaire']::text[];
    ELSE
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (
          (SELECT private.has_any_role(%L::text[]))
        )',
        'app_select_' || table_name, table_name, select_roles
      );
    END IF;

    IF cardinality(write_roles) > 0 THEN
      IF insert_condition IS NULL THEN
        insert_condition := format('private.has_any_role(%L::text[])', write_roles);
      END IF;
      IF update_condition IS NULL THEN
        update_condition := format('private.has_any_role(%L::text[])', write_roles);
      END IF;
      IF delete_condition IS NULL THEN
        delete_condition := format('private.has_any_role(%L::text[])', write_roles);
      END IF;

      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK ((SELECT %s))',
        'app_insert_' || table_name, table_name, insert_condition
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING ((SELECT %s)) WITH CHECK ((SELECT %s))',
        'app_update_' || table_name, table_name, update_condition, update_condition
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING ((SELECT %s))',
        'app_delete_' || table_name, table_name, delete_condition
      );
    END IF;
  END LOOP;
END
$policies$;

DO $audit_triggers$
DECLARE
  table_name text;
  app_tables text[] := ARRAY[
    'farms', 'app_users', 'funders', 'fundings', 'bank_accounts', 'cash_accounts',
    'transactions', 'suppliers', 'expense_categories', 'expenses', 'documents',
    'sites', 'plots', 'crops', 'campaigns', 'crop_operations', 'harvests',
    'animals', 'animal_lots', 'animal_events', 'projects', 'project_steps',
    'inventory_items', 'inventory_movements', 'inventory_counts', 'budgets',
    'alerts', 'notifications', 'site_content', 'recipes'
  ];
BEGIN
  FOREACH table_name IN ARRAY app_tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_row_change ON public.%I', table_name);
    EXECUTE format(
      'CREATE TRIGGER audit_row_change AFTER INSERT OR UPDATE OR DELETE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION private.audit_row_change()',
      table_name
    );
  END LOOP;
END
$audit_triggers$;

COMMIT;