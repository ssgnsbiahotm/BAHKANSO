# Audit du module Gestion (Finance + Ventes)

## Constat 1 — Aucun filtre site_id côté client sur les hooks Finance (HIGH)

**Preuves :**
- `src/modules/Finance/hooks/useFinanceData.ts` : les 4 hooks (`useTreasuryTransactions`, `useFundings`, `useExpenses`, `useDocuments`) n'appliquent aucun filtre `.eq('site_id', ...)` sur les requêtes Supabase.
- `src/modules/Finance/tabs/ExpensesTab.tsx` : liste des dépenses sans filtre `site_id`.
- `src/modules/Finance/tabs/TreasuryTab.tsx` : insert/update (lignes 227-238) et delete (lignes 278-284) de transactions sans `site_id`.
- `src/modules/Finance/tabs/DocumentsTab.tsx` : CRUD documents sans `site_id`.
- `src/modules/Finance/tabs/FundingsTab.tsx` : CRUD financements sans `site_id`.
- `src/modules/Finance/tabs/ModuleFinanceView.tsx` : lecture des dépenses par module (lignes 89-310) sans filtre `site_id`.

**Impact :** un gestionnaire ou comptable rattaché à un site voit toutes les dépenses, financements, transactions et documents de tous les sites. Violation de la règle métier de cloisonnement par site.

**Base de référence :** `site_id` existe sur `expenses` (migration 016) mais absent sur `fundings`, `transactions`, `documents`.

## Constat 2 — RLS trop large sur les tables ventes (HIGH)

**Preuves :**
- Migration `017_sales_module.sql` : policies `auth_select_customers`, `auth_select_sales`, `auth_select_sale_items` en `USING (true)` (lecture globale pour tout utilisateur authentiqué).
- Idem pour insert/update/delete sur customers, sales, sale_items (`WITH CHECK (true)` / `USING (true)`).
- Migration `019_rls_sales_tightening.sql` durcit ces policies mais ne couvre pas `fundings`, `transactions`, `documents` qui restent sans policy restrictive.

**Impact :** tout utilisateur authentifié peut lire/écrire/supprimer des clients, ventes et lignes de vente de n'importe quel site, indépendamment de son rattachement `site_id`.

## Constat 3 — Cloisonnement manquant sur fundings/transactions/documents (MEDIUM)

**Preuves :**
- `src/lib/types.ts` : `Funding` (pas de `site_id`), `Transaction` (pas de `site_id`), `Document` (pas de `site_id`).
- Migration `016_multi_sites.sql` : aucune colonne `site_id` ajoutée sur `fundings`, `transactions`, `documents` ; seule `funding_allocations` lie un funding à des sites.
- Aucun hook Finance ne filtre par site sur ces tables.

**Impact :** impossible de restreindre la lecture/écriture des financements, trésoreries et documents au site de l'utilisateur.

## Constat 4 — Ventes filtrées côté client uniquement (MEDIUM)

**Preuves :**
- `src/modules/Sales/hooks/useSalesData.ts` : requête `sales` sans filtre `site_id` SQL ; le filtre site est appliqué en mémoire React dans `SalesModule.tsx` (lignes 258-277, `filteredSales`).
- Les stats calculées en mémoire portent sur l'ensemble des ventes retournées par le serveur.

**Impact :** si une vente d'un autre site est retournée par le serveur (RLS insuffisant), elle apparaîtrait brièvement dans les stats avant filtrage client.

## Constat 5 — Pas de contrôle d'accès au niveau composant Finance (MEDIUM)

**Preuves :**
- `src/modules/Finance/FinanceModule.tsx` : aucun appel à `RequireModule`, `hasPermission` ou `canAccessFinance` avant d'afficher les onglets.
- Les onglets Fundings/Treasury/Documents/Expenses sont rendus quel que soit le rôle de l'utilisateur.

**Impact :** un utilisateur sans permission finance peut accéder à l'interface Finance (le blocage ne se fait qu'au niveau RLS base, qui est parfois large, voir Constat 2 et 3).

## Synthèse des risques

| Risque | Gravité | Tables concernées |
|---|---|---|
| Lecture/écriture trans-sites dépenses | HIGH | expenses |
| Lecture/écriture trans-sites ventes/clients | HIGH | customers, sales, sale_items |
| Pas de cloisonnement fundings | MEDIUM | fundings, funding_allocations |
| Pas de cloisonnement transactions/documents | MEDIUM | transactions, documents |
| Absence de garde d'accès composant | MEDIUM | tous les onglets Finance |
