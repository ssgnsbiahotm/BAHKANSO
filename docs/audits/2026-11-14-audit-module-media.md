# Audit module Médias/Media — 2026-11-14

## 📊 Résumé exécutif

Le module Médias est une page unique (`src/pages/Media.tsx`) sans route protégée dédiée dans `AppRoutes.tsx` (ni `RequireModule`, ni route `/app/media` déclarée). Elle gère l'upload d'images vers le bucket Storage `app-assets`, le stockage des métadonnées en base (`media` table), le filtrage par type/catégorie/recherche, la suppression avec `ConfirmDeleteModal` (fermeture en `finally`), et `logAudit` sur CREATE/UPDATE/DELETE. Les KPIs utilisent `STATUS_CLASS_*` du design-system.

**Écarts : 🔴 1 critique, 🟠 3 importants, 🟡 2 améliorations, ⚪ 2 décisions métier.**

---

## ✅ Ce qui fonctionne bien

| Élément | Preuve |
|---------|--------|
| `logAudit` sur CREATE/UPDATE/DELETE | `src/pages/Media.tsx:131`, `:144`, `:160` |
| Suppression avec fermeture du modal en `finally` | `:165-167` |
| `refresh()` du DataContext après mutation | `:134`, `:147` |
| Validation titre obligatoire + taille/type fichier (5 Mo, image/) | `:88-95`, `:112-115` |
| États vide / erreur gérés | `:230-236` |
| Filtrage par type, catégorie, recherche textuelle | `:54-68` |
| KPIs avec `STATUS_CLASS_*` constants (pas d'hex en dur) | `:16-25`, `:86-192` |
| `media` source dans GLOBAL_SOURCES (toujours chargée) | `src/lib/DataContext.tsx:45` |
| `RotatingCard` non utilisé (grid d'images, justifié : pas de liste métier) | conforme CLAUDE.md §7 (pas de cartes pour médias) |

---

## 🗺️ Inventaire

### Écran

| Écran | Fichier | Route | RBAC | Actions |
|-------|---------|-------|------|---------|
| Médias (page unique) | `src/pages/Media.tsx` | — (pas de route déclarée) | aucun `RequireModule` | upload, créer, éditer, supprimer médias |

### Données

| Table | Fichier de type | Colonnes clés |
|-------|-----------------|---------------|
| `media` | `src/lib/types.ts:451-461` | id, title, description, url, type, category, uploaded_by, created_at, updated_at |

### Données simulées / constantes

| Constante | Fichier | Valeurs |
|-----------|---------|---------|
| `MEDIA_TYPES` | `src/lib/constants.ts:246-250` | `['image', 'icon', 'logo']` |
| `MEDIA_CATEGORIES` | `:252-259` | `['site vitrine','icône application','logo','illustration','bannière','autre']` |

### Stockage

| Élément | Preuve |
|---------|--------|
| Bucket Storage | `supabase.storage.from('app-assets').upload(...)` — `Media.tsx:99` |
| Taille max | 5 Mo (`Media.tsx:88`) |
| Type MIME | `image/` uniquement (`Media.tsx:92`) |

### Tests

| Test | Fichier | Couvre le média ? |
|------|---------|-------------------|
| Aucun test dédié | — | ❌ |

---

## 🔗 Matrice de cohérence (champs critiques)

| Champ | UI | Zod / TS | SQL CHECK | Statut |
|-------|----|----------|-----------|--------|
| `media.type` | select `MEDIA_TYPES` (image/icon/logo) | `type: string` (types.ts:456) | — | ⚠️ pas d'enum TS, pas de CHECK |
| `media.category` | select `MEDIA_CATEGORIES` | `category: string \| null` | — | ⚠️ pas de CHECK |
| `media.url` | public URL Storage | `url: string \| null` | — | — |
| Taille fichier | 5 Mo max (client seulement) | — | — | ⚠️ pas de contrôle côté base |
| Type MIME | `image/` (client seulement) | — | — | ⚠️ pas de contrôle côté base |

---

## 🔴 Écarts critiques (preuves)

### S1 — Aucune route déclarée ni protection RBAC pour le module Médias

- **Preuve** : `src/routes/AppRoutes.tsx` — il n'existe **aucune entrée** `path: 'media'` avec `<RequireModule module="media" action="read">`. La constante `MEDIA_Suspense` existe (ligne 75) mais n'est pas rattachée à une route.
- **Conséquence** : le module Médias n'est accessible par aucune route de l'application (lien mort / page orpheline). Tout utilisateur pourrait y accéder si on ajoutait un lien, sans vérification de rôle. **À ajouter à `AppRoutes.tsx` avec `RequireModule module="media"`**.

---

## 🟠 Écarts importants (preuves)

### I1 — `media.type` et `media.category` sans contrainte de domaine (ni enum TS, ni CHECK SQL)

- **Preuve** : `src/lib/types.ts:456` — `type: string; // 'image' | 'icon' | 'logo'` (commentaire uniquement, pas d'union type). `category: string | null`. Les valeurs sont imposées côté UI par `MEDIA_TYPES`/`MEDIA_CATEGORIES` (constants.ts) mais rien ne les force en base ni au niveau TypeScript strict.
- **Conséquence** : une valeur arbitraire peut être insérée en base ; pas de cohérence garantie entre UI et données.

### I2 — Pas de suppression du fichier Storage associé lors de la suppression d'un média

- **Preuve** : `src/pages/Media.tsx:153-168` — `handleConfirmDelete` supprime seulement la ligne `media` (et logAudit), sans appeler `supabase.storage.from('app-assets').remove(...)` sur l'URL/fichier.
- **Conséquence** : fichiers orphelins dans le bucket `app-assets` après suppression d'un média (fuite de stockage).

### I3 — `updated_at` et `uploaded_by` renseignés côté client, pas par la base

- **Preuve** : `src/pages/Media.tsx:123-124` — `uploaded_by: appUser?.id ?? null`, `updated_at: new Date().toISOString()` sont passés dans le payload d'insertion/update. Aucun `default now()` ni trigger côté base n'est confirmé.
- **Conséquence** : si un client contournant l'UI insère sans ces champs, les données sont incomplètes ; traçabilité faible.

---

## 🟡 Améliorations

### A1 — Pas de test unitaire dédié

- **Preuve** : aucun fichier `*.test.*` pour `Media.tsx`.
- **Conséquence** : pas de couverture sur l'upload, la validation, le `logAudit`, la suppression en `finally`.

### A2 — L'upload écrase silencieusement un média existant au même nom

- **Preuve** : `Media.tsx:98` — `fileName = media/${Date.now()}-${Math.random()}.${ext}` (nom aléatoire, pas de collision), mais `upsert: false` par défaut. Si un fichier du même nom existait, l'upload échouerait sans message spécifique.
- **Conséquence** : le nom aléatoire élimine le risque en pratique, mais pas de gestion d'erreur spécifique si collision.

---

## ⚪ Décisions métier

### D1 — Ajouter la route `/app/media` avec RBAC

- **Décision nécessaire** : déclarer la route `/app/media` dans `AppRoutes.tsx` avec `<RequireModule module="media" action="read">` (et `write`/`delete` pour les actions d'écriture), et l'ajouter au menu latéral.

### D2 — Traitement des fichiers orphelins Storage à la suppression

- **Décision nécessaire** : confirmer si la suppression d'un média doit aussi supprimer le fichier dans le bucket `app-assets` (préconisé : oui, avec gestion d'erreur non bloquante).

---

## 🧪 Couverture de test

- Aucun test unitaire ni d'intégration pour le module Médias.

---

## 🔗 Liens avec autres modules

| Module cible | Lien depuis les médias | Statut |
|-------------|----------------------|--------|
| Finance (documents) | `documents` table a son propre upload (`app-assets`) — parallèle, pas de réutilisation du module Media | ⚠️ duplication logique |
| Landing / Site vitrine | `site_content` référence des URLs média — pas de lien direct vers `media` table | ❌ absent |
| Configuration | aucun | ❌ absent |

---

## 🎯 Plan de correction (3 vagues)

### Vague 1 — Correction critique (immédiat)

1. Déclarer la route `/app/media` dans `AppRoutes.tsx` avec `<RequireModule module="media" action="read">` — corrige S1.

### Vague 2 — Robustesse et cohérence (important)

2. Ajouter un enum TS `Media['type']` strict (au lieu de `string`) et des CHECK constraints en base sur `media.type` et `media.category` — corrige I1.
3. Supprimer le fichier Storage associé lors de la suppression d'un média (`handleConfirmDelete`) — corrige I2.
4. Gérer `created_at`/`updated_at`/`uploaded_by` par trigger ou default côté base (ou au moins valider leur présence) — corrige I3.

### Vague 3 — UX et qualité (amélioration)

5. Ajouter des tests unitaires dédiés (upload, validation, logAudit, suppression en finally) — corrige A1.
6. Facturer l'upload Storage dans un composant/hook réutilisable partagé avec `DocumentsTab` (Finance) pour éviter la duplication — optionnel.

---

## 📝 Annexe — Preuves techniques

Extrait absence de route (`AppRoutes.tsx`) :
```ts
// aucune entrée path: 'media' avec RequireModule
```
(La constante `MediaSuspense` est déclarée à la ligne 75 mais jamais utilisée dans une route.)

Extrait type Media (`types.ts:451-461`) :
```ts
export interface Media {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  type: string; // 'image' | 'icon' | 'logo'
  category: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}
```

Extrait suppression sans remove Storage (`Media.tsx:153-168`) :
```ts
const { error } = await supabase.from('media').delete().eq('id', confirmDelete.id);
// ...
// pas de supabase.storage.from('app-assets').remove(...)
```

Extrait GLOBAL_SOURCES (`DataContext.tsx:39-48`) :
```ts
const GLOBAL_SOURCES: string[] = [
  'farm', 'users', 'funders', 'customers', 'siteContent', 'media',
  'notifications', 'alerts',
];
```

---

**Fichiers modifiés : aucun** (audit en lecture seule, aucun commit).

**Prochaine étape : ** écrire l'audit du module Fournisseurs/Suppliers (docs/audits/2026-11-14-audit-module-suppliers.md).
