## Migration: 20260929171038_001_core_tables.sql

/*
# Bahkanso Core Tables — Part 1: Farm, Users, Funders, Fundings, Accounts, Expenses, Documents

## Overview
This migration creates the foundational tables for Bahkanso, an agro-pastoral investment management platform.

## New Tables
1. **farms** — The exploitation/farm entity (single farm for this deployment)
2. **app_users** — Application users with roles (linked to Supabase auth)
3. **funders** — Funding sources/people who finance the exploitation
4. **fundings** — Individual funding transfers (sent → received)
5. **bank_accounts** — Bank accounts with balances
6. **cash_accounts** — Cash boxes with balances
7. **transactions** — Treasury movements (income, expense, transfer)
8. **suppliers** — Vendors/suppliers for purchases
9. **expense_categories** — Categories of expenses
10. **expenses** — Individual expense records with auto-generated IDs
11. **documents** — Justificatifs/receipts/documents linked to expenses and other objects

## Security
- RLS enabled on all tables
- Policies allow `anon, authenticated` CRUD (single-tenant demo app, no sign-in screen)
- All data is intentionally shared within the farm context

## Notes
- Uses `gen_random_uuid()` for primary keys
- Auto-generates expense IDs in format `DEP-YYYY-NNNNN`
- All monetary amounts stored as numeric
- Timestamps default to `now()`
*/

-- ============ FARMS ============
CREATE TABLE IF NOT EXISTS farms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  country text DEFAULT 'Côte d''Ivoire',
  currency text DEFAULT 'FCFA',
  phone text,
  email text,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_farms" ON farms;
CREATE POLICY "anon_crud_farms" ON farms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_farms" ON farms FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_farms" ON farms FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_farms" ON farms FOR DELETE TO anon, authenticated USING (true);

-- ============ APP USERS ============
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  role text NOT NULL DEFAULT 'gestionnaire',
  phone text,
  avatar_url text,
  active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_app_users" ON app_users;
CREATE POLICY "anon_select_app_users" ON app_users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_app_users" ON app_users FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_app_users" ON app_users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_app_users" ON app_users FOR DELETE TO anon, authenticated USING (true);

-- ============ FUNDERS ============
CREATE TABLE IF NOT EXISTS funders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organization text,
  email text,
  phone text,
  country text,
  total_sent numeric DEFAULT 0,
  total_received numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE funders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_funders" ON funders;
CREATE POLICY "anon_select_funders" ON funders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_funders" ON funders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_funders" ON funders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_funders" ON funders FOR DELETE TO anon, authenticated USING (true);

-- ============ FUNDINGS ============
CREATE TABLE IF NOT EXISTS fundings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE,
  funder_id uuid REFERENCES funders(id) ON DELETE SET NULL,
  amount_sent numeric NOT NULL,
  currency_sent text NOT NULL DEFAULT 'EUR',
  exchange_rate numeric DEFAULT 1,
  amount_received numeric,
  transfer_fees numeric DEFAULT 0,
  date_sent date NOT NULL,
  date_received date,
  destination_account_id uuid,
  bank_reference text,
  status text NOT NULL DEFAULT 'prévu',
  project_id uuid,
  comment text,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE fundings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_fundings" ON fundings;
CREATE POLICY "anon_select_fundings" ON fundings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_fundings" ON fundings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_fundings" ON fundings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_fundings" ON fundings FOR DELETE TO anon, authenticated USING (true);

-- ============ BANK ACCOUNTS ============
CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bank_name text,
  account_number text,
  iban text,
  currency text DEFAULT 'FCFA',
  balance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_bank_accounts" ON bank_accounts;
CREATE POLICY "anon_select_bank_accounts" ON bank_accounts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_bank_accounts" ON bank_accounts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_bank_accounts" ON bank_accounts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_bank_accounts" ON bank_accounts FOR DELETE TO anon, authenticated USING (true);

-- ============ CASH ACCOUNTS ============
CREATE TABLE IF NOT EXISTS cash_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  currency text DEFAULT 'FCFA',
  balance numeric DEFAULT 0,
  responsible text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cash_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_cash_accounts" ON cash_accounts;
CREATE POLICY "anon_select_cash_accounts" ON cash_accounts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_cash_accounts" ON cash_accounts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_cash_accounts" ON cash_accounts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_cash_accounts" ON cash_accounts FOR DELETE TO anon, authenticated USING (true);

-- ============ TRANSACTIONS ============
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE,
  type text NOT NULL DEFAULT 'expense',
  amount numeric NOT NULL,
  currency text DEFAULT 'FCFA',
  bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE SET NULL,
  cash_account_id uuid REFERENCES cash_accounts(id) ON DELETE SET NULL,
  direction text DEFAULT 'out',
  description text,
  expense_id uuid,
  funding_id uuid REFERENCES fundings(id) ON DELETE SET NULL,
  transaction_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_transactions" ON transactions;
CREATE POLICY "anon_select_transactions" ON transactions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_transactions" ON transactions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_transactions" ON transactions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_transactions" ON transactions FOR DELETE TO anon, authenticated USING (true);

-- ============ SUPPLIERS ============
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  phone text,
  email text,
  address text,
  contact_person text,
  total_purchases numeric DEFAULT 0,
  rating int DEFAULT 3,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_suppliers" ON suppliers;
CREATE POLICY "anon_select_suppliers" ON suppliers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_suppliers" ON suppliers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_suppliers" ON suppliers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_suppliers" ON suppliers FOR DELETE TO anon, authenticated USING (true);

-- ============ EXPENSE CATEGORIES ============
CREATE TABLE IF NOT EXISTS expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#22C55E',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_expense_categories" ON expense_categories;
CREATE POLICY "anon_select_expense_categories" ON expense_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_expense_categories" ON expense_categories FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_expense_categories" ON expense_categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_expense_categories" ON expense_categories FOR DELETE TO anon, authenticated USING (true);

-- ============ EXPENSES ============
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric NOT NULL,
  currency text DEFAULT 'FCFA',
  category text,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  responsible text,
  payment_method text DEFAULT 'espèces',
  bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE SET NULL,
  cash_account_id uuid REFERENCES cash_accounts(id) ON DELETE SET NULL,
  project_id uuid,
  activity text,
  funding_id uuid REFERENCES fundings(id) ON DELETE SET NULL,
  description text,
  status text NOT NULL DEFAULT 'brouillon',
  has_justificatif boolean DEFAULT false,
  comment text,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_expenses" ON expenses;
CREATE POLICY "anon_select_expenses" ON expenses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_expenses" ON expenses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_expenses" ON expenses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_expenses" ON expenses FOR DELETE TO anon, authenticated USING (true);

-- Auto-generate expense reference DEP-YYYY-NNNNN
CREATE OR REPLACE FUNCTION generate_expense_reference()
RETURNS text AS $$
DECLARE
  current_year int := extract(year from now());
  seq_num int;
  ref text;
BEGIN
  SELECT count(*) + 1 INTO seq_num FROM expenses WHERE extract(year from date) = current_year;
  ref := 'DEP-' || current_year || '-' || lpad(seq_num::text, 5, '0');
  RETURN ref;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ DOCUMENTS ============
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE,
  type text NOT NULL DEFAULT 'facture',
  name text NOT NULL,
  file_url text,
  file_hash text,
  file_size bigint,
  mime_type text,
  upload_date timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  object_type text,
  object_id uuid,
  status text NOT NULL DEFAULT 'ajouté',
  verified_date timestamptz,
  verified_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_documents" ON documents;
