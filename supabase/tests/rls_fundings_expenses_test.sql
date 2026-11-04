-- supabase/tests/rls_fundings_expenses_test.sql
--
-- Tests pgTAP : invariants structurels RLS sur fundings et expenses.
--
-- Les assertions METIER (qui voit quoi, qui peut ecrire) sont
-- teste dans tests/integration/ avec un vrai JWT Supabase.
-- pgTAP ne peut pas simuler auth.uid() de maniere fiable
-- (voir CLAUDE.md, section "Tests pgTAP et auth.uid()").
--
-- Ce fichier verifie UNIQUEMENT les invariants qui ne dependent
-- pas d'auth.uid().

begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

-- 1-2. FORCE ROW LEVEL SECURITY active
select is(
  (select relforcerowsecurity from pg_class
   where relname = 'fundings' and relkind = 'r'),
  true,
  'fundings a FORCE ROW LEVEL SECURITY'
);

select is(
  (select relforcerowsecurity from pg_class
   where relname = 'expenses' and relkind = 'r'),
  true,
  'expenses a FORCE ROW LEVEL SECURITY'
);

-- 3-4. Aucune politique USING (true) ou WITH CHECK (true)
select is(
  (select count(*) from pg_policy
   where polrelid = 'public.fundings'::regclass
     and (pg_get_expr(polqual, polrelid) = 'true'
          or pg_get_expr(polwithcheck, polrelid) = 'true')),
  0::bigint,
  'aucune politique permissive sur fundings'
);

select is(
  (select count(*) from pg_policy
   where polrelid = 'public.expenses'::regclass
     and (pg_get_expr(polqual, polrelid) = 'true'
          or pg_get_expr(polwithcheck, polrelid) = 'true')),
  0::bigint,
  'aucune politique permissive sur expenses'
);

-- 5-6. Les politiques *_scoped existent
select is(
  (select count(*) from pg_policy
   where polrelid = 'public.fundings'::regclass
     and polname in ('fundings_select_scoped', 'fundings_write_scoped')),
  2::bigint,
  'politiques fundings_select_scoped et fundings_write_scoped presentes'
);

select is(
  (select count(*) from pg_policy
   where polrelid = 'public.expenses'::regclass
     and polname in ('expenses_select_scoped', 'expenses_write_scoped')),
  2::bigint,
  'politiques expenses_select_scoped et expenses_write_scoped presentes'
);

-- 7. Les 4 helpers current_* ont row_security = off dans proconfig
select is(
  (select count(*) from pg_proc
   where pronamespace = 'public'::regnamespace
     and proname like 'current_%'
     and 'row_security=off' = any(proconfig)),
  4::bigint,
  'les 4 helpers current_* ont row_security = off'
);

select * from finish();
rollback;
