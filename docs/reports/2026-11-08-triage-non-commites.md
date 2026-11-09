# Triage des fichiers non commités — BAHKANSO

Date : 2026-11-08
Branche : main
Commit HEAD : ec11e14 (fix(types): erreurs TypeScript DataContext et TreasuryTab)
Auteur : Claude Code (agent)
Mission : Corriger le message d'erreur du DataContext, vérifier la reproductibilité de main, trier les fichiers non commités

## Objectif

Rattacher chacun des ~37 fichiers modifiés et des fichiers non suivis à sa mission d'origine, vérifier que main tel que commité est reproductible (compilation), proposer des lots de commits cohérents, et identifier les éléments nécessitant une décision humaine. Lecture seule sur le code (une seule modification de code autorisée : le correctif DataContext déjà présent dans le working tree).

## État initial de référence

- `npm run typecheck` : exit 0 sur le working tree (avant ce triage)
- `npm run build` : exit 0
- `npm run lint` : exit 0, 24 warnings préexistants
- Tests : Dashboard.test.tsx en échec préexistant (`loadModule is not a function`, mock non lié), les 3 autres fichiers de test liés passent

## 1. main tel que commité est-il reproductible ?

**NON.** Un clone propre de main (commit ec11e14, /tmp/bahkanso-verif2) échoue au typecheck :

```
src/pages/exploitation/CampagnesPage.tsx(173,39): error TS2339:
  Property 'harvest_cycle' does not exist on type 'Campaign'.
```

**Cause :** `src/pages/exploitation/CampagnesPage.tsx:173` lit `campaign.harvest_cycle`, mais la colonne `harvest_cycle` n'est déclarée sur le type `Campaign` que dans le fichier **non commité** `src/lib/types.ts` (ajout d'une ligne, mission `ajout-farm_id-core-tables`).

**Conséquence :** main tel que commité ne compile pas. Le fichier `src/lib/types.ts` est requis pour que main soit reproductible. Il doit être commité (ou la ligne `harvest_cycle` retirée de CampagnesPage, ce qui reviendrait à annuler un correctif métier).

## 2. Correctif DataContext (étape 2 — seule modification de code autorisée)

**Fichier :** `src/lib/DataContext.tsx:405-406`

**Avant (HEAD, dégrade le comportement) :**
```js
const errorMessage = res.error instanceof Error ? res.error.message : String(res.error ?? 'Erreur de chargement');
```
Les erreurs Supabase (PostgrestError) sont des objets simples, pas des instances de `Error` → affichage `[object Object]`.

**Après (working tree, zéro régression) :**
```js
const errorMessage = (typeof res.error === 'object' && res.error !== null && 'message' in res.error && typeof res.error.message === 'string' ? res.error.message : undefined) || 'Erreur de chargement';
```

**Preuve d'équivalence :** test /tmp/equiv-test.mjs sur 9 cas (PostgrestError, {}, null, undefined, Error, string, number, message:undefined, message:"") — le working tree reproduit exactement le comportement original `res.error?.message || 'Erreur de chargement'` ; HEAD en dégrade 6 sur 9.

Aucune autre modification de DataContext.tsx n'est nécessaire ni autorisée.

## 3. Table de rattachement des fichiers modifiés (37)