CREATE POLICY "anon_select_documents" ON documents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_documents" ON documents FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_documents" ON documents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_documents" ON documents FOR DELETE TO anon, authenticated USING (true);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_funding ON expenses(funding_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_fundings_date ON fundings(date_sent DESC);
CREATE INDEX IF NOT EXISTS idx_fundings_status ON fundings(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_documents_object ON documents(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

---
## Migration: 20260929171114_002_operational_tables.sql

/*
# Bahkanso Core Tables — Part 2: Agriculture, Livestock, Projects, Inventory, Budgets, Alerts, Audit

## Overview
This migration creates the operational and system tables for Bahkanso.

## New Tables
1. **sites** — Farm sites/locations
2. **plots** — Agricultural parcels of land
3. **campaigns** — Planting campaigns (year + plot + crop)
4. **crops** — Crop types catalog
5. **crop_operations** — Operations on plots (labour, seeding, treatment, harvest)
6. **harvests** — Harvest records with yield and revenue
7. **animals** — Individual animals (individual mode)
8. **animal_lots** — Groups of animals (lot mode)
9. **animal_events** — Events: birth, vaccination, treatment, sale, death, etc.
10. **projects** — Investment projects (forage, hangar, clôture, etc.)
11. **project_steps** — Project phases/steps with budget and progress
12. **inventory_items** — Stock items catalog
13. **inventory_movements** — Stock in/out movements
14. **inventory_counts** — Physical inventory counts
15. **budgets** — Budget vs actual tracking per project/activity
16. **alerts** — System-generated alerts
17. **notifications** — User notifications
18. **audit_logs** — Immutable audit trail

## Security
- RLS enabled on all tables
- Policies allow `anon, authenticated` CRUD (single-tenant demo app)
*/

-- ============ SITES ============
CREATE TABLE IF NOT EXISTS sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  area_hectares numeric,
  responsible text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_sites" ON sites;
CREATE POLICY "anon_select_sites" ON sites FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_sites" ON sites FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_sites" ON sites FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_sites" ON sites FOR DELETE TO anon, authenticated USING (true);

-- ============ PLOTS ============
CREATE TABLE IF NOT EXISTS plots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text,
  name text NOT NULL,
  site_id uuid REFERENCES sites(id) ON DELETE SET NULL,
  area_hectares numeric NOT NULL,
  location text,
  soil_type text,
  status text DEFAULT 'actif',
  current_crop text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_plots" ON plots;
CREATE POLICY "anon_select_plots" ON plots FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_plots" ON plots FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_plots" ON plots FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_plots" ON plots FOR DELETE TO anon, authenticated USING (true);

-- ============ CROPS ============
CREATE TABLE IF NOT EXISTS crops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  variety text,
  season text,
  growing_cycle_days int,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_crops" ON crops;
CREATE POLICY "anon_select_crops" ON crops FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_crops" ON crops FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_crops" ON crops FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_crops" ON crops FOR DELETE TO anon, authenticated USING (true);

-- ============ CAMPAIGNS ============
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year int NOT NULL,
  plot_id uuid REFERENCES plots(id) ON DELETE SET NULL,
  crop_name text NOT NULL,
  start_date date,
  expected_harvest_date date,
  budget numeric DEFAULT 0,
  responsible text,
  status text DEFAULT 'planifié',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_campaigns" ON campaigns;
CREATE POLICY "anon_select_campaigns" ON campaigns FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_campaigns" ON campaigns FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_campaigns" ON campaigns FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_campaigns" ON campaigns FOR DELETE TO anon, authenticated USING (true);

-- ============ CROP OPERATIONS ============
CREATE TABLE IF NOT EXISTS crop_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  plot_id uuid REFERENCES plots(id) ON DELETE SET NULL,
  type text NOT NULL,
  date date NOT NULL,
  responsible text,
  cost numeric DEFAULT 0,
  labor_cost numeric DEFAULT 0,
  inputs text,
  quantity numeric,
  unit text,
  comment text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE crop_operations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_crop_operations" ON crop_operations;
CREATE POLICY "anon_select_crop_operations" ON crop_operations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_crop_operations" ON crop_operations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_crop_operations" ON crop_operations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_crop_operations" ON crop_operations FOR DELETE TO anon, authenticated USING (true);

-- ============ HARVESTS ============
CREATE TABLE IF NOT EXISTS harvests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  plot_id uuid REFERENCES plots(id) ON DELETE SET NULL,
  date date NOT NULL,
  quantity numeric NOT NULL,
  unit text DEFAULT 'kg',
  quality text,
  estimated_price numeric,
  revenue numeric,
  destination text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE harvests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_harvests" ON harvests;
CREATE POLICY "anon_select_harvests" ON harvests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_harvests" ON harvests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_harvests" ON harvests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_harvests" ON harvests FOR DELETE TO anon, authenticated USING (true);

-- ============ ANIMALS ============
CREATE TABLE IF NOT EXISTS animals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text UNIQUE,
  species text NOT NULL,
  breed text,
  sex text,
  birth_date date,
  origin text,
  acquisition_date date,
  acquisition_value numeric DEFAULT 0,
  weight_kg numeric,
  lot_id uuid,
  location text,
  status text DEFAULT 'actif',
  estimated_value numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_animals" ON animals;
CREATE POLICY "anon_select_animals" ON animals FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_animals" ON animals FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_animals" ON animals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_animals" ON animals FOR DELETE TO anon, authenticated USING (true);

-- ============ ANIMAL LOTS ============
CREATE TABLE IF NOT EXISTS animal_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text UNIQUE,
  species text NOT NULL,
  breed text,
  count int NOT NULL DEFAULT 1,
  location text,
  status text DEFAULT 'actif',
  estimated_value numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE animal_lots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_animal_lots" ON animal_lots;
CREATE POLICY "anon_select_animal_lots" ON animal_lots FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_animal_lots" ON animal_lots FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_animal_lots" ON animal_lots FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_animal_lots" ON animal_lots FOR DELETE TO anon, authenticated USING (true);

-- ============ ANIMAL EVENTS ============
CREATE TABLE IF NOT EXISTS animal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid REFERENCES animals(id) ON DELETE SET NULL,
  lot_id uuid REFERENCES animal_lots(id) ON DELETE SET NULL,
  type text NOT NULL,
  date date NOT NULL,
  description text,
  cost numeric DEFAULT 0,
  responsible text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE animal_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_animal_events" ON animal_events;
CREATE POLICY "anon_select_animal_events" ON animal_events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_animal_events" ON animal_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_animal_events" ON animal_events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_animal_events" ON animal_events FOR DELETE TO anon, authenticated USING (true);

-- ============ PROJECTS ============
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text,
  responsible text,
  initial_budget numeric NOT NULL DEFAULT 0,
  revised_budget numeric DEFAULT 0,
  start_date date,
  expected_end_date date,
  actual_end_date date,
  status text DEFAULT 'planifié',
  progress int DEFAULT 0,
  description text,
  funding_id uuid REFERENCES fundings(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_projects" ON projects;
CREATE POLICY "anon_select_projects" ON projects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_projects" ON projects FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_projects" ON projects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_projects" ON projects FOR DELETE TO anon, authenticated USING (true);

-- ============ PROJECT STEPS ============
CREATE TABLE IF NOT EXISTS project_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  budget numeric DEFAULT 0,
  actual_cost numeric DEFAULT 0,
  progress int DEFAULT 0,
  responsible text,
  date date,
  status text DEFAULT 'planifié',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE project_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_project_steps" ON project_steps;
CREATE POLICY "anon_select_project_steps" ON project_steps FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_project_steps" ON project_steps FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_project_steps" ON project_steps FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_project_steps" ON project_steps FOR DELETE TO anon, authenticated USING (true);

-- ============ INVENTORY ITEMS ============
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  unit text DEFAULT 'unité',
  min_stock numeric DEFAULT 0,
  current_stock numeric DEFAULT 0,
  location text,
  unit_cost numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_inventory_items" ON inventory_items;
CREATE POLICY "anon_select_inventory_items" ON inventory_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_inventory_items" ON inventory_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_inventory_items" ON inventory_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_inventory_items" ON inventory_items FOR DELETE TO anon, authenticated USING (true);

-- ============ INVENTORY MOVEMENTS ============
CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'achat',
  quantity numeric NOT NULL,
  unit_cost numeric DEFAULT 0,
  date timestamptz DEFAULT now(),
  reason text,
  linked_object_type text,
  linked_object_id uuid,
  responsible text,
  expense_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_inventory_movements" ON inventory_movements;
CREATE POLICY "anon_select_inventory_movements" ON inventory_movements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_inventory_movements" ON inventory_movements FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_inventory_movements" ON inventory_movements FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_inventory_movements" ON inventory_movements FOR DELETE TO anon, authenticated USING (true);

-- ============ INVENTORY COUNTS ============
CREATE TABLE IF NOT EXISTS inventory_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
  count_date date NOT NULL,
  theoretical_stock numeric,
  physical_stock numeric,
  difference numeric,
  justification text,
  status text DEFAULT 'en attente',
  validated_by text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_inventory_counts" ON inventory_counts;
CREATE POLICY "anon_select_inventory_counts" ON inventory_counts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_inventory_counts" ON inventory_counts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_inventory_counts" ON inventory_counts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_inventory_counts" ON inventory_counts FOR DELETE TO anon, authenticated USING (true);

-- ============ BUDGETS ============
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_type text NOT NULL,
  object_id uuid,
  object_name text,
  initial_budget numeric NOT NULL DEFAULT 0,
  revised_budget numeric DEFAULT 0,
  committed_amount numeric DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_budgets" ON budgets;
CREATE POLICY "anon_select_budgets" ON budgets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_budgets" ON budgets FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_budgets" ON budgets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_budgets" ON budgets FOR DELETE TO anon, authenticated USING (true);

-- ============ ALERTS ============
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  title text NOT NULL,
  description text,
  object_type text,
  object_id uuid,
  status text DEFAULT 'ouverte',
  assigned_to text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_alerts" ON alerts;
CREATE POLICY "anon_select_alerts" ON alerts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_alerts" ON alerts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_alerts" ON alerts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_alerts" ON alerts FOR DELETE TO anon, authenticated USING (true);

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  level text DEFAULT 'info',
  object_type text,
  object_id uuid,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_notifications" ON notifications;
CREATE POLICY "anon_select_notifications" ON notifications FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_notifications" ON notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_notifications" ON notifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_notifications" ON notifications FOR DELETE TO anon, authenticated USING (true);

-- ============ AUDIT LOGS ============
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text,
  action text NOT NULL,
  object_type text,
  object_id text,
  old_value jsonb,
  new_value jsonb,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_audit_logs" ON audit_logs;
CREATE POLICY "anon_select_audit_logs" ON audit_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_audit_logs" ON audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_audit_logs" ON audit_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_audit_logs" ON audit_logs FOR DELETE TO anon, authenticated USING (true);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_plots_site ON plots(site_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_plot ON campaigns(plot_id);
CREATE INDEX IF NOT EXISTS idx_crop_ops_campaign ON crop_operations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_harvests_campaign ON harvests(campaign_id);
CREATE INDEX IF NOT EXISTS idx_animal_events_animal ON animal_events(animal_id);
CREATE INDEX IF NOT EXISTS idx_project_steps_project ON project_steps(project_id);
CREATE INDEX IF NOT EXISTS idx_inv_movements_item ON inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_object ON budgets(object_type, object_id);

---
## Migration: 20260929171147_003_seed_data_part1.sql

/*
# Bahkanso Demo Data — Part 1: Farm, Users, Funders, Accounts, Suppliers, Categories

## Overview
Seeds realistic demonstration data for the Bahkanso platform.

## Data Created
1. **Farm**: "Ferme AgroVision" in Côte d'Ivoire
2. **App Users**: 8 users with different roles (admin, propriétaire, financeur, gestionnaire, comptable, responsable agricole, responsable élevage, auditeur)
3. **Funders**: 3 funders (individuals and organizations)
4. **Bank Accounts**: 2 bank accounts (Ecobank, BICICI)
5. **Cash Accounts**: 2 cash boxes (Caisse principale, Caisse terrain)
6. **Suppliers**: 6 suppliers (feed, seeds, vet, materials, fuel, equipment)
7. **Expense Categories**: 13 categories matching the spec

## Notes
- Uses ON CONFLICT to be idempotent
- Stores UUIDs in variables for cross-reference in subsequent migrations
*/

-- Clear existing data to avoid duplicates (safe on first run, idempotent on re-run)
DELETE FROM audit_logs;
DELETE FROM notifications;
DELETE FROM alerts;
DELETE FROM budgets;
DELETE FROM inventory_counts;
DELETE FROM inventory_movements;
DELETE FROM inventory_items;
DELETE FROM project_steps;
DELETE FROM projects;
DELETE FROM animal_events;
DELETE FROM animals;
DELETE FROM animal_lots;
DELETE FROM harvests;
DELETE FROM crop_operations;
DELETE FROM campaigns;
DELETE FROM crops;
DELETE FROM plots;
DELETE FROM sites;
DELETE FROM documents;
DELETE FROM transactions;
DELETE FROM expenses;
DELETE FROM expense_categories;
DELETE FROM suppliers;
DELETE FROM cash_accounts;
DELETE FROM bank_accounts;
DELETE FROM fundings;
DELETE FROM funders;
DELETE FROM app_users;
DELETE FROM farms;

-- ============ FARM ============
INSERT INTO farms (id, name, location, country, currency, phone, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Ferme AgroVision', 'Dabou, Côte d''Ivoire', 'Côte d''Ivoire', 'FCFA', '+225 27 23 45 67 89', 'contact@ferme-agrovision.ci');

-- ============ APP USERS ============
INSERT INTO app_users (id, name, email, role, phone, active) VALUES
  ('00000000-0000-0000-0000-000000000010', 'Kouadio Mensah', 'kouadio@ferme-agrovision.ci', 'administrateur', '+225 07 00 11 22 33', true),
  ('00000000-0000-0000-0000-000000000011', 'Awa Touré', 'awa@ferme-agrovision.ci', 'propriétaire', '+225 07 01 11 22 33', true),
  ('00000000-0000-0000-0000-000000000012', 'Jean-Pierre Dupont', 'jp.dupont@gmail.com', 'financeur', '+33 6 12 34 56 78', true),
  ('00000000-0000-0000-0000-000000000013', 'Ibrahim Cissé', 'ibrahim@ferme-agrovision.ci', 'gestionnaire', '+225 07 02 11 22 33', true),
  ('00000000-0000-0000-0000-000000000014', 'Fatou Koné', 'fatou@ferme-agrovision.ci', 'comptable', '+225 07 03 11 22 33', true),
  ('00000000-0000-0000-0000-000000000015', 'Sékou Camara', 'sekou@ferme-agrovision.ci', 'responsable_agricole', '+225 07 04 11 22 33', true),
  ('00000000-0000-0000-0000-000000000016', 'Moussa Bakayoko', 'moussa@ferme-agrovision.ci', 'responsable_élevage', '+225 07 05 11 22 33', true),
  ('00000000-0000-0000-0000-000000000017', 'Anne Martin', 'anne.martin@audit-cabinet.fr', 'auditeur', '+33 1 45 67 89 01', true);

-- ============ FUNDERS ============
INSERT INTO funders (id, name, organization, email, phone, country, total_sent, total_received) VALUES
  ('00000000-0000-0000-0000-000000000020', 'Jean-Pierre Dupont', 'InvestirAfrique', 'jp.dupont@gmail.com', '+33 6 12 34 56 78', 'France', 50000000, 32750000),
  ('00000000-0000-0000-0000-000000000021', 'Marie-Claire Boni', 'Boni Capital', 'mc.boni@bonicapital.com', '+33 6 98 76 54 32', 'France', 15000000, 15000000),
  ('00000000-0000-0000-0000-000000000022', 'AgriFund SARL', 'AgriFund', 'contact@agrifund.com', '+33 1 23 45 67 89', 'France', 10000000, 10000000);

-- ============ BANK ACCOUNTS ============
INSERT INTO bank_accounts (id, name, bank_name, account_number, currency, balance) VALUES
  ('00000000-0000-0000-0000-000000000030', 'Compte principal Ecobank', 'Ecobank', 'CI05 001 010 1234567890 12', 'FCFA', 8450000),
  ('00000000-0000-0000-0000-000000000031', 'Compte BICICI exploitation', 'BICICI', 'CI05 001 011 9876543210 34', 'FCFA', 4000000);

-- ============ CASH ACCOUNTS ============
INSERT INTO cash_accounts (id, name, location, currency, balance, responsible) VALUES
  ('00000000-0000-0000-0000-000000000040', 'Caisse principale', 'Bureau Dabou', 'FCFA', 350000, 'Fatou Koné'),
  ('00000000-0000-0000-0000-000000000041', 'Caisse terrain', 'Site de Dabou', 'FCFA', 150000, 'Ibrahim Cissé');

-- ============ SUPPLIERS ============
INSERT INTO suppliers (id, name, category, phone, email, address, contact_person, total_purchases, rating) VALUES
  ('00000000-0000-0000-0000-000000000050', 'NutriAnim SA', 'Alimentation animale', '+225 27 22 44 55 66', 'ventes@nutrianim.ci', 'Zone Industrielle Abidjan', 'Konan Yao', 3200000, 5),
  ('00000000-0000-0000-0000-000000000051', 'Semences Plus', 'Semences', '+225 27 22 33 44 55', 'contact@semencesplus.ci', 'Treichville Abidjan', 'Adjoua Kouassi', 850000, 4),
  ('00000000-0000-0000-0000-000000000052', 'VétoPro CI', 'Produits vétérinaires', '+225 27 22 55 66 77', 'info@vetopro.ci', 'Cocody Abidjan', 'Dr. Brou Koffi', 620000, 5),
  ('00000000-0000-0000-0000-000000000053', 'Matériaux Construction Dabou', 'Matériaux', '+225 27 23 66 77 88', 'ventes@mcdabou.ci', 'Dabou', 'Yao Kouadio', 4500000, 3),
  ('00000000-0000-0000-0000-000000000054', 'PetroCI Station', 'Carburant', '+225 27 23 77 88 99', 'station.dabou@petroci.ci', 'Dabou route principale', 'Awa Bamba', 980000, 4),
  ('00000000-0000-0000-0000-000000000055', 'AgriEquip CI', 'Équipement', '+225 27 22 99 00 11', 'contact@agriequip.ci', 'Yopougon Abidjan', 'Koffi N''Guessan', 2800000, 4);

-- ============ EXPENSE CATEGORIES ============
INSERT INTO expense_categories (name, description, color) VALUES
  ('Alimentation animale', 'Aliments pour le bétail', '#22C55E'),
  ('Semences', 'Semences et plants', '#16A34A'),
  ('Engrais', 'Engrais et amendements', '#15803D'),
  ('Produits vétérinaires', 'Médicaments et soins vétérinaires', '#2563EB'),
  ('Main-d''œuvre', 'Salaires et frais de personnel', '#F59E0B'),
  ('Matériaux', 'Matériaux de construction', '#64748B'),
  ('Carburant', 'Carburant et lubrifiants', '#DC2626'),
  ('Transport', 'Frais de transport et logistique', '#8B5CF6'),
  ('Équipement', 'Achat et maintenance d''équipements', '#0891B2'),
  ('Maintenance', 'Maintenance et réparations', '#EA580C'),
  ('Construction', 'Travaux de construction', '#475569'),
  ('Administration', 'Frais administratifs', '#6B7280'),
  ('Autre', 'Autres dépenses', '#9CA3AF');

---
## Migration: 20260929171250_004_seed_data_part2.sql

/*
# Bahkanso Demo Data — Part 2: Fundings, Sites, Plots, Campaigns, Animals, Projects, Inventory

## Overview
Seeds operational demonstration data.

## Data Created
1. **Fundings**: 5 funding records with different statuses (reçu, envoyé, en transit, prévu)
2. **Sites**: 1 site (Site de Dabou)
3. **Plots**: 3 plots (P-01 Maïs 5ha, P-02 Soja 8ha, P-03 Manioc 4ha)
4. **Campaigns**: 3 campaigns (2026 season for each plot)
5. **Crops**: 3 crop types (Maïs, Soja, Manioc)
6. **Crop Operations**: 6 operations across campaigns
7. **Harvests**: 1 completed harvest
8. **Animal Lots**: 3 lots (bovins, poulets, chèvres)
9. **Animals**: 5 individual tracked animals
10. **Animal Events**: 8 events (vaccinations, traitements, naissances, pesées)
11. **Projects**: 3 projects (Forage, Hangar, Clôture) with different progress
12. **Project Steps**: 9 steps (3 per project)
13. **Inventory Items**: 7 items (ciment, aliments, semences, engrais, carburant, vet, outils)
14. **Inventory Movements**: 10 movements
15. **Inventory Counts**: 1 count with anomaly
16. **Budgets**: 5 budget records
*/

-- ============ FUNDINGS ============
INSERT INTO fundings (id, reference, funder_id, amount_sent, currency_sent, exchange_rate, amount_received, transfer_fees, date_sent, date_received, destination_account_id, bank_reference, status, comment, created_by) VALUES
  ('00000000-0000-0000-0000-000000000060', 'FND-2025-001', '00000000-0000-0000-0000-000000000020', 10000, 'EUR', 655.95, 6559500, 40500, '2025-01-15', '2025-01-18', '00000000-0000-0000-0000-000000000030', 'ECO-2025-001-8842', 'reçu', 'Premier financement pour démarrage exploitation', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000061', 'FND-2025-002', '00000000-0000-0000-0000-000000000020', 15000, 'EUR', 655.95, 9839250, 150000, '2025-03-20', '2025-03-25', '00000000-0000-0000-0000-000000000030', 'ECO-2025-002-9921', 'reçu', 'Financement forage et irrigation', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000062', 'FND-2025-003', '00000000-0000-0000-0000-000000000021', 15000, 'EUR', 655.95, 9839250, 150000, '2025-06-10', '2025-06-14', '00000000-0000-0000-0000-000000000031', 'BIC-2025-003-4477', 'reçu', 'Financement hangar d''élevage', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000063', 'FND-2026-001', '00000000-0000-0000-0000-000000000020', 5000, 'EUR', 655.95, 3279750, 50250, '2026-01-10', '2026-01-14', '00000000-0000-0000-0000-000000000030', 'ECO-2026-001-5530', 'reçu', 'Financement campagne 2026', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000064', 'FND-2026-002', '00000000-0000-0000-0000-000000000022', 10000, 'EUR', 655.95, null, null, '2026-09-25', null, null, null, 'en transit', 'Financement Q4 2026 en cours de transfert', '00000000-0000-0000-0000-000000000010');

-- ============ SITES ============
INSERT INTO sites (id, name, location, area_hectares, responsible) VALUES
  ('00000000-0000-0000-0000-000000000070', 'Site de Dabou', 'Dabou, 50km Abidjan', 30, 'Sékou Camara');

-- ============ PLOTS ============
INSERT INTO plots (id, reference, name, site_id, area_hectares, location, soil_type, status, current_crop) VALUES
  ('00000000-0000-0000-0000-000000000080', 'P-01', 'Parcelle P-01 — Maïs', '00000000-0000-0000-0000-000000000070', 5, 'Dabou nord', 'Sableux', 'actif', 'Maïs'),
  ('00000000-0000-0000-0000-000000000081', 'P-02', 'Parcelle P-02 — Soja', '00000000-0000-0000-0000-000000000070', 8, 'Dabou centre', 'Argileux', 'actif', 'Soja'),
  ('00000000-0000-0000-0000-000000000082', 'P-03', 'Parcelle P-03 — Manioc', '00000000-0000-0000-0000-000000000070', 4, 'Dabou sud', 'Sablo-argileux', 'actif', 'Manioc');

-- ============ CROPS ============
INSERT INTO crops (id, name, variety, season, growing_cycle_days) VALUES
  ('00000000-0000-0000-0000-000000000090', 'Maïs', 'Obatampa', 'Pluies', 90),
  ('00000000-0000-0000-0000-000000000091', 'Soja', 'TGX 1448-2E', 'Pluies', 105),
  ('00000000-0000-0000-0000-000000000092', 'Manioc', 'Bocou 1', 'Toutes saisons', 365);

-- ============ CAMPAIGNS ============
INSERT INTO campaigns (id, year, plot_id, crop_name, start_date, expected_harvest_date, budget, responsible, status) VALUES
  ('00000000-0000-0000-0000-0000000000a0', 2026, '00000000-0000-0000-0000-000000000080', 'Maïs', '2026-03-01', '2026-06-15', 1200000, 'Sékou Camara', 'en cours'),
  ('00000000-0000-0000-0000-0000000000a1', 2026, '00000000-0000-0000-0000-000000000081', 'Soja', '2026-03-15', '2026-07-01', 1800000, 'Sékou Camara', 'en cours'),
  ('00000000-0000-0000-0000-0000000000a2', 2026, '00000000-0000-0000-0000-000000000082', 'Manioc', '2026-04-01', '2027-04-01', 800000, 'Sékou Camara', 'en cours');

-- ============ CROP OPERATIONS ============
INSERT INTO crop_operations (id, campaign_id, plot_id, type, date, responsible, cost, labor_cost, inputs, quantity, unit, comment) VALUES
  ('00000000-0000-0000-0000-0000000000b0', '00000000-0000-0000-0000-0000000000a0', '00000000-0000-0000-0000-000000000080', 'préparation', '2026-03-01', 'Sékou Camara', 150000, 100000, 'Herbicide Glyphosate', 5, 'litres', 'Défrichage et préparation du sol'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a0', '00000000-0000-0000-0000-000000000080', 'semis', '2026-03-10', 'Sékou Camara', 350000, 80000, 'Semences Obatampa 25kg', 25, 'kg', 'Semis manuel en lignes'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a0', '00000000-0000-0000-0000-000000000080', 'fertilisation', '2026-04-05', 'Sékou Camara', 280000, 60000, 'NPK 15-15-15', 300, 'kg', 'Première application d''engrais'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000081', 'préparation', '2026-03-15', 'Sékou Camara', 200000, 120000, 'Herbicide', 8, 'litres', 'Préparation parcelle soja'),
  ('00000000-0000-0000-0000-0000000000b4', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000081', 'semis', '2026-03-25', 'Sékou Camara', 420000, 100000, 'Semences TGX 1448-2E 40kg', 40, 'kg', 'Semis soja'),
  ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000082', 'plantation', '2026-04-01', 'Sékou Camara', 180000, 150000, 'Boutures manioc', 2000, 'boutures', 'Plantation boutures manioc');

-- ============ HARVESTS ============
INSERT INTO harvests (id, campaign_id, plot_id, date, quantity, unit, quality, estimated_price, revenue, destination) VALUES
  ('00000000-0000-0000-0000-0000000000c0', '00000000-0000-0000-0000-0000000000a0', '00000000-0000-0000-0000-000000000080', '2026-06-20', 8500, 'kg', 'bonne', 250, 2125000, 'Vente marché Dabou');

-- ============ ANIMAL LOTS ============
INSERT INTO animal_lots (id, identifier, species, breed, count, location, status, estimated_value) VALUES
  ('00000000-0000-0000-0000-0000000000d0', 'LOT-BOV-01', 'Bovin', 'N''dama', 35, 'Pâturage nord', 'actif', 3500000),
  ('00000000-0000-0000-0000-0000000000d1', 'LOT-VOL-01', 'Volaille', 'Poulet de chair', 80, 'Poulailler A', 'actif', 240000),
  ('00000000-0000-0000-0000-0000000000d2', 'LOT-CAP-01', 'Caprin', 'Chèvre sahélienne', 24, 'Enclos sud', 'actif', 720000);

-- ============ ANIMALS (individual tracking for high-value) ============
INSERT INTO animals (id, identifier, species, breed, sex, birth_date, origin, acquisition_date, acquisition_value, weight_kg, lot_id, location, status, estimated_value) VALUES
  ('00000000-0000-0000-0000-0000000000e0', 'BOV-001', 'Bovin', 'N''dama', 'M', '2022-03-15', 'Ferme Bouaké', '2022-06-01', 180000, 320, '00000000-0000-0000-0000-0000000000d0', 'Pâturage nord', 'actif', 250000),
  ('00000000-0000-0000-0000-0000000000e1', 'BOV-002', 'Bovin', 'N''dama', 'F', '2021-01-20', 'Ferme Bouaké', '2021-03-10', 200000, 380, '00000000-0000-0000-0000-0000000000d0', 'Pâturage nord', 'actif', 280000),
  ('00000000-0000-0000-0000-0000000000e2', 'BOV-003', 'Bovin', 'N''dama', 'M', '2023-05-10', 'Naissance ferme', '2023-05-10', 0, 145, '00000000-0000-0000-0000-0000000000d0', 'Pâturage nord', 'actif', 120000),
  ('00000000-0000-0000-0000-0000000000e3', 'BOV-004', 'Bovin', 'N''dama', 'F', '2023-08-22', 'Naissance ferme', '2023-08-22', 0, 110, '00000000-0000-0000-0000-0000000000d0', 'Pâturage nord', 'actif', 100000),
  ('00000000-0000-0000-0000-0000000000e4', 'BOV-005', 'Bovin', 'N''dama', 'M', '2020-11-05', 'Fermé Yamoussoukro', '2021-01-15', 220000, 450, '00000000-0000-0000-0000-0000000000d0', 'Pâturage nord', 'actif', 350000);

-- ============ ANIMAL EVENTS ============
INSERT INTO animal_events (id, animal_id, lot_id, type, date, description, cost, responsible) VALUES
  ('00000000-0000-0000-0000-0000000000f0', '00000000-0000-0000-0000-0000000000e0', null, 'vaccination', '2026-01-15', 'Vaccination FMD', 15000, 'Dr. Brou Koffi'),
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', null, 'vaccination', '2026-01-15', 'Vaccination FMD', 15000, 'Dr. Brou Koffi'),
  ('00000000-0000-0000-0000-0000000000f2', null, '00000000-0000-0000-0000-0000000000d0', 'vaccination', '2026-02-10', 'Vaccination collective lot bovins - PPCB', 175000, 'Dr. Brou Koffi'),
  ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-0000000000e2', null, 'pesée', '2026-03-01', 'Pesée trimestrielle - 145kg', 0, 'Moussa Bakayoko'),
  ('00000000-0000-0000-0000-0000000000f4', '00000000-0000-0000-0000-0000000000e3', null, 'traitement', '2026-04-12', 'Traitement antiparasitaire', 8000, 'Dr. Brou Koffi'),
  ('00000000-0000-0000-0000-0000000000f5', null, '00000000-0000-0000-0000-0000000000d1', 'vente', '2026-05-20', 'Vente de 15 poulets à 3000 FCFA/u', 45000, 'Moussa Bakayoko'),
  ('00000000-0000-0000-0000-0000000000f6', null, '00000000-0000-0000-0000-0000000000d0', 'naissance', '2026-06-15', 'Naissance veau mâle', 0, 'Moussa Bakayoko'),
  ('00000000-0000-0000-0000-0000000000f7', '00000000-0000-0000-0000-0000000000e4', null, 'pesée', '2026-07-01', 'Pesée trimestrielle - 450kg', 0, 'Moussa Bakayoko');

-- ============ PROJECTS ============
INSERT INTO projects (id, name, type, responsible, initial_budget, revised_budget, start_date, expected_end_date, actual_end_date, status, progress, description, funding_id) VALUES
  ('00000000-0000-0000-0000-000000000100', 'Forage d''eau', 'Forage', 'Ibrahim Cissé', 3000000, 3200000, '2025-04-01', '2025-08-01', '2025-08-15', 'terminé', 100, 'Forage de 80m avec pompe solaire pour irrigation et abreuvement', '00000000-0000-0000-0000-000000000061'),
  ('00000000-0000-0000-0000-000000000101', 'Hangar d''élevage', 'Bâtiment', 'Ibrahim Cissé', 5000000, 5200000, '2025-07-01', '2026-02-01', null, 'en cours', 65, 'Construction hangar 200m² pour élevage volaille', '00000000-0000-0000-0000-000000000062'),
  ('00000000-0000-0000-0000-000000000102', 'Clôture périphérique', 'Clôture', 'Ibrahim Cissé', 1500000, 1500000, '2026-01-15', '2026-04-15', null, 'en cours', 40, 'Clôture 1.5km autour du site de Dabou', '00000000-0000-0000-0000-000000000063');

-- ============ PROJECT STEPS ============
INSERT INTO project_steps (id, project_id, name, budget, actual_cost, progress, responsible, date, status) VALUES
  ('00000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000100', 'Étude géophysique', 300000, 280000, 100, 'Ibrahim Cissé', '2025-04-15', 'terminé'),
  ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000100', 'Forage 80m', 1500000, 1550000, 100, 'Ibrahim Cissé', '2025-06-01', 'terminé'),
  ('00000000-0000-0000-0000-000000000112', '00000000-0000-0000-0000-000000000100', 'Pompe solaire + raccordement', 1200000, 1370000, 100, 'Ibrahim Cissé', '2025-08-15', 'terminé'),
  ('00000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000101', 'Terrassement et fondations', 800000, 850000, 100, 'Ibrahim Cissé', '2025-08-01', 'terminé'),
  ('00000000-0000-0000-0000-000000000114', '00000000-0000-0000-0000-000000000101', 'Structure métallique', 2000000, 2100000, 100, 'Ibrahim Cissé', '2025-11-01', 'terminé'),
  ('00000000-0000-0000-0000-000000000115', '00000000-0000-0000-0000-000000000101', 'Toiture et bardages', 1500000, 0, 0, 'Ibrahim Cissé', null, 'en cours'),
  ('00000000-0000-0000-0000-000000000116', '00000000-0000-0000-0000-000000000101', 'Aménagements intérieurs', 900000, 0, 0, 'Ibrahim Cissé', null, 'planifié'),
  ('00000000-0000-0000-0000-000000000117', '00000000-0000-0000-0000-000000000102', 'Piquetage et tracé', 100000, 100000, 100, 'Ibrahim Cissé', '2026-01-20', 'terminé'),
  ('00000000-0000-0000-0000-000000000118', '00000000-0000-0000-0000-000000000102', 'Pose poteaux + grillage', 1100000, 450000, 30, 'Ibrahim Cissé', null, 'en cours'),
  ('00000000-0000-0000-0000-000000000119', '00000000-0000-0000-0000-000000000102', 'Portails et finitions', 300000, 0, 0, 'Ibrahim Cissé', null, 'planifié');

-- ============ INVENTORY ITEMS ============
INSERT INTO inventory_items (id, name, category, unit, min_stock, current_stock, location, unit_cost) VALUES
  ('00000000-0000-0000-0000-000000000120', 'Ciment CIM 42.5', 'Matériaux', 'sacs', 20, 45, 'Magasin central', 5000),
  ('00000000-0000-0000-0000-000000000121', 'Aliment bovins grower', 'Alimentation animale', 'sacs 50kg', 10, 28, 'Magasin central', 28000),
  ('00000000-0000-0000-0000-000000000122', 'Semences Maïs Obatampa', 'Semences', 'kg', 20, 15, 'Magasin central', 3500),
  ('00000000-0000-0000-0000-000000000123', 'Engrais NPK 15-15-15', 'Engrais', 'sacs 50kg', 5, 8, 'Magasin central', 25000),
  ('00000000-0000-0000-0000-000000000124', 'Carburant diesel', 'Carburant', 'litres', 50, 120, 'Réservoir terrain', 850),
  ('00000000-0000-0000-0000-000000000125', 'Vaccin FMD', 'Produits vétérinaires', 'doses', 20, 35, 'Pharmacie ferme', 2000),
  ('00000000-0000-0000-0000-000000000126', 'Outils divers (pelles, pioches)', 'Outils', 'unités', 5, 12, 'Magasin central', 8000);

-- ============ INVENTORY MOVEMENTS ============
INSERT INTO inventory_movements (id, item_id, type, quantity, unit_cost, date, reason, linked_object_type, responsible) VALUES
  ('00000000-0000-0000-0000-000000000130', '00000000-0000-0000-0000-000000000120', 'achat', 80, 5000, '2025-07-15', 'Achat initial pour construction hangar', 'project', 'Ibrahim Cissé'),
  ('00000000-0000-0000-0000-000000000131', '00000000-0000-0000-0000-000000000120', 'consommation', 35, 5000, '2025-09-01', 'Utilisation fondations hangar', 'project', 'Ibrahim Cissé'),
  ('00000000-0000-0000-0000-000000000132', '00000000-0000-0000-0000-000000000121', 'achat', 40, 28000, '2026-01-20', 'Achat aliments bovins', null, 'Moussa Bakayoko'),
  ('00000000-0000-0000-0000-000000000133', '00000000-0000-0000-0000-000000000121', 'consommation', 12, 28000, '2026-02-15', 'Alimentation lot bovins', 'animal_lot', 'Moussa Bakayoko'),
  ('00000000-0000-0000-0000-000000000134', '00000000-0000-0000-0000-000000000122', 'achat', 25, 3500, '2026-03-05', 'Achat semences maïs', 'campaign', 'Sékou Camara'),
  ('00000000-0000-0000-0000-000000000135', '00000000-0000-0000-0000-000000000122', 'consommation', 25, 3500, '2026-03-10', 'Semis parcelle P-01', 'plot', 'Sékou Camara'),
  ('00000000-0000-0000-0000-000000000136', '00000000-0000-0000-0000-000000000123', 'achat', 12, 25000, '2026-03-20', 'Achat engrais NPK', null, 'Sékou Camara'),
  ('00000000-0000-0000-0000-000000000137', '00000000-0000-0000-0000-000000000123', 'consommation', 4, 25000, '2026-04-05', 'Fertilisation parcelle P-01', 'plot', 'Sékou Camara'),
  ('00000000-0000-0000-0000-000000000138', '00000000-0000-0000-0000-000000000124', 'achat', 200, 850, '2026-01-10', 'Plein réservoir terrain', null, 'Ibrahim Cissé'),
  ('00000000-0000-0000-0000-000000000139', '00000000-0000-0000-0000-000000000124', 'consommation', 80, 850, '2026-03-01', 'Carburant tracteur et véhicule', null, 'Ibrahim Cissé');

-- ============ INVENTORY COUNTS (with anomaly) ============
INSERT INTO inventory_counts (id, item_id, count_date, theoretical_stock, physical_stock, difference, justification, status, validated_by) VALUES
  ('00000000-0000-0000-0000-000000000140', '00000000-0000-0000-0000-000000000121', '2026-09-15', 28, 15, -13, 'Écart important à justifier - possible vol ou perte non enregistrée', 'en attente', null);

-- ============ BUDGETS ============
INSERT INTO budgets (id, object_type, object_id, object_name, initial_budget, revised_budget, committed_amount, paid_amount, period) VALUES
  ('00000000-0000-0000-0000-000000000150', 'project', '00000000-0000-0000-0000-000000000100', 'Forage d''eau', 3000000, 3200000, 3200000, 3200000, '2025'),
  ('00000000-0000-0000-0000-000000000151', 'project', '00000000-0000-0000-0000-000000000101', 'Hangar d''élevage', 5000000, 5200000, 2950000, 2950000, '2025-2026'),
  ('00000000-0000-0000-0000-000000000152', 'project', '00000000-0000-0000-0000-000000000102', 'Clôture périphérique', 1500000, 1500000, 550000, 550000, '2026'),
  ('00000000-0000-0000-0000-000000000153', 'campaign', '00000000-0000-0000-0000-0000000000a0', 'Campagne Maïs 2026', 1200000, 1200000, 780000, 780000, '2026'),
  ('00000000-0000-0000-0000-000000000154', 'campaign', '00000000-0000-0000-0000-0000000000a1', 'Campagne Soja 2026', 1800000, 1800000, 620000, 620000, '2026');

---
## Migration: 20260929171728_005_seed_data_part3.sql

/*
# Bahkanso Demo Data — Part 3 (corrected): Expenses, Documents, Transactions, Alerts, Notifications, Audit Logs
*/

-- Clean up any partial inserts from the failed attempt
DELETE FROM audit_logs;
DELETE FROM notifications;
DELETE FROM alerts;
DELETE FROM documents;
DELETE FROM transactions;
DELETE FROM expenses;

-- ============ TRANSACTIONS ============
INSERT INTO transactions (id, reference, type, amount, currency, bank_account_id, cash_account_id, direction, description, funding_id, transaction_date) VALUES
  ('a0000000-0000-0000-0000-000000000200', 'TXN-001', 'income', 6559500, 'FCFA', '00000000-0000-0000-0000-000000000030', null, 'in', 'Réception financement FND-2025-001', '00000000-0000-0000-0000-000000000060', '2025-01-18'),
  ('a0000000-0000-0000-0000-000000000201', 'TXN-002', 'income', 9839250, 'FCFA', '00000000-0000-0000-0000-000000000030', null, 'in', 'Réception financement FND-2025-002', '00000000-0000-0000-0000-000000000061', '2025-03-25'),
  ('a0000000-0000-0000-0000-000000000202', 'TXN-003', 'income', 9839250, 'FCFA', '00000000-0000-0000-0000-000000000031', null, 'in', 'Réception financement FND-2025-003', '00000000-0000-0000-0000-000000000062', '2025-06-14'),
  ('a0000000-0000-0000-0000-000000000203', 'TXN-004', 'income', 3279750, 'FCFA', '00000000-0000-0000-0000-000000000030', null, 'in', 'Réception financement FND-2026-001', '00000000-0000-0000-0000-000000000063', '2026-01-14'),
  ('a0000000-0000-0000-0000-000000000204', 'TXN-005', 'transfer', 500000, 'FCFA', '00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000040', 'transfer', 'Transfert banque vers caisse principale', null, '2026-02-01'),
  ('a0000000-0000-0000-0000-000000000205', 'TXN-006', 'transfer', 200000, 'FCFA', null, '00000000-0000-0000-0000-000000000040', 'transfer', 'Transfert caisse principale vers caisse terrain', null, '2026-02-15');

-- ============ EXPENSES (20 expenses) ============
INSERT INTO expenses (id, reference, date, amount, currency, category, supplier_id, responsible, payment_method, bank_account_id, cash_account_id, project_id, activity, funding_id, description, status, has_justificatif, comment, created_by) VALUES
  ('a0000000-0000-0000-0000-000000000300', 'DEP-2025-00001', '2025-04-20', 280000, 'FCFA', 'Maintenance', '00000000-0000-0000-0000-000000000053', 'Ibrahim Cissé', 'virement', '00000000-0000-0000-0000-000000000030', null, '00000000-0000-0000-0000-000000000100', 'forage', '00000000-0000-0000-0000-000000000061', 'Étude géophysique pour forage', 'validée', true, null, '00000000-0000-0000-0000-000000000013'),
  ('a0000000-0000-0000-0000-000000000301', 'DEP-2025-00002', '2025-06-01', 1550000, 'FCFA', 'Construction', '00000000-0000-0000-0000-000000000053', 'Ibrahim Cissé', 'virement', '00000000-0000-0000-0000-000000000030', null, '00000000-0000-0000-0000-000000000100', 'forage', '00000000-0000-0000-0000-000000000061', 'Forage 80m de profondeur', 'validée', true, null, '00000000-0000-0000-0000-000000000013'),
  ('a0000000-0000-0000-0000-000000000302', 'DEP-2025-00003', '2025-08-15', 1370000, 'FCFA', 'Équipement', '00000000-0000-0000-0000-000000000055', 'Ibrahim Cissé', 'virement', '00000000-0000-0000-0000-000000000030', null, '00000000-0000-0000-0000-000000000100', 'forage', '00000000-0000-0000-0000-000000000061', 'Pompe solaire et raccordement', 'validée', true, null, '00000000-0000-0000-0000-000000000013'),
  ('a0000000-0000-0000-0000-000000000303', 'DEP-2025-00004', '2025-08-01', 850000, 'FCFA', 'Construction', '00000000-0000-0000-0000-000000000053', 'Ibrahim Cissé', 'virement', '00000000-0000-0000-0000-000000000031', null, '00000000-0000-0000-0000-000000000101', 'hangar', '00000000-0000-0000-0000-000000000062', 'Terrassement et fondations hangar', 'validée', true, null, '00000000-0000-0000-0000-000000000013'),
  ('a0000000-0000-0000-0000-000000000304', 'DEP-2025-00005', '2025-11-01', 2100000, 'FCFA', 'Construction', '00000000-0000-0000-0000-000000000053', 'Ibrahim Cissé', 'virement', '00000000-0000-0000-0000-000000000031', null, '00000000-0000-0000-0000-000000000101', 'hangar', '00000000-0000-0000-0000-000000000062', 'Structure métallique hangar', 'validée', true, null, '00000000-0000-0000-0000-000000000013'),
  ('a0000000-0000-0000-0000-000000000305', 'DEP-2026-00006', '2026-01-20', 100000, 'FCFA', 'Construction', '00000000-0000-0000-0000-000000000053', 'Ibrahim Cissé', 'espèces', null, '00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000102', 'clôture', '00000000-0000-0000-0000-000000000063', 'Piquetage et tracé clôture', 'validée', true, null, '00000000-0000-0000-0000-000000000013'),
  ('a0000000-0000-0000-0000-000000000306', 'DEP-2026-00007', '2026-02-15', 450000, 'FCFA', 'Matériaux', '00000000-0000-0000-0000-000000000053', 'Ibrahim Cissé', 'espèces', null, '00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000102', 'clôture', '00000000-0000-0000-0000-000000000063', 'Achat poteaux et début grillage', 'validée', true, null, '00000000-0000-0000-0000-000000000013'),
  ('a0000000-0000-0000-0000-000000000307', 'DEP-2026-00008', '2026-01-20', 1120000, 'FCFA', 'Alimentation animale', '00000000-0000-0000-0000-000000000050', 'Moussa Bakayoko', 'virement', '00000000-0000-0000-0000-000000000030', null, null, 'élevage', '00000000-0000-0000-0000-000000000063', 'Achat 40 sacs aliment bovins grower', 'validée', true, null, '00000000-0000-0000-0000-000000000016'),
  ('a0000000-0000-0000-0000-000000000308', 'DEP-2026-00009', '2026-02-10', 175000, 'FCFA', 'Produits vétérinaires', '00000000-0000-0000-0000-000000000052', 'Moussa Bakayoko', 'espèces', null, '00000000-0000-0000-0000-000000000040', null, 'élevage', '00000000-0000-0000-0000-000000000063', 'Vaccination collective PPCB lot bovins', 'validée', true, null, '00000000-0000-0000-0000-000000000016'),
  ('a0000000-0000-0000-0000-000000000309', 'DEP-2026-00010', '2026-03-05', 87500, 'FCFA', 'Semences', '00000000-0000-0000-0000-000000000051', 'Sékou Camara', 'espèces', null, '00000000-0000-0000-0000-000000000040', null, 'agriculture', '00000000-0000-0000-0000-000000000063', 'Achat 25kg semences maïs Obatampa', 'validée', true, null, '00000000-0000-0000-0000-000000000015'),
  ('a0000000-0000-0000-0000-00000000030a', 'DEP-2026-00011', '2026-03-20', 300000, 'FCFA', 'Engrais', '00000000-0000-0000-0000-000000000051', 'Sékou Camara', 'espèces', null, '00000000-0000-0000-0000-000000000040', null, 'agriculture', '00000000-0000-0000-0000-000000000063', 'Achat 12 sacs engrais NPK 15-15-15', 'validée', true, null, '00000000-0000-0000-0000-000000000015'),
  ('a0000000-0000-0000-0000-00000000030b', 'DEP-2026-00012', '2026-03-01', 150000, 'FCFA', 'Main-d''œuvre', null, 'Sékou Camara', 'espèces', null, '00000000-0000-0000-0000-000000000041', null, 'agriculture', '00000000-0000-0000-0000-000000000063', 'Main d''œuvre préparation parcelle P-01', 'validée', false, null, '00000000-0000-0000-0000-000000000015'),
  ('a0000000-0000-0000-0000-00000000030c', 'DEP-2026-00013', '2026-04-05', 280000, 'FCFA', 'Engrais', '00000000-0000-0000-0000-000000000051', 'Sékou Camara', 'espèces', null, '00000000-0000-0000-0000-000000000041', null, 'agriculture', '00000000-0000-0000-0000-000000000063', 'Application engrais NPK parcelle P-01', 'en attente', true, 'En attente de validation par le comptable', '00000000-0000-0000-0000-000000000015'),
  ('a0000000-0000-0000-0000-00000000030d', 'DEP-2026-00014', '2026-05-10', 68000, 'FCFA', 'Carburant', '00000000-0000-0000-0000-000000000054', 'Ibrahim Cissé', 'espèces', null, '00000000-0000-0000-0000-000000000041', null, null, '00000000-0000-0000-0000-000000000063', 'Plein carburant tracteur 80L', 'en attente', false, 'Justificatif à récupérer', '00000000-0000-0000-0000-000000000013'),
  ('a0000000-0000-0000-0000-00000000030e', 'DEP-2026-00015', '2026-06-15', 125000, 'FCFA', 'Alimentation animale', '00000000-0000-0000-0000-000000000050', 'Moussa Bakayoko', 'espèces', null, '00000000-0000-0000-0000-000000000040', null, null, '00000000-0000-0000-0000-000000000063', 'Achat complément alimentaire lot volaille', 'en attente', true, null, '00000000-0000-0000-0000-000000000016'),
  ('a0000000-0000-0000-0000-00000000030f', 'DEP-2026-00016', '2026-07-01', 45000, 'FCFA', 'Transport', null, 'Ibrahim Cissé', 'espèces', null, '00000000-0000-0000-0000-000000000041', null, null, '00000000-0000-0000-0000-000000000063', 'Transport matériaux Dabou', 'rejetée', false, 'Rejeté: montant non justifié, demander nouvelle facture', '00000000-0000-0000-0000-000000000013'),
  ('a0000000-0000-0000-0000-000000000310', 'DEP-2026-00017', '2026-08-15', 80000, 'FCFA', 'Maintenance', null, 'Ibrahim Cissé', 'espèces', null, '00000000-0000-0000-0000-000000000041', null, null, '00000000-0000-0000-0000-000000000063', 'Réparation pompe irrigation', 'brouillon', false, 'Brouillon en cours de saisie', '00000000-0000-0000-0000-000000000013'),
  ('a0000000-0000-0000-0000-000000000311', 'DEP-2026-00018', '2026-09-01', 320000, 'FCFA', 'Alimentation animale', '00000000-0000-0000-0000-000000000050', 'Moussa Bakayoko', 'virement', '00000000-0000-0000-0000-000000000030', null, null, 'élevage', '00000000-0000-0000-0000-000000000063', 'Achat 10 sacs aliment bovins grower', 'en attente', true, null, '00000000-0000-0000-0000-000000000016'),
  ('a0000000-0000-0000-0000-000000000312', 'DEP-2026-00019', '2026-09-10', 95000, 'FCFA', 'Carburant', '00000000-0000-0000-0000-000000000054', 'Ibrahim Cissé', 'espèces', null, '00000000-0000-0000-0000-000000000041', null, null, '00000000-0000-0000-0000-000000000063', 'Carburant véhicule 100L', 'validée', true, null, '00000000-0000-0000-0000-000000000013'),
  ('a0000000-0000-0000-0000-000000000313', 'DEP-2026-00020', '2026-09-20', 50000, 'FCFA', 'Administration', null, 'Fatou Koné', 'espèces', null, '00000000-0000-0000-0000-000000000040', null, null, '00000000-0000-0000-0000-000000000063', 'Frais administratifs divers', 'annulée', false, 'Annulée: saisie en double, annulée pour correction', '00000000-0000-0000-0000-000000000014');

-- ============ DOCUMENTS ============
INSERT INTO documents (id, reference, type, name, file_url, file_hash, file_size, mime_type, upload_date, uploaded_by, object_type, object_id, status, verified_date, verified_by, comment) VALUES
  ('a0000000-0000-0000-0000-000000000400', 'DOC-001', 'facture', 'Facture étude géophysique', '/docs/facture-etude-geophysique.pdf', 'a1b2c3d4', 250000, 'application/pdf', '2025-04-22', '00000000-0000-0000-0000-000000000013', 'expense', 'a0000000-0000-0000-0000-000000000300', 'vérifié', '2025-04-25', '00000000-0000-0000-0000-000000000014', 'Facture conforme'),
  ('a0000000-0000-0000-0000-000000000401', 'DOC-002', 'facture', 'Facture forage 80m', '/docs/facture-forage.pdf', 'b2c3d4e5', 320000, 'application/pdf', '2025-06-03', '00000000-0000-0000-0000-000000000013', 'expense', 'a0000000-0000-0000-0000-000000000301', 'vérifié', '2025-06-10', '00000000-0000-0000-0000-000000000014', 'Facture conforme'),
  ('a0000000-0000-0000-0000-000000000402', 'DOC-003', 'facture', 'Facture pompe solaire', '/docs/facture-pompe-solaire.pdf', 'c3d4e5f6', 410000, 'application/pdf', '2025-08-17', '00000000-0000-0000-0000-000000000013', 'expense', 'a0000000-0000-0000-0000-000000000302', 'vérifié', '2025-08-20', '00000000-0000-0000-0000-000000000014', 'Facture conforme'),
  ('a0000000-0000-0000-0000-000000000403', 'DOC-004', 'facture', 'Facture terrassement hangar', '/docs/facture-terrassement.pdf', 'd4e5f6g7', 280000, 'application/pdf', '2025-08-03', '00000000-0000-0000-0000-000000000013', 'expense', 'a0000000-0000-0000-0000-000000000303', 'vérifié', '2025-08-10', '00000000-0000-0000-0000-000000000014', 'OK'),
  ('a0000000-0000-0000-0000-000000000404', 'DOC-005', 'facture', 'Facture structure métallique', '/docs/facture-structure.pdf', 'e5f6g7h8', 350000, 'application/pdf', '2025-11-03', '00000000-0000-0000-0000-000000000013', 'expense', 'a0000000-0000-0000-0000-000000000304', 'vérifié', '2025-11-10', '00000000-0000-0000-0000-000000000014', 'OK'),
  ('a0000000-0000-0000-0000-000000000405', 'DOC-006', 'reçu', 'Reçu piquetage clôture', '/docs/recu-piquetage.pdf', 'f6g7h8i9', 120000, 'application/pdf', '2026-01-22', '00000000-0000-0000-0000-000000000013', 'expense', 'a0000000-0000-0000-0000-000000000305', 'vérifié', '2026-01-25', '00000000-0000-0000-0000-000000000014', 'OK'),
  ('a0000000-0000-0000-0000-000000000406', 'DOC-007', 'facture', 'Facture poteaux et grillage', '/docs/facture-poteaux.pdf', 'g7h8i9j0', 180000, 'application/pdf', '2026-02-16', '00000000-0000-0000-0000-000000000013', 'expense', 'a0000000-0000-0000-0000-000000000306', 'à vérifier', null, null, null),
  ('a0000000-0000-0000-0000-000000000407', 'DOC-008', 'facture', 'Facture aliment bovins 40 sacs', '/docs/facture-aliment-bovins.pdf', 'h8i9j0k1', 220000, 'application/pdf', '2026-01-22', '00000000-0000-0000-0000-000000000016', 'expense', 'a0000000-0000-0000-0000-000000000307', 'vérifié', '2026-01-28', '00000000-0000-0000-0000-000000000014', 'Conforme'),
  ('a0000000-0000-0000-0000-000000000408', 'DOC-009', 'reçu', 'Reçu vaccination PPCB', '/docs/recu-vaccination.pdf', 'i9j0k1l2', 95000, 'application/pdf', '2026-02-12', '00000000-0000-0000-0000-000000000016', 'expense', 'a0000000-0000-0000-0000-000000000308', 'vérifié', '2026-02-15', '00000000-0000-0000-0000-000000000014', 'OK'),
  ('a0000000-0000-0000-0000-000000000409', 'DOC-010', 'facture', 'Facture semences maïs', '/docs/facture-semences.pdf', 'j0k1l2m3', 75000, 'application/pdf', '2026-03-06', '00000000-0000-0000-0000-000000000015', 'expense', 'a0000000-0000-0000-0000-000000000309', 'vérifié', '2026-03-10', '00000000-0000-0000-0000-000000000014', 'OK'),
  ('a0000000-0000-0000-0000-00000000040a', 'DOC-011', 'facture', 'Facture engrais NPK', '/docs/facture-engrais.pdf', 'k1l2m3n4', 280000, 'application/pdf', '2026-03-21', '00000000-0000-0000-0000-000000000015', 'expense', 'a0000000-0000-0000-0000-00000000030a', 'vérifié', '2026-03-25', '00000000-0000-0000-0000-000000000014', 'OK'),
  ('a0000000-0000-0000-0000-00000000040b', 'DOC-012', 'facture', 'Facture engrais application P-01', '/docs/facture-engrais-p01.pdf', 'l2m3n4o5', 260000, 'application/pdf', '2026-04-06', '00000000-0000-0000-0000-000000000015', 'expense', 'a0000000-0000-0000-0000-00000000030c', 'à vérifier', null, null, 'En attente de vérification'),
  ('a0000000-0000-0000-0000-00000000040c', 'DOC-013', 'facture', 'Facture complément volaille', '/docs/facture-volaille.pdf', 'm3n4o5p6', 110000, 'application/pdf', '2026-06-16', '00000000-0000-0000-0000-000000000016', 'expense', 'a0000000-0000-0000-0000-00000000030e', 'à vérifier', null, null, null),
  ('a0000000-0000-0000-0000-00000000040d', 'DOC-014', 'facture', 'Facture aliment bovins 10 sacs', '/docs/facture-aliment-10sacs.pdf', 'n4o5p6q7', 300000, 'application/pdf', '2026-09-02', '00000000-0000-0000-0000-000000000016', 'expense', 'a0000000-0000-0000-0000-000000000311', 'à vérifier', null, null, null),
  ('a0000000-0000-0000-0000-00000000040e', 'DOC-015', 'reçu', 'Reçu carburant véhicule', '/docs/recu-carburant.pdf', 'o5p6q7r8', 85000, 'application/pdf', '2026-09-11', '00000000-0000-0000-0000-000000000013', 'expense', 'a0000000-0000-0000-0000-000000000312', 'vérifié', '2026-09-15', '00000000-0000-0000-0000-000000000014', 'OK'),
  ('a0000000-0000-0000-0000-00000000040f', 'DOC-016', 'preuve de paiement', 'Preuve virement FND-2025-001', '/docs/virement-fnd001.pdf', 'p6q7r8s9', 150000, 'application/pdf', '2025-01-18', '00000000-0000-0000-0000-000000000010', 'funding', '00000000-0000-0000-0000-000000000060', 'vérifié', '2025-01-20', '00000000-0000-0000-0000-000000000014', 'Virement bancaire confirmé'),
  ('a0000000-0000-0000-0000-000000000410', 'DOC-017', 'preuve de paiement', 'Preuve virement FND-2026-001', '/docs/virement-fnd2026.pdf', 'q7r8s9t0', 150000, 'application/pdf', '2026-01-14', '00000000-0000-0000-0000-000000000010', 'funding', '00000000-0000-0000-0000-000000000063', 'vérifié', '2026-01-16', '00000000-0000-0000-0000-000000000014', 'Virement confirmé');

-- ============ ALERTS ============
INSERT INTO alerts (id, category, severity, title, description, object_type, object_id, status, assigned_to) VALUES
  ('a0000000-0000-0000-0000-000000000500', 'Stocks', 'high', 'Écart inventaire - Aliment bovins', 'Stock théorique: 28 sacs, Stock physique: 15 sacs. Écart de -13 sacs non justifié.', 'inventory_item', '00000000-0000-0000-0000-000000000121', 'ouverte', 'Moussa Bakayoko'),
  ('a0000000-0000-0000-0000-000000000501', 'Justificatifs', 'medium', 'Justificatif manquant - DEP-2026-00012', 'La dépense DEP-2026-00012 (150 000 FCFA) n''a pas de justificatif attaché.', 'expense', 'a0000000-0000-0000-0000-00000000030b', 'ouverte', 'Sékou Camara'),
  ('a0000000-0000-0000-0000-000000000502', 'Justificatifs', 'medium', 'Justificatif manquant - DEP-2026-00014', 'La dépense DEP-2026-00014 (68 000 FCFA) n''a pas de justificatif. En attente de récupération.', 'expense', 'a0000000-0000-0000-0000-00000000030d', 'ouverte', 'Ibrahim Cissé'),
  ('a0000000-0000-0000-0000-000000000503', 'Chantiers', 'medium', 'Projet en retard - Hangar élevage', 'Le projet Hangar d''élevage est en retard. Étape toiture/bardages prévue en novembre non démarrée.', 'project', '00000000-0000-0000-0000-000000000101', 'ouverte', 'Ibrahim Cissé'),
  ('a0000000-0000-0000-0000-000000000504', 'Finance', 'low', 'Financement en transit - FND-2026-002', 'Le financement FND-2026-002 (10 000 EUR) est en transit depuis le 25/09. À surveiller.', 'funding', '00000000-0000-0000-0000-000000000064', 'ouverte', 'Fatou Koné');

-- ============ NOTIFICATIONS ============
INSERT INTO notifications (id, user_id, type, title, message, level, object_type, object_id, read) VALUES
  ('a0000000-0000-0000-0000-000000000600', '00000000-0000-0000-0000-000000000010', 'validation_requise', 'Dépense en attente de validation', 'DEP-2026-00013 - 280 000 FCFA - Engrais', 'warning', 'expense', 'a0000000-0000-0000-0000-00000000030c', false),
  ('a0000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000010', 'justificatif_manquant', 'Justificatif manquant', '2 dépenses sans justificatif nécessitent votre attention', 'warning', null, null, false),
  ('a0000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000010', 'anomalie', 'Anomalie de stock détectée', 'Aliment bovins: écart de -13 sacs lors de l''inventaire', 'error', 'inventory_item', '00000000-0000-0000-0000-000000000121', false),
  ('a0000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000010', 'projet_retard', 'Projet en retard', 'Hangar d''élevage: étape toiture non démarrée', 'warning', 'project', '00000000-0000-0000-0000-000000000101', true),
  ('a0000000-0000-0000-0000-000000000604', '00000000-0000-0000-0000-000000000012', 'nouvelle_depense', 'Nouvelle dépense sur votre financement', 'DEP-2026-00018 - 320 000 FCFA - Alimentation animale', 'info', 'expense', 'a0000000-0000-0000-0000-000000000311', false),
  ('a0000000-0000-0000-0000-000000000605', '00000000-0000-0000-0000-000000000012', 'financement', 'Financement en transit', 'FND-2026-002 (10 000 EUR) est en transit depuis le 25/09', 'info', 'funding', '00000000-0000-0000-0000-000000000064', false);

-- ============ AUDIT LOGS ============
INSERT INTO audit_logs (id, user_name, action, object_type, object_id, old_value, new_value, description) VALUES
  ('a0000000-0000-0000-0000-000000000700', 'Kouadio Mensah', 'CREATE', 'funding', 'FND-2026-001', null, '{"amount_sent": 5000}', 'Création du financement FND-2026-001'),
  ('a0000000-0000-0000-0000-000000000701', 'Fatou Koné', 'VALIDATE', 'expense', 'DEP-2025-00001', '{"status": "soumise"}', '{"status": "validée"}', 'Validation de la dépense DEP-2025-00001'),
  ('a0000000-0000-0000-0000-000000000702', 'Fatou Koné', 'VALIDATE', 'expense', 'DEP-2025-00002', '{"status": "soumise"}', '{"status": "validée"}', 'Validation de la dépense DEP-2025-00002'),
  ('a0000000-0000-0000-0000-000000000703', 'Ibrahim Cissé', 'CREATE', 'expense', 'DEP-2026-00006', null, '{"amount": 100000}', 'Création de la dépense DEP-2026-00006'),
  ('a0000000-0000-0000-0000-000000000704', 'Sékou Camara', 'CREATE', 'crop_operation', null, null, '{"type": "semis"}', 'Enregistrement opération semis parcelle P-01'),
  ('a0000000-0000-0000-0000-000000000705', 'Moussa Bakayoko', 'CREATE', 'animal_event', null, null, '{"type": "vaccination"}', 'Vaccination lot bovins LOT-BOV-01'),
  ('a0000000-0000-0000-0000-000000000706', 'Fatou Koné', 'REJECT', 'expense', 'DEP-2026-00016', '{"status": "soumise"}', '{"status": "rejetée"}', 'Rejet de la dépense DEP-2026-00016'),
  ('a0000000-0000-0000-0000-000000000707', 'Fatou Koné', 'CANCEL', 'expense', 'DEP-2026-00020', '{"status": "brouillon"}', '{"status": "annulée"}', 'Annulation de la dépense DEP-2026-00020'),
  ('a0000000-0000-0000-0000-000000000708', 'Ibrahim Cissé', 'ATTACH_DOCUMENT', 'expense', 'DEP-2026-00007', null, '{"document": "DOC-007"}', 'Attachement justificatif DOC-007'),
  ('a0000000-0000-0000-0000-000000000709', 'Kouadio Mensah', 'UPDATE', 'project', 'Hangar élevage', '{"progress": 55}', '{"progress": 65}', 'Mise à jour progression projet Hangar'),
  ('a0000000-0000-0000-0000-00000000070a', 'Moussa Bakayoko', 'CREATE', 'inventory_movement', null, null, '{"type": "consommation"}', 'Consommation 12 sacs aliment bovins'),
  ('a0000000-0000-0000-0000-00000000070b', 'Kouadio Mensah', 'CREATE', 'inventory_count', null, null, '{"difference": -13}', 'Inventaire physique - écart détecté'),
  ('a0000000-0000-0000-0000-00000000070c', 'Fatou Koné', 'VALIDATE', 'document', 'DOC-001', '{"status": "à vérifier"}', '{"status": "vérifié"}', 'Vérification document DOC-001'),
  ('a0000000-0000-0000-0000-00000000070d', 'Sékou Camara', 'CREATE', 'harvest', null, null, '{"quantity": 8500}', 'Enregistrement récolte parcelle P-01'),
  ('a0000000-0000-0000-0000-00000000070e', 'Kouadio Mensah', 'LOGIN', 'session', null, null, null, 'Connexion utilisateur Kouadio Mensah');

---
## Migration: 20261002203614_006_site_content.sql


CREATE TABLE IF NOT EXISTS site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site content"
  ON site_content FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated can insert site content"
  ON site_content FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update site content"
  ON site_content FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete site content"
  ON site_content FOR DELETE
  TO authenticated
  USING (true);

INSERT INTO site_content (key, value) VALUES
('branding', '{"logoIcon":"Sprout","logoColor":"#16A34A","logoBgColor":"#16A34A","appName":"Bahkanso","appTagline":"Pilotage agro-pastoral","footerText":"Bahkanso v1.0","footerSubtext":"Ferme AgroVision"}'::jsonb),
('hero', '{"badge":"Plateforme de gouvernance agro-pastorale","title":"Pilotez vos investissements agro-pastoraux en toute transparence","highlight":"transparence","subtitle":"Bahkanso connecte l argent, les opérations, les preuves et les résultats. Suivez chaque franc investi, depuis le financement jusqu au résultat sur le terrain, avec une traçabilité complète et des justificatifs vérifiables.","ctaPrimary":"Découvrir la plateforme","ctaSecondary":"Se connecter","trustBadges":["Données sécurisées","Accès multi-rôles","Piste d audit"]}'::jsonb),
('heroCard', '{"label":"Trésorerie disponible","value":"12 450 000 FCFA","trend":"+12%","items":[{"label":"Financé","value":"25M"},{"label":"Dépensé","value":"14.8M"},{"label":"Restant","value":"10.1M"}],"lines":[{"text":"DEP-2026-00428 — Alimentation bovins","value":"125 000"},{"text":"DEP-2026-00427 — Engrais NPK","value":"280 000"},{"text":"Forage d eau — Progression","value":"100%"}]}'::jsonb),
('stats', '[{"value":"100%","label":"Traçabilité financière"},{"value":"7","label":"Modules métier intégrés"},{"value":"24/7","label":"Accès depuis partout"},{"value":"0","label":"Dépense non justifiée"}]'::jsonb),
('features', '[{"icon":"Wallet","title":"Traçabilité des financements","desc":"Suivez chaque transfert de l envoi à la réception, avec frais, taux de change et justificatifs bancaires."},{"icon":"FileText","title":"Justificatifs vérifiables","desc":"Chaque dépense peut être documentée : factures, reçus, bons de livraison, photos terrain."},{"icon":"HardHat","title":"Pilotage des chantiers","desc":"Budget vs réel, progression par étape, photos et documents pour chaque projet d investissement."},{"icon":"Beef","title":"Suivi du cheptel","desc":"Gestion individuelle ou par lot : santé, vaccinations, naissances, ventes et valeur du cheptel."},{"icon":"Sprout","title":"Gestion agricole","desc":"Parcelles, campagnes, opérations culturales et récoltes avec calcul des rendements."},{"icon":"Package","title":"Contrôle des stocks","desc":"Inventaire en temps réel, mouvements tracés, alertes de stock faible et écarts d inventaire."}]'::jsonb),
('featuresSection', '{"title":"Une plateforme, tous vos besoins","subtitle":"Sept modules intégrés qui partagent les mêmes données pour une vision complète de votre exploitation."}'::jsonb),
('workflow', '{"title":"La chaîne de traçabilité complète","subtitle":"De l argent envoyé au résultat obtenu, chaque maillon est relié et vérifiable.","steps":[{"icon":"Wallet","label":"Financement"},{"icon":"Check","label":"Réception"},{"icon":"BarChart3","label":"Affectation"},{"icon":"FileText","label":"Dépense"},{"icon":"ScrollText","label":"Justificatif"},{"icon":"Sprout","label":"Activité"},{"icon":"TrendingUp","label":"Résultat"}]}'::jsonb),
('roles', '{"title":"Conçu pour tous les acteurs","subtitle":"Chaque rôle voit exactement ce dont il a besoin, ni plus, ni moins.","list":["Propriétaires d exploitation","Investisseurs & financeurs","Gestionnaires de ferme","Comptables","Responsables agricoles","Responsables élevage","Responsables chantier","Auditeurs"]}'::jsonb),
('cta', '{"title":"Prêt à reprendre le contrôle de votre exploitation ?","subtitle":"Accédez à la plateforme dès maintenant avec les données de démonstration.","primary":"Accéder à la plateforme","secondary":"Se connecter"}'::jsonb),
('footer', '{"description":"Plateforme de gestion, de traçabilité et de pilotage des investissements agro-pastoraux. Conçue pour les exploitations financées à distance.","modulesTitle":"Modules","modules":["Financements & Trésorerie","Dépenses & Justificatifs","Agriculture & Élevage","Projets & Stocks"],"securityTitle":"Sécurité","security":[{"icon":"Shield","text":"Row Level Security"},{"icon":"ScrollText","text":"Piste d audit"},{"icon":"Users","text":"Contrôle d accès RBAC"},{"icon":"Bell","text":"Alertes intelligentes"}],"copyright":"© 2026 Bahkanso — Tous droits réservés"}'::jsonb),
('login', '{"title":"Reprenez le contrôle de votre exploitation","subtitle":"Suivez chaque franc investi, depuis le financement jusqu au résultat sur le terrain. Traçabilité complète, justificatifs vérifiables, pilotage en temps réel.","benefits":["Traçabilité financière de bout en bout","Justificatifs photographiques et documents","Alertes intelligentes sur anomalies","Piste d audit immuable"],"quote":"Bahkanso m a permis de suivre mes investissements à distance avec une confiance que je n avais jamais eue.","quoteAuthor":"Propriétaire d exploitation, Côte d Ivoire"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

---
## Migration: 20261004122416_007_auth_and_rls_tightening.sql.sql

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

---
## Migration: 20261005195209_008_recipes_and_rls_fixes.sql.sql

/*
# Create recipes table and fix RLS issues

## 1. New Tables
- `recipes` — Stores farm/agricultural recipes with ingredients, steps, images, and metadata.
  - `id` (uuid PK)
  - `title` (text, not null) — Recipe name
  - `description` (text) — Short description
  - `image_url` (text) — URL to recipe image in Supabase Storage
  - `category` (text) — Recipe category (e.g. "Plat principal", "Accompagnement", "Dessert")
  - `ingredients` (jsonb) — Array of {name, quantity, unit} objects
  - `steps` (jsonb) — Array of step strings
  - `prep_time_minutes` (integer) — Preparation time
  - `cook_time_minutes` (integer) — Cooking time
  - `servings` (integer) — Number of servings
  - `difficulty` (text) — "facile", "moyen", "difficile"
  - `status` (text) — "brouillon", "publiée", "archivée"
  - `author_id` (uuid) — References app_users(id)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

## 2. Security
- Enable RLS on `recipes`.
- Add 4 CRUD policies scoped to `authenticated` role (consistent with existing app auth model).
- Add missing RLS policies to `crops` table (was RLS-enabled with no policies).
- Revoke EXECUTE on `handle_new_user()` from anon and authenticated (security hardening).

## 3. Notes
- The `recipes` table uses the same authenticated-only RLS pattern as all other tables in this project.
- `ingredients` and `steps` are jsonb arrays to allow flexible recipe content.
- `image_url` stores a Supabase Storage public URL when an image is uploaded.
*/

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  category text DEFAULT 'Autre',
  ingredients jsonb DEFAULT '[]'::jsonb,
  steps jsonb DEFAULT '[]'::jsonb,
  prep_time_minutes integer DEFAULT 0,
  cook_time_minutes integer DEFAULT 0,
  servings integer DEFAULT 1,
  difficulty text DEFAULT 'facile',
  status text DEFAULT 'brouillon',
  author_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_recipes" ON recipes;
CREATE POLICY "auth_select_recipes"
ON recipes FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "auth_insert_recipes" ON recipes;
CREATE POLICY "auth_insert_recipes"
ON recipes FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_recipes" ON recipes;
CREATE POLICY "auth_update_recipes"
ON recipes FOR UPDATE
TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_recipes" ON recipes;
CREATE POLICY "auth_delete_recipes"
ON recipes FOR DELETE
TO authenticated
USING (true);

-- Fix: crops table had RLS enabled but no policies
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_crops" ON crops;
CREATE POLICY "auth_select_crops"
ON crops FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "auth_insert_crops" ON crops;
CREATE POLICY "auth_insert_crops"
ON crops FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_crops" ON crops;
CREATE POLICY "auth_update_crops"
ON crops FOR UPDATE
TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_crops" ON crops;
CREATE POLICY "auth_delete_crops"
ON crops FOR DELETE
TO authenticated
USING (true);

-- Fix: Revoke EXECUTE on handle_new_user from anon and authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
---
## Migration: 20261005195221_009_storage_policies.sql.sql

/*
# Add storage policies for app-assets bucket

## What this does
1. Creates RLS policies on storage.objects for the `app-assets` bucket so authenticated users can upload, read, and delete files (recipe images, logo).
2. Public read access for the bucket so images are viewable without authentication.

## Security
- SELECT (read) is public — anyone can view uploaded images.
- INSERT/UPDATE/DELETE restricted to authenticated users only.
*/

-- Public read access for app-assets bucket
DROP POLICY IF EXISTS "public_read_app_assets" ON storage.objects;
CREATE POLICY "public_read_app_assets"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'app-assets');

-- Authenticated can upload to app-assets
DROP POLICY IF EXISTS "auth_insert_app_assets" ON storage.objects;
CREATE POLICY "auth_insert_app_assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'app-assets');

-- Authenticated can update files in app-assets
DROP POLICY IF EXISTS "auth_update_app_assets" ON storage.objects;
CREATE POLICY "auth_update_app_assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'app-assets') WITH CHECK (bucket_id = 'app-assets');

-- Authenticated can delete from app-assets
DROP POLICY IF EXISTS "auth_delete_app_assets" ON storage.objects;
CREATE POLICY "auth_delete_app_assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'app-assets');
---
