# Contexte du projet BAHKANSO — Point de reprise

**Date de mise à jour** : 2026-11-16
**Branche de référence** : `main` (= `feat/dashboard-v2`, SHA `174c74b`)
**Dernier commit de code** : `e85ced9` (commit précédent)
**URL production** : https://bahkanso.surge.sh

## État actuel

- 2026-11-13 — Nettoyage main : .gitignore corrigé (Master PDF Editor Portable, supabase/.temp), rapports d'audit 2026-11-11 commités, migration consolidation Option C sécurisée (576 lignes, audit sûreté OK : 0 DROP destructif, 18 DROP IF EXISTS, 0 DDL auth, 5 INSERT runtime-only), fix a11y LoginPage, fix e2e sélecteur module-btn-primary. Commits : `41fafa7`, `9eed748`, `19e61ef`, `24e4797`, `05fcbbf`, `1b54710`.
- 2026-11-13 — Audit §9 loadModule : 17 conformes, 9 à ajouter, 1 risque élevé (DashboardV2), 6 hors scope. Rapport : `docs/audits/2026-11-13-loadmodule-audit.md` (commit `1da5f9f`).
- 2026-11-13 — Lot 1 §9 : 9 pages déclarent `loadModule` (Inventory, Projects, Reports, Suppliers, ExploitationModule, JournalCulturePage, LotsPage, AnimauxPage, SitesPage). Modules stock/projets ajoutés à DataContext pour sources orphelines (inventoryItems, inventoryMovements, projects, projectSteps). Commits : `151646e`, `27d3ad4`.
- 2026-11-13 — Investigation DashboardV2 (commit `39486b9`) : 9 requêtes `event_journal` cataloguées, RLS FORCE confirmé, options A-E comparées, décision : ne PAS ajouter `event_journal` à `DASHBOARD_SOURCES` (volumétrie append-only).
- 2026-11-13 — Lot 2a DashboardV2 (commit `f585a6f`) : `loadModule('dashboard')` + états loading/no_data corrects. Distinction idle/loading (loading) vs success sans farmId (no_data) vs success avec farmId (ok). 5 défauts du premier jet corrigés.
- 2026-11-13 — Lot 2b DashboardV2 (commit `7fa2bb2`) : déduplication `useDashboardTrend` (61 lignes + 11 types + imports supprimées) via `clientDataSource.getTrend` appelé dans le même `fetchData` que `getKpis` (`Promise.all`). 1 seule requête `event_journal` par scope au lieu de 2. 11/11 tests, typecheck exit 0, lint 0 erreur.
- 2026-11-13 — OOM vitest résolu : `setup.tsx` n'appelait jamais `cleanup()` → 20 test files laissaient leurs composants montés (42 renders cumulés). Ajout `afterEach(() => cleanup())` global + import explicite `afterEach` (commit `70daeca`, `80e642d`). 121/121 tests en 43.72s (avant : timeout >300s). Dette mal attribuée à `useDashboardData.test.ts` (2 renders) : le vrai coupable était `useSurveillance.test.ts` (11 renders).
- Conformité §9 : 9 pages + DashboardV2 + dédup `event_journal`. Voir `docs/audits/2026-11-13-loadmodule-audit.md` et `docs/audits/2026-11-13-dashboardv2-investigation.md`.
- 2026-11-13 — Correction visuelle landing page (v3 clôture) : débordement horizontal corrigé (`overflow-hidden` sur `ActivityCard`, `scrollWidth == clientWidth` à 390/768/1440 px) ; contraste label photo validé sur photo claire (label 5.18, sous-ligne 7.36, tous ≥ 4.5) ; mesures étape 1 toutes conformes (marge en-tête→surtitre 36/26/103 px, pas de débordement, pas de `<br>` littéral). Fichiers : `src/pages/LandingPage.tsx`, `src/styles/components.css`. Rapport : `docs/audits/landing/rapport-correction-landing-v3-2026-11-13.md`. Captures : `docs/audits/landing/apres-v4/`. Défauts 3 et 11 (base `site_content` migration 006) non touchés. Pas de commit.
- 2026-11-13 — **Test navigateur V2 validé** (Playwright, login e2e@bahkanso.ci) : dashboard-v2 affiche Résultat net +725 000 FCFA, Marge brute 85.294%, Tendance 6 mois (3M recettes / 525k dépenses), 5 alertes. **2 bugs critiques corrigés** : (1) RLS event_journal comparait farm_id à current_user_site_id() (un site_id) → 0 événement visible, nouvelle fonction current_user_farm_id() (migration 20261113000000) ; (2) DASHBOARD_SOURCES nincluait pas sites → KPIs bloqués en loading. Commit `d830b70`.
- 2026-11-13 — Bug `generate_sale_reference` corrigé (commit `76b902b`) : migration 019 utilisait `nextval('sale_ref_seq')` mais la séquence n'avait jamais été initialisée → collision avec VTE-2026-00001. Remplacé par MAX + pg_advisory_xact_lock par année (reset auto au changement d'année, résistant aux imports manuels et suppressions). Test : INSERT 2 ventes → VTE-2026-00003 et 00004, trg_log_sale alimente event_journal (5 recettes, 3.8M XOF).
- 2026-11-13 — Mission landing hero + Facebook : corrigé chargement hero (CLS 0.018→0) et ajouté composant `FacebookFeed`. URL Facebook `[URL_PAGE_FACEBOOK]` remplacée par `facebook_url` lu depuis `site_content['cta']` et éditable dans SiteContentEditor (section CTA). Fichiers : `src/pages/LandingPage.tsx`, `src/components/landing/FacebookFeed.tsx`, `src/pages/SiteContentEditor.tsx`. Rapport : `docs/audits/landing/rapport-facebook-sitevitrine-2026-11-13.md`. typecheck/build/lint/tests verts. Pas de commit.
- 2026-11-14 — Audit en lecture seule de 8 modules (aucune modification de code, aucun commit) : Exploitation, Finance, Stocks/Inventory, Fournisseurs, Médias, Surveillance, Projets/Chantiers, Configuration, Dashboard, Auth/Landing. Rapports : `docs/audits/2026-11-14-audit-module-exploitation.md`, `docs/audits/2026-11-14-audit-module-finance.md`, `docs/audits/2026-11-14-audit-module-inventory.md`, `docs/audits/2026-11-14-audit-module-media.md`, `docs/audits/2026-11-14-audit-module-suppliers.md`, `docs/audits/2026-11-14-audit-module-surveillance.md`, `docs/audits/2026-11-14-audit-module-projets.md`, `docs/audits/2026-11-14-audit-module-configuration.md`, `docs/audits/2026-11-14-audit-module-dashboard.md`, `docs/audits/2026-11-14-audit-module-auth-landing.md`.
- 2026-11-14 — Corrections sûres + cohérence DataContext + RBAC : ClientsPage (loadModule finance+exploitation, hasPermission 'clients/write'), Suppliers (loadModule finance), BailleursPage (loadModule finance, hasPermission 'bailleurs/write'), Dashboard (hasPermission 'finance/read', prioritySourcesPending/Error de useDashboardStats), useDashboardStats (ajout prioritySourcesError), Dashboard.test.tsx (mock useDashboardStats). Vérifications : typecheck 0, lint 0 erreur, tests 121/121. Commit créé (non poussé).
- 2026-11-14 — Corrections suppressions (règle §8/§11) : BailleursPage (ajout bloc finally), AnimauxPage/CampagnesPage/RecoltesPage/LotsPage (finally ferme setConfirmDelete au lieu de setDetail*), LotsPage (retiré window.confirm redondant), Projects (ajout try/catch/finally), SitesPage (ajout try/catch/finally). Vérifications : typecheck 0, lint 0 erreur, tests 121/121.
- 2026-11-14 — Blocage double clic sur les suppressions (règle §8) : ajout du flag `isDeleting` sur ClientsPage, BailleursPage, Suppliers, SitesPage (bouton propre) et AnimauxPage, CampagnesPage, RecoltesPage, LotsPage, Projects (via prop `deleteDisabled` ajouté au composant partagé DetailModal). Vérifications : typecheck 0, lint 0 erreur, tests 121/121.
- 2026-11-14 — Migration JournalCulturePage vers useValidatedForm + zod (audit gap I1) : formulaire d'opérations culturelles migré du useState/FormData manuel vers `useValidatedForm` + `operationSchema`. Commité (`4db08ed`).
- 2026-11-14 — Finance Vague 1 : suppression `console.log('PAYLOAD UPDATE:')` dans FundingsTab (I6) ; séparation des deux valeurs `transfer` en `transfer_bank_to_cash` / `transfer_cash_to_bank` dans TreasuryTab (I4). `refresh()` déjà présent via `refetch()` dans FundingsTab et DocumentsTab (F1). Commité (`fdc7c7a`).
- 2026-11-14 — Stocks/Inventory Vague 1 (S1) : alignement du nom de module `inventory` partout — `MODULE_SOURCES.stock` → `inventory` dans DataContext.tsx, `loadModule('stock')` → `loadModule('inventory')` dans Inventory.tsx. La route AppRoutes utilisait déjà `inventory`. Commité (`21944f9`).
- 2026-11-14 — Surveillance Vague 1 (S1) : correction de la règle 5 « Client inactif » dans `src/pages/surveillance/tabs/AlertesTab.tsx` — vérifie désormais l'absence de vente dans les 60 derniers jours (jointure avec `sales` sur `customer_id` + `date >= -60j`) avant de créer l'alerte, au lieu de créer une alerte pour chaque client existant. Vérifications : typecheck 0, lint 0 erreur, tests 121/121. Non commité.
- 2026-11-14 — Phase 2 RLS, LOCAL uniquement (supabase local, jamais le distant). Migration `supabase/migrations/20261114000000_rls_global_by_role_phase2.sql` créée et appliquée via `supabase db reset`. Politiques RLS par rôle sur 10 tables (customers, sale_items, sites, funding_allocations, transactions, documents, funders, fundings, expenses, sales) : accès global administrateur/propriétaire, périmètre site pour gestionnaire/comptable/auditeur, financeur par funder_id. FORCE RLS sur toutes les tables. 0 politique USING/WITH CHECK permissive. Tests par rôle OK (admin/propriétaire global, gestionnaire site-scopé, comptable lecture seule, financeur ses propres fundings, anon bloqué, écritures refusées). Script : `scripts/test-rls-phase2.sql`. typecheck exit 0, tests 121/121. Pas de commit.
- 2026-11-14 — Application des recommandations d'audit des formulaires : unifie la validation email via `validateEmail` partagé (LoginPage, UsersPage, BailleursPage, ClientsPage), remplace `window.confirm` par `ConfirmDeleteModal` (Configuration ListEditor, SiteContentEditor `confirmDeleteFeature`), clarifie le doublet Description/Commentaire dans JournalCulturePage (label → "Description"). Correction TS2304 dans ClientsPage : ajout `import { supabase }`, `const [, setSaving] = useState(false)`, `sites` au lieu de `sitesOptions`. Fichiers : `src/lib/validation/schemas.ts`, `src/pages/LoginPage.tsx`, `src/pages/UsersPage.tsx`, `src/pages/configuration/BailleursPage.tsx`, `src/pages/configuration/ClientsPage.tsx`, `src/pages/Configuration.tsx`, `src/pages/SiteContentEditor.tsx`, `src/pages/exploitation/JournalCulturePage.tsx`, `src/pages/exploitation/AnimauxPage.tsx`. Vérifications : tests 121/121, lint 0 erreur, typecheck seul TS5101 préexistant (config `baseUrl`). Commité.
- 2026-11-14 — Homepage LandingPage : retiré les 3 `<br>` littéraux (héro, Notre suivi, localisation) remplacés par des `span.block` CSS. Vérifications : lint 0 erreur, typecheck seul TS5101 préexistant, tests 121/121. Commit `3154759`.
- 2026-11-14 — FacebookFeed : ajout de la gestion d'erreur iframe (état iframeError, onError/onLoad, affichage de fallback avec bouton « Réessayer »). Fichier : src/components/landing/FacebookFeed.tsx. typecheck/lint/tests verts.
- 2026-11-15 — Correction des blocs catch vides (mission #30, CLAUDE.md §4/§10) : remplacement de 5 `} catch {}` par affichage d'erreur via `getErrorMessage` + `toast.show` dans `src/pages/exploitation/RecoltesPage.tsx`, `src/modules/Finance/tabs/ExpensesTab.tsx`, `src/modules/Finance/tabs/FundingsTab.tsx` (2), `src/modules/Sales/SalesModule.tsx`, `src/modules/Finance/tabs/DocumentsTab.tsx`. Imports et hooks `useToast`/`getErrorMessage` ajoutés là où absents. Vérifications : 0 bloc catch vide restant, typecheck seul TS5101 préexistant, tests 121/121. Pas de commit.
- 2026-11-15 — Audit authentification (plan approuvé) : tests LoginPage (11) et ProfilePage (10) écrits, tous verts (21/21) ; Gap 1 responsable_chantier ajouté à FINANCE_ACCESS_ROLES (src/lib/rbac.ts) ; Gap 2 champ `active` vérifié au signIn (src/lib/AuthContext.tsx) ; Gap 4 logAudit enveloppé dans try/catch (src/pages/ProfilePage.tsx). Gaps 3 et 5 déjà résolus dans le code. Travail non commité.
- 2026-11-15 — Correction erreur media.name NOT NULL : la table `media` définit `name text NOT NULL` sans défaut (migration 20261031000001), mais le payload d'insertion dans `src/pages/Media.tsx:118` envoyait `title` à la place. Renommé `title`→`name` dans le payload, l'état du formulaire, la recherche, l'affichage, les messages logAudit et l'interface `Media` (src/lib/types.ts:453). typecheck sans erreur sur les fichiers modifiés.
- 2026-11-15 — Correction des erreurs TypeScript hors scope : `src/pages/ProfilePage.test.tsx` (`mockSupabase.from().update/.eq` mal typés car `.from()` retourne un `PostgrestQueryBuilder`, remplacé par des `vi.fn()` locaux), `src/pages/exploitation/JournalCulturePage.tsx` (`z.nativeEnum` sur objet complexe remplacé par `z.enum(Object.keys(...))`, et `e.target.value as OperationTypeKey` résolu en cascade), `src/pages/LoginPage.test.tsx` (`navigate` en TDZ à cause du hoisting de `vi.mock`, passé en `var` assigné dans la factory). typecheck 0 erreur, tests 21/21 (LoginPage + ProfilePage) verts.
- 2026-11-16 — Correction lien en double dans le module surveillance : `src/pages/surveillance/SurveillancePage.tsx` — le bouton "Alertes" dans le PageHeader était redondant (le lien "Surveillance" du sidebar redirige déjà vers l'onglet alertes par défaut, et le sidebar propose déjà un enfant "Alertes"). Le bouton "Événements" est conservé. Import `AlertCircle` supprimé (devenu inutilisé). Commit `cea9992`.
- 2026-11-16 — Champ « URL de la page Facebook » absent de la section CTA : le composant monté est `Configuration.tsx` (route `/app/configuration`), pas `SiteContentEditor.tsx`. Ajout du champ `facebook_url` (type `url`) à la sous-section `cta` de `src/pages/Configuration.tsx`. Vérifications : typecheck 0 erreur, lint 0 erreur, tests 21/21. Committé dans `148f427`.
- 2026-11-16 — Flux social Facebook « Faux Flux » sur la Landing Page : ajout du champ `facebook_images` (liste d'URLs) à la section CTA de `Configuration.tsx`, création du composant `FacebookFeedPreview.tsx` (grille de 4 photos sans iframe, bouton vers la page Facebook), intégration dans `LandingPage.tsx` après la section `nos-activites` et remplacement de l'ancien `<FacebookFeed>` ; correction d'une balise `</div>` non fermée sur le wrapper carte. Vérifications : typecheck 0 erreur, eslint 0 erreur, tests 142/142. Committé dans `148f427`.
- 2026-11-16 — Correction lint : variable inutilisée `errorMessage` retirée dans `src/hooks/useAsyncAction.ts` ; `var` remplacé par `vi.hoisted()` pour `navigate` dans `src/pages/LoginPage.test.tsx`. Vérifications : eslint 0 erreur, tests 11/11 (LoginPage), typecheck 0. Committé dans `148f427`.

## Ce qui a été fait (résumé)

1. **Sécurité RLS** : Politiques least-privilege sur `fundings`, `expenses`, `sales`, `app_users`, `funders`.
   - `FORCE ROW LEVEL SECURITY` activé.
   - Helpers `current_*` (SECURITY DEFINER + `row_security = off`).
   - Tests d'intégration avec vrai JWT.

2. **Journal d'Événements** :
   - Table `event_journal` (immuable).
   - Triggers sur `expenses`, `harvests`, `sales`, `animal_events`, `tasks`.
   - Traçabilité complète.

3. **KPIs** (7 au total) :
   - Rendement (kg/ha)
   - Avancement chantier (%)
   - Marge brute (XOF)
   - Coût de revient (XOF/unité)
   - Taux de mortalité (%)
   - GMQ (g/jour)
   - Marge par culture (XOF)

4. **Tests** :
   - 121/121 tests unitaires (Vitest, fork isolation, cleanup global dans setup.tsx depuis 80e642d).
   - 3 tests RLS sales.
   - Tests d'intégration RLS (pgTAP + vitest).

5. **Infrastructure** :
   - `supabase db reset` 100% reproductible.
   - Déploiement Surge (`npx surge dist/ bahkanso.surge.sh`).

6. **Conformité §9 (2026-11-13)** : 9 pages + DashboardV2 + dédup `event_journal`. Voir `docs/audits/2026-11-13-loadmodule-audit.md` et `docs/audits/2026-11-13-dashboardv2-investigation.md`.

## Commandes utiles

```bash
# Redémarrer l'environnement
supabase stop --no-backup
supabase start
supabase db reset

# Lancer les tests
npm run typecheck
npm run lint
npx vitest run src/

# Build et déployer
npm run build
npx surge dist/ bahkanso.surge.sh
```
