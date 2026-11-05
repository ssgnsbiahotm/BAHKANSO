-- ============================================================================
-- Surveillance Events — recréation de la table perdue
-- Récréée avec un timestamp antérieur à la migration 012
-- (20261005195224_012_rls_by_role_complete.sql) pour que ses politiques
-- sur surveillance_events s'appliquent correctement.
--
-- La table est définie avec le schéma complet attendu par la migration
-- 20261020160000_surveillance_events.sql (CREATE TABLE IF NOT EXISTS ne
-- rajoute pas de colonnes manquantes). Les index, le trigger, les politiques
-- RLS et la fonction get_farm_id() appartiennent à la migration 20261020160000
-- et ne sont donc pas redéfinis ici.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.surveillance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Appartenance à la ferme (single-tenant)
  -- NOTE : pas de DEFAULT get_farm_id() ici car la fonction est définie
  -- par la migration 20261020160000, appliquée après celle-ci.
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE RESTRICT,

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

-- Activer RLS (les politiques de rôle seront ajoutées par la migration 012
-- et complétées par la migration 20261020160000)
ALTER TABLE public.surveillance_events ENABLE ROW LEVEL SECURITY;
