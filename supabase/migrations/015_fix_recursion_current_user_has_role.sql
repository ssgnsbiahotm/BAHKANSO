-- Migration 015: Fix récursion current_user_has_role + policies app_users
-- Utilise CREATE OR REPLACE pour éviter de casser les dépendances
-- Date: 2026-10-21

-- 1. Recréer la fonction en SECURITY DEFINER (bypass RLS sur app_users)
-- CREATE OR REPLACE garde les policies existantes attachées
CREATE OR REPLACE FUNCTION public.current_user_has_role(allowed_roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_id = auth.uid()
    AND active = true
    AND role = ANY(allowed_roles)
  );
$$;

COMMENT ON FUNCTION public.current_user_has_role(text[]) IS
'SECURITY DEFINER : lit app_users en bypassant RLS pour éviter la récursion.
Utilisée dans toutes les policies role_*.';

-- 2. Index pour perf sur app_users(auth_id) si manquant
CREATE INDEX IF NOT EXISTS idx_app_users_auth_id ON app_users(auth_id);
CREATE INDEX IF NOT EXISTS idx_app_users_role_active ON app_users(role, active) WHERE active = true;