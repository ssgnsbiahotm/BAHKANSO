# Audit module Finance — 2026-11-14

## 📊 Résumé exécutif

Le module Finance s'articule autour de 6 écrans (Financements, Dépenses, Documents, Trésorerie, Par module, Ventes) pilotés par l'onglet URL `tab` dans `FinanceModule.tsx`, plus le module `Sales` rendu dans l'onglet `ventes`. Les données sont chargées via `usePaginatedQuery` sur les tables `transactions`, `fundings`, `expenses`, `documents` avec filtre `site_id` (sauf rôle global `administrateur`/`propriétaire`). La validation est assurée par Zod dans chaque formulaire, les mutations utilisent `executeAction`/`logAudit`, et la suppression suit le pattern `ConfirmDeleteModal` avec fermeture en `finally`. Les liens financiers (`financial_links`) permettent la répartition d'une dépense/financement/vente sur N entités.

**Écarts : 🔴 1 critique, 🟠 5 importants, 🟡 4 améliorations, ⚪ 3 décisions métier.**

---

## ✅ Ce qui fonctionne bien

| Élément | Preuve |
|---------|--------|
| RBAC sur les routes finance | `src/modules/Finance/FinanceModule.tsx:34` `<RequireModule module="finance" action="read">` |
| Filtre `site_id` par rôle (global vs site) | `src/modules/Finance/hooks/useFinanceData.ts:7-20` (`isAccesGlobal`, `siteFilters`) |
| Zod validation sur tous les formulaires (transactions, dépenses, financements, documents) | `TreasuryTab.tsx:20-31`, `ExpensesTab.tsx:28-52`, `FundingsTab.tsx:25-38`, `DocumentsTab.tsx:21-30` |
| `logAudit` sur CRUD transactions/dépenses/financements/documents | `TreasuryTab.tsx:281-287`, `ExpensesTab.tsx:233-241`, `FundingsTab.tsx:326-334`, `DocumentsTab.tsx:194-202` |
| Suppression avec fermeture du modal en `finally` (succès ET erreur) | `TreasuryTab.tsx:295-298`, `ExpensesTab.tsx:356-359`, `FundingsTab.tsx:433-436`, `DocumentsTab.tsx:283-286` |
| Répartition financière via `financial_links` (idempotente à l'édition : delete+insert) | `ExpensesTab.tsx:111-145`, `FundingsTab.tsx:204-232`, `SalesModule.tsx:87-115` |
| `RotatingCard` avec `flipLabel`/`backLabel` rendus sur toutes les listes | `TreasuryTab.tsx:339-346`, `ExpensesTab.tsx:393-444`, `FundingsTab.tsx:519-526`, `DocumentsTab.tsx:322-362` |
| États de chargement/erreur/vide gérés | `TreasuryTab.tsx:300-301`, `ExpensesTab.tsx:361-362`, `FundingsTab.tsx:438-439`, `DocumentsTab.tsx:288-289` |
| `generateEntityIdentifier` pour les références auto (EXP, FND, DOC) | `ExpensesTab.tsx:177`, `FundingsTab.tsx:277`, `DocumentsTab.tsx:145` |
| Ventes avec ligne d'articles (`sale_items`) et KPIs (CA, panier moyen, clients actifs) | `src/modules/Sales/SalesModule.tsx:167-264`, `:148-164` |

---

## 🗺️ Inventaire

### Écrans du module Finance

| Écran | Fichier | Route | Role RBAC | Actions |
|-------|---------|-------|-----------|---------|
| FinanceModule (page mère, onglets) | `src/modules/Finance/FinanceModule.tsx:15` | `/app/finance?tab=…` | `finance:read` | navigation onglets |
| Onglet Financements | `FundingsTab.tsx` | `/app/finance?tab=fundings` | `finance:read` | créer, éditer, supprimer financements |
| Onglet Dépenses | `ExpensesTab.tsx` | `/app/finance?tab=expenses` | `finance:write` | créer, éditer, supprimer dépenses |
| Onglet Documents | `DocumentsTab.tsx` | `/app/finance?tab=documents` | `finance:write` | upload, créer, éditer, supprimer documents |
| Onglet Trésorerie | `TreasuryTab.tsx` | `/app/finance?tab=treasury` | `finance:write` | créer, éditer, supprimer opérations |
| Onglet Par module | `ModuleFinanceView.tsx` | `/app/finance?tab=by-module` | `finance:read` | synthèse flux par module |
| Onglet Ventes | `SalesModule.tsx` | `/app/finance?tab=ventes` | `finance:read` | créer, éditer, supprimer ventes |
| Ventes (sous-onglets Ventes/Clients/Par mois) | `SalesModule.tsx:81` | (dans `/app/finance?tab=ventes`) | — | voir clients, suivi mensuel |

### Formulaires

| Formulaire | Fichier | Champs clés | Validation |
|------------|---------|-------------|------------|
| Nouvelle/éditer opération trésorerie | `TreasuryTab.tsx:191-242` | reference, type, amount, currency, direction, date, site_id | zod `transactionSchema` (lignes 20-31) |
| Nouvelle/éditer dépense | `ExpensesTab.tsx:147-253` | reference, label, amount, currency, category, supplier_id, date, status, payment_method | zod `expenseSchema` (lignes 28-52) |
| Nouveau/éditer financement | `FundingsTab.tsx:258-345` | reference, funder_id, amount_sent, currency_sent, exchange_rate, date_sent, status | zod `fundingSchema` (lignes 25-38) |
| Nouveau/éditer document | `DocumentsTab.tsx:130-215` | reference, type, name, status, upload_date, file, site_id | zod `documentSchema` (lignes 21-30) |
| Nouvelle/éditer vente | `src/modules/Sales/SalesModule.tsx:166-264` | site_id, customer_id, date, payment_method, items[] | zod `saleSchema` (lignes 24-36) |
| Vente (modal legacy, hors module) | `src/modules/Sales/components/SaleFormModal.tsx` | customer_id, site_id, date, payment_method, lines[] | validation manuelle (pas de zod) |

### Cartes rotatives (RotatingCard)

| Composant | Fichier | flipLabel | backLabel | Usage |
|-----------|---------|-----------|-----------|-------|
| TransactionCardFront/Back | `TreasuryTab.tsx:56-111`, `:113-181` | "Détail — …" | "Retour" | liste trésorerie |
| Expense card (inline) | `ExpensesTab.tsx:393-523` | "Détail — …" | "Retour" | liste dépenses |
| FundingCardFront/Back | `FundingsTab.tsx:69-121`, `:123-190` | "Détail — …" | "Retour" | liste financements |
| Document card (inline) | `DocumentsTab.tsx:322-463` | "Détail — …" | "Retour" | liste documents |
| Sale card (front/back) | `src/modules/Sales/SalesModule.tsx:356-441` | "Détails" | "Retour" | liste ventes |
| Client card | `src/modules/Sales/SalesModule.tsx:523-577` | "Détails" | "Retour" | liste clients |
| Par mois card | `src/modules/Sales/SalesModule.tsx:596-640` | "Détails" | "Retour" | suivi mensuel |

### Tests

| Test | Fichier | Couvre la finance ? |
|------|---------|---------------------|
| SalesModule | `src/modules/Sales/SalesModule.test.tsx` | partiel (ventes) |
| Dashboard | `src/pages/Dashboard.test.tsx` | partiel (KPIs globaux) |

**Aucun test unitaire dédié aux écrans Financements/Dépenses/Documents/Trésorerie ni aux hooks `useFinanceData`.**

---

## 🔗 Matrice de cohérence (champs critiques)

| Champ | UI (options) | Zod / TS enum | SQL CHECK | Trigger attend | KPI impacté | Statut |
|-------|-------------|---------------|-----------|----------------|-------------|--------|
| `transaction.direction` | `entrée`/`sortie` (TreasuryTab.tsx:46-49) | `z.enum(['entrée','sortie'])` (ligne 25) | — | — | solde trésorerie (TreasuryTab.tsx:305-307) | ✅ cohérent |
| `expense.status` | `en_attente`/`validée`/`rejetée`/`payée` (ExpensesTab.tsx:80-85) | `z.string().min(1)` (ligne 44) | — | — | KPI dépenses (ExpensesTab.tsx:366-368) | ⚠️ pas de CHECK en base |
| `funding.status` | `prévu`/`envoyé`/`reçu`/`annulé` (FundingsTab.tsx:55-60) | `z.string().min(1)` (ligne 35) | — | — | KPI financements (FundingsTab.tsx:443-445) | ⚠️ pas de CHECK en base |
| `document.status` | `manquant`/`ajouté`/`à vérifier`/`vérifié`/`rejeté` (DocumentsTab.tsx:43-49) | `z.enum([…])` (ligne 25) | — | — | KPI documents (DocumentsTab.tsx:293-296) | ✅ enum Zod |
| `sale.payment_method` | `espèces`/`virement`/`chèque`/`mobile money`/`carte` (SalesModule.tsx:28) | `z.enum([…])` (ligne 28) | — | — | — | ✅ cohérent |
| `financial_links.transaction_type` | `expense`/`funding`/`sale` (codé en dur) | — | — | — | répartition inter-module | — |
| `expense.amount_paid` vs `expense.amount` | affichage `amount_paid ?? amount` (ExpensesTab.tsx:413, 470) | `z.number().nonnegative().default(0)` (ligne 48) | — | — | total payé vs total dû | ⚠️ risque de divergence |
| `sale.reference` génération | `generate_sale_reference` (migration 019) | — | — | `trg_log_sale` alimente `event_journal` | CA | ✅ fixé (commit `76b902b`) |

**Preuves SQL CHECK :** `grep -rn "CHECK" supabase/migrations/*expense* supabase/migrations/*funding* supabase/migrations/*transaction* supabase/migrations/*document*` → à confirmer (aucune contrainte CHECK visible sur les tables finance dans les migrations lues).

---

## 🔴 Écarts critiques (preuves)

### F1 — Pas de `refresh()`/`refetch()` du DataContext après mutation Financements et Documents

- **Preuve 1 (Financements)** : `src/modules/Finance/tabs/FundingsTab.tsx:338-342` — `onSuccess` appelle seulement `refetch()` (recharge la table `fundings`), pas `refresh()` du DataContext.
- **Preuve 2 (Documents)** : `src/modules/Finance/tabs/DocumentsTab.tsx:206-211` — `onSuccess` appelle seulement `refetch()`, pas `refresh()`.
- **Conséquence** : les KPIs du Dashboard qui lisent les sources `fundings`/`documents` via le DataContext ne se mettent pas à jour après création/modification/suppression d'un financement ou d'un document (contrairement aux Dépenses et Trésorerie qui appellent `refresh()` : `ExpensesTab.tsx:249`, `TreasuryTab.tsx:238`).

---

## 🟠 Écarts importants (preuves)

### I1 — `entityType` non typé dans `EntityPicker` pour le Fournisseur (ExpensesTab)

- **Preuve** : `src/modules/Finance/tabs/ExpensesTab.tsx:610-618` — `<EntityPicker label="Fournisseur" entityType="supplier" …>` ; `"supplier"` n'est pas casté via `type EntityType` importé (ligne 19 importe `EntityPicker, type EntityType` mais `entityType="supplier"` est passé en chaîne brute).
- **Conséquence** : risque d'erreur de typage si `EntityType` est un union stricte ; doit être `entityType="supplier" as EntityType` ou la valeur doit appartenir à l'union.

### I2 — `EntityLinkPicker` `allowedTypes` inclut des types non documentés dans `financial_links`

- **Preuve** : `ExpensesTab.tsx:670-680`, `FundingsTab.tsx:666`, `SalesModule.tsx:920` — `allowedTypes={['supplier','customer','project','plot','campaign','animal','animal_lot','site','funder']}`. La colonne `entity_type` de `financial_links` n'a pas de contrainte CHECK documentée ; aucune cohérence garantie entre les types autorisés en UI et ceux stockés.

### I3 — `DocumentsTab` upload vers `app-assets` bucket sans vérification RLS/bucket existant

- **Preuve** : `src/modules/Finance/tabs/DocumentsTab.tsx:111-113` — `supabase.storage.from('app-assets').upload(filePath, file, …)`. Le bucket `app-assets` n'est pas confirmé existant dans les migrations lues ; pas de vérification d'erreur spécifique au Storage (quota, type MIME côté base).
- **Conséquence** : l'upload peut échouer silencieusement en production si le bucket n'existe pas ou si RLS Storage bloque ; l'erreur est attrapée par le `catch` générique (ligne 122) et affichée comme "Échec de l'upload du fichier" sans détail.

### I4 — `TreasuryTab` type de transaction en double (deux options identiques "transfer")

- **Preuve** : `src/modules/Finance/tabs/TreasuryTab.tsx:385-387` — `<option value="transfer">Virement banque → caisse</option>` et `<option value="transfer">Virement caisse → banque</option>` partagent la même valeur `transfer`.
- **Conséquence** : impossible de distinguer les deux directions en base ; la donnée saisie est perdue (les deux affichent le même libellé mais écrivent la même valeur).

### I5 — Pas de suppression physique des fichiers Storage lors de la suppression d'un document

- **Preuve** : `src/modules/Finance/tabs/DocumentsTab.tsx:260-265` — `confirmDelete` supprime seulement la ligne `documents` (et logAudit), sans appeler `supabase.storage.from('app-assets').remove(...)` pour le fichier uploadé.
- **Conséquence** : fichiers orphelins dans le bucket Storage après suppression d'un document (fuite de stockage).

### I6 — `FundingsTab` `console.log('PAYLOAD UPDATE:')` laissé en production

- **Preuve** : `src/modules/Finance/tabs/FundingsTab.tsx:299` — `console.log('PAYLOAD UPDATE:', payload);` dans le `onSubmit`.
- **Conséquence** : bruit dans les logs de production, pas de conséquence fonctionnelle.

---

## 🟡 Améliorations

### A1 — `TreasuryTab` `onView` redirige vers `handleEdit` au lieu d'un écran de détail dédié

- **Preuve** : `src/modules/Finance/tabs/TreasuryTab.tsx:343` — `onView={() => handleEdit(transaction)}` ; le bouton "Détail" ouvre le formulaire d'édition.
- **Conséquence** : pas de consultation en lecture seule ; l'utilisateur peut modifier involontairement.

### A2 — `ModuleFinanceView` ne prend en compte que les dépenses (pas les financements) dans le détail par module

- **Preuve** : `src/modules/Finance/tabs/ModuleFinanceView.tsx:109-122` — la boucle `fundings.forEach` affecte tout financement sans `project_id` à `'aucun'` ; les financements liés à un projet vont dans `'projet'`, mais il n'y a pas de ventilation des financements par activité (contrairement aux dépenses qui lisent `expense.activity`).
- **Conséquence** : la vue "Par module" est partielle (dépenses ventilées, financements non ventilés par activité).

### A3 — `DocumentsTab` `uploaded_by` en lecture seule mais modifiable via le formulaire (champ masqué)

- **Preuve** : `src/modules/Finance/tabs/DocumentsTab.tsx:138` — `uploaded_by: currentUploader` dans defaultValues, mais le champ n'est pas exposé en lecture seule dans le formulaire (seulement la lecture en back). Pour l'édition, `uploaded_by` est ré-initialisé à `currentUploader` (ligne 238), écrasant l'uploadeur original.
- **Conséquence** : à l'édition, l'uploadeur original est écrasé par l'utilisateur connecté (perte de traçabilité de l'auteur initial).

