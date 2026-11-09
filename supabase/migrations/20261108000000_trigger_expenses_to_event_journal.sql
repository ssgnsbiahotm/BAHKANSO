-- ============================================================================
-- Journal d'événements : correction du gap expenses -> event_journal
-- Ajoute farm_id à expenses pour que le trigger puisse alimenter event_journal
-- de manière fiable, sans dépendre d'une jointure sites qui peut retourner NULL.
-- ============================================================================

-- 1. Ajoute la colonne farm_id à la table expenses (nullable, référencée sur farms)
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS farm_id uuid REFERENCES public.farms(id);

-- 2. Index pour accélérer les requêtes par farm_id
CREATE INDEX IF NOT EXISTS expenses_farm_id_idx ON public.expenses (farm_id);

-- 3. Met à jour la fonction log_event() pour utiliser NEW.farm_id en priorité,
--    puis chercher via sites en fallback (pour les lignes existantes sans farm_id).
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
    -- Priorité : farm_id directement sur la ligne (ajouté par la migration).
    v_farm_id := NEW.farm_id;

    -- Fallback : cherche le farm_id via le site de l'expense.
    IF v_farm_id IS NULL THEN
      SELECT farm_id INTO v_farm_id
      FROM public.sites
      WHERE id = NEW.site_id;
    END IF;

    -- Ne journaliser que si le farm_id est connu.
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

-- 4. Garantit qu'un seul trigger trg_log_expense existe sur expenses (pas de doublon).
DROP TRIGGER IF EXISTS trg_log_expense ON public.expenses;
CREATE TRIGGER trg_log_expense
AFTER INSERT ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.log_event();

-- 5. Garde-fou : verify que log_event a row_security = off.
DO $$
DECLARE
  fn record;
BEGIN
  SELECT proname, proconfig INTO fn
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
END $$;
