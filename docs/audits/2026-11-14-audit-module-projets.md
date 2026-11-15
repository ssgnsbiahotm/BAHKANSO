# Audit module Projets/Chantiers — 2026-11-14

## 📊 Résumé exécutif

Le module Projets/Chantiers est une page unique (`src/pages/Projects.tsx`) accessible via `/app/projects`, protégée par `RequireModule module="projects" action="read"`. Elle gère le CRUD des projets (`projects` table), l'affichage des étapes (`project_steps`) et des dépenses liées (`expenses`), des KPIs (budget total, total dépensé, en cours, terminés), un filtrage par statut (tous/en cours/terminés), et un affichage carte retournable (flip-card maison). Les mutations utilisent `logAudit` et `refresh()`. La validation est Zod (`projectSchema`).

**Écarts : 🔴 0 critique, 🟠 4 importants, 🟡 3 améliorations, ⚪ 3 décisions métier.**

---

## ✅ Ce qui fonctionne bien

| Élément | Preuve |
|---------|--------|
| RBAC lecture sur la route `/app/projects` | `src/routes/AppRoutes.tsx:295-301` `<RequireModule module="projects" action="read">` |
| Déclaration `loadModule('projets')` | `src/pages/Projects.tsx:53` |
| Sources `projets` dans le registre (`projects`, `projectSteps`, `expenses`) | `src/lib/DataContext.tsx:59` |
| `projects` dans `DASHBOARD_SOURCES` | `src/lib/DataContext.tsx:25-30` |
| Zod validation sur le formulaire (`projectSchema`) | `src/pages/Projects.tsx:22-32` |
| `logAudit` sur CREATE/UPDATE/DELETE | `:112`, `:117`, `:152` |
| `refresh()` du DataContext après mutation | `:120`, `:156` |
| `ConfirmDeleteModal` + `DetailModal` partagés | `:554-559`, `:504-512` |
| KPIs (budget total, total dépensé, en cours, terminés) | `:82-90` |
| Affichage étapes du projet (progression, coût réel vs budget) | `:162-202` |
| Filtrage par statut (tous/en cours/terminés) | `:57-80` |
| États vide gérés (Aucun projet / Aucun résultat) | `:293-299` |
| `PROJECT_STATUSES` / `PROJECT_STATUS_COLORS` dans `constants.ts` (tokens design-system) | `src/lib/constants.ts:81-97` |

---

## 🗺️ Inventaire

### Écran

| Écran | Fichier | Route | RBAC | Actions |
|-------|---------|-------|------|---------|
| Projets & Chantiers (page unique) | `src/pages/Projects.tsx` | `/app/projects` | `projects:read` | créer, éditer, supprimer projets ; consulter étapes |

### Données

| Table | Fichier de type | Colonnes clés |
|-------|-----------------|---------------|
| `projects` | `src/lib/types.ts:289` | id, name, type, responsible, initial_budget, revised_budget, start_date, expected_end_date, actual_end_date, status, progress, description, funding_id, site_id |
| `project_steps` | `:306` | id, project_id, name, budget, actual_cost, progress, responsible, date, status |
| `expenses` (liées) | — | project_id, amount, status (pour le total dépensé) |

### Dépendances croisées (DataContext)

| Source | Registre | Pourquoi déclarée |
|--------|----------|-----------------|
| `projects` | `projets` (DataContext.tsx:59) | chargement des projets |
| `projectSteps` | `projets` (:59) | affichage étapes dans le détail |
| `expenses` | `projets` (:59) | calcul total dépensé par projet |

### Hooks et helpers utilisés

| Élément | Fichier | Rôle |
|---------|---------|------|
| `useData()` | `src/lib/DataContext` | lit `projects`, `projectSteps`, `expenses`, `refresh`, `loadModule` |
| `useAuth()` | `src/lib/AuthContext` | `appUser` pour `logAudit` |
| `useValidatedForm` | `src/components/ui/ValidatedForm` | formulaire Zod + `onSubmit` |
| `formatCurrency` / `formatDate` | `src/lib/format` | formatage FCFA / date française |
| `StatusBadge` | `src/components/ui/Badge` | badge statut projet/étape |
| `ProgressBar` | `src/components/ui/ProgressBar` | barre de progression |

### Tests

| Test | Fichier | Couvre les projets ? |
|------|---------|---------------------|
| Aucun test dédié | — | ❌ |

---

## 🔗 Matrice de cohérence (champs critiques)

| Champ | UI | Zod / TS | SQL CHECK | Statut |
|-------|----|----------|-----------|--------|
| `projects.status` | select `PROJECT_STATUSES` (:543-546) | `z.enum(PROJECT_STATUSES)` (:29) | — | ✅ Zod enum |
| `projects.progress` | input 0-100 (:533-535) | `z.coerce.number().min(0).max(100)` (:30) | — | ✅ Zod |
| `projects.initial_budget` | input number ≥0 (:530-532) | `z.coerce.number().min(0)` (:26) | — | ✅ Zod |
| `projects.type` | input texte libre (:524-526) | `z.string().default('infrastructure')` (:24) | — | ⚠️ pas d'enum, pas de select |
| `projects.revised_budget` | pas de champ éditable (copie `initial_budget` dans le payload :101) | **absent du schéma Zod** | — | ⚠️ champ stocké non géré par le formulaire |
| `project_steps.status` | `STATUS_CLASS_*` (ligne 189-196) | `status: string` (types.ts:315) | — | ⚠️ pas de CHECK |
| `project_steps.progress` | affiché seulement (lecture) | `progress: number` | — | — |