### A4 — Pas de contrôle de cohérence `amount_paid <= amount` sur les dépenses

- **Preuve** : `src/modules/Finance/tabs/ExpensesTab.tsx:48` — `amount_paid: z.number().nonnegative().default(0)` sans borne supérieure par rapport à `amount`.
- **Conséquence** : on peut saisir un montant payé supérieur au montant total de la dépense.

---

## ⚪ Décisions métier

### D1 — Valeur technique des statuts de dépense/financement/document

- Les statuts sont stockés en valeurs techniques (`en_attente`, `prévu`, `ajouté`, etc.) avec libellés français en UI. Aucune contrainte CHECK en base n'a été trouvée. **Décision nécessaire** : confirmer que ces valeurs sont le canon et les ajouter en CHECK constraint (ou les garder comme cohérence UI/Zod uniquement).

### D2 — Traitement des fichiers orphelins Storage à la suppression de document

- **Décision nécessaire** : confirmer si la suppression d'un document doit aussi supprimer le fichier dans le bucket `app-assets` (préconisé : oui, avec gestion d'erreur non bloquante) ou si les fichiers sont conservés pour audit.

### D3 — `TreasuryTab` distinction des deux types de virement

- **Décision nécessaire** : séparer les valeurs `transfer_bank_to_cash` et `transfer_cash_to_bank` (ou utiliser un champ `direction` dédié) pour distinguer les deux directions actuellement fusionnées sous `transfer` (I4).

