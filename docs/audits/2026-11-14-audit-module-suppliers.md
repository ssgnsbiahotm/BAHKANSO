# Audit module Fournisseurs/Suppliers — 2026-11-14

## 📊 Résumé exécutif

Le module Fournisseurs est une page unique (`src/pages/Suppliers.tsx`) accessible via `/app/suppliers`, protégée par `RequireModule module="suppliers" action="read"`. Elle gère le CRUD des fournisseurs (`suppliers` table), affiche le total des achats et le nombre de transactions liés via la table `expenses` (jointure `supplier_id`), KPIs (nombre, total achats, note moyenne), recherche textuelle, `logAudit` sur CREATE/UPDATE/DELETE, suppression avec `ConfirmDeleteModal` (fermeture en `finally`), et `refresh()` après mutation. La validation est Zod (`supplierSchema`).

**Écarts : 🔴 0 critique, 🟠 3 importants, 🟡 2 améliorations, ⚪ 2 décisions métier.**

---

## ✅ Ce qui fonctionne bien

| Élément | Preuve |
|---------|--------|
| RBAC lecture sur la route | `src/routes/AppRoutes.tsx:303-309` `<RequireModule module="suppliers" action="read">` |
| Déclaration `loadModule('finance')` + `loadModule('exploitation')` | `src/pages/Suppliers.tsx:49-50` (dépendances croisées, `suppliers` dans registre `finance`) |
| Zod validation (`supplierSchema`) | `:20-29` |
| `logAudit` sur CREATE/UPDATE/DELETE | `:93`, `:98`, `:133` |
| Suppression avec fermeture du modal en `finally` | `:138-140` |
| `refresh()` du DataContext après mutation | `:101` |
| `ConfirmDeleteModal` + `DetailModal` partagés | `:284-292`, `:294-299` |
| KPIs (nombre, total achats, note moyenne) | `:69-73`, `:175-179` |
| Affichage des dépenses liées par fournisseur (`expenses.filter(e => e.supplier_id === s.id)`) | `:146-147`, `:202-203` |
| `site_id` requis avec select des sites | `:28`, `:267-274` |
| `RotatingCard` non utilisé (cartes simples, justifié : fournisseurs ne sont pas une liste métier avec verso) | conforme CLAUDE.md §7 |

---

## 🗺️ Inventaire

### Écran

| Écran | Fichier | Route | RBAC | Actions |
|-------|---------|-------|------|---------|
| Fournisseurs (page unique) | `src/pages/Suppliers.tsx` | `/app/suppliers` | `suppliers:read` | créer, éditer, supprimer fournisseurs |

### Données

| Table | Fichier de type | Colonnes clés |
|-------|-----------------|---------------|
| `suppliers` | `src/lib/types.ts:108-…` | id, name, category, phone, email, address, contact_person, rating, site_id, total_purchases |
| `expenses` (jointure) | — | supplier_id, amount (pour le total achats) |

### Dépendances croisées (DataContext)

| Source | Registre | Pourquoi déclarée |
|--------|----------|-----------------|
| `suppliers` | `finance` (DataContext.tsx:55) | chargement des fournisseurs |
| `expenses` | `finance` (DataContext.tsx:55) | calcul total achats par fournisseur |
| `sites` | `exploitation` / global | select du site dans le formulaire |

### Tests

| Test | Fichier | Couvre les fournisseurs ? |
|------|---------|---------------------------|
| Aucun test dédié | — | ❌ |

---

## 🔗 Matrice de cohérence (champs critiques)

| Champ | UI | Zod / TS | SQL CHECK | Statut |
|-------|----|----------|-----------|--------|
| `rating` | select 0-5 (ligne 276-279) | `z.coerce.number().min(0).max(5).default(3)` (ligne 27) | — | ✅ Zod |
| `email` | input type email | `z.string().email().optional().or(z.literal(''))` (ligne 24) | — | ✅ Zod |
| `site_id` | select requis (ligne 267) | `z.string().min(1)` (ligne 28) | — | ✅ Zod |
| `total_purchases` | calculé depuis `expenses` (pas de champ éditable) | insert `total_purchases: 0` (ligne 96) | — | ✅ cohérent (dérivé) |
| `supplier_id` sur `expenses` | FK implicite | — | — | — |

---

## 🟠 Écarts importants (preuves)

### I1 — Pas de protection contre la suppression d'un fournisseur ayant des dépenses liées

- **Preuve** : `src/pages/Suppliers.tsx:126-141` — `handleDelete` supprime la ligne `suppliers` sans vérifier si des `expenses` y font référence (`supplier_id`). Pas de contrôle FK ni de message d'avertissement.
- **Conséquence** : suppression d'un fournisseur référencé par des dépenses peut laisser des orphelins ou échouer si la base a une FK restrictive ; l'utilisateur n'est pas informé de l'impact.

