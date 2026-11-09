# Lien 3 — Invalidation du cache et synchronisation des KPIs

Date : 2026-11-08
Branche : main
Commit : aucun (modifications non commitées)
Auteur : Claude Code (agent)

## Contexte

Dans le cadre de la mission "Danse du Cobra" (Cultures ↔ Finance), le Lien 3 porte sur l'invalidation du cache après mutation pour que les KPIs du tableau de bord se mettent à jour instantanément après la création, la modification ou la suppression d'une opération ou d'une dépense.

## Couche de données identifiée

Deux couches de données coexistent dans le projet :

1. **`src/lib/DataContext.tsx`** — React `useState` + `useContext` (pas de React Query). Charge toutes les sources au mount via `loadAll()`, expose `refresh()` (= `loadAll`) pour tout recharger. Les KPIs du dashboard passent par `useDashboardStats` (`src/hooks/useDashboardStats.ts`) qui lit directement l'état de `useData()` via `useMemo`.

2. **`src/modules/Finance/hooks/useFinanceData.ts`** — utilise `@tanstack/react-query` via `usePaginatedQuery`. Les clés de requête sont de la forme `['paginated', '<table>', ...]`. Par exemple pour les dépenses : `['paginated', 'expenses', '*', '[]', '{"column":"date","ascending":false}', 1, 50]`.

## Constats avant correction

- `src/pages/exploitation/OperationsPage.tsx` : appelle déjà `refresh()` après création/mise à jour (`handleFormSubmit`, fin du `try/catch`) et après suppression (`handleDeleteConfirmed`). ✅ Déjà couvert.
- `src/modules/Finance/tabs/ExpensesTab.tsx` : appelle `refetch()` (React Query) après création/mise à jour et suppression, mais n'appelait **pas** `refresh()` (DataContext). L'état `useData().expenses` restait obsolète jusqu'au rechargement de la page. ❌ Corrigé.
- `calculateGrossMargin` / `calculateCostPerUnit` (`src/lib/kpi.ts`) lisent directement `event_journal` en base, pas la table `expenses`. Les dépenses créées depuis `OperationsPage` ne sont pas écrites dans `event_journal`. ⚠️ Gap documenté (voir ci-dessous).

## Modifications apportées

### `src/modules/Finance/tabs/ExpensesTab.tsx`

1. Ajout de `refresh` dans le destructuring de `useData()` (ligne 97) :
   ```ts
   const { suppliers, refresh } = useData();
   ```

2. Ajout de `refresh()` dans l'`onSuccess` de création/mise à jour de dépense (après `refetch()`).

3. Ajout de `refresh()` dans l'`onSuccess` de suppression de dépense (après `refetch()`).

Ainsi, après toute mutation de dépense dans le module Finance, les deux couches sont invalidées :
- React Query : `refetch()` recharge la liste paginée des dépenses
- DataContext : `refresh()` recharge toutes les sources, ce qui fait recompute `useDashboardStats` immédiatement

### `src/pages/exploitation/OperationsPage.tsx`

Aucune modification supplémentaire nécessaire : `refresh()` était déjà appelé après création/mise à jour (`handleFormSubmit`) et suppression (`handleDeleteConfirmed`) d'opérations, y compris la création de dépense liée via `financial_links`.

## Vérification du double comptage

Aucun double comptage identifié :

- `useDashboardStats` KPIs (flux net, marge brute, etc.) somment les montants de la table `expenses` et des `transactions`.
- `calculateCampaignMargin` (`kpi.ts:207`) somme `crop_operations.cost + labor_cost` et `harvests.revenue`.
- Une dépense créée depuis une opération est insérée dans `expenses` uniquement ; elle n'est **pas** ajoutée à `crop_operations.cost`. Elle n'est donc comptée qu'une seule fois dans chaque KPI.

## Gap restant (à documenter, pas corrigé dans ce Lien)

`calculateGrossMargin` et `calculateCostPerUnit` lisent `event_journal` (`event_type = 'depense'`). Les dépenses créées depuis `OperationsPage` (via `supabase.from('expenses').insert(...)`) ne génèrent pas d'écriture dans `event_journal`. Ces deux KPIs ne reflèteront donc pas ces dépenses tant qu'aucun trigger ou écriture applicative vers `event_journal` n'est mis en place.

C'est un gap de couche de données (pas d'invalidation de cache), à traiter séparément (décision humaine requise : ajouter un trigger DB sur `expenses` ou une écriture applicative dans `event_journal` lors de la création de dépense depuis une opération).

## Fichiers modifiés

- `src/modules/Finance/tabs/ExpensesTab.tsx` — ajout de `refresh()` après mutation de dépense

## Validation

- `npx tsc --noEmit -p tsconfig.app.json` → exit 0 (typecheck OK sur l'ensemble du projet)
- `npx eslint src/modules/Finance/tabs/ExpensesTab.tsx` → 0 erreurs (1 warning préexistant `react-hooks/exhaustive-deps` sur `supabase` dans `persistExpenseLinks`, non lié à cette modification)

## Checklist manuelle (à valider)

1. [ ] Créer une dépense dans Finance > Dépenses → le KPI "Flux net enregistré" du Dashboard se met à jour sans recharger la page.
2. [ ] Modifier une dépense dans Finance → le KPI se met à jour.
3. [ ] Supprimer une dépense dans Finance → le KPI se met à jour.
4. [ ] Créer une opération dans Exploitation > Opérations avec le switch "Générer une dépense liée" activé → la dépense apparaît dans Finance et les KPIs se mettent à jour.
5. [ ] Supprimer une opération liée à une dépense (choix "Supprimer la dépense aussi") → la dépense est supprimée et les KPIs se mettent à jour.
6. [ ] Supprimer une opération liée à une dépense (choix "Détacher la dépense") → le lien est rompu, la dépense est conservée, les KPIs se mettent à jour.

## Décisions humaines requises

1. Écriture dans `event_journal` pour les dépenses créées depuis OperationsPage (nécessaire pour que `calculateGrossMargin`/`calculateCostPerUnit` les reflètent) : ajouter un trigger DB ou une écriture applicative ?

## Prochaine étape

Validation du Lien 3 par l'utilisateur, puis arrêt (pas de Lien 4 prévu dans cette phase — Élevage/Chantiers reportés à la Vague 2).
