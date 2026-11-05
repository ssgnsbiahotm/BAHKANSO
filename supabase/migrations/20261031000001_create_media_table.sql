-- ============================================================================
-- Migration 032 : Création de la table media
-- Date : 2026-10-31
-- Timestamp 20261031000001 — appliqué avant 20261103000000 (fix_user_sync_ids)
-- qui fait UPDATE public.media ... (référence la table media).
-- ============================================================================

-- NOTE : current_user_role() n'existe qu'à partir de 20261103000001 (après).
-- current_user_site_id() existe depuis 019 (20261022000003) — disponible.
-- current_user_has_role() existe depuis 010 (20261005195222) — disponible.
-- Les politiques utilisent donc current_user_has_role() + current_user_site_id().

CREATE TABLE IF NOT EXISTS public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  type text NOT NULL,
  size integer,
  site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_select_scoped" ON public.media;
CREATE POLICY "media_select_scoped" ON public.media
FOR SELECT TO authenticated
USING (
  current_user_has_role(ARRAY['proprietaire','administrateur','gestionnaire','chef_chantier','responsable_agricole','responsable_elevage'])
  AND site_id = current_user_site_id()
);

DROP POLICY IF EXISTS "media_insert_scoped" ON public.media;
CREATE POLICY "media_insert_scoped" ON public.media
FOR INSERT TO authenticated
WITH CHECK (
  current_user_has_role(ARRAY['proprietaire','administrateur','gestionnaire','chef_chantier','responsable_agricole','responsable_elevage'])
  AND site_id = current_user_site_id()
);
