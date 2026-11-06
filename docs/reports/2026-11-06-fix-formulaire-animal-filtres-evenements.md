# Fix formulaire animal + filtres événements

Date : 2026-11-06 21:00
Branche : main
Commit : 4da4c5d
Auteur : Claude Code (agent) + validation humaine

## Contexte
Le formulaire de création d'animal ne capture PAS `site_id`. Conséquence : tous les animaux sont créés orphelins, le trigger `log_event` ne peut pas résoudre `farm_id`, `event_journal` reste vide, et le KPI de mortalité vaut toujours 0. Par ailleurs, le formulaire d'événements animaux manque les filtres `naissance`, `mort`, `vente`, `achat`.

## Constats
- `src/lib/types.ts` : l'interface `Animal` n'avait pas de champ `site_id`.
- `src/pages/AnimalManage.tsx` : `animalSchema` (l.26-46) sans `site_id`; pas de champ Site dans le formulaire; le payload d'insert ne contient pas `site_id`.
- `src/pages/AnimalEventManage.tsx` : `TYPE_FILTERS` (l.65-71) ne contient que `all`, `vaccination`, `traitement`, `maladie`, `autre` — les 4 types `naissance`, `mort`, `vente`, `achat` manquent.
- `src/lib/SiteContext.tsx` : `useSite()` disponible avec `currentSiteId` et `availableSites` (via `useData().sites`).

## Actions effectuées

### Fix #1 — site_id obligatoire sur la création d'animal
1. `src/lib/types.ts` : ajouté `site_id: string | null;` à l'interface `Animal`.
2. `src/pages/AnimalManage.tsx` :
   - import `useSite` ajouté (`src/lib/SiteContext`).
   - destructuring `useData()` : ajouté `sites`; `useSite()` : ajouté `currentSiteId`.
   - `animalSchema` : `site_id: z.string().uuid({ message: 'Sélectionnez un site' })` (requis).
   - `DEFAULT_VALUES` : `site_id: currentSiteId ?? ''`.
   - payload submit : `site_id: values.site_id || null`.
   - `openEdit` : `setForm('site_id', animal.site_id ?? '')`.
   - `openCreate` : `setForm('site_id', currentSiteId ?? '')`.
   - JSX : champ "Site" (`FormSelect` sur `sites`) ajouté dans "Informations essentielles" après Espèce.

### Fix #2 — filtres événements manquants
- `src/pages/AnimalEventManage.tsx` : `TYPE_FILTERS` étendu avec `naissance`, `mort`, `vente`, `achat` (plus `autre`).

## Validation
- `npx tsc --noEmit` : exit 0 ✅
- `npm run build` : exit 0 ✅
- `npx vitest run src/lib/kpi.test.ts` : 2/2 passé ✅ (regression test calculateMortalityRate)
- `npm test` complet : 16 fichiers échouent, tous pré-existants (UsersPage, Dashboard, authGuard, RotatingCard, KpiCard, Modal, SalesModule, tests d'intégration). Aucun ne importe `AnimalManage` ni `AnimalEventManage`. Pas de régression liée aux changements.

## Conclusion
Les deux fixes sont appliqués et validés (typecheck, build, test unitaire KPI OK). Aucun test régressif introduit.

## Décisions humaines requises
Aucune.

## Fichiers modifiés
- `src/lib/types.ts`
- `src/pages/AnimalManage.tsx`
- `src/pages/AnimalEventManage.tsx`

## Prochaine étape
2 commits atomiques :
1. `fix(livestock): require site_id on animal creation (root cause of missing KPIs)`
2. `fix(livestock): add missing event type filters (mort, naissance, vente, achat)`