---

## 🔴 Écarts critiques (preuves)

— Aucun écart critique.

---

## 🟠 Écarts importants (preuves)

### I1 — Pas de composant `RotatingCard` (flip-card maison en CSS pur)

- **Preuve** : `src/pages/Projects.tsx:310-356` — la carte retournable est implémentée en CSS pur (`transformStyle: 'preserve-3d'`, `rotateY(180deg)`, `transition: 'transform 650ms'`) avec un état `flippedProjects` (lignes 58-69). Le composant `RotatingCard` (exigé par CLAUDE.md §7 pour toutes les listes métier) n'est **pas utilisé** ici.
- **Conséquence** : non-conformité avec la règle « un seul composant de carte retournable » ; style, rotation et comportement clavier/tactile spécifiques à ce module, non partagés avec les autres modules qui utilisent `RotatingCard`.

### I2 — Suppression physique d'un projet sans contrôle des étapes et dépenses liées

- **Preuve** : `src/pages/Projects.tsx:147-158` — `handleDelete` supprime directement `from('projects').delete().eq('id', ...)` sans vérifier si des `project_steps` (via `project_id`) ou des `expenses` (via `project_id`) y font référence. Pas de `deleted_at` (suppression physique, pas soft-delete).
- **Conséquence** : suppression d'un projet référencé par des étapes ou dépenses peut laisser des orphelins, ou échouer si la base a des FK restrictives ; l'utilisateur n'est pas informé de l'impact ni proposé un choix « supprimer aussi » / « conserver détachées ».

### I3 — RBAC route limité à `action="read"` (pas de `write`/`delete`)

- **Preuve** : `src/routes/AppRoutes.tsx:297` — `<RequireModule module="projects" action="read">` uniquement.
- **Conséquence** : l'autorisation d'écriture/suppression n'est pas vérifiée au niveau de la route ; les boutons Modifier/Supprimer sont toujours rendus (CLIENTSIDÉ : `:437-487`). Un rôle sans `projects:write`/`projects:delete` peut tenter les actions qui échoueraient côté base si RLS bloque, mais l'UX n'empêche pas la tentative.

### I4 — Champ `type` en input texte libre sans contrainte d'enum

- **Preuve** : `src/pages/Projects.tsx:524-526` — `<FormInput>` texte pour `type`, valeur par défaut `'infrastructure'`. `PROJECT_STATUSES` existe (`constants.ts:81-88`) mais n'est pas utilisé pour `type` (ni enum TS, ni CHECK SQL confirmé).
- **Conséquence** : une valeur arbitraire peut être saisie pour `type` ; pas de cohérence garantie entre UI et données (contrairement à `status` qui utilise `PROJECT_STATUSES` en select).

---

## 🟡 Améliorations

### A1 — Couleurs en dur et variables CSS non-design-system dans les KPIs et cartes

- **Preuve** : `src/pages/Projects.tsx:209` (`style={{ color: 'var(--color-ivory)' }}`), `:222` (`borderLeftColor: 'var(--mdn-grass)'`), `:237` (`--mdn-terre'`), `:250` (`--mdn-sky'`), `:264` (`--mdn-slate'`), `:350` (`background: 'var(--accent-soft)'`), `:445-446` (`--info-soft`, `--info`).
- **Conséquence** : non-conformité avec la palette de référence BAHKANSO (`#2D5016`, `#4A7C2E`, etc. — CLAUDE.md §7) et du design-system (`STATUS_CLASS_*`). Duplication de styles par rapport aux autres modules.

### A2 — `revised_budget` absent du schéma Zod mais présent dans le payload