---

## 🧪 Couverture de test

- `src/modules/Sales/SalesModule.test.tsx` : couvre partiellement les ventes (création, édition, suppression, liens financiers).
- Aucun test unitaire dédié aux écrans `Financements`, `Dépenses`, `Documents`, `Trésorerie`.
- Aucun test sur les hooks `useFundings`, `useExpenses`, `useDocuments`, `useTreasuryTransactions`.
- Aucun test sur `ModuleFinanceView` (agrégation par module).
- Les tests KPI Dashboard couvrent partiellement les revenus (ventes) mais pas les dépenses/financements.

---

## 🔗 Liens avec autres modules

| Module cible | Lien depuis la finance | Statut |
|-------------|----------------------|--------|
| Ventes (Sales) | onglet `ventes` dans FinanceModule ; `financial_links` `transaction_type='sale'` | ✅ présent |
| Fournisseurs | `expense.supplier_id` ; `EntityPicker entityType="supplier"` | ✅ présent (lecture) |
| Projets/Chantiers | `expense.project_id`, `funding.project_id` ; `financial_links` type `project` | ✅ présent (liens) |
| Exploitation (cultures) | `expense.activity` (campagne/parcelle/lot/animal) ; `financial_links` type `plot`/`campaign`/`animal`/`animal_lot` | ✅ présent (liens) |
| Élevage | `financial_links` type `animal`/`animal_lot` | ✅ présent (liens) |
| Médias | `documents` avec `file_url` vers `app-assets` | ✅ présent (upload) |
| Surveillance | aucun lien financier direct | ❌ absent |
| Dashboard | KPIs via `refresh()` du DataContext après dépense/vente (pas après financement/document) | ⚠️ partiel (F1) |

