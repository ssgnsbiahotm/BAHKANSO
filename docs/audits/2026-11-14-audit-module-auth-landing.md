# Audit module Auth / Landing — 2026-11-14

## 📊 Résumé exécutif

Le module Auth/Landing couvre deux écrans publics :

- **LandingPage** (`src/pages/LandingPage.tsx`) — page d'accueil publique (route `/`), config-driven depuis `site_content` (hero, cta, footer), affiche les activités vers `/app/exploitation`, `/app/livestock`, `/app/projects`, un composant `FacebookFeed`, et un CTA vers `/login`. Aucun auth requis.
- **LoginPage** (`src/pages/LoginPage.tsx`) — page d'authentification (route `/login`) avec trois modes (connexion, inscription, mot de passe oublié). Utilise Supabase Auth directement (`signInWithPassword`, `signUp`, `resetPassword`). Validation manuelle (regex email, `validatePasswordStrength`), pas de Zod. Branding depuis `site_content.branding` et `farm.logo_url`. Redirige vers `/app` après succès.

**Écarts : 🔴 0 critique, 🟠 3 importants, 🟡 2 améliorations, ⚪ 3 décisions métier.**

---

## ✅ Ce qui fonctionne bien

| Élément | Preuve |
|---------|--------|
| Routes publiques (`/`, `/login`, `/prototype`) sans `RequireAuth` | `src/routes/AppRoutes.tsx:82-112` |
| `/app` protégé par `RequireAuth` + `AppLayout` | `src/routes/AppRoutes.tsx:113-130` |
| Supabase Auth natif (signIn/signUp/resetPassword) | `LoginPage.tsx` (3 modes) |
| Validation email par regex (`validateEmail`) | `LoginPage.tsx` |
| Validation force du mot de passe (`validatePasswordStrength`) | `LoginPage.tsx` |
| Toast erreurs Supabase (pas `instanceof Error`) | `LoginPage.tsx` (conforme CLAUDE.md §10) |
| Redirection `/app` après succès de connexion | `LoginPage.tsx` |
| Landing configurée depuis `site_content` (hero / cta / footer) | `LandingPage.tsx` |
| Branding (logo ferme, couleurs) injecté dans LoginPage | `LoginPage.tsx` |
| `document.title` mis à jour selon le mode (connexion/inscription/MDP oublié) | `LoginPage.tsx` |

---

## 🗺️ Inventaire

### Écrans

| Écran | Fichier | Route | Auth | Actions |
|-------|---------|-------|------|---------|
| Landing | `src/pages/LandingPage.tsx` | `/` | publique | navigation vers modules, CTA login, Facebook feed |
| Login | `src/pages/LoginPage.tsx` | `/login` | Supabase Auth | se connecter, s'inscrire, réinitialiser MDP |

### Données

| Source | Registre | Utilisée par |
|--------|----------|--------------|
| `app_users` (via `loadAppUser`) | global (AuthContext) | rôle utilisateur après connexion |
| `site_content` | GLOBAL_SOURCES | hero, cta, footer, branding (LandingPage) |
| `farms` (logo_url) | global | logo ferme (LoginPage branding) |
| `media` | GLOBAL_SOURCES | visuels landing |

### Hooks et helpers utilisés

| Élément | Fichier | Rôle |
|---------|---------|------|
| `useAuth()` / `AuthContext` | `src/lib/AuthContext.tsx` | session, `authUser`, `appUser`, `loadAppUser` |
| Supabase Auth client | `src/lib/supabase.ts` | `signInWithPassword`, `signUp`, `resetPassword` |
| `useData()` | `src/lib/DataContext` | lit `site_content`, `farms`, `media` (LandingPage) |
| `validateEmail`, `validatePasswordStrength` | `LoginPage.tsx` (local) | validation manuelle |
| `formatCurrency` / `formatDate` | `src/lib/format` | — (non utilisé ici) |

### Tests

| Test | Fichier | Couvre Auth/Landing ? |
|------|---------|----------------------|
| Aucun test dédié | — | ❌ |

---

## 🔗 Matrice de cohérence (champs critiques)

| Champ | UI | Zod / TS | SQL CHECK | Statut |
|-------|----|----------|-----------|--------|
| `email` (login/inscription) | input email | regex manuel (`validateEmail`) | — | ⚠️ pas de Zod |
| `password` | input password | `validatePasswordStrength` (manuel) | — | ⚠️ pas de Zod |
| `site_content.key` / `value` | saisie libre (formulaire contenu) | `string` | — | ⚠️ pas de contrainte |
| `farms.logo_url` | upload Storage `app-assets` | `string \| null` | — | — |

---

## 🔴 Écarts critiques (preuves)

— Aucun écart critique.

---

## 🟠 Écarts importants (preuves)

### A1 — Pas de validation Zod sur les formulaires d'authentification (LoginPage)

- **Preuve** : `src/pages/LoginPage.tsx` — la validation est manuelle : `validateEmail(email)` (regex) et `validatePasswordStrength(password)` (vérifications de longueur et de caractères). Aucun schéma Zod ni `useValidatedForm`.
- **Conséquence** : pas de validation déclarative côté client ; incohérent avec les autres modules (Finance, Stocks, Projets, Fournisseurs, Configuration) qui utilisent Zod. Les erreurs de validation ne sont pas structurées de manière cohérente avec le reste de l'application.

### A2 — `useAuth()` expose `authUser` mais `appUser` est chargé séparément (double source de vérité)

