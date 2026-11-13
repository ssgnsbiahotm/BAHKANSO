-- ============================================================================
-- Consolidation du schéma de référence commun (local ↔ distant dnyohupgyorjmuvbyhqk)
-- Option C (squash opérationnel sans suppression de l'historique, CLAUDE.md §16).
--
-- Ce fichier apporte les objets présents uniquement sur le distant et harmonise
-- les contenus divergents (fonctions, politiques RLS, colonnes, index, triggers).
-- Il est IDEMPOTENT : utilisable sur une base qui a déjà les 53 migrations
-- appliquées, aussi bien en local que sur le distant.
--
-- Objets ajoutés (présents uniquement sur le distant) :
--   - public.get_farm_id() (si absente)
--   - public.surveillance_events (table enrichie, RLS, indexes, trigger, grants)
--   - public.event_journal_rejects (table, RLS, grants)
--   - public.event_journal.site_id (+ FK + index)
--   - public.media : title, description, category, updated_at (+ modifications)
--   - public.media_site_id_fkey (FK)
--   - public.rls_auto_enable() + event trigger ensure_rls
--
-- Objets harmonisés (contenus divergents local vs distant) :
--   - Fonctions : current_user_has_role, log_event, handle_new_user, is_staff,
--                 rls_auto_enable, set_updated_at, update_customer_total_purchases
--   - Politiques RLS : sales, media, surveillance_events, event_journal, app_users,
--                      farms, site_content
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Helper get_farm_id() — absent en local (supprimé par le rollback
--    20261020160001), présent sur le distant. Requis par surveillance_events.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_farm_id();
CREATE OR REPLACE FUNCTION public.get_farm_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT id FROM public.farms LIMIT 1;
$function$;

GRANT EXECUTE ON FUNCTION public.get_farm_id() TO PUBLIC, "anon", "authenticated", "service_role", "postgres";

-- ----------------------------------------------------------------------------
-- 2. Table surveillance_events — présente sur le distant, absente en local.
--    Définition enrichie (farm_id NOT NULL DEFAULT get_farm_id(), 7 FK,
--    site_id, 10 indexes, trigger updated_at, RLS, grants).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.surveillance_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id        uuid NOT NULL DEFAULT public.get_farm_id(),
  type           text NOT NULL,
  plot_id        uuid,
  campaign_id    uuid,
  lot_id         uuid,
  animal_id      uuid,
  project_id     uuid,
  label          text NOT NULL,
  description    text,
  scheduled_at   timestamptz NOT NULL,
  completed_at   timestamptz,
  status         text NOT NULL DEFAULT 'planifie'::text,
  cost_amount    numeric(12,2),
  responsible_id uuid,
  details        jsonb NOT NULL DEFAULT '{}'::jsonb,
  deleted_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  site_id        uuid,
  CONSTRAINT chk_completed_when_terminated CHECK (
    (status <> 'termine'::text) OR (completed_at IS NOT NULL)
  ),
  CONSTRAINT surveillance_events_cost_amount_check CHECK (cost_amount >= (0)::numeric),
  CONSTRAINT surveillance_events_label_check CHECK (char_length(label) <= 255),
  CONSTRAINT surveillance_events_status_check CHECK (
    status = ANY (ARRAY['planifie'::text, 'en_cours'::text, 'termine'::text, 'annule'::text])
  ),
  CONSTRAINT surveillance_events_type_check CHECK (
    type = ANY (ARRAY['phyto_traitement'::text, 'equip_panne'::text])
  ),
  CONSTRAINT surveillance_events_animal_id_fkey FOREIGN KEY (animal_id) REFERENCES public.animals(id) ON DELETE SET NULL,
  CONSTRAINT surveillance_events_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE SET NULL,
  CONSTRAINT surveillance_events_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.animal_lots(id) ON DELETE SET NULL,
  CONSTRAINT surveillance_events_plot_id_fkey FOREIGN KEY (plot_id) REFERENCES public.plots(id) ON DELETE SET NULL,
  CONSTRAINT surveillance_events_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL,
  CONSTRAINT surveillance_events_responsible_id_fkey FOREIGN KEY (responsible_id) REFERENCES public.app_users(id) ON DELETE SET NULL,
  CONSTRAINT surveillance_events_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE SET NULL,
  CONSTRAINT surveillance_events_farm_id_fkey FOREIGN KEY (farm_id) REFERENCES public.farms(id) ON DELETE RESTRICT
);

