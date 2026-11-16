-- Surveillance alert workflow: assignment, lifecycle, resolution notes and history.
ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS due_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resolution_note text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.alert_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  action text NOT NULL,
  from_status text,
  to_status text,
  comment text,
  performed_by uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.alert_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_select_alert_actions" ON public.alert_actions;
CREATE POLICY "authenticated_select_alert_actions" ON public.alert_actions
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated_insert_alert_actions" ON public.alert_actions;
CREATE POLICY "authenticated_insert_alert_actions" ON public.alert_actions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_alerts_workflow_status ON public.alerts(status, archived_at);
CREATE INDEX IF NOT EXISTS idx_alerts_assigned_to ON public.alerts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_alert_actions_alert_id ON public.alert_actions(alert_id, created_at DESC);