---

## 🎯 Plan de correction (3 vagues)

### Vague 1 — Correction critique (immédiat)

1. Ajouter `refresh()` du DataContext dans `FundingsTab.onSuccess` et `DocumentsTab.onSuccess` (aligner sur `ExpensesTab`/`TreasuryTab`) — corrige F1.
2. Séparer les deux valeurs `transfer` dans `TreasuryTab` (`transfer_bank_to_cash` / `transfer_cash_to_bank`) — corrige I4.
3. Supprimer `console.log('PAYLOAD UPDATE:')` dans `FundingsTab.tsx:299` — corrige I6.

### Vague 2 — Robustesse et cohérence (important)

4. Ajouter des CHECK constraints en base sur `expense.status`, `funding.status`, `financial_links.entity_type` (décision D1).
5. Supprimer le fichier Storage associé lors de la suppression d'un document (`confirmDelete` dans `DocumentsTab`) — corrige I5.
6. Corriger `DocumentsTab` : ne pas écraser `uploaded_by` à l'édition (conserver l'uploadeur original) — corrige A3.
7. Ajouter la règle `amount_paid <= amount` dans `expenseSchema` — corrige A4.

### Vague 3 — UX et qualité (amélioration)

8. Créer un écran de détail lecture seule pour la Trésorerie (`onView` distinct de `handleEdit`) — corrige A1.
9. Ventiler les financements par activité dans `ModuleFinanceView` (comme les dépenses via `expense.activity`) — corrige A2.
10. Ajouter des tests unitaires dédiés aux écrans Financements/Dépenses/Documents/Trésorerie et aux hooks `useFinanceData`.
11. Vérifier l'existence du bucket Storage `app-assets` et les politiques RLS Storage (I3).

