# Audit module Dashboard — 2026-11-14

## 📊 Résumé exécutif

Le module Dashboard comporte deux implémentations :

- **Dashboard v1** (`src/pages/Dashboard.tsx`) — active par défaut, route `/app/dashboard` (et `/app` index). KPIs de synthèse exploitation (marge brute, coût de revient unitaire, rendement, alertes critiques), priorités (justificatifs manquants, stock sous seuil, projets en retard, alertes critiques), activités (agriculture/élevage/projets), dernières opérations. Utilise `useDashboardStats()` qui calcule les indicateurs depuis les sources DataContext (`transactions`, `expenses`, `inventoryItems`, `projects`, `alerts`, `animals`, `animalLots`, `campaigns`).
- **Dashboard v2** (`src/pages/DashboardV2.tsx`) — derrière le flag `localStorage bahkanso.dashboard_v2 === 'true'`, route `/app/dashboard-v2`. KPIs héros (résultat net, marge brute, rendement, alertes ouvertes), tendance 6 mois, liste d'actions. Utilise `useDashboardData()` et `event_journal` via `clientDataSource`.

Les deux déclarent `loadModule('dashboard')`. Le tableau de bord est la page d'accueil de l'application (`/`), protégée par `RequireAuth` sur `/app` et `RequireModule` sur les routes enfants.

**Écarts : 🔴 0 critique, 🟠 4 importants, 🟡 4 améliorations, ⚪ 3 décisions métier.**

---

## ✅ Ce qui fonctionne bien

| Élément | Preuve |
|---------|--------|
| `RequireAuth` sur `/app` + `RequireModule` sur les routes enfants | `src/routes/AppRoutes.tsx:113-130` |
| `loadModule('dashboard')` déclaré | `Dashboard.tsx:241-243`, `DashboardV2.tsx:29-31` |
| Sources `dashboard` dans le registre (`DASHBOARD_SOURCES`) | `src/lib/DataContext.tsx:25-30` |
| `useDashboardStats()` calcule marge brute, trésorerie, priorités, dernières opérations | `src/hooks/useDashboardStats.ts:41-243` |
| États de chargement / erreur gérés (`loading`, `error`, `sourceStatus`) | `Dashboard.tsx:223-225`, `:452-459`, `:562-571` |
| Sélecteur de site global (filtre campagnes/projets/lots/animaux) | `Dashboard.tsx:233-260` |
| Accès financier conditionné par rôle (`isFinanceSensitive`) | `Dashboard.tsx:210`, `:229`, `:603-624` |
| `useEffect` avec drapeau `mounted` pour les KPIs calculés (évite setState après unmount) | `Dashboard.tsx:317-434` |
| `formatCurrency` / `formatDate` pour formatage FCFA / date française | `Dashboard.tsx:820-821` |
| Dashboard.test.tsx existe | `src/pages/Dashboard.test.tsx` |

---

## 🗺️ Inventaire

### Écrans

| Écran | Fichier | Route | RBAC | Actions |
|-------|---------|-------|------|---------|
| Dashboard v1 (défaut) | `src/pages/Dashboard.tsx` | `/app`, `/app/dashboard` | `RequireAuth` + module dashboard | lecture KPIs, priorités, activités, opérations |
| Dashboard v2 (flag) | `src/pages/DashboardV2.tsx` | `/app/dashboard-v2` | `RequireAuth` + module dashboard | lecture KPIs héros, tendance, actions |

### Données

| Source | Registre DataContext | Utilisée par |
|--------|---------------------|--------------|
| `transactions` | `dashboard` (DASHBOARD_SOURCES) | trésorerie, dernières opérations |
| `expenses` | `dashboard` | marge brute, justificatifs manquants, dépenses par catégorie |
| `inventoryItems` | `dashboard` | stock sous seuil |
| `projects` | `dashboard` | projets en retard, chantiers en cours |
| `alerts` | `dashboard` / GLOBAL_SOURCES | alertes critiques ouvertes |
| `animals`, `animalLots` | `dashboard` | cheptel (activité élevage) |
| `campaigns` | `dashboard` | campagnes actives, rendement |
| `farm`, `siteContent`, `media` | global | hero image, nom ferme, branding |

