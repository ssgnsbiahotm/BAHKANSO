/*
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
RETURNS trigger AS $$
DECLARE
  current_year int := extract(year from now());
  seq_num int;
BEGIN
  SELECT count(*) + 1 INTO seq_num
  FROM sales
  WHERE extract(year from date) = current_year;
  NEW.reference := 'VTE-' || current_year || '-' || lpad(seq_num::text, 5, '0');
  RETURN NEW;
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
  EXECUTE FUNCTION update_customer_total_purchases();