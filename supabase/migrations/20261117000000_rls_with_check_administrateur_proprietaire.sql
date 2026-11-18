/*
# RLS WITH_CHECK — ajoute administrateur et propriétaire aux politiques d'écriture

Cette migration corrige les clauses WITH_CHECK des politiques `role_update_*`
qui omettent les rôles `administrateur` et `propriétaire`, bloquant les mises
à jour pour ces rôles bien que la clause USING les autorise en lecture.

Tables concernées :
- clients : WITH_CHECK manquait `administrateur` et `propriétaire`
- toutes les autres tables métier : WITH_CHECK manquait `propriétaire`

Idempotente : DROP POLICY IF EXISTS + CREATE POLICY pour chaque politique modifiée.
*/

-- 1. clients : role_update_customers — WITH_CHECK manquait administrateur/propriétaire
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'role_update_customers' AND polrelid = 'customers'::regclass) THEN
    EXECUTE 'DROP POLICY role_update_customers ON customers';
  END IF;
END $$;

CREATE POLICY role_update_customers ON customers
  FOR UPDATE
  TO authenticated
  USING (
    (current_user_role() = ANY (ARRAY['administrateur','propriétaire'])) OR
    ((current_user_role() = ANY (ARRAY['gestionnaire','comptable','responsable_agricole','responsable_élevage'])) AND (site_id = current_user_site_id()))
  )
  WITH CHECK (
    (current_user_role() = ANY (ARRAY['administrateur','propriétaire'])) OR
    ((current_user_role() = ANY (ARRAY['gestionnaire','comptable','responsable_agricole','responsable_élevage'])) AND (site_id = current_user_site_id()))
  );

-- 2. alerts : role_update_alerts — WITH_CHECK manquait propriétaire
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'role_update_alerts' AND polrelid = 'alerts'::regclass) THEN
    EXECUTE 'DROP POLICY role_update_alerts ON alerts';
  END IF;
END $$;

CREATE POLICY role_update_alerts ON alerts
  FOR UPDATE
  TO authenticated
  USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole','responsable_élevage']))
  WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole','responsable_élevage']));

-- 3. animal_events : role_update_animal_events — WITH_CHECK manquait propriétaire
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'role_update_animal_events' AND polrelid = 'animal_events'::regclass) THEN
    EXECUTE 'DROP POLICY role_update_animal_events ON animal_events';
  END IF;
END $$;

CREATE POLICY role_update_animal_events ON animal_events
  FOR UPDATE
  TO authenticated
  USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_élevage']))
  WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_élevage']));

-- 4. animal_lots : role_update_animal_lots — WITH_CHECK manquait propriétaire
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'role_update_animal_lots' AND polrelid = 'animal_lots'::regclass) THEN
    EXECUTE 'DROP POLICY role_update_animal_lots ON animal_lots';
  END IF;
END $$;

CREATE POLICY role_update_animal_lots ON animal_lots
  FOR UPDATE
  TO authenticated
  USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_élevage']))
  WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_élevage']));

-- 5. animals : role_update_animals — WITH_CHECK manquait propriétaire
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'role_update_animals' AND polrelid = 'animals'::regclass) THEN
    EXECUTE 'DROP POLICY role_update_animals ON animals';
  END IF;
END $$;

CREATE POLICY role_update_animals ON animals
  FOR UPDATE
  TO authenticated
  USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_élevage']))
  WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_élevage']));

-- 6. campaigns : role_update_campaigns — WITH_CHECK manquait propriétaire
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'role_update_campaigns' AND polrelid = 'campaigns'::regclass) THEN
    EXECUTE 'DROP POLICY role_update_campaigns ON campaigns';
  END IF;
END $$;

CREATE POLICY role_update_campaigns ON campaigns
  FOR UPDATE
  TO authenticated
  USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole']))
  WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole']));

-- 7. crop_operations : role_update_crop_operations — WITH_CHECK manquait propriétaire
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'role_update_crop_operations' AND polrelid = 'crop_operations'::regclass) THEN
    EXECUTE 'DROP POLICY role_update_crop_operations ON crop_operations';
  END IF;
END $$;

