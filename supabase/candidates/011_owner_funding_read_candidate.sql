-- CANDIDATE ONLY: not applied to Supabase or the configured project.
-- Apply only after candidate 010 has passed on a disposable local database.
BEGIN;

DO $preflight$
DECLARE
  table_name text;
  policy_name text;
  required_column text;
BEGIN
  IF to_regclass('public.app_users') IS NULL
     OR to_regclass('public.funders') IS NULL
     OR to_regclass('public.fundings') IS NULL THEN
    RAISE EXCEPTION 'app_users, funders, and fundings are required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_attribute source_column
      ON source_column.attrelid = c.conrelid AND source_column.attnum = c.conkey[1]
    JOIN pg_attribute target_column
      ON target_column.attrelid = c.confrelid AND target_column.attnum = c.confkey[1]
    WHERE c.conrelid = 'public.fundings'::regclass
      AND c.confrelid = 'public.funders'::regclass
      AND c.contype = 'f' AND cardinality(c.conkey) = 1 AND cardinality(c.confkey) = 1
      AND source_column.attname = 'funder_id' AND target_column.attname = 'id'
  ) THEN
    RAISE EXCEPTION 'fundings.funder_id must reference funders.id for the limited join';
  END IF;

  FOREACH table_name IN ARRAY ARRAY['fundings', 'funders'] LOOP
    FOREACH required_column IN ARRAY (
      CASE table_name
        WHEN 'fundings' THEN ARRAY[
          'id', 'reference', 'funder_id', 'amount_sent', 'currency_sent',
          'exchange_rate', 'amount_received', 'transfer_fees', 'date_sent',
          'date_received', 'bank_reference', 'status', 'comment'
        ]
        ELSE ARRAY['id', 'name']
      END
    )
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        WHERE a.attrelid = to_regclass(format('public.%I', table_name))
          AND a.attname = required_column AND NOT a.attisdropped
      ) THEN
        RAISE EXCEPTION 'Required column public.%.% is missing', table_name, required_column;
      END IF;
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC, anon, authenticated',
      table_name
    );
    FOR policy_name IN
      SELECT p.policyname FROM pg_policies p
      WHERE p.schemaname = 'public' AND p.tablename = table_name
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', policy_name, table_name);
    END LOOP;
  END LOOP;
END
$preflight$;

GRANT SELECT (
  id, reference, funder_id, amount_sent, currency_sent, exchange_rate,
  amount_received, transfer_fees, date_sent, date_received,
  bank_reference, status, comment
) ON TABLE public.fundings TO authenticated;

GRANT SELECT (id, name) ON TABLE public.funders TO authenticated;

CREATE POLICY fundings_read_owner
  ON public.fundings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.app_users profile
      WHERE profile.auth_id = (SELECT auth.uid())
        AND profile.role::text = 'propriétaire'
        AND profile.active IS TRUE
    )
  );

CREATE POLICY funders_read_owner_funding_names
  ON public.funders FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.fundings funding
      WHERE funding.funder_id = funders.id
    )
  );

COMMIT;