ALTER TABLE public.surveillance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveillance_events FORCE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_surveillance_farm_scheduled
  ON public.surveillance_events (farm_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_surveillance_active
  ON public.surveillance_events (scheduled_at DESC) WHERE (deleted_at IS NULL);
CREATE INDEX IF NOT EXISTS idx_surveillance_animal
  ON public.surveillance_events (animal_id);
CREATE INDEX IF NOT EXISTS idx_surveillance_campaign
  ON public.surveillance_events (campaign_id);
CREATE INDEX IF NOT EXISTS idx_surveillance_events_site
  ON public.surveillance_events (site_id);
CREATE INDEX IF NOT EXISTS idx_surveillance_lot
  ON public.surveillance_events (lot_id);
CREATE INDEX IF NOT EXISTS idx_surveillance_plot
  ON public.surveillance_events (plot_id);
CREATE INDEX IF NOT EXISTS idx_surveillance_project
  ON public.surveillance_events (project_id);
CREATE INDEX IF NOT EXISTS idx_surveillance_status
  ON public.surveillance_events (status);
CREATE INDEX IF NOT EXISTS idx_surveillance_type
  ON public.surveillance_events (type);

-- Trigger updated_at (réutilise set_updated_at si existante, sinon la crée)
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname = 'set_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION public.set_updated_at()
    RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $body$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
    $body$;
  END IF;
END $do$;

DROP TRIGGER IF EXISTS trigger_surveillance_updated_at ON public.surveillance_events;
CREATE TRIGGER trigger_surveillance_updated_at
  BEFORE UPDATE ON public.surveillance_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Politiques RLS surveillance_events (harmonisées avec le distant)
DROP POLICY IF EXISTS "role_delete_surveillance_events" ON public.surveillance_events;
DROP POLICY IF EXISTS "role_insert_surveillance_events" ON public.surveillance_events;
DROP POLICY IF EXISTS "role_select_surveillance_events" ON public.surveillance_events;
DROP POLICY IF EXISTS "role_update_surveillance_events" ON public.surveillance_events;

CREATE POLICY "role_delete_surveillance_events" ON public.surveillance_events
  FOR DELETE TO "authenticated"
  USING (public.current_user_has_role(ARRAY['administrateur'::text]));

CREATE POLICY "role_insert_surveillance_events" ON public.surveillance_events
  FOR INSERT TO "authenticated"
  WITH CHECK (public.current_user_has_role(ARRAY['administrateur'::text, 'gestionnaire'::text, 'responsable_agricole'::text, 'responsable_élevage'::text]));

CREATE POLICY "role_select_surveillance_events" ON public.surveillance_events
  FOR SELECT TO "authenticated"
  USING (public.current_user_has_role(ARRAY['administrateur'::text, 'propriétaire'::text, 'financeur'::text, 'gestionnaire'::text, 'comptable'::text, 'responsable_agricole'::text, 'responsable_élevage'::text, 'auditeur'::text]));

CREATE POLICY "role_update_surveillance_events" ON public.surveillance_events
  FOR UPDATE TO "authenticated"
  USING (public.current_user_has_role(ARRAY['administrateur'::text, 'gestionnaire'::text, 'responsable_agricole'::text, 'responsable_élevage'::text]))
  WITH CHECK (public.current_user_has_role(ARRAY['administrateur'::text, 'gestionnaire'::text, 'responsable_agricole'::text, 'responsable_élevage'::text]));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.surveillance_events TO "anon", "authenticated", "postgres", "service_role";

-- ----------------------------------------------------------------------------
-- 3. Table event_journal_rejects — présente uniquement sur le distant.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_journal_rejects (
  id           uuid NOT NULL DEFAULT gen_random_uuid(),
  source_table text NOT NULL,
  source_id    uuid NOT NULL,
  reason       text NOT NULL,
  payload      jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_journal_rejects_pkey PRIMARY KEY (id)
);

ALTER TABLE public.event_journal_rejects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_journal_rejects FORCE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.event_journal_rejects TO "anon", "authenticated", "postgres", "service_role";

-- ----------------------------------------------------------------------------
-- 4. event_journal.site_id — présente uniquement sur le distant.
-- ----------------------------------------------------------------------------
ALTER TABLE public.event_journal
  ADD COLUMN IF NOT EXISTS site_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE connamespace = 'public'::regnamespace
      AND conrelid = 'public.event_journal'::regclass
      AND conname = 'event_journal_site_id_fkey'
  ) THEN
    ALTER TABLE public.event_journal
      ADD CONSTRAINT event_journal_site_id_fkey
      FOREIGN KEY (site_id) REFERENCES public.sites(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS event_journal_site_date
  ON public.event_journal (site_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS event_journal_site_type
  ON public.event_journal (site_id, event_type, occurred_at DESC);

-- ----------------------------------------------------------------------------
-- 5. Extensions de la table media — présentes uniquement sur le distant.
-- ----------------------------------------------------------------------------
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.media
  ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.media
  ALTER COLUMN type DROP NOT NULL;
ALTER TABLE public.media
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());

-- Supprimer l'ancienne FK site_id si elle a une définition différente, puis recréer
DO $do$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE connamespace = 'public'::regnamespace
      AND conrelid = 'public.media'::regclass
      AND conname = 'media_site_id_fkey'
  ) THEN
    ALTER TABLE public.media DROP CONSTRAINT media_site_id_fkey;
  END IF;