### Hooks et helpers utilisés

| Élément | Fichier | Rôle |
|---------|---------|------|
| `useDashboardStats()` | `src/hooks/useDashboardStats.ts` | calcul KPIs v1 |
| `useDashboardData()` | `src/hooks/useDashboardData.ts` | calcul KPIs v2 (event_journal) |
| `useData()` | `src/lib/DataContext` | lit sources dashboard, `loadModule`, `sourceStatus` |
| `useAuth()` | `src/lib/AuthContext` | `appUser` pour le filtrage financier |
| `useSite()` / `SiteContext` | `src/lib/SiteContext` | sélecteur de site |
| `calculateYield`, `calculateProjectProgress`, `calculateCostPerUnit`, `calculateMortalityRate`, `calculateAverageDailyGain`, `calculateCampaignMargin` | `src/lib/kpi.ts` | KPIs calculés v1 |
| `formatCurrency`, `formatDate`, `parsePeriod` | `src/lib/format` | formatage |

### Tests

| Test | Fichier | Couvre le dashboard ? |
|------|---------|----------------------|
| Dashboard.test.tsx | `src/pages/Dashboard.test.tsx` | oui (v1) |

---

## 🔗 Matrice de cohérence (champs critiques)

| Champ | UI | Calcul | SQL CHECK | Statut |
|-------|----|--------|-----------|--------|
| `grossMargin` | `Dashboard.tsx:605` | `useDashboardStats.ts:82` | — | ✅ calculé |
| `openCriticalAlerts` | `Dashboard.tsx:652` | `useDashboardStats.ts:139-141` | — | ✅ calculé |
| `overdueProjects` | `Dashboard.tsx:495` | `useDashboardStats.ts:135-137` | — | ✅ calculé |
| `expensesWithoutJustificatif` | `Dashboard.tsx:480` | `useDashboardStats.ts:132` | — | ✅ calculé |
| `lowStockItems` | `Dashboard.tsx:488` | `useDashboardStats.ts:133` | — | ✅ calculé |
| `kpiNetResult` / `kpiGrossMargin` (v2) | `DashboardV2.tsx:107-121` | `useDashboardData` (event_journal) | — | — |
| `status` sur KpiCard v2 | `DashboardV2.tsx` | `STATUS_CLASS_*` | — | — |

---

## 🔴 Écarts critiques (preuves)

— Aucun écart critique.

---

## 🟠 Écarts importants (preuves)

### D1 — `isFinanceSensitive` liste en dur les rôles autorisés (pas `hasPermission`)

- **Preuve** : `src/pages/Dashboard.tsx:210-211` — `isFinanceSensitive` refuse l'accès aux données financières sauf pour un jeu en dur de rôles (`administrateur`, `proprietaire`/`propriétaire`, `responsable`, `responsable agricole`, `responsable élevage`, `gestionnaire`).
- **Conséquence** : pas d'utilisation du modèle RBAC centralisé (`hasPermission(role, 'finance', 'read')`). Si un nouveau rôle est ajouté ou qu'un rôle existant doit voir les finances, il faut modifier le code. Incohérent avec les autres modules qui utilisent `RequireModule` + `hasPermission`.

### D2 — `has_justificatif` sur `expenses` non documenté dans le schéma/types

- **Preuve** : `src/hooks/useDashboardStats.ts:132` — `expenses.filter((e) => !e.has_justificatif)`. La colonne `has_justificatif` n'est pas confirmée présente dans `types.ts` ni dans les migrations lues.
- **Conséquence** : si la colonne n'existe pas, le filtrage retourne `undefined` pour tous les éléments (compteur à 0) et l'alerte « Justificatifs manquants » est silencieusement fausse. À vérifier contre le schéma réel.

### D3 — `useDashboardStats` déclare `prioritySourcesPending` mais ne l'expose pas

