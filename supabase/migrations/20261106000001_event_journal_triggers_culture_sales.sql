-- ============================================================================
-- Journal d'événements : extension aux modules cultures (harvests) et ventes (sales)
-- Étape 3/3 bis : log_event() gère aussi harvests et sales
-- ============================================================================

-- Fonction log_event() étendue aux tables harvests et sales.
-- SECURITY DEFINER + row_security = off : event_journal est en FORCE RLS,
-- donc le déclencheur doit contourner la RLS pour écrire. Aucune politique
-- INSERT n'est accordée aux utilisateurs authentifiés sur event_journal,
-- donc ils ne peuvent pas appeler log_event() directement.
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

  -- 2. RÉCOLTES (nouveau)
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
        jsonb_build_object('crop_id', NEW.campaign_id, 'campaign_id', NEW.campaign_id)
      );
    END IF;
  END IF;

  -- 3. VENTES (nouveau)
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

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.log_event() FROM PUBLIC;

-- Trigger pour les récoltes
DROP TRIGGER IF EXISTS trg_log_harvest ON public.harvests;
CREATE TRIGGER trg_log_harvest
AFTER INSERT ON public.harvests
FOR EACH ROW EXECUTE FUNCTION public.log_event();

-- Trigger pour les ventes
DROP TRIGGER IF EXISTS trg_log_sale ON public.sales;
CREATE TRIGGER trg_log_sale
AFTER INSERT ON public.sales
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