---

## 📝 Annexe — Preuves techniques

Extrait `useFinanceData` filtres (`src/modules/Finance/hooks/useFinanceData.ts:7-20`) :
```ts
const ROLES_ACCES_GLOBAL = ['administrateur', 'propriétaire'];
const siteFilters = (siteId: string | null): { column: string; operation: 'eq'; value: string }[] => {
  if (!siteId) return [];
  return [{ column: 'site_id', operation: 'eq', value: siteId }];
};
```

Extrait `refresh()` absent (`FundingsTab.tsx:338-342`) :
```ts
onSuccess: () => {
  setModalOpen(false);
  setEditingFunding(null);
  refetch();  // ← pas de refresh() du DataContext
},
```

Extrait `refresh()` présent (`ExpensesTab.tsx:249`) :
```ts
onSuccess: () => {
  setModalOpen(false);
  setEditingExpense(null);
  refetch();
  refresh(); // Invalide le cache DataContext pour que les KPIs du Dashboard se mettent à jour
},
```

Extrait double `transfer` (`TreasuryTab.tsx:385-387`) :
```tsx
<option value="transfer">Virement banque → caisse</option>
<option value="transfer">Virement caisse → banque</option>
```

Extrait upload Storage (`DocumentsTab.tsx:111-113`) :
```ts
const { error: uploadError } = await supabase.storage
  .from('app-assets')
  .upload(filePath, file, { upsert: false });
```

Extrait suppression document sans remove Storage (`DocumentsTab.tsx:260-265`) :
```ts
const { error: deleteError } = await supabase
  .from('documents')
  .delete()
  .eq('id', deletingDocument.id);
if (deleteError) throw deleteError;
// ← pas de supabase.storage.from('app-assets').remove(...)
```

---

**Fichiers modifiés : aucun** (audit en lecture seule, aucun commit).

**Prochaine étape : ** écrire l'audit du module Stocks/Inventory (docs/audits/2026-11-14-audit-module-inventory.md).