END $do$;

ALTER TABLE public.media
  ADD CONSTRAINT media_site_id_fkey
  FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_media_site ON public.media (site_id);

-- Politiques RLS media (harmonisées avec le distant)
DROP POLICY IF EXISTS "role_delete_media" ON public.media;
DROP POLICY IF EXISTS "role_insert_media" ON public.media;
DROP POLICY IF EXISTS "role_select_media" ON public.media;
DROP POLICY IF EXISTS "role_update_media" ON public.media;
DROP POLICY IF EXISTS "media_insert_scoped" ON public.media;
DROP POLICY IF EXISTS "media_select_scoped" ON public.media;

CREATE POLICY "role_delete_media" ON public.media
  FOR DELETE TO "authenticated"
  USING (public.current_user_has_role(ARRAY['administrateur'::text]));

CREATE POLICY "role_insert_media" ON public.media
  FOR INSERT TO "authenticated"
  WITH CHECK (public.current_user_has_role(ARRAY['administrateur'::text, 'gestionnaire'::text, 'responsable_agricole'::text, 'responsable_élevage'::text]));

CREATE POLICY "role_select_media" ON public.media
  FOR SELECT TO "authenticated"
  USING (public.current_user_has_role(ARRAY['administrateur'::text, 'propriétaire'::text, 'financeur'::text, 'gestionnaire'::text, 'comptable'::text, 'responsable_agricole'::text, 'responsable_élevage'::text, 'auditeur'::text]));

CREATE POLICY "role_update_media" ON public.media
  FOR UPDATE TO "authenticated"
  USING (public.current_user_has_role(ARRAY['administrateur'::text, 'gestionnaire'::text, 'responsable_agricole'::text, 'responsable_élevage'::text]))
  WITH CHECK (public.current_user_has_role(ARRAY['administrateur'::text, 'gestionnaire'::text, 'responsable_agricole'::text, 'responsable_élevage'::text]));

-- ----------------------------------------------------------------------------
-- 6. Fonction rls_auto_enable() + event trigger ensure_rls — uniquement distant.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
  tbl name;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table', 'partitioned table')
  LOOP
    IF cmd.schema_name IS NOT NULL
       AND cmd.schema_name IN ('public')
       AND cmd.schema_name NOT IN ('pg_catalog', 'information_schema')
       AND cmd.schema_name NOT LIKE 'pg_toast%'
       AND cmd.schema_name NOT LIKE 'pg_temp%'
    THEN
      BEGIN
        SELECT c.relname INTO tbl
        FROM pg_catalog.pg_class c WHERE c.oid = cmd.objid;
        EXECUTE format('alter table if exists %I.%I enable row level security', cmd.schema_name, tbl);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
    ELSE
      RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
    END IF;
  END LOOP;
