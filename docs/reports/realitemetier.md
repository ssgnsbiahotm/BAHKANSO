# BAHKANSO — Rapport de la réalité métier de l'application

**Date** : 2026-11-08  
**Branche** : `main`  
**Commit HEAD** : `ec11e14` (fix(types): erreurs TypeScript DataContext et TreasuryTab)  
**Dépôt** : `/home/souleymane/BAHKANSO`  
**URL production** : https://bahkanso.surge.sh  
**Objet** : État constaté de la réalité métier de l'application — ce qui existe, ce qui fonctionne, ce qui est cassé, ce qui manque — fondé uniquement sur le code, les migrations et les rapports vérifiés. Aucune affirmation sans preuve (fichier:ligne ou résultat de commande).

---

## 1. Synthèse de la réalité métier

BAHKANSO est une application de pilotage agro-pastoral pour l'exploitation Ferme AgroVision (Sikensi, Côte d'Ivoire). Elle couvre, dans une seule interface, quatre domaines métier :

- **Agriculture / exploitation** : parcelles, campagnes, opérations culturales, récoltes.
- **Élevage** : lots, animaux, événements animaux (naissance, achat, vente, mort, soin…).
- **Finance** : dépenses, financements (bailleurs), ventes, clients, trésorerie, documents.
- **Surveillance** : journal d'événements immuable, alertes, historisation.

Toutes les données sont stockées dans une base Supabase (Postgres), chargées par un `DataContext` centralisé, et exposées via des routes protégées par authentification (`RequireAuth`) et autorisation granulaire par module/action (`RequireModule`, RBAC à 8 rôles).

**Verdict opérationnel actuel** : l'application compile et se build (`typecheck` exit 0, `build` exit 0), le lint est propre (0 erreurs, 24 warnings), mais la suite de tests est en échec (70 pass / 17 fail), ce qui signifie que la réalité métier n'est pas encore couverte par une preuve automatique fiable.

---

## 2. Preuves de l'état de référence (vérification exécutée cette session)

Les commandes suivantes ont été exécutées sur le working tree courant (état non commité inclus) :

| Domaine | Commande | Résultat | Preuve |
|---------|----------|----------|--------|
| Typecheck | `npm run typecheck` | PASS (exit 0) | `tsc --noEmit -p tsconfig.app.json` |
| Build | (pas réexécuté ce tour) | PASS antérieur | `npm run build` exit 0 (rapport triage 2026-11-08) |
| Lint | `npm run lint` | PASS (0 erreurs, 24 warnings) | ESLint sur 19 fichiers |
| Tests | `npx vitest run` | FAIL (70 pass / 17 fail, exit 1) | `useDashboardStats`: `loadModule is not a function` |

**Constat sur les tests** : les 17 échecs concernent tous `useDashboardStats` (`src/hooks/useDashboardStats.ts:60`) — le mock `loadModule` n'est pas lié dans le contexte de test. C'est un écart de couverture de test, pas un défaut métier avéré. Les 3 autres fichiers de test liés passent (selon le rapport de triage 2026-11-08).

**Référence importante** : main tel que commité (commit `ec11e14`) ne compile PAS — `src/pages/exploitation/CampagnesPage.tsx:173` lit `campaign.harvest_cycle`, une colonne déclarée uniquement dans le fichier non commité `src/lib/types.ts`. Le working tree (qui inclut `types.ts`) compile en exit 0. Voir `docs/reports/2026-11-08-triage-non-commites.md`.

---

## 3. Architecture et navigation (ce qui existe dans le code)

### 3.1 Routes et modules (src/routes/AppRoutes.tsx)

Toutes les routes métier sont sous `/app`, protégées par `RequireAuth` et `RequireModule(module, action)` :

| Route | Module | Action requise | Composant |
|-------|--------|----------------|-----------|
| `/app/dashboard` | — | (layout) | `Dashboard` |
| `/app/surveillance` | `surveillance` | `read` | `SurveillancePage` |
| `/app/exploitation/*` | `agriculture` | `read` | `ExploitationModule` (parcelles, campagnes, opérations, récoltes, journal) |
| `/app/elevage/*` | `livestock` | `read` | `ElevageModule` (lots, animaux, événements) |
| `/app/finance` | `finance` | `read` | `FinanceModule` (dépenses, financements, ventes, documents) |
| `/app/inventory` | `inventory` | `read` | `Inventory` |
| `/app/projects` | `projects` | `read` | `Projects` |
| `/app/suppliers` | `suppliers` | `read` | `Suppliers` |
| `/app/media` | `media` | `read` | `Media` |
| `/app/users` | `users` | `read` | `UsersPage` |
| `/app/configuration/*` | `configuration` | `read` | `Configuration` (clients, bailleurs, sites) |

