# Module Gestion — Cartographie

Le module « Gestion » recouvre Finance (financements, dépenses, trésorerie, documents) et Ventes (clients, ventes, lignes de vente). Il est cloisonné par site (`site_id`) au niveau base de données, mais pas systématiquement côté client.

## Fichiers sources

| Fichier | Rôle | Lignes clés |
|---|---|---|
| `src/modules/Finance/FinanceModule.tsx` | Coordonne les 5 onglets | onglets fundings/expenses/documents/treasury/by-module |
| `src/modules/Finance/hooks/useFinanceData.ts` | 4 hooks de données | useTreasuryTransactions, useFundings, useExpenses, useDocuments — aucun filtre `site_id` |
| `src/modules/Finance/tabs/ExpensesTab.tsx` | Liste dépenses + KPI | DataTable, pas de filtre `site_id` |
| `src/modules/Finance/tabs/TreasuryTab.tsx` | CRUD transactions | insert/update lignes 227-238, delete 278-284, pas de `site_id` |
| `src/modules/Finance/tabs/DocumentsTab.tsx` | CRUD documents | upload Supabase storage `app-assets` (5MB), `logAudit`, pas de `site_id` |
| `src/modules/Finance/tabs/FundingsTab.tsx` | CRUD financements | schéma zod, `logAudit`, pas de `site_id` |
| `src/modules/Finance/tabs/ModuleFinanceView.tsx` | Vue par module | `parseActivity` lignes 71-83, lecture dépenses par module 89-310, pas de filtre `site_id` |
| `src/modules/Sales/SalesModule.tsx` | Module Ventes | cartes rotatives, filtres site/statut/période côté client uniquement |
| `src/modules/Sales/hooks/useSalesData.ts` | Hooks ventes | `useSimpleQuery` sur `sales` + `customers`, aucun filtre `site_id` SQL |
| `src/modules/Sales/components/SaleFormModal.tsx` | Formulaire vente | (à compléter si pertinent) |
| `src/lib/rbac.ts` | RBAC | `ROLE_PERMISSIONS` lignes 82-218, `FINANCE_ACCESS_ROLES` lignes 260-269 |
| `src/routes/authGuard.tsx` | Garde d'accès | `RequireAuth`, `RequireModule`, `RequireRole` |

## Interfaces métier (src/lib/types.ts)

- `Expense` : `site_id` présent (ligne 128) mais non filtré dans les requêtes
- `Project` : `site_id` présent (ligne 287)
- `Funding` : **pas de `site_id`** direct (réparti via `funding_allocations`)
- `Transaction` : **pas de `site_id`**
- `Document` : **pas de `site_id`**
- `Sale` / `Customer` : `site_id` présent (lignes 465, 452)
- `AppUser` : `site_id` présent (ligne 24), NULL = accès global

## Migrations SQL pertinentes

| Migration | Objet |
|---|---|
| `016_multi_sites.sql` | Ajoute `site_id` sur `expenses`, `projects`, `campaigns`, `animal_lots` ; crée `funding_allocations` ; RLS `authenticated` USING true |
| `017_sales_module.sql` | Crée `customers`, `sales`, `sale_items` avec `site_id` ; RLS large (`USING (true)`) |
| `018_seed_sites.sql` | 5 sites UUID fixes, rattache données existantes à Katadji (`11111111-...`) |
| `019_rls_sales_tightening.sql` | `current_user_site_id()`, policies strictes sur sites/funding_allocations/customers/sales/sale_items |
| `010_rls_by_role_pilot.sql` | policies expenses/fundings/animals/app_users via `current_user_has_role` |
| `011_rls_by_role_part2.sql` | policies documents, animal_lots, animal_events, plots, campaigns, cash_accounts |
| `012_rls_by_role_complete.sql` | policies inventory, suppliers, projects, media, monitoring, surveillance, configuration, finance tables |
| `20261021120000_cleanup_audit_logs_policies.sql` | nettoyage policies audit_logs |

## Rôles concernés par le module Gestion

Tous les rôles ont `finance: read` (sauf `auditeur` lecture seule). `finance: write` : administrateur, propriétaire, financeur, gestionnaire, comptable, responsable_agricole, responsable_élevage. `finance: delete` : administrateur, comptable uniquement.

## Observations structurelles

- Cloisonnement `site_id` présent en base sur `expenses`, `projects`, `sales`, `customers`, `animal_lots`, `campaigns`.
- Absent sur `fundings`, `transactions`, `documents` (pas de colonne `site_id`).
- Les requêtes côté client (hooks) n'appliquent aucun filtre `site_id` : lecture globale, reliant sur RLS côté serveur.
- RLS migration 017 large (`USING (true)`) sur customers/sales/sale_items — durci par 019 mais seulement pour sales/customers/sale_items, pas pour fundings/transactions/documents.
- `useSalesData` filtre par site uniquement côté client (mémo React), pas au niveau SQL.
