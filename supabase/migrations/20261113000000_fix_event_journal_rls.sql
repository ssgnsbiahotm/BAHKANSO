-- ============================================================================
-- Fix RLS event_journal : la politique comparait farm_id à current_user_site_id()
-- (un site_id), ce qui ne peut jamais matcher. 0 événement visible en runtime.
--
-- Nouvelle fonction current_user_farm_id() + politique corrigée.
-- Idempotent (CREATE OR REPLACE / DROP IF EXISTS).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_user_farm_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT s.farm_id
  FROM public.app_users au
  JOIN public.sites s ON s.id = au.site_id
  WHERE au.auth_id = auth.uid()
  LIMIT 1;
$$;

DROP POLICY IF EXISTS "event_journal_select_scoped" ON public.event_journal;
CREATE POLICY "event_journal_select_scoped" ON public.event_journal
FOR SELECT TO authenticated
USING (
  public.current_user_role() IN
    ('proprietaire','administrateur','gestionnaire','comptable','auditeur','chef_chantier','responsable_agricole','responsable_elevage')
  AND (
    farm_id = public.current_user_farm_id()
    OR public.current_user_farm_id() IS NULL
  )
);
