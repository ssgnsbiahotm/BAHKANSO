# KPIs Élevage et Marge de Campagne — Étape 9

Date : 2026-11-06 20:00
Branche : main
Commit : c44726f (HEAD, non commit)
Auteur : Claude Code (agent) + validation humaine

## Contexte

Le module KPIs (`src/lib/kpi.ts`) contenait déjà `calculateYield`, `calculateProjectProgress`, `calculateGrossMargin` et `calculateCostPerUnit`. Cette étape ajoute trois KPIs Élevage (taux de mortalité, gain moyen quotidien) et un KPI Marge de campagne, puis les affiche au Dashboard.

## Objectif

1. Ajouter `calculateMortalityRate(farmId, startDate?, endDate?, client?)` à `src/lib/kpi.ts`.
2. Ajouter `calculateAverageDailyGain(farmId, animalId?, client?)` à `src/lib/kpi.ts`.
3. Ajouter `calculateCampaignMargin(campaignId, client?)` à `src/lib/kpi.ts`.
4. Créer `tests/integration/kpi-livestock.test.mjs` (mortalité + GMQ).
5. Créer `tests/integration/kpi-campaign-margin.test.mjs` (marge de campagne).
6. Modifier `src/pages/Dashboard.tsx` pour afficher les 3 nouveaux KPIs.
7. Valider : vitest, typecheck, build.

## Constats

### `src/lib/kpi.ts` (modifié)

- `calculateMortalityRate` : filtre `event_journal` par `farm_id` et `event_type IN ('naissance', 'mort')` (implémenté via filtre JS car `.in()` n'est pas supporté par la version de supabase-js), intervalle de dates optionnel, retourne `(deaths / (births + deaths)) * 100` ou `0`.
- `calculateAverageDailyGain` : récupère les sites de la ferme, puis les animaux avec `weight_kg` et `birth_date`, calcule `weight_kg / jours_depuis_naissance` en moyenne. Retourne `null` si aucune donnée.
- `calculateCampaignMargin` : `harvests.revenue − crop_operations(cost + labor_cost)` par `campaign_id`. Retourne `0` sans donnée.
- Les trois fonctions acceptent désormais un paramètre `client` injectable (défaut `supabase`) pour la testabilité, cohérent avec `calculateGrossMargin` et `calculateCostPerUnit`.
- Suppression de l'utilisation de `.in()` (non supporté) au profit d'un filtre JS sur `event_type`.

### `tests/integration/kpi-livestock.test.mjs` (nouveau)

6 tests, tous passés :
1. `calculateMortalityRate` retourne 25 (1 mort / 4 événements).
2. `calculateMortalityRate` filtre par intervalle de dates (0 aujourd'hui, 50 hier).
3. `calculateMortalityRate` retourne 0 sans événement.
4. `calculateAverageDailyGain` retourne un GMQ > 0 pour un animal avec poids.
5. `calculateAverageDailyGain` retourne `null` sans animal.
6. `calculateAverageDailyGain` filtre par animal spécifique.

### `tests/integration/kpi-campaign-margin.test.mjs` (nouveau)

4 tests, tous passés :
1. `calculateCampaignMargin` retourne 3350 (4000 − 650).
2. `calculateCampaignMargin` retourne 0 sans donnée.
3. `calculateCampaignMargin` ignore les données d'une autre campagne.
4. `calculateCampaignMargin` avec seulement des recettes (5000).

### `src/pages/Dashboard.tsx` (modifié)

- Import des 3 nouvelles fonctions depuis `@/lib/kpi`.
- Nouveaux états : `mortalityRateValue`, `adgValue`, `mortalityLoading`, `adgLoading`, `campaignMarginValue`, `campaignMarginLoading`.
- `useEffect` de calcul des KPIs élevage (mortalité + GMQ) quand `farmId` change.
- `useEffect` de calcul de la marge de campagne quand `campaignId` change.
- Nouvelle section "BIS3. KPIS ÉLEVAGE" : sélecteur de ferme + 2 KpiCards (Taux de mortalité en %, GMQ en kg/jour).
- Nouvelle section "BIS4. MARGE DE CAMPAGNE" : sélecteur de campagne + 1 KpiCard (Marge de campagne en XOF).

## Décisions humaines requises

Aucune.

## Fichiers modifiés

- `src/lib/kpi.ts` (modifié) — injection de client + filtre JS sur event_type
- `src/pages/Dashboard.tsx` (modifié) — 2 nouvelles sections KPI élevage/campagne
- `tests/integration/kpi-livestock.test.mjs` (nouveau) — 6 tests
- `tests/integration/kpi-campaign-margin.test.mjs` (nouveau) — 4 tests

## Prochaine étape

Aucune — étape terminée. Aucun commit ni push sans demande explicite.

## Validation

- `npx vitest run tests/integration/kpi-livestock.test.mjs tests/integration/kpi-campaign-margin.test.mjs` → 6/6 PASS, 4/4 PASS.
- `npx vitest run tests/integration/` → 32/32 PASS, 0 FAIL (suite complète sans régression).
- `npm run typecheck` → exit 0.
- `npm run build` → exit 0.
- ESLint sur les fichiers modifiés : pas d'erreur introduite (l'erreur `no-explicit-any` ligne 15 de kpi.ts est pré-existante, dans `calculateYield`, non touchée).

## Final Status

PASS

## Rapport

Rapport écrit : docs/reports/2026-11-06-2000-kpi-elevage-campagne-dashboard.md
Résumé : KPIs Élevage (mortalité, GMQ) et Marge de campagne ajoutés à kpi.ts, 10 tests d'intégration passent, Dashboard mis à jour avec 2 nouvelles sections, typecheck et build verts, aucune régression.
Décisions requises : aucune.
Fichiers modifiés :
- `src/lib/kpi.ts` (modifié)
- `src/pages/Dashboard.tsx` (modifié)
- `tests/integration/kpi-livestock.test.mjs` (nouveau)
- `tests/integration/kpi-campaign-margin.test.mjs` (nouveau)
Prochaine étape : aucune.
