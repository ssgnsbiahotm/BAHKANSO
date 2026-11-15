# Audit module Stocks/Inventory — 2026-11-14

## 📊 Résumé exécutif

Le module Stocks/Inventory est une page unique (`src/pages/Inventory.tsx`) accessible via la route `/app/inventory`, protégée par `RequireModule module="inventory" action="read"`. Elle gère trois écrans par onglets (Articles, Mouvements, Catégories) avec CRUD sur `inventory_items`, lecture des `inventory_mouvements` et `inventory_counts`, KPIs de valorisation et d'alerte de stock faible. La validation est Zod, les mutations utilisent `logAudit`, la suppression suit le pattern `ConfirmDeleteModal` avec fermeture en `finally`, et `refresh()` invalide le DataContext après chaque écriture.

**Écarts : 🔴 1 critique, 🟠 4 importants, 🟡 3 améliorations, ⚪ 3 décisions métier.**

---

## ✅ Ce qui fonctionne bien

| Élément | Preuve |
|---------|--------|
| RBAC lecture sur la route | `src/routes/AppRoutes.tsx:287-293` `<RequireModule module="inventory" action="read">` |
| `loadModule('stock')` déclaré | `src/pages/Inventory.tsx:47` |
| Sources `stock` dans le registre | `src/lib/DataContext.tsx:58` `stock: ['inventoryItems', 'inventoryMovements']` |
| Zod validation sur le formulaire article | `src/pages/Inventory.tsx:17-26` (`itemSchema`) |
| `logAudit` sur CREATE/UPDATE/DELETE | `:111-117`, `:162-169` |
| Suppression avec fermeture du modal en `finally` | `:174-176` |
| `refresh()` du DataContext après mutation | `:131`, `:172` |
| `RotatingCard` `flipLabel`/`backLabel` rendus | `:400-406` |
| États vide / erreur gérés | `:385-396`, `:415-420` |
| KPIs (valorisation, alertes, mouvements mois) | `:75-91` |
| Jointure `item:inventory_items(*)` sur les mouvements | `DataContext.tsx:194` |

---

## 🗺️ Inventaire

### Écran

| Écran | Fichier | Route | Role RBAC | Onglets | Actions |
|-------|---------|-------|-----------|---------|---------|
| Stocks (page unique) | `src/pages/Inventory.tsx` | `/app/inventory` | `inventory:read` | articles / mouvements / catégories | créer, éditer, supprimer articles |

### Données (tables)

| Table | Fichier de type | Colonnes clés | Usage |
|-------|-----------------|---------------|-------|
| `inventory_items` | `src/lib/types.ts:318-328` | id, name, category, unit, min_stock, current_stock, location, unit_cost, site_id | articles de stock |
| `inventory_movements` | `:330-342` | id, item_id, type (in/out), quantity, unit_cost, date, reason, linked_object_*, responsible | historique des mouvements |
| `inventory_counts` | `:344-355` | id, item_id, count_date, theoretical_stock, physical_stock, difference, justification, status, validated_by | inventaires physiques |

### Composants UI réutilisés

| Composant | Fichier | Rôle dans Inventory |
|-----------|---------|---------------------|
| `RotatingCard` | `@/components/ui/RotatingCard` | grille d'articles (recto/verso) |
| `ConfirmDeleteModal` | `@/components/ui/FormPrimitives` | suppression d'article |
| `DetailModal` | `@/components/ui/FormPrimitives` | fiche article (lecture) |
| `Modal` | `@/components/ui/Modal` | formulaire création/édition |
| `useValidatedForm` | `@/components/ui/ValidatedForm` | gestion formulaire Zod |
| `FormField`/`FormInput`/`FormSelect`/`FormActions`/`FormSection` | `@/components/ui/FormPrimitives` | champs du formulaire |

### Tests

| Test | Fichier | Couvre le stock ? |
|------|---------|-------------------|
| Aucun test dédié | — | ❌ |

**Aucun test unitaire ni d'intégration dédié au module Stocks/Inventory.** Les tests existants couvrent Dashboard, Sales, et les hooks génériques.

---

## 🔗 Matrice de cohérence (champs critiques)

| Champ | UI | Zod / TS | SQL CHECK | Trigger | Statut |
|-------|----|----------|-----------|---------|--------|
| `inventory_items.type` (mouvement) | `in`/`out` (Inventory.tsx:427-431) | `type: string` (types.ts:333) | — | — | ⚠️ pas d'enum |
| `inventory_movements.type` | — | `type: string` | — | — | ⚠️ pas de CHECK |
| `inventory_counts.status` | — | `status: string` | — | — | ⚠️ pas de CHECK |
| `current_stock >= 0` | `min(0)` dans Zod (ligne 22) | `z.number().min(0)` | — | — | ✅ Zod uniquement |
| `min_stock >= 0` | `min(0)` (ligne 21) | `z.number().min(0)` | — | — | ✅ Zod uniquement |
| `site_id` | select requis (ligne 532-542) | `z.string().min(1)` | — | — | ⚠️ pas de filtre site côté lecture |