END;
$function$;

DROP EVENT TRIGGER IF EXISTS ensure_rls;
CREATE EVENT TRIGGER ensure_rls
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION public.rls_auto_enable();

-- ----------------------------------------------------------------------------
-- 7. Harmonisation des fonctions divergentes (création ou remplacement).
-- ----------------------------------------------------------------------------
-- current_user_has_role
CREATE OR REPLACE FUNCTION public.current_user_has_role(allowed_roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.app_users
    WHERE auth_id = auth.uid()
      AND active = true
      AND role = ANY(allowed_roles)
  );
$function$;

COMMENT ON FUNCTION public.current_user_has_role(text[]) IS
  'SECURITY DEFINER : lit app_users en bypassant RLS pour éviter la récursion.';

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.app_users (id, auth_id, email, name, role, active)
  VALUES (
    NEW.id,
    NEW.id,
    LOWER(NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'name',
             NEW.raw_user_meta_data->>'full_name',
             split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'gestionnaire'),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    auth_id = EXCLUDED.auth_id,
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, app_users.name);
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Trigger AFTER INSERT sur auth.users → upsert idempotent dans app_users.
  Ne lève jamais d''exception (RETURN NEW en tout cas).
  ON CONFLICT DO UPDATE préserve role/active existants.
  SECURITY DEFINER requis pour écrire dans app_users depuis auth trigger.';

-- log_event (version harmonisée avec le distant)
CREATE OR REPLACE FUNCTION public.log_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $function$
DECLARE
  v_site_id uuid;
  v_site_farm_id uuid;
  v_farm_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'project_steps' THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME IN ('expenses', 'harvests', 'sales') THEN
    v_site_id := NEW.site_id;
    v_farm_id := NEW.farm_id;
  ELSIF TG_TABLE_NAME = 'animal_events' THEN
    SELECT a.site_id INTO v_site_id
    FROM public.animals a WHERE a.id = NEW.animal_id;
  ELSE
    RAISE EXCEPTION 'log_event : table non prise en charge : %', TG_TABLE_NAME;
  END IF;

  SELECT s.farm_id INTO v_site_farm_id
  FROM public.sites s WHERE s.id = v_site_id;

  IF v_farm_id IS NOT NULL
     AND v_site_farm_id IS NOT NULL
     AND v_farm_id <> v_site_farm_id THEN
    RAISE EXCEPTION 'log_event : ferme source % différente de la ferme du site %', v_farm_id, v_site_farm_id;
  END IF;

  v_farm_id := COALESCE(v_farm_id, v_site_farm_id);

  IF v_farm_id IS NULL THEN
    RAISE WARNING 'Journal non alimenté : table=%, id=%, site=% ; ferme inconnue',
      TG_TABLE_NAME, NEW.id, v_site_id;
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'expenses' THEN
    INSERT INTO public.event_journal (
      farm_id, site_id, occurred_at, event_type, entity_type, entity_id,
      actor_id, amount, currency, source_module, context
    ) VALUES (
      v_farm_id, v_site_id, NEW.date, 'depense', 'expense', NEW.id,
      NEW.created_by, NEW.amount, COALESCE(NEW.currency, 'XOF'), 'finance',
      jsonb_build_object('category', NEW.category, 'supplier_id', NEW.supplier_id)
    );
  ELSIF TG_TABLE_NAME = 'harvests' THEN
    INSERT INTO public.event_journal (
      farm_id, site_id, occurred_at, event_type, entity_type, entity_id,
      actor_id, quantity, unit, currency, source_module, context
    ) VALUES (
      v_farm_id, v_site_id, NEW.date, 'recolte', 'harvest', NEW.id,
      NULL, NEW.quantity, NEW.unit, 'XOF', 'culture',
      jsonb_build_object('campaign_id', NEW.campaign_id)
    );
  ELSIF TG_TABLE_NAME = 'sales' THEN
    INSERT INTO public.event_journal (
      farm_id, site_id, occurred_at, event_type, entity_type, entity_id,
      actor_id, amount, currency, source_module, context
    ) VALUES (
      v_farm_id, v_site_id, NEW.date, 'recette', 'sale', NEW.id,
      NEW.created_by, NEW.total_amount, 'XOF', 'finance',
      jsonb_build_object('customer_id', NEW.customer_id, 'status', NEW.status)
    );
  ELSIF TG_TABLE_NAME = 'animal_events' THEN
    INSERT INTO public.event_journal (
      farm_id, site_id, occurred_at, event_type, entity_type, entity_id,
      actor_id, amount, currency, source_module, context
    ) VALUES (
      v_farm_id, v_site_id, NEW.date, NEW.type, 'animal', NEW.animal_id,
      NULL, COALESCE(NEW.cost, 0), 'XOF', 'elevage',
      jsonb_build_object('event_id', NEW.id, 'lot_id', NEW.lot_id,
                         'description', NEW.description, 'responsible', NEW.responsible)
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- is_staff
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.app_users
    WHERE auth_id = auth.uid()
      AND (active IS NULL OR active = true)
  );
