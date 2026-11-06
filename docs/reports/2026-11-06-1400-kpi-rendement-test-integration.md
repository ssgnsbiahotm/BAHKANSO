# Registre KPI — Rendement de campagne et test d'intégration

Date : 2026-11-06 14:00
Branche : main
Commit : 558a960 (HEAD)
Auteur : Claude Code (agent) + validation humaine

## Contexte

Le Journal d'Événements (`event_journal`) trace désormais les dépenses, récoltes, ventes et événements d'élevage. Cette étape ajoute un registre KPI permettant de calculer le rendement d'une campagne agricole.

## Objectif

1. Créer `src/lib/kpi.ts` avec la fonction `calculateYield(campaignId)`.
2. Créer le test d'intégration `tests/integration/kpi-yield.test.mjs`.
3. Valider avec `npx vitest run tests/integration/kpi-yield.test.mjs` (3/3 PASS) et s'assurer qu'il n'y a pas de régression sur la suite complète.

## Constats

### `src/lib/kpi.ts` (nouveau)

Fonction `calculateYield(campaignId: string, client = supabase): Promise<number | null>` :

1. Récupère la surface de la parcelle liée à la campagne (`campaigns.plot_id → plots.area_hectares`). Retourne `null` si la campagne n'existe pas, si la parcelle n'a pas de surface, ou si `surface <= 0`.
2. Récupère la somme des quantités récoltées dans `event_journal` filtrées par `entity_type='harvest'`, `event_type='recolte'` et `context->>campaign_id = campaignId` (le trigger `trg_log_harvest` alimente ce contexte).
3. Retourne `totalQuantity / surface` (rendement en kg par hectare).

Décisions d'adaptation :
- La colonne de surface est `area_hectares` (pas `surface_ha` comme dans l'ébauche initiale — la colonne n'existe pas dans le schéma).
- Le client Supabase est injectable en second paramètre (défaut : `supabase` de `src/lib/supabase.ts`) pour permettre les tests d'intégration avec `adminClient` (service role), les variables `VITE_*` n'étant pas définies en environnement Node de test.
- `src/lib/supabase.ts` n'a pas été modifié (interdit par CLAUDE.md), seulement importé en lecture.

### `tests/integration/kpi-yield.test.mjs` (nouveau)

3 tests :
1. `calculateYield` retourne le rendement d'une campagne : crée une ferme, un site lié, une parcelle (`area_hectares = 10`), une campagne, une récolte (`quantity = 5000`) qui alimente le journal via le trigger, puis vérifie que `calculateYield` renvoie `500` (5000 kg / 10 ha).
2. `calculateYield` retourne `null` quand la campagne n'existe pas.
3. `calculateYield` retourne `null` quand la parcelle a une surface de 0.

Le test suit les conventions du projet : `setupFixtures()` / `teardownFixtures()`, `adminClient` (service role), nettoyage de `event_journal` par `farm_id` dans `afterAll`.

## Commands Executed

1. `npx vitest run tests/integration/kpi-yield.test.mjs` (avec `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` exportés) → 3/3 PASS.
2. `npx vitest run tests/integration/` → 17/18 PASS (le seul échec est `current_user_funder_id() retourne NULL pour un comptable`, timeout 5s — flakiness pré-existant documenté dans le rapport précédent, non lié aux changements KPI, passe en isolation à la 3e exécution).

## Analysis

- La fonction `calculateYield` calcule correctement le rendement : 5000 kg / 10 ha = 500 kg/ha.
- Les cas limites (campagne inexistante, surface nulle) retournent bien `null`.
- Le trigger `trg_log_harvest` alimente bien `event_journal.context->>campaign_id`, permettant le filtrage par campagne.
- Aucun impact sur les tests existants : le seul échec de la suite complète est un flakiness pré-existant documenté.

## Findings

- **Confirmé** : `calculateYield` retourne le bon rendement (kg/ha) à partir du journal d'événements.
- **Confirmé** : les cas limites (campagne absente, surface 0) retournent `null`.
- **Flakiness pré-existant** : `current_user_funder_id()` timeout intermittent, non lié à cette étape.

## Actions Performed

1. Créé `src/lib/kpi.ts` (fonction `calculateYield`).
2. Créé `tests/integration/kpi-yield.test.mjs` (3 tests).
3. Aucun commit, aucun push.

## Validation

- `npx vitest run tests/integration/kpi-yield.test.mjs` → 3/3 PASS, exit 0.
- `npx vitest run tests/integration/` → 17/18 PASS (1 flakiness pré-existant non lié).

## Final Status

PASS

## Rapport

Rapport écrit : docs/reports/2026-11-06-1400-kpi-rendement-test-integration.md
Résumé : Registre KPI rendement créé, 3 tests d'intégration passent, aucune régression.
Décisions requises : aucune.

## Fichiers modifiés

- `src/lib/kpi.ts` (nouveau)
- `tests/integration/kpi-yield.test.mjs` (nouveau)

## Prochaine étape

Aucune. L'étape 5 (registre KPI rendement) est terminée et validée.
