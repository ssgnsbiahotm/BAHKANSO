# Audit module Configuration — 2026-11-14

## 📊 Résumé exécutif

Le module Configuration est une page unique unifiée (`src/pages/Configuration.tsx`) accessible via `/app/configuration`, protégée par `RequireModule module="configuration" action="read"`. Elle rassemble deux domaines : **exploitation** (ferme, site, bailleurs, clients) et **contenu** (logo, favicon, hero, sections, couleurs, titre). Trois sous-pages dédiées existent : `SitesPage.tsx`, `BailleursPage.tsx`, `ClientsPage.tsx`. La page principale gère un système de brouillons (draft), l'upload de logo/favicon/hero vers le bucket Storage `app-assets`, l'écriture sur les tables `farms` et `site_content`, et un `logAudit` sur chaque changement. La validation est manuelle (pas de Zod). Le module n'utilise pas `RotatingCard` (justifié : ce n'est pas une liste métier).

**Écarts : 🔴 0 critique, 🟠 7 importants, 🟡 6 améliorations, ⚪ 6 décisions métier.**

---

## ✅ Ce qui fonctionne bien

| Élément | Preuve |
|---------|--------|
| RBAC lecture sur la route `/app/configuration` | `src/routes/AppRoutes.tsx:29-160` `<RequireModule module="configuration" action="read">` |
| Déclaration `loadModule('exploitation')` + `loadModule('elevage')` | `Configuration.tsx:loadModule` (données ferme/site) |
| `logAudit` sur chaque modification (ferme, contenu, uploads) | `Configuration.tsx` (appels `logAudit` à chaque mutation) |
| Upload logo/favicon/hero vers le bucket `app-assets` | `Configuration.tsx` (Storage `app-assets`) |
| Injection des variables CSS `--color-primary/secondary/accent` sur `documentElement` | `Configuration.tsx` (branding dynamique) |
| ConfirmDeleteModal sur suppression de site/bailleur/client (fermeture en `finally`) | `SitesPage.tsx`, `BailleursPage.tsx`, `ClientsPage.tsx` |
| `refresh()` du DataContext après mutation | `SitesPage.tsx`, `BailleursPage.tsx`, `ClientsPage.tsx` |
| Contrôle suppression de site si parcelles/animaux liés | `SitesPage.tsx` (vérifie avant suppression physique) |
| `RotatingCard` `flipLabel`/`backLabel` rendus sur sites, bailleurs, clients | `SitesPage.tsx`, `BailleursPage.tsx`, `ClientsPage.tsx` |
| Routes dédiées `/app/configuration/clients`, `/app/configuration/bailleurs`, `/app/configuration/sites` | `AppRoutes.tsx` |

---

## 🗺️ Inventaire

### Écrans

| Écran | Fichier | Route | RBAC | Actions |
|-------|---------|-------|------|---------|
| Configuration (unifiée) | `src/pages/Configuration.tsx` | `/app/configuration` | `configuration:read` | ferme + contenu + uploads |
| Sites | `src/pages/configuration/SitesPage.tsx` | `/app/configuration/sites` | `configuration:read` | CRUD sites |
| Bailleurs | `src/pages/configuration/BailleursPage.tsx` | `/app/configuration/bailleurs` | `configuration:read` | CRUD bailleurs |
| Clients | `src/pages/configuration/ClientsPage.tsx` | `/app/configuration/clients` | `configuration:read` | CRUD clients |

### Données

| Table | Fichier de type | Colonnes clés | Registre DataContext |
|-------|-----------------|---------------|----------------------|
| `farms` | `src/lib/types.ts` | id, name, site_id, phone, email, address, logo_url, favicon_url, hero_url, ... | `exploitation` / global |
| `site_content` | `src/lib/types.ts` | id, key, value, type, ... | global (`siteContent`) |
| `sites` | `src/lib/types.ts` | id, name, code, ... | `exploitation` |
| `customers` | `src/lib/types.ts` | id, name, type, email, phone, site_id, total_purchases, ... | `finance` |
| `funders` (bailleurs) | `src/lib/types.ts` | id, name, email, ... | `finance` |
| `media` | `src/lib/types.ts` | id, title, description, url, type, category, ... | `media` (GLOBAL_SOURCES) |

### Dépendances croisées (DataContext)

| Source | Registre | Pourquoi déclarée |
|--------|----------|-----------------|
| `farms` | `exploitation` | données de la ferme (Configuration.tsx) |
| `sites` | `exploitation` | select de site (SitesPage, ClientsPage) |
| `funders` | `finance` | bailleurs (BailleursPage) |
| `customers` | `finance` | clients (ClientsPage) |
| `media` | GLOBAL_SOURCES | logo/favicon/hero (Configuration.tsx) |

