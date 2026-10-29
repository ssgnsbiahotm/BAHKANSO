/*
# Bahkanso — Migration 028 : site_id partout + triggers de cohérence

## Objectifs
1. Ajouter site_id sur animal_lots (manquant malgré migration 016)
2. Ajouter site_id sur animals (manquant)
3. Ajouter site_id sur media (si table existe)
4. Trigger : campaigns.site_id = plots.site_id (cohérence auto)
5. Trigger : animals.site_id = animal_lots.site_id (cohérence auto)
6. Backfill best-effort sur données existantes
*/

-- =============================================
-- 1. AJOUT site_id SUR ANIMAL_LOTS
-- =============================================
ALTER TABLE animal_lots
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES sites(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_animal_lots_site ON animal_lots(site_id);

-- =============================================
-- 2. AJOUT site_id SUR ANIMALS
-- =============================================
ALTER TABLE animals
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES sites(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_animals_site ON animals(site_id);

-- =============================================
-- 3. AJOUT site_id SUR MEDIA (si table existe)
-- =============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media') THEN
    ALTER TABLE media ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES sites(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_media_site ON media(site_id);
  END IF;
END $$;

-- =============================================
-- 4. TRIGGER : COHÉRENCE CAMPAIGNS.SITE_ID = PLOTS.SITE_ID
-- =============================================
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

-- =============================================
-- 5. TRIGGER : COHÉRENCE ANIMALS.SITE_ID = ANIMAL_LOTS.SITE_ID
-- =============================================
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

-- =============================================
-- 6. BACKFILL BEST-EFFORT (remplir site_id existants)
-- =============================================
-- Prend le premier site disponible (ex: Site de Dabou)
UPDATE animal_lots
SET site_id = (SELECT id FROM sites WHERE name ILIKE '%Dabou%' LIMIT 1)
WHERE site_id IS NULL;

UPDATE animals
SET site_id = (SELECT id FROM sites WHERE name ILIKE '%Dabou%' LIMIT 1)
WHERE site_id IS NULL;

-- Mettre à jour campaigns sans site_id via leur plot
UPDATE campaigns
SET site_id = p.site_id
FROM plots p
WHERE campaigns.plot_id = p.id
  AND campaigns.site_id IS NULL
  AND p.site_id IS NOT NULL;
