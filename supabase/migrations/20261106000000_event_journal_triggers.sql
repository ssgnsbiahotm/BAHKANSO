-- ============================================================================
-- Journal d'événements : trigger d'alimentation sur la table expenses
-- Étape 3/3 : fonction log_event() + trigger trg_log_expense
-- ============================================================================

-- Fonction générique d'insertion dans event_journal (SECURITY DEFINER).
-- row_security = off : la table event_journal est en FORCE RLS, donc le
-- déclencheur (exécuté avec les droits de l'utilisateur appelant) doit
-- contourner la RLS pour écrire. Sécurisé car aucune politique INSERT n'est
-- accordée aux utilisateurs authentifiés : ils ne peuvent pas appeler
-- log_event() directement.
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
  IF TG_TABLE_NAME = 'expenses' THEN
    -- Récupérer le farm_id depuis le site de l'expense
    SELECT farm_id INTO v_farm_id
    FROM public.sites
    WHERE id = NEW.site_id;

    -- Ne journaliser que si le site est lié à une exploitation (farm_id connu).
    -- Sinon l'insertion de dépense doit réussir sans alerter le journal.
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

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.log_event() FROM PUBLIC;

-- Trigger sur expenses (AFTER INSERT, ligne par ligne)
DROP TRIGGER IF EXISTS trg_log_expense ON public.expenses;
CREATE TRIGGER trg_log_expense
AFTER INSERT ON public.expenses
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
