/*
# Bahkanso — Migration 016 : Multi-sites & Répartition Financements

## Objectifs
1. Étendre la table `sites` existante avec farm_id, code, status
2. Ajouter site_id (FK vers sites) sur les tables métier pour le cloisonnement par site
3. Créer funding_allocations pour répartir un financement sur plusieurs sites
4. Index de performance + RLS de base (policies "authenticated" pour l'instant)
*/

-- =============================================
-- 1. EXTENSION DE LA TABLE SITES EXISTANTE
-- =============================================

-- Ajout des colonnes manquantes sur sites (la table existe déjà depuis 002)
ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS farm_id uuid REFERENCES farms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'actif';

-- Index sur farm_id pour les requêtes par exploitation
CREATE INDEX IF NOT EXISTS idx_sites_farm ON sites(farm_id);

-- =============================================
-- 2. AJOUT DE site_id SUR LES TABLES MÉTIER
-- =============================================

-- app_users : NULL = accès global (admin), sinon limité au site
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES sites(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_app_users_site ON app_users(site_id);

-- expenses : chaque dépense rattachée à un site
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES sites(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_site ON expenses(site_id);

-- projects : chaque chantier appartient à un site
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES sites(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_projects_site ON projects(site_id);

-- campaigns : chaque campagne agricole sur un site
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES sites(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_campaigns_site ON campaigns(site_id);

-- animal_lots : chaque lot d'animaux sur un site
ALTER TABLE animal_lots
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES sites(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_animal_lots_site ON animal_lots(site_id);

-- =============================================
-- 3. TABLE DE RÉPARTITION DES FINANCEMENTS PAR SITE
-- =============================================

CREATE TABLE IF NOT EXISTS funding_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funding_id uuid NOT NULL REFERENCES fundings(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  amount_fcfa numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (funding_id, site_id)
);

ALTER TABLE funding_allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_funding_allocations" ON funding_allocations;
CREATE POLICY "auth_select_funding_allocations" ON funding_allocations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_funding_allocations" ON funding_allocations
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_funding_allocations" ON funding_allocations
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_funding_allocations" ON funding_allocations
  FOR DELETE TO authenticated USING (true);

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_funding_allocations_funding ON funding_allocations(funding_id);
CREATE INDEX IF NOT EXISTS idx_funding_allocations_site ON funding_allocations(site_id);

-- =============================================
-- 4. MISE À JOUR RLS SUR SITES (policies authenticated)
-- =============================================

-- Les policies "anon" existent déjà (002), on ajoute/sécurise pour authenticated
DROP POLICY IF EXISTS "auth_select_sites" ON sites;
DROP POLICY IF EXISTS "auth_insert_sites" ON sites;
DROP POLICY IF EXISTS "auth_update_sites" ON sites;
DROP POLICY IF EXISTS "auth_delete_sites" ON sites;

CREATE POLICY "auth_select_sites" ON sites FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_sites" ON sites FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_sites" ON sites FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_sites" ON sites FOR DELETE TO authenticated USING (true);

-- =============================================
-- 5. VUES UTILES (optionnel, pour facilité de lecture)
-- =============================================

-- Vue : financement détaillé par site
CREATE OR REPLACE VIEW v_funding_by_site AS
SELECT
  f.id AS funding_id,
  f.reference AS funding_ref,
  f.amount_received,
  f.date_received,
  fa.site_id,
  s.name AS site_name,
  s.code AS site_code,
  fa.amount_fcfa AS allocated_amount
FROM fundings f
JOIN funding_allocations fa ON fa.funding_id = f.id
JOIN sites s ON s.id = fa.site_id;

-- Vue : dépenses par site
CREATE OR REPLACE VIEW v_expenses_by_site AS
SELECT
  e.id,
  e.reference,
  e.date,
  e.amount,
  e.currency,
  e.category,
  e.site_id,
  s.name AS site_name,
  s.code AS site_code
FROM expenses e
LEFT JOIN sites s ON s.id = e.site_id;/*
# Bahkanso — Migration 017 : Module Ventes

## Objectifs
1. Table customers (clients) rattachée à un site
2. Table sales (ventes) avec référence auto-générée VTE-YYYY-NNNNN
3. Table sale_items (lignes de vente) polymorphes (récolte, animal, lot, stock)
4. Trigger pour la référence VTE-YYYY-NNNNN (pattern DEP-YYYY-NNNNN existant)
5. RLS sur les 3 tables
*/

-- =============================================
-- 1. TABLE CUSTOMERS (CLIENTS)
-- =============================================

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites(id) ON DELETE SET NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'particulier',
  phone text,
  email text,
  total_purchases numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_customers" ON customers;
CREATE POLICY "auth_select_customers" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_customers" ON customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_customers" ON customers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_customers" ON customers FOR DELETE TO authenticated USING (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_customers_site ON customers(site_id);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);

-- =============================================
-- 2. TABLE SALES (VENTES)
-- =============================================

CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE,
  site_id uuid REFERENCES sites(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text DEFAULT 'espèces',
  bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE SET NULL,
  cash_account_id uuid REFERENCES cash_accounts(id) ON DELETE SET NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'payée',
  comment text,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_sales" ON sales;
CREATE POLICY "auth_select_sales" ON sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_sales" ON sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_sales" ON sales FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_sales" ON sales FOR DELETE TO authenticated USING (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_sales_site ON sales(site_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_bank_account ON sales(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_sales_cash_account ON sales(cash_account_id);

-- =============================================
-- 3. TABLE SALE_ITEMS (LIGNES DE VENTE)
-- =============================================

CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  source_type text NOT NULL, -- 'harvest' | 'animal' | 'animal_lot' | 'inventory_item'
  source_id uuid NOT NULL,
  description text,
  quantity numeric NOT NULL DEFAULT 1,
  unit text DEFAULT 'unité',
  unit_price numeric NOT NULL DEFAULT 0,
  total numeric GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_sale_items" ON sale_items;
CREATE POLICY "auth_select_sale_items" ON sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_sale_items" ON sale_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_sale_items" ON sale_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_sale_items" ON sale_items FOR DELETE TO authenticated USING (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_source ON sale_items(source_type, source_id);

-- =============================================
-- 4. TRIGGER : AUTO-GÉNÉRATION RÉFÉRENCE VTE-YYYY-NNNNN
-- =============================================

CREATE OR REPLACE FUNCTION generate_sale_reference()
RETURNS text AS $$
DECLARE
  current_year int := extract(year from now());
  seq_num int;
  ref text;
BEGIN
  SELECT count(*) + 1 INTO seq_num
  FROM sales
  WHERE extract(year from date) = current_year;
  ref := 'VTE-' || current_year || '-' || lpad(seq_num::text, 5, '0');
  RETURN ref;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = 'public';

-- Trigger BEFORE INSERT sur sales
DROP TRIGGER IF EXISTS trigger_sales_generate_reference ON sales;
CREATE TRIGGER trigger_sales_generate_reference
  BEFORE INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION generate_sale_reference();

-- =============================================
-- 5. VUES UTILES
-- =============================================

-- Vue : ventes détaillées par site
CREATE OR REPLACE VIEW v_sales_by_site AS
SELECT
  s.id,
  s.reference,
  s.date,
  s.site_id,
  si.name AS site_name,
  si.code AS site_code,
  c.name AS customer_name,
  c.type AS customer_type,
  s.total_amount,
  s.payment_method,
  s.status
FROM sales s
LEFT JOIN sites si ON si.id = s.site_id
LEFT JOIN customers c ON c.id = s.customer_id;

-- Vue : lignes de vente avec source
CREATE OR REPLACE VIEW v_sale_items_detail AS
SELECT
  si.id,
  si.sale_id,
  s.reference AS sale_ref,
  s.date AS sale_date,
  si.source_type,
  si.source_id,
  si.description,
  si.quantity,
  si.unit,
  si.unit_price,
  si.total
FROM sale_items si
JOIN sales s ON s.id = si.sale_id;

-- =============================================
-- 6. MISE À JOUR TOTAL_PURCHASES CLIENTS (trigger optionnel)
-- =============================================

CREATE OR REPLACE FUNCTION update_customer_total_purchases()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE customers
    SET total_purchases = total_purchases + NEW.total_amount,
        updated_at = now()
    WHERE id = NEW.customer_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE customers
    SET total_purchases = total_purchases - OLD.total_amount,
        updated_at = now()
    WHERE id = OLD.customer_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE customers
    SET total_purchases = total_purchases - OLD.total_amount + NEW.total_amount,
        updated_at = now()
    WHERE id = NEW.customer_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = 'public';

DROP TRIGGER IF EXISTS trigger_sales_update_customer_total ON sales;
CREATE TRIGGER trigger_sales_update_customer_total
  AFTER INSERT OR UPDATE OR DELETE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_total_purchases();/*
# Bahkanso — Migration 018 : Données de démo (5 sites, clients, ventes)

## Objectifs
1. Insérer 5 sites de démonstration avec UUIDs fixes
2. Rattacher les données existantes au site "Katadji" par défaut
3. Créer 3 clients de démo sur Katadji
4. Insérer 2 ventes de démo avec leurs lignes
*/

-- =============================================
-- 1. INSERTION DES 5 SITES (UUIDs FIXES)
-- =============================================

INSERT INTO sites (id, name, location, area_hectares, responsible, farm_id, code, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Katadji', 'Dabou, Côte d''Ivoire', 150, 'Gestionnaire principal', NULL, 'KAT', 'actif'),
  ('22222222-2222-2222-2222-222222222222', 'Aheremou', 'Aheremou, Côte d''Ivoire', 80, 'Responsable Aheremou', NULL, 'AHE', 'actif'),
  ('33333333-3333-3333-3333-333333333333', 'Braffoueby', 'Braffoueby, Côte d''Ivoire', 120, 'Responsable Braffoueby', NULL, 'BRA', 'actif'),
  ('44444444-4444-4444-4444-444444444444', 'Abidjan', 'Abidjan, Côte d''Ivoire', 50, 'Responsable Abidjan', NULL, 'ABJ', 'actif'),
  ('55555555-5555-5555-5555-555555555555', 'Grd-Bassam', 'Grand-Bassam, Côte d''Ivoire', 60, 'Responsable Grand-Bassam', NULL, 'GBA', 'actif')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  area_hectares = EXCLUDED.area_hectares,
  responsible = EXCLUDED.responsible,
  code = EXCLUDED.code,
  status = EXCLUDED.status;

-- =============================================
-- 2. RATTACHER DONNÉES EXISTANTES À KATADJI
-- =============================================

UPDATE app_users SET site_id = '11111111-1111-1111-1111-111111111111' WHERE site_id IS NULL;
UPDATE expenses SET site_id = '11111111-1111-1111-1111-111111111111' WHERE site_id IS NULL;
UPDATE projects SET site_id = '11111111-1111-1111-1111-111111111111' WHERE site_id IS NULL;
UPDATE campaigns SET site_id = '11111111-1111-1111-1111-111111111111' WHERE site_id IS NULL;
UPDATE animal_lots SET site_id = '11111111-1111-1111-1111-111111111111' WHERE site_id IS NULL;

-- =============================================
-- 3. CRÉER 3 CLIENTS DE DÉMO (SITE KATADJI)
-- =============================================

INSERT INTO customers (id, site_id, name, type, phone, email, total_purchases) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Marché de Dabou', 'particulier', '+225 07 00 00 00 01', 'marche.dabou@example.com', 0),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Restaurant Le Palmier', 'professionnel', '+225 07 00 00 00 02', 'resto.palmier@example.com', 0),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Exportateur Abidjan', 'professionnel', '+225 07 00 00 00 03', 'export.abidjan@example.com', 0)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email;

-- =============================================
-- 4. INSERTION DE 2 VENTES DE DÉMO AVEC LIGNES
-- =============================================

-- Vente 1 : 15 poulets à 3000 FCFA (client: Marché de Dabou)
-- La référence sera auto-générée par le trigger (VTE-YYYY-NNNNN)
INSERT INTO sales (id, site_id, customer_id, date, payment_method, total_amount, status, comment, created_by) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE, 'espèces', 45000, 'payée', 'Vente de 15 poulets', NULL),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE, 'virement', 125000, 'payée', 'Vente de 500kg maïs', NULL);

-- Lignes de vente pour la vente 1 (poulets - source_type: animal_lot)
INSERT INTO sale_items (id, sale_id, source_type, source_id, description, quantity, unit, unit_price) VALUES
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'animal_lot', '11111111-1111-1111-1111-111111111111', 'Poulets de chair', 15, 'unité', 3000);

-- Lignes de vente pour la vente 2 (maïs - source_type: harvest)
INSERT INTO sale_items (id, sale_id, source_type, source_id, description, quantity, unit, unit_price) VALUES
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'harvest', '22222222-2222-2222-2222-222222222222', 'Maïs grain', 500, 'kg', 250);