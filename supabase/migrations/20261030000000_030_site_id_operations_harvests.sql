-- Migration 030 : site_id sur crop_operations et harvests
-- + triggers de cohérence avec plots.site_id

-- ============ CROP_OPERATIONS ============
ALTER TABLE crop_operations
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES sites(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_crop_operations_site ON crop_operations(site_id);

CREATE OR REPLACE FUNCTION sync_crop_operation_site_id() RETURNS trigger AS $$
DECLARE
  v_plot_id uuid;
  v_site_id uuid;
BEGIN
  IF NEW.plot_id IS NOT NULL THEN
    v_plot_id := NEW.plot_id;
  ELSIF NEW.campaign_id IS NOT NULL THEN
    SELECT plot_id INTO v_plot_id FROM campaigns WHERE id = NEW.campaign_id;
  END IF;
  
  IF v_plot_id IS NOT NULL AND NEW.site_id IS NULL THEN
    SELECT site_id INTO v_site_id FROM plots WHERE id = v_plot_id;
    NEW.site_id := v_site_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_crop_operation_site_sync ON crop_operations;
CREATE TRIGGER trg_crop_operation_site_sync
  BEFORE INSERT OR UPDATE OF plot_id, campaign_id ON crop_operations
  FOR EACH ROW EXECUTE FUNCTION sync_crop_operation_site_id();

-- ============ HARVESTS ============
ALTER TABLE harvests
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES sites(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_harvests_site ON harvests(site_id);

CREATE OR REPLACE FUNCTION sync_harvest_site_id() RETURNS trigger AS $$
DECLARE
  v_plot_id uuid;
  v_site_id uuid;
BEGIN
  IF NEW.plot_id IS NOT NULL THEN
    v_plot_id := NEW.plot_id;
  ELSIF NEW.campaign_id IS NOT NULL THEN
    SELECT plot_id INTO v_plot_id FROM campaigns WHERE id = NEW.campaign_id;
  END IF;
  
  IF v_plot_id IS NOT NULL AND NEW.site_id IS NULL THEN
    SELECT site_id INTO v_site_id FROM plots WHERE id = v_plot_id;
    NEW.site_id := v_site_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_harvest_site_sync ON harvests;
CREATE TRIGGER trg_harvest_site_sync
  BEFORE INSERT OR UPDATE OF plot_id, campaign_id ON harvests
  FOR EACH ROW EXECUTE FUNCTION sync_harvest_site_id();

-- ============ BACKFILL ============
UPDATE crop_operations co
SET site_id = p.site_id
FROM campaigns c
JOIN plots p ON p.id = c.plot_id
WHERE co.campaign_id = c.id AND co.site_id IS NULL;

UPDATE harvests h
SET site_id = p.site_id
FROM plots p
WHERE h.plot_id = p.id AND h.site_id IS NULL;
