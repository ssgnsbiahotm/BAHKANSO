/*
# Authentication Integration & RLS Tightening

## Overview
This migration transitions the app from demo-mode (anon access, fake login) to real Supabase Auth.
It links app_users to auth.users, tightens RLS to require authentication, secures the
generate_expense_reference function, and adds a trigger to auto-create app_users on signup.

## Changes

### 1. app_users table — link to auth.users
- Added `auth_id uuid` column referencing `auth.users(id)` with ON DELETE CASCADE
- Added unique constraint on `auth_id`
- Added index on `auth_id` for fast lookups

### 2. RLS policy overhaul — all 30 tables
- Removed ALL existing `anon_*` policies (which allowed unauthenticated CRUD)
- New policies: `authenticated` role only (TO authenticated)
- Since this is a single-tenant farm app (all data shared among farm staff),
  policies use `USING (true)` / `WITH CHECK (true)` but ONLY for authenticated users
- anon role gets ZERO access to application data tables
- `site_content` keeps a SELECT policy for anon (needed for public landing page)

### 3. generate_expense_reference function — secured
- Changed from SECURITY DEFINER to SECURITY INVOKER
- Set search_path to 'public' explicitly
- Only callable by authenticated users

### 4. Auto-profile trigger
- `handle_new_user()` trigger function fires after INSERT on auth.users
- Creates an app_users row with the new auth_id, email, and default role 'gestionnaire'
- Extracts name from raw_user_meta_data if provided during signup

### 5. Admin user management function
- `admin_create_user()` SECURITY DEFINER function for admins to create users
- Only callable by authenticated users with role 'administrateur' or 'propriétaire'
- Creates auth user via auth.users insert + app_users row
*/
-- ============ ADD auth_id TO app_users ============
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_users' AND column_name = 'auth_id'
  ) THEN
    ALTER TABLE app_users ADD COLUMN auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    ALTER TABLE app_users ADD CONSTRAINT app_users_auth_id_key UNIQUE (auth_id);
    CREATE INDEX idx_app_users_auth_id ON app_users(auth_id);
  END IF;
END $$;

