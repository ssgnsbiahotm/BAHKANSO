# Audit de conformité CLAUDE.md §9 (loadModule)

## Mission
Audit statique de conformité à la règle §9 (DataContext `loadModule`) sur l'ensemble des pages et hooks du projet BAHKANSO, branche `feat/dashboard-v2`.

## Objective
Vérifier que chaque page lisant une source non globale du DataContext déclare un `loadModule(moduleName)` dans un `useEffect`, et classifier chaque page/hook en CONFORME / À AJOUTER / RISQUE ÉLEVÉ / HORS SCOPE.

## Environment
- Host : localhost
- Répertoire : /home/souleymane/BAHKANSO
- Branche : feat/dashboard-v2
- Dernier commit de code : 5129e0b
- Stack : React, Vite, TypeScript strict, TanStack React Query, Supabase, DataContext

## CLAUDE.md §9 — règle appliquée (verbosité)
> Le DataContext charge les données par module : un chargement par défaut, puis `loadModule(...)` à la demande (état par source : idle / loading / loaded / error). Conséquences à respecter :
> - une page ou un formulaire qui lit une source d'un autre module doit déclarer ce module (dépendances croisées) ;
> - une source non chargée renvoie un tableau vide sans erreur : ne jamais afficher « Aucune donnée » ni des KPIs à 0 tant que les sources ne sont pas chargées.

Sources globales (pas de `loadModule` requis) : `farm`, `users`, `funders`, `customers`, `siteContent`, `media`, `notifications`, `alerts`.
Sources par module (nécessitent `loadModule`) :
- `dashboard` → DASHBOARD_SOURCES
- `exploitation` → plots, sites, campaigns, cropOperations, harvests
- `finance` → suppliers, documents, fundings, bankAccounts, cashAccounts
- `elevage` → animals, animalLots, animalEvents
- `ventes` → customers

## Commands Executed
- Lecture statique de chaque fichier de `src/pages/` et de `src/hooks/` (lecture seule, aucune modification de code).
- Lecture de `src/lib/DataContext.tsx` (registre des modules et sources, lignes 48-56).
- Aucun `git add` / `commit` / `push`, aucun `vitest` / `lint` / `typecheck` n'a été exécuté (constraintes de mission).

## Complete Results — Tableau principal

