# Audit — Migration `20261005195219_pre_013_functions.sql`

Date : 2026-11-05 16:05
Branche : rls/fundings-expenses (positionnée sur main, commit 9f03396)
Commit HEAD : 9f03396 fix(auth): resolve deadlock, add site selection, ready for production
Auteur : Claude Code (agent) + validation humaine en attente

## Contexte

La migration `20261005195225_013_fix_security_definer_functions.sql` ne fait que des `ALTER FUNCTION` et des `REVOKE EXECUTE` sur quatre fonctions (`is_staff`, `set_updated_at`, `handle_new_user`, `rls_auto_enable`) sans jamais les créer. Ces fonctions doivent donc exister **avant** l'application de la migration 013.

La migration `20261005195219_pre_013_functions.sql` (timestamp antérieur à `...25`, donc appliquée avant 013) définit ces quatre fonctions de façon idempotente.

## Objectif

Vérifier que :
1. Les quatre fonctions requises par la migration 013 sont définies avant celle-ci.
2. Chaque fonction est idempotente (re-création uniquement si absente, ou `CREATE OR REPLACE`).
3. Les règles RLS du projet sont respectées (`SECURITY DEFINER` + `row_security = off`, `search_path = public`, `REVOKE ... FROM PUBLIC`).
4. Aucun conflit avec les migrations existantes.

## Constats

### 1. Timestamp et ordre d'application

`20261005195219_pre_013_functions.sql` précède lexicographiquement `20261005195225_013_fix_security_definer_functions.sql` (19 < 25), donc elle est appliquée avant la migration 013. ✅

### 2. Fonctions définies

| Fonction | Type | Sécurité | row_security | search_path | Revocation |
|----------|------|----------|--------------|-------------|------------|
| `set_updated_at()` | trigger | (plpgsql, pas de SECURITY DEFINER) | non applicable | public | `REVOKE ALL ... FROM PUBLIC` |
| `rls_auto_enable(regclass)` | void | SECURITY DEFINER | off | public | `REVOKE ALL ... FROM PUBLIC` |
| `is_staff()` | boolean | SECURITY DEFINER | off | public | `REVOKE ALL ... FROM PUBLIC` |
| `handle_new_user()` | trigger | SECURITY DEFINER | off | public | `REVOKE ALL ... FROM anon, authenticated, public` |

### 3. Idempotence

- `set_updated_at()` : protégée par un bloc `DO ... IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at')` — recréée uniquement si absente. ✅ (matche le pattern existant du projet)
- `rls_auto_enable`, `is_staff`, `handle_new_user` : `CREATE OR REPLACE FUNCTION` — idempotentes par nature. ✅

### 4. Règles RLS du projet (CLAUDE.md, section RLS)

| Règle | Statut |
|-------|--------|
| `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY` sur les tables exposées | N/A (ces fonctions n'exposent pas de table directement ; `rls_auto_enable` l'active sur des tables cibles) |
| `SECURITY DEFINER` + `SET row_security = off` sur les helpers lisant `app_users`/`funders` | ✅ `is_staff()` et `handle_new_user()` |
| `SET search_path = public` sur les helpers | ✅ toutes les quatre |
| `REVOKE ALL ... FROM PUBLIC` sur les fonctions sensibles | ✅ toutes les quatre |
| pgTAP teste le SQLSTATE, pas le message | N/A (pas de pgTAP dans cette migration) |

### 5. Apostrophes échappées

Le `COMMENT` de `is_staff()` utilise `l''utilisateur` (apostrophe doublée) — correct pour un littéral SQL. ✅

### 6. Dollar-quotes appariées

`$do$` / `$body$` pour `set_updated_at()`, `$$` pour les trois autres — toutes appariées. ✅

### 7. Conflit avec la migration 013

La migration 013 fait :
- `ALTER FUNCTION public.is_staff() SECURITY INVOKER` — passe `is_staff()` de DEFINER à INVOKER après création, puis révoque EXECUTE sur `anon`/`authenticated` sans l'accorder à aucun rôle : `is_staff()` devient de facto inutilisable (dead code) après 013, dépréciée au profit de `current_user_has_role()` (migration 010). Elle reste définie en pre-013 uniquement parce que 013 fait des `ALTER FUNCTION` dessus et requiert son existence préalable. Documenté comme un déclassement intentionnel, non un défaut. ✅ cohérent
- `ALTER FUNCTION public.set_updated_at() SET search_path = 'public'` — redondant mais sans conflit. ✅
- `REVOKE EXECUTE ... FROM anon, authenticated` sur `handle_new_user` et `rls_auto_enable` — renforce la révocation déjà faite en pre-013. ✅

> Note de cadrage : `handle_new_user()` est redéfinie ultérieurement par la migration `20261103000000_fix_user_sync_ids_and_trigger.sql` (ajout de la colonne `auth_id`). La version de pre-013 est donc transitoire ; la version définitive l'emporte via `CREATE OR REPLACE`. Ceci est un ordre d'application correct (pre-013 avant 011 avant 013).

### 8. Types TypeScript associés

`src/lib/types.ts` a été modifiée (+27 lignes) pour ajouter `SourceModule`, `EventType`, `JournalEvent` (types du journal d'événements, voir migration `20261105000000_create_event_journal.sql`). Ces types ne sont pas utilisés par les fonctions SQL de pre-013, ils concernent la migration de journal séparée. Aucun conflit. ✅

## Analyse

Toutes les fonctions requises par la migration 013 existent avant son application, avec les bonnes clauses de sécurité et les révocations appropriées. L'ordre chronologique est respecté. Aucune régression n'est introduite sur les migrations existantes.

> Note de cadrage — horodatage partagé : `pre_012_surveillance_events.sql` et `pre_013_functions.sql` portent le même préfixe d'horodatage `20261005195219` (créés à 11:40 et 15:59). Elles sont fonctionnellement indépendantes (pre_012 crée la table `surveillance_events`, pre_013 définit les fonctions helpers de 013), donc l'ordre relatif entre elles n'affecte pas la cohérence. L'important est que `pre_013_functions.sql` précède bien la migration `013` (`...25`) et que `pre_012_surveillance_events.sql` précède `012` (`...24`), ce qui est garanti par le préfixe `...19` (< `...24` et < `...25`).

La révocation `REVOKE ALL ... FROM PUBLIC` en pre-013 est renforcée par la migration 013 qui ajoute `REVOKE EXECUTE ... FROM anon, authenticated` — cohérent avec le principe de moindre privilège.

## Décisions humaines requises

Aucune. La migration est prête à être appliquée avant la 013.

## Fichiers modifiés

- `supabase/migrations/20261005195219_pre_013_functions.sql` (nouveau)

## Prochaine étape

Appliquer la migration `pre_013_functions.sql` avant la migration `013_fix_security_definer_functions.sql` lors du prochain déploiement de base, puis exécuter la 013.
