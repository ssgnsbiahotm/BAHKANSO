# Rapport d'inspection SQL — schémas RLS (fundings, expenses, app_users)

## Mission
Vérifier la structure réelle en base des tables concernées par les politiques RLS (fundings, expenses, app_users, funders, farms) avant d'écrire la migration correctrice `rls_fundings_expenses_least_privilege`.

## Contexte
- Projet : BAHKANSO (local, branche `rls/fundings-expenses`)
- Base : Supabase local, `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- Date : 2026-11-03
- Lecture seule : aucune modification, aucune migration écrite

## Tables inspectées

### public.app_users

| Colonne | Type | Nullable |
|---------|------|----------|
| id | uuid | NO |
| name | text | NO |
| email | text | OUI |
| role | text | NO |
| phone | text | OUI |
| avatar_url | text | OUI |
| active | boolean | OUI |
| last_login | timestamptz | OUI |
| created_at | timestamptz | OUI |
| auth_id | uuid | OUI |
| site_id | uuid | OUI |

FK :
- `app_users_auth_id_fkey` → `auth.users(id)` ON DELETE CASCADE
- `app_users_site_id_fkey` → `sites(id)` ON DELETE SET NULL

**`app_users` n'a ni `farm_id` ni `funder_id`.** Elle a `site_id` et `role`.

### public.fundings

| Colonne | Type | Nullable |
|---------|------|----------|
| id | uuid | NO |
| reference | text | OUI |
| funder_id | uuid | OUI |
| amount_sent | numeric | NO |
| currency_sent | text | NO |
| exchange_rate | numeric | OUI |
| amount_received | numeric | OUI |
| transfer_fees | numeric | OUI |
| date_sent | date | NO |
| date_received | date | OUI |
| destination_account_id | uuid | OUI |
| bank_reference | text | OUI |
| status | text | NO |
| project_id | uuid | OUI |
| comment | text | OUI |
| created_by | uuid | OUI |
| created_at | timestamptz | OUI |
| updated_at | timestamptz | OUI |
| site_id | uuid | OUI |

FK :
- `fundings_created_by_fkey` → `app_users(id)` ON DELETE SET NULL
- `fundings_funder_id_fkey` → `funders(id)` ON DELETE SET NULL
- `fundings_site_id_fkey` → `sites(id)` ON DELETE SET NULL

**`fundings` a `funder_id` (→ funders), `created_by` (→ app_users), `site_id`. Pas de `farm_id`.**

### public.expenses

| Colonne | Type | Nullable |
|---------|------|----------|
| id | uuid | NO |
| reference | text | OUI |
| date | date | NO |
| amount | numeric | NO |
| currency | text | OUI |
| category | text | OUI |
| supplier_id | uuid | OUI |
| responsible | text | OUI |
| payment_method | text | OUI |
| bank_account_id | uuid | OUI |
| cash_account_id | uuid | OUI |
| project_id | uuid | OUI |
| activity | text | OUI |
| funding_id | uuid | OUI |
| description | text | OUI |
| status | text | NO |
| has_justificatif | boolean | OUI |
| comment | text | OUI |
| created_by | uuid | OUI |
| created_at | timestamptz | OUI |
| updated_at | timestamptz | OUI |
| site_id | uuid | OUI |

FK :
- `expenses_supplier_id_fkey` → `suppliers(id)`
- `expenses_bank_account_id_fkey` → `bank_accounts(id)`
- `expenses_cash_account_id_fkey` → `cash_accounts(id)`
- `expenses_funding_id_fkey` → `fundings(id)`
- `expenses_created_by_fkey` → `app_users(id)`
- `expenses_site_id_fkey` → `sites(id)`

**`expenses` n'a ni `farm_id` ni `funder_id`.** Elle a `created_by` (→ app_users), `site_id`, `funding_id`.

### public.funders (existe)

| Colonne | Type | Nullable |
|---------|------|----------|
| id | uuid | NO |
| name | text | NO |
| organization | text | OUI |
| email | text | OUI |
| phone | text | OUI |
| country | text | OUI |
| total_sent | numeric | OUI |
| total_received | numeric | OUI |
| created_at | timestamptz | OUI |
| user_id | uuid | OUI |

FK : `funders_user_id_fkey` → `app_users(id)` ON DELETE SET NULL

→ Un `app_user` est lié à un `funder` via la relation **inverse** `funders.user_id = app_users.id`.

### public.farms (existe)

| Colonne | Type | Nullable |
|---------|------|----------|
| id | uuid | NO |
| name | text | NO |
| location | text | OUI |
| country | text | OUI |
| currency | text | OUI |
| phone | text | OUI |
| email | text | OUI |
| logo_url | text | OUI |
| created_at | timestamptz | OUI |
| updated_at | timestamptz | OUI |

Aucune FK sur `farms`.

## Comparaison type TS / schéma SQL

- `AppUser.role` est `string` en TS et `text` en SQL : cohérent.
- `farm_id` / `funder_id` absents des deux côtés pour `app_users` et `expenses`.
- `fundings.funder_id` présent en SQL et dans le type `Funding` TS.
- Divergence notable : le type `AppUser` TS ne liste pas toutes les colonnes SQL (ex. `avatar_url` absent), mais rien de bloquant pour RLS.

## Conséquence pour les politiques RLS

Les politiques actuelles `USING (true)` / `WITH CHECK (true)` sont trop permissives.

- **`expenses`** : pas de `farm_id`, pas de `funder_id`. La seule colonne de lien utilisateur est `created_by` (→ `app_users.id`). Une politique "le comptable voit/modifie ses dépenses" doit s'appuyer sur `expenses.created_by = current_app_user_id()`.
- **`fundings`** : a `funder_id` (→ `funders`) et `created_by` (→ `app_users`). Un financeur est lié à un funder via `funders.user_id = app_users.id` (relation inverse). Une politique "le financeur voit ses fundings" doit joindre `fundings.funder_id = funders.id AND funders.user_id = current_app_user_id()`.
- Le champ de rôle est `role` (text) sur `app_users`.

Il faudra une fonction SQL helper qui résout l'`app_user.id` courant depuis `auth.uid()` (via `app_users.auth_id = auth.uid()`), car les politiques RLS ne lisent pas directement `auth.users`.

## Statut

Aucune migration n'a été modifiée ni créée à cette étape. En attente de décision avant rédaction de la migration correctrice.