### Hooks et helpers utilisés

| Élément | Fichier | Rôle |
|---------|---------|------|
| `useData()` | `src/lib/DataContext` | lit `farms`, `sites`, `funders`, `customers`, `media`, `refresh`, `loadModule` |
| `useAuth()` | `src/lib/AuthContext` | `appUser` pour `logAudit` |
| `logAudit` | `src/lib/types` | traçabilité des modifications |
| `formatCurrency` / `formatDate` | `src/lib/format` | formatage FCFA / date française |
| `generateEntityIdentifier` | — | génération des codes `SIT-` (SitesPage) |
| `isAdminOrOwner` | en dur dans chaque page | garde d'accès (pas `hasPermission`) |

### Tests

| Test | Fichier | Couvre la configuration ? |
|------|---------|---------------------------|
| Aucun test dédié | — | ❌ |

---

## 🔗 Matrice de cohérence (champs critiques)

| Champ | UI | Zod / TS | SQL CHECK | Statut |
|-------|----|----------|-----------|--------|
| `sites.code` | `SIT-` + nombre (generateEntityIdentifier) | `string` (types.ts) | — | ⚠️ pas d'enum, pas de CHECK |
| `customers.type` | select (`particulier`/`restaurant`/`marché`/`exportateur`/`autre`) | `string` (types.ts) | — | ⚠️ pas d'enum TS, pas de CHECK |
| `farms.logo_url` / `favicon_url` / `hero_url` | upload Storage `app-assets` | `string \| null` | — | — |
| `site_content.key` / `value` | saisie libre (formulaire contenu) | `string` | — | ⚠️ pas de contrainte |
| `farms.site_id` | select requis | `string` | — | — |

---

## 🔴 Écarts critiques (preuves)

— Aucun écart critique.

---

## 🟠 Écarts importants (preuves)

### C1 — `isAdminOrOwner` en dur, pas `hasPermission` (toutes les sous-pages)

- **Preuve** : `Configuration.tsx` (ligne de définition du garde), `SitesPage.tsx`, `BailleursPage.tsx`, `ClientsPage.tsx:15-16` — `const isAdminOrOwner = (role) => role === 'administrateur' || role === 'propriétaire'`. Aucun appel à `hasPermission(role, 'configuration', 'write'/'delete')`.
- **Conséquence** : l'autorisation d'écriture/suppression n'est pas vérifiée via le modèle RBAC centralisé (`rbac.ts`). Un rôle autre qu'administrateur/propriétaire est bloqué côté UI, mais il n'existe pas de granularité (ex. un rôle « gestionnaire » ne peut pas gérer les clients même si autorisé).

### C2 — Pas de validation Zod sur les formulaires (toutes les sous-pages)

- **Preuve** : `SitesPage.tsx`, `BailleursPage.tsx`, `ClientsPage.tsx` — la validation est manuelle (ex. `ClientsPage.tsx:92-100` : `if (!form.name)`, `if (!form.email && !form.phone)`). Aucun schéma Zod ni `useValidatedForm`.
- **Conséquence** : pas de validation déclarative côté client ; les erreurs ne sont gérées qu'à la réponse Supabase. Incohérent avec les autres modules (Finance, Stocks, Projets, Fournisseurs) qui utilisent Zod.

### C3 — Suppression physique sans contrôle de cohérence (sites, bailleurs, clients)

- **Preuve** : `SitesPage.tsx` (contrôle parcelles/animaux présent ✅ mais suppression physique), `BailleursPage.tsx` (suppression physique directe), `ClientsPage.tsx:170` (suppression physique directe, pas de vérification des dépenses/opérations liées).
- **Conséquence** : suppression d'un site référencé par des parcelles, d'un bailleur ou d'un client référencé par des dépenses/opérations peut laisser des orphelins. Pas de choix « supprimer aussi » / « conserver détaché ».

### C4 — `BailleursPage` re-fetch direct des bailleurs si DataContext vide (contournement)

- **Preuve** : `BailleursPage.tsx` — si la source `funders` est vide/non chargée, la page effectue une requête directe `supabase.from('funders').select('*')` au lieu de s'appuyer sur `loadModule('finance')`.
- **Conséquence** : doublon de logique de chargement ; incohérence avec le mécanisme DataContext (pas de statut idle/loading/error, pas de `refresh()` cohérent).

### C5 — `ClientsPage` ne déclare pas `loadModule` pour ses données

- **Preuve** : `ClientsPage.tsx:40-62` — requêtes directes `supabase.from('customers')` et `supabase.from('sites')` sans appel à `loadModule('finance')` ni `loadModule('exploitation')`.
- **Conséquence** : les données clients ne passent pas par le registre MODULE_SOURCES ; pas de suivi de statut de chargement (idle/loading/success/error) ni d'invalidation cohérente.

