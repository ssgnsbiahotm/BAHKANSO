# Diagnostic de performance — Chargement des pages

Date : 2026-11-08
Branche : main
Commit : aucun (aucune commande git exécutée)
Auteur : Claude Code (agent)

## Mission
Diagnostiquer les causes de lenteur des chargements de pages (en particulier Dashboard et Finance) et produire un plan d'action validable avant toute implémentation.

## Objectif
Identifier, page par page :
- Le nombre de requêtes Supabase au mount
- L'usage de `SELECT *`
- La présence ou l'absence de pagination
- Les chunks lourds (code splitting)
- Une priorité (P1/P2/P3)

## Environnement
- Stack : React 18.3, Vite 5.4.2, TypeScript 5.5.3, TanStack React Query v5, Supabase JS v2.119, react-router-dom v7, Tailwind 3.4
- Data loading : `DataContext` fait ~29 requêtes `supabase` en `Promise.all` au mount, toutes `select('*')`, sans pagination
- Pagination : `usePaginatedQuery` (colonnes `*` par défaut, `count: 'exact'`, `keepPreviousData`). Finance utilise `pageSize=50` par défaut
- Code splitting : toutes les pages en `React.lazy` + `Suspense` (AppRoutes.tsx)
- Build : `dist/assets` avec `vendor-react` 235KB, `vendor-supabase` 228KB, `vendor-data` 129KB, CSS 88KB

## Constats par page

| Page | Requêtes au mount | SELECT * | Pagination | Chunks lourds | Priorité |
|------|-------------------|----------|------------|---------------|----------|
| Dashboard | ~29 (via DataContext) + 4 directes (campaigns, projects, farms + KPIs calculés) | Oui (toutes) | Non | 26.9 KB | P1 |
| Finance (listes) | 4 × paginées (transactions, fundings, expenses, documents) | Oui (usePaginatedQuery) | Oui (50) | vendor-supabase 228 KB partagé | P1 |
| Campagnes | 1 (via DataContext, toutes les campagnes) | Oui | Non | 22.1 KB | P2 |
| Operations | 1 (via DataContext, toutes les opérations) | Oui | Non | 19.3 KB | P2 |
| Recoltes | 1 (via DataContext, toutes les récoltes) | Oui | Non | 14.3 KB | P2 |
| Parcelles | 1 (via DataContext, toutes les parcelles) | Oui | Non | 13.3 KB | P2 |
| Journal Culture | 1 (via DataContext) + 1 directe (campagnes par plot) | Oui | Non | 10.9 KB | P3 |
| Ventes (SalesModule) | 1 (useSimpleQuery sales, jointures imbriquées) + 1 (customers) | Oui | Non | ~15 KB | P2 |
| Elevage (overview) | 1 (via DataContext, 3 tables) | Oui | Non | ~10 KB | P3 |
| Historique (surveillance) | 1 directe (audit_logs) + 7 directes (enrichissement par type) | Oui | Non (limit 100) | ~31 KB | P3 |

## Constats globaux

### 1. DataContext est le goulot d'étranglement principal (DataContext.tsx:124-316)
`loadAll()` lance **29 requêtes Supabase en `Promise.all`**, toutes en `select('*')`, sans pagination, au mount de l'application. Cela charge l'intégralité de ~25 tables à chaque connexion, même si la page courante n'en utilise qu'une fraction.

Exemples de requêtes lourdes inutiles pour une page donnée :
- `audit_logs` (limit 100) — utilisé uniquement par HistoriqueTab
- `notifications`, `documents`, `media`, `fundings`, `bank_accounts`, `cash_accounts` — non nécessaires sur Dashboard
- `inventory_movements`, `inventory_counts`, `budgets` — non nécessaires sur Dashboard

### 2. `SELECT *` systématique (DataContext.tsx:145-174, usePaginatedQuery.ts:41)
Aucune requête ne limite les colonnes. `usePaginatedQuery` a `columns = '*'` par défaut (ligne 41). Cela transfère des colonnes inutilisées (blobs, JSON, métadonnées) à chaque requête.

### 3. Pas de pagination sur les grosses tables (DataContext)
`transactions`, `expenses`, `harvests`, `crop_operations`, `inventory_movements`, `animal_events` sont chargées en totalité, sans `range`. Sur des datasets de production cela deviendra bloquant.

