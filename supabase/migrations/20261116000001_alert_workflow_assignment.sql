-- The existing alerts.assigned_to column stores a display value (text).
-- Keep it backward-compatible and add a normalized user relation separately.
ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS assigned_user_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_alerts_assigned_user_id ON public.alerts(assigned_user_id);
