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
