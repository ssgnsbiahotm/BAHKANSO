-- Nettoyage des politiques RLS legacy (role_*) et correction brèche event_journal
--
-- 1. Supprime les politiques legacy role_* sur sale_items, redondantes avec les
--    politiques rls_*_sale_items scopées site_id (migration 20261119000000).
--    Les politiques role_* coexistaient avec les rls_* ; PostgreSQL combine en OR,
--    ce qui créait des conflits et une surface d'attaque inutile.
--
-- 2. Recrée event_journal_select_scoped SANS la clause OR current_user_farm_id() IS NULL
--    qui constituait une brèche d'isolation multi-sites (utilisateur sans farm_id
--    voyait tous les événements).
--
-- Idempotente : DROP POLICY IF EXISTS + CREATE POLICY ; FORCE ROW LEVEL SECURITY
-- ré-applicable sans erreur.
--
-- Rollback (en commentaire) :
--   -- Restaurer les politiques role_* legacy sur sale_items (à ne faire qu'en cas de régression)
--   -- ALTER TABLE public.sale_items NO FORCE ROW LEVEL SECURITY;
--   -- DROP POLICY IF EXISTS rls_select_sale_items ON public.sale_items; ...
--   -- Restaurer la brèche event_journal (déconseillé) :
--   -- DROP POLICY IF EXISTS event_journal_select_scoped ON public.event_journal;
--   -- CREATE POLICY event_journal_select_scoped ON public.event_journal
--   --   FOR SELECT TO authenticated
--   --   USING (current_user_role() = ANY (...) AND (farm_id = current_user_farm_id() OR current_user_farm_id() IS NULL));

-- ============================================================================
-- 1. Suppression des politiques legacy role_* sur sale_items
-- ============================================================================

DROP POLICY IF EXISTS role_select_sale_items ON public.sale_items;
DROP POLICY IF EXISTS role_insert_sale_items ON public.sale_items;
DROP POLICY IF EXISTS role_update_sale_items ON public.sale_items;
DROP POLICY IF EXISTS role_delete_sale_items ON public.sale_items;

-- ============================================================================
-- 2. Correction event_journal_select_scoped : retrait de la clause IS NULL
-- ============================================================================

DROP POLICY IF EXISTS event_journal_select_scoped ON public.event_journal;

CREATE POLICY event_journal_select_scoped ON public.event_journal
  FOR SELECT TO authenticated
  USING (
    current_user_role() = ANY (ARRAY[
      'proprietaire', 'administrateur', 'gestionnaire',
      'comptable', 'auditeur', 'chef_chantier',
      'responsable_agricole', 'responsable_elevage'
    ])
    AND (farm_id = current_user_farm_id())
  );