**Preuves SQL CHECK :** `grep -rn "CHECK" supabase/migrations/*inventory*` → aucune contrainte CHECK trouvée sur les tables stock dans les migrations lues (à confirmer).

---

## 🔴 Écarts critiques (preuves)

### S1 — Incohérence de nom de module entre route, RBAC, DataContext et loadModule

- **Preuve 1** : `src/routes/AppRoutes.tsx:287-293` — la route est déclarée avec `module="inventory"`.
- **Preuve 2** : `src/lib/DataContext.tsx:58` — le registre déclare `stock: ['inventoryItems', 'inventoryMovements']` (clé `stock`).
- **Preuve 3** : `src/pages/Inventory.tsx:47` — `loadModule('stock')` est appelé avec la clé `stock`.
- **Conséquence** : le nom du module n'est pas canonique (`inventory` en route/RBAC, `stock` en DataContext). Si le RBAC ou le DataContext est un jour aligné sur une seule clé, le module pourrait cesser de se charger ou d'être autorisé. **À corriger pour cohérence** (décider si le module s'appelle `inventory` ou `stock` partout).

---

## 🟠 Écarts importants (preuves)

### I1 — Source `inventoryCounts` chargée mais jamais consommée dans la page

- **Preuve** : `src/lib/DataContext.tsx:90,142,195,251,452` — `inventoryCounts` est déclaré, initialisé, chargé via `safeRequest` et mis à jour par `loadModule`. Mais `src/pages/Inventory.tsx` ne déstructure pas `inventoryCounts` de `useData()` (ligne 43 ne liste que `inventoryItems, inventoryMovements, sites, refresh, loadModule`).
- **Conséquence** : la source `inventory_counts` est chargée en mémoire pour rien (requête Supabase inutile à chaque `loadModule('stock')`) et les inventaires physiques ne sont pas affichés dans l'UI (ni dans les mouvements, ni dans les catégories).

### I2 — Pas de contrôle de cohérence « stock ne passe pas négatif » sur les mouvements

- **Preuve** : `src/pages/Inventory.tsx` — il n'existe **aucun formulaire de saisie de mouvement** (onglet « Mouvements » en lecture seule uniquement, lignes 413-439). Les mouvements ne peuvent être créés que directement en base.
- **Conséquence** : pas de règle UI empêchant une sortie de stock supérieure au stock disponible ; la cohérence dépend uniquement de la base de données (pas de CHECK confirmé).

### I3 — Pas de filtre `site_id` sur la lecture des articles

- **Preuve** : `DataContext.tsx:193` — `supabase.from('inventory_items').select('*').order('name')` sans filtre `site_id` (contrairement à Finance qui filtre `site_id` selon le rôle, `useFinanceData.ts:7-20`).
- **Conséquence** : un utilisateur rattaché à un site voit tous les articles de tous les sites (pas d'isolement par site au niveau lecture).

### I4 — `RequireModule` n'autorise que `read`, pas `write`/`delete`

- **Preuve** : `src/routes/AppRoutes.tsx:289` — `action="read"` uniquement sur la route `/app/inventory`.
- **Conséquence** : l'autorisation d'écriture/suppression n'est pas vérifiée au niveau de la route ; elle repose uniquement sur le contrôle côté composant (boutons toujours rendus). Un rôle sans permission `inventory:write` peut accéder à la page et voir les boutons Modifier/Supprimer (qui échoueraient côté base si RLS bloque, mais l'UX n'empêche pas la tentative).

---

## 🟡 Améliorations

### A1 — KPIs avec couleurs en dur (hex) au lieu des tokens design-system

- **Preuve** : `src/pages/Inventory.tsx:86-89` — `color: '#2E7D32'`, `'#0277BD'`, `'#C62828'`, `'#F57F17'` en dur dans les KPIs.
- **Conséquence** : non-conformité avec la palette de référence BAHKANSO (`#2D5016`, `#4A7C2E`, etc. — CLAUDE.md §7) et duplication de styles.

### A2 — Pas de test unitaire dédié

- **Preuve** : aucun fichier `*.test.tsx` ni `*.test.ts` pour `Inventory.tsx`.
- **Conséquence** : pas de couverture sur la validation Zod, le `logAudit`, la suppression en `finally`, ni le filtrage des articles.

### A3 — `inventoryCounts` source orpheline (chargée, non affichée)

- Voir I1. Décision : soit ajouter un onglet « Inventaires physiques », soit retirer la source du registre `stock` pour éviter la requête inutile.

---

## ⚪ Décisions métier

### D1 — Canon du nom de module : `inventory` ou `stock` ?

- La route et le RBAC disent `inventory` (AppRoutes.tsx:289), le DataContext et `loadModule` disent `stock` (DataContext.tsx:58, Inventory.tsx:47).
- **Décision nécessaire** : choisir un nom canonique et l'aligner partout (route, RBAC, DataContext, MODULE_SOURCES, loadModule).

### D2 — Traitement des mouvements de stock (création UI)

- Actuellement, l'onglet Mouvements est en lecture seule. **Décision nécessaire** : ajouter un formulaire de saisie de mouvement (entrée/sortie) avec vérification `current_stock >= 0` à la sortie, et mise à jour automatique de `current_stock` sur l'article.

### D3 — Statuts et types en CHECK constraint

- `inventory_movements.type`, `inventory_counts.status` sont des `string` libres sans CHECK en base confirmé. **Décision nécessaire** : confirmer les valeurs canoniques et ajouter des CHECK constraints (ou les gérer uniquement par Zod/UI).

---

## 🧪 Couverture de test

- Aucun test unitaire ni d'intégration pour le module Stocks/Inventory.
- Les tests Dashboard couvrent partiellement les KPIs globaux mais pas les flux stock.

---

## 🔗 Liens avec autres modules

| Module cible | Lien depuis le stock | Statut |
|-------------|---------------------|--------|
| Finance | `financial_links` type `inventory_item` possible ; `unit_cost` de l'article réutilisé dans les dépenses | ⚠️ lien non implémenté UI |
| Exploitation (cultures) | `inventory_items` comme intrants (semences, engrais) — pas de lien explicite | ❌ absent |
| Élevage | `inventory_items` comme aliments/soins — pas de lien explicite | ❌ absent |
| Projets/Chantiers | pas de lien | ❌ absent |
| Dashboard | KPIs via `inventoryItems` source (dans `DASHBOARD_SOURCES`, DataContext.tsx:29) | ✅ présent (KPI) |
| Configuration (sites) | `site_id` sur chaque article, select `sites` dans le formulaire | ✅ présent (lecture sites) |

---

## 🎯 Plan de correction (3 vagues)

### Vague 1 — Correction critique (immédiat)

1. Aligner le nom de module `inventory`/`stock` partout (route, RBAC, DataContext, MODULE_SOURCES, `loadModule`) — corrige S1.

### Vague 2 — Robustesse et cohérence (important)

2. Retirer `inventoryCounts` du registre `stock` ou ajouter un onglet affichant les inventaires physiques — corrige I1/I3.
3. Ajouter un filtre `site_id` sur la lecture des `inventory_items` selon le rôle de l'utilisateur — corrige I3.
4. Étendre `RequireModule` à `action="write"` et `action="delete"` sur la route, ou masquer les boutons d'écriture selon `canWriteModule`/`canDeleteModule` — corrige I4.
5. Ajouter un formulaire de saisie de mouvement avec vérification `current_stock >= 0` à la sortie — corrige I2/D2.

### Vague 3 — UX et qualité (amélioration)

6. Remplacer les hex colors des KPIs par les tokens/constantes du design-system — corrige A1.
7. Ajouter des tests unitaires dédiés (validation Zod, logAudit, suppression en finally, filtrage) — corrige A2.
8. Ajouter des CHECK constraints en base sur `inventory_movements.type` et `inventory_counts.status` — corrige D3.

---

## 📝 Annexe — Preuves techniques

Extrait registre DataContext (`DataContext.tsx:52-60`) :
```ts
const MODULE_SOURCES: Record<string, string[]> = {
  dashboard: DASHBOARD_SOURCES as string[],
  exploitation: ['plots', 'sites', 'campaigns', 'cropOperations', 'harvests'],
  finance: ['suppliers', 'documents', 'fundings', 'bankAccounts', 'cashAccounts'],
  elevage: ['animals', 'animalLots', 'animalEvents'],
  ventes: ['customers'],
  stock: ['inventoryItems', 'inventoryMovements'],
  projets: ['projects', 'projectSteps', 'expenses'],
};
```

Extrait route (`AppRoutes.tsx:287-293`) :
```tsx
{
  path: 'inventory',
  element: (
    <RequireModule module="inventory" action="read">
      <InventorySuspense />
    </RequireModule>
  ),
},
```

Extrait `loadModule` (`Inventory.tsx:46-49`) :
```tsx
useEffect(() => {
  loadModule('stock');
  loadModule('exploitation');
}, [loadModule]);
```

Extrait absence de `inventoryCounts` dans le destructuring (`Inventory.tsx:43`) :
```ts
const { inventoryItems, inventoryMovements, sites, refresh, loadModule } = useData();
```

Extrait KPIs hex (`Inventory.tsx:86-89`) :
```tsx
{ label: 'Total articles', value: String(inventoryItems.length), icon: Package, color: '#2E7D32' },
{ label: 'Valeur du stock', value: formatCurrency(totalValue), icon: Package, color: '#0277BD' },
{ label: 'Articles en alerte', value: String(lowStock), icon: AlertTriangle, color: '#C62828' },
{ label: 'Mouvements ce mois', value: String(movementsThisMonth), icon: TrendingUp, color: '#F57F17' },
```

---

**Fichiers modifiés : aucun** (audit en lecture seule, aucun commit).

**Prochaine étape : ** écrire l'audit du module Médias/Media (docs/audits/2026-11-14-audit-module-media.md).
