-- ============================================================================
-- Journal d'événements : extension au module Chantiers (project_steps)
-- Étape 7 : log_event() trace aussi l'achèvement des étapes de chantier
-- ============================================================================

-- Fonction log_event() étendue à la table project_steps.
-- SECURITY DEFINER + row_security = off : event_journal est en FORCE RLS,
-- donc le déclencheur doit contourner la RLS pour écrire.
-- NOTE : la table projects n'a pas de colonne site_id/farm_id, il n'est donc
-- pas possible de récupérer un farm_id fiable pour les étapes de chantier.
-- v_farm_id reste NULL et le guard IF v_farm_id IS NOT NULL empêche l'insertion
-- (event_journal.farm_id est NOT NULL). Le trigger est prêt ; il sera effectif
-- dès qu'un lien projet → ferme sera ajouté au schéma.
CREATE OR REPLACE FUNCTION public.log_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_farm_id uuid;
BEGIN
  -- 1. DÉPENSES (existant)
  IF TG_TABLE_NAME = 'expenses' THEN
    SELECT farm_id INTO v_farm_id
    FROM public.sites
    WHERE id = NEW.site_id;

    IF v_farm_id IS NOT NULL THEN
      INSERT INTO public.event_journal (
        farm_id, occurred_at, event_type, entity_type, entity_id,
        actor_id, amount, currency, source_module, context
      ) VALUES (
        v_farm_id, NEW.date, 'depense', 'expense', NEW.id,
        NEW.created_by, NEW.amount, COALESCE(NEW.currency, 'XOF'), 'finance',
        jsonb_build_object('category', NEW.category, 'supplier_id', NEW.supplier_id)
      );
    END IF;
  END IF;

  -- 2. RÉCOLTES (existant)
  -- harvests n'a pas de colonne created_by : actor_id reste NULL.
  -- farm_id est récupéré depuis NEW.site_id (ajouté par la migration 030).
  IF TG_TABLE_NAME = 'harvests' THEN
    SELECT farm_id INTO v_farm_id
    FROM public.sites
    WHERE id = NEW.site_id;

    IF v_farm_id IS NOT NULL THEN
      INSERT INTO public.event_journal (
        farm_id, occurred_at, event_type, entity_type, entity_id,
        actor_id, quantity, unit, source_module, context
      ) VALUES (
        v_farm_id, NEW.date, 'recolte', 'harvest', NEW.id,
        NULL, NEW.quantity, NEW.unit, 'culture',
        jsonb_build_object('campaign_id', NEW.campaign_id)
      );
    END IF;
  END IF;

  -- 3. VENTES (existant)
  -- sales n'a pas de colonne currency : valeur par défaut 'XOF'.
  IF TG_TABLE_NAME = 'sales' THEN
    SELECT farm_id INTO v_farm_id
    FROM public.sites
    WHERE id = NEW.site_id;

    IF v_farm_id IS NOT NULL THEN
      INSERT INTO public.event_journal (
        farm_id, occurred_at, event_type, entity_type, entity_id,
        actor_id, amount, currency, source_module, context
      ) VALUES (
        v_farm_id, NEW.date, 'recette', 'sale', NEW.id,
        NEW.created_by, NEW.total_amount, 'XOF', 'finance',
        jsonb_build_object('customer_id', NEW.customer_id, 'status', NEW.status)
      );
    END IF;
  END IF;

  -- 4. ÉVÉNEMENTS D'ÉLEVAGE (existant, étape 4)
  -- animal_events n'a pas de site_id direct : on remonte via animal_id → animals.site_id.
  -- animal_events n'a pas non plus de created_by : actor_id reste NULL.
  IF TG_TABLE_NAME = 'animal_events' THEN
    SELECT s.farm_id INTO v_farm_id
    FROM public.animals a
    JOIN public.sites s ON s.id = a.site_id
    WHERE a.id = NEW.animal_id;

    IF v_farm_id IS NOT NULL THEN
      INSERT INTO public.event_journal (
        farm_id, occurred_at, event_type, entity_type, entity_id,
        actor_id, amount, currency, source_module, context
      ) VALUES (
        v_farm_id, NEW.date, NEW.type, 'animal', NEW.animal_id,
        NULL, COALESCE(NEW.cost, 0), 'XOF', 'elevage',
        jsonb_build_object(
          'event_id', NEW.id,
          'lot_id', NEW.lot_id,
          'description', NEW.description,
          'responsible', NEW.responsible
        )
      );
    END IF;
  END IF;

  -- 5. ACHÈVEMENT D'ÉTAPE DE CHANTIER (nouveau, étape 7)
  -- project_steps n'a pas de site_id direct et projects n'a pas non plus de
  -- site_id/farm_id : v_farm_id reste NULL, l'insertion est bloquée par le guard.
  IF TG_TABLE_NAME = 'project_steps' THEN
    IF NEW.status = 'terminé' AND OLD.status IS DISTINCT FROM NEW.status THEN
      v_farm_id := NULL; -- pas de lien projet → ferme dans le schéma actuel

      IF v_farm_id IS NOT NULL THEN
        INSERT INTO public.event_journal (
          farm_id, occurred_at, event_type, entity_type, entity_id,
          actor_id, amount, currency, source_module, context
        ) VALUES (
          v_farm_id, NEW.date, 'etape_terminee', 'project_step', NEW.id,
          NULL, 0, 'XOF', 'chantiers',
          jsonb_build_object(
            'project_id', NEW.project_id,
            'step_name', NEW.name,
            'step_status', NEW.status
          )
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.log_event() FROM PUBLIC;

-- Trigger pour les étapes de chantier
DROP TRIGGER IF EXISTS trg_log_project_step ON public.project_steps;
CREATE TRIGGER trg_log_project_step
AFTER UPDATE ON public.project_steps
FOR EACH ROW EXECUTE FUNCTION public.log_event();

-- ============================================================================
-- GARDE-FOU : vérifier que log_event a row_security = off et pas de current_setting
-- ============================================================================
DO $$
DECLARE
  fn record;
BEGIN
  SELECT proname, proconfig, prosrc INTO fn
  FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace
    AND proname = 'log_event'
  LIMIT 1;

  IF fn.proname IS NULL THEN
    RAISE EXCEPTION 'Fonction log_event introuvable après CREATE OR REPLACE';
  END IF;

  IF NOT ('row_security=off' = ANY(fn.proconfig)) THEN
    RAISE EXCEPTION 'log_event n''a pas SET row_security = off (proconfig = %)', fn.proconfig;
  END IF;

  IF fn.prosrc ILIKE '%current_setting%' THEN
    RAISE EXCEPTION 'log_event contient un fallback current_setting (prosrc)';
  END IF;
END $$;