CREATE POLICY role_update_crop_operations ON crop_operations
  FOR UPDATE
  TO authenticated
  USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole']))
  WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole']));

-- 8. harvests : role_update_harvests — WITH_CHECK manquait propriétaire
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'role_update_harvests' AND polrelid = 'harvests'::regclass) THEN
    EXECUTE 'DROP POLICY role_update_harvests ON harvests';
  END IF;
END $$;

CREATE POLICY role_update_harvests ON harvests
  FOR UPDATE
  TO authenticated
  USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole']))
  WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole']));

-- 9. inventory_counts : role_update_inventory_counts — WITH_CHECK manquait propriétaire
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'role_update_inventory_counts' AND polrelid = 'inventory_counts'::regclass) THEN
    EXECUTE 'DROP POLICY role_update_inventory_counts ON inventory_counts';
  END IF;
END $$;

CREATE POLICY role_update_inventory_counts ON inventory_counts
  FOR UPDATE
  TO authenticated
  USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage']))
  WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

-- 10. inventory_items : role_update_inventory_items — WITH_CHECK manquait propriétaire
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'role_update_inventory_items' AND polrelid = 'inventory_items'::regclass) THEN
    EXECUTE 'DROP POLICY role_update_inventory_items ON inventory_items';
  END IF;
END $$;

CREATE POLICY role_update_inventory_items ON inventory_items
  FOR UPDATE
  TO authenticated
  USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage']))
  WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

-- 11. inventory_movements : role_update_inventory_movements — WITH_CHECK manquait propriétaire
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'role_update_inventory_movements' AND polrelid = 'inventory_movements'::regclass) THEN
    EXECUTE 'DROP POLICY role_update_inventory_movements ON inventory_movements';
  END IF;
END $$;

CREATE POLICY role_update_inventory_movements ON inventory_movements
  FOR UPDATE
  TO authenticated
  USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage']))
  WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

-- 12. media : role_update_media — WITH_CHECK manquait propriétaire
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'role_update_media' AND polrelid = 'media'::regclass) THEN
    EXECUTE 'DROP POLICY role_update_media ON media';
  END IF;
END $$;

CREATE POLICY role_update_media ON media
  FOR UPDATE
  TO authenticated
  USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole','responsable_élevage']))
  WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole','responsable_élevage']));

-- 13. plots : role_update_plots — WITH_CHECK manquait propriétaire
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'role_update_plots' AND polrelid = 'plots'::regclass) THEN
    EXECUTE 'DROP POLICY role_update_plots ON plots';
  END IF;
END $$;

CREATE POLICY role_update_plots ON plots
  FOR UPDATE
  TO authenticated
  USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole']))
  WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole']));

-- 14. recipes : role_update_recipes — WITH_CHECK manquait propriétaire
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'role_update_recipes' AND polrelid = 'recipes'::regclass) THEN
    EXECUTE 'DROP POLICY role_update_recipes ON recipes';
  END IF;
END $$;

CREATE POLICY role_update_recipes ON recipes
  FOR UPDATE
  TO authenticated
  USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage']))
  WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

-- 15. suppliers : role_update_suppliers — WITH_CHECK manquait propriétaire
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'role_update_suppliers' AND polrelid = 'suppliers'::regclass) THEN
    EXECUTE 'DROP POLICY role_update_suppliers ON suppliers';
  END IF;
END $$;

CREATE POLICY role_update_suppliers ON suppliers
  FOR UPDATE
  TO authenticated
  USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage']))
  WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','comptable','responsable_agricole','responsable_élevage']));

-- 16. surveillance_events : role_update_surveillance_events — WITH_CHECK manquait propriétaire
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'role_update_surveillance_events' AND polrelid = 'surveillance_events'::regclass) THEN
    EXECUTE 'DROP POLICY role_update_surveillance_events ON surveillance_events';
  END IF;
END $$;

CREATE POLICY role_update_surveillance_events ON surveillance_events
  FOR UPDATE
  TO authenticated
  USING (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole','responsable_élevage']))
  WITH CHECK (current_user_has_role(ARRAY['administrateur','propriétaire','gestionnaire','responsable_agricole','responsable_élevage']));
