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
LEFT JOIN sites s ON s.id = e.site_id;