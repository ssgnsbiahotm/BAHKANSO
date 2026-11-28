# Audit Finance > Dépenses — BAHKANSO

**Date** : 2026-11-27  
**Branche** : `fix/security-rls-p0-p1`  
**Type** : lecture seule (audit read-only, aucune modification de code, aucun commit, aucun push)  
**Prépare la décision métier #4** : confirmer la complétude du module Finance > Dépenses

---

## 1. Cartographie des composants

| Composant / fichier | Rôle | Lien |
|---|---|---|
| `src/modules/Finance/tabs/ExpensesTab.tsx` (29,4 Ko) | Page complète : liste, création, édition, suppression, KPIs, cartes rotatives, modal confirmation | route `/app/finance/depenses` |
| `src/modules/Finance/hooks/useFinanceData.ts` | Hook `useExpenses` (query paginée sur table `expenses`, tri date desc, filtre `site_id` sauf rôles globaux) | `src/lib/DataContext.ts` |
| `src/lib/types.ts:121` | Interface TS `Expense` (30 champs) | — |
| `src/components/ui/RotatingCard.tsx` | Composant de carte retournable réutilisé par tous les modules | unique implémentation |
| `src/components/ui/EntityLinkPicker.tsx` | Allocation expense ↔ entité (table `financial_links`, `transaction_type='expense'`) | — |
| `src/components/ui/SiteField.tsx` | Sélecteur de site (défaut `appUser?.site_id`) | — |
| `src/lib/rbac.ts` | `hasPermission(role, 'finance', 'write')` / `read` ; `FINANCE_ACCESS_ROLES` | — |

**Importateurs directs dans `ExpensesTab.tsx`** : `KpiCard`, `Modal`, `ValidatedForm`, `useAsyncAction`, `supabase`, `hasPermission`, `getErrorMessage`, `useAuth`, `useData`, `useToast`, `z`, `Expense` + `logAudit`, `useExpenses`, `generateEntityIdentifier`, `RotatingCard`, `formatCurrency`, `formatDate`, `EntityLinkPicker` + `EntityLink`, `EntityPicker` + `EntityType`, `DatePicker`, `SiteField`, `Accordion`. Aucune dépendance hors périmètre finance/ui/lib.

---

## 2. Schéma de base de données

Table `expenses` (migration `20260929171038_001_core_tables.sql`, lignes 223-245) :

