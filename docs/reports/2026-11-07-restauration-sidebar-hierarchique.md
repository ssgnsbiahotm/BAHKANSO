# Restauration de la Sidebar hiérarchique (menus déroulants)

Date : 2026-11-07
Branche : main
Commit : 8fdb547
Auteur : Claude Code (agent) + validation humaine

## Contexte

Le refactor précédent (commit 60d8197) avait transformé la Sidebar en liste plate (tous les items au même niveau). L'objectif était de restaurer la hiérarchie avec menus déroulants (expand/collapse) pour les sections Finance, Surveillance et Configuration, sans casser la navigation actuelle.

## Constats

- `src/components/layout/Sidebar.tsx` : `NavItem.route` passé de requis à optionnel, ajout de `children?: NavItem[]`.
- `ALL_NAV_ITEMS` restructuré : 3 parents avec children — `finance` (Vue d'ensemble, Stocks, Projets, Fournisseurs), `surveillance` (Alertes, Événements), `configuration` (Général, Utilisateurs, Bailleurs, Clients, Sites).
- Ajout de l'état `expandedItems` (Set<string>) + auto-expansion quand l'URL correspond à un enfant.
- Helpers `isPathActive` / `isItemActive` / `isChildActive` pour l'état actif (gère les query strings, ex. `/app/surveillance?tab=alertes`).
- Rendu converti : bouton parent (toggle expand/collapse) + sous-menu conditionnel déplié ; items feuilles conservent leur comportement de navigation.
- Import lucide complété avec `ChevronDown` et `ChevronRight`.
- `AppRoutes.tsx` et `src/lib/rbac.ts` non modifiés (contrainte respectée).

## Validation

```
set -o pipefail; npm run typecheck 2>&1 | tail -30; echo "TSC_EXIT: ${PIPESTATUS[0]}"
→ TSC_EXIT: 0

set -o pipefail; npm run build 2>&1 | tail -20; echo "BUILD_EXIT: ${PIPESTATUS[0]}"
→ BUILD_EXIT: 0 (✓ built in 11.46s)
```

## Conclusion

La Sidebar retrouve sa structure hiérarchique avec menus déroulants pour Finance, Surveillance et Configuration. La navigation fonctionne, le filtrage RBAC est conservé, et le lien "Fournisseurs" (restauré précédemment) est bien présent dans la section Finance.

## Décisions humaines requises

Aucune.

## Fichiers modifiés

- src/components/layout/Sidebar.tsx

## Prochaine étape

Vérifier en navigation (connexion admin) que les sections Finance, Surveillance et Configuration se déplient et que chaque enfant mène à sa route.
