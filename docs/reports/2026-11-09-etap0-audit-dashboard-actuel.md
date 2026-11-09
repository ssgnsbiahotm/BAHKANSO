# ÉTAPE 0 — Audit du tableau de bord actuel (BAHKANSO)

## Mission
Réaliser un audit de la réalité métier du tableau de bord actuel avant toute implémentation du Dashboard v2. Lecture seule, aucune modification de code.

## Objectif
Documenter l'état actuel du tableau de bord (fichiers, hooks, DataContext, schéma event_journal, sélecteur site header, stack UI, compteur cloche) pour servir de base de comparaison au Dashboard v2 (contexte global unique, 4 KPIs héros, états de donnée explicites, source event_journal).

## Environnement
- Host : local (machine de développement)
- Dépôt : /home/souleymane/BAHKANSO
- Branche : main
- Commit HEAD : ec11e14 (fix(types): erreurs TypeScript DataContext et TreasuryTab)
- Stack : React 18, TypeScript 5.6.3, Vite, Vitest, Tailwind CSS, Supabase JS, React Router 7, zod, lucide-react

## Fichiers audités

| Fichier | Rôle dans le tableau de bord actuel |
|---------|-------------------------------------|
| `src/pages/Dashboard.tsx` | Page du tableau de bord (route `/app` et `/app/dashboard`) |
| `src/hooks/useDashboardStats.ts` | Hook de calcul des stats/dashboard (KPIs, périodes, tendances, priorités) |
| `src/lib/DataContext.tsx` | Contexte de données global, 27 sources Supabase, `loadModule()` |
| `src/lib/SiteContext.tsx` | Contexte de site (currentSiteId, isGlobalView, SiteSelector) |
| `src/components/layout/Header.tsx` | En-tête avec nom ferme, SiteSelector, compteur cloche alertes |
| `src/components/ui/KpiCard.tsx` | Carte KPI réutilisable (label, value, icon, trend, tone, color) |
| `src/lib/kpi.ts` | 7 fonctions KPI asynchrones (rendement, avancement, marge, coût, mortalité, GMQ, marge campagne) |
| `src/pages/Dashboard.test.tsx` | 7 tests unitaires du tableau de bord |

## 1. Tableau de bord actuel — `src/pages/Dashboard.tsx`

### Structure
La page `Dashboard` rend un ensemble de sections dans une grille (`dashboard-grid`) :

- **Hero panorama** : image de couverture (`siteContent['hero-cover']` ou premier média cover/image), titre et sous-titre depuis `siteContent`, lien vers Médias si aucune couverture.
- **A. Synthèse financière** : 3 KPIs (flux net, résultat net, marge brute) conditionnés par `showFinance` (rôle admin/propriétaire/responsable/gestionnaire), bouton d'aide "Comprendre les chiffres" avec ARIA.
- **B. Rendement de campagne** : sélecteur de campagne (`campaigns` depuis Supabase), KPI rendement kg/ha via `calculateYield(campaignId)`.
- **Bis. Avancement du chantier** : sélecteur de chantier (projets), KPI avancement % via `calculateProjectProgress(projectId)`.
- **Bis2. KPIs finance** : sélecteur de ferme, marge brute et coût de revient via `calculateGrossMargin(farmId)` / `calculateCostPerUnit(farmId)`.
- **Bis3. KPIs élevage** : sélecteur de ferme, taux de mortalité et GMQ via `calculateMortalityRate(farmId)` / `calculateAverageDailyGain(farmId)`.
- **Bis4. Marge de campagne** : sélecteur de campagne, marge via `calculateCampaignMargin(campaignId)`.
- **C. Priorités et actions** : 4 cartes de priorité (justificatifs manquants, stock seuil, échéance projet, alertes critiques) avec états de chargement/erreur/vide.
- **C. La ferme en bref** : 3 cartes d'activité (Agriculture, Élevage, Projets) avec liens vers les modules.
- **D. Dernières opérations** : 3 dernières transactions avec lien vers Finances.

### Sélecteurs locaux (problème identifié)
Le dashboard actuel comporte **5 sélecteurs locaux indépendants**, tous vides par défaut :
1. Sélecteur de campagne (rendement)
2. Sélecteur de chantier (avancement)
3. Sélecteur de ferme (KPIs finance) — utilisé aussi pour Bis3 (élevage)
4. (fermId partagé entre Bis2 et Bis3)
5. Sélecteur de campagne (marge de campagne)

