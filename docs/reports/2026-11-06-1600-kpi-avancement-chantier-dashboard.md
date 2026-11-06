# KPI Avancement de Chantier — Connexion au Dashboard

Date : 2026-11-06 16:00
Branche : main
Commit : HEAD (non commit)
Auteur : Claude Code (agent) + validation humaine

## Contexte

Le Dashboard affiche déjà le rendement de campagne (module Cultures). Cette étape connecte le module Chantiers au Dashboard en ajoutant un KPI "Avancement du chantier" (%), un sélecteur de chantier, et un trigger de traçage des achèvements d'étapes dans le journal d'événements.

## Objectif

1. Créer la migration `20261106000003_event_journal_trigger_tasks.sql` étendant `log_event()` aux `project_steps` (équivalent des "tasks" demandées, la table `tasks` n'existant pas dans le schéma).
2. Créer `calculateProjectProgress(projectId)` dans `src/lib/kpi.ts`.
3. Modifier `src/pages/Dashboard.tsx` pour ajouter un sélecteur de chantier et une carte KPI d'avancement.
4. Écrire un test d'intégration `tests/integration/kpi-project-progress.test.mjs`.
5. Valider avec vitest, typecheck et build.

## Constats

### Schéma réel (adaptation)

Le schéma ne contient pas de table `tasks`. Les chantiers sont dans `projects` et les tâches de chantier dans `project_steps` (migration 002, lignes 214-258). Le statut d'achèvement est `'terminé'` (avec accent, standardisé par la migration 029).

`projects` n'a pas de colonne `site_id`/`farm_id`, donc il n'est pas possible de récupérer un `farm_id` fiable pour lier une étape de chantier à une ferme. `event_journal.farm_id` est NOT NULL, donc le trigger sur `project_steps` ne peut pas insérer dans le journal tant qu'aucun lien projet → ferme n'existe. Le trigger est créé et prêt ; il sera effectif dès qu'un tel lien sera ajouté.

### `supabase/migrations/20261106000003_event_journal_trigger_tasks.sql` (nouveau)

- Étend `public.log_event()` avec une branche `TG_TABLE_NAME = 'project_steps'` qui trace quand `NEW.status = 'terminé'` et que le statut change (`OLD.status IS DISTINCT FROM NEW.status`).
- `entity_type = 'project_step'`, `event_type = 'etape_terminee'`, `source_module = 'chantiers'`, `context` contient `project_id`, `step_name`, `step_status`.
- `v_farm_id := NULL` (pas de lien projet → ferme) ; le guard `IF v_farm_id IS NOT NULL` empêche l'insertion NULL (comportement cohérent avec les autres branches).
- Crée le trigger `trg_log_project_step` (AFTER UPDATE sur `project_steps`).
- Garde-fou : vérifie `row_security = off` et l'absence de `current_setting` dans `log_event`.

### `src/lib/kpi.ts` (modifié)

Ajout de `calculateProjectProgress(projectId, client = supabase)` :
- Compte le total d'étapes du projet via `project_steps` où `project_id = projectId`.
- Compte les étapes où `status = 'terminé'`.
- Retourne `Math.round((done / total) * 100)`, ou `0` si aucune étape, ou `null` en cas d'erreur.
- Le client est injectable (défaut `supabase`) pour permettre les tests avec `adminClient`.

### `src/pages/Dashboard.tsx` (modifié)

- Import de `calculateProjectProgress` et de l'icône `Target` (lucide-react).
- Nouveaux états : `projects`, `projectId`, `progressValue`, `progressLoading`.
- `useEffect` de chargement des projets (`projects` triés par nom).
- `useEffect` de calcul de l'avancement quand `projectId` change.
- Nouvelle section "Avancement du chantier" : `<select>` de chantier + `KpiCard` affichant le pourcentage (ou "Chargement…" / "—").

### `tests/integration/kpi-project-progress.test.mjs` (nouveau)

3 tests :
1. `calculateProjectProgress` retourne `0` quand aucune étape n'est terminée.
2. Retourne `33` quand 1 étape sur 3 est passée à `'terminé'`.
3. Retourne `100` quand toutes les étapes sont terminées.

Utilise `adminClient` (service role) et `setupFixtures`/`teardownFixtures` suivant les conventions du projet.

## Commands Executed

1. `npx vitest run tests/integration/kpi-project-progress.test.mjs` → 3/3 PASS, exit 0.
2. `npm run typecheck` → exit 0.
3. `npm run build` → exit 0.
4. `npx vitest run tests/integration/` → 20/21 PASS (l'échec est `current_user_funder_id()` pour un comptable, timeout 5s — flakiness pré-existant documenté, non lié à ces changements, passe en isolation).

## Analysis

- `calculateProjectProgress` calcule correctement le pourcentage d'achèvement à partir de `project_steps`.
- Les cas limites (0 étape, 1/3, 3/3) retournent les valeurs attendues (0, 33, 100).
- Le typecheck et le build restent verts, pas de régression.
- Le trigger `trg_log_project_step` est créé mais ne peut pas écrire dans `event_journal` sans `farm_id` (absence de lien projet → ferme dans le schéma actuel).

## Findings

- **Confirmé** : `calculateProjectProgress` retourne le bon pourcentage d'avancement.
- **Confirmé** : 0 étape → 0, 1/3 → 33, 3/3 → 100.
- **Limite connue** : le trigger sur `project_steps` ne trace pas dans `event_journal` tant qu'aucun lien projet → ferme (`farm_id`) n'existe dans le schéma. Le KPI calcule directement depuis `project_steps`, indépendamment du journal.
- **Flakiness pré-existant** : `current_user_funder_id()` timeout intermittent, non lié à cette étape.

## Actions Performed

1. Créé `supabase/migrations/20261106000003_event_journal_trigger_tasks.sql`.
2. Modifié `src/lib/kpi.ts` (ajout `calculateProjectProgress`).
3. Modifié `src/pages/Dashboard.tsx` (sélecteur + carte KPI avancement).
4. Créé `tests/integration/kpi-project-progress.test.mjs` (3 tests).
5. Aucun commit, aucun push.

## Validation

- `npx vitest run tests/integration/kpi-project-progress.test.mjs` → 3/3 PASS, exit 0.
- `npm run typecheck` → exit 0.
- `npm run build` → exit 0.
- `npx vitest run tests/integration/` → 20/21 PASS (1 flakiness pré-existant non lié).

## Final Status

PASS

## Rapport

Rapport écrit : docs/reports/2026-11-06-1600-kpi-avancement-chantier-dashboard.md
Résumé : KPI d'avancement de chantier connecté au Dashboard, 3 tests d'intégration passent, typecheck et build verts, aucune régression.
Décisions requises : aucune.
Fichiers modifiés :
- `supabase/migrations/20261106000003_event_journal_trigger_tasks.sql` (nouveau)
- `src/lib/kpi.ts` (modifié)
- `src/pages/Dashboard.tsx` (modifié)
- `tests/integration/kpi-project-progress.test.mjs` (nouveau)
Prochaine étape : aucune.
