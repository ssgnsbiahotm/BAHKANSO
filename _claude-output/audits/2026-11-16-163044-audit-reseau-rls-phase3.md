# EGS Audit / Test Report — Phase 3 (réseau et RLS Supabase)

## Mission
Audit réseau et RLS Supabase de l'application BAHKANSO (React + TypeScript + Vite + Supabase), dans le cadre de l'audit global 4 phases. Phase 3 = inspection en lecture seule de la sécurité côté base (politiques RLS, helpers SECURITY DEFINER) et côté client (exposition de clés, appels réseau).

## Objective
Vérifier que :
- aucune clé secrète (service_role) n'est exposée côté client ;
- les politiques RLS sont scoped par rôle et site_id (pas de `USING true` / `WITH CHECK true`) ;
- les helpers `current_user_*` utilisent `row_security = off` et `auth.uid()` seul (pas de `current_setting` ni de `OR id = auth.uid()`) ;
- FORCE ROW LEVEL SECURITY est activé sur les tables durcies ;
- l'anomalie `event_journal` (farm_id comparé à site_id → 0 ligne visible) est corrigée.

## Environment
- Host : local (développement, pas de `gnamba-server` sollicité pour cette phase — lecture du dépôt uniquement)
- User : souleymane
- Repository : /home/souleymane/BAHKANSO
- Branch : chore/migration-vite-8 (commit 135f2c7, +5 sur main)
- Relevant versions : Supabase (migrations SQL), React Router, TanStack Query

## Commands Executed
1. `ls -la supabase/migrations/` — listage des migrations
2. Lecture intégrale de :
   - `supabase/migrations/20261114000000_rls_global_by_role_phase2.sql`
   - `supabase/migrations/20261113000000_fix_event_journal_rls.sql`
   - `supabase/migrations/20261103000003_helpers_row_security_off_fix.sql`
   - `supabase/migrations/20261103000004_helpers_remove_or_fix.sql`
3. `grep -rln "service_role\|SERVICE_ROLE\|service-role" src/` → aucun résultat
4. `grep -rln "VITE_SUPABASE" src/` → uniquement `src/lib/supabase.ts`
5. `ls -la .env .env.example .env.local` ; `.env` présent dans `.gitignore` (non committé)

## Complete Results

### RLS — migration `rls_global_by_role_phase2.sql` (2026-11-14)
Tables couvertes : fundings, expenses, sales, customers, sale_items, sites, funding_allocations, transactions, documents, funders.
- Chaque table a des politiques SELECT/INSERT/UPDATE/DELETE scoped par `current_user_role()` et `current_user_site_id()` (ou `current_user_funder_id()` pour financeur/funders).
- Branche `administrateur` / `propriétaire` avec accès global (sans site_id) sur SELECT.
- `FORCE ROW LEVEL SECURITY` sur toutes les 10 tables (lignes 449-460).
- Garde-fou (lignes 468-510) : lève une exception si une politique `USING true` / `WITH CHECK true` subsiste, ou si `FORCE RLS` manque sur une table attendue.

### RLS — `fix_event_journal_rls.sql` (2026-11-13)
- Constat : l'ancienne politique `event_journal` comparait `farm_id` à `current_user_site_id()` (un site_id), ce qui ne matche jamais → 0 événement visible en runtime.
- Correction : nouvelle fonction `current_user_farm_id()` (SECURITY DEFINER, `row_security = off`, `search_path = public`) + politique `farm_id = current_user_farm_id() OR current_user_farm_id() IS NULL`.