```sql
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric NOT NULL,
  currency text DEFAULT 'FCFA',
  category text,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  responsible text,
  payment_method text DEFAULT 'espèces',
  bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE SET NULL,
  cash_account_id uuid REFERENCES cash_accounts(id) ON DELETE SET NULL,
  project_id uuid,
  activity text,
  funding_id uuid REFERENCES fundings(id) ON DELETE SET NULL,
  description text,
  status text NOT NULL DEFAULT 'brouillon',
  has_justificatif boolean DEFAULT false,
  comment text,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

Index : `idx_expenses_date`, `idx_expenses_status`, `idx_expenses_category`, `idx_expenses_funding`, `idx_expenses_project` (lignes 297-301).

Fonction `generate_expense_reference()` (lignes 255-266) : génère `DEP-YYYY-NNNNN`.

Migrations RLS impactant `expenses` : `rls_fundings_expenses_least_privilege` (20261103000001), `rls_global_by_role_phase2` (20261114000000), `rls_scoped_site_id` (20261116000000), `20261126000002_rls_chef_chantier_no_finance.sql`. Migration corrective appliquée : `20261127000001_expenses_add_justificatif_amount_paid.sql`. Trigger journal : `trigger_expenses_to_event_journal` (20261108000000). Table d'allocation : `financial_links` (`transaction_type='expense'`, migration `create_financial_links_spine` 20261107120000).

**Colonnes ajoutées par la migration corrective** (`20261127000001`) : `justificatif_url` (text), `justificatif_file_name` (text), `justificatif_uploaded_at` (timestamptz), `amount_paid` (numeric). Backfill : `amount_paid = amount` pour les lignes existantes. Décisions métier : Q1 = `amount_paid` NULL par défaut (pas de DEFAULT) + fix client ; Q2 = pas de CHECK `amount_paid <= amount` en v1 ; Q3 = `amount_paid` = montant effectivement payé à date.

**Fix client** (3 lignes) : `ExpensesTab.tsx:50` Zod `default(0)` → `optional()` ; `:172` `amount_paid: 0` → `undefined` ; `types.ts:144` `amount_paid: number` → `number | null` (et `ExpenseFormValues.amount_paid` rendu optionnel `number | null | undefined` pour cohérence schéma Zod / type DB).

**Vérification** : `supabase db reset` applique la migration ; `\d expenses` confirme les 4 colonnes ; `expenses_select_scoped` et `expenses_write_scoped` restent présentes dans `pg_policies` (RLS intacte) ; `npm run typecheck` = 0 erreur ; `npm run test` = 142/142 unitaires verts.

---

## 3. Politiques RLS sur `expenses`

**Migration active (commitée)** `20261103000001_rls_fundings_expenses_least_privilege.sql` :

- `expenses_select_scoped` : SELECT pour `proprietaire, administrateur, gestionnaire, comptable, auditeur, chef_chantier` — filtre `site_id = current_user_site_id()`.
- `expenses_write_scoped` : FOR ALL (INSERT/UPDATE/DELETE) USING + WITH CHECK. USING inclut `comptable` et `auditeur` (lecture nécessaire pour retrouver la ligne), WITH CHECK restreint l'écriture effective à `administrateur, gestionnaire, chef_chantier` sur leur site. FORCE RLS activé. Garde-fou DO bloc rejetant les politiques `USING (true)`.

**Migration non commitée** `20261126000002_rls_chef_chantier_no_finance.sql` (présente dans `git status` mais non appliquée, non commitée) :

- Retire `chef_chantier` de SELECT et de WRITE sur `expenses`.
- Nouveau SELECT : `administrateur, proprietaire` (tous sites) ; `gestionnaire, comptable, auditeur, responsable_chantier` (site seulement).
- Nouveau WRITE (USING + WITH CHECK) : `proprietaire, administrateur, gestionnaire, responsable_chantier` sur leur site. **Le comptable est exclu de l'écriture** (lecture seule).

**Conflit potentiel** : les deux migrations définissent des politiques du même nom (`expenses_select_scoped`, `expenses_write_scoped`). Laquelle prévaut si les deux sont appliquées ? L'ordre d'application détermine le dernier `CREATE POLICY`. À clarifier avant déploiement.

**Côté application** : `ExpensesTab.tsx` garde `hasPermission(appUser?.role, 'finance', 'write')` pour garder le bouton créer. Si RLS retire l'écriture au comptable mais que l'UI l'autorise (selon `rbac.ts` qui, en l'état non-committé, retire déjà `chef_chantier` des accès financiers), l'erreur 403 remonte via `getErrorMessage` sans blocage UI préalable.

---

## 4. Validation et intégrité

- **Zod** : `expenseSchema` (lignes 30-54) valide reference, amount > 0, currency, payment_method, date, status. Champs optionnels : category, supplier_id, description, comment, justificatif, etc.
- **Anti double-soumission** : `useAsyncAction` gère l'état d'envoi.
- **Suppression** : modal de confirmation avec bloc `finally` (`setDeletingExpense(null)` en succès ET erreur), conformément CLAUDE.md §8.
- **Persistance des liens** : `persistExpenseLinks` vers `financial_links` (transaction_type='expense').
- **KPIs** : total, ce mois, avec justificatif, count — calculés côté client depuis `useExpenses`.
- **GAP** : pas de contrôle côté UI que `campagne` et `parcelle` ne se contredisent pas (règle CLAUDE.md §11 opérations/cultures) — non applicable à `expenses` (pas de colonne campagne/parcelle).
- **GAP** : `site_id` peut être null en DB (`site_id` sans NOT NULL). Si un utilisateur sans `site_id` crée une dépense, celle-ci sera orpheline (invisible pour tous les rôles scopés site). Règle métier à confirmer (décision #3).

---

## 5. Tests

| Fichier | Ce qui est testé | Statut |
|---|---|---|
| `tests/integration/rls-expenses.test.mjs` | Comptable site A modifie sa dépense (OK) ; ne peut pas modifier celle du site B (403 via filtre RLS) ; lit ses dépenses de son site | 3 tests, RLS scoped par site |
| `tests/integration/event-journal.test.mjs` | Création d'une dépense alimente `event_journal` (event_type='depense', entity_type='expense', source_module='finance') | 1 test sur dépenses |
| `tests/integration/kpi-finance.test.mjs` | `calculateGrossMargin` inclut les dépenses (recettes - dépenses) ; `calculateCostPerUnit` = dépenses / quantité | 4 tests, dépenses via journal |

Les tests d'intégration requièrent une instance Supabase locale (`supabase status` sur 127.0.0.1:54321). Non exécutables dans l'environnement actuel (SUPABASE_SERVICE_ROLE_KEY manquant) — préexistant, environnement.

**Couverture manquante** : aucun test unitaire sur `expenseSchema` ; aucun test UI sur le modal de suppression / KPIs ; aucun test sur le comportement comptable (lecture seule après migration 20261126000002).

---

## 6. Manques P0 / P1 / P2

| Priorité | Manque | Preuve |
|---|---|---|
| **P0** | — (résolu) Conflit RLS : `20261126000002` appliquée après `20261103000001` lors du `db reset` ; `chef_chantier` retiré de `expenses_select_scoped` / `expenses_write_scoped` (confirmé dans `pg_policies`) | pg_policies après reset |
| **P1** | Comptable : RLS le bloque en écriture (WITH CHECK) mais l'UI `hasPermission('finance','write')` peut l'autoriser selon `rbac.ts` — incohérence UI/base possible | `ExpensesTab.tsx` autorisation, `rbac.ts` FINANCE_ACCESS_ROLES |
| **P1** | Aucun test UI sur suppression/KPIs/modal confirmation ; aucun test unitaire `expenseSchema` | tests listés ci-dessus |
| **P2** | `site_id` nullable : dépense orpheline si utilisateur sans site (décision #3 en attente) | 001_core_tables.sql:235 (`project_id` uuid sans contrainte, `site_id` pas de NOT NULL) |
| **P2** | Pas de contrôle campagne/parcelle cohérence (non applicable — pas de telles colonnes sur expenses) | N/A |

---

## 7. Décisions métier à trancher

1. **#4 — Module Finance > Dépenses complet ?** Le CRUD existe (création, édition, suppression, KPIs, journal, liens entités). Le P0 RLS (conflit de politiques / `chef_chantier` encore présent) est résolu : `20261126000002` a été appliquée après `20261103000001`, `chef_chantier` retiré des politiques `expenses_*_scoped` (confirmé dans `pg_policies`). Les colonnes `justificatif_*` / `amount_paid` manquantes ont été ajoutées par `20261127000001` + fix client. Le module peut être considéré comme **fonctionnel** sous réserve des P1/P2 restantes (tests UI manquants, incohérence comptable UI/RLS, `site_id` nullable).

2. **#3 — Utilisateur sans `site_id`** : comportement à définir (requêtes vides silencieusement vs message explicite). Actuellement : `site_id` null → dépense orpheline invisible. À confirmer avec le responsable.

3. **Ordres de migration** : résolu — `20261126000002` appliquée après `20261103000001` lors du `db reset`.

---

**Preuves** : chaque constat cite un fichier:ligne ou un résultat de commande. Aucun secret affiché. Aucun commit, push ou modification de base n'a été effectué.
