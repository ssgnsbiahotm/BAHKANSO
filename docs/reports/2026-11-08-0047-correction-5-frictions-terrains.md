# Correction des 5 frictions UX/métier (test terrain)

Date : 2026-11-08 00:47
Branche : main
Commit : non commité (règle de mission : aucun commit/push)
Auteur : Claude Code (agent)

## Contexte

Cinq frictions UX/métier remontées lors d'un test terrain en production, à corriger dans l'ordre 2 → 1 → 3 → 4 → 5. Périmètre minimal : seule la correction nécessaire à chaque point est appliquée. Aucun commit, aucun push. Toute migration de base de données ou décision de modèle ambiguë est décrite dans ce rapport, non appliquée.

## Constats et corrections appliquées

### Point 2 — CampagnesPage : pré-remplissage automatique de la culture sur sélection de parcelle

**Friction** : lors de la création d'une campagne, l'utilisateur resaisit manuellement le nom de la culture alors que la parcelle sélectionnée porte déjà une `current_crop`.

**Correction** (`src/pages/exploitation/CampagnesPage.tsx`) :
- Ajout d'un `useRef` (`prevPlotId`) et d'un état `plotCrop` pour tracer la culture déduite de la parcelle sélectionnée.
- Sur `onChange` du `FormSelect` Parcelle : si la parcelle sélectionnée a une `current_crop`, le champ "Nom de la culture" est pré-rempli avec cette valeur et `plotCrop` est positionné ; sinon `plotCrop` est mis à null.
- En édition, si l'utilisateur garde la même parcelle, la culture déjà enregistrée n'est pas écrasée.
- Le champ "Nom de la culture" devient `readOnly` quand une culture est pré-remplie (débloquable par saisie manuelle, ce qui réinitialise `plotCrop`).
- Messages d'aide affichés : culture reprise de la parcelle / sélectionnez une parcelle pour pré-remplir / cette parcelle n'a pas de culture enregistrée.

### Point 1 — Carte interactive qui se retourne

**Constat** : aucune librairie de carte interactive (leaflet/maplibre) n'est présente dans le projet. Aucun composant carte n'existe.

**Décision** : non applicable — aucune modification de code. Rien à corriger.

### Point 3 — ParcellesPage : suppression et retrait du champ Localisation du formulaire

**Friction** : le champ `location` était exposé dans le formulaire de création/édition alors qu'il n'est pas pertinent au formulaire ; et la suppression de parcelle ne réinitialisait pas l'état de confirmation en cas d'erreur.

**Correction** (`src/pages/exploitation/ParcellesPage.tsx`) :
- Retrait de `location` du schéma zod `plotSchema`, de `DEFAULT_VALUES`, du payload d'insert/update, de `openEdit` et du `FormField` "Localisation" du formulaire.
- La colonne DB `location` est conservée intacte (pas de migration) : les affichages de détail (carte arrière, fiche détail) continuent de l'afficher.
- `handleDeleteConfirmed` enveloppé dans un `try/finally` appelant `setConfirmDelete(null)` dans le `finally`, et `setConfirmDelete` ajouté aux dépendances du `useCallback`.

### Point 4 — CampagnesPage : même friche que le Point 2 (pré-remplissage culture)

**Constat** : le Point 4 désigne la même zone de code que le Point 2 (CampagnesPage, pré-remplissage de la culture sur sélection de parcelle). Déjà traité par la correction du Point 2. Aucune modification supplémentaire nécessaire.

### Point 5 — OperationsPage : typage du champ Type (value/label)

**Friction** : le champ "Type" était un `FormInput` texte libre, sujet aux saisies incohérentes ("Travail, Intrants, Récolte, Autre" en placeholder seulement).

**Correction** (`src/pages/exploitation/OperationsPage.tsx`) :
- Ajout de la constante `TYPE_OPTIONS` (`{ value, label }[]`) : travail du sol, achat d'intrants, transport, récolte, autre.
- Remplacement du `FormInput` texte par un `FormSelect` lié à `TYPE_OPTIONS`.
- Message d'aide indiquant que le type "Achat d'intrants" doit être rapproché d'une dépense dans le module Finance.

### Points non appliqués (décisions de modèle / migration requises)

Le lien opération ↔ dépense (`operation_id` sur `expenses` ou `expense_id` sur `crop_operations`), la création automatique de dépense depuis une opération "Achat d'intrants", la gestion d'échec partiel et le comportement edit/delete lié nécessitent soit une migration de base de données, soit une décision d'architecture inter-module (Finance ↔ Exploitation). Conformément à la règle de mission, ces points ne sont pas appliqués : ils sont décrits ci-après pour décision humaine.

## Décisions humaines requises

1. Ajouter une colonne de lien (`operation_id` sur `expenses` ou `expense_id` sur `crop_operations`) via une nouvelle migration (timestamp postérieur, jamais modifier une migration appliquée).
2. Définir le comportement de création de dépense depuis OperationsPage quand le type est "Achat d'intrants" (naviguer vers Finance ? créer directement via l'API Finance ?).
3. Définir la gestion d'échec partiel (opération créée mais échec de la dépense associée, et inversement).
4. Définir le comportement edit/delete quand une opération est liée à une dépense existante.

## Fichiers modifiés (cette mission)

- `src/pages/exploitation/CampagnesPage.tsx` — pré-remplissage culture (Points 2 et 4)
- `src/pages/exploitation/ParcellesPage.tsx` — retrait location + try/finally suppression (Point 3)
- `src/pages/exploitation/OperationsPage.tsx` — TYPE_OPTIONS value/label (Point 5)

Fichiers non modifiés (Points 1 et décisions de modèle) : aucun.

## Validation

- `npx tsc --noEmit -p tsconfig.app.json` → exit 0 (typecheck OK sur l'ensemble du projet, couvrant les 3 fichiers modifiés).
- `npx eslint src/pages/exploitation/CampagnesPage.tsx` → 0 erreurs (1 warning préexistant sur une dépendance `useCallback`, non lié à ces edits).
- `npx eslint src/pages/exploitation/OperationsPage.tsx` → 0 erreurs (1 warning préexistant identique).

## Conclusion

Les points applicables sans migration (2, 3, 4, 5) sont corrigés et vérifiés (typecheck + lint OK). Le Point 1 est non applicable (pas de carte dans le projet). Les points nécessitant une migration/décision de modèle (lien opération ↔ dépense via `operation_id`, création de dépense Finance, échec partiel, edit/delete) sont reportés dans ce rapport pour décision humaine.

## Prochaine étape

Décision humaine sur les 4 points en suspens (migration `operation_id`, lien Finance, échec partiel, edit/delete) avant toute implémentation supplémentaire.