$function$;

-- set_updated_at (si pas déjà créée avec la définition complète)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
$function$;

-- update_customer_total_purchases
CREATE OR REPLACE FUNCTION public.update_customer_total_purchases()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.customers
    SET total_purchases = total_purchases + NEW.total_amount,
        updated_at = now()
    WHERE id = NEW.customer_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.customers
    SET total_purchases = total_purchases - OLD.total_amount,
        updated_at = now()
    WHERE id = OLD.customer_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.customers
    SET total_purchases = total_purchases - OLD.total_amount + NEW.total_amount,
        updated_at = now()
    WHERE id = NEW.customer_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

-- ----------------------------------------------------------------------------
-- 8. Harmonisation des politiques RLS sales (version distant, least-privilege).
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "sales_select_scoped" ON public.sales;
DROP POLICY IF EXISTS "sales_write_scoped" ON public.sales;

CREATE POLICY "sales_select_scoped" ON public.sales
  FOR SELECT TO "authenticated"
  USING (
    public.current_user_role() IN
      ('proprietaire', 'administrateur', 'gestionnaire', 'comptable', 'auditeur', 'chef_chantier')
    AND sales.site_id = public.current_user_site_id()
  );

CREATE POLICY "sales_write_scoped" ON public.sales
  FOR ALL TO "authenticated"
  USING (
    public.current_user_role() IN
      ('proprietaire', 'administrateur', 'gestionnaire', 'comptable', 'auditeur', 'chef_chantier')
    AND sales.site_id = public.current_user_site_id()
  )
  WITH CHECK (
    public.current_user_has_role(ARRAY['administrateur'::text, 'gestionnaire'::text])
    AND sales.site_id = public.current_user_site_id()
  );

ALTER TABLE public.sales FORCE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 9. Politiques RLS supplémentaires (harmonisées avec le distant).
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON public.app_users;
DROP POLICY IF EXISTS "public_read_farms" ON public.farms;
DROP POLICY IF EXISTS "public_read_site_content" ON public.site_content;

CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" ON public.app_users
  FOR SELECT TO "authenticated"
  USING ((auth.uid() = auth_id));

CREATE POLICY "public_read_farms" ON public.farms
  FOR SELECT TO "anon", "authenticated"
  USING (true);

CREATE POLICY "public_read_site_content" ON public.site_content
  FOR SELECT TO "anon", "authenticated"
  USING (true);

-- ----------------------------------------------------------------------------
-- 10. Garde-fous de validation (lèvent une exception si l'état n'est pas conforme).
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT (SELECT relforcerowsecurity FROM pg_class
          WHERE oid = 'public.sales'::regclass) THEN
    RAISE EXCEPTION 'FORCE ROW LEVEL SECURITY manquant sur sales';
  END IF;
END $$;

-- Commentaires
COMMENT ON TABLE public.event_journal_rejects IS
  'Rejets du journal d''événements (lignes non journalisables par log_event).';
COMMENT ON TABLE public.surveillance_events IS
  'Événements de surveillance (phyto_traitement, equip_panne) — schéma consolidé local ↔ distant.';
