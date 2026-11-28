-- P1 RLS : aligne expenses sur rbac.ts (typo fix, rôles manquants ajoutés).
DROP POLICY IF EXISTS "expenses_select_scoped" ON public.expenses;
DROP POLICY IF EXISTS "expenses_write_scoped" ON public.expenses;

CREATE POLICY "expenses_select_scoped" ON public.expenses
  FOR SELECT TO authenticated
  USING (
    current_user_role() IN ('administrateur', 'propriétaire')
    OR (
      current_user_role() IN (
        'gestionnaire', 'responsable_agricole', 'responsable_élevage',
        'responsable_chantier', 'comptable', 'auditeur'
      )
      AND site_id = current_user_site_id()
    )
  );

CREATE POLICY "expenses_write_scoped" ON public.expenses
  FOR ALL TO authenticated
  USING (
    current_user_role() IN ('administrateur', 'propriétaire')
    OR (
      current_user_role() IN (
        'gestionnaire', 'responsable_agricole', 'responsable_élevage'
      )
      AND site_id = current_user_site_id()
    )
  )
  WITH CHECK (
    current_user_role() IN ('administrateur', 'propriétaire')
    OR (
      current_user_role() IN (
        'gestionnaire', 'responsable_agricole', 'responsable_élevage'
      )
      AND site_id = current_user_site_id()
    )
  );
