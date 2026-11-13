# Audit d'investigation — DashboardV2 (RISQUE ÉLEVÉ)

## Mission
Investigation de `DashboardV2` classé « RISQUE ÉLEVÉ » dans l'audit loadmodule (`docs/audits/2026-11-13-loadmodule-audit.md`). Décider d'une stratégie de correction AVANT de coder. Répondre aux questions A à E sur la requête `event_journal`, le contournement du DataContext, le RLS, la fraîcheur des données et la concurrence.

## Objectif
Produire une recommandation unique et un plan de haut niveau en 3 étapes pour faire passer DashboardV2 de « RISQUE ÉLEVÉ » à CONFORME à la règle CLAUDE.md §9 (loadModule).

## Environment
- Host : localhost
- Répertoire : /home/souleymane/BAHKANSO
- Branche : feat/dashboard-v2
- Dernier commit de code : 5129e0b
- Stack : React, Vite, TypeScript strict, Tailwind CSS, Supabase (Postgres, Auth, Storage), DataContext, TanStack React Query

## Fichiers lus (lecture seule)
- `src/pages/DashboardV2.tsx`
- `src/lib/dashboard/dashboard-data-source.ts`
- `src/lib/dashboard/dashboard-mappers.ts`
- `src/hooks/useDashboardData.ts`
- `src/lib/DataContext.tsx` (lignes 1-498)
- `supabase/migrations/20261105000000_create_event_journal.sql`
- `src/lib/kpi.ts`
- `src/hooks/useDashboardData.test.ts`
- `docs/audits/2026-11-13-loadmodule-audit.md`

## A. Requêtes exactes sur `event_journal`

| Fichier | Ligne | Requête | Filtres | Colonnes sélectionnées | Commentaire |
|---|---|---|---|---|---|
| `dashboard-data-source.ts` | 67-73 | `SELECT event_type, amount, quantity, context, occurred_at FROM event_journal` | `.in('farm_id', farmIds)`, `.gte('occurred_at', periodStart)`, `.lte('occurred_at', periodEnd)`, `.order('occurred_at', { ascending: false })` | event_type, amount, quantity, context, occurred_at | `getKpis` — KPIs héro (net, marge, rendement) |
| `dashboard-data-source.ts` | 114-119 | `SELECT event_type, amount, occurred_at FROM event_journal` | `.in('farm_id', farmIds)`, `.gte('occurred_at', periodStart)`, `.order('occurred_at', { ascending: true })` | event_type, amount, occurred_at | `getTrend` — tendance 6 mois |
| `dashboard-data-source.ts` | 153-158 | `SELECT * FROM event_journal` | `.in('farm_id', farmIds)`, `.order('occurred_at', { ascending: false })`, `.limit(limit)` | * (toutes colonnes) | `getRecent` — non appelé actuellement (getActions retourne `[]`) |
| `DashboardV2.tsx` | 236-242 | `SELECT event_type, amount, occurred_at FROM event_journal` | `.in('farm_id', farmIds)`, `.gte('occurred_at', periodStart)`, `.order('occurred_at', { ascending: true })` | event_type, amount, occurred_at | `useDashboardTrend` (inline, lignes 201-262) — tendance 6 mois, duplication de `getTrend` |
| `kpi.ts` | 19-24 | `SELECT quantity FROM event_journal` | `.eq('entity_type', 'harvest')`, `.eq('event_type', 'recolte')`, `.eq('context->>campaign_id', campaignId)` | quantity | `calculateYield` |
| `kpi.ts` | 70-78 | `SELECT amount FROM event_journal` | `.eq('farm_id', farmId)`, `.eq('event_type', eventType)` (+ dates optionnelles) | amount | `calculateGrossMargin` — 2 appels (recette + depense) |
| `kpi.ts` | 107-124 | `SELECT amount, context FROM event_journal` | `.eq('farm_id', farmId)`, `.eq('event_type', 'depense')` | amount, context | `calculateCostPerUnit` — filtre côté client sur `context.campaign_id` |
| `kpi.ts` | 120-124 | `SELECT quantity, context FROM event_journal` | `.eq('farm_id', farmId)`, `.eq('event_type', 'recolte')` | quantity, context | `calculateCostPerUnit` — filtre côté client sur `context.campaign_id` |
| `kpi.ts` | 143-149 | `SELECT event_type FROM event_journal` | `.eq('farm_id', farmId)` (+ dates optionnelles) | event_type | `calculateMortalityRate` — filtre côté client sur animal_ne / animal_mort |

