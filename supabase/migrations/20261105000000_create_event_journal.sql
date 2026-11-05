-- ============================================================================
-- Journal d'événements : source de vérité unique (immuable)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.event_journal (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id           uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  occurred_at       timestamptz NOT NULL DEFAULT now(),
  recorded_at       timestamptz NOT NULL DEFAULT now(),
  event_type        text NOT NULL,
  entity_type       text NOT NULL,
  entity_id         uuid NOT NULL,
  actor_id          uuid REFERENCES public.app_users(id),
  amount            numeric(14,2),
  quantity          numeric(14,3),
  unit              text,
  currency          text NOT NULL DEFAULT 'XOF',
  source_module     text NOT NULL CHECK (source_module IN ('culture','elevage','chantier','finance')),
  context           jsonb NOT NULL DEFAULT '{}'::jsonb,
  reverses_event_id uuid REFERENCES public.event_journal(id),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_journal_farm_date
  ON public.event_journal (farm_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS event_journal_type
  ON public.event_journal (farm_id, event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS event_journal_entity
  ON public.event_journal (entity_type, entity_id);

ALTER TABLE public.event_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_journal FORCE ROW LEVEL SECURITY;

-- Lecture : staff par site (via les helpers existants)
CREATE POLICY "event_journal_select_scoped" ON public.event_journal
FOR SELECT TO authenticated
USING (
  public.current_user_role() IN
    ('proprietaire','administrateur','gestionnaire','comptable','auditeur','chef_chantier','responsable_agricole','responsable_elevage')
  AND farm_id = public.current_user_site_id()
);

-- Écriture : uniquement par les triggers SECURITY DEFINER (pas d'insertion directe par les utilisateurs)
-- Aucune politique INSERT pour authenticated.

-- Immutabilité : pas d'UPDATE ni de DELETE
REVOKE UPDATE, DELETE ON public.event_journal FROM authenticated;

-- GARDE-FOU : FORCE ROW LEVEL SECURITY doit être actif
DO $$
BEGIN
  IF NOT (SELECT relforcerowsecurity FROM pg_class WHERE relname = 'event_journal') THEN
    RAISE EXCEPTION 'FORCE ROW LEVEL SECURITY manquant sur event_journal';
  END IF;
END $$;
