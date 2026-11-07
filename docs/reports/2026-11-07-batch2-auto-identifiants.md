# Batch 2 — Auto-génération des identifiants (4 entités)

Date : 2026-11-07
Branche : main
Commit : cff28bd (HEAD)
Auteur : Claude Code (agent) + validation humaine

## Contexte

Le pattern `src/lib/animal-ids.ts` (PREFIX-NNN) fonctionne en prod pour les animaux. La mission généralise ce pattern à 4 entités : Parcelle (PAR), Dépense (EXP), Financement (FND), Document (DOC). Chaque entité reçoit un champ `reference` auto-généré en lecture seule, préservé à l'édition, avec un garde-fou handleSubmit. Une contrainte UNIQUE DB est ajoutée là où manquante.

## Constats

**Avant la mission (audit préalable) :**
- `src/lib/entity-ids.ts` : helper `generateEntityIdentifier(prefix, tableName, columnName, supabaseClient, padLength=3)` créé et commité (50050b9).
- Toutes les 4 tables ont déjà la colonne `reference text`.
- UNIQUE présent sur 3/4 tables (fundings, expenses, documents dans migration 001) ; `plots.reference` sans UNIQUE (migration 002).

**Changes apportés (5 commits atomiques) :**

1. `50050b9 feat(nav): add generic entity identifier helper` — `src/lib/entity-ids.ts` (déjà commité avant cette session).
2. `a74a352 feat(exploitation): auto-generate plot reference (PAR-NNN)` — `src/pages/exploitation/ParcellesPage.tsx` : import ajouté ; `openCreate` async génère PAR-NNN puis `setForm('reference', preview)` ; `onClick={() => void openCreate()}` (2 sites) ; input référence readOnly ; onSubmit garde `finalReference` avec génération si vide.
3. `c2d83e1 feat(finance): auto-generate expense reference (EXP-NNN)` — `src/modules/Finance/tabs/ExpensesTab.tsx` : même pattern (import, `handleNewExpense` async, guard onSubmit, input readOnly).
4. `3815ff3 feat(finance): auto-generate funding reference (FND-NNN)` — `src/modules/Finance/tabs/FundingsTab.tsx` : même pattern (`handleNewFunding` async, `form.setFieldValue('reference', preview)`, guard onSubmit utilisant `finalReference` dans le payload et l'audit, input readOnly).
5. `5a17665 feat(finance): auto-generate document reference (DOC-NNN)` — `src/modules/Finance/tabs/DocumentsTab.tsx` : même pattern (`handleNewDocument` async, guard onSubmit, `finalReference` dans `documentData` et l'audit, input readOnly).
6. `cff28bd feat(db): add UNIQUE constraint on plots.reference` — nouvelle migration `supabase/migrations/20261107000000_add_unique_plots_reference.sql` (ne modifie pas une migration appliquée, ajout correctif timestamp postérieur).

## Validation

```
set -o pipefail; npm run typecheck 2>&1 | tail -5; echo "TSC_EXIT: ${PIPESTATUS[0]}"
→ TSC_EXIT: 0

set -o pipefail; npm run build 2>&1 | tail -5; echo "BUILD_EXIT: ${PIPESTATUS[0]}"
→ BUILD_EXIT: 0 (✓ built in ~10s)
```

Les deux commandes quittent avec le code 0. STOP CONDITION respectée (typecheck = 0).

## Conclusion

Toutes les 4 entités disposent désormais de l'auto-génération PREFIX-NNN sur leur champ `reference` :
- Parcelle → PAR-NNN
- Dépense → EXP-NNN
- Financement → FND-NNN
- Document → DOC-NNN

Le champ est pré-rempli à l'ouverture du formulaire, en lecture seule dans l'UI, et régénéré par le garde-fou handleSubmit si vide. La contrainte UNIQUE sur `plots.reference` est ajoutée via une migration corrective.

## Décisions humaines requises

Aucune.

## Fichiers modifiés

- src/lib/entity-ids.ts (helper, commit précédent)
- src/pages/exploitation/ParcellesPage.tsx
- src/modules/Finance/tabs/ExpensesTab.tsx
- src/modules/Finance/tabs/FundingsTab.tsx
- src/modules/Finance/tabs/DocumentsTab.tsx
- supabase/migrations/20261107000000_add_unique_plots_reference.sql (nouveau)

## Prochaine étape

Aucune — mission Batch 2 terminée (5 commits atomiques, typecheck et build verts).
