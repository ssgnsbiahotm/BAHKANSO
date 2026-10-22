# AGENTS.md — BAHKANSO

## Priorité produit
Projet DESIGN-FIRST. Identité "Field Intelligence" prioritaire sur l'ajout de
fonctionnalités. Chaque écran doit être reconnaissable, pas un template SaaS.

## Contexte dépôt (constaté)
- Branche : audit-interactions (HEAD 158eee5). Ne PAS changer sans accord.
- Stack : Vite + React + TypeScript + React Router (createBrowserRouter) + TanStack Query + Supabase.
- Vite : http://localhost:5173. Playwright configuré, baseURL identique.
- Routes principales : /login, /, /app/dashboard, /app/agriculture/operations
  (écran pilote design), puis /app/agriculture/*, /app/livestock/*, /app/finance,
  /app/ventes, /app/inventory, /app/projects, /app/suppliers, /app/monitoring.
- Skills existants à conserver : supabase, supabase-postgres-best-practices.
- Playwright globalSetup tente un signInWithPassword Supabase : peut échouer si
  le réseau Supabase est indisponible. Ne pas le désactiver sans accord.

## Travail non commité à PROTÉGER
Fichiers modifiés (ne pas écraser) : package.json, package-lock.json,
src/hooks/useDashboardStats.ts, src/lib/DataContext.tsx, src/pages/Dashboard.css,
src/pages/Dashboard.tsx.
Fichiers non trackés (ne pas supprimer) : e2e/, playwright.config.ts, playwright/,
src/hooks/useDashboardStats.test.ts, src/pages/Dashboard.test.tsx,
supabase/migrations/20261022000004_020_seed_e2e_user.sql,
supabase/migrations/20261022000005_021_fix_e2e_password.sql, test-results/,
src/routes/AppRoutes.tsx.backup.

## Règles absolues
- Audit avant toute modification.
- Interdits : `git reset --hard`, `git clean`, `git restore`, `git checkout -- .`,
  `git stash drop`, `git branch -D`, `git push --force`.
- Aucun commit, push, déploiement, migration Supabase sans accord explicite.
- Aucune donnée fictive présentée comme réelle dans l'UI.
- Convention Codex : préfixer les commandes par `rtk` (RTK.md global).

## Direction artistique (à appliquer à chaque écran)
- Palette de travail : Nuit #111A18 · Ardoise #1C2925 · Vert signal #B9D86B
  · Ivoire #F4F1E8 · Encre #202824 · Terre cuite #C87551.
- Deux environnements : sombre = pilotage, clair = travail.
- Chaque écran a sa composition propre ; pas de recolor uniforme.
- Rayons modérés, transitions courtes, focus clavier visible obligatoire.
- Interdit : cards blanches arrondies par défaut, gradient violet,
  icônes interchangeables, illustrations décoratives sans fonction.

## Vérification obligatoire avant "terminé"
1. `npm run typecheck` PASS.
2. `npm run test` PASS.
3. Captures Playwright dans output/audit/ aux breakpoints 375 / 768 / 1440.
4. Contrastes WCAG AA + focus visible.
5. Rapport PASS / HOLD / BLOCKED avec preuves (captures + logs).

## Interdits
- Secrets, tokens, .env dans les rapports ou commits.
- Migration appliquée sans audit + autorisation.
- Désactiver RLS, changer timeouts, modifier config distante sans accord.

## Outils autorisés (complément)
Ne JAMAIS appeler de MCP via les préfixes `mcp__read_file__`, `mcp__filesystem__`,
`filesystem.read_mcp_resource` ou équivalent. Ces serveurs MCP n'existent pas
dans cet environnement.

Pour lire un fichier :
- Utiliser l'outil intégré `Read` (chemin absolu ou relatif au dépôt).
- Ou shell : `cat`, `sed`, `head`, `tail`, `grep` (via `rtk`).

Pour écrire/modifier :
- Outil intégré `Edit` (remplacement) ou `Write` (création).
- Ou shell : heredoc, `printf`.

MCP réellement configurés : playwright, supabase (lecture seule), github, canva.
Aucun MCP de type filesystem n'est disponible. Ne pas en inventer.