**Réponse A (FAIT)** : 9 requêtes distinctes sur `event_journal` sont présentes dans le code, dont 4 dans le périmètre DashboardV2 (3 dans `dashboard-data-source.ts` + 1 inline dans `DashboardV2.tsx`). Toutes utilisent des colonnes explicites (pas de `SELECT *` sauf `getRecent` qui n'est pas appelé).

## B. Contournement du DataContext

DashboardV2 ne déclare **aucun** appel à `loadModule`. Il lit via `useData` :
- `sites` (ligne 27) — source **globale** (chargement par défaut) → pas de violation §9 pour celle-ci ;
- `alerts` (ligne 31) — source **globale** → pas de violation §9 ;
- `farm` — non lu directement dans DashboardV2.tsx (lu via `sites.find(...).farm_id`).

Mais `event_journal` est lu **hors DataContext** :
- directement par `clientDataSource` (`dashboard-data-source.ts`, appelé par `useDashboardData`) ;
- directement par `useDashboardTrend` (inline dans `DashboardV2.tsx:201-262`).

`event_journal` n'est **aucune** source déclarée dans `GLOBAL_SOURCES` ni dans aucun `MODULE_SOURCES[module]` (`DataContext.tsx:37-58`). Il n'existe donc pas de `loadModule('dashboard')` qui le charge — `DASHBOARD_SOURCES` contient `transactions`, `expenses`, `inventoryItems`, `projects`, `alerts`, `animals`, `animalLots`, `campaigns` (lignes 24-33), mais pas `event_journal`.

**Réponse B (FAIT)** : DashboardV2 contourne totalement le DataContext pour `event_journal`. Aucun `loadModule` n'est appelé. Les sources `sites` et `alerts` lues via `useData` sont globales et couvertes, mais `event_journal` est sourcé en direct sans garantie idle/loading/loaded/error.

## C. RLS (Row Level Security) sur `event_journal`

La migration `20261105000000_create_event_journal.sql` :
- `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY` (lignes 30-31) ;
- Politique SELECT pour `authenticated` : rôle dans une liste étendue ET `farm_id = current_user_site_id()` (lignes 34-40) ;
- **Aucune politique INSERT** pour `authenticated` — écriture uniquement par triggers SECURITY DEFINER (ligne 42-43) ;
- `REVOKE UPDATE, DELETE` (ligne 46) ;
- Garde-fou `relforcerowsecurity` (lignes 49-54).

**Réponse C (FAIT)** : RLS activé et forcé. Les requêtes côté client (via le client Supabase anonyme/authentifié) sont soumises à la politique SELECT. L'utilisateur ne voit que les événements de son site (`current_user_site_id()`). Pas de contournement RLS détecté dans le code frontend.

## D. Fraîcheur des données

DashboardV2 n'a **aucun mécanisme de rechargement automatique** :
- `useDashboardData.fetchData` est déclenché uniquement quand `siteId`, `period`, `campaignId` ou `farmIds.length` changent (`useDashboardData.ts:95-97`) ;
- `useDashboardTrend` (inline) se réexécute quand `siteId`, `period` ou `sites` changent (`DashboardV2.tsx:259`) ;
- Aucun polling, aucun abonnement temps réel (realtime), aucun `on(` après chargement initial.

Conséquence : si un nouvel événement est écrit dans `event_journal` par un autre utilisateur ou un autre onglet pendant que DashboardV2 est ouvert, les KPIs et la tendance restent figés jusqu'à ce que l'utilisateur change de site/période ou recharge la page.

**Réponse D (HYPOTHÈSE)** : Les données sont fraîches au chargement de la page, mais deviennent statiques pendant la session. Pas de réconciliation avec les writes concurrentiels. Ce comportement est acceptable pour un tableau de bord consultatif, mais doit être documenté comme une limitation.

## E. Concurrence

Plusieurs sources de concurrence potentielles :

1. **Double lecture de `event_journal`** : `useDashboardData` (via `clientDataSource.getKpis`) et `useDashboardTrend` (interne à DashboardV2) effectuent toutes deux une requête sur `event_journal` avec les mêmes filtres `farm_id` + dates. C'est deux allers-retours Supabase pour des données partiellement redondantes (montants vs montants+quantités+contexte).

2. **Course entre `sites` (DataContext) et `event_journal` (direct)** : `useDashboardData` résout `farmIds` depuis `sites` (chargé par DataContext, état idle/loading/loaded/error) tandis que `event_journal` est interrogé en direct. Si `sites` n'est pas encore chargé, `farmIds` est vide et `getKpis` retourne des zéros sans erreur (pas de no_data, pas de loading) — voir `dashboard-data-source.ts:63-65` et `useDashboardData.ts:77-80`.

3. **Pas de verrouillage ni d'idempotence côté lecture** : les lectures sont pures (SELECT), donc pas de risque de double-écriture, mais des résultats incohérents peuvent apparaître entre les deux requêtes si un write survient entre les deux.

4. **`useEffect` de `useDashboardTrend` dépend de `sites` (référence tableau)** : si `sites` est recréé à chaque rendu (instabilité de référence), l'effet se réexécute inutilement. Dans `useDashboardData`, `farmIds` est calculé avec `useMemo` sur `[siteId, sites]` — même risque si `sites` n'est pas memoïsé par le DataContext.

**Réponse E (HYPOTHÈSE)** : Le principal risque de concurrence est la double requête sur `event_journal` (KPIs + tendance) et l'absence de synchronisation entre l'état de chargement de `sites` (DataContext) et la lecture directe de `event_journal`. Aucun verrou n'est nécessaire en lecture seule, mais une déduplication des requêtes réduirait la charge sur Supabase.

## Analyse transverse

### Volume
`event_journal` est une table d'immutation journalisée (append-only, `REVOKE UPDATE, DELETE`). L'index `event_journal_farm_date` sur `(farm_id, occurred_at DESC)` couvre tous les filtres utilisés. Le volume de lecture est proportionnel au nombre d'événements par ferme et par période. `getRecent` utilise `SELECT *` (toutes colonnes dont `context` jsonb) — potentiellement coûteux si la table grossit, mais cette fonction n'est pas appelée actuellement.

### RLS
La politique SELECT restreint à `farm_id = current_user_site_id()`. Comme DashboardV2 résout `farmIds` depuis les `sites` du DataContext (qui eux-mêmes sont déjà filtrés par RLS au chargement global), il n'y a pas d'escalade de privilège côté lecture. L'écriture est verrouillée (triggers SECURITY DEFINER uniquement).

### États de donnée
Les mappers (`dashboard-mappers.ts`) respectent la règle « aucune ligne => null (no_data), jamais 0 » pour les KPIs net, marge et rendement. Cependant :
- `getKpis` retourne `alertesOuvertes: 0` en dur (`dashboard-data-source.ts:101`) — les alertes ouvertes viennent de `alerts` (globale) via `mapOpenAlerts`, pas de `event_journal`. Cohérent.
- Quand `farmIds` est vide (sites non chargés), `useDashboardData` met `raw` à `{ entreees: 0, sorties: 0, ... }` sans passer par un état `loading` ni `no_data` — les KPIs affichent `0` / « Aucune donnée » prématurément. C'est une violation de l'esprit de §9.

### Tableau comparatif des options A-E

| Option | Description | Conforme §9 | Double requête event_journal | États loading/no_data respectés | Complexité | Recommandation |
|---|---|---|---|---|---|---|
| **A** | Ajouter `loadModule('dashboard')` et déclarer `event_journal` dans `DASHBOARD_SOURCES` | ✅ | ❌ (2 requêtes conservées) | ⚠️ partiel (sites non chargés => zéros) | Moyenne | Non retenu seul |
| **B** | Fusionner `useDashboardTrend` dans `clientDataSource.getTrend` (une seule source event_journal) + `loadModule` | ✅ | ✅ (dédupliqué) | ⚠️ partiel | Moyenne | **Retenu (recommandé)** |
| **C** | Passer tout le dashboard par le DataContext (supprimer `clientDataSource`, utiliser les sources globales + module) | ✅ | ✅ | ✅ | Élevée (refonte) | Non retenu (trop invasif) |
| **D** | Statut quo (pas de correction) | ❌ | ❌ | ❌ | Nulle | Non retenu |
| **E** | Wrapper `clientDataSource` avec un état de chargement explicitement géré + `loadModule('dashboard')` | ✅ | ❌ | ✅ | Basse | Alternative si B trop coûteux |

**Recommandation unique : Option B.**

- Ajouter `event_journal` à `DASHBOARD_SOURCES` et appeler `loadModule('dashboard')` dans `DashboardV2` (ou via `useDashboardData`) pour respecter §9.
- Dédupliquer la lecture de `event_journal` : supprimer `useDashboardTrend` inline et utiliser `clientDataSource.getTrend` (déjà existant, non appelé par `useDashboardData` actuellement — `getActions` est vide).
- Gérer explicitement l'état `loading` quand `farmIds` est vide mais que `sites` est encore en chargement, pour éviter les zéros prématurés.

## Plan de haut niveau en 3 étapes

1. **Étape 1 — Déclarer la source et appeler loadModule** : ajouter `event_journal` à `DASHBOARD_SOURCES` (`DataContext.tsx:24-33`) et ajouter `loadModule('dashboard')` dans `DashboardV2` (ou dans `useDashboardData`) pour que le chargement de `event_journal` passe par le mécanisme idle/loading/loaded/error du DataContext. *Vérification : `loadModule` présent, pas de lecture directe hors DataContext pour les KPIs.*

2. **Étape 2 — Dédupliquer les requêtes `event_journal`** : supprimer `useDashboardTrend` (inline, `DashboardV2.tsx:201-262`) et faire appeler `clientDataSource.getTrend` depuis `useDashboardData`, en retournant `trendData` dans le hook. *Vérification : une seule requête `event_journal` par scope (KPIs + tendance combinées ou séquentielles, plus deux appels séparés redondants).*

3. **Étape 3 — États de chargement cohérents** : quand `farmIds` est vide parce que `sites` n'est pas encore chargé, retourner un état `loading` (pas de zéros, pas de `no_data` prématuré). *Vérification : pas de KPI à 0 tant que `sites` n'est pas chargé.*

## Risques résiduels

- `getRecent` utilise `SELECT *` sur `event_journal` (toutes colonnes dont `context` jsonb) — non appelé actuellement, mais à surveiller si réactivé (coût IO sur table croissante).
- Pas de réconciliation temps réel : les données restent statiques pendant la session (acceptable pour un tableau de bord consultatif, à documenter).
- Les seuils `warn`/`crit` des mappers ne sont pas définis (tout en `ok` / `no_data`) — à valider par le responsable métier, hors périmètre de cette correction structurelle.

## Tests existants

- `src/hooks/useDashboardData.test.ts` : 4 tests sur la garde de période (période mal formée, vide, mois hors bornes, période valide). Mock `clientDataSource.getKpis` uniquement. Ne couvre pas `getTrend`, ni le chargement de `sites`, ni `loadModule`.

## Points à mesurer

- Nombre de requêtes `event_journal` par montage de DashboardV2 (doit passer de 2 à 1 après déduplication).
- État des KPIs pendant le chargement initial de `sites` (ne doit pas afficher 0 / « Aucune donnée » prématurément).
- Temps de chargement initial de DashboardV2 avec `loadModule('dashboard')` (ajoute `event_journal` au batch de sources déjà chargées par défaut).

## Validation

Audit statique uniquement. Aucun test navigateur, aucun `vitest`, aucun `typecheck`, aucun `lint` n'a été exécuté dans le cadre de cette investigation (contraintes de mission : lecture seule, écriture autorisée uniquement dans ce fichier de rapport).

## Statut final

TERMINÉ (investigation statique, recommandation émise, aucune correction appliquée).

## Prochaine étape

Appliquer l'option B : modifier `DataContext.tsx` (ajouter `event_journal` à `DASHBOARD_SOURCES`), ajouter `loadModule('dashboard')` dans `DashboardV2`/`useDashboardData`, supprimer `useDashboardTrend` inline et faire appeler `clientDataSource.getTrend` depuis `useDashboardData`. Nécessite accord explicite de la mission (CLAUDE.md §16).

## Décision appliquée (Lot 2a)

`event_journal` reste hors `DASHBOARD_SOURCES` (volumétrie : SELECT * sur un journal append-only de plusieurs milliers de lignes). L'exception §9 est documentée : `clientDataSource` conserve son rôle d'agrégateur de `event_journal` pour les KPIs héros. DashboardV2 déclare désormais `loadModule('dashboard')` (sources lues via useData : sites, alerts, farm) et distingue trois états :

- `sourceStatus.sites` !== 'success' && !== 'error' (undefined / idle / loading au mount) => `raw=null`, `loading=true`, KPIs en statut `loading` (jamais de 0 prématuré).
- `sourceStatus.sites === 'success'` && `farmIds.length === 0` (période valide) => `raw=null`, `loading=false`, KPIs en statut `no_data`.
- sinon => appel `clientDataSource.getKpis`, KPIs en statut `ok`/`no_data` selon les mappers.

`sourceStatus.sites` est ajouté aux dépendances du `useCallback fetchData` (`src/hooks/useDashboardData.ts:105`) pour que le callback re-tourne sur la transition `sites` (loading → success). `setLoading(false)` est appelé systématiquement dans les branches de sortie (no_data et période invalide) pour ne pas rester coincé en loading. `useDashboardTrend` n'est pas modifié à cette étape (réservé au Lot 2b).
