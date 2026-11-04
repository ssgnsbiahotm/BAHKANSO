# Tests d'intégration Supabase

Ces tests valident les helpers `current_*` et les politiques RLS avec un
VRAI JWT (pgTAP ne peut pas les tester, voir CLAUDE.md § RLS).

## Prérequis
- `supabase start` (base locale démarrée)
- Variables d'environnement : `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (récupérées via `supabase status`)

## Lancer

```bash
SUPABASE_SERVICE_ROLE_KEY=$(supabase status -o env \
  | grep SERVICE_ROLE_KEY | cut -d= -f2) \
SUPABASE_ANON_KEY=$(supabase status -o env \
  | grep ANON_KEY | cut -d= -f2) \
npx vitest run tests/integration/
```

## Fichiers

- `setup.mjs` — clients admin/anon + helpers `createTestUser`, `signInAs`, `authedClient`
- `helpers.test.mjs` — squelette vide, à remplir à l'étape suivante
- `teardown.mjs` — nettoyage des utilisateurs de test
- `README.md` — ce fichier

## Statut

Aucun test d'intégration n'est encore écrit (squelette vide). L'infrastructure
est prête pour l'étape 3 : validation des 4 helpers `current_*`.