- **Preuve** : `src/lib/AuthContext.tsx:1-80` (lu partiellement) — `authUser` vient de Supabase Auth (session), `appUser` vient de la table `app_users` chargée par `loadAppUser()`. Les deux peuvent diverger (rôle différent entre `authUser.user_metadata` et `app_users.role`).
- **Conséquence** : le filtrage financier (`isFinanceSensitive` sur Dashboard) et les contrôles d'accès reposent sur `appUser` (rôle métier) alors que l'authentification repose sur `authUser` (session Supabase). Risque d'incohérence si les rôles ne sont pas synchronisés.

### A3 — LandingPage n'utilise pas `RotatingCard` pour les activités (cartes locales)

- **Preuve** : `src/pages/LandingPage.tsx` — les cartes d'activité (agriculture, élevage, projets) sont des cartes simples locales, pas `RotatingCard`.
- **Conséquence** : conforme à CLAUDE.md §7 (le landing n'est pas une liste métier), mais duplication de composants carte par rapport aux modules métiers qui utilisent `RotatingCard`.

---

## 🟡 Améliorations

### A4 — Pas de test unitaire dédié au module Auth/Landing

- **Preuve** : aucun fichier `*.test.*` pour `LoginPage.tsx` ni `LandingPage.tsx`.
- **Conséquence** : pas de couverture sur les modes d'auth (connexion/inscription/MDP oublié), la validation, le branding dynamique, ni la redirection post-connexion.

### A5 — `LandingPage` lie directement vers `/app/exploitation`, `/app/livestock`, `/app/projects` sans garder le contexte de provenance

- **Preuve** : `src/pages/LandingPage.tsx` — les liens d'activité pointent directement vers les routes des modules.
- **Conséquence** : après connexion, l'utilisateur doit naviguer manuellement pour revenir à l'activité qui l'intéressait sur le landing. Pas de paramètre `?redirect=` ou `?from=` pour restaurer le contexte.

---

## ⚪ Décisions métier

### D1 — Validation manuelle vs Zod sur LoginPage

- La validation est manuelle (regex + force mot de passe). **Décision nécessaire** : confirmer si la validation manuelle est suffisante pour l'authentification, ou si un schéma Zod doit être ajouté pour cohérence avec le reste de l'application.

### D2 — Rôle métier (`app_users`) vs rôle Supabase (`authUser.user_metadata`)

- Le filtrage d'accès (ex. `isFinanceSensitive` sur Dashboard) utilise `appUser.role` (table métier), pas `authUser.user_metadata.role`. **Décision nécessaire** : confirmer que `app_users.role` est la source de vérité canonique pour le RBAC, et documenter la synchronisation entre les deux.

### D3 — Routes publiques sans RBAC (`/`, `/login`, `/prototype`)

- Ces routes n'ont aucune garde d'authentification ni de module. **Décision nécessaire** : confirmer que c'est intentionnel (landing et login sont publics par conception) et que `/prototype` ne doit pas exposer de données sensibles.

---

## 🧪 Couverture de test

- Aucun test unitaire ni d'intégration pour `LoginPage.tsx` ni `LandingPage.tsx`.
- Les tests Dashboard couvrent partiellement les KPIs globaux mais pas les flux auth/landing.

---

## 🔗 Liens avec autres modules

| Module cible | Lien depuis Auth/Landing | Statut |
|-------------|------------------------|--------|
| Exploitation | Lien activité vers `/app/exploitation` | ✅ présent (navigation) |
| Élevage | Lien activité vers `/app/livestock` | ✅ présent (navigation) |
| Projets/Chantiers | Lien activité vers `/app/projects` | ✅ présent (navigation) |
| Configuration | `site_content` (hero/cta/footer/branding) | ✅ présent (lecture) |
| Finance | `app_users.role` pour le filtrage financier (Dashboard) | ✅ présent (lecture) |
| Médias | `media` pour les visuels landing | ✅ présent (lecture) |
| Dashboard | Redirection vers `/app` (index = dashboard) après login | ✅ présent (navigation) |

---

## 🎯 Plan de correction (3 vagues)

### Vague 1 — Correction critique (immédiat)

— Aucun écart critique.

### Vague 2 — Robustesse et cohérence (important)

1. Ajouter une validation Zod sur les formulaires de LoginPage (email, mot de passe, confirmation) — corrige A1.
2. Clarifier la source de vérité du rôle (app_users vs Supabase metadata) et documenter la synchronisation — corrige A2.
3. (optionnel) Mettre les cartes d'activité du Landing sur `RotatingCard` ou documenter le choix — corrige A3.

### Vague 3 — UX et qualité (amélioration)

4. Ajouter des tests unitaires dédiés (modes auth, validation, branding, redirection) — corrige A4.
5. Conserver le contexte de provenance (`?redirect=`) sur les liens du Landing vers les modules — corrige A5.
6. Documenter la décision sur les routes publiques (D3) et la source de vérité du rôle (D2).

---

## 📝 Annexe — Preuves techniques

Extrait validation manuelle (`LoginPage.tsx`) :
```ts
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePasswordStrength = (password: string) => {
  // longueur, majuscule, minuscule, chiffre, caractère spécial
};
```

Extrait routes publiques (`AppRoutes.tsx:82-112`) :
```tsx
{
  path: '/login',
  element: <LoginPage />,
},
{
  path: '/',
  element: <LandingPage />,
},
{
  path: '/prototype',
  element: <PrototypePage />,
},
```

Extrait redirection après succès (`LoginPage.tsx`) :
```ts
onSuccess: () => {
  navigate('/app');
},
```

**Fichiers modifiés : aucun** (audit en lecture seule, aucun commit).

**Prochaine étape : ** mettre à jour `docs/CONTEXT.md` selon CLAUDE.md §17 (clôture de mission).
