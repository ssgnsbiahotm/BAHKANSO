-- RLS Scoped by site_id — table sales (complément de la migration 20261116000000)
--
-- La table sales n'a pas été incluse dans la migration 20261116000000
-- (rls_scoped_site_id). Elle conserve donc les anciennes policies de
-- migration 019 (rls_sales_least_privilege) qui, dans l'état courant de la
-- base locale, sont absentes : RLS est forcée mais sans policy, toute lecture
--/écriture authentifiée est bloquée (data = [], error = null).
--
-- Cette migration ajoute des policies scoped site_id sur sales, cohérentes avec
-- le modèle de la migration 20261116000000 : seule la ligne dont site_id
-- correspond au site de l'utilisateur connecté (current_user_site_id()) est
-- visible / modifiable. Pas de clause de rôle : le test d'isolation cross-site
-- (comptable ne peut pas modifier une vente d'un autre site) doit être bloqué.
--
-- Idempotente : DROP POLICY IF EXISTS + CREATE POLICY.

DO $$
BEGIN
  -- Supprimer d'éventuelles policies legacy de la migration 019 sur sales
  EXECUTE 'DROP POLICY IF EXISTS role_select_sales ON sales';
  EXECUTE 'DROP POLICY IF EXISTS role_insert_sales ON sales';
  EXECUTE 'DROP POLICY IF EXISTS role_update_sales ON sales';
  EXECUTE 'DROP POLICY IF EXISTS role_delete_sales ON sales';
  EXECUTE 'DROP POLICY IF EXISTS auth_select_sales ON sales';
  EXECUTE 'DROP POLICY IF EXISTS auth_insert_sales ON sales';
  EXECUTE 'DROP POLICY IF EXISTS auth_update_sales ON sales';
  EXECUTE 'DROP POLICY IF EXISTS auth_delete_sales ON sales';

  EXECUTE 'DROP POLICY IF EXISTS rls_select_sales ON sales';
  EXECUTE 'DROP POLICY IF EXISTS rls_insert_sales ON sales';
  EXECUTE 'DROP POLICY IF EXISTS rls_update_sales ON sales';
  EXECUTE 'DROP POLICY IF EXISTS rls_delete_sales ON sales';

  -- Site-scoped : uniquement les lignes du site de l'utilisateur connecté
  EXECUTE 'CREATE POLICY rls_select_sales ON sales FOR SELECT TO authenticated
    USING (site_id = current_user_site_id())';
  EXECUTE 'CREATE POLICY rls_insert_sales ON sales FOR INSERT TO authenticated
    WITH CHECK (site_id = current_user_site_id())';
  EXECUTE 'CREATE POLICY rls_update_sales ON sales FOR UPDATE TO authenticated
    USING (site_id = current_user_site_id())
    WITH CHECK (site_id = current_user_site_id())';
  EXECUTE 'CREATE POLICY rls_delete_sales ON sales FOR DELETE TO authenticated
    USING (site_id = current_user_site_id())';
END $$;

ALTER TABLE public.sales FORCE ROW LEVEL SECURITY;

COMMENT ON POLICY rls_select_sales ON sales IS
  'Lecture des ventes limitée au site courant de l utilisateur (current_user_site_id)';
