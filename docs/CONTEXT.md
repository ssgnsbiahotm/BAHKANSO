# Contexte du projet BAHKANSO — Point de reprise

**Date de mise à jour** : 2026-11-10
**Branche de référence** : `feat/dashboard-v2`
**Dernier commit de code** : `2e70946` (commit précédent)
**URL production** : https://bahkanso.surge.sh

## État actuel

- 2026-11-10 — Hero couleurs de police landing (palette slate BAHKANSO) + vitest OOM (single worker, tas 4 Go) — terminée (2 commits : `570b49a`, `2e70946`), non commite dans CONTEXT.md.
- 2026-11-10 — Dashboard v2 cockpit : sélecteur Site global, réorganisation des KPIs (4 principaux + 4 accordéon au niveau ferme "Total exploitation") — terminée avec vérifications manuelles en attente, non commitee.
- 2026-11-10 — Refonte formulaire Site (SitesPage.tsx) : code auto-généré SIT-YYYY-NNN, statut supprimé à la création, responsable en dropdown app_users, localisation avec datalist — terminée, non commitee.

### Résumé de la mission — Dashboard v2 cockpit

Refonte de `src/pages/Dashboard.tsx` en cockpit : un seul sélecteur "Site" en haut (alimenté par `useSite`/`SiteContext`) qui filtre uniquement les blocs non-KPI portant `site_id` (campagnes, chantiers, lots, animaux) ; les 4 KPIs principaux (Marge brute, Coût de revient, Rendement, Alertes ouvertes) et les 4 KPIs accordéon (Avancement chantier, Taux de mortalité, GMQ, Marge par culture) restent au niveau ferme (farm_id), labelés "Total exploitation", non affectés par le sélecteur. Suppression des sélecteurs Campagne et Chantier. États loading/error/vide/non-calculable conservés. Grille 1/2/4 colonnes. Libellés français, montants FCFA. Fichiers principaux : `src/pages/Dashboard.tsx`, `src/pages/Dashboard.test.tsx`. Aucun commit, aucune modification de `kpi.ts`, `DataContext.tsx`, `vitest.config.ts`.

### Résumé de la mission — Refonte formulaire Site

Refonte du formulaire de création/édition de site dans `src/pages/configuration/SitesPage.tsx` : (1) le code `SIT-YYYY-NNN` est auto-généré via `generateEntityIdentifier` et affiché en lecture seule à la création ; (2) le champ Statut est retiré du formulaire de création (nouveau site = `actif`) ; (3) le Responsable passe d'un texte libre à un dropdown `app_users` stockant l'ID utilisateur dans la colonne `responsible` ; (4) la Localisation garde la saisie libre avec un `<datalist>` alimenté par la constante nommée `SITE_LOCALISATION_SUGGESTIONS`. Suppression du `useEffect` inutilisé qui fetchait `app_users` sans stocker le résultat. Fichier principal : `src/pages/configuration/SitesPage.tsx`. Aucun commit, aucune migration, typecheck/lint/build verts. Tests vitest en cours (problème OOM connu de l'environnement).

### À faire

- [ ] Vérification manuelle du cockpit dans le navigateur (sélecteur Site, bascule KPIs, affichage des sections)
- [ ] Commit des modifications `src/pages/Dashboard.tsx` et `src/pages/Dashboard.test.tsx` (mission n'en a pas fait la demande explicite — en attente)
- [ ] Mise à jour de ce fichier (`docs/CONTEXT.md`) à commiter si la mission le demande
- [ ] Vérification manuelle du formulaire Site (création, édition, dropdown Responsable, datalist Localisation)
- [ ] Tests vitest pour SitesPage une fois l'OOM d'environnement résolu

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
- [ ] Optimisation des tests : mocker Supabase pour eviter l'OOM de teardown sur useDashboardData.test.ts (dette technique, acceptee, non corrigee dans cette mission).

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