# Audit de conformité : formulaires → triggers → journal → KPIs

Date : 2026-11-06
Branche : main
Commit : 8458174
Auteur : Claude Code (agent) + validation humaine

## Contexte

Un utilisateur a signalé que le formulaire d'événements animaux ne propose pas l'option "Mort", l'obligeant à choisir "Autres". Conséquence : le KPI de taux de mortalité est faussé (toujours à 0).

Objectif de l'audit : vérifier, pour chaque module (Cultures, Élevage, Chantiers, Finance), que la chaîne
Formulaire → Trigger `log_event()` → Table `event_journal` → KPI est cohérente, et lister les écarts.

## Méthode

Pour chaque module, on compare cinq surfaces :
1. Les types d'événements métier possibles (selon le type `EventType` de `src/lib/types.ts:509-513`).
2. Les options réellement présentes dans le formulaire (`src/pages/...` ou `src/modules/...`).
3. Les types d'événements traités par le trigger `log_event()` (migrations `2026110600000*`).
4. Les types d'événements lus par les KPIs (`src/lib/kpi.ts`).
5. Les écarts constatés.

## Tableau récapitulatif des écarts

| Module | Table source | Options formulaire | Types trigger (`log_event`) | Types lus par KPI | Écart |
|--------|-------------|-------------------|----------------------------|-------------------|-------|
| Élevage | `animal_events` | vaccination, traitement, maladie, naissance, vente, achat, **autre** | `NEW.type` (reflète le formulaire) | `naissance`, `mort` | ❌ "mort" absent du formulaire et du trigger → taux de mortalité toujours 0 |
| Cultures (récolte) | `harvests` | (pas de select de type) | `recolte` | `recolte` (+ `entity_type='harvest'`) | ✅ cohérent |
| Cultures (opérations) | `crop_operations` | semis, traitement, engrais, désherbage, perte, récolte, autre | **aucune branche** pour `crop_operations` | calcul local (pas event_journal) | ❌ opérations culturales jamais journalisées |
| Finance (dépense) | `expenses` | (pas de select de type métier) | `depense` | `depense` | ✅ cohérent |
| Finance (vente) | `sales` | (pas de select de type métier) | `recette` | `recette` | ✅ cohérent |
| Chantiers | `project_steps` | **pas de formulaire dédié** pour les étapes | `etape_terminee` (guard `farm_id IS NOT NULL` bloquant) | aucun KPI lié | ❌ trigger inopérant (pas de lien projet→ferme) + pas de formulaire d'étapes |

## Constats détaillés par module

### 1. Élevage (le plus urgent)

**Formulaire** — `src/pages/AnimalEventManage.tsx:54-62` :
```tsx
const TYPE_OPTIONS = [
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'traitement', label: 'Traitement' },
  { value: 'maladie', label: 'Maladie' },
  { value: 'naissance', label: 'Naissance' },
  { value: 'vente', label: 'Vente' },
  { value: 'achat', label: 'Achat' },
  { value: 'autre', label: 'Autre' },
] as const;
```
→ L'option `mort` est absente. L'utilisateur doit choisir "Autre".

**Trigger** — `supabase/migrations/20261106000002_event_journal_triggers_livestock.sql:80-101` :
```sql
IF TG_TABLE_NAME = 'animal_events' THEN
  ...
  INSERT INTO public.event_journal (
    ...
    event_type, ...
  ) VALUES (
    ..., NEW.type, ...
  );
```
→ Le trigger écrit `NEW.type` tel quel. Puisque le formulaire ne propose pas `mort`, le journal ne recevra jamais `mort`.

**KPI** — `src/lib/kpi.ts:154-156` :
```ts
const relevant = data.filter(
  (e) => e.event_type === 'naissance' || e.event_type === 'mort'
);
const deaths = relevant.filter((e) => e.event_type === 'mort').length;
```
→ Le KPI filtre sur `mort`, mais aucune ligne n'a ce `event_type` dans le journal.

**Écart confirmé** : "Mort" existe dans le KPI (et dans le type canonique `animal_mort` de `types.ts:511`) mais pas dans le formulaire, donc pas dans le trigger, donc le taux de mortalité est systématiquement faux (0).

### 2. Cultures — récoltes (`harvests`)

**Formulaire** — `src/pages/exploitation/RecoltesPage.tsx` : pas de select de type d'événement ; une saisie de récolte crée une ligne `harvests`.

**Trigger** — `20261106000001_event_journal_triggers_culture_sales.sql:42-57` : écrit `event_type = 'recolte'`, `entity_type = 'harvest'`.

**KPI** — `calculateYield` (`kpi.ts:19-24`) : filtre `event_type = 'recolte'` et `entity_type = 'harvest'`.

