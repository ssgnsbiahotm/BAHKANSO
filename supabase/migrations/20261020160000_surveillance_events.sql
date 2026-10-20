/*
# Surveillance Events — Module de surveillance (phytosanitaire, équipements)

## Overview
Crée la table `surveillance_events` pour centraliser les événements de surveillance :
- phyto_traitement (traitements phytosanitaires)
- equip_panne (pannes équipements)

Les types élevage (vaccination, mortalité) sont exclus du MVP car
gérés par la table existante `animal_events` (évite la double saisie).

## Sécurité
- RLS activée
- Politiques `authenticated` only (modèle mono-ferme, toutes les données partagées)
- Suppression logique via `deleted_at` (filtrée côté application)
*/

-- ============ HELPER : get_farm_id() ============
-- Retourne l'ID de la ferme unique (single-tenant). STABLE car table farms immuable en pratique.
DROP FUNCTION IF EXISTS public.get_farm_id();
CREATE OR REPLACE FUNCTION public.get_farm_id()
RETURNS uuid LANGUAGE sql STABLE AS $fn$
  SELECT id FROM public.farms LIMIT 1;
$fn$;

-- ============ SURVEILLANCE EVENTS ============
CREATE TABLE IF NOT EXISTS public.surveillance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Appartenance à la ferme (single-tenant)
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE RESTRICT
    DEFAULT public.get_farm_id(),

  -- Type d'événement (2 valeurs MVP)
  type text NOT NULL CHECK (type IN (
    'phyto_traitement',
    'equip_panne'
  )),

  -- Liaison optionnelle vers entité métier (FK explicites, nullable)
  plot_id uuid REFERENCES public.plots(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  lot_id uuid REFERENCES public.animal_lots(id) ON DELETE SET NULL,
  animal_id uuid REFERENCES public.animals(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,

  -- Identification
  label text NOT NULL CHECK (char_length(label) <= 255),
  description text,

  -- Planification / réalisation
  scheduled_at timestamptz NOT NULL,
  completed_at timestamptz,

  -- Statut stocké (4 valeurs) — "en retard" est CALCULÉ à l'affichage
  status text NOT NULL DEFAULT 'planifie' CHECK (status IN (
    'planifie', 'en_cours', 'termine', 'annule'
  )),

  -- Coût
  cost_amount numeric(12,2) CHECK (cost_amount >= 0),

  -- Responsable (utilisateur de l'application)
  responsible_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL,

  -- Détails flexibles (produits, doses, symptômes, pièce concernée, etc.)
  details jsonb NOT NULL DEFAULT '{}',

  -- Suppression logique
  deleted_at timestamptz,

  -- Horodatage
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Contrainte : completed_at obligatoire si status = 'termine'
  CONSTRAINT chk_completed_when_terminated
    CHECK (status <> 'termine' OR completed_at IS NOT NULL)
);

ALTER TABLE public.surveillance_events ENABLE ROW LEVEL SECURITY;

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_surveillance_farm_scheduled
  ON public.surveillance_events (farm_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_surveillance_plot ON public.surveillance_events (plot_id);
CREATE INDEX IF NOT EXISTS idx_surveillance_campaign ON public.surveillance_events (campaign_id);
CREATE INDEX IF NOT EXISTS idx_surveillance_lot ON public.surveillance_events (lot_id);
CREATE INDEX IF NOT EXISTS idx_surveillance_animal ON public.surveillance_events (animal_id);
CREATE INDEX IF NOT EXISTS idx_surveillance_project ON public.surveillance_events (project_id);
CREATE INDEX IF NOT EXISTS idx_surveillance_status ON public.surveillance_events (status);
CREATE INDEX IF NOT EXISTS idx_surveillance_type ON public.surveillance_events (type);
CREATE INDEX IF NOT EXISTS idx_surveillance_deleted
  ON public.surveillance_events (deleted_at) WHERE deleted_at IS NULL;

-- ============ TRIGGER updated_at ============
-- Réutilise la fonction générique si elle existe, sinon la crée (tags $do$ / $fn$ / $body$)
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION public.set_updated_at()
    RETURNS trigger LANGUAGE plpgsql AS $body$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $body$;
  END IF;
END $do$;

DROP TRIGGER IF EXISTS trigger_surveillance_updated_at ON public.surveillance_events;
CREATE TRIGGER trigger_surveillance_updated_at
  BEFORE UPDATE ON public.surveillance_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ RLS POLICIES (authenticated only, mono-ferme) ============
-- DROP avant CREATE pour idempotence
DROP POLICY IF EXISTS "auth_select_surveillance_events" ON public.surveillance_events;
DROP POLICY IF EXISTS "auth_insert_surveillance_events" ON public.surveillance_events;
DROP POLICY IF EXISTS "auth_update_surveillance_events" ON public.surveillance_events;

-- SELECT : pas de filtre deleted_at (fait côté application)
CREATE POLICY "auth_select_surveillance_events"
  ON public.surveillance_events FOR SELECT TO authenticated
  USING (true);

-- INSERT : création autorisée (farm_id auto-rempli par défaut)
CREATE POLICY "auth_insert_surveillance_events"
  ON public.surveillance_events FOR INSERT TO authenticated
  WITH CHECK (true);

-- UPDATE : modification + soft-delete (deleted_at géré par l'application)
CREATE POLICY "auth_update_surveillance_events"
  ON public.surveillance_events FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Pas de politique DELETE physique — soft-delete uniquement via UPDATE