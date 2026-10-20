/*
# Rollback — Surveillance Events
Supprime la table, les politiques, les indexes, le trigger et la fonction get_farm_id.
À exécuter SEULEMENT si la migration 20261020160000_surveillance_events.sql a été appliquée
et doit être annulée.
*/

-- ============ DROP TRIGGER ============
DROP TRIGGER IF EXISTS trigger_surveillance_updated_at ON public.surveillance_events;

-- ============ DROP POLICIES ============
DROP POLICY IF EXISTS "auth_select_surveillance_events" ON public.surveillance_events;
DROP POLICY IF EXISTS "auth_insert_surveillance_events" ON public.surveillance_events;
DROP POLICY IF EXISTS "auth_update_surveillance_events" ON public.surveillance_events;

-- ============ DROP INDEXES ============
DROP INDEX IF EXISTS idx_surveillance_farm_scheduled;
DROP INDEX IF EXISTS idx_surveillance_plot;
DROP INDEX IF EXISTS idx_surveillance_campaign;
DROP INDEX IF EXISTS idx_surveillance_lot;
DROP INDEX IF EXISTS idx_surveillance_animal;
DROP INDEX IF EXISTS idx_surveillance_project;
DROP INDEX IF EXISTS idx_surveillance_status;
DROP INDEX IF EXISTS idx_surveillance_type;
DROP INDEX IF EXISTS idx_surveillance_deleted;

-- ============ DROP TABLE ============
DROP TABLE IF EXISTS public.surveillance_events;

-- ============ DROP FUNCTION ============
DROP FUNCTION IF EXISTS public.get_farm_id();
-- Note : set_updated_at() partagée, non supprimée.