Notes :
- `/app/ventes` redirige vers `/app/finance?tab=ventes` (pas de route dédiée : les ventes sont gérées dans le module Finance via `SalesModule`).
- `/app/reports`, `/app/alerts`, `/app/audit`, `/app/monitoring` redirigent tous vers `/app/surveillance`.
- Aucune route `/app/finance?tab=ventes` n'a de `RequireModule(action='write')` ; seule `read` est gardée au niveau route (constat de l'audit global 2026-11-07).

### 3.2 RBAC (src/lib/constants.ts:121-143, src/lib/rbac.ts)

8 rôles définis : `administrateur`, `propriétaire`, `financeur`, `gestionnaire`, `comptable`, `responsable_agricole`, `responsable_élevage`, `responsable_chantier`, `auditeur`. Matrice de permissions granulaire (read/write/delete/admin) par module.

Matrice extraite (audit global 2026-11-07, §13) :

| Rôle | finance read | finance write | agriculture read | ventes read | users |
|------|-------------|---------------|------------------|-------------|-------|
| administrateur | ✅ | ✅ | ✅ | ✅ | ✅ |
| propriétaire | ✅ | ✅ | ✅ | ✅ | ✅ (lecture) |
| financeur | ✅ | ✅ (son funder) | ❌ | ✅ | ❌ |
| comptable | ✅ (lecture seule) | ❌ | ✅ | ✅ | ❌ |
| auditeur | ✅ | ❌ | ✅ | ✅ | ✅ (lecture) |

**Écart d'autorisation** : l'écriture sur dépenses/financements est gardée côté client uniquement (`isAuthorized` dans `ExpensesTab.tsx:102`, `FundingsTab.tsx:197`), sans `RequireModule(action='write')` au niveau route (audit global 2026-11-07, §76).

---

## 4. Modèle de données (src/lib/types.ts)

Principales entités métier et leurs champs clefs :

| Entité | Champs clefs | Rattachement site/ferme |
|--------|--------------|-------------------------|
| `Farm` | id, name, location, country, currency, … | racine |
| `Site` | id, name, location, area_hectares, **farm_id**, code, status | farm_id (types.ts:180) |
| `Plot` | id, reference, name, **site_id**, area_hectares, current_crop, status | site_id |
| `Campaign` | id, year, **plot_id**, crop_name, budget, status, **site_id**, harvest_cycle | site_id + harvest_cycle (types.ts:200-210) |
| `CropOperation` | id, campaign_id, **plot_id**, type, cost, labor_cost, **site_id** | site_id |
| `Harvest` | id, campaign_id, **plot_id**, date, quantity, revenue, **site_id** | site_id |
| `Animal` | id, identifier, species, breed, **lot_id**, acquisition_value, weight_kg, status, **site_id** | site_id |
| `AnimalLot` | id, identifier, species, count, status, **site_id** | site_id |
| `AnimalEvent` | id, animal_id, lot_id, type, date, cost, responsible | — |
| `Expense` | id, reference, label, amount, category, supplier_id, status, **site_id**, funding_id | site_id |
| `Funding` | id, reference, amount_sent, currency_sent, amount_received, status, funder_id, **site_id** | site_id |
| `Sale` | id, reference, **site_id**, customer_id, total_amount, payment_method, status | site_id |
| `SaleItem` | sale_id, source_type ('harvest'\|'animal'\|'animal_lot'\|'inventory_item'), quantity, unit_price, total | — |
| `Customer` | id, **site_id**, name, type, total_purchases | site_id |
| `Supplier` | id, name, category, **site_id**, total_purchases, rating | site_id |
| `Project` | id, name, initial_budget, revised_budget, progress, status, **site_id** | site_id |
| `Budget` | id, object_type, object_id, initial_budget, committed_amount, paid_amount | — |
| `InventoryItem` / `Movement` / `Count` | stock, quantités, **site_id** | site_id |
| `Alert` | id, category, severity (low/medium/high), status, assigned_to | — |
| `SurveillanceEvent` | id, **farm_id**, type (phyto_traitement\|equip_panne), status, deleted_at, cost_amount | farm_id |
| `JournalEvent` | id, **farm_id**, event_type, entity_type, entity_id, amount, source_module, reverses_event_id | farm_id |
| `AuditLog` | id, user_name, action, object_type, object_id, old_value, new_value | — |
| `Notification`, `Document`, `Media`, `BankAccount`, `CashAccount`, `Transaction`, `Funder`, `SiteContent` | (voir types.ts) | — |