### 4. Filtre côté client sur données déjà chargées (SalesModule.tsx:117-133)
`filteredSales` filtre en JavaScript tout le tableau des ventes déjà chargé, au lieu de filtrer côté serveur. Même pattern dans `OperationsPage.tsx:104-114`, `CampagnesPage.tsx:79-90`, `RecoltesPage.tsx:91-100`, `ParcellesPage.tsx:63-72`.

### 5. KPIs du Dashboard recalculés en mémoire (useDashboardStats.ts)
`useDashboardStats` fait du `filter`/`reduce` sur l'intégralité des transactions, expenses, projets, alertes en mémoire à chaque render. Avec des datasets importants, ce coût JS s'ajoute au coût réseau.

### 6. Chunks vendor partagés mais lourds
`vendor-supabase` (228 KB) et `vendor-react` (235 KB) sont partagés entre toutes les pages. Le chunk `index-DtMq_mPk.css` fait 88 KB. Aucun chunk n'est isolé par page critique.

## Top 5 optimisations (impact estimé)

1. **Fragmenter DataContext en contextes par domaine** — ne charger que les tables nécessaires à la page courante (ex: `FinanceDataContext`, `ExploitationDataContext`, `DashboardDataContext`). Supprime les ~29 requêtes inutiles au mount.
   - *Cible* : réduire le mount de ~29 requêtes à 3-6 selon la page.

2. **Remplacer `SELECT *` par des colonnes explicites** — limiter aux colonnes réellement utilisées par chaque page (ex: `id, name, site_id` pour les sélecteurs, pas tous les champs).
   - *Cible* : réduire la taille des réponses de 40-70%.

3. **Ajouter la pagination côté serveur sur les grosses tables** — `transactions`, `expenses`, `harvests`, `crop_operations`, `inventory_movements` via `usePaginatedQuery` avec `range` + `count`.
   - *Cible* : passer de « toutes les lignes » à 20-50 par page.

4. **Déplacer les filtres côté serveur** — `site_id`, recherche textuelle, tri via Supabase (`eq`, `ilike`, `order`) au lieu de `Array.filter` en JS.
   - *Cible* : réduire le volume transféré et le CPU client.

5. **Mémoïser / agréger les KPIs côté serveur** — pour Dashboard, calculer les agrégats (net treasury, marge, KPIs élevage) via une requête ciblée ou une fonction SQL au lieu de charger toutes les lignes.
   - *Cible* : réduire le volume réseau pour Dashboard de plusieurs Mo à quelques Ko.

## Plan d'action P1 / P2 / P3

### P1 — Critique (Dashboard + Finance)
- [ ] Créer `DashboardDataContext` (ou réduire `DataContext`) : seules les 8 sources du Dashboard au mount, colonnes limitées
- [ ] Colonnes explicites sur `usePaginatedQuery` (Finance) au lieu de `*`
- [ ] Pagination serveur sur `transactions`, `expenses` (Finance)
- [ ] Colonnes explicites sur les 4 requêtes directes du Dashboard (campaigns, projects, farms)

### P2 — Importante (Exploitation + Ventes)
- [ ] Pagination serveur sur `campaigns`, `crop_operations`, `harvests`, `plots`
- [ ] Filtres côté serveur (`site_id`, recherche) sur `SalesModule`, `OperationsPage`, `CampagnesPage`, `RecoltesPage`, `ParcellesPage`
- [ ] `SELECT *` → colonnes explicites sur ces pages

### P3 — Secondaire (Autres pages)
- [ ] Pagination sur `inventory_movements`, `animal_events`, `audit_logs`
- [ ] Colonnes explicites sur `ElevageModule`, `HistoriqueTab`
- [ ] Audit des chunks CSS/JS pour isoler les pages lourdes

## Décisions humaines requises
- Valider le périmètre de fragmentation de `DataContext` (un contexte par module vs plusieurs petits contextes)
- Choisir la taille de page par défaut pour la pagination serveur (proposition : 20 ou 50)
- Confirmer que l'implémentation P1 doit précéder toute modification de code (règle STOP actuelle)

## Fichiers modifiés
Aucun — diagnostic en lecture seule uniquement.

## Prochaine étape
Une fois le rapport validé par l'utilisateur, passer à l'implémentation des optimisations P1, en commençant par `DataContext.tsx` et `usePaginatedQuery.ts`.

## Statut final
PASS (diagnostic terminé, aucun code modifié)