Ces sélecteurs ne sont pas reliés à un contexte global unique : chaque changement déclenche un recalcul KPI indépendant via `supabase` directement (hors DataContext).

### Appel DataContext
- Ligne 213 : `const { media, siteContent, sourceStatus, loadModule } = useData();`
- Ligne 258-260 : `useEffect(() => { loadModule('dashboard'); }, [loadModule]);`
- La ligne 259 appelle `loadModule('dashboard')` qui charge les 8 sources du module dashboard (transactions, expenses, inventoryItems, projects, alerts, animals, animalLots, campaigns).

### États gérés
- `loading` (DataContext) → écran "Chargement du tableau de bord…"
- `error` (useDashboardStats) → message d'erreur partiel
- `sourceStatus` / `sourceError` pour les états de disponibilité par source (transactions, expenses, inventoryItems, projects, alerts, animals, animalLots, campaigns)
- `prioritySourcesPending` / `prioritySourcesError` pour l'affichage conditionnel des priorités

### Problèmes constatés
- Aucun état explicite "aucune donnée" vs "source indisponible" harmonisé : chaque section gère son propre cas vide.
- Les KPIs finance/élevage appellent `calculate*` directement sur Supabase (hors DataContext), avec leurs propres sélecteurs et états de chargement locaux.
- Les sélecteurs de ferme/campagne/chantier sont locaux à la page, non partagés avec le Header (SiteSelector).

## 2. useDashboardStats — `src/hooks/useDashboardStats.ts`

### Données lues depuis DataContext
`animals, animalLots, campaigns, projects, expenses, transactions, inventoryItems, alerts, loading, error, sourceStatus, sourceError, loadModule`.

### Calculs effectués
- `netTreasury` : entrées − sorties sur toutes les transactions
- `periodNetResult` : revenus − dépenses de la période courante (mois en cours)
- `grossMargin` : (entrées − sorties) / entrées × 100
- `periodLabel` : libellé de la période (ex. "octobre 2026")
- `totalAnimals`, `totalAnimalLots`, `activeCampaigns` (statut 'actif'), `activeProjects` (statut 'en cours')
- `expensesWithoutJustificatif`, `lowStockItems`, `overdueProjects`, `openAlerts`, `openCriticalAlerts`
- `latestTransactions` (5 dernières triées par date)
- `movementData` : 6 derniers mois (entrées, sorties, net)
- `expenseByCategory` : dépenses par catégorie sur la période
- `treasuryTrend`, `periodResultTrend`, `incomeTrend`, `expenseTrend`

### États de source
- `transactionsAvailable`, `expensesAvailable`, `inventoryAvailable`, `projectsAvailable`, `alertsAvailable`, `animalsAvailable`, `animalLotsAvailable`, `campaignsAvailable`
- `prioritySourcesPending` : true si une source parmi expenses/inventoryItems/projects/alerts est 'loading' ou 'idle'
- `allSourcesResolved` : true si toutes les 8 sources sont 'success'

### Effet de bord
- Ligne 59-61 : `useEffect(() => { loadModule('dashboard'); }, [loadModule]);` — charge les sources du module dashboard au montage.

## 3. DataContext — `src/lib/DataContext.tsx`

### Sources globales (toujours chargées au mount)
`farm, users, funders, customers, siteContent, media, notifications, alerts`.

### Sources par module (MODULE_SOURCES)
- `dashboard` : transactions, expenses, inventoryItems, projects, alerts, animals, animalLots, campaigns
- `exploitation` : plots, sites, campaigns, cropOperations, harvests
- `finance` : suppliers, documents, fundings, bankAccounts, cashAccounts
- `elevage` : animals, animalLots, animalEvents
- `ventes` : customers

### `loadModule(moduleName)`
Charge `GLOBAL_SOURCES + MODULE_SOURCES[moduleName]`, filtre celles déjà chargées (`loadedModules`), met à jour `sourceStatus`/`sourceError` par source, applique les données, puis marque le module comme chargé.

### Gestion d'erreur
- Ligne 406 : garde-fou sur `res.error` (objet simple, pas `instanceof Error`) — correctif déjà appliqué (vérifié équivalent sur 9 cas).
- Une source en erreur conserve les dernières données valides et marque la source 'error'.

### Règle de source non chargée
Une source non chargée retourne un tableau vide sans erreur. Ne jamais afficher "Aucune donnée" ni KPIs à 0 tant que les sources ne sont pas chargées.