### I2 — `total_purchases` n'est pas mis à jour à la création/édition d'une dépense liée

- **Preuve** : `src/pages/Suppliers.tsx:96` — `total_purchases: 0` à l'insertion, et le champ n'est jamais récalculé après. La valeur affichée dans le détail (`renderDetailFields`, ligne 146-147) est calculée à la volée depuis `expenses`, mais le champ stocké `total_purchases` reste à 0.
- **Conséquence** : incohérence entre le champ stocké (`total_purchases = 0`) et le total calculé à la volée depuis `expenses`. Le champ stocké est redondant et faux.

### I3 — `loadModule('exploitation')` appelé sans raison évidente (site_id seulement)

- **Preuve** : `src/pages/Suppliers.tsx:50` — `loadModule('exploitation')` est appelé alors que seules `suppliers` et `expenses` (registre `finance`) sont nécessaires ; `sites` est déjà dans GLOBAL_SOURCES (DataContext.tsx:40).
- **Conséquence** : chargement inutile de toutes les sources du module exploitation (plots, campagnes, opérations, récoltes) pour un simple select de sites. Impact performances.

---

## 🟡 Améliorations

### A1 — Pas de test unitaire dédié

- **Preuve** : aucun fichier `*.test.*` pour `Suppliers.tsx`.
- **Conséquence** : pas de couverture sur la validation Zod, le `logAudit`, la suppression en `finally`, ni le calcul des achats liés.

### A2 — Pas de contrôle de cohérence « fournisseur lié à des dépenses » avant suppression

- Voir I1. Décision : confirmer le comportement à la suppression (empêcher, ou proposer de supprimer/détacher les dépenses liées).

---

## ⚪ Décisions métier

### D1 — Comportement à la suppression d'un fournisseur référencé

- **Décision nécessaire** : confirmer si la suppression d'un fournisseur doit être bloquée s'il a des dépenses liées, ou proposer « supprimer aussi les dépenses » / « conserver détachées ». Documenter le comportement choisi.

### D2 — Redondance du champ `total_purchases`

- Le champ `total_purchases` est stocké (mis à 0 à l'insertion) mais aussi calculé à la volée depuis `expenses`. **Décision nécessaire** : supprimer le champ stocké et n'utiliser que le calcul à la volée, OU maintenir le champ à jour via un trigger/base à chaque écriture sur `expenses`.

---

## 🧪 Couverture de test

- Aucun test unitaire ni d'intégration pour le module Fournisseurs.

---

## 🔗 Liens avec autres modules

| Module cible | Lien depuis les fournisseurs | Statut |
|-------------|-----------------------------|--------|
| Finance (dépenses) | `expenses.supplier_id` → calcul total achats par fournisseur | ✅ présent (lecture) |
| Configuration (sites) | `suppliers.site_id` → select des sites | ✅ présent (lecture) |
| Dashboard | aucun KPI fournisseur direct | ❌ absent |

---

## 🎯 Plan de correction (3 vagues)

### Vague 1 — Correction critique (immédiat)

— Aucun écart critique.

### Vague 2 — Robustesse et cohérence (important)

1. Ajouter un contrôle avant suppression : bloquer ou avertir si des dépenses sont liées au fournisseur (I1).
2. Supprimer le champ redondant `total_purchases` (ou le maintenir à jour) — choisir et appliquer (I2).
3. Retirer l'appel inutile `loadModule('exploitation')` (I3).

### Vague 3 — UX et qualité (amélioration)

4. Ajouter des tests unitaires dédiés (validation Zod, logAudit, suppression en finally, calcul achats) — corrige A1.
5. Documenter le comportement de suppression (D1) et la gestion de `total_purchases` (D2).

---

## 📝 Annexe — Preuves techniques

Extrait contrôle suppression absent (`Suppliers.tsx:126-141`) :
```ts
const handleDelete = async () => {
  // ...
  const { error } = await supabase.from('suppliers').delete().eq('id', confirmDelete.id);
  // pas de vérification des expenses liées
};
```

Extrait `total_purchases: 0` à l'insertion (`Suppliers.tsx:96`) :
```ts
const { error } = await supabase.from('suppliers').insert({ ...payload, total_purchases: 0 });
```

Extrait dépendances croisées (`Suppliers.tsx:48-51`) :
```ts
useEffect(() => {
  loadModule('finance');
  loadModule('exploitation');
}, [loadModule]);
```

Extrait registre DataContext (`DataContext.tsx:52-55`) :
```ts
const MODULE_SOURCES: Record<string, string[]> = {
  // ...
  finance: ['suppliers', 'documents', 'fundings', 'bankAccounts', 'cashAccounts'],
  // ...
};
```

---

**Fichiers modifiés : aucun** (audit en lecture seule, aucun commit).

**Prochaine étape : ** écrire l'audit du module Surveillance (docs/audits/2026-11-14-audit-module-surveillance.md).
