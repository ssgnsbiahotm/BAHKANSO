# Mémoire du projet BAHKANSO

> Mise à jour : 15 novembre 2026  
> Branche de travail : `docs/memory-audit-report`  
> Branche de référence : `main`

## Identité du projet

BAHKANSO est une application web agro-pastorale orientée gestion opérationnelle, financière et multi-sites.

- Dépôt : https://github.com/ssgnsbiahotm/BAHKANSO
- Visibilité : publique
- Stack principale : React, TypeScript, Vite
- Données et authentification : Supabase
- Routage : React Router avec `createBrowserRouter`
- État/requêtes : TanStack Query et contextes React
- Style : Tailwind CSS et feuilles CSS dédiées
- Animations : GSAP et Lenis
- Tests : Vitest, Testing Library et Playwright

## Structure importante

- `src/` : application frontend
- `src/pages/` : pages et écrans
- `src/modules/` : modules Finance, Sales et Exploitation
- `src/routes/` : routage et gardes d’authentification/permissions
- `src/lib/` : contextes, types, RBAC, validation et client Supabase
- `supabase/migrations/` : historique du schéma, données initiales et politiques RLS
- `supabase/tests/` : tests liés à Supabase
- `tests/` et `e2e/` : tests d’intégration et de bout en bout
- `memory/` : notes spécialisées issues de travaux précédents
- `docs/` : documentation et rapports existants

## Routes fonctionnelles repérées

- `/`, `/prototype`, `/login`
- `/app/dashboard`
- `/app/configuration`
- `/app/surveillance`
- `/app/exploitation/*`
- `/app/elevage/*`
- `/app/inventory`
- `/app/projects`
- `/app/suppliers`
- `/app/media`
- `/app/finance`
- `/app/ventes` redirigé vers le module financier

Les routes applicatives sont protégées par `RequireAuth` et, selon le module, par `RequireModule` avec contrôle d’action.

## État documentaire

- Aucun `README.md` n’est présent à la racine au moment de cette mise à jour.
- De nombreux rapports d’audit et documents de reprise existent déjà à la racine.
- Une note existante dans `memory/sales-cards-display-fix.md` documente une correction d’affichage des cartes de ventes.
- `rapportashnai.md` est le rapport transversal associé à cette inspection.

## Points de vigilance

1. Le dépôt contient une configuration Supabase locale avec un secret JWT de développement dans `supabase/config.toml`. Vérifier qu’il ne soit jamais utilisé en production ni réutilisé comme secret distant.
2. L’historique des migrations est volumineux et comprend plusieurs corrections RLS, consolidations et migrations de rollback. Toute modification doit être précédée d’un audit de l’état réellement appliqué.
3. Les consignes du dépôt imposent de ne pas modifier directement `main`, de protéger les travaux non commités et de vérifier typecheck, tests, captures et accessibilité avant de déclarer une tâche terminée.
4. La branche de travail actuelle sert uniquement à la documentation demandée. Aucun commit, push, déploiement ou changement Supabase distant n’a été effectué par cette tâche.

## Prochaines étapes recommandées

- Ajouter un `README.md` racine présentant installation, variables d’environnement, scripts et démarrage local.
- Exécuter `npm run typecheck`, `npm run lint`, `npm run test` et les scénarios Playwright dans un environnement configuré.
- Vérifier les migrations appliquées et les avis Supabase avant toute évolution du schéma.
- Compléter l’audit visuel aux breakpoints 375, 768 et 1440 px.
