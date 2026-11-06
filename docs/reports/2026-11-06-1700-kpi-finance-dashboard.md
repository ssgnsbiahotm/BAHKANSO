# KPIs Finance — Marge brute et Coût de revient (Étape 8)

Date : 2026-11-06 17:00
Branche : main
Commit : c44726f (HEAD, non commit)
Auteur : Claude Code (agent)

## Contexte

Le module KPIs (`src/lib/kpi.ts`) contenait déjà `calculateYield` (rendement de campagne) et `calculateProjectProgress` (avancement de chantier). Cette étape ajoute deux KPIs Finance : la marge brute (ventes − dépenses) et le coût de revient unitaire (dépenses / quantité produite), puis les affiche au Dashboard.

## Objectif

1. Ajouter `calculateGrossMargin(farmId, startDate?, endDate?, client?)` à `src/lib/kpi.ts`.
2. Ajouter `calculateCostPerUnit(farmId, campaignId?, client?)` à `src/lib/kpi.ts`.
3. Créer `tests/integration/kpi-finance.test.mjs` (5 tests d'intégration).
4. Modifier `src/pages/Dashboard.tsx` pour afficher ces deux KPIs avec un sélecteur de ferme.
5. Valider : vitest, typecheck, build.

## Constats

### `src/lib/kpi.ts` (modifié)

- `calculateGrossMargin` : deux requêtes séparées sur `event_journal` (`.in()` non supporté par la version de supabase-js), filtres par `farm_id`, `event_type` ('recette'/'depense') et intervalle `occurred_at`. Retourne `recettes − depenses`.
- `calculateCostPerUnit` : récupère dépenses et récoltes pour la ferme, filtre côté JS par `context.campaign_id`, retourne `totalDepenses / totalQuantity` ou `null` si aucune quantité produite.
- Le client Supabase est injectable (défaut `supabase`, anonym pour le Dashboard, `adminClient` pour les tests).

### `tests/integration/kpi-finance.test.mjs` (nouveau)

5 tests, tous passant :
1. `calculateGrossMargin` retourne recettes − dépenses (2500).
2. `calculateGrossMargin` filtre par intervalle de dates (800 aujourd'hui, −300 hier).
3. `calculateCostPerUnit` retourne 20 (1000 / 50 kg).
4. `calculateCostPerUnit` retourne `null` quand aucune quantité produite.
5. `calculateGrossMargin` ignore les événements d'autres fermes (1500).

`beforeEach` nettoie `event_journal` pour `farmId` (évite les fuites entre tests).

### `src/pages/Dashboard.tsx` (modifié)

- Import de `calculateGrossMargin` et `calculateCostPerUnit`.
- Nouveaux états : `farms`, `farmId`, `grossMarginValue`, `costPerUnitValue`, `grossMarginLoading`, `costPerUnitLoading`.
- `useEffect` de chargement des fermes depuis `farms`.
- `useEffect` de calcul des deux KPIs quand `farmId` change.
- Nouvelle section "BIS2. KPIS FINANCE" : sélecteur de ferme + deux `KpiCard` (Marge brute en XOF, Coût de revient unitaire en XOF/unité).

## Corrections pendant l'étape

1. `totalQuantity`/`totalDepenses` pouvaient être `undefined` (déduction TS quand `depenses`/`recoltes` est `null`) → ajout de garde `!totalQuantity` et `totalDepenses!`.
2. `debug_finance.mjs` (fichier de debug en racine) supprimé.

## Commands Executed

1. `npx vitest run tests/integration/kpi-finance.test.mjs` → 5/5 PASS, exit 0.
2. `npm run typecheck` → exit 0 (après correction des 3 erreurs TS sur `totalQuantity`/`totalDepenses`).
3. `npm run build` → exit 0, 59 entrées précache.
4. `npx vitest run tests/integration/` → 25/26 PASS, 1 échec pré-existant (`current_user_funder_id()` timeout 5s, non lié, documenté).
5. `rm debug_finance.mjs` → supprimé.

## Analysis

- `calculateGrossMargin` calcule correctement recettes − dépenses, avec filtre par date et isolation par ferme.
- `calculateCostPerUnit` calcule dépenses / quantité produite, retourne `null` quand quantité ≤ 0.
- Le Dashboard compile et affiche les deux KPIs Finance via `supabase` (anon client).
- Le typecheck est vert (exit 0) et le build passe sans erreur.

## Findings

- **Confirmé** : 5/5 tests kpi-finance passent.
- **Confirmé** : typecheck exit 0.
- **Confirmé** : build exit 0.
- **Flakiness pré-existant** : `current_user_funder_id()` timeout dans `helpers.test.mjs`, non lié à ces changements, passe en isolation (déjà documenté à l'étape 7).

## Actions Performed

1. Modifié `src/lib/kpi.ts` (ajout `calculateGrossMargin` + `calculateCostPerUnit`, correction des types `totalQuantity`/`totalDepenses`).
2. Créé `tests/integration/kpi-finance.test.mjs` (5 tests).
3. Modifié `src/pages/Dashboard.tsx` (sélecteur de ferme + 2 KpiCards finance).
4. Supprimé `debug_finance.mjs`.
5. Aucun commit, aucun push.

## Validation

- `npx vitest run tests/integration/kpi-finance.test.mjs` → 5/5 PASS, exit 0.
- `npm run typecheck` → exit 0.
- `npm run build` → exit 0.
- `npx vitest run tests/integration/` → 25/26 PASS (1 échec pré-existant non lié).

## Final Status

PASS

## Rapport

Rapport écrit : docs/reports/2026-11-06-1700-kpi-finance-dashboard.md
Résumé : KPIs Finance (marge brute et coût de revient) ajoutés à kpi.ts, 5 tests d'intégration passent, Dashboard mis à jour, typecheck et build verts, aucune régression.
Décisions requises : aucune.
Fichiers modifiés :
- `src/lib/kpi.ts` (modifié)
- `tests/integration/kpi-finance.test.mjs` (nouveau)
- `src/pages/Dashboard.tsx` (modifié)
- `debug_finance.mjs` (supprimé)
Prochaine étape : aucune.
