-- Migration 028 : site_id sur animal_lots, animals, media
-- Appliquée manuellement via Supabase Dashboard le 28/10/2026
-- Objectif : permettre le filtrage par site sur tout le module Élevage

-- 1. animal_lots
ALTER TABLE animal_lots 
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES sites(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_animal_lots_site ON animal_lots(site_id);

-- 2. animals
ALTER TABLE animals 
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES sites(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_animals_site ON animals(site_id);

-- 3. media (si la table existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media') THEN
    ALTER TABLE media ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES sites(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_media_site ON media(site_id);
  END IF;
END $$;

-- 4. Trigger : cohérence campaigns.site_id = plots.site_id
CREATE OR REPLACE FUNCTION sync_campaign_site_id() RETURNS trigger AS $$
BEGIN
  IF NEW.plot_id IS NOT NULL THEN
    SELECT site_id INTO NEW.site_id FROM plots WHERE id = NEW.plot_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_campaign_site_sync ON campaigns;
CREATE TRIGGER trg_campaign_site_sync
  BEFORE INSERT OR UPDATE OF plot_id ON campaigns
  FOR EACH ROW EXECUTE FUNCTION sync_campaign_site_id();

-- 5. Trigger : cohérence animals.site_id = animal_lots.site_id
CREATE OR REPLACE FUNCTION sync_animal_site_id() RETURNS trigger AS $$
BEGIN
  IF NEW.lot_id IS NOT NULL AND NEW.site_id IS NULL THEN
    SELECT site_id INTO NEW.site_id FROM animal_lots WHERE id = NEW.lot_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_animal_site_sync ON animals;
CREATE TRIGGER trg_animal_site_sync
  BEFORE INSERT OR UPDATE OF lot_id ON animals
  FOR EACH ROW EXECUTE FUNCTION sync_animal_site_id();
