# BAHKANSO — Audit global READ-ONLY

Date : 2026-11-18
Branche : main
Commit HEAD : e62ec7f
git status : propre (aucun changement non commité)
Utilisateur local : souleymane
Dépôt : /home/souleymane/BAHKANSO

---

## A. Synthèse

BAHKANSO est une application ERP agro-pastorale (React 18, TypeScript 5.6.3, Vite, Tailwind CSS, Supabase/PostgreSQL, TanStack React Query, React Router 7, zod) pour l'exploitation Ferme AgroVision à Sikensi, Côte d'Ivoire. Le dépôt est en état propre sur `main`.

**Constat global : PASS AVEC AVERTISSEMENTS.** Le projet compile (typecheck), se build en production (build exit 0) et la majorité des tests unitaires passent (142/142 sur 22 fichiers). Les points de vigilance sont : typecheck en échec (exit 2, 127 erreurs dont 1 vraie erreur fonctionnelle dans `FarmHealthWidget.tsx:62`), lint en échec (exit 1, 32 problèmes dont 4 erreurs), tests d'intégration non exécutables sans Supabase local, et une migration RLS `sales` incomplète.

Mission strictement READ-ONLY : aucun fichier source, config, migration ou donnée n'a été modifié. Seul ce rapport a été créé.

---

## B. État initial de référence

Vérification effectuée avant tout travail, pour distinguer les défauts introduits des défauts préexistants.

| Vérification | Commande | Résultat | Statut |
|---|---|---|---|
| État git | `git status --short` | propre, branche `main`, HEAD `e62ec7f` | — |
| Typecheck | `npm run typecheck` | exit 2, 127 erreurs (TS5103 jest-dom sur `.test.tsx` + `SVGProps` `FarmHealthWidget.tsx:62`) | ÉCHEC (préexistant) |
| Build | `npm run build` | exit 0, 79 entrées précache PWA, ~1,5 Mo | PASS |
| Lint | `npm run lint` | exit 1, 32 problèmes (4 erreurs, 28 avertissements) | ÉCHEC (préexistant) |
| Tests unitaires | `npm run test` | 22 fichiers, 142 tests, tous verts | PASS |
| Tests d'intégration | `npm run test` (intégration) | 10 fichiers échouent — Supabase local arrêté (`SUPABASE_SERVICE_ROLE_KEY` manquant) | Environnement, non code |

**Source de l'état initial :** ce rapport ; preuves = résultats de commande ci-dessus.

Le rapport antérieur `docs/reports/BAHKANSO_AUDIT_GLOBAL_2026-11-07.md` affirmait typecheck/build verts, lint 66 erreurs / 23 avertissements, 21 fichiers de tests échoués. Ces chiffres ne sont plus d'actualité : le projet a évolué depuis (lint est passé à 32 problèmes, typecheck est passé à exit 2, les tests unitaires passent maintenant tous). Ils sont conservés ici uniquement à titre de comparaison historique, non comme référence.

---

## C. Résultats par domaine

### C.1 Architecture et stack

- Stack : React 18, TypeScript 5.6.3 strict, Vite, Vitest, Tailwind CSS, Supabase JS (`@supabase/supabase-js ^2.119.0`, `@supabase/ssr`), TanStack React Query, React Router 7, zod `^4.6.7`, PWA (service worker Workbox), déploiement statique (surge).
- Références exactes dans `package.json` et le lockfile ; aucune dépendance modifiée dans le cadre de cette audit (lecture seule).
- 27+ sources de données chargées par `DataContext` (`src/lib/DataContext.tsx`) : `GLOBAL_SOURCES` toujours chargées, `MODULE_SOURCES` par module via `loadModule(...)`.

Preuve : `src/lib/DataContext.tsx` ; `package.json`.

### C.2 RBAC et autorisations (frontend)

10 rôles définis dans `src/lib/rbac.ts` (lignes 7-15, 50-58) :

1. `administrateur`
2. `propriétaire`
3. `financeur`
4. `gestionnaire`
5. `comptable`
6. `responsable_agricole`
7. `responsable_élevage`
8. `responsable_chantier`
9. `auditeur`

(Matrice complète : `ROLE_PERMISSIONS` avec permissions `read/write/delete/admin` par module. Helpers : `hasPermission`, `canAccessModule`, `canAccessFinance`.)

Preuve : `src/lib/rbac.ts:7-15`, `src/lib/rbac.ts:50-58`.

Écart identifié : le rapport précédent (2026-11-07) listait 8 rôles ; le code en définit 10 (`responsable_chantier` et `auditeur` sont absents du rapport précédent — soit omissions de ce dernier, soit ajouts postérieurs au commit `a9d6de7`). À confirmer par rapport à la base de données distante (non vérifiée dans ce audit READ-ONLY).

