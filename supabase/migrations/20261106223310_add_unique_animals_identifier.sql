-- ============================================================================
-- Contrainte unique sur animals.identifier
-- Évite les doublons (race condition) lors de l'auto-génération PREFIX-NNN
-- Date : 2026-11-06
-- ============================================================================

-- Idempotent : ne fait rien si la contrainte existe déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'animals_identifier_unique'
  ) THEN
    ALTER TABLE public.animals 
    ADD CONSTRAINT animals_identifier_unique UNIQUE (identifier);
  END IF;
END $$;

-- Vérification post-migration
DO $$
DECLARE
  dup_count integer;
BEGIN
  SELECT COUNT(*) - COUNT(DISTINCT identifier) INTO dup_count FROM public.animals;
  IF dup_count > 0 THEN
    RAISE EXCEPTION 'Doublons existants sur identifier : % lignes en conflit', dup_count;
  END IF;
END $$;