**Verdict** : ✅ cohérent. Aucun écart.

### 3. Cultures — opérations culturales (`crop_operations`)

**Formulaire** — `src/pages/exploitation/JournalCulturePage.tsx:385-392` :
`semis`, `traitement`, `engrais`, `desherbage`, `perte`, `recolte`, `autre`.

**Trigger** — aucune branche `crop_operations` dans `log_event()` (ni dans `000000`, `000001`, `000002`, ni `000003`).

**KPI** — calculé localement dans le composant (`JournalCulturePage.tsx:102-108`) à partir de `crop_operations` et `harvests`, pas depuis `event_journal`. Aucun KPI global dans `kpi.ts` ne lit les opérations culturales.

**Verdict** : ❌ écart. Les opérations culturales ne sont jamais journalisées dans `event_journal`.

### 4. Finance — dépenses (`expenses`)

**Formulaire** — `src/modules/Finance/tabs/ExpensesTab.tsx` : pas de select de type métier ; une dépense est une dépense.

**Trigger** — `20261106000000_event_journal_triggers.sql:22-36` : écrit `event_type = 'depense'`.

**KPI** — `calculateGrossMargin` (`kpi.ts:80-84`) : filtre `event_type = 'depense'`.

**Verdict** : ✅ cohérent. Aucun écart.

### 5. Finance — ventes (`sales`)

**Formulaire** — `src/modules/Sales/components/SaleFormModal.tsx` : pas de select de type métier ; une vente est une vente.

**Trigger** — `20261106000001_event_journal_triggers_culture_sales.sql:60-76` : écrit `event_type = 'recette'`.

**KPI** — `calculateGrossMargin` (`kpi.ts:80-84`) : filtre `event_type = 'recette'`.

**Verdict** : ✅ cohérent. Aucun écart.

### 6. Chantiers — étapes (`project_steps`)

**Formulaire** : aucun formulaire dédié pour créer/modifier des `project_steps` trouvé (seul `Projects.tsx` gère les projets, pas les étapes).

**Trigger** — `20261106000003_event_journal_trigger_tasks.sql:110-129` : écrit `etape_terminee` mais avec le guard `v_farm_id IS NOT NULL`. Or `v_farm_id := NULL` car il n'y a pas de lien projet → ferme dans le schéma actuel. L'insertion est bloquée.

**KPI** : aucun KPI lié aux chantiers dans `kpi.ts`.

**Verdict** : ❌ écart. Le trigger est présent mais inopérant (farm_id toujours NULL), et il n'existe pas de formulaire d'étapes de chantier.

### 7. Incohérence de nommage (types canoniques)

`src/lib/types.ts:509-513` définit un type `EventType` canonique :
- Élevage : `animal_achete`, `animal_ne`, `animal_vendu`, `animal_mort`, `soin_applique`, `aliment_distribue`, `production`
- Cultures : `campagne_ouverte`, `semis`, `intrant_applique`, `traitement`, `recolte`, `campagne_cloturee`
- Chantiers : `chantier_ouvert`, `tache_terminee`, `chantier_receptionne`
- Finance : `depense`, `recette`, `financement_recu`, `remboursement`

Ces noms ne correspondent ni aux valeurs du formulaire élevage (`naissance`, `vente`, `achat`, `autre`), ni à ce que le trigger écrit (`NEW.type`), ni à ce que les KPI lisent (`naissance`, `mort`, `recolte`, `depense`, `recette`). C'est une incohérence de nommage qui doit être harmonisée, mais elle n'est pas à l'origine du bug signalé.

## Conclusion

L'écart fonctionnel à l'origine du bug est bien celui de l'élevage : l'option "Mort" (`mort`) est absente du formulaire d'événements animaux, donc jamais écrite dans `event_journal`, donc le KPI `calculateMortalityRate` ne compte aucun décès.

## Décisions humaines requises

1. Valider que la valeur à insérer dans le journal pour un animal mort doit être `mort` (pour correspondre au filtre du KPI) ou bien adapter le KPI à la valeur choisie.
2. Valider si les opérations culturales (`crop_operations`) doivent être journalisées dans `event_journal` (ajout d'une branche dans `log_event()`).
3. Valider si le déclencheur chantier (`project_steps`) doit être rendu effectif (ajout d'un lien projet → ferme).

## Fichiers modifiés

Aucun (audit en lecture seule).

## Prochaine étape

Appliquer la correction de l'élevage : ajouter l'option "Mort" dans `TYPE_OPTIONS` de `AnimalEventManage.tsx` et s'assurer que le trigger enregistre bien `animal_mort` (ou `mort` selon la décision n°1) quand cette option est choisie.