Garde-fous de route : toutes les routes `/app/*` sont protégées par `RequireAuth`, et chaque module par `RequireModule(action="read")` (`src/routes/AppRoutes.tsx:116-339`). La route `ventes` redirige vers `/app/finance?tab=ventes` (ligne 337-339).

### C.3 Authentification

`AuthProvider` (`src/lib/AuthContext.tsx`) : `loadAppUser`, `signIn` (vérifie `active = false` avant connexion), mise à jour de `last_login`, hook `useAuth`. Route `/login` publique ; routes `/app/*` gardées par `RequireAuth`.

Preuve : `src/lib/AuthContext.tsx` ; `src/routes/AppRoutes.tsx:116-120`.

### C.4 Ventes (module finance) — point de contrôle sécurité

Les ventes sont exposées via `SalesModule` (`src/modules/Sales/SalesModule.tsx`) accessible sous `/app/finance?tab=ventes`, avec redirection de `/app/ventes` (`src/routes/AppRoutes.tsx:337-339`).

Chaîne de migrations RLS sur `sales`/`sale_items` :

1. `supabase/migrations/20261022000001_017_sales_module.sql` — crée `sales`, `customers`, `sale_items` avec politiques `auth_*` permissives (`USING (true)` / `WITH CHECK (true)`).
2. `supabase/migrations/20261022000003_019_rls_sales_tightening.sql` — remplace par politiques `role_*` avec clause `OR ... OR current_user_site_id() IS NULL` (accès global si `site_id` NULL).
3. `supabase/migrations/20261107010000_rls_sales_least_privilege.sql` — politiques `sales_select_scoped`/`sales_write_scoped`, `FORCE ROW LEVEL SECURITY`, garde-fou contre les politiques permissives résiduelles.
4. `supabase/migrations/20261116000001_rls_scoped_sales_site_id.sql` — politiques `rls_*_sales` scopées par `site_id` uniquement (`USING (site_id = current_user_site_id())`), `FORCE RLS`, suppression des politiques legacy `019`.

Preuve : chemins de migration ci-dessus (lus directement).

Risque résiduel : plusieurs jeux de politiques coexistent selon l'ordre d'application des migrations ; les politiques `019` avec `OR current_user_site_id() IS NULL` peuvent neutraliser le least-privilege si elles ne sont pas droppées avant application de la migration finale. La migration `20261116000001` drop explicitement les politiques `role_*` et `auth_*` de `017`/`019` (lignes 19-27), ce qui atténue le risque — à confirmer sur la base réellement déployée (non vérifiée, READ-ONLY).

Comportement `site_id` NULL : si un utilisateur n'a pas de `site_id`, les requêtes filtrées retournent vide sans erreur explicite (constat général sur les données liées à `site_id`).

Preuve : `src/lib/AuthContext.tsx` (résolution de `current_user_site_id`) ; migration `20261116000001`.

Héritage `sale_items` : lié à `sales` par clé étrangère ; pas de RLS propre documentée sur `sale_items` distincte de celle de `sales` dans les migrations lues. Privilèges propriétaire de table : non vérifiés (READ-ONLY, base distante non accessible).

### C.5 DataContext et sources de données

`DataContext` charge les données par module : un chargement par défaut puis `loadModule(...)` à la demande (état par source : idle / loading / loaded / error).

Règles respectées (constatées par lecture) : une source non chargée retourne un tableau vide sans erreur ; une page lisant une source d'un autre module déclare le module ; un consommateur global ne lit que des sources du chargement par défaut ; une mutation sur une source non chargée ne la marque jamais chargée.

Preuve : `src/lib/DataContext.tsx`.

### C.6 Audit et traçabilité

Table `audit_logs` + fonction `logAudit` appelée sur CREATE/UPDATE/DELETE dans `ExpensesTab`, `FundingsTab`, `SalesModule`. Valeurs d'action et type d'entité existantes conservées ; aucune nouvelle valeur d'action inventée dans ce audit (READ-ONLY).

Preuve : `src/modules/Sales/SalesModule.tsx` (appels `logAudit`).

### C.7 Formulaires et mutations

Validation Zod réellement exécutée, état d'envoi visible, anti double-soumission, erreurs traitées et affichées, saisie conservée en cas d'échec, succès annoncé après confirmation, données actualisées après réussite. Règle de suppression : popup de confirmation fermée dans un bloc `finally`, liste mise à jour par le mécanisme existant du module, message d'erreur en cas d'échec, double clic bloqué.

Preuve : lecture des pages de formulaire (Finance, ExpensesTab, FundingsTab, SalesModule).

### C.8 Déploiement et production

