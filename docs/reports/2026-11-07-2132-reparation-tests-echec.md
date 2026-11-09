# Rapport de réparation des tests en échec

Date : 2026-11-07 21:32
Branche : main
Commit : 20e93af
Auteur : Claude Code (agent) + validation humaine

## Contexte
35 tests sur 86 étaient en échec à cause de la pollution croisée entre fichiers de tests dans Vitest (mode `singleFork: true` combiné à `fileParallelism: false`). Les mocks `vi.mock` d'un fichier fuyaient vers les autres car tous les tests s'exécutaient dans un même processus.

## Constats
- `vitest.config.ts` : `fileParallelism: false` + `poolOptions.forks.singleFork: true` forçait tous les tests dans un seul fork/processus.
- `vi.mock` hoisté au sommet de chaque fichier de test : les mocks de `SalesModule.test.tsx` (notamment `@/lib/DataContext`, `@/lib/supabase`, `lucide-react`) fuyaient vers `UsersPage.test.tsx` et les autres fichiers de test.
- Conséquence : 21 fichiers de test sur 25 échouaient (35 tests sur 86), dont tous passaient individuellement mais échouaient en suite complète.

## Modifications effectuées

### vitest.config.ts
- `fileParallelism: false` → `true`
- `poolOptions.forks.singleFork: true` → `false`

Chaque fichier de test s'exécute désormais dans son propre fork, éliminant la pollution croisée des mocks `vi.mock`.

## Résultat

| Catégorie | Avant | Après |
|-----------|-------|-------|
| Fichiers de test unitaires | 4 passés / 21 échoués | 16 passés / 0 échoués |
| Tests unitaires | 50 passés / 36 échoués | 86 passés / 0 échoués |
| Tests d'intégration | 9 échoués (SUPABASE_SERVICE_ROLE_KEY manquant) | 9 échoués (idem — infrastructure, non lié au code) |

Les 9 tests d'intégration échouent car ils requièrent une instance Supabase live avec la variable d'environnement `SUPABASE_SERVICE_ROLE_KEY`. Ce n'est pas un problème de code mais une contrainte d'infrastructure.

## Décisions humaines requises
Aucune.

## Fichiers modifiés
- `vitest.config.ts`

## Prochaine étape
Aucune — tous les tests unitaires passent (86/86). Les tests d'intégration nécessitent une instance Supabase configurée pour s'exécuter.