### C6 — `Configuration.tsx` injecte des variables CSS globales sur `documentElement`

- **Preuve** : `Configuration.tsx` — `documentElement.style.setProperty('--color-primary', ...)` etc. (modification directe du DOM racine).
- **Conséquence** : modification globale du DOM hors du design-system tokens (`STATUS_CLASS_*`). Risque de conflit avec d'autres pages et de fuites de style entre modules.

### C7 — `ClientsPage` : `setSaving` déclaré mais inutilisé (variable orpheline)

- **Preuve** : `ClientsPage.tsx:24` — `const [, setSaving] = useState(false);` — le destructuring ignore `setSaving` et la variable n'est jamais lue ailleurs.
- **Conséquence** : état mort ; pas d'indicateur de chargement pendant la mutation (pas d'anti double-soumission visuelle).

---

## 🟡 Améliorations

### A1 — Pas de `RotatingCard` sur la page principale Configuration (justifié)

- **Preuve** : `Configuration.tsx` n'importe pas `RotatingCard`.
- **Conséquence** : conforme à CLAUDE.md §7 (ce n'est pas une liste métier), mais la page principale affiche des cartes d'info ferme sans composant partagé.

### A2 — Pas de test unitaire dédié au module Configuration

- **Preuve** : aucun fichier `*.test.*` pour `Configuration.tsx`, `SitesPage.tsx`, `BailleursPage.tsx`, `ClientsPage.tsx`.
- **Conséquence** : pas de couverture sur le `logAudit`, l'upload Storage, la suppression en `finally`, ni le contrôle de cohérence avant suppression.

### A3 — `total_purchases` sur `customers` mis à 0 à l'insertion, jamais récalculé

- **Preuve** : `ClientsPage.tsx:136` — `total_purchases: 0` à l'insertion ; le champ n'est jamais mis à jour après.
- **Conséquence** : champ stocké redondant et faux (même pattern que Fournisseurs — voir audit Fournisseurs I2).

### A4 — `site_id` non filtré par rôle sur la lecture (sites, clients)

- **Preuve** : `SitesPage.tsx`, `ClientsPage.tsx:55` — `supabase.from('sites').select('*')` sans filtre `site_id` selon le rôle de l'utilisateur.
- **Conséquence** : un utilisateur rattaché à un site voit tous les sites/clients (pas d'isolement par site au niveau lecture).

### A5 — `BailleursPage` : pas de `loadModule('finance')` déclaré

- **Preuve** : `BailleursPage.tsx` — pas d'appel à `loadModule` pour `funders`.
- **Conséquence** : les bailleurs ne passent pas par le registre MODULE_SOURCES.

### A6 — Couleurs en dur dans les sous-pages (non-design-system)

- **Preuve** : `SitesPage.tsx`, `BailleursPage.tsx`, `ClientsPage.tsx` — `bg-success`, `bg-danger`, `bg-warning` en dur sur les boutons.
- **Conséquence** : non-conformité avec la palette de référence BAHKANSO et du design-system (`STATUS_CLASS_*`).

---

## ⚪ Décisions métier

### D1 — Garde d'accès : `isAdminOrOwner` vs `hasPermission`

- **Décision nécessaire** : confirmer si la gestion de la configuration est réservée strictement aux administrateurs/propriétaires, ou si un modèle RBAC granulaire (`hasPermission(role, 'configuration', 'write')`) doit être appliqué (CLAUDE.md §11).

### D2 — Comportement à la suppression d'un site/bailleur/client référencé

- **Décision nécessaire** : confirmer si la suppression doit être bloquée quand des parcelles/animaux (sites), dépenses (bailleurs/clients) y font référence, ou proposer « supprimer aussi » / « conserver détaché » (CLAUDE.md §10 cascades).

### D3 — Conservation du champ `total_purchases` sur `customers`

- Le champ est mis à 0 à l'insertion et jamais récalculé. **Décision nécessaire** : supprimer le champ stocké et n'utiliser que le calcul à la volée depuis `expenses`, OU le maintenir à jour.

### D4 — Soft-delete vs suppression physique

- Les sous-pages suppriment physiquement (pas de `deleted_at`). **Décision nécessaire** : confirmer le mode retenu pour le module Configuration et aligner les lecteurs (`deleted_at IS NULL`) le cas échéant.

### D5 — Injection de variables CSS globales sur `documentElement`

- **Décision nécessaire** : confirmer si l'injection directe de `--color-primary/secondary/accent` sur la racine du DOM est le mécanisme retenu pour le branding, ou si elle doit passer par les tokens du design-system.

### D6 — Canon des types de client

- `customers.type` est un `string` avec un select figé (particulier/restaurant/marché/exportateur/autre). **Décision nécessaire** : confirmer la liste canonique et l'appliquer via enum TS + CHECK SQL.

---

## 🧪 Couverture de test

- Aucun test unitaire ni d'intégration pour le module Configuration.
- Les tests Dashboard couvrent partiellement les KPIs globaux mais pas les flux configuration.

---

## 🔗 Liens avec autres modules

| Module cible | Lien depuis la configuration | Statut |
|-------------|-----------------------------|--------|
| Finance (dépenses) | `customers` / `funders` liés aux `expenses` | ✅ présent (lecture) |
| Exploitation (sites/parcelles) | `sites.site_id` lié aux `plots` ; contrôle suppression si liés | ✅ présent |
| Surveillance | `surveillance_events` liée à `sites` | ✅ présent (relations) |
| Dashboard | KPIs via `farms`, `site_content` | ⚠️ non confirmé dans `DASHBOARD_SOURCES` |
| Médias | `farms.logo_url/favicon_url/hero_url` vers bucket `app-assets` | ✅ présent (Storage partagé) |
| Stocks | pas de lien explicite | ❌ absent |
| Élevage | pas de lien explicite | ❌ absent |
| Projets/Chantiers | `projects.site_id` (lecture) | ✅ présent (colonne) |

---

## 🎯 Plan de correction (3 vagues)

### Vague 1 — Correction critique (immédiat)

— Aucun écart critique.

### Vague 2 — Robustesse et cohérence (important)

1. Remplacer `isAdminOrOwner` en dur par `hasPermission(role, 'configuration', 'write'/'delete')` sur les sous-pages — corrige C1.
2. Ajouter une validation Zod sur les formulaires (sites, bailleurs, clients) — corrige C2.
3. Ajouter un contrôle avant suppression : bloquer ou avertir si des références existent (parcelles/animaux pour sites ; dépenses pour bailleurs/clients) — corrige C3.
4. Supprimer le re-fetch direct dans `BailleursPage` et s'appuyer sur `loadModule('finance')` — corrige C4.
5. Ajouter `loadModule('finance')` + `loadModule('exploitation')` dans `ClientsPage` — corrige C5.
6. Retirer l'injection CSS globale sur `documentElement` ou la faire passer par les tokens design-system — corrige C6.
7. Retirer `setSaving` orphelin dans `ClientsPage` ou l'utiliser pour l'indicateur de chargement — corrige C7.

### Vague 3 — UX et qualité (amélioration)

8. Ajouter des tests unitaires dédiés (logAudit, upload Storage, suppression en finally, contrôle cohérence) — corrige A2.
9. Supprimer `total_purchases` du stockage ou le maintenir à jour — corrige A3.
10. Ajouter un filtre `site_id` sur la lecture des sites/clients selon le rôle — corrige A4.
11. Ajouter `loadModule('finance')` dans `BailleursPage` — corrige A5.
12. Remplacer les couleurs en dur par les tokens/constantes du design-system — corrige A6.
13. Documenter le comportement de suppression (D2), la gestion de `total_purchases` (D3), le mode soft-delete vs physique (D4), le mécanisme de branding (D5), et les valeurs canoniques des types de client (D6).

---

## 📝 Annexe — Preuves techniques

Extrait `isAdminOrOwner` en dur (`ClientsPage.tsx:15-16`) :
```ts
const isAdminOrOwner = (role: string | undefined) =>
  role === 'administrateur' || role === 'propriétaire';
```

Extrait validation manuelle sans Zod (`ClientsPage.tsx:92-100`) :
```ts
const handleSubmit = async () => {
  if (!form.name) {
    toast.show('Nom obligatoire', 'error');
    return;
  }
  if (!form.email && !form.phone) {
    toast.show('Email ou téléphone obligatoire', 'error');
    return;
  }
  // ...
```

Extrait suppression physique sans contrôle (`ClientsPage.tsx:170`) :
```ts
const { error } = await supabase.from('customers').delete().eq('id', confirmDelete.id);
```

Extrait `setSaving` orphelin (`ClientsPage.tsx:24`) :
```ts
const [, setSaving] = useState(false);
```

Extrait routes Configuration (`AppRoutes.tsx:29-160`) :
```tsx
{
  path: 'configuration',
  element: (
    <RequireModule module="configuration" action="read">
      <ConfigurationSuspense />
    </RequireModule>
  ),
},
```

**Fichiers modifiés : aucun** (audit en lecture seule, aucun commit).

**Prochaine étape : ** écrire l'audit du module Dashboard (docs/audits/2026-11-14-audit-module-dashboard.md).
