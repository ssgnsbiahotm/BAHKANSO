/*
# RLS Scoped by site_id — replaces migration 007's USING (true) policies

This migration tightens RLS on all tables previously secured with
`USING (true)` / `WITH CHECK (true)` (migration 007, single-tenant model).
Policies are now scoped to the authenticated user's site via
`current_user_site_id()` (derived from the JWT claim `site_id`).

Tables WITHOUT a site_id column (farms, sites, audit_logs) use role-based
access (administrateur / propriétaire). site_content keeps public SELECT
for the landing page.

Idempotent: DROP POLICY IF EXISTS + CREATE POLICY for every table.
*/

DO $$
DECLARE
  r record;
  has_site_id boolean;
BEGIN
  FOR r IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'farms','app_users','funders','fundings','bank_accounts','cash_accounts',
        'transactions','suppliers','expense_categories','expenses','documents',
        'sites','plots','campaigns','crop_operations','harvests','animals',
        'animal_lots','animal_events','projects','project_steps','inventory_items',
        'inventory_movements','inventory_counts','budgets','alerts','notifications',
        'audit_logs','site_content'
      )
  ) LOOP
    -- Remove previous 007 policies if any
    EXECUTE format('DROP POLICY IF EXISTS auth_select_%I ON %I', r.tablename, r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS auth_insert_%I ON %I', r.tablename, r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS auth_update_%I ON %I', r.tablename, r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS auth_delete_%I ON %I', r.tablename, r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS rls_select_%I ON %I', r.tablename, r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS rls_insert_%I ON %I', r.tablename, r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS rls_update_%I ON %I', r.tablename, r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS rls_delete_%I ON %I', r.tablename, r.tablename);

    -- Detect whether the table carries a site_id column
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = r.tablename
        AND column_name = 'site_id'
    ) INTO has_site_id;

    IF r.tablename = 'site_content' THEN
      -- Public landing page: SELECT for everyone, writes for authenticated only
      EXECUTE format('CREATE POLICY rls_select_%I ON %I FOR SELECT TO anon, authenticated USING (true)', r.tablename, r.tablename);
      EXECUTE format('CREATE POLICY rls_insert_%I ON %I FOR INSERT TO authenticated WITH CHECK (true)', r.tablename, r.tablename);
      EXECUTE format('CREATE POLICY rls_update_%I ON %I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', r.tablename, r.tablename);
      EXECUTE format('CREATE POLICY rls_delete_%I ON %I FOR DELETE TO authenticated USING (true)', r.tablename, r.tablename);
    ELSIF has_site_id THEN
      -- Site-scoped: only rows belonging to the user's site
      EXECUTE format('CREATE POLICY rls_select_%I ON %I FOR SELECT TO authenticated USING (site_id = current_user_site_id())', r.tablename, r.tablename);
      EXECUTE format('CREATE POLICY rls_insert_%I ON %I FOR INSERT TO authenticated WITH CHECK (site_id = current_user_site_id())', r.tablename, r.tablename);
      EXECUTE format('CREATE POLICY rls_update_%I ON %I FOR UPDATE TO authenticated USING (site_id = current_user_site_id()) WITH CHECK (site_id = current_user_site_id())', r.tablename, r.tablename);
      EXECUTE format('CREATE POLICY rls_delete_%I ON %I FOR DELETE TO authenticated USING (site_id = current_user_site_id())', r.tablename, r.tablename);
    ELSE
      -- Parent/reference tables without site_id: role-based access
      EXECUTE format('CREATE POLICY rls_select_%I ON %I FOR SELECT TO authenticated USING (current_user_role() IN (''administrateur'',''propriétaire''))', r.tablename, r.tablename);
      EXECUTE format('CREATE POLICY rls_insert_%I ON %I FOR INSERT TO authenticated WITH CHECK (current_user_role() IN (''administrateur'',''propriétaire''))', r.tablename, r.tablename);
      EXECUTE format('CREATE POLICY rls_update_%I ON %I FOR UPDATE TO authenticated USING (current_user_role() IN (''administrateur'',''propriétaire'')) WITH CHECK (current_user_role() IN (''administrateur'',''propriétaire''))', r.tablename, r.tablename);
      EXECUTE format('CREATE POLICY rls_delete_%I ON %I FOR DELETE TO authenticated USING (current_user_role() IN (''administrateur'',''propriétaire''))', r.tablename, r.tablename);
    END IF;
  END LOOP;
END $$;

-- Ensure FORCE ROW LEVEL SECURITY on all application tables
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'farms','app_users','funders','fundings','bank_accounts','cash_accounts',
        'transactions','suppliers','expense_categories','expenses','documents',
        'sites','plots','campaigns','crop_operations','harvests','animals',
        'animal_lots','animal_events','projects','project_steps','inventory_items',
        'inventory_movements','inventory_counts','budgets','alerts','notifications',
        'audit_logs'
      )
  ) LOOP
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;
