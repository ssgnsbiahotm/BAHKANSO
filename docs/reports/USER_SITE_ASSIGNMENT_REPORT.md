# Affectation obligatoire d'un site à la création d'utilisateur — BAHKANSO

Date : 2026-11-05 09:30
Branche : rls/fundings-expenses
Commit : HEAD (b70a0f5)
Auteur : Claude Code (agent) + validation humaine en attente

## Contexte

La création d'utilisateur depuis le formulaire d'administration (`UsersPage.tsx`) ne renseignait pas le champ `site_id` dans `public.app_users`. Un utilisateur pouvait être créé sans être rattaché à un site existant.

## Objectif

Rendre le champ `site_id` obligatoire à la création d'un utilisateur, de sorte que chaque nouvel utilisateur créé depuis l'administration soit explicitement rattaché à un site existant.

## Constats

### Avant correction

- `UsersPage.tsx` : le formulaire de création ne contenait aucun champ de sélection de site. Le champ `site_id` n'était jamais transmis lors du `supabase.from('app_users').update(...)` après la création du compte Auth.
- Aucune validation bloquante ne existait sur `site_id`.

### Après correction (fichiers modifiés)

- `src/pages/UsersPage.tsx` :
  - Ajout de `sites` au destructuring de `useData()` (ligne 22) — déjà chargé par le contexte.
  - Nouvel état `site_id` dans le formulaire (ligne 39), réinitialisé à `''` à l'ouverture du modal création (ligne 56).
  - Nouveau champ `FormSelect` "Site de rattachement *" dans le JSX, affiché uniquement en création (`!editUser`) après le champ Rôle (lignes 366-402), avec :
    - message d'erreur si non sélectionné après soumission,
    - message "Aucun site accessible…" quand `sites.length === 0`.
  - Dans `handleSubmit` (création) : `setFormSubmitted(true)` puis validation bloquante `if (!form.site_id)` avant le `app_users` UPDATE (lignes 144-149), et `site_id: form.site_id` inclus dans le payload de l'update (ligne 152).
  - Le bouton Créer est désactivé tant qu'aucun site n'est sélectionné (`!editUser && !form.site_id`) ou en cours de sauvegarde/chargement des sites (lignes 320-324).
- `src/pages/UsersPage.test.tsx` (nouveau) : 3 tests
  - TEST 1 : création normale transmet le `site_id` sélectionné dans l'update `app_users`.
  - TEST 2 : aucun site sélectionné bloque la soumission (bouton désactivé, `signUp` non appelé).
  - TEST 3 : aucun site accessible affiche un message d'erreur et bloque la création.

## Décisions humaines requises

- Valider le test réel dans le navigateur (création utilisateur avec sélection de site).
- Confirmer qu'aucun site orphelin ne peut plus être créé.

## Fichiers modifiés

- `src/pages/UsersPage.tsx`
- `src/pages/UsersPage.test.tsx` (nouveau)
- `docs/reports/USER_SITE_ASSIGNMENT_REPORT.md` (ce rapport)

## Validation

| Commande | Résultat |
|----------|----------|
| `npm run typecheck` | PASS (exit 0) |
| `npx vitest run` | 69 tests passés ; 3 fichiers d'intégration RLS échouent car `SUPABASE_SERVICE_ROLE_KEY` non défini (environnement, préexistant) |
| `npm run build` | PASS (exit 0) |

## Confirmation des contraintes

RLS MODIFIEES : NON
MIGRATIONS AJOUTEES : NON
TRIGGERS MODIFIES : NON
AUTHCONTEXT MODIFIE : NON
RÔLES MODIFIES : NON
DONNEES EXISTANTES MODIFIEES : NON
AUTRES FORMULAIRES MODIFIES : NON
COMMIT EFFECTUE : NON
PUSH EFFECTUE : NON

## Prochaine étape

Test de création d'utilisateur réel avec sélection de site dans le navigateur, puis validation humaine avant déploiement.
