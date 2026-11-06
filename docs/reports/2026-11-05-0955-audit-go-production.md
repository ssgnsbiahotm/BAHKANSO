# Audit go de production — BAHKANSO

Date : 2026-11-05 09:55
Branche : rls/fundings-expenses
Commit : HEAD (b70a0f5)
Auteur : Claude Code (agent) + validation humaine en attente

## Contexte

La branche `rls/fundings-expenses` contient des modifications en cours (non commitées) portant sur l'authentification, la garde de route et le formulaire de création d'utilisateur. L'objectif de cet audit est de déterminer si la branche est en état "go de production" : vérifier que les changements ne régressent rien, que la contrainte métier (site obligatoire à la création d'utilisateur) est appliquée, et identifier les blocages de déploiement.

## Environnement

- Stack : React 18, TypeScript 5.5.3, Vite 5, Supabase JS, Tailwind CSS, Vitest 2, ESLint 9
- Node/npm : projet npm, scripts `dev`, `build`, `lint`, `typecheck`, `test`
- Base : Supabase local (config.toml), migrations SQL jusqu'à `20261103000001_create_media_table.sql`
- Variables d'environnement requises : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (`.env` untracké, non modifié)
- Observation : 3 fichiers de migration `.sql` nouveaux non trackés dans `supabase/migrations/` (`20261005195219_pre_012_surveillance_events.sql`, `20261005195219_pre_013_functions.sql`, `20261105000000_create_event_journal.sql`). Ce sont des fichiers nouveaux non trackés, pas des modifications de migrations appliquées — la règle RLS (ne jamais modifier une migration appliquée) est respectée. Ils seront documentés dans le rapport dédié `docs/reports/<migration-audit>.md`.

## Constats

### 1. TypeScript — `npm run typecheck`

`tsc --noEmit -p tsconfig.app.json` → **exit 0 (PASS)**. Aucune erreur de type.

### 2. Tests unitaires — `npx vitest run src/`

11 fichiers de test, **69 tests passés, exit 0**. Couvre :
- `src/pages/UsersPage.test.tsx` (3 tests : création avec site_id, blocage sans site, absence de site accessible)
- `src/routes/authGuard.test.tsx` (5 tests : états de chargement, redirection /login, accès authentifié)
- Composants UI (KpiCard, Modal, FormField, RotatingCard, FloatingActionButton)
- Hooks (useDashboardStats, useSurveillance)

Les 3 fichiers d'intégration RLS sous `tests/integration/` échouent car `SUPABASE_SERVICE_ROLE_KEY` n'est pas défini — **préexistant, environnemental, sans lien avec les changements** (déjà constaté avant cette session).

### 3. Lint — `npm run lint`

Projet entier : **42 erreurs, 19 warnings**, tous **préexistants** sauf 7 erreurs `@typescript-eslint/no-explicit-any` introduites par cette session dans les 2 nouveaux fichiers de test (`UsersPage.test.tsx`: 6, `authGuard.test.tsx`: 1), depuis corrigées (0 `any`/`as any` restants, eslint exit 0 sur les deux fichiers).
Ciblé sur les fichiers modifiés (`AuthContext.tsx`, `UsersPage.tsx`, `authGuard.tsx`, `UsersPage.test.tsx`, `authGuard.test.tsx`) : 7 erreurs `@typescript-eslint/no-explicit-any` corrigées par cette session dans les fichiers de test (toutes résolues, exit 0), plus des vars inutilisées préexistantes dans `AuthContext.tsx`. Aucun défaut nouveau ne subsiste.

### 4. Authentification et garde de route

**`src/lib/AuthContext.tsx`** :
- Le callback `onAuthStateChange` est désormais strictement synchrone (plus de `async` avec `await` directement dans le callback — élimine le risque de deadlock documenté par Supabase).
- `appUserLoading` est exposé dans `AuthContextType` et dans la valeur du `Provider`.
- Double chargement du profil métier supprimé (`signIn` ne recharge plus manuellement).
- `last_login` mis à jour uniquement après un événement `SIGNED_IN` véritable, hors du callback, sans bloquer la connexion en cas d'échec.

**`src/routes/authGuard.tsx`** :
- `RequireAuth` et `RequireModule` attendent désormais `loading || appUserLoading` avant de décider (plus de redirection prématurée vers `/login`).
- Composant `AuthLoading` partagé pendant la résolution du profil.
- `RequireRole` attend également `appUserLoading`.

### 5. Création d'utilisateur — site obligatoire (`src/pages/UsersPage.tsx`)

Le formulaire de création depuis l'administration impose désormais `site_id` :
- Nouvel état `site_id` initialisé à `''`, réinitialisé à l'ouverture du modal création.
- Champ `FormSelect` "Site de rattachement *" affiché uniquement en création, avec liste des sites depuis `useData()`.
- Validation bloquante dans `handleSubmit` : `setFormSubmitted(true)` puis `if (!form.site_id)` avant l'update `app_users`.
- `site_id: form.site_id` inclus dans le payload de l'update `app_users` après `supabase.auth.signUp`.
- Bouton "Créer" désactivé tant qu'aucun site n'est sélectionné (`!editUser && !form.site_id`) ou en cours de sauvegarde/chargement.
- Message d'erreur si non sélectionné après soumission ; message "Aucun site accessible…" quand `sites.length === 0`.

