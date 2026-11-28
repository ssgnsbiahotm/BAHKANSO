#!/usr/bin/env bash
# Lance les tests d'intégration en séquentiel avec les env vars Supabase auto-exportées.
# Usage : npm run test:integration [-- <fichier.mjs>]
set -euo pipefail

eval "$(supabase status -o env \
  | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=' \
  | sed -e 's/^API_URL=/SUPABASE_URL=/' \
        -e 's/^ANON_KEY=/SUPABASE_ANON_KEY=/' \
        -e 's/^SERVICE_ROLE_KEY=/SUPABASE_SERVICE_ROLE_KEY=/' \
  | sed 's/^/export /')"

if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ] || [ -z "${SUPABASE_ANON_KEY:-}" ]; then
  echo "❌ Env vars Supabase manquantes (supabase status -o env a échoué)" >&2
  exit 1
fi

npx vitest run --no-file-parallelism tests/integration/ "$@"
