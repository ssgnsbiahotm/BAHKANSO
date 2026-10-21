/*
# Bahkanso — Rattachement des sites aux exploitations et cohérence des opérations

## Périmètre de cette migration
1. Ajout de `sites.farm_id → farms.id` (rattachement d'un site à une exploitation).
2. Cohérence des `crop_operations` avec leurs parcelles et campagnes :
   - une opération peut être liée à une parcelle OU à une campagne ;
   - lorsqu'une campagne est choisie, sa parcelle fait référence ;
   - une contradiction campaign_id / plot_id refuse l'écriture ;
   - les anciennes opérations non rattachées sont conservées (NULL autorisé).
3. Autorisation administrateur côté base pour le premier rattachement (et tout transfert)
   d'un site à une exploitation (fonction + trigger SECURITY DEFINER).

## Conventions du dépôt respectées
- Aucune migration déjà appliquée n'est modifiée.
- `CREATE ... IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `CREATE OR REPLACE FUNCTION`.
- RLS conservé sur toutes les tables (aucune politique permissive ajoutée).
- `SET search_path = 'public'` sur toutes les fonctions.
- Colonnes de clé primaire `gen_random_uuid()`, montants `numeric`, horodateurs `timestamptz`.

## Tables / colonnes de référence (schéma réel, migrations 001 et 002)
- `farms(id, ...)` — exploitation (déjà présente, migration 001).
- `sites(id, name, ...)` — pas encore de `farm_id` (ajout ici).
- `plots(id, ..., site_id, ...)` — `site_id → sites(id)` (déjà présent).
- `campaigns(id, year, plot_id, ...)` — `plot_id → plots(id)` (déjà présent).
- `crop_operations(id, campaign_id, plot_id, ...)` — `campaign_id → campaigns(id)`, `plot_id → plots(id)` (déjà présent).
- `app_users(id, ..., role)` — rôle 'administrateur' reconnu (mécanisme existant, migration 001 + seed).

## Hors périmètre de ce lot (signalés, non traités)
- `expenses.farm_id` : ajout préparatoire futur, non réalisé ici.
- `user_farms(user_id, farm_id)` : ajout futur, non réalisé ici.
*/

-- ============================================================
-- 1. RATTACHEMENT DES SITES AUX EXPLOITATIONS (sites.farm_id)
-- ============================================================

ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS farm_id uuid REFERENCES public.farms(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sites_farm ON public.sites(farm_id);

-- ============================================================
-- 2. MÉCANISME DE RECONNAISSANCE DES ADMINISTRATEURS
--    (repose sur la colonne existante app_users.role = 'administrateur')
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_app_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM public.app_users
  WHERE id = p_user_id;

  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  RETURN v_role = 'administrateur';
END;
$$;

-- ============================================================
-- 3. PREMIER RATTACHEMENT / TRANSFERT DE SITE — AUTORISATION ADMIN
-- ============================================================
-- La fonction de rattachement s'exécute en SECURITY DEFINER pour pouvoir lire app_users
-- (soumis à RLS) et écrire sur sites indépendamment des politiques de l'invokeur.
-- Un utilisateur non administrateur se voit refuser l'écriture.

CREATE OR REPLACE FUNCTION public.attach_site_to_farm(
  p_site_id uuid,
  p_farm_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Seul un administrateur peut rattacher ou transférer un site à une exploitation.
  IF NOT public.is_app_admin(p_user_id) THEN
    RAISE EXCEPTION 'Seul un administrateur peut rattacher un site à une exploitation';
  END IF;

  UPDATE public.sites
  SET farm_id = p_farm_id
  WHERE id = p_site_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Site introuvable: %', p_site_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.attach_site_to_farm(uuid, uuid, uuid) TO authenticated;

-- Trigger de garde : toute modification directe de sites.farm_id exige un administrateur.
-- L'utilisateur courant est transmis via la variable de session app.current_user_id (définie
-- par l'application avant toute mutation, équivalent de l'identifiant auth dans Supabase).

CREATE OR REPLACE FUNCTION public.guard_site_farm_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_current_user uuid;
BEGIN
  IF NEW.farm_id IS DISTINCT FROM OLD.farm_id THEN
    v_current_user := current_setting('app.current_user_id', true)::uuid;

    IF v_current_user IS NULL THEN
      RAISE EXCEPTION
        'Utilisateur courant non défini (app.current_user_id). Rattachement de site interdit.';
    END IF;

    IF NOT public.is_app_admin(v_current_user) THEN
      RAISE EXCEPTION
        'Seul un administrateur peut modifier le rattachement d''un site à une exploitation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_site_farm_change ON public.sites;
CREATE TRIGGER guard_site_farm_change
BEFORE UPDATE OF farm_id ON public.sites
FOR EACH ROW EXECUTE FUNCTION public.guard_site_farm_change();

-- ============================================================
-- 4. COHÉRENCE DES OPÉRATIONS CULTURALES (campagne ↔ parcelle)
-- ============================================================

CREATE OR REPLACE FUNCTION public.verify_crop_operation_consistency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $$
DECLARE
  v_campaign_plot uuid;
BEGIN
  IF NEW.campaign_id IS NOT NULL THEN
    SELECT plot_id INTO v_campaign_plot
    FROM public.campaigns
    WHERE id = NEW.campaign_id;

    IF v_campaign_plot IS NULL THEN
      RAISE EXCEPTION 'campagne introuvable: %', NEW.campaign_id;
    END IF;

    -- Lorsqu'une campagne est choisie, sa parcelle fait référence.
    IF NEW.plot_id IS NULL THEN
      NEW.plot_id := v_campaign_plot;
    ELSIF NEW.plot_id <> v_campaign_plot THEN
      RAISE EXCEPTION
        'Contradiction campaign_id / plot_id : la parcelle % n''appartient pas à la campagne % (parcelle de la campagne: %)',
        NEW.plot_id, NEW.campaign_id, v_campaign_plot;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS verify_crop_operation_consistency ON public.crop_operations;
CREATE TRIGGER verify_crop_operation_consistency
BEFORE INSERT OR UPDATE ON public.crop_operations
FOR EACH ROW EXECUTE FUNCTION public.verify_crop_operation_consistency();

-- Empêche le changement de la parcelle d'une campagne si des opérations y sont rattachées,
-- afin d'éviter de rendre des opérations existantes incohérentes (parent utilisé).
CREATE OR REPLACE FUNCTION public.guard_campaign_plot_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.plot_id IS DISTINCT FROM OLD.plot_id THEN
    IF EXISTS (
      SELECT 1
      FROM public.crop_operations
      WHERE campaign_id = OLD.id
    ) THEN
      RAISE EXCEPTION
        'Impossible de modifier la parcelle de la campagne % : des opérations y sont déjà rattachées.',
        OLD.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_campaign_plot_change ON public.campaigns;
CREATE TRIGGER guard_campaign_plot_change
BEFORE UPDATE OF plot_id ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.guard_campaign_plot_change();

-- ============================================================
-- 5. INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_crop_operations_campaign_plot
  ON public.crop_operations(campaign_id, plot_id);
