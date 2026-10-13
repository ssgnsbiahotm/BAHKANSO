CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  role text NOT NULL DEFAULT 'gestionnaire',
  phone text,
  avatar_url text,
  active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  auth_id uuid UNIQUE REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.funders (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  organization text,
  email text,
  phone text,
  country text,
  total_sent numeric DEFAULT 0,
  total_received numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fundings (
  id uuid PRIMARY KEY,
  reference text UNIQUE,
  funder_id uuid REFERENCES public.funders(id),
  amount_sent numeric NOT NULL,
  currency_sent text NOT NULL DEFAULT 'EUR',
  exchange_rate numeric DEFAULT 1,
  amount_received numeric,
  transfer_fees numeric DEFAULT 0,
  date_sent date NOT NULL,
  date_received date,
  bank_reference text,
  status text NOT NULL DEFAULT 'prévu',
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fundings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_users_legacy_global ON public.app_users;
DROP POLICY IF EXISTS audit_logs_legacy_global ON public.audit_logs;
DROP POLICY IF EXISTS funders_legacy_global ON public.funders;
DROP POLICY IF EXISTS fundings_legacy_global ON public.fundings;

CREATE POLICY app_users_legacy_global ON public.app_users
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY audit_logs_legacy_global ON public.audit_logs
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY funders_legacy_global ON public.funders
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY fundings_legacy_global ON public.fundings
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.app_users, public.audit_logs, public.funders, public.fundings
  TO anon, authenticated;

INSERT INTO public.funders (id, name, organization, email)
VALUES ('10000000-0000-4000-8000-000000000001', 'Financeur synthétique', 'Organisation de test', 'funder@example.test')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    organization = EXCLUDED.organization,
    email = EXCLUDED.email;

INSERT INTO public.fundings (
  id, reference, funder_id, amount_sent, currency_sent, exchange_rate,
  amount_received, transfer_fees, date_sent, date_received, status, comment
)
VALUES (
  '20000000-0000-4000-8000-000000000001',
  'TEST-FND-001',
  '10000000-0000-4000-8000-000000000001',
  100,
  'EUR',
  655.95,
  65000,
  595,
  DATE '2026-01-15',
  DATE '2026-01-16',
  'reçu',
  'Fixture synthétique locale'
)
ON CONFLICT (id) DO UPDATE
SET reference = EXCLUDED.reference,
    funder_id = EXCLUDED.funder_id,
    amount_sent = EXCLUDED.amount_sent,
    currency_sent = EXCLUDED.currency_sent,
    exchange_rate = EXCLUDED.exchange_rate,
    amount_received = EXCLUDED.amount_received,
    transfer_fees = EXCLUDED.transfer_fees,
    date_sent = EXCLUDED.date_sent,
    date_received = EXCLUDED.date_received,
    status = EXCLUDED.status,
    comment = EXCLUDED.comment;

INSERT INTO public.audit_logs (id, action)
VALUES ('30000000-0000-4000-8000-000000000001', 'Fixture synthétique')
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.app_users (auth_id, name, email, role, active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'gestionnaire',
    true
  );
  RETURN NEW;
END
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