## 4. Schéma event_journal — `supabase/migrations/20261105000000_create_event_journal.sql`

### Table
```
event_journal (
  id uuid PK DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  actor_id uuid REFERENCES app_users(id),
  amount numeric(14,2),
  quantity numeric(14,3),
  unit text,
  currency text NOT NULL DEFAULT 'XOF',
  source_module text NOT NULL CHECK (source_module IN ('culture','elevage','chantier','finance')),
  context jsonb NOT NULL DEFAULT '{}',
  reverses_event_id uuid REFERENCES event_journal(id),
  created_at timestamptz NOT NULL DEFAULT now()
)
```

### Index
- `event_journal_farm_date` (farm_id, occurred_at DESC)
- `event_journal_type` (farm_id, event_type, occurred_at DESC)
- `event_journal_entity` (entity_type, entity_id)

### Sécurité
- `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY`
- Politique SELECT : rôles autorisés (`proprietaire, administrateur, gestionnaire, comptable, auditeur, chef_chantier, responsable_agricole, responsable_elevage`) + `farm_id = current_user_site_id()`
- Aucune politique INSERT pour authenticated (écriture uniquement via triggers SECURITY DEFINER)
- `REVOKE UPDATE, DELETE` (immutabilité)
- Garde-fou DO $$ vérifiant `relforcerowsecurity`

### Trigger log_event() — migrations 000 à 003
Fonction `SECURITY DEFINER` + `SET row_security = off`, alimentée par des triggers AFTER INSERT/UPDATE sur :
- `expenses` → `event_type='depense'`, `source_module='finance'`, farm_id via `sites.site_id` (ou `NEW.farm_id` via migration 000008)
- `harvests` → `event_type='recolte'`, `source_module='culture'`
- `sales` → `event_type='recette'`, `source_module='finance'`
- `animal_events` → `event_type=NEW.type`, `source_module='elevage'`, farm_id via `animals.site_id`
- `project_steps` → `event_type='etape_terminee'`, `source_module='chantiers'` (bloqué : pas de lien projet→ferme, `v_farm_id := NULL`)

### Migration 20261108000000 — correction gap expenses
Ajoute `farm_id` à `expenses`, `log_event()` utilise `NEW.farm_id` en priorité puis fallback via `sites`.

### Migration 20261108000001 — farm_id sur tables cœur
Ajoute `farm_id` (et `site_id` pour campaigns) à `campaigns, harvests, sales, crop_operations` avec backfill depuis `sites`.

## 5. Header — `src/components/layout/Header.tsx`

### Composants affichés
- Nom de la ferme (`farm?.name`) ou `siteContent.branding.value.appName` par défaut ('Bahkanso')
- Localisation (`farm?.location`)
- Indicateur "Synchronisé" (statique)
- `SiteSelector` (sélecteur de site, visible md+)
- Cloche notifications avec compteur `openAlerts`

### Compteur cloche
- Ligne 24 : `const openAlerts = useMemo(() => alerts.filter(a => a.status === 'ouverte'), [alerts]);`
- Ligne 68-72 : badge `bg-terra` affichant `openAlerts.length` si > 0
- Ligne 80-82 : bouton "Voir les {openAlerts.length} alertes" naviguant vers `/app/surveillance?tab=alertes`
- Les notifications utilisent `timeAgo(n.created_at)` pour l'affichage relatif

### Problème constaté
Le compteur cloche dépend de `alerts` (source globale DataContext), pas de `event_journal`. Les alertes sont une source séparée de `event_journal`.

## 6. Stack UI — composants utilisés

| Composant | Chemin | Rôle |
|-----------|--------|------|
| `KpiCard` | `src/components/ui/KpiCard.tsx` | Carte KPI rotative (bg-surface), props label/value/icon/trend/tone/color/subtitle |
| `RotatingCard` | `src/components/ui/RotatingCard.tsx` | Carte retournable (recto/verso) utilisée pour les listes métier |
| `SiteSelector` | `src/components/ui/SiteSelector.tsx` | Sélecteur de site dans le Header |
| `EmptyState` | `src/components/ui/EmptyState.tsx` | État vide avec icône, titre, message, action |
| `PageSkeleton` | `src/components/ui/PageSkeleton.tsx` | Squelette de chargement (Suspense) |
| `OptimizedImage` | `src/components/ui/OptimizedImage.tsx` | Image optimisée pour le hero panorama |

