# Trigger Journal d'Événements — Étape 3/3

Date : 2026-11-06
Branche : main
Commit : feaf55c (HEAD)
Auteur : Claude Code (agent) + validation humaine

## Contexte

La table `event_journal` existe (migration `20261105000000_create_event_journal.sql`). Le test `tests/integration/event-journal.test.mjs` était en `test.fails`, prouvant que le journal restait vide après création d'une dépense (pas de trigger pour l'alimenter).

## Objectif

Créer une nouvelle migration avec :
1. Une fonction générique `log_event()` (SECURITY DEFINER, `row_security = off`).
2. Un trigger `trg_log_expense` sur `expenses` (AFTER INSERT) appelant `log_event()`.
3. Passer le test de `test.fails` à un test normal qui passe.

## Fichiers modifiés

### `supabase/migrations/20261106000000_event_journal_triggers.sql` (nouveau)

- `public.log_event()` : fonction déclencheur SECURITY DEFINER avec `SET search_path = public` et `SET row_security = off`. Récupère le `farm_id` depuis `public.sites` via `NEW.site_id`, puis insère un événement `depense` dans `event_journal` (uniquement si `farm_id` est connu, pour ne pas faire échouer l'insertion de dépense quand le site n'est lié à aucune exploitation).
- `REVOKE ALL ON FUNCTION public.log_event() FROM PUBLIC` : aucun utilisateur ne peut l'appeler directement (seul le trigger l'exécute, avec les droits du propriétaire).
- `DROP TRIGGER IF EXISTS trg_log_expense` + `CREATE TRIGGER trg_log_expense` : AFTER INSERT, FOR EACH ROW sur `public.expenses`.
- Garde-fou DO block : vérifie que `row_security=off` est présent dans `proconfig` et que `current_setting` est absent de `prosrc`.

### `tests/integration/event-journal.test.mjs` (modifié)

- `test.fails` → `test` (test normal, attendu vert).
- Référence de dépense rendue unique (`DEP-JOURNAL-${Date.now()}`) pour éviter les conflits de contrainte `UNIQUE(reference)` entre runs parallèles.
- Assertions renforcées : `entity_type = 'expense'`, `entity_id` = id de la dépense créée, `amount = 1000`.
- `afterAll` nettoie le journal pour la ferme (déjà présent) — la dépense est nettoyée via `teardownFixtures` (suppression des app_users `@test.local` en cascade).

## Validation

1. `supabase db reset` → exit 0, toutes les migrations appliquées dont `20261106000000_event_journal_triggers.sql`, garde-fou `row_security=off` passé.
2. `npx vitest run tests/integration/event-journal.test.mjs` → 1/1 PASS.
3. `npx vitest run tests/integration/` → 12/12 PASS (helpers, rls-fundings, rls-expenses, event-journal).

Note : un test (`current_user_funder_id() retourne NULL pour un comptable`) a montré un timeout intermittent (~5s) quand la suite entière s'exécute, mais passe systématiquement en isolation et à la 3e exécution complète. Ce flakiness pré-existe (déjà observé avant cette étape) et n'est pas lié au trigger.

## Résultat

Le test `event-journal` passe au vert : création d'une dépense alimente automatiquement `event_journal` avec `event_type = 'depense'`, `source_module = 'finance'`, `amount = 1000`, et l'`entity_id` pointe vers la dépense insérée.

## Décisions humaines requises

Aucune.

## Prochaine étape

Aucune. Étape 3/3 terminée.
