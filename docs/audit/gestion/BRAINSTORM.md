# Brainstorm — Corrections module Gestion

## Idée 1 : Ajouter site_id aux tables manquantes et filtrer côté client

Ajouter `site_id` sur `fundings`, `transactions`, `documents` (migration), puis appliquer `.eq('site_id', current_user_site_id)` dans les hooks Finance quand l'utilisateur n'est pas admin/propriétaire.

**Avantages :** cloisonnement cohérent sur toutes les tables du module Gestion.
**Inconvénients :** requête de migration, modification de 4 hooks + formulaires d'insert pour pré-remplir `site_id`.
**Fichiers :** `src/modules/Finance/hooks/useFinanceData.ts`, nouvelle migration SQL.

## Idée 2 : Durcir les RLS au niveau base (current_user_site_id)

Remplacer les policies `USING (true)` sur customers/sales/sale_items par des policies utilisant `current_user_site_id()` (déjà défini en 019). Créer des policies restrictives sur fundings, transactions, documents via `funding_allocations` ou une colonne `site_id` ajoutée.

**Avantages :** protection au niveau base, indépendante du client. Résout la cause racine.
**Inconvénients :** complexité SQL, risque de régression sur les lectures admin (besoin de `current_user_site_id() IS NULL` pour les admins).
**Fichiers :** migrations SQL.

## Idée 3 : Garde d'accès au niveau composant (RequireModule/RequireRole)

Ajouter `RequireModule('finance')` et `RequireRole` dans `FinanceModule.tsx` et chaque onglet, pour bloquer l'affichage avant toute requête.

**Avantages :** bloquage précoce, UX claire, défense en profondeur.
**Inconvénients :** ne remplace pas le filtrage de données (un rôle autorisé peut encore voir d'autres sites).
**Fichiers :** `src/modules/Finance/FinanceModule.tsx`, onglets Finance.

## Idée 4 : Filtrer les ventes par site côté serveur (SQL)

Ajouter un filtre `site_id` dans la requête `useSalesData` au lieu du seul filtrage mémoire React. Utiliser une fonction RPC ou le filtre direct avec `current_user_site_id()`.

**Avantages :** élimine la fuite de données avant filtrage client, stats justes.
**Inconvénients :** nécessite que `site_id` soit connu côté client ou appel RPC.
**Fichiers :** `src/modules/Sales/hooks/useSalesData.ts`.

## Idée 5 : Pré-remplir site_id dans les formulaires de création

Dans `TreasuryTab`, `FundingsTab`, `ExpensesTab`, `DocumentsTab`, `SaleFormModal`, pré-remplir le `site_id` de l'utilisateur connecté et le rendre en lecture seule (ou masqué) pour les non-admins.

**Avantages :** empêche la création de données dans un mauvais site.
**Inconvénients :** doit être complété par un contrôle serveur (RLS) pour être fiable.
**Fichiers :** formulaires de création dans les onglets Finance et Sales.

## Idée 6 : Vue agrégée par site avec RLS

Créer des vues `v_expenses_by_site`, `v_fundings_by_site`, `v_transactions_by_site` avec RLS restrictive, utilisées par les hooks au lieu des tables brutes.

**Avantages :** centralise la logique de cloisonnement.
**Inconvénients :** plus d'objets base à maintenir, performances à vérifier.
**Fichiers :** migrations SQL + hooks.

## Recommandation (lot prioritaire)

1. Appliquer l'Idée 2 (durcir RLS base) — cause racine, protège tous les clients.
2. Appliquer l'Idée 3 (garde d'accès composant) — bloquage précoce UX.
3. Appliquer l'Idée 1 (filtrer site_id côté client + colonnes manquantes) — cohérence affichage.
4. Appliquer l'Idée 4 (ventes côté serveur) — stats justes.