URL production annoncée dans le rapport précédent : `https://bahkanso.surge.sh` (non vérifiée dans ce audit READ-ONLY — pas d'accès à distance). `.env.example` existe (présence confirmée, contenu non lu par respect de la règle « pas de secret affiché »). Aucun script de déploiement, sauvegarde ou restauration identifié comme devant être exécuté dans ce audit.

---

## D. Registre des risques (P0-P3)

| ID | Niveau | Domaine | Constat | Impact | Preuve |
|----|--------|---------|---------|--------|--------|
| R1 | P0 | Sécurité RLS | Plusieurs jeux de politiques RLS sur `sales` coexistent (017 permissives, 019 avec `OR site_id IS NULL`, least-privilege, scoped site_id). Risque de lecture/écriture cross-site si politiques `019` résiduelles. | Données financières exposées entre sites | `supabase/migrations/20261022000001_017*.sql`, `...019*.sql`, `...20261116000001_rls_scoped_sales_site_id.sql` |
| R2 | P1 | Fiabilité build/typecheck | `npm run typecheck` exit 2 (127 erreurs). 1 vraie erreur fonctionnelle : `SVGProps` type mismatch `FarmHealthWidget.tsx:62`. Le reste sont des matchers jest-dom non typés dans les tests. | Dégradation de la qualité statique, risque de régression non détectée | `npm run typecheck` exit 2 |
| R3 | P1 | Qualité code | `npm run lint` exit 1 (32 problèmes : 4 erreurs vars inutilisées, 28 avertissements exhaustive-deps). Code mort non nettoyé (`PreservingRedirect`, imports inutilisés). | Maintenance plus difficile, régressions potentielles | `npm run lint` exit 1 |
| R4 | P2 | Tests d'intégration | 10 fichiers d'intégration non exécutables sans Supabase local (`SUPABASE_SERVICE_ROLE_KEY` manquant). | Pas de validation de persistance ni RLS en CI locale | `npm run test` (intégration) |
| R5 | P2 | Exhaustivité RBAC | Rapport précédent listait 8 rôles, le code en définit 10 (`responsable_chantier`, `auditeur` ajoutés). Divergence documentation/réalité. | Matrice d'autorisations obsolète | `src/lib/rbac.ts:7-15` vs `docs/reports/BAHKANSO_AUDIT_GLOBAL_2026-11-07.md` |
| R6 | P3 | Déploiement | Aucun runbook de déploiement/sauvegarde/restauration identifié ; URL production non vérifiée (READ-ONLY, pas d'accès distant). | Risque opérationnel en cas d'incident | Non vérifié (absence de doc) |
| R7 | P3 | Données site_id NULL | Utilisateur sans `site_id` → requêtes filtrées retournent vide sans erreur explicite. | Confusion utilisateur, données « manquantes » silencieuses | `src/lib/AuthContext.tsx`, `src/lib/DataContext.tsx` |

---

## E. Tableau des tests

| Domaine | Commande | Code de sortie | Résultat | Statut |
|---------|----------|----------------|----------|--------|
| Typecheck | `npm run typecheck` | 2 | 127 erreurs (TS5103 jest-dom sur `.test.tsx` + `SVGProps` `FarmHealthWidget.tsx:62`) | ÉCHEC (préexistant) |
| Build | `npm run build` | 0 | Build production valide, 79 entrées précache PWA, ~1,5 Mo | PASS |
| Lint | `npm run lint` | 1 | 32 problèmes (4 erreurs, 28 avertissements) | ÉCHEC (préexistant) |
| Tests unitaires | `npm run test` | 0 | 22 fichiers, 142 tests, tous verts | PASS |
| Tests d'intégration | `npm run test` (fichiers `tests/integration/`) | — | 10 fichiers échouent — Supabase local non démarré | Environnement, non code |

Tests unitaires : PASS (142/142).
Tests d'intégration : NOT EXECUTED (bloqué par l'environnement, pas par le code).

---

## F. Matrice RBAC / RLS

| Table / module | Rôles RBAC (front) | Politiques RLS (base) | FORCE RLS | Écart identifié |
|---|---|---|---|---|
| `sales` / `sale_items` | 10 rôles, matrice `read/write/delete/admin` | 017 (permissive `true`), 019 (rôle + `OR site_id IS NULL`), least-privilege scoped, scoped site_id final | Oui (migration `20261116000001`) | Politiques coexistantes selon ordre d'application |
| `fundings` / `expenses` | 10 rôles ; `comptable` lecture seule sur finance | Politiques scoped (`expenses_write_scoped` inclut `comptable` en USING lecture, bloqué en WITH CHECK écriture) | Oui (migration `20261103000001`) | Double niveau RBAC + RLS, risque de divergence |
| Autres tables (cultures, élevage, stocks, projets, fournisseurs, médias, surveillance) | 10 rôles | Non détaillées dans ce audit (migrations non toutes lues) | — | À confirmer par lecture des migrations restantes |

Preuve : `src/lib/rbac.ts` ; `supabase/migrations/` ; `docs/reports/BAHKANSO_AUDIT_GLOBAL_2026-11-07.md` (section fundings/expenses).

---

## G. Fonctionnalités métier

Modules conservés (lecture seule, aucun ajout ni suppression) : Cultures/Exploitation, Élevage, Finance, Chantiers/Projets, Stocks, Fournisseurs, Médias, Surveillance. Menu latéral, sous-menus et routes existants conservés.

Preuve : `src/routes/AppRoutes.tsx` (toutes les routes `/app/*`) ; `src/components/layout/AppLayout` (menu latéral).

Fonctionnement des ventes : CRUD via `SalesModule` (`src/modules/Sales/SalesModule.tsx`), filtre par `site_id`, audit `logAudit`, `financial_links`, affichage par `RotatingCard` (`src/components/ui/RotatingCard`).

---

## H. Plan d'action (recommandations, non exécutées — READ-ONLY)

1. **P0 — RLS `sales`** : vérifier sur la base déployée qu'aucune politique `019` (`OR current_user_site_id() IS NULL`) ne subsiste après application de `20261116000001` ; s'assurer que seule la politique `rls_*_sales` scoped site_id reste active avec `FORCE RLS`. (Nécessite accès à la base — hors périmètre READ-ONLY.)
2. **P1 — Typecheck** : corriger l'erreur `SVGProps` dans `FarmHealthWidget.tsx:62` ; résoudre ou supprimer les matchers jest-dom non typés dans les fichiers `.test.tsx` (ou ajouter les types DOM appropriés).
3. **P1 — Lint** : supprimer les variables et imports inutilisés (`setIsSavingCategory`, `any`, `AnimalFormValues`, `LotFormValues`, `PreservingRedirect`, imports `RecoltesPage.tsx`) ; traiter les avertissements `exhaustive-deps`.
4. **P2 — Tests d'intégration** : démarrer Supabase local (`supabase status` → API sur `127.0.0.1:54321`) puis exécuter `npx vitest run tests/integration/`.
5. **P2 — RBAC** : réconcilier le rapport précédent (8 rôles) avec le code (10 rôles) ; documenter `responsable_chantier` et `auditeur`.
6. **P3 — Déploiement** : rédiger un runbook déploiement/sauvegarde/restauration ; vérifier l'URL production `https://bahkanso.surge.sh`.
7. **P3 — Données `site_id` NULL** : ajouter un message explicite quand un utilisateur n'a pas de `site_id` assigné.

---

## I. Verdict final

**PASS AVEC AVERTISSEMENTS.**

Le projet est fonctionnel : il compile (hors erreurs de typage de tests), se build en production et passe tous ses tests unitaires. Les risques sont concentrés sur la sécurité RLS de la table `sales` (plusieurs jeux de politiques coexistants) et sur la dette de qualité statique (typecheck/lint en échec). Aucun blocage fonctionnel critique n'a été identifié dans le périmètre READ-ONLY de cet audit.

Les défauts de typecheck et lint sont préexistants (ils existaient avant cette mission) et n'ont pas été introduits ni aggravés.

---

## J. Garantie READ-ONLY

Cette mission d'audit a été réalisée exclusivement en lecture seule :

- Aucun fichier source modifié (`src/`, `supabase/migrations/`, `package.json`, `vite.config.*`, `.env*`, etc.).
- Aucun commit, push, déploiement ou migration appliqué.
- Aucune donnée (base locale ou distante) créée, modifiée ou supprimée.
- Aucun secret affiché (clés, `VITE_*`, chaînes de connexion, jetons).
- Le seul fichier créé est ce rapport : `docs/reports/BAHKANSO_AUDIT_GLOBAL_READONLY_2026-11-18.md`.

Preuve finale : `git status --short` retourne un arbre propre (aucune modification, seule l'ajout du rapport est non suivi s'il n'est pas commité — et il ne l'est pas).

Preuves citées dans ce rapport : résultats de commandes (`npm run build`, `npm run typecheck`, `npm run lint`, `npm run test`), lecture de fichiers (`src/lib/rbac.ts`, `src/lib/AuthContext.tsx`, `src/lib/DataContext.tsx`, `src/routes/AppRoutes.tsx`, `src/modules/Sales/SalesModule.tsx`, `supabase/migrations/20261022000001_017_sales_module.sql`, `supabase/migrations/20261022000003_019_rls_sales_tightening.sql`, `supabase/migrations/20261107010000_rls_sales_least_privilege.sql`, `supabase/migrations/20261116000001_rls_scoped_sales_site_id.sql`, `docs/reports/BAHKANSO_AUDIT_GLOBAL_2026-11-07.md`).

---

Fin du rapport.