**Principes métier encodés dans le modèle** :
- `farm_id` / `site_id` sur la quasi-totalité des tables cœur (migration `20261108000001_add_farm_id_to_core_tables.sql` non commité dans le working tree).
- `source_module` dans `JournalEvent` : `'culture' \| 'elevage' \| 'chantier' \| 'finance'` (types.ts:514).
- `EventType` unifié (types.ts:516-520) couvrant campagne, élevage, chantier, finance.
- `JournalEvent.reverses_event_id` : support de réversal (annulation d'écriture).

---

## 5. Chargement des données (src/lib/DataContext.tsx)

Le `DataContext` charge 27 sources Supabase (DataContext.tsx:152-198) avec gestion d'erreur **par source** : une source en erreur n'annule pas les autres et conserve la dernière donnée valide (DataContext.tsx:264-265).

- **Sources globales** (toujours chargées au mount, DataContext.tsx:37-46) : `farm`, `users`, `funders`, `customers`, `siteContent`, `media`, `notifications`, `alerts`.
- **Sources par module** (DataContext.tsx:50-56) :
  - `dashboard` : `transactions`, `expenses`, `inventoryItems`, `projects`, `alerts`, `animals`, `animalLots`, `campaigns`
  - `exploitation` : `plots`, `sites`, `campaigns`, `cropOperations`, `harvests`
  - `finance` : `suppliers`, `documents`, `fundings`, `bankAccounts`, `cashAccounts`
  - `elevage` : `animals`, `animalLots`, `animalEvents`
  - `ventes` : `customers`
- `loadModule(moduleName)` ajoute automatiquement les sources globales (DataContext.tsx:345).
- `sourceStatus` : `idle \| loading \| success \| error` par source (DataContext.tsx:22).

**Règle de lecture** : une source non chargée retourne un tableau vide sans erreur — ne jamais afficher "Aucune donnée" ni KPI à 0 tant que les sources ne sont pas chargées (CLAUDE.md §9).

---

## 6. KPI métier (src/lib/kpi.ts, src/lib/constants.ts, CLAUDE.md §0)

7 KPI définis (CONTEXT.md:20-28) :

| KPI | Formule | Source |
|-----|---------|--------|
| Rendement (kg/ha) | quantité récoltée / surface parcelle | `calculateYield`, kpi.ts:9-33 |
| Avancement chantier (%) | étapes terminées / total étapes | `calculateProjectProgress`, kpi.ts:35-58 |
| Marge brute (XOF) | recettes - dépenses | `calculateGrossMargin`, kpi.ts:60-88 |
| Coût de revient (XOF/unité) | dépenses / quantité produite | `calculateCostPerUnit`, kpi.ts:90-135 |
| Taux de mortalité (%) | décès / (naissances + décès) × 100 | `calculateMortalityRate`, kpi.ts:137-163 |
| GMQ (g/jour) | poids / jours depuis naissance | `calculateAverageDailyGain`, kpi.ts:165-205 |
| Marge par culture (XOF) | recettes récoltes - (opérations + main-d'œuvre) | `calculateCampaignMargin`, kpi.ts:207-238 |

Tous les KPI financiers s'appuient sur `event_journal` (événements `recette` / `depense`), pas directement sur les tables `expenses`/`sales` — c'est une architecture de comptabilité par événements.

**Écart constaté** : `calculateMortalityRate` ne considère que `animal_ne` et `animal_mort` (kpi.ts:154-155), alors que les statuts animaux incluent aussi `vendu`, `transféré` (constants.ts:286). Le taux de mortalité exclut donc les animaux vendus/transférés du dénominateur.

---

## 7. Fonctionnalités métier par domaine (réalité constatée dans le code)

### 7.1 Finance — Dépenses (src/modules/Finance/tabs/ExpensesTab.tsx)

- Création, édition, suppression de dépenses avec Zod validation (`expenseSchema`, ExpensesTab.tsx:28-52).
- Référence auto-générée `EXP-...` via `generateEntityIdentifier` (ExpensesTab.tsx:177).
- Label auto : `"Catégorie - Fournisseur"` (ExpensesTab.tsx:181-183).
- Statuts : `brouillon`, `en attente`, `validée`, `payée`, `justifiée`, `clôturée`, `rejetée`, `annulée` (constants.ts:41-50).
- Lien financier idempotent sur `financial_links` (delete + insert) à l'édition (ExpensesTab.tsx:118-143).
- Audit log sur CREATE/UPDATE/DELETE via `logAudit` (ExpensesTab.tsx:233-241, 339-347).
- Popup de confirmation de suppression fermée dans un `finally` (ExpensesTab.tsx:356-358).
- KPIs du module : total dépenses, dépenses ce mois, avec justificatif, nombre de dépenses (ExpensesTab.tsx:366-368).
- Autorisation d'écriture : `isAuthorized` côté client uniquement (admin/propriétaire), pas de `RequireModule(action='write')` au niveau route.

### 7.2 Finance — Financements (src/modules/Finance/tabs/FundingsTab.tsx)

- Création, édition, suppression de financements avec Zod validation (`fundingSchema`, FundingsTab.tsx:25-38).
- Référence auto `FND-...`, devise par défaut FCFA, taux de change, frais de transfert.
- Statuts : `prévu`, `envoyé`, `en transit`, `reçu`, `partiellement reçu`, `annulé` (constants.ts:63-70).
- Montant envoyé vs montant reçu distingués (suivi du transfert).
- Lien financier idempotent sur `financial_links` (type `funding`).
- Audit log sur chaque action.
- KPIs : total financements, reçus, en attente, nombre (FundingsTab.tsx:443-445).
- Même modèle d'autorisation côté client uniquement que les dépenses.

### 7.3 Finance — Ventes (src/modules/Sales/SalesModule.tsx)

- Création, édition, suppression de ventes avec articles (`sale_items`), Zod validation (`saleSchema`, SalesModule.tsx:24-36).
- Au moins un article obligatoire ; description, quantité, unité, prix unitaire, total par article.
- Méthodes de paiement : espèces, virement, chèque, mobile money, carte.
- Statuts : `payée`, `partielle`, `en attente`, `annulée` (constants.ts:301).
- Onglets : `ventes`, `clients`, `par_mois` (CA mensuel, panier moyen).
- KPIs : chiffre d'affaires, nombre de ventes, panier moyen, clients actifs (SalesModule.tsx:148-164).
- Lien financier idempotent sur `financial_links` (type `sale`).
- **Écart** : pas de RLS scoped sur `sales`, pas de `RequireModule(action='write')` spécifique (audit global 2026-11-07, §80-81).

### 7.4 Agriculture / Exploitation

- `ParcellesPage` : gestion des parcelles (site, surface, culture actuelle, statut).
- `CampagnesPage` : campagnes liées à une parcelle, année, culture, budget, statut, `harvest_cycle`.
- `OperationsPage` : opérations culturales (type : préparation, labour, semis, fertilisation, traitement, irrigation, entretien, récolte, plantation — constants.ts:174-184), coûts, main-d'œuvre, intrants.
- `RecoltesPage` : récoltes (date, quantité, qualité, revenu estimé, destination).
- `JournalCulturePage` : journal culturel par parcelle.
- `LotsPage` : lots d'animaux (élevage, malgré le nom sous exploitation).

### 7.5 Élevage

- `AnimalManage` / `AnimauxPage` : animaux (identifiant, espèce, race, sexe, date de naissance, valeur d'acquisition, poids, statut, lot, mère, père).
- `LotsPage` : lots (identifiant, espèce, effectif, statut).
- `AnimalEventManage` : événements animaux (naissance, achat, vente, vaccination, traitement, pesée, transfert, reproduction, mort — constants.ts:186-196).
- KPIs élevage : taux de mortalité, GMQ (kpi.ts).

### 7.6 Surveillance

- `SurveillancePage` avec onglet `historique` : journal d'événements immuable (`event_journal`), triggers sur `expenses`, `harvests`, `sales`, `animal_events`, `tasks`.
- Table `surveillance_events` (type `phyto_traitement` / `equip_panne`, statut `planifie`/`en_cours`/`termine`/`annule`, `deleted_at` pour soft-delete).
- `Alert` : catégorie, sévérité (low/medium/high), statut, assigné.
- Onglet `alertes` accessible via `/app/alerts`, `/app/monitoring`.

---

## 8. Traçabilité, audit et sécurité

- **`logAudit`** (src/lib/types.ts:541-559) : insère dans `audit_logs` (user_name, action, object_type, object_id, description, old_value, new_value). Appelée dans ExpensesTab, FundingsTab, SalesModule.
- **`AuditLog`** type (types.ts:396-409) : `action`, `title`, `object_type`, `object_id`, `old_value`, `new_value`, `status`.
- **RLS least-privilege** : activé sur `fundings` et `expenses` (migration `20261103000001`), helpers `current_*` (SECURITY DEFINER + `row_security = off`), `FORCE ROW LEVEL SECURITY`.
- **Pas de RLS scoped sur `sales`** (audit global 2026-11-07, §80) — écart de sécurité.
- **Pas de `RequireModule(action='write')`** sur les onglets fundings/expenses (écriture gardée côté client seulement).

---

## 9. Écarts, cassures et manquants (réalité métier non couverte)

Ces éléments sont établis par preuve (code ou rapport), non par supposition :

1. **Tests en échec** : 17 tests en échec (`useDashboardStats`, `loadModule is not a function`), suite de tests non verte. La couverture de régression n'est pas fiable en l'état (audit global 2026-11-07, §72 ; triage 2026-11-08, §18).
2. **main ne compile pas tel que commité** : `CampagnesPage.tsx:173` lit `campaign.harvest_cycle` absent du type `Campaign` dans le commit `ec11e14` ; seul le fichier non commité `src/lib/types.ts` le déclare (triage 2026-11-08, §20-31). **main n'est pas reproductible en l'état.**
3. **Pas de RLS scoped sur `sales`** : ni sélection scoped, ni écriture scoped, ni `FORCE RLS` documenté (audit global 2026-11-07, §80-81).
4. **Écriture financière gardée côté client uniquement** : pas de `RequireModule(action='write')` sur fundings/expenses (audit global 2026-11-07, §76).
5. **`.env` non versionné** : pas de `.env.example` ; les variables d'environnement ne sont pas vérifiables en CI (audit global 2026-11-07, §84).
6. **Taux de mortalité exclut les vendus/transférés** du dénominateur (kpi.ts:154-155 vs constants.ts:286).
7. **Lint** : 24 warnings préexistants (react-hooks/exhaustive-deps, react-refresh/only-export-components), non bloquants (triage 2026-11-08, §15).
8. **Vague 3 non faite** : écran de restauration (corbeille) des événements archivés (`surveillance_events.deleted_at`) — TODO dans CONTEXT.md:45.

---

## 10. Ce qui est vérifié vs ce qui est supposé

| Affirmation | Statut | Preuve |
|-------------|--------|--------|
| Typecheck exit 0 | ✅ Vérifié | `npm run typecheck` exit 0 (cette session) |
| Lint 0 erreurs / 24 warnings | ✅ Vérifié | `npm run lint` (cette session) |
| Tests 70 pass / 17 fail | ✅ Vérifié | `npx vitest run` (cette session) |
| Build exit 0 | ✅ Antérieur | rapport triage 2026-11-08, §15 |
| main ne commité ne compile pas | ✅ Vérifié | triage 2026-11-08, §20-31 (clone propre) |
| Pas de RLS sur sales | ✅ Vérifié | audit global 2026-11-07, §80 |
| Pas de RequireModule write sur finance | ✅ Vérifié | audit global 2026-11-07, §76 |
| 7 KPI définis | ✅ Vérifié | kpi.ts + CONTEXT.md §0 |
| 8 rôles RBAC | ✅ Vérifié | constants.ts:121-131 |
| 27 sources DataContext | ✅ Vérifié | DataContext.tsx:152-198 |

---

## 11. Conclusion : la réalité métier de BAHKANso aujourd'hui

BAHKANSO est une application complète sur le plan fonctionnel (agriculture, élevage, finance, surveillance, traçabilité, RBAC multi-rôles, multi-sites) avec des fondations techniques solides (typecheck vert, build vert, RLS least-privilege sur les tables financières principales, journal d'événements immuable, audit log, composants de carte retournable cohérents).

Cependant, **elle n'est pas encore dans un état de livraison fiable** : la suite de tests est en échec (17 tests), `main` tel que commité ne compile pas (dépendance au `types.ts` non commité), il manque la RLS scoped sur les ventes, l'écriture financière n'est gardée que côté client, et il n'y a pas de `.env.example`. Ces écarts sont documentés avec preuve ci-dessus et doivent être résolus avant de considérer l'application comme prête pour la production.

---

**Sources de preuve consultées** : `src/routes/AppRoutes.tsx`, `src/lib/types.ts`, `src/lib/constants.ts`, `src/lib/DataContext.tsx`, `src/lib/kpi.ts`, `src/modules/Finance/tabs/ExpensesTab.tsx`, `src/modules/Finance/tabs/FundingsTab.tsx`, `src/modules/Sales/SalesModule.tsx`, `supabase/migrations/` (liste complète), `docs/CONTEXT.md`, `docs/reports/BAHKANSO_AUDIT_GLOBAL_2026-11-07.md`, `docs/reports/2026-11-08-triage-non-commites.md`, résultats de commandes `npm run typecheck`, `npm run lint`, `npx vitest run` (cette session).
