-- P1 RLS : supprime les 4 policies rls_*_expenses (bypass site-only).
DROP POLICY IF EXISTS "rls_select_expenses" ON public.expenses;
DROP POLICY IF EXISTS "rls_insert_expenses" ON public.expenses;
DROP POLICY IF EXISTS "rls_update_expenses" ON public.expenses;
DROP POLICY IF EXISTS "rls_delete_expenses" ON public.expenses;