| Page / Hook | Source(s) lue(s) via useData | Non-globale ? | loadModule présent ? | Verdict |
|---|---|---|---|---|
| `src/pages/Dashboard.tsx` | media, siteContent, farm (useData line 227) | Non (toutes globales) | Oui, `loadModule('dashboard')` lignes 241-243 | CONFORME |
| `src/pages/DashboardV2.tsx` | sites, alerts, farm (useData) + `event_journal` direct | Oui (sites, farm) + bypass DataContext | Non | RISQUE ÉLEVÉ |
| `src/pages/Configuration.tsx` | farm, siteContent (useData line 353) | Non (globales) | Non requis | CONFORME |
| `src/pages/Inventory.tsx` | inventoryItems, inventoryMovements, sites (line 43) | Oui | Non | À AJOUTER |
| `src/pages/Media.tsx` | media (useData line 37) | Non (globale) | Non requis | CONFORME |
| `src/pages/SettingsPage.tsx` | farm (useData line 15) | Non (globale) | Non requis | CONFORME |
| `src/pages/UsersPage.tsx` | users, sites (useData line 23) | Non (globales) | Non requis | CONFORME |
| `src/pages/Projects.tsx` | projects, projectSteps, expenses (line 49) | Oui | Non | À AJOUTER |
| `src/pages/Reports.tsx` | fundings, expenses, projects, harvests, animalLots (line 10) | Oui | Non | À AJOUTER |
| `src/pages/Suppliers.tsx` | suppliers, expenses, sites (line 45) | Oui | Non | À AJOUTER |
| `src/pages/LandingPage.tsx` | farm, siteContent (useData line 130) | Non (globales) | Non requis | CONFORME |
| `src/pages/LoginPage.tsx` | siteContent, farm (useData line 235) | Non (globales) | Non requis | CONFORME |
| `src/pages/ProfilePage.tsx` | appUser via useAuth, pas useData | N/A (pas DataContext) | — | HORS SCOPE |
| `src/pages/Confidentialite.tsx` | pas de useData | N/A | — | HORS SCOPE |
| `src/pages/MentionsLegales.tsx` | pas de useData | N/A | — | HORS SCOPE |
| `src/pages/SiteContentEditor.tsx` | siteContent (useData line 41) | Non (globale) | Non requis | CONFORME |
| `src/pages/exploitation/CampagnesPage.tsx` | exploitation sources | Oui | Oui, `loadModule('exploitation')` lignes 69-71 | CONFORME |
| `src/pages/exploitation/OperationsPage.tsx` | exploitation sources | Oui | Oui, `loadModule('exploitation')` lignes 80-82 | CONFORME |
| `src/pages/exploitation/ParcellesPage.tsx` | exploitation sources | Oui | Oui, `loadModule('exploitation')` lignes 55-57 | CONFORME |
| `src/pages/exploitation/RecoltesPage.tsx` | exploitation sources | Oui | Oui, `loadModule('exploitation')` lignes 51-53 | CONFORME |
| `src/pages/exploitation/ExploitationModule.tsx` | plots, campaigns, cropOperations, harvests (line 42) | Oui | Non | À AJOUTER |
| `src/pages/exploitation/JournalCulturePage.tsx` | campaigns, plots, cropOperations, harvests (line 42) + `campaigns` direct | Oui | Non | À AJOUTER |
| `src/pages/exploitation/LotsPage.tsx` | animalLots (line 18) | Oui | Non | À AJOUTER |
| `src/pages/exploitation/AnimauxPage.tsx` | animals (line 18) | Oui | Non | À AJOUTER |
| `src/pages/elevage/ElevageModule.tsx` | lots, animaux, animalEvents (line 43) | Oui | Oui, `loadModule('elevage')` ligne 46 | CONFORME |
| `src/pages/configuration/SitesPage.tsx` | sites, users, plots, animals (line 40) | Oui (sites, users globaux mais plots/animals non globaux) | Non | À AJOUTER |
| `src/pages/configuration/BailleursPage.tsx` | funders (line 20) | Non (globale) | Non requis | CONFORME |
| `src/pages/configuration/ClientsPage.tsx` | customers (via supabase direct, non via useData pour la liste) | N/A (lecture directe) | Non | HORS SCOPE §9 (pas de useData source) |
| `src/pages/surveillance/SurveillancePage.tsx` | pas de useData | N/A | — | HORS SCOPE |
| `src/pages/surveillance/tabs/AlertesTab.tsx` | alerts (line 15) | Non (globale) | Non requis | CONFORME |
| `src/pages/surveillance/tabs/EvenementsTab.tsx` | sites (line 59) via useData + useSurveillance | Non (globale) | Non requis | CONFORME |
| `src/pages/surveillance/tabs/HistoriqueTab.tsx` | pas de useData (supabase direct sur audit_logs + jointures) | N/A | — | HORS SCOPE |
| `src/pages/LandingPagePrototype.tsx` | farm (line 7) | Non (globale) | Non requis | CONFORME |

Pages racines non listées ci-dessus (lecture directe sans DataContext) :
- `src/pages/AnimalEventManage.tsx`, `src/pages/AnimalManage.tsx` — non lues dans cette vague, HORS SCOPE jusqu'à lecture

## Détail — DashboardV2 (RISQUE ÉLEVÉ)

`src/pages/DashboardV2.tsx` lit via `useData` les sources `sites`, `alerts`, `farm` et effectue des requêtes Supabase directes sur `event_journal` (lignes 236-242, dans `useDashboardTrend`, lignes 201-262). Aucun appel à `loadModule` n'est présent.