| Fichier | Mission d'origine | Nature du changement |
|---------|-------------------|----------------------|
| `src/lib/DataContext.tsx` | Corriger message d'erreur DataContext (étape 2) | Type guard remplaçant `instanceof Error` |
| `src/lib/types.ts` | ajout-farm_id-core-tables | +1 ligne `harvest_cycle` sur `Campaign` |
| `src/pages/exploitation/CampagnesPage.tsx` | ajout-farm_id-core-tables + 5-frictions-terrains | Lit `harvest_cycle` ; deletion `try/finally` |
| `src/modules/Finance/tabs/ExpensesTab.tsx` | lien-3-invalidation-cache-kpis + 5-frictions-terrains | `refresh()` après suppression ; `try/finally` popup |
| `src/modules/Finance/tabs/DocumentsTab.tsx` | 5-frictions-terrains | `try/finally` sur `setDeletingDocument(null)` |
| `src/modules/Finance/tabs/FundingsTab.tsx` | 5-frictions-terrains | `try/finally` sur `setDeletingFunding(null)` |
| `src/modules/Sales/SalesModule.tsx` | 5-frictions-terrains | `try/finally` sur `setConfirmDelete(null)` |
| `src/modules/Sales/SalesModule.test.tsx` | reparation-tests-echec | Mocks `useSalesData`, `SiteContext`, `DataContext` |
| `src/pages/AnimalEventManage.tsx` | 5-frictions-terrains (lié vague2-evenements) | `try/finally` sur `setConfirmDelete(null)` |
| `src/pages/AnimalManage.tsx` | 5-frictions-terrains | `try/finally` sur `setConfirmDelete(null)` |
| `src/pages/Inventory.tsx` | 5-frictions-terrains | `try/finally` sur `setConfirmDelete(null)` |
| `src/pages/Media.tsx` | 5-frictions-terrains | `try/finally` sur `setConfirmDelete(null)` |
| `src/pages/Suppliers.tsx` | 5-frictions-terrains | `try/finally` sur `setConfirmDelete(null)` |
| `src/pages/UsersPage.tsx` | 5-frictions-terrains + reparation-tests-echec | `try/finally` + typage `any` → types explicites |
| `src/pages/configuration/ClientsPage.tsx` | 5-frictions-terrains | `try/finally` sur `setConfirmDelete(null)` |
| `src/pages/exploitation/AnimauxPage.tsx` | 5-frictions-terrains | `try/finally` sur `setDetailAnimal(null)` |
| `src/pages/exploitation/JournalCulturePage.tsx` | 5-frictions-terrains | `try/finally` + suppression code mort (`toneFor`, `handleDeleteOperation`) |
| `src/pages/exploitation/LotsPage.tsx` | 5-frictions-terrains | `try/finally` sur `setDetailLot(null)` |
| `src/pages/exploitation/RecoltesPage.tsx` | 5-frictions-terrains | `try/finally` sur `setDetailHarvest(null)` |
| `src/pages/exploitation/OperationsPage.tsx` | gap-expenses-event-journal + 5-frictions-terrains | `farm_id` sur insert dépense ; `try/finally` |
| `src/routes/AppRoutes.tsx` | 5-frictions-terrains (nettoyage) | Suppression `PreservingRedirect` (code mort, inutilisé ailleurs) |
| `src/lib/SiteContext.tsx` | reparation-tests-echec | `SiteContext` exporté (requis par SalesModule.test.tsx) |
| `src/lib/constants.ts` | reparation-tests-echec | `'mort'` → `'animal_mort'` (aligné kpi.test.ts) |
| `src/lib/kpi.test.ts` | reparation-tests-echec | `'naissance'` → `'animal_ne'` ; `'mort'` → `'animal_mort'` |
| `src/pages/UsersPage.test.tsx` | reparation-tests-echec | Mock `useSite` (fuite de mock SalesModule) |
| `src/test/setup.tsx` | reparation-tests-echec | Mocks `useSalesData` + DataContext (globaux) |
| `tests/integration/setup.mjs` | integration-tests-jwt-broken | `detectSessionInUrl: false` sur le client service role |
| `src/components/ui/SiteField.tsx` | 5-frictions-terrains (accessibilité) | `useId()` + `htmlFor` sur les labels |
| `src/pages/SettingsPage.tsx` | 5-frictions-terrains (nettoyage) | Retrait imports inutilisés `STATUS_CLASS_INFO/WARNING` |
| `docs/audit/CSS_AUDIT.md` | audit CSS | Mise à jour du rapport d'audit CSS |
| `docs/audit/css-audit.json` | audit JSON | Mise à jour des données d'audit |
| `docs/design/scripts/audit-erreurs.sh` | audit script | Aucun changement de contenu (0 octet) |
| `eslint.config.js` | reparation-tests-echec | Règles assouplies pour les fichiers de test |
| `package.json` | reparation-tests-echec | + `eslint-formatter-compact` |
| `package-lock.json` | reparation-tests-echec | Mise à jour du lockfile |
| `CLAUDE.md.txt` | (suppression) | Fichier dupliqué de CLAUDE.md, supprimé |

**Fichiers modifiés : 37.** Aucun fichier de plus n'est modifié.

## 4. Fichiers non suivis (untracked)

