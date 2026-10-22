# Plan de correction — Module Gestion

## Objectif
Corriger les fuites de données trans-sites et les manquants de contrôle d'accès dans le module Gestion (Finance + Ventes), sans modifier l'architecture existante ni les fonctionnalités opérationnelles.

## Phase 1 — Sécurisation base de données (RLS)

1. Ajouter la colonne `site_id` sur `fundings`, `transactions`, `documents` si absente (nouvelle migration).
2. Remplacer les policies `USING (true)` sur `customers`, `sales`, `sale_items` par des policies utilisant `current_user_site_id()` avec exception `IS NULL` pour admin/propriétaire.
3. Créer des policies restrictives sur `fundings`, `transactions`, `documents` (via `funding_allocations` ou colonne `site_id` ajoutée).
4. Conserver `current_user_site_id()` existant (migration 019).

Fichiers : nouvelles migrations SQL dans `supabase/migrations/`.

## Phase 2 — Contrôle d'accès composant

1. Ajouter `RequireModule('finance')` dans `FinanceModule.tsx` avant le rendu des onglets.
2. Ajouter `RequireRole` ou vérification `hasPermission` sur les onglets sensibles (Treasury, Documents, Fundings selon le rôle).
3. Vérifier que `RequireAuth` est bien présent sur `/app/finance` et `/app/ventes` dans `AppRoutes.tsx`.

Fichiers : `src/modules/Finance/FinanceModule.tsx`, `src/routes/AppRoutes.tsx`, `src/routes/authGuard.tsx`.

## Phase 3 — Filtrage site_id côté client (hooks)

1. Dans `useFinanceData.ts`, appliquer `.eq('site_id', siteIdUtilisateur)` quand l'utilisateur n'est pas admin/propriétaire (récupéré depuis `app_users`).
2. Dans `useSalesData.ts`, ajouter un filtre `site_id` SQL en complément du filtrage mémoire React existant.
3. Pré-remplir `site_id` dans les formulaires de création (Treasury, Fundings, Expenses, Documents, SaleFormModal), champ masqué ou lecture seule selon le rôle.

Fichiers : `src/modules/Finance/hooks/useFinanceData.ts`, `src/modules/Sales/hooks/useSalesData.ts`, formulaires de création.

## Phase 4 — Tests et validation

1. Vérifier `git diff --check`.
2. Lancer les tests existants (vitest/playwright si configurés) sans modifier les données distantes.
3. Vérifier la cohérence TypeScript (`npm run build` ou `tsc --noEmit`).
4. Revue finale du diff.

Livrables : aucun commit, aucun push, aucun déploiement (lecture seule validée par l'utilisateur avant toute modification).

## Rollback
Chaque migration SQL doit être accompagnée d'une migration de rollback ou être réversible (`DROP COLUMN` / recréation des policies précédentes). Les changements de composants sont réversibles via `git revert`.

## Dépendances
- Dépend de la migration 019 (`current_user_site_id()`).
- Dépend de `src/lib/auth.ts` / `AuthContext` pour connaître le `site_id` de l'utilisateur connecté côté client.
