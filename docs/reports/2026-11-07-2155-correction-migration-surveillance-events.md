# Correction migration 20261106230000_add_site_id_to_core_tables.sql

Date : 2026-11-07 21:55
Branche : main
Commit : aucun (instruction utilisateur : "Aucun commit")
Auteur : Claude Code (agent) + validation humaine

## Contexte
La migration `20261106230000_add_site_id_to_core_tables.sql` référençait la table `surveillance_events` (via `ALTER TABLE` et `CREATE INDEX`). Cette table a été supprimée par un rollback antérieur (migration `20261020160001_surveillance_events_rollback.sql` fait `DROP TABLE IF EXISTS public.surveillance_events`). Le `supabase db reset` échouait sur cette migration car la table n'existe plus.

## Objectif
Corriger la migration pour qu'elle soit idempotente : envelopper les références à `surveillance_events` dans des vérifications `IF EXISTS`, puis valider que `supabase db reset` passe sans erreur.

## Commands Executed

1. Modification de `supabase/migrations/20261106230000_add_site_id_to_core_tables.sql` :
   - `ALTER TABLE public.surveillance_events ...` → enveloppé dans un `DO $$ ... IF EXISTS (SELECT 1 FROM information_schema.tables WHERE ...) THEN ... END IF; END $$;`
   - `CREATE INDEX IF NOT EXISTS idx_surveillance_events_site ...` → enveloppé de même

2. `supabase db reset` — exécuté, passe sans erreur sur toutes les migrations.

3. `npx vitest run tests/integration/rls-sales.test.mjs` — 3 tests passés.

4. `npx vitest run src/` — 86 tests passés (16 fichiers).

## Complete Results

`supabase db reset` : ✅ passe complètement, toutes les migrations appliquées dont :
- `20261106230000_add_site_id_to_core_tables.sql` (fixé)
- `20261107010000_rls_sales_least_privilege.sql`

RLS sales tests : 3/3 passés.

Unit tests : 86/86 passés (16 fichiers).

## Analysis
Le pattern `IF EXISTS` sur `information_schema.tables` est cohérent avec celui utilisé dans migration `20261103000000_fix_user_sync_ids_and_trigger.sql` (ligne 27-29) qui enveloppe déjà une référence à `surveillance_events` de la même manière.

## Findings
- ✅ Migration `20261106230000` corrigée : plus d'erreur sur `surveillance_events` manquante
- ✅ `supabase db reset` passe sans erreur
- ✅ RLS sales tests (3 tests) passent
- ✅ Tous les tests unitaires (86/86) passent

## Actions Performed
- Modifié `supabase/migrations/20261106230000_add_site_id_to_core_tables.sql` : enveloppé les 2 références à `surveillance_events` (ALTER TABLE + CREATE INDEX) dans des blocs `DO $$ ... IF EXISTS ... END $$;`

## Validation
- `supabase db reset` terminé avec succès (aucune erreur)
- `npx vitest run tests/integration/rls-sales.test.mjs` : 3/3 passés
- `npx vitest run src/` : 86/86 passés

## Final Status
PASS

## Next Step
Aucun commit n'a été effectué (instruction utilisateur : "Aucun commit"). À la demande de l'utilisateur, committer les modifications.