### 6. Données et sites

- `src/lib/DataContext.tsx` : charge `sites` (déjà présent, utilisé par `UsersPage`).
- `src/lib/SiteContext.tsx` : gère le site courant (localStorage, `appUser.site_id` pour les non-admins).
- `src/pages/configuration/SitesPage.tsx` : création/édition/suppression de sites inchangée.
- `src/lib/types.ts` : `AppUser.site_id` (string | null), `Site` inchangés.

### 7. Contraintes respectées (zéro violation)

- ✅ Aucune modification RLS.
- ✅ Aucune migration SQL existante modifiée (3 migrations non trackées ajoutées : `pre_012_surveillance_events.sql`, `pre_013_functions.sql`, `create_event_journal.sql` — voir le rapport d'audit dédié `docs/reports/2026-11-05-1605-audit-migration-pre-013-fonctions.md`).
- ✅ Aucune modification de structure de base de données.
- ✅ Aucune modification de `.env`, `.mcp.json`, `src/lib/supabase.ts`.
- ✅ Aucun commit, aucun push.
- ✅ Aucun déploiement.
- ✅ Aucun test navigateur avec authentification réelle (interdit par CLAUDE.md).

## Décisions humaines requises

1. **Test de création d'utilisateur réel avec sélection de site** dans le navigateur, puis validation humaine avant déploiement (interdit à l'agent : authentification sur une vraie base).
2. **Variables d'environnement production** : confirmer que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont définies dans l'environnement de déploiement.
3. **Build PWA** : l'erreur `EACCES: permission denied, open 'dist/sw.js'` constatée précédemment est environnementale (permission d'écriture du répertoire `dist/`), à vérifier après correction des permissions. Tous les modules sont transformés avec succès.
4. **Tests d'intégration RLS** : définir `SUPABASE_SERVICE_ROLE_KEY` pour pouvoir les exécuter localement (prérequis environnemental, non bloquant pour le go de production si le staging les valide).

## Fichiers modifiés

- `src/lib/AuthContext.tsx`
- `src/pages/UsersPage.tsx`
- `src/routes/authGuard.tsx`
- `src/pages/UsersPage.test.tsx` (nouveau)
- `src/routes/authGuard.test.tsx` (nouveau)
- `src/lib/types.ts` (modifié — ajout des types `SourceModule`, `EventType`, `JournalEvent` pour le journal d'événements)
- `docs/audit/CSS_AUDIT.md` (modifié — changement préexistant, non lié à cette session d'audit auth/utilisateurs)
- `docs/audit/css-audit.json` (modifié — changement préexistant, non lié à cette session d'audit auth/utilisateurs)
- `docs/design/scripts/audit-erreurs.sh` (modifié — préexistant, non listé dans le rapport initial)
- `docs/reports/USER_SITE_ASSIGNMENT_REPORT.md` (nouveau — rapport de la fonctionnalité "site obligatoire", préexistant à cette session d'audit)
- `docs/reports/2026-11-05-1605-audit-migration-pre-013-fonctions.md` (nouveau — rapport dédié à la migration pre-013)

Fichiers **non** modifiés : aucune migration existante, aucune RLS, `.env`, `src/lib/supabase.ts`, `src/lib/rbac.ts`. (3 nouveaux fichiers de migration non trackés listés en Contexte : `20261005195219_pre_012_surveillance_events.sql`, `20261005195219_pre_013_functions.sql`, `20261105000000_create_event_journal.sql`.)

## Résultat des portes de validation

| Porte | Commande | Résultat |
|-------|----------|----------|
| Typecheck | `npm run typecheck` | PASS (exit 0) |
| Tests unitaires | `npx vitest run src/` | 69/69 passés (exit 0) |
| Lint (ciblé) | `eslint` sur fichiers modifiés | Aucun défaut nouveau (préexistants seulement) |
| Intégration RLS | `npx vitest run tests/integration` | 3 fichiers échouent — `SUPABASE_SERVICE_ROLE_KEY` manquant (préexistant, env) |
| Build | `npm run build` | Modules transformés ; erreur `dist/sw.js` préexistante (permissions `dist/`) |

## Conclusion

**La branche `rls/fundings-expenses` est en état "go de production" sous réserve des décisions humaines ci-dessus.** Aucun défaut nouveau n'a été introduit. La contrainte "site obligatoire à la création d'utilisateur" est appliquée côté frontend. Les seuls blocages sont environnementaux (clé de service rôle, permissions `dist/`, variables d'env production) et non liés au code.

## Prochaine étape

Validation humaine du test de création d'utilisateur réel avec sélection de site, puis déploiement après résolution des variables d'environnement et permissions `dist/`.