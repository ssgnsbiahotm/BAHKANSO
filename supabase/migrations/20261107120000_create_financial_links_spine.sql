-- ============================================================================
-- financial_links — Colonne vertébrale des transactions financières
-- Architecture "Danse du Cobra" : chaque transaction (expense, funding, sale,
-- harvest_revenue) peut être liée à N entités métier avec répartition.
-- Date : 2026-11-07
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.financial_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source financière (polymorphique)
  transaction_type text NOT NULL CHECK (transaction_type IN (
    'expense', 'funding', 'sale', 'harvest_revenue', 'other'
  )),
  transaction_id uuid NOT NULL,

  -- Cible métier (polymorphique)
  entity_type text NOT NULL CHECK (entity_type IN (
    'plot', 'campaign', 'crop_operation', 'harvest',
    'animal', 'animal_lot', 'animal_event',
    'project', 'project_step',
    'site', 'supplier', 'customer', 'funder'
  )),
  entity_id uuid NOT NULL,

  -- Montant alloué à cette entité (répartition)
  amount_allocated numeric(14,2) NOT NULL DEFAULT 0 CHECK (amount_allocated >= 0),
  currency text NOT NULL DEFAULT 'XOF',
  -- Pourcentage optionnel (0-100), calculé si non fourni
  percent_allocated numeric(5,2) CHECK (percent_allocated IS NULL OR (percent_allocated >= 0 AND percent_allocated <= 100)),

  -- Métadonnées libres
  metadata jsonb NOT NULL DEFAULT '{}',
  note text,

  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.app_users(id) ON DELETE SET NULL,

  -- Unicité : une entité ne peut être liée qu'une fois par transaction
  UNIQUE(transaction_type, transaction_id, entity_type, entity_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_financial_links_transaction
  ON public.financial_links(transaction_type, transaction_id);

CREATE INDEX IF NOT EXISTS idx_financial_links_entity
  ON public.financial_links(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_financial_links_created_at
  ON public.financial_links(created_at DESC);

-- RLS : même pattern que les autres tables financières
ALTER TABLE public.financial_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_links FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "role_select_financial_links" ON public.financial_links;
CREATE POLICY "role_select_financial_links" ON public.financial_links
  FOR SELECT TO authenticated
  USING (current_user_has_role(ARRAY[
    'administrateur','propriétaire','gestionnaire','comptable','auditeur'
  ]));

DROP POLICY IF EXISTS "role_insert_financial_links" ON public.financial_links;
CREATE POLICY "role_insert_financial_links" ON public.financial_links
  FOR INSERT TO authenticated
  WITH CHECK (current_user_has_role(ARRAY[
    'administrateur','gestionnaire','comptable'
  ]));

DROP POLICY IF EXISTS "role_update_financial_links" ON public.financial_links;
CREATE POLICY "role_update_financial_links" ON public.financial_links
  FOR UPDATE TO authenticated
  USING (current_user_has_role(ARRAY[
    'administrateur','gestionnaire','comptable'
  ]));

DROP POLICY IF EXISTS "role_delete_financial_links" ON public.financial_links;
CREATE POLICY "role_delete_financial_links" ON public.financial_links
  FOR DELETE TO authenticated
  USING (current_user_has_role(ARRAY['administrateur','comptable']));

-- ============================================================================
-- BACKFILL : convertir expenses.project_id → financial_links
-- ============================================================================
INSERT INTO public.financial_links (
  transaction_type, transaction_id,
  entity_type, entity_id,
  amount_allocated, currency,
  metadata, note, created_at, created_by
)
SELECT
  'expense',
  e.id,
  'project',
  e.project_id,
  COALESCE(e.amount, 0),
  COALESCE(e.currency, 'XOF'),
  jsonb_build_object('backfill', true, 'source', 'expenses.project_id'),
  'Migration automatique depuis expenses.project_id',
  COALESCE(e.created_at, now()),
  e.created_by
FROM public.expenses e
WHERE e.project_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.financial_links fl
    WHERE fl.transaction_type = 'expense'
      AND fl.transaction_id = e.id
      AND fl.entity_type = 'project'
      AND fl.entity_id = e.project_id
  );

-- ============================================================================
-- BACKFILL : convertir expenses.site_id → financial_links
-- (site est aussi une entité métier, avec répartition si montant global)
-- ============================================================================
INSERT INTO public.financial_links (
  transaction_type, transaction_id,
  entity_type, entity_id,
  amount_allocated, currency,
  metadata, note, created_at, created_by
)
SELECT
  'expense',
  e.id,
  'site',
  e.site_id,
  COALESCE(e.amount, 0),
  COALESCE(e.currency, 'XOF'),
  jsonb_build_object('backfill', true, 'source', 'expenses.site_id'),
  'Migration automatique depuis expenses.site_id',
  COALESCE(e.created_at, now()),
  e.created_by
FROM public.expenses e
WHERE e.site_id IS NOT NULL
  AND e.project_id IS NULL  -- évite de dupliquer le montant si déjà lié au projet
  AND NOT EXISTS (
    SELECT 1 FROM public.financial_links fl
    WHERE fl.transaction_type = 'expense'
      AND fl.transaction_id = e.id
      AND fl.entity_type = 'site'
      AND fl.entity_id = e.site_id
  );

-- ============================================================================
-- VÉRIFICATIONS POST-MIGRATION
-- ============================================================================
DO $$
DECLARE
  expenses_with_project integer;
  links_for_expenses integer;
BEGIN
  SELECT COUNT(*) INTO expenses_with_project
  FROM public.expenses WHERE project_id IS NOT NULL;

  SELECT COUNT(DISTINCT transaction_id) INTO links_for_expenses
  FROM public.financial_links
  WHERE transaction_type = 'expense';

  IF expenses_with_project > 0 AND links_for_expenses < expenses_with_project THEN
    RAISE EXCEPTION 'Backfill incomplet : % dépenses liées à un projet, seulement % ont un financial_link', expenses_with_project, links_for_expenses;
  END IF;

  RAISE NOTICE 'Backfill OK : % dépenses liées à un projet, % dépenses avec financial_link', expenses_with_project, links_for_expenses;
END $$;

-- Commenter la table
COMMENT ON TABLE public.financial_links IS
  'Colonne vertébrale des transactions financières. Relie expenses/fundings/sales/revenues à N entités métier avec répartition du montant. Voir architecture "Danse du Cobra".';
