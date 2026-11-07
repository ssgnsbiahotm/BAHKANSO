# Phase C — Intégration des composants Phase B dans les 4 formulaires financiers

Date : 2026-11-07 17:30
Branche : main
Commit : 57bfb49
Auteur : Claude Code (agent) + validation humaine

## Contexte

Phases A (financial_links) et B1→B4 (EntityPicker, EntityLinkPicker, DatePicker, SiteField) terminées et commitées. Phase C intègre ces 4 composants dans les formulaires financiers existants sans refactoriser le reste.

## Objectif

Remplacer les champs de saisie d'entité/date/site par les composants Phase B et ajouter la répartition financial_links (EntityLinkPicker) dans :
- src/modules/Finance/tabs/ExpensesTab.tsx
- src/modules/Finance/tabs/FundingsTab.tsx
- src/pages/exploitation/RecoltesPage.tsx
- src/modules/Sales/SalesModule.tsx

## Constats

### ExpensesTab (déjà intégré précédemment, confirmé)
- supplier_id → EntityPicker (funder) — supprimé
- date/date_paid → DatePicker mode engagement-payment
- site → SiteField
- EntityLinkPicker ajouté (totalAmount=amount, transaction_type='expense')
- persistExpenseLinks (delete-then-insert) appelé dans onSubmit, chargé à l'edit

### FundingsTab (intégré cette session)
- funder_id select → EntityPicker (entityType="funder")
- date_sent/date_received inputs → DatePicker mode engagement-payment
- site select/input → SiteField
- EntityLinkPicker ajouté (totalAmount=amount_sent, transaction_type='funding')
- persistFundingLinks useCallback : delete financial_links type='funding' puis insert
- Chargement des liens à l'edit, reset à la création

### RecoltesPage (intégré cette session)
- plot_id select → EntityPicker (entityType="plot")
- campaign_id select → EntityPicker (entityType="campaign")
- site_id select → SiteField
- date input → DatePicker mode single
- EntityLinkPicker ajouté (totalAmount=quantity×estimated_price, transaction_type='harvest_revenue')
- persistHarvestLinks, openEdit async pour le chargement des liens

### SalesModule (intégré cette session)
- site_id select → SiteField
- customer_id select → EntityPicker (entityType="customer")
- date input → DatePicker mode single
- EntityLinkPicker ajouté (totalAmount=somme des items, transaction_type='sale')
- persistSaleLinks, openEdit async pour le chargement des liens

## Validation technique

```
set -o pipefail; npm run typecheck 2>&1 | tail -3; echo "TSC: $?"
→ TSC: 0
set -o pipefail; npm run build 2>&1 | tail -3; echo "BUILD: $?"
→ BUILD: 0
```

Tests composants Phase B (chacun isolément, car interférence pré-existante entre fichiers) :
- EntityPicker : 3 tests passés
- DatePicker : 4 tests passés
- SiteField : 4 tests passés
- EntityLinkPicker : 3 tests passés

## Conclusion

Phase C intégrée dans les 4 formulaires. Typecheck et build passent. Aucun nouveau package npm. Aucun composant Phase B modifié.

## Décisions humaines requises

Aucune.

## Fichiers modifiés

- src/modules/Finance/tabs/ExpensesTab.tsx (déjà intégré, confirmé)
- src/modules/Finance/tabs/FundingsTab.tsx
- src/pages/exploitation/RecoltesPage.tsx
- src/modules/Sales/SalesModule.tsx

## Prochaine étape

1 commit atomique contenant l'intégration Phase C dans les 4 formulaires.
