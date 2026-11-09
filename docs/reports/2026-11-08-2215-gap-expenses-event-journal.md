# Correction du gap expenses → event_journal

Date : 2026-11-08 22:15
Branche : main
Commit : aucun (modifications non commitées)
Auteur : Claude Code (agent) + validation humaine

## Contexte

Les dépenses créées depuis `OperationsPage` (switch "Générer une dépense liée") ne généraient pas d'écriture dans `event_journal`. Les KPIs `calculateGrossMargin` et `calculateCostPerUnit` lisent `event_journal` (`event_type = 'depense'`) et ne reflétaient donc pas ces dépenses.

## Constats

1. **Table `expenses` sans colonne `farm_id`** (`supabase/migrations/20260929171038_001_core_tables.sql:223-245`) : la table `expenses` n'a pas de colonne `farm_id`. Le trigger `log_event()` doit chercher le `farm_id` via une jointure `sites`.

2. **Trigger `log_event()`** (`supabase/migrations/20261106000000_event_journal_triggers.sql:12-44`) : cherche `farm_id` via `SELECT farm_id FROM public.sites WHERE id = NEW.site_id`. Si le site n'a pas de `farm_id` (colonne nullable sur `sites`), `v_farm_id` est `NULL` et le trigger skippe silencieusement l'insertion dans `event_journal` (pas d'erreur, juste pas d'écriture).

3. **Insertion dans OperationsPage** (`src/pages/exploitation/OperationsPage.tsx:213-227`) : l'insertion de la dépense ne passait pas `farm_id` (la colonne n'existait pas). Seuls `site_id` et les champs métiers étaient transmis.

## Décisions humaines requises

Aucune — l'approche (ajouter `farm_id` à `expenses` + le passer à l'insertion) a été validée implicitement par la décision de corriger le gap immédiatement.

## Fichiers modifiés

1. `supabase/migrations/20261108000000_trigger_expenses_to_event_journal.sql` (nouveau) :
   - Ajoute `farm_id uuid REFERENCES public.farms(id)` à `public.expenses`
   - Ajoute un index `expenses_farm_id_idx`
   - Met à jour `log_event()` pour utiliser `NEW.farm_id` en priorité, puis chercher via `sites` en fallback
   - Recrée le trigger `trg_log_expense` (garantit l'absence de doublon)
   - Garde-fou : vérifie `row_security = off` sur `log_event()`

2. `src/pages/exploitation/OperationsPage.tsx` (lignes 188-190, 204, 223) :
   - Calcule `expenseFarmId` depuis le site sélectionné (`selectedSite?.farm_id ?? null`)
   - Passe `farm_id: expenseFarmId` dans l'insertion et la mise à jour de dépense

3. `src/pages/exploitation/OperationsPage.test.tsx` (nouveau) :
   - Test d'intégration vérifiant qu'une dépense créée depuis OperationsPage passe bien `farm_id` dans l'insertion `expenses`

## Validation

- `npx vitest run src/pages/exploitation/OperationsPage.test.tsx` → 1 test passé
- `npx tsc --noEmit -p tsconfig.app.json` → exit 0 (typecheck OK)
- `npx eslint src/pages/exploitation/OperationsPage.tsx src/pages/exploitation/OperationsPage.test.tsx` → 0 erreurs (2 warnings préexistants non liés)

## Prochaine étape

Appliquer la migration sur la base de données distante (`supabase db push` ou équivalent), puis vérifier en test d'intégration réel qu'une dépense créée depuis OperationsPage apparaît bien dans `event_journal`.
