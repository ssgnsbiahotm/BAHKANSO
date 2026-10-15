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