- **Preuve** : `src/pages/Projects.tsx:22-32` (schéma sans `revised_budget`) vs `:101` (`revised_budget: values.initial_budget` envoyé à l'insertion).
- **Conséquence** : le champ stocké `revised_budget` est initialisé à la valeur de `initial_budget` sans validation ni possibilité d'édition dans le formulaire ; incohérence potentielle si le budget est révisé ailleurs.

### A3 — `ProgressBar color="green"` en dur

- **Preuve** : `src/pages/Projects.tsx:367` — `<ProgressBar value={p.progress} color="green" />`.
- **Conséquence** : couleur en dur non alignée sur les tokens du design-system.

---

## ⚪ Décisions métier

### D1 — Comportement à la suppression d'un projet référencé

- **Décision nécessaire** : confirmer si la suppression d'un projet doit être bloquée s'il a des étapes ou dépenses liées, ou proposer « supprimer aussi les étapes/dépenses » / « conserver détachées ». Documenter le comportement choisi (CLAUDE.md §10 cascades).

### D2 — Valeurs canoniques du champ `type` de projet

- `type` est un `string` libre (défaut `'infrastructure'`). **Décision nécessaire** : confirmer la liste canonique des types de projets (ex. `infrastructure`, `equipement`, `batiment`, `irrigation`) et l'appliquer via enum TS + CHECK SQL + select UI.

### D3 — Conservation / suppression physique vs soft-delete

- Le module supprime physiquement (pas de `deleted_at`). **Décision nécessaire** : confirmer si c'est le mode retenu pour le module Projets (soft-delete par `deleted_at` ou suppression physique), et aligner les lecteurs (`deleted_at IS NULL`) le cas échéant.

---

## 🧪 Couverture de test

- Aucun test unitaire ni d'intégration pour le module Projets/Chantiers.
- Les tests Dashboard couvrent partiellement les KPIs globaux mais pas les flux projet.

---

## 🔗 Liens avec autres modules

| Module cible | Lien depuis les projets | Statut |
|-------------|----------------------|--------|
| Finance (dépenses) | `expenses.project_id` → calcul total dépensé par projet | ✅ présent (lecture) |
| Finance (financements) | `projects.funding_id` → lien vers un financement | ✅ présent (lecture, pas d'UI d'édition) |
| Configuration (sites) | `projects.site_id` | ✅ présent (colonne, pas de select UI) |
| Stocks | pas de lien explicite | ❌ absent |
| Élevage | pas de lien explicite | ❌ absent |
| Surveillance | règle alerte « projet en retard » lit `projects` (Audit Surveillance) | ✅ présent (lecture inter-module) |
| Dashboard | KPIs via `projects` source (dans `DASHBOARD_SOURCES`) | ✅ présent (KPI) |

---

## 🎯 Plan de correction (3 vagues)

### Vague 1 — Correction critique (immédiat)

— Aucun écart critique.

### Vague 2 — Robustesse et cohérence (important)

1. Remplacer le flip-card maison par le composant `RotatingCard` partagé (conforme CLAUDE.md §7) — corrige I1.
2. Ajouter un contrôle avant suppression : bloquer ou avertir si des étapes/dépenses sont liées au projet (I2).
3. Étendre `RequireModule` à `action="write"` et `action="delete"` sur la route, ou masquer les boutons d'écriture selon les permissions — corrige I3.
4. Remplacer l'input texte libre `type` par un select sur les valeurs canoniques (enum + CHECK SQL) — corrige I4.

### Vague 3 — UX et qualité (amélioration)

5. Remplacer les couleurs en dur / variables CSS non-design-system par les tokens et constantes du design-system — corrige A1/A3.
6. Ajouter `revised_budget` au schéma Zod et au formulaire, ou le supprimer du payload si non utilisé — corrige A2.
7. Ajouter des tests unitaires dédiés (validation Zod, logAudit, suppression, calcul dépenses liées) — amélioration.
8. Documenter le comportement de suppression (D1), les valeurs canoniques de `type` (D2) et le mode soft-delete vs physique (D3).

---

## 📝 Annexe — Preuves techniques

Extrait absence de `RotatingCard` + flip-card maison (`Projects.tsx:58-69`, `:310-356`) :
```ts
const [flippedProjects, setFlippedProjects] = useState<Set<string>>(() => new Set());
// ...
style={{
  transformStyle: 'preserve-3d',
  transition: 'transform 650ms cubic-bezier(.2,.75,.25,1)',
  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
}}
```
Le composant `RotatingCard` n'est **pas importé** dans ce fichier (contrairement aux autres modules liste-métier).

Extrait suppression physique sans contrôle (`Projects.tsx:147-158`) :
```ts
const { error } = await supabase.from('projects').delete().eq('id', confirmDelete.id);
// pas de vérification des project_steps / expenses liées
```

Extrait RBAC `read` uniquement (`AppRoutes.tsx:295-301`) :
```tsx
{
  path: 'projects',
  element: (
    <RequireModule module="projects" action="read">
      <ProjectsSuspense />
    </RequireModule>
  ),
},
```

Extrait registre DataContext (`DataContext.tsx:59`) :
```ts
projets: ['projects', 'projectSteps', 'expenses'],
```

Extrait `PROJECT_STATUSES` / `PROJECT_STATUS_COLORS` (`constants.ts:81-97`) :
```ts
export const PROJECT_STATUSES = ['planifié','en préparation','en cours','en retard','terminé','suspendu'] as const;
export const PROJECT_STATUS_COLORS: Record<string, string> = {
  planifié: STATUS_CLASS_NEUTRAL,
  'en préparation': STATUS_CLASS_INFO,
  'en cours': STATUS_CLASS_SUCCESS,
  'en retard': STATUS_CLASS_DANGER,
  terminé: STATUS_CLASS_SUCCESS,
  suspendu: STATUS_CLASS_WARNING,
};
```

---

**Fichiers modifiés : aucun** (audit en lecture seule, aucun commit).

**Prochaine étape : ** écrire l'audit du module Configuration (docs/audits/2026-11-14-audit-module-configuration.md).