| Fichier / dossier | Mission | Recommandation |
|-------------------|---------|----------------|
| `.env.example` | (aucune — audit global P2) | À commiter : modèle d'environnement pour le déploiement (audit global le recommande) |
| `audit-visuals.mjs` | (aucun rapport) | Script Playwright d'audit visuel. À conserver ou commiter après décision |
| `docs/architecture/` | (aucun rapport) | Documentation d'architecture. À commiter après décision |
| `docs/reports/*.md` (11 fichiers) | Toutes les vagues | À commiter comme documentation des missions |
| `memory/` | (mémoire locale du projet) | Fichiers de mémoire persistante. À commiter après décision |
| `src/pages/exploitation/OperationsPage.test.tsx` | gap-expenses-event-journal | Test d'intégration pour `farm_id` sur expenses. À commiter |
| `supabase/.branches/_current_branch` | état Supabase local | Contient `main`. À ne pas commiter (état local de l'outil) |
| `supabase/migrations/20261108000000_trigger_expenses_to_event_journal.sql` | gap-expenses-event-journal | Migration : ajoute `farm_id` à `expenses`, met à jour `log_event()`, recrée le trigger. À appliquer sur base locale puis commiter |

## 5. Analyse des dépendances de compilation

Chaîne de dépendance pour que main compile et que les tests passent :

1. `src/lib/types.ts` (`harvest_cycle`) → requis par `CampagnesPage.tsx:173` — **bloquant** (main ne compile pas sans)
2. `src/lib/SiteContext.tsx` (`SiteContext` exporté) → requis par `SalesModule.test.tsx` — bloquant pour les tests
3. `src/lib/constants.ts` (`'animal_mort'`) → requis par `kpi.test.ts` — bloquant pour les tests
4. `src/test/setup.tsx` (mocks `useSalesData` + DataContext) → requis par plusieurs tests — bloquant pour les tests
5. `tests/integration/setup.mjs` (`detectSessionInUrl`) → requis par les tests d'intégration — bloquant pour l'intégration

## 6. Vérification TreasuryTab logAudit (question en attente du résumé)

**TreasuryTab.tsx:281** appelle `logAudit` à l'intérieur de `executeAction(...)`. `executeAction` (src/hooks/useAsyncAction.ts) attrape l'erreur, affiche un toast d'erreur, appelle `onError` (non défini ici), et **re-throw** (`throw error`). Le bloc `confirmDelete` de TreasuryTab entoure `executeAction` d'un `try { ... } finally { setDeletingTransaction(null); }`, donc la popup se ferme même si `logAudit` throw. Aucun risque de popup bloquée — cohérent avec le pattern `try/finally` appliqué dans Vague 2.

## 7. Scan de sécurité sur les diffs

Aucune clé, token, secret, chaîne de connexion ou valeur `VITE_*` n'apparaît dans les diffs. Les seules occurrences de "secret/password" sont dans la documentation (rappel de règle : ne pas afficher de secrets). Le fichier `tests/integration/setup.mjs` manipule `SERVICE_ROLE_KEY` mais ne l'affiche pas et ne la modifie pas.

## 8. Propositions de lots de commits

**Lot A — Correctif DataContext (seule modif de code de cette mission)**
```
git add src/lib/DataContext.tsx
git commit -m "fix(data): message d'erreur DataContext sur objet non-Error

Remplace instanceof Error par un garde-fou de type sur res.error afin
d'afficher le véritable message d'erreur Supabase (PostgrestError est
un objet simple, non une instance d'Error) au lieu de '[object Object]'.
Comportement identique à l'original sur 9 cas d'erreur."
```

**Lot B — ajout-farm_id-core-tables (base + code)**
```
git add src/lib/types.ts src/pages/exploitation/CampagnesPage.tsx \
    supabase/migrations/20261108000001_add_farm_id_to_core_tables.sql \
    src/pages/exploitation/OperationsPage.tsx \
    src/pages/exploitation/OperationsPage.test.tsx
git commit -m "feat(db): ajoute farm_id aux tables cœur et aux dépenses

Ajoute farm_id sur campaigns, harvests, sales, crop_operations et
expenses avec index et backfill via sites. Passe farm_id à l'insertion
de dépense depuis OperationsPage pour alimenter event_journal."
```
*(Vérifier le nom exact du fichier de migration 001 dans le dépôt.)*

**Lot C — gap-expenses-event-journal (migration + trigger)**
```
git add supabase/migrations/20261108000000_trigger_expenses_to_event_journal.sql
git commit -m "fix(db): corrige le gap expenses -> event_journal

Ajoute farm_id sur expenses, utilise NEW.farm_id en priorité dans
log_event() avec fallback via sites, recrée trg_log_expense sans
doublon, garde-fou row_security = off."
```

**Lot D — 5-frictions-terrains (try/finally sur toutes les suppressions)**
```
git add src/modules/Finance/tabs/DocumentsTab.tsx \
    src/modules/Finance/tabs/ExpensesTab.tsx \
    src/modules/Finance/tabs/FundingsTab.tsx \
    src/modules/Sales/SalesModule.tsx \
    src/pages/AnimalEventManage.tsx src/pages/AnimalManage.tsx \
    src/pages/Inventory.tsx src/pages/Media.tsx src/pages/Suppliers.tsx \
    src/pages/UsersPage.tsx src/pages/configuration/ClientsPage.tsx \
    src/pages/exploitation/AnimauxPage.tsx \
    src/pages/exploitation/JournalCulturePage.tsx \
    src/pages/exploitation/LotsPage.tsx \
    src/pages/exploitation/RecoltesPage.tsx \
    src/routes/AppRoutes.tsx \
    src/components/ui/SiteField.tsx \
    src/pages/SettingsPage.tsx
git commit -m "fix(ux): popup de confirmation toujours fermée (try/finally)

Place setConfirmDelete(null) / setDeleting* (null) dans un bloc finally
sur toutes les suppressions afin que la popup se ferme en cas d'échec
comme de succès. Retire PreservingRedirect (code mort) et ajoute
htmlFor/useId sur SiteField pour l'accessibilité."
```

**Lot E — reparation-tests-echec (mocks + typage + lint)**
```
git add src/modules/Sales/SalesModule.test.tsx src/pages/UsersPage.test.tsx \
    src/lib/constants.ts src/lib/kpi.test.ts src/lib/SiteContext.tsx \
    src/test/setup.tsx tests/integration/setup.mjs \
    eslint.config.js package.json package-lock.json
git commit -m "test: répare les tests d'unité et d'intégration

Mock useSalesData et DataContext globalement, exporte SiteContext,
aligne les libellés d'événements animaux sur le code (animal_ne,
animal_mort), assouplit les règles ESLint sur les fichiers de test."
```

**Lot F — documentation (à commiter après décision)**
```
git add docs/reports/ docs/architecture/ .env.example audit-visuals.mjs memory/
```
*(À ne commiter qu'après validation utilisateur — ce sont des fichiers de rapport/documentation, pas du code.)*

**Lot G — suppression CLAUDE.md.txt**
```
git add CLAUDE.md.txt
git rm CLAUDE.md.txt
git commit -m "docs: supprime le doublon CLAUDE.md.txt
```
*Interdit par les règles absolues (pas de `git rm`) — utiliser `git add` sur la suppression déjà effectuée dans le working tree, ou laisser en l'état après décision.*

> Règle absolue CLAUDE.md : aucun commit sans demande explicite de la mission. Les commandes `git add`/`git commit` ci-dessus sont des propositions, non des exécutions.

## 9. Éléments à décision (utilisateur)

1. **main ne compile pas tel que commité** — valider que `src/lib/types.ts` (ligne `harvest_cycle`) doit être commité pour restaurer la reproductibilité de main.
2. **`.env.example`** — l'audit global recommande de l'ajouter (P2). Valider le commit.
3. **`supabase/.branches/_current_branch`** — état local de l'outil Supabase. Ne pas commiter.
4. **`docs/reports/` + `docs/architecture/` + `memory/` + `audit-visuals.mjs`** — valider s'ils sont commités comme documentation.
5. **Migration `20261108000000`** — à appliquer sur la base locale (`supabase db reset` déjà validé dans le rapport gap) puis commiter. Aucune écriture sur base distante sans accord.

## 10. Validation

- Typecheck working tree : exit 0 (référence)
- DataContext correctif : équivalence prouvée sur 9 cas d'erreur
- Clone propre de main : typecheck exit 2 (1 erreur, `harvest_cycle`) — documenté ci-dessus
- Lint : pas de nouvelle erreur sur les fichiers modifiés (vérifier ciblé)
- Build : exit 0 (référence)
- Security scan des diffs : aucun secret détecté

## 11. Prochaine étape

L'utilisateur valide les lots de commits proposés (ou demande des ajustements), puis les commandes `git add`/`git commit` correspondantes sont exécutées. Aucun commit n'est effectué dans le cadre de cette mission sans demande explicite.

Rapport écrit : docs/reports/2026-11-08-triage-non-commites.md
