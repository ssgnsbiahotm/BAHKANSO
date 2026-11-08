-- ============================================================================
-- Danse du Cobra — Vague 1 : ajout de farm_id aux tables manquantes
-- Tables : campaigns, harvests, sales, crop_operations
-- ============================================================================

-- 1. CAMPAIGNS : ajoute site_id (manquant en DB) puis farm_id
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL;

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS farm_id uuid REFERENCES public.farms(id);

CREATE INDEX IF NOT EXISTS idx_campaigns_site ON public.campaigns(site_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_farm ON public.campaigns(farm_id);

-- 2. HARVESTS : ajoute farm_id (site_id déjà présent via migration 030)
ALTER TABLE public.harvests
  ADD COLUMN IF NOT EXISTS farm_id uuid REFERENCES public.farms(id);

CREATE INDEX IF NOT EXISTS idx_harvests_farm ON public.harvests(farm_id);

-- 3. SALES : ajoute farm_id (site_id déjà présent via migration 017)
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS farm_id uuid REFERENCES public.farms(id);

CREATE INDEX IF NOT EXISTS idx_sales_farm ON public.sales(farm_id);

-- 4. CROP_OPERATIONS : ajoute farm_id (site_id déjà présent via migration 030)
ALTER TABLE public.crop_operations
  ADD COLUMN IF NOT EXISTS farm_id uuid REFERENCES public.farms(id);

CREATE INDEX IF NOT EXISTS idx_crop_operations_farm ON public.crop_operations(farm_id);

-- 5. Backfill : propage farm_id depuis sites via site_id
UPDATE public.campaigns c
SET farm_id = s.farm_id
FROM public.sites s
WHERE c.site_id = s.id AND c.farm_id IS NULL;

UPDATE public.harvests h
SET farm_id = s.farm_id
FROM public.sites s
WHERE h.site_id = s.id AND h.farm_id IS NULL;

UPDATE public.sales s
SET farm_id = si.farm_id
FROM public.sites si
WHERE s.site_id = si.id AND s.farm_id IS NULL;

UPDATE public.crop_operations co
SET farm_id = s.farm_id
FROM public.sites s
WHERE co.site_id = s.id AND co.farm_id IS NULL;
