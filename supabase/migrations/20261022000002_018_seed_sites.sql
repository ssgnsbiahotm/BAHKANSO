/*
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