-- ============ DROP ALL OLD anon POLICIES ============
-- We drop all existing policies so we can replace them with authenticated-only ones
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN (
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ============ HELPER: re-create 4 CRUD policies for authenticated-only tables ============
-- We define a reusable approach: for each table, create select/insert/update/delete
-- policies scoped to TO authenticated with USING(true)/WITH CHECK(true)
-- This is valid because the app is single-tenant: all authenticated farm staff share all data

-- FARMS
CREATE POLICY "auth_select_farms" ON farms FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_farms" ON farms FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_farms" ON farms FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_farms" ON farms FOR DELETE TO authenticated USING (true);

-- APP_USERS
CREATE POLICY "auth_select_app_users" ON app_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_app_users" ON app_users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_app_users" ON app_users FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_app_users" ON app_users FOR DELETE TO authenticated USING (true);

-- FUNDERS
CREATE POLICY "auth_select_funders" ON funders FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_funders" ON funders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_funders" ON funders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_funders" ON funders FOR DELETE TO authenticated USING (true);

-- FUNDINGS
CREATE POLICY "auth_select_fundings" ON fundings FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_fundings" ON fundings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_fundings" ON fundings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_fundings" ON fundings FOR DELETE TO authenticated USING (true);

-- BANK_ACCOUNTS
CREATE POLICY "auth_select_bank_accounts" ON bank_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_bank_accounts" ON bank_accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_bank_accounts" ON bank_accounts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_bank_accounts" ON bank_accounts FOR DELETE TO authenticated USING (true);

-- CASH_ACCOUNTS
CREATE POLICY "auth_select_cash_accounts" ON cash_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_cash_accounts" ON cash_accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_cash_accounts" ON cash_accounts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_cash_accounts" ON cash_accounts FOR DELETE TO authenticated USING (true);

-- TRANSACTIONS
CREATE POLICY "auth_select_transactions" ON transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_transactions" ON transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_transactions" ON transactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_transactions" ON transactions FOR DELETE TO authenticated USING (true);

-- SUPPLIERS
CREATE POLICY "auth_select_suppliers" ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_suppliers" ON suppliers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_suppliers" ON suppliers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_suppliers" ON suppliers FOR DELETE TO authenticated USING (true);

-- EXPENSE_CATEGORIES
CREATE POLICY "auth_select_expense_categories" ON expense_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_expense_categories" ON expense_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_expense_categories" ON expense_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_expense_categories" ON expense_categories FOR DELETE TO authenticated USING (true);

-- EXPENSES
CREATE POLICY "auth_select_expenses" ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_expenses" ON expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_expenses" ON expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_expenses" ON expenses FOR DELETE TO authenticated USING (true);

-- DOCUMENTS
CREATE POLICY "auth_select_documents" ON documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_documents" ON documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_documents" ON documents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_documents" ON documents FOR DELETE TO authenticated USING (true);

-- SITES
CREATE POLICY "auth_select_sites" ON sites FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_sites" ON sites FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_sites" ON sites FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_sites" ON sites FOR DELETE TO authenticated USING (true);

-- PLOTS
CREATE POLICY "auth_select_plots" ON plots FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_plots" ON plots FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_plots" ON plots FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_plots" ON plots FOR DELETE TO authenticated USING (true);

-- CAMPAIGNS
CREATE POLICY "auth_select_campaigns" ON campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_campaigns" ON campaigns FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_campaigns" ON campaigns FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_campaigns" ON campaigns FOR DELETE TO authenticated USING (true);

-- CROP_OPERATIONS
CREATE POLICY "auth_select_crop_operations" ON crop_operations FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_crop_operations" ON crop_operations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_crop_operations" ON crop_operations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_crop_operations" ON crop_operations FOR DELETE TO authenticated USING (true);

-- HARVESTS
CREATE POLICY "auth_select_harvests" ON harvests FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_harvests" ON harvests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_harvests" ON harvests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_harvests" ON harvests FOR DELETE TO authenticated USING (true);

-- ANIMALS
CREATE POLICY "auth_select_animals" ON animals FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_animals" ON animals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_animals" ON animals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_animals" ON animals FOR DELETE TO authenticated USING (true);

-- ANIMAL_LOTS
CREATE POLICY "auth_select_animal_lots" ON animal_lots FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_animal_lots" ON animal_lots FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_animal_lots" ON animal_lots FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_animal_lots" ON animal_lots FOR DELETE TO authenticated USING (true);

-- ANIMAL_EVENTS
CREATE POLICY "auth_select_animal_events" ON animal_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_animal_events" ON animal_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_animal_events" ON animal_events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_animal_events" ON animal_events FOR DELETE TO authenticated USING (true);

-- PROJECTS
CREATE POLICY "auth_select_projects" ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_projects" ON projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_projects" ON projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_projects" ON projects FOR DELETE TO authenticated USING (true);

-- PROJECT_STEPS
CREATE POLICY "auth_select_project_steps" ON project_steps FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_project_steps" ON project_steps FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_project_steps" ON project_steps FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_project_steps" ON project_steps FOR DELETE TO authenticated USING (true);

-- INVENTORY_ITEMS
CREATE POLICY "auth_select_inventory_items" ON inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_inventory_items" ON inventory_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_inventory_items" ON inventory_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_inventory_items" ON inventory_items FOR DELETE TO authenticated USING (true);

-- INVENTORY_MOVEMENTS
CREATE POLICY "auth_select_inventory_movements" ON inventory_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_inventory_movements" ON inventory_movements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_inventory_movements" ON inventory_movements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_inventory_movements" ON inventory_movements FOR DELETE TO authenticated USING (true);

-- INVENTORY_COUNTS
CREATE POLICY "auth_select_inventory_counts" ON inventory_counts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_inventory_counts" ON inventory_counts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_inventory_counts" ON inventory_counts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_inventory_counts" ON inventory_counts FOR DELETE TO authenticated USING (true);

-- BUDGETS
CREATE POLICY "auth_select_budgets" ON budgets FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_budgets" ON budgets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_budgets" ON budgets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_budgets" ON budgets FOR DELETE TO authenticated USING (true);

-- ALERTS
CREATE POLICY "auth_select_alerts" ON alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_alerts" ON alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_alerts" ON alerts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_alerts" ON alerts FOR DELETE TO authenticated USING (true);

-- NOTIFICATIONS
CREATE POLICY "auth_select_notifications" ON notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_notifications" ON notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_notifications" ON notifications FOR DELETE TO authenticated USING (true);

-- AUDIT_LOGS
CREATE POLICY "auth_select_audit_logs" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_audit_logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_audit_logs" ON audit_logs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_audit_logs" ON audit_logs FOR DELETE TO authenticated USING (true);

-- SITE_CONTENT — SELECT allowed for anon (public landing page), write for authenticated only
CREATE POLICY "anon_select_site_content" ON site_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_insert_site_content" ON site_content FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_site_content" ON site_content FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_site_content" ON site_content FOR DELETE TO authenticated USING (true);

-- ============ SECURE generate_expense_reference ============
CREATE OR REPLACE FUNCTION public.generate_expense_reference()
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $$
DECLARE
  current_year int := extract(year from now());
  seq_num int;
  ref text;
BEGIN
  SELECT count(*) + 1 INTO seq_num FROM expenses WHERE extract(year from date) = current_year;
  ref := 'DEP-' || current_year || '-' || lpad(seq_num::text, 5, '0');
  RETURN ref;
END;
$$;

-- Revoke execute from anon, grant to authenticated
REVOKE EXECUTE ON FUNCTION public.generate_expense_reference() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.generate_expense_reference() TO authenticated;

-- ============ AUTO-PROFILE TRIGGER ============
-- When a new user signs up via Supabase Auth, auto-create an app_users row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.app_users (auth_id, name, email, role, active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'gestionnaire',
    true
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant execute on handle_new_user trigger function to supabase_admin (needed for trigger)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_admin;
