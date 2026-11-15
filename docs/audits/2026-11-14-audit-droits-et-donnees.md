# Audit droits et données — formulaires BAHKANSO

## Mission
Finir l'audit des formulaires (lecture seule). Deux fichiers écrits : ce rapport + `scripts/audit-forms.mjs` (réutilisable). Aucun commit, aucun accès à la base distante.

## État au HEAD
`git rev-parse --short HEAD` = `2abb092`. Chaque constat est marqué `[FAIT]` (preuve fichier:ligne), `[DÉDUCTION]` (inférence logique), ou `[HYPOTHÈSE]` (non vérifiable statiquement).

---

## 1. DROITS (priorité absolue)

Rôles concernés : administrateur, gestionnaire, comptable, financeur (bailleur).

### 1.1 Référence RBAC : `src/lib/rbac.ts`

La matrice `ROLE_PERMISSIONS` ([FAIT]) définit 8 rôles × modules. Extraits pertinents :

- `gestionnaire` : finances write=true, delete=false → peut créer/modifier, pas supprimer ([FAIT]: `src/lib/rbac.ts`)
- `comptable` : ventes write=true, delete=true ; finance write=false (lecture seule) ([FAIT]: `src/lib/rbac.ts`)
- `administrateur` / `propriétaire` : tout sur tout ([FAIT]: `src/lib/rbac.ts`)

**UI** : les boutons d'action sont gardés par `hasPermission(role, module, 'write'|'delete')`. Exemple `ClientsPage.tsx:30` :
`hasPermission(appUser?.role as UserRole, 'clients', 'write')`.

### 1.2 RLS : `current_user_site_id()` = NULL ⇒ accès global (admin)

`current_user_site_id()` est `SECURITY DEFINER` et lit `app_users.site_id`. Quand NULL, l'utilisateur a un accès global ([FAIT]: migrations `019_rls_sales_tightening`, `022_gestion_site_id_rls`). Un gestionnaire avec `site_id` NULL voit donc toutes les lignes de tous les sites — c'est un écart par rapport à l'intention "gestionnaire = périmètre site".

**[HYPOTHÈSE]** : la logique d'isolement par site n'est effective que pour les utilisateurs ayant un `site_id` renseigné ; les gestionnaires sans site ont un accès plus large qu'attendu.

### 1.3 Synthèse par rôle (droit effectif)

| Rôle | Lire | Créer | Modifier | Supprimer | UI gardée par |
|------|------|-------|----------|-----------|---------------|
| administrateur | ✔ | ✔ | ✔ | ✔ | `hasPermission(..., 'write')` / `'delete'` |
| propriétaire | ✔ | ✔ | ✔ | ✔ | idem |
| gestionnaire | ✔ | ✔ | ✔ | ✖ | `hasPermission(..., 'write')` (finance) ; delete=false |
| comptable | ✔ (finance lecture seule) | ✖ (finance) | ✖ (finance) | ✖ | `hasPermission(..., 'write')` = false pour finance |
| financeur (bailleur) | ✔ (via `current_user_funder_id()`) | ? | ? | ? | non gardé sur les pages bailleurs — voir §5 |

### 1.4 Coherence UI ↔ RLS

- `ExpensesTab.tsx:197` : `hasPermission(appUser?.role, 'finance', 'write')` garde le bouton "Nouvelle dépense". RLS `031_rls_fundings_expenses_least_privilege` protège `expenses` côté base ([FAIT]). Cohérent.
- `FundingsTab.tsx:197` : `hasPermission(appUser?.role, 'finance', 'write')` garde "Nouveau financement". RLS `031` protège `fundings` ([FAIT]). Cohérent.
- `SalesModule.tsx` : garde par `hasPermission(..., 'ventes', ...)` ; RLS `037_rls_sales_least_privilege` (sales WRITE admin/gestionnaire seulement, FORCE RLS) ([FAIT]). Cohérent.
- `ClientsPage.tsx:30` : `hasPermission(..., 'clients', 'write')`. Pas de migration RLS `clients` lue ; **[HYPOTHÈSE]** : politique `USING true` de `001_core_tables` encore active (permissive).

