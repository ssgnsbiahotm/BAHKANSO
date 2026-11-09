# Contexte du projet BAHKANSO — Point de reprise

**Date de mise à jour** : 2026-11-09
**Branche de référence** : `feat/dashboard-v2`
**Dernier commit** : `ae328fe` (commit précédent)
**URL production** : https://bahkanso.surge.sh

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

6. **Dashboard v2** (en cours, non commité) :
   - Nouvelle page `src/pages/DashboardV2.tsx` derrière le flag `dashboard_v2` (localStorage `bahkanso.dashboard_v2`).
   - Contexte global unique (site/période/campagne) via `src/hooks/useDashboardScope.ts`, synchronisé URL.
   - 4 KPIs héros sourcés depuis `event_journal` (adaptateur `src/lib/dashboard/dashboard-data-source.ts`, pas de lecture de `farms`).
   - États de donnée explicites : loading / no_data / ok / warn / crit.
   - Composants UI : `DashboardKpiCard`, `DashboardTrendChart` (SVG pur), `DashboardActionList`.
   - Hooks : `useDashboardData`, `useDashboardTrend`, mappers purs `src/lib/dashboard/dashboard-mappers.ts` (14 tests unitaires).
   - Route `/app/dashboard-v2` dans `src/routes/AppRoutes.tsx` (ancien `/app/dashboard` intact).
   - Ancien dashboard inchangé avec le flag OFF.
   - **Corrections appliquées** (fichiers non commités) :
     - `src/pages/DashboardV2.tsx:192` : remplacement du `!` non-null (interdit CLAUDE.md §4) par un narrowing explicite sans `!`.
     - `src/hooks/useDashboardData.ts` : garde `periodStart === '' || periodEnd === ''` → no_data, remplacement `instanceof Error` par objet `{message}`.
     - `src/lib/format.ts` : nouvel export `parsePeriod` (lignes 62-87).
     - `src/components/ui/DashboardKpiCard.tsx` : guard `{isClickable && href && ...}` sur `<Link to>`.
     - `src/components/ui/DashboardTrendChart.tsx` : `hasData = data.length > 0`, sommes `data.reduce` sur toute la période.
     - Nouveaux tests : `src/lib/parsePeriod.test.ts` (9 tests), `src/hooks/useDashboardData.test.ts` (4 tests).

## Ce qui reste à faire (P1/P2)

- [ ] Ajouter `RequireModule(action='write')` sur les onglets fundings/expenses.
- [ ] Créer `.env.example`.
- [ ] Corriger les 23 warnings ESLint (non bloquants).
- [ ] Polish UX D1/D2 (formulaires financiers).
- [ ] Ajouter des KPIs (trésorerie, graphiques).
- [ ] TODO Vague 3 : écran de restauration (corbeille) des événements archivés (surveillance_events.deleted_at)
- [ ] Dashboard v2 : vérification manuelle du flag on/off et persistance du scope (rechargement navigateur).
- [ ] Dashboard v2 : valider le comportement RLS de event_journal sur l'instance locale (garde-fou A).

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