-- Migration 013: Correction fonctions SECURITY DEFINER (A4)
-- Fix: search_path mutable + exposition anon/authenticated
-- Date: 2026-10-21

-- 1. is_staff : passer en SECURITY INVOKER + search_path
-- (Remplacée logiquement par current_user_has_role() dans migration 010)
ALTER FUNCTION public.is_staff() SECURITY INVOKER;
ALTER FUNCTION public.is_staff() SET search_path = 'public';

-- Révoquer l'exécution publique (anon/authenticated)
REVOKE EXECUTE ON FUNCTION public.is_staff() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_staff() FROM authenticated;

-- 2. set_updated_at : ajouter search_path (trigger helper, pas de SECURITY DEFINER)
ALTER FUNCTION public.set_updated_at() SET search_path = 'public';

-- 3. handle_new_user : trigger auth, ne doit pas être callable via RPC
-- Laisser en SECURITY DEFINER (nécessaire pour créer app_users) mais révoquer EXECUTE public
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- 4. rls_auto_enable : fonction admin, ne doit pas être callable par utilisateurs
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;

-- 5. Optionnel : limiter l'exécution aux rôles de service (si besoin ultérieur)
-- GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;
-- GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

COMMENT ON FUNCTION public.is_staff() IS 'Déprécié : utiliser current_user_has_role(). Conservé pour compatibilité. SECURITY INVOKER + search_path fixé.';
COMMENT ON FUNCTION public.set_updated_at() IS 'Trigger helper pour updated_at. search_path fixé.';
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger auth.users → insert app_users. SECURITY DEFINER requis, EXECUTE révoqué sur anon/authenticated.';
COMMENT ON FUNCTION public.rls_auto_enable() IS 'Utilitaire admin RLS. EXECUTE révoqué sur anon/authenticated.';