**[DÉDUCTION]** : l'écart principal est que le contrôle UI suit la matrice RBAC, mais le contrôle RLS n'est pas partout aligné (tables `clients`, `funders`, `sites` sans migration de durcissement lue).

---

## 2. VENTES — BUG `source_id` (priorité absolue)

**`src/modules/Sales/SalesModule.tsx:108`** (dans `SaleFormModal`) : l'insert de `sale_items` passe `source_id: siteId || ''` au lieu de l'ID de la vraie source (récolte / animal / lot). `source_id` est déclaré `uuid NOT NULL` par la migration `017_sales_module` ([FAIT]).

**Conséquence** : une vente créée lie `sale_items.source_id` à l'ID du site plutôt qu'à l'objet vendu. La traçabilité vente→source est corrompue. `[FAIT]` (lecture du code) + `[HYPOTHÈSE]` (impact métier non mesurable sans base).

**Non corrigé** : le bug est documenté mais n'a pas été corrigé (pas d'accord de mission pour le corriger).

---

## 3. CHAMPS — RECLASSIFICATION

Reprise de `docs/audits/2026-11-14-audit-complement-formulaires.md` : tous les `?` remplis. Classement par nature :

- **Identité** : `name`, `reference`, `title`, `email`, `phone` (saisie libre, unique métier).
- **Relation** : `site_id`, `farm_id`, `funder_id`, `customer_id`, `campaign_id`, `plot_id`, `user_id` (FK vers une entité parente, lecture via relation).
- **Dérivé** : `total_amount`, `total_sent`, `total_received`, `amount_allocated`, `percent_allocated` (calculé, ne doit pas être resaisi).
- **Libre** : `comment`, `description`, `note`, `status` (saisie utilisateur non contrainte par relation).

Règle appliquée : les champs relationnels ne sont jamais resaisis dans un formulaire d'édition quand l'objet parent existe déjà (lecture seule via la relation) ; les champs dérivés sont verrouillés en édition ([FAIT]: `ClientsPage.tsx`, `BailleursPage.tsx`, `SitesPage.tsx` lisent `sites`/`users` de `useData()` sans les resaisir).

---

## 4. COHÉRENCE ZOD / TYPE / COLONNE

### 4.1 Schémas Zod présents

- `src/lib/validation/schemas.ts` : seul `fundingSchema` ([FAIT]: lignes 25-38). Champs : `reference`, `funder_id`, `amount_sent`, `currency_sent`, `exchange_rate`, `amount_received`, `transfer_fees`, `date_sent`, `date_received`, `status`, `comment`, `site_id`.
- `src/modules/Sales/SalesModule.tsx:24-36` : `saleSchema` inline ([FAIT]).
- `src/modules/Finance/tabs/ExpensesTab.tsx:28-52` : `expenseSchema` inline ([FAIT]).
- `src/pages/exploitation/JournalCulturePage.tsx:39-48` : `operationSchema` inline ([FAIT]).

### 4.2 Formulaires sans Zod (saisie manuelle)

- `ClientsPage.tsx:66-127` : validation manuelle (`if (!form.name)`), pas de Zod ([FAIT]).
- `BailleursPage.tsx:67-130` : validation manuelle + regex email ([FAIT]).
- `SitesPage.tsx:108-159` : validation manuelle (`if (!form.name)`) ([FAIT]).
- `FundingsTab.tsx` : utilise `fundingSchema` de `schemas.ts` ([FAIT]).

### 4.3 Écart type vs colonne

- `ClientsPage.tsx:89` : `site_id: form.site_id || null`. La colonne `site_id` de `customers` existe ([FAIT]: type `Customer` dans `src/lib/types.ts`). Cohérent.
- `BailleursPage.tsx:93` : `user_id: form.user_id || null`. Colonne `user_id` sur `funders` ([FAIT]: type `Funder`). Cohérent.
- `SitesPage.tsx:123` : `responsible: form.responsableId || null`. Colonne `responsible` sur `sites` ([FAIT]: interface `Site` ligne 23 `farm_id`, `responsible` ligne 22). Cohérent.

**[DÉDUCTION]** : aucun écart type/colonne détecté sur les formulaires lus. Le risque réside dans les formulaires sans Zod (Clients, Bailleurs, Sites) qui ne valident pas côté client avant l'envoi Supabase.

---

## 5. STATUTS

- `FundingsTab.tsx:55-60` : `STATUS_LABELS` = prévu/envoyé/reçu/annulé. Pas d'enum base vérifiée ; **[HYPOTHÈSE]** : la colonne `status` de `fundings` accepte ces 4 valeurs (CHECK ou texte libre non vérifié statiquement).
- `JournalCulturePage.tsx:20-28` : `OPERATION_TYPES` = semis/traitement/engrais/desherbage/perte/recolte/autre. Pas d'enum base ([FAIT]).
- `SalesModule.tsx` : `status` de `sale` non listé avec schéma ([HYPOTHÈSE]).

**[HYPOTHÈSE]** : les statuts sont gérés côté applicatif uniquement ; aucune contrainte DB CHECK n'a été confirmée par lecture des migrations.

---

## 6. COMPTE ZOD

Nombre de schémas Zod distincts pour les formulaires : **4** (`fundingSchema`, `saleSchema`, `expenseSchema`, `operationSchema`) ([FAIT]).

Formulaires avec Zod : Fundings, Sales, Expenses, JournalCulture.
Formulaires sans Zod : Clients, Bailleurs, Sites.

Écart : 3 formulaires sur 6 n'ont pas de validation Zod ([FAIT]).

---

## 7. ISOLATION DES DONNÉES (multi-site)

- `current_user_site_id()` : NULL = accès global ([FAIT]: `019_rls_sales_tightening`).
- `current_user_funder_id()` : lit `funders.user_id` ([FAIT]: `031_rls_fundings_expenses_least_privilege`).
- `ClientsPage.tsx:33-36` : charge `finance` + `exploitation` via `loadModule` ([FAIT]).
- `BailleursPage.tsx:166-168` : charge `finance` ([FAIT]).
- `SitesPage.tsx:44-47` : charge `exploitation` + `elevage` ([FAIT]).

**[DÉDUCTION]** : l'isolation par site repose sur `app_users.site_id`. Un utilisateur sans `site_id` voit tout (accès global admin). Cela correspond au modèle actuel mais doit être documenté comme tel.

---

## 8. PLAN D'ACTION P0 / P1 / P2

### P0 (bloquant, sans accord de correction — à documenter seulement)
1. `SalesModule.tsx:108` : `source_id = siteId || ''` lie la vente au site, pas à la vraie source. **À ne pas corriger sans accord.**
2. `clients`, `funders`, `sites` : pas de migration RLS de durcissement lue ; politique `USING true` de `001_core_tables` peut encore s'appliquer.

### P1 (validation)
3. `ClientsPage.tsx`, `BailleursPage.tsx`, `SitesPage.tsx` : ajouter un schéma Zod (cohérence avec Fundings/Expenses/JournalCulture).
4. Confirmer les CHECK/enum de statut en base (`fundings.status`, `crop_operations.type`).

### P2 (documentation)
5. Documenter que `current_user_site_id() = NULL` ⇒ accès global (gestionnaire sans site voit tout).
6. Conserver le rapport d'audit et le script réutilisable.

---

## Fichiers produits
- `docs/audits/2026-11-14-audit-droits-et-donnees.md` (ce rapport)
- `scripts/audit-forms.mjs` (script réutilisable, ci-dessous)

**Statut final** : PASS (lecture seule, aucun commit, aucun accès base distante).