### Règle RotatingCard (CLAUDE.md §7)
Un seul composant de carte retournable pour toutes les listes métier. Jamais de seconde implémentation. Style, rotation et boutons identiques dans tous les modules.

## 7. kpi.ts — `src/lib/kpi.ts`

7 fonctions KPI asynchrones interrogeant `event_journal` / `harvests` / `crop_operations` / `projects` / `animals` :
- `calculateYield(campaignId)` : rendement kg/ha
- `calculateProjectProgress(projectId)` : avancement %
- `calculateGrossMargin(farmId)` : marge brute XOF
- `calculateCostPerUnit(farmId)` : coût de revient unitaire
- `calculateMortalityRate(farmId)` : taux de mortalité %
- `calculateAverageDailyGain(farmId)` : GMQ kg/jour
- `calculateCampaignMargin(campaignId)` : marge de campagne XOF

## 8. Tests

- `src/pages/Dashboard.test.tsx` : 7 tests (bouton d'aide ARIA, restrictions financières, état vide, priorités indisponibles, période, chargement, etc.)
- `src/hooks/useDashboardStats.test.ts` : 9 tests (8 sources disponibles, liste vide vs erreur, faux zéro, erreur partielle, état vide, résultat net/marge, libellé période, sources en attente, alertes critiques)
- `src/components/ui/KpiCard.test.tsx` : 7 tests

## État de référence (avant modification Dashboard v2)
- `npm run typecheck` : exit 0
- `npm run build` : exit 0 (référence)
- `npm run lint` : exit 0, 24 warnings préexistants
- `npx vitest run src/` : **87 tests / 17 fichiers, tous verts** (après correction des mocks `loadModule`)

## Corrections déjà appliquées (cette session)
- `src/test/setup.tsx` : ajouté `loadModule: vi.fn()`, `sourceStatus: {}`, `sourceError: {}`, et les tableaux de données manquants au mock DataContext global
- `src/pages/Dashboard.test.tsx` : ajouté `loadModule: vi.fn()` au mock local `useData`
- `src/pages/exploitation/OperationsPage.test.tsx` : ajouté `loadModule: vi.fn()` au mock local `useData`

Résultat : les 10 tests précédemment en échec (`loadModule is not a function`) passent désormais. 87/87 verts.

## Constats pour le Dashboard v2

1. **Source de vérité** : le dashboard actuel mélange DataContext (sources chargées) et appels Supabase directs (`calculate*` dans `kpi.ts`, sélecteurs de campagne/ferme/chantier). Le Dashboard v2 doit s'appuyer sur `event_journal` comme source unique.
2. **Contexte global** : le dashboard actuel a 5 sélecteurs locaux indépendants. Le Dashboard v2 doit utiliser un contexte global unique (ferme/campagne sélectionnée une fois, partagée).
3. **États de donnée** : le dashboard actuel gère `loading`/`error`/`sourceStatus` de manière dispersée. Le Dashboard v2 doit expliciter : chargement, absence de donnée, absence après filtre, erreur de chargement.
4. **Sélecteur site** : le Header a déjà un `SiteSelector` et `currentSiteId` via SiteContext. Le Dashboard v2 doit réutiliser ce sélecteur existant, pas en créer un nouveau.
5. **Compteur cloche** : basé sur `alerts` (status 'ouverte'), pas sur `event_journal`. À préserver tel quel (pas de modification du Header demandée).

## Analyses
- Le tableau de bord actuel est fonctionnel mais fragmenté : sélecteurs locaux non reliés, KPIs calculés hors DataContext, états de donnée non harmonisés.
- `event_journal` est bien la source de vérité pour les écritures (expenses, harvests, sales, animal_events), mais les KPIs du dashboard actuel ne l'utilisent pas encore (ils lisent les tables sources directement).
- Le lien projet → ferme manque encore dans le schéma (project_steps bloqué dans `log_event()`), ce qui limite l'utilisation de `event_journal` pour les KPIs chantier.

## Prochaine étape (Bloc 1)
Créer `docs/kpi-definitions.md` définissant les 4 KPIs héros du Dashboard v2 avec leurs formules, sources (event_journal), et règles d'arrondi/formatage (FCFA, dates françaises).

---

Rapport écrit : `docs/reports/2026-11-09-etap0-audit-dashboard-actuel.md`

## Vérifications
- `npm run typecheck` : exit 0 (confirmé)
- `npx vitest run src/` : 87/87 tests verts (confirmé)
- Aucune modification de schéma, de migration, ou d'écriture en base (conforme aux règles non négociables)
