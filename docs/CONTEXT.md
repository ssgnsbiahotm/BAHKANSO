# Contexte du projet BAHKANSO — Point de reprise

**Date de mise à jour** : 2026-11-13
**Branche de référence** : `main` (= `feat/dashboard-v2`, SHA `80e642d`)
**Dernier commit de code** : `80e642d` (fix import afterEach, suite OOM)
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
- 2026-11-13 — Correction visuelle landing page : 11 défauts analysés, 9 corrigés dans `src/pages/LandingPage.tsx` et `src/styles/components.css` (contraste hero, titre non rogné, label photo, CTA sous cartes, coches orphelines, espacement, redondance projet/objectif, horaires). Défauts 3 et 11 (base `site_content` migration 006) non touchés, à traiter par le responsable. Rapport : `docs/audits/landing/rapport-correction-landing-2026-11-13.md`. Pas de commit.
- 2026-11-13 — **Test navigateur V2 validé** (Playwright, login e2e@bahkanso.ci) : dashboard-v2 affiche Résultat net +725 000 FCFA, Marge brute 85.294%, Tendance 6 mois (3M recettes / 525k dépenses), 5 alertes. **2 bugs critiques corrigés** : (1) RLS event_journal comparait farm_id à current_user_site_id() (un site_id) → 0 événement visible, nouvelle fonction current_user_farm_id() (migration 20261113000000) ; (2) DASHBOARD_SOURCES nincluait pas sites → KPIs bloqués en loading. Commit `d830b70`.

## À faire

- [ ] Test navigateur DashboardV2 (sélecteur Site, KPIs, tendance 6 mois, états loading/no_data) — nécessite auth + supabase start
- [ ] Clarifier avec le responsable métier la fenêtre 6 mois de la tendance (calendaire vs ancrée sur la `period` sélectionnée) — delta documenté Lot 2b
- [ ] Vérifier le comportement RLS `event_journal` sur instance locale (garde-fou A, rapport investigation)
- [ ] 26 warnings ESLint `react-hooks/exhaustive-deps` (dette technique, non bloquant)
- [ ] Déploiement surge (`npx surge dist/ bahkanso.surge.sh`) après validation navigateur
- [ ] Confirmer avec le responsable métier le traitement des défauts landing 3 (doublon "transparence") et 11 ("données de démonstration"), issus de `site_content` (migration 006) — non touchés, hors périmètre de cette mission

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