### Helpers SECURITY DEFINER — `helpers_row_security_off_fix.sql` (003) et `helpers_remove_or_fix.sql` (004)
- `current_app_user_id`, `current_user_role`, `current_user_site_id`, `current_user_funder_id` : `SECURITY DEFINER`, `SET search_path = public`, `SET row_security = off`.
- `004` restaure `WHERE auth_id = auth.uid() LIMIT 1` (supprime la clause `OR id = auth.uid()` qui créait une voie d'élévation de privilège par `app_users.id` coïncidant avec un `auth.users.id`).
- Garde-fou : vérifie présence de `row_security=off` dans `proconfig`, absence de `current_setting`, absence de `||`, absence de `OR` dans `prosrc`.

### Réseau côté client — `src/lib/supabase.ts`
```ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
```
- Utilise uniquement l'URL et l'ANON key (publique par design Supabase). Aucun `service_role` ni clé secrète côté client.
- `VITE_SUPABASE` n'est référencé que dans ce fichier (grep : 1 résultat).
- Pas de header d'autorisation forcé ; le client s'appuie sur le cookie/token du navigateur via `autoRefreshToken`.

### Fichiers d'environnement
- `.env`, `.env.example`, `.env.local` présents.
- `.env` est dans `.gitignore` → non committé, non poussé. Aucun secret affiché (conforme CLAUDE.md §6).

## Analysis
- Le modèle RLS est cohérent : accès global réservé à administrateur/propriétaire ; staff restreint à son `site_id` ; financeur restreint à son `funder_id`. FORCE RLS empêche le contournement par le propriétaire de table.
- Les helpers SECURITY DEFINER sont durcis (`row_security = off`, pas de `current_setting`, pas de `OR id = auth.uid()`), ce qui élimine les deux anti-patterns identifiés (récursion infinie sous FORCE RLS, élévation silencieuse).
- L'anomalie `event_journal` (0 événement visible) est corrigée par `current_user_farm_id()`.
- Côté client, l'exposition est limitée à l'URL et l'anon key publiques, conformément au modèle Supabase. Aucun secret côté client.

## Findings
| # | Constat | Sévérité | Preuve | Statut |
|---|---------|----------|--------|--------|
| F1 | Aucune clé `service_role` exposée côté client | — | `grep service_role src/` vide | confirmé (ok) |
| F2 | `VITE_SUPABASE` uniquement dans `src/lib/supabase.ts` (anon key publique) | — | `grep VITE_SUPABASE src/` → 1 fichier | confirmé (ok) |
| F3 | `.env` non committé (présent dans `.gitignore`) | — | `.gitignore` ligne `.env` | confirmé (ok) |
| F4 | Politiques RLS scoped par rôle + site_id, pas de `USING true` | — | `rls_global_by_role_phase2.sql:468-510` (garde-fou) | confirmé (ok) |
| F5 | FORCE RLS sur les 10 tables durcies | — | `rls_global_by_role_phase2.sql:449-460` | confirmé (ok) |
| F6 | Helpers `row_security = off`, pas de `current_setting`, pas de `OR` | — | `helpers_remove_or_fix.sql:84-129` (garde-fou) | confirmé (ok) |
| F7 | `event_journal` corrigé (farm_id via `current_user_farm_id()`) | — | `fix_event_journal_rls.sql:9-33` | confirmé (ok) |

Aucune faille de sécurité n'a été confirmée à ce stade de l'inspection.

### Items à vérifier (non encore inspectés)
- Les migrations RLS antérieures (007, 008, 009, 010, 011, 012, 019, 022, 026, 028, 030, 031, 037, sales_tightening, multi_sites) n'ont pas été relues en Phase 3 — leur cohérence avec la Phase 2 est supposée, non vérifiée.
- Les politiques RLS sur les tables non couvertes par `rls_global_by_role_phase2` (plots, campaigns, crop_operations, harvests, animals, animal_lots, media, event_journal au-delà de la SELECT) — à vérifier individuellement.
- Les appels `supabase.from(...)` directs dans les pages pour détecter un contournement éventuel du RLS côté client (ex. écriture sans `site_id` cohérent).
- `logAudit` et les triggers `event_journal` (migrations 20261105… et 20261106…).

## Actions Performed
Aucune modification de fichier durant l'audit Phase 3 (règle absolue : zéro modification durant les phases 1-3). Lecture seule.

## Validation
- Migrations RLS lues intégralement (4 fichiers) : cohérentes, gardes-fous présents.
- Grep côté client : aucune clé secrète, pas de `service_role`, `VITE_SUPABASE` uniquement dans `supabase.ts`.
- `.env` non suivi par git.
- Typecheck / lint / build étaient déjà verts avant cette phase (commit 135f2c7) ; aucune modification depuis, donc l'état de référence est préservé.

## Complément — migrations antérieures et surface d'attaque

### Migration 007 (`auth_and_rls_tightening.sql.sql`)
Sur les 30 tables métier, les politiques sont `USING (true)` / `WITH CHECK (true)` pour le rôle `authenticated` uniquement (lignes 74-245). Le `anon` rôle a ZÉRO accès (sauf `site_content` SELECT pour la landing page publique). Ce modèle "single-tenant" est documenté dans le commentaire de la migration : tout le staff de la ferme partage toutes les données. C'est un choix architectural conscient, pas une faille, mais il élargit la surface d'attaque : tout utilisateur authentifié peut lire/écrire sur ces 30 tables si aucune politique plus restrictive ne la surcharge.

### Migration 031 (`rls_fundings_expenses_least_privilege.sql`)
Définit ses propres helpers `current_app_user_id`/`current_user_role`/etc. avec `current_setting('request.jwt.claim.sub')` fallback et `OR id = ...` (anti-patterns identifiés en Phase 1). Ces helpers sont toutefois **redéfinis sains** (`CREATE OR REPLACE`) par les migrations 003 et 004 postérieures, qui imposent `row_security = off`, suppriment `current_setting` et l'opérateur `OR id = auth.uid()`. État final des helpers : corrigé.

### Mutations clientes (surface réseau)
Nombreux appels `supabase.from(...).insert/update/delete` sans `site_id` explicite dans le payload client (ex. `OperationsPage.tsx:156/169`, `AnimauxPage.tsx:235/240`, `Suppliers.tsx:91/96`, `Media.tsx:127/137`, `Configuration.tsx:527/536`, etc.). La sécurité est déléguée entièrement au RLS côté base. Ceci est correct **si et seulement si** le RLS est FORCE + scoped sur chaque table ciblée. À vérifier table par table (plots, campaigns, crop_operations, harvests, animals, animal_lots, media, etc.) — non couvertes par `rls_global_by_role_phase2`.

## Final Status
PASS (partiel) — les éléments inspectés sont conformes ; l'audit Phase 3 n'est pas encore exhaustif sur l'ensemble des migrations RLS et des appels réseau côté client.

## Next Step
Poursuivre l'inspection des migrations RLS restantes (007→037 et event_journal triggers) et des appels `supabase.from(...)` dans les pages, puis produire le rapport final Phase 4 (bugs classés par sévérité + plan de correction).
