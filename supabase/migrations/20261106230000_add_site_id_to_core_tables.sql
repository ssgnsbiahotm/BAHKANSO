-- ============================================================
-- Ajout de site_id sur les tables cœur pour cloisonnement par site
-- Tables : campaigns, crop_operations, harvests, inventory_items,
--          suppliers, surveillance_events
-- ============================================================

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL;

ALTER TABLE public.crop_operations
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL;

ALTER TABLE public.harvests
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL;

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL;

ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL;

ALTER TABLE public.surveillance_events
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL;

-- Index pour les requêtes filtrées par site
CREATE INDEX IF NOT EXISTS idx_campaigns_site ON public.campaigns(site_id);
CREATE INDEX IF NOT EXISTS idx_crop_operations_site ON public.crop_operations(site_id);
CREATE INDEX IF NOT EXISTS idx_harvests_site ON public.harvests(site_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_site ON public.inventory_items(site_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_site ON public.suppliers(site_id);
CREATE INDEX IF NOT EXISTS idx_surveillance_events_site ON public.surveillance_events(site_id);
