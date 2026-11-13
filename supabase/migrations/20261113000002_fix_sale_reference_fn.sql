-- ============================================================================
-- Fix generate_sale_reference :
--
-- Migration 017 utilisait COUNT(*) + 1 (fragile : recrée des refs après suppression).
-- Migration 019 l'a remplacé par nextval('sale_ref_seq'), mais la séquence n'a
-- jamais été initialisée (les ventes existantes ont été créées via COUNT(*),
-- donc la séquence est restée à 1). Prochain nextval = 1 => collision avec
-- VTE-2026-00001 existant.
--
-- Fix : MAX(seq) + 1 par année, avec advisory lock pour l'atomicité.
-- Gère : imports manuels, suppressions, changement d'année (reset auto).
-- La séquence sale_ref_seq est conservée (non utilisée) pour compat.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_sale_reference()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  current_year int := extract(year from now());
  seq_num int;
BEGIN
  -- Advisory lock : sérialise les INSERT sur la même année (pas de collision
  -- en cas d'INSERT concurrents). Libéré à la fin de la transaction.
  PERFORM pg_advisory_xact_lock(hashtext('sale_ref_' || current_year));

  SELECT COALESCE(MAX(CAST(split_part(reference, '-', 3) AS int)), 0) + 1
  INTO seq_num
  FROM public.sales
  WHERE reference LIKE 'VTE-' || current_year || '-%';

  NEW.reference := 'VTE-' || current_year || '-' || lpad(seq_num::text, 5, '0');
  RETURN NEW;
END;
$function$;