- **Preuve** : `src/hooks/useDashboardStats.ts:166-171` — `prioritySourcesPending` est calculé dans le `useMemo` mais **n'est pas inclus dans l'objet retourné** (ligne 183-226).
- **Conséquence** : le Dashboard v1 recalcule `prioritySourcesPending` et `prioritySourcesError` en local (lignes 462-474) au lieu de s'appuyer sur le hook. Duplication de logique et risque de divergence.

### D4 — `useDashboardData` (v2) s'appuie sur `event_journal` sans fallback si la table est absente

- **Preuve** : `src/pages/DashboardV2.tsx:23` — `useDashboardData()` lit les KPIs via `clientDataSource` sur `event_journal`. Aucune gestion de dégradation si la table `event_journal` n'existe pas ou est vide.
- **Conséquence** : si `event_journal` est absente, les KPIs v2 restent à zéro ou en erreur sans message clair. Le flag `dashboard_v2` peut activer un tableau de bord non fonctionnel.

---

## 🟡 Améliorations

### A1 — Pas de `RotatingCard` sur le Dashboard (justifié, mais cartes locales non partagées)

- **Preuve** : `Dashboard.tsx` définit `LocalKpiCard`, `PriorityCard`, `ActivityCard` en local ; n'importe pas `RotatingCard` ni `KpiCard` partagé.
- **Conséquence** : conforme à CLAUDE.md §7 (le dashboard n'est pas une liste métier), mais duplication de composants carte par rapport à `KpiCard` et `StatusBadge` partagés.

### A2 — `LocalKpiCard` utilise des classes CSS locales (`dashboard-kpi-*`) au lieu des tokens design-system

- **Preuve** : `Dashboard.tsx:79-98` — `LocalKpiCard` repose sur `dashboard-kpi-card`, `dashboard-kpi-header`, `dashboard-kpi-value`, etc. définies dans `src/styles/components.css`.
- **Conséquence** : styles du dashboard non alignés sur `STATUS_CLASS_*` et les tokens de palette (`#2D5016`, `#4A7C2E`, etc.).

### A3 — `DashboardV2` utilise `color` / `status` sans mapping explicite vers `STATUS_CLASS_*`

- **Preuve** : `DashboardV2.tsx:107-138` — `DashboardKpiCard` reçoit `status` (ex. `crit`, `warn`, `ok`) mais le mapping vers les classes de couleur n'est pas visible dans la page.
- **Conséquence** : risque d'incohérence visuelle entre v1 et v2 si le composant `DashboardKpiCard` interprète `status` différemment.

### A4 — Couverture de test uniquement sur v1, rien sur v2

- **Preuve** : `src/pages/Dashboard.test.tsx` existe ; aucun test pour `DashboardV2.tsx` ni `useDashboardData`.
- **Conséquence** : pas de validation des KPIs v2, du flag `dashboard_v2`, ni de la bascule entre les deux implémentations.

---

## ⚪ Décisions métier

### D1 — Coexistence v1 (par défaut) et v2 (derrière flag localStorage)

- Le flag `bahkanso.dashboard_v2` bascule l'implémentation. **Décision nécessaire** : confirmer si v2 est destinée à remplacer v1, et si le flag doit être retiré une fois v2 stabilisée.

### D2 — `isFinanceSensitive` — rôles autorisés à voir les données financières

- La liste des rôles est codée en dur. **Décision nécessaire** : confirmer la liste canonique des rôles autorisés et la faire passer par `hasPermission` (CLAUDE.md §11).

### D3 — Source de vérité des KPIs : transactions (v1) vs event_journal (v2)

- v1 calcule depuis `transactions`/`expenses` ; v2 depuis `event_journal`. **Décision nécessaire** : confirmer quelle source fait foi pour le calcul de la marge brute et du résultat net, afin d'éviter deux chiffres différents selon le dashboard affiché.

---

## 🧪 Couverture de test

- `src/pages/Dashboard.test.tsx` : couvre le Dashboard v1 (KPIs, calculs, rendu).
- Aucun test pour `DashboardV2.tsx`, `useDashboardData`, ni `useDashboardStats` isolément.
- Les tests couvrent partiellement les KPIs globaux mais pas les flux de priorités, le sélecteur de site, ni le filtrage financier par rôle.

---

## 🔗 Liens avec autres modules

| Module cible | Lien depuis le dashboard | Statut |
|-------------|------------------------|--------|
| Finance | `transactions`, `expenses` → marge brute, trésorerie, justificatifs manquants | ✅ présent (lecture) |
| Stocks | `inventoryItems` → stock sous seuil | ✅ présent (lecture) |
| Projets/Chantiers | `projects` → projets en retard, chantiers en cours | ✅ présent (lecture) |
| Surveillance | `alerts` → alertes critiques ouvertes | ✅ présent (lecture) |
| Élevage | `animals`, `animalLots` → cheptel | ✅ présent (lecture) |
| Exploitation | `campaigns` → campagnes actives, rendement | ✅ présent (lecture) |
| Configuration | `farm`, `siteContent`, `media` → hero, nom ferme | ✅ présent (lecture) |

---

## 🎯 Plan de correction (3 vagues)

### Vague 1 — Correction critique (immédiat)

— Aucun écart critique.

### Vague 2 — Robustesse et cohérence (important)

1. Remplacer `isFinanceSensitive` par `hasPermission(role, 'finance', 'read')` — corrige D1.
2. Vérifier que `has_justificatif` existe sur `expenses` (types + migrations) ; sinon ajouter la colonne ou ajuster le filtrage — corrige D2.
3. Exposer `prioritySourcesPending` depuis `useDashboardStats` et l'utiliser dans le Dashboard v1 — corrige D3.
4. Ajouter une gestion de dégradation si `event_journal` est absente/vide dans `useDashboardData` (v2) — corrige D4.

### Vague 3 — UX et qualité (amélioration)

5. Remplacer `LocalKpiCard`/`PriorityCard`/`ActivityCard` par les composants partagés (`KpiCard`, `StatusBadge`) ou documenter le choix — corrige A1/A2.
6. Aligner le mapping `status` → `STATUS_CLASS_*` entre v1 et v2 — corrige A3.
7. Ajouter des tests pour `DashboardV2`, `useDashboardData`, `useDashboardStats` — corrige A4.
8. Documenter la coexistence v1/v2 et la liste des rôles financiers (D1/D2/D3).

---

## 📝 Annexe — Preuves techniques

Extrait `isFinanceSensitive` (`Dashboard.tsx:210-211`) :
```ts
const isFinanceSensitive = (role: string | null | undefined) =>
  role !== 'administrateur' && role !== 'proprietaire' && role !== 'propriétaire' && role !== 'responsable' && role !== 'responsable agricole' && role !== 'responsable élevage' && role !== 'gestionnaire';
```

Extrait `has_justificatif` (`useDashboardStats.ts:132`) :
```ts
const expensesWithoutJustificatif = expenses.filter((e) => !e.has_justificatif).length;
```

Extrait `prioritySourcesPending` non exposé (`useDashboardStats.ts:166-171`) :
```ts
const prioritySourcesPending = [
  sourceStatus?.expenses,
  sourceStatus?.inventoryItems,
  sourceStatus?.projects,
  sourceStatus?.alerts,
].some((status) => status === 'loading' || status === 'idle');
// ... non inclus dans l'objet retourné
```

Extrait routes (`AppRoutes.tsx:113-130`) :
```tsx
{
  path: '/app',
  element: (
    <RequireAuth>
      <AppLayout />
    </RequireAuth>
  ),
  children: [
    { index: true, element: <DashboardSuspense /> },
    { path: 'dashboard', element: <DashboardSuspense /> },
    // ...
```

**Fichiers modifiés : aucun** (audit en lecture seule, aucun commit).

**Prochaine étape : ** écrire l'audit du module Auth/Landing (docs/audits/2026-11-14-audit-module-auth-landing.md).
