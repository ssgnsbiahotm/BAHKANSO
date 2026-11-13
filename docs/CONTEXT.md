# Contexte du projet BAHKANSO — Point de reprise

**Date de mise à jour** : 2026-11-13
**Branche de référence** : `main` (= `feat/dashboard-v2`, SHA `7fa2bb2`)
**Dernier commit de code** : `7fa2bb2` (refactor Lot 2b)
**URL production** : https://bahkanso.surge.sh

## État actuel

- 2026-11-13 — Nettoyage main : .gitignore corrigé (Master PDF Editor Portable, supabase/.temp), rapports d'audit 2026-11-11 commités, migration consolidation Option C sécurisée (576 lignes, audit sûreté OK : 0 DROP destructif, 18 DROP IF EXISTS, 0 DDL auth, 5 INSERT runtime-only), fix a11y LoginPage, fix e2e sélecteur module-btn-primary. Commits : `41fafa7`, `9eed748`, `19e61ef`, `24e4797`, `05fcbbf`, `1b54710`.
- 2026-11-13 — Audit §9 loadModule : 17 conformes, 9 à ajouter, 1 risque élevé (DashboardV2), 6 hors scope. Rapport : `docs/audits/2026-11-13-loadmodule-audit.md` (commit `1da5f9f`).
- 2026-11-13 — Lot 1 §9 : 9 pages déclarent `loadModule` (Inventory, Projects, Reports, Suppliers, ExploitationModule, JournalCulturePage, LotsPage, AnimauxPage, SitesPage). Modules stock/projets ajoutés à DataContext pour sources orphelines (inventoryItems, inventoryMovements, projects, projectSteps). Commits : `151646e`, `27d3ad4`.
- 2026-11-13 — Investigation DashboardV2 (commit `39486b9`) : 9 requêtes `event_journal` cataloguées, RLS FORCE confirmé, options A-E comparées, décision : ne PAS ajouter `event_journal` à `DASHBOARD_SOURCES` (volumétrie append-only).
- 2026-11-13 — Lot 2a DashboardV2 (commit `f585a6f`) : `loadModule('dashboard')` + états loading/no_data corrects. Distinction idle/loading (loading) vs success sans farmId (no_data) vs success avec farmId (ok). 5 défauts du premier jet corrigés.
- 2026-11-13 — Lot 2b DashboardV2 (commit `7fa2bb2`) : déduplication `useDashboardTrend` (61 lignes + 11 types + imports supprimées) via `clientDataSource.getTrend` appelé dans le même `fetchData` que `getKpis` (`Promise.all`). 1 seule requête `event_journal` par scope au lieu de 2. 11/11 tests, typecheck exit 0, lint 0 erreur.
- Conformité §9 : 9 pages + DashboardV2 + dédup `event_journal`. Voir `docs/audits/2026-11-13-loadmodule-audit.md` et `docs/audits/2026-11-13-dashboardv2-investigation.md`.

## À faire

- [ ] Test navigateur DashboardV2 (sélecteur Site, KPIs, tendance 6 mois, états loading/no_data) — nécessite auth + supabase start
- [ ] Fix OOM vitest `useDashboardData.test.ts` (teardown hang, mock Supabase) — bloque la suite complète
- [ ] Clarifier avec le responsable métier la fenêtre 6 mois de la tendance (calendaire vs ancrée sur la `period` sélectionnée) — delta documenté Lot 2b
- [ ] Vérifier le comportement RLS `event_journal` sur instance locale (garde-fou A, rapport investigation)
- [ ] 26 warnings ESLint `react-hooks/exhaustive-deps` (dette technique, non bloquant)
- [ ] Déploiement surge (`npx surge dist/ bahkanso.surge.sh`) après validation navigateur

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
   - 101/101 tests unitaires (Vitest, fork isolation).
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