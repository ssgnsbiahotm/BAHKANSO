-- ============================================================================
-- Ajout des colonnes justificatif_* et amount_paid sur expenses
-- Date : 2026-11-27
-- ============================================================================
-- Contexte : ExpensesTab.tsx et src/lib/types.ts référencent 4 colonnes
-- (justificatif_url, justificatif_file_name, justificatif_uploaded_at,
--  amount_paid) absentes du CREATE TABLE expenses
-- (20260929171038_001_core_tables.sql:223-245). Toute création/édition de
-- dépense échoue avec "column does not exist".
--
-- Décisions métier validées (voir memory/expenses-missing-columns-p0.md) :
--   Q1 : amount_paid DEFAULT NULL (pas de DEFAULT) + backfill des lignes
--        existantes. Le fallback UI amount_paid ?? amount reste utile pour
--        les lignes nouvelles non trackées.
--   Q2 : pas de CHECK amount_paid <= amount en v1 (domaine non confirmé).
--   Q3 : amount_paid = montant effectivement payé à date.
-- ============================================================================

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS justificatif_url text,
  ADD COLUMN IF NOT EXISTS justificatif_file_name text,
  ADD COLUMN IF NOT EXISTS justificatif_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS amount_paid numeric;

-- Backfill : les dépenses existantes sont considérées comme payées à leur
-- montant total (comportement "non tracké" hérité, fallback UI inactive).
UPDATE public.expenses SET amount_paid = amount WHERE amount_paid IS NULL;

-- Rollback (en commentaire) :
-- ALTER TABLE public.expenses DROP COLUMN IF EXISTS justificatif_url;
-- ALTER TABLE public.expenses DROP COLUMN IF EXISTS justificatif_file_name;
-- ALTER TABLE public.expenses DROP COLUMN IF EXISTS justificatif_uploaded_at;
-- ALTER TABLE public.expenses DROP COLUMN IF EXISTS amount_paid;
