# Correction du test flaky current_user_funder_id()

Date : 2026-11-06 17:10
Branche : main
Commit : c44726f (HEAD, non commit)
Auteur : Claude Code (agent)

## Contexte

Le test `current_user_funder_id() retourne NULL pour un comptable` dans `tests/integration/helpers.test.mjs` timeout parfois (5s) quand toute la suite d'intégration s'exécute. Le problème était attribué à la parallélisation des tests.

## Objectif

Corriger le flaky test en forçant l'exécution en série des tests d'intégration et vérifier que la suite complète (26 tests) passe sans timeout.

## Constats

### Cause réelle (pas seulement la parallélisation)

Le test a été reproduit en isolation (`npx vitest run tests/integration/helpers.test.mjs`) et échouait toujours — ce qui exclut un problème de parallélisation entre fichiers de test.

Analyse du timing :
- `signInWithPassword` contre Supabase local Auth prend ~4s par appel.
- Le test `current_user_funder_id() retourne NULL pour un comptable` a pris **8156ms** (signIn + RPC `current_user_funder_id()` → `current_app_user_id()`).
- Le timeout par défaut de Vitest est **5000ms**, donc le test échoue systématiquement sur ce cas particulier.

Les 5 autres tests de `helpers.test.mjs` passent car leur temps total est proche mais inférieur à 5s.

### `vitest.config.ts` (modifié)

Ajout de :
- `poolOptions.forks.singleFork: true` — force tous les tests à s'exécuter dans un seul fork/process, donc en série au sein de chaque fichier (complément de `fileParallelism: false` qui rend les fichiers sériels entre eux).
- `testTimeout: 30000` — reporte le timeout par défaut à 30s pour couvrir les appels `signInWithPassword` lents (~4s) contre Supabase local.

## Commands Executed

1. `npx vitest run tests/integration/helpers.test.mjs` (avant correction) → 1 échec (timeout 5s sur `current_user_funder_id()` NULL).
2. `npx vitest run tests/integration/helpers.test.mjs --testTimeout=30000` (diagnostic) → 6/6 PASS, le test flaky prend 8156ms.
3. `npx vitest run tests/integration/` (après correction) → 26/26 PASS, 7 fichiers, 56.38s.
4. `rm debug_signin.mjs` (fichier de diagnostic temporaire supprimé).

## Analysis

- `singleFork` garantit l'exécution sérielle des tests au sein de chaque fichier, éliminant les interférences entre tests qui partagent la même base Supabase.
- `testTimeout: 30000` absorbe la latence de `signInWithPassword` (~4s) sans faire échouer des tests légitimes.
- Le test `current_user_funder_id() retourne NULL pour un comptable` passe de façon fiable (8156ms mesuré).

## Findings

- **Confirmé** : le flaky test n'est pas dû à la parallélisation inter-fichiers (échoue aussi en isolation).
- **Confirmé** : la cause est un timeout de 5s dépassé par la latence de Supabase Auth + appel RPC.
- **Confirmé** : `singleFork` + `testTimeout: 30000` résout le problème — 26/26 tests passent.
- **GoTrueClient warnings** : "Multiple GoTrueClient instances detected" sont des avertissements sans gravité (non bloquants).

## Actions Performed

1. Modifié `vitest.config.ts` : ajouté `poolOptions.forks.singleFork: true` et `testTimeout: 30000`.
2. Supprimé `debug_signin.mjs` (diagnostic temporaire).
3. Aucun commit, aucun push.

## Validation

- `npx vitest run tests/integration/` → **26/26 PASS**, 7 fichiers, exit 0, 56.38s.
- `npx vitest run tests/integration/helpers.test.mjs` → 6/6 PASS.

## Final Status

PASS

## Rapport

Rapport écrit : docs/reports/2026-11-06-1710-fix-flaky-test-helpers-funder-id.md
Résumé : Test flaky current_user_funder_id() corrigé via singleFork + testTimeout 30s ; suite complète 26/26 tests verts.
Décisions requises : aucune.
Fichiers modifiés :
- `vitest.config.ts` (modifié)
Prochaine étape : aucune.
