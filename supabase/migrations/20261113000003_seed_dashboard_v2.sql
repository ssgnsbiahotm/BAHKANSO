-- ============================================================================
-- Seed idempotent pour le Dashboard V2
--
-- Données de test nécessaires après `supabase db reset` :
-- 1. farm_id sur les sites sans farm_id (exploitation Ferme AgroVision)
-- 2. site_id sur l'utilisateur e2e@bahkanso.ci
-- 3. 3 expenses de test (125k, 180k, 220k, status 'valide')
-- 4. 3 event_journal 'recette' (850k, 1200k, 950k)
--
-- Idempotent : rejouable sans erreur ni doublon. Aucune modification de schéma.
-- ============================================================================

-- 1. Rattacher les sites sans farm_id à l'exploitation principale (Ferme AgroVision)
UPDATE public.sites
SET farm_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE farm_id IS NULL;

-- 2. Rattacher l'utilisateur e2e à un site de l'exploitation
UPDATE public.app_users
SET site_id = (
  SELECT id FROM public.sites
  WHERE farm_id = '00000000-0000-0000-0000-000000000001'::uuid
  ORDER BY name
  LIMIT 1
)
WHERE email = 'e2e@bahkanso.ci'
  AND site_id IS NULL;

-- 3. 3 expenses de test (idempotent via référence unique)
INSERT INTO public.expenses (id, reference, date, amount, currency, category, status, description, created_by)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'DEP-SEED-001', (CURRENT_DATE - interval '5 days')::date, 125000, 'FCFA', 'Alimentation', 'valide', 'Alimentation bovins (seed dashboard)', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'DEP-SEED-002', (CURRENT_DATE - interval '45 days')::date, 180000, 'FCFA', 'Engrais', 'valide', 'Engrais NPK (seed dashboard)', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'DEP-SEED-003', (CURRENT_DATE - interval '95 days')::date, 220000, 'FCFA', 'Carburant', 'valide', 'Carburant tracteur (seed dashboard)', NULL)
ON CONFLICT (reference) DO NOTHING;

-- 4. 3 event_journal 'recette' (idempotent via id stable, INSERT direct sans trigger)
INSERT INTO public.event_journal (id, farm_id, occurred_at, event_type, entity_type, entity_id, amount, currency, source_module, context)
VALUES
  ('bda0bfeb-0ece-4e95-9c78-f2504419e57a', '00000000-0000-0000-0000-000000000001', (CURRENT_DATE - interval '10 days')::timestamptz, 'recette', 'sale', 'aaaaaaaa-0000-0000-0000-000000000101', 850000, 'XOF', 'finance', '{"seed": "dashboard-v2"}'),
  ('b6288bd0-8a61-472e-ab8a-f7923352b439', '00000000-0000-0000-0000-000000000001', (CURRENT_DATE - interval '50 days')::timestamptz, 'recette', 'sale', 'aaaaaaaa-0000-0000-0000-000000000102', 1200000, 'XOF', 'finance', '{"seed": "dashboard-v2"}'),
  ('a880aa44-7722-4721-a964-a28fc7b1675c', '00000000-0000-0000-0000-000000000001', (CURRENT_DATE - interval '80 days')::timestamptz, 'recette', 'sale', 'aaaaaaaa-0000-0000-0000-000000000103', 950000, 'XOF', 'finance', '{"seed": "dashboard-v2"}')
ON CONFLICT (id) DO NOTHING;