Conséquences selon §9 :
- Les sources `sites` et `farm` sont globales (chargement par défaut) → pas de violation pour celles-ci.
- Cependant, `event_journal` est lu hors DataContext (pas de source déclarée, pas de `loadModule`), ce qui contourne le mécanisme de chargement par module et l'état idle/loading/loaded/error. C'est le cas le plus risqué de l'audit car la page affiche des KPIs héro sourcés depuis `event_journal` sans garantie que les données soient chargées avant affichage.

Détail technique : `siteId`, `period`, `campaignId` proviennent de `useDashboardData()` (pas de `loadModule`). L'adaptateur `src/lib/dashboard/dashboard-data-source.ts` lit `event_journal` directement.

## Hooks analysés

| Hook | useData ? | loadModule ? | Verdict |
|---|---|---|---|
| `src/hooks/useDashboardScope.ts` | Non | Non | CONFORME (site/period/campaign scope, URL-synced, pas de source DataContext) |
| `src/hooks/useDashboardData.ts` | Oui (sites, campaigns, alerts) + clientDataSource (event_journal direct) | Non | À surveiller — repose sur clientDataSource hors DataContext |
| `src/hooks/useSurveillance.ts` | Non (Supabase direct sur surveillance_events) | Non | CONFORME (pas de DataContext) |

Hooks non lus dans cette vague : `useDashboardStats.ts`, `usePaginatedQuery.ts`, `useAsyncAction.ts`, `useFormValidation.ts` — HORS SCOPE jusqu'à lecture.

## Findings (confirmés vs supposés)

Confirmés :
1. DashboardV2 ne déclare aucun `loadModule` tout en lisant `event_journal` hors DataContext — RISQUE ÉLEVÉ.
2. 9 pages lisent des sources non globales sans déclarer `loadModule` : Inventory, Projects, Reports, Suppliers, ExploitationModule, JournalCulturePage, LotsPage, AnimauxPage, SitesPage.
3. ElevageModule déclare correctement `loadModule('elevage')`.
4. Les 4 pages exploitation (Campagnes, Operations, Parcelles, Recoltes) déclarent correctement `loadModule('exploitation')`.

Supposés (non vérifiés par exécution) :
- L'absence de `loadModule` sur les 9 pages ci-dessus peut se traduire par des tableaux vides / KPI à 0 tant que le module n'est pas chargé par ailleurs (conséquence §9, non exécutée).

## Actions Performed
Aucune modification de code. Lecture seule des fichiers. Aucun commit, aucun push, aucun test exécuté.

## Validation
Audit statique uniquement. Aucun test navigateur ni exécution de code n'a été effectué. Les verdicts reposent sur la lecture du code source.

## Final Status
TERMINÉ (audit statique seulement, aucune correction appliquée).

## Next Step
Appliquer les corrections : ajouter `loadModule` sur les 9 pages classées « À AJOUTER » et traiter DashboardV2 (RISQUE ÉLEVÉ) — nécessite accord explicite de la mission (CLAUDE.md §16).

## Comptage final
- CONFORME : 17 (Dashboard, Configuration, Media, SettingsPage, UsersPage, LandingPage, LoginPage, SiteContentEditor, CampagnesPage, OperationsPage, ParcellesPage, RecoltesPage, ElevageModule, BailleursPage, AlertesTab, EvenementsTab, LandingPagePrototype)
- À AJOUTER : 9 (Inventory, Projects, Reports, Suppliers, ExploitationModule, JournalCulturePage, LotsPage, AnimauxPage, SitesPage)
- RISQUE ÉLEVÉ : 1 (DashboardV2)
- HORS SCOPE : 6 (ProfilePage, Confidentialite, MentionsLegales, ClientsPage, SurveillancePage, HistoriqueTab)
