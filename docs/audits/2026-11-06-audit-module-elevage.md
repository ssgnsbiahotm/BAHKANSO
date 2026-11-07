# Audit module Élevage — 2026-11-06

## 📊 Résumé exécutif

Le module Élevage s'articule autour de 2 référentiels parallèles (nouveau sous `/app/elevage`, ancien sous `/app/exploitation`) et 3 écrans (Animaux, Lots, Événements) avec cartes rotatives. Le bug signalé est **confirmé** : l'option "Mort" est absente du formulaire d'événements (`TYPE_OPTIONS` ne liste que `naissance, achat, vente, vaccination, traitement, maladie, achat, autre`), le trigger écrit `NEW.type` tel quel, et le KPI `calculateMortalityRate` filtre sur `'mort'` — le taux de mortalité est donc systématiquement 0.

Constats clés : 6 valeurs différentes pour un décès sur 4 surfaces (`animal_mort`, `décédé`, `mortalité`, `autre`, `NEW.type`, `'mort'`), absence de CHECK constraints en base, `actor_id` toujours NULL dans le journal pour les événements animaux, aucun trigger sur `animals`/`animal_lots`, et déconnexion avec le module Finance (vente non transformée en recette).

**Écarts : 🔴 2 critiques, 🟠 4 importants, 🟡 3 améliorations, ⚪ 2 décisions métier.**

---

## ✅ Ce qui fonctionne bien

| Élément | Preuve |
|---------|--------|
| RBAC sur les routes élevage | `src/routes/AppRoutes.tsx:237` `<RequireModule module="livestock" action="read">` |
| Redirections legacy → nouveau module | `src/routes/AppRoutes.tsx:269-277` (`/livestock`, `/exploitation/lots`, `/agriculture/animaux` → `/app/elevage`) |
| Log d'audit (`logAudit`) sur CRUD animaux/lots/événements | `AnimalManage.tsx:168,173,250,274` ; `AnimauxPage.tsx:78` ; `LotsPage.tsx:73` ; `AnimalEventManage.tsx:124,129,209` |
| `log_event()` est `SECURITY DEFINER` + `row_security = off` (FORCE RLS contournée proprement) | `supabase/migrations/20261106000002_event_journal_triggers_livestock.sql:14-19` |
| Garde-fou de vérification `row_security = off` et absence de `current_setting` | migrations `000000` à `000003`, bloc `DO $$` final |
| `calculateMortalityRate` lit bien `event_journal` avec filtre `farm_id` et dates | `src/lib/kpi.ts:137-163` |
| Cartes rotatives `flipLabel`/`backLabel` rendues | `AnimauxPage.tsx:320-321`, `LotsPage.tsx:302-303`, `AnimalManage.tsx:506-507` |

---

## 🗺️ Inventaire

### Écrans du module Élevage

| Écran | Fichier | Route | Role RBAC | Actions |
|-------|---------|-------|-----------|---------|
| ElevageModule (page mère, onglets) | `src/pages/elevage/ElevageModule.tsx:43` | `/app/elevage` | `livestock:read` | navigation onglets |
| Onglet Vue d'ensemble | `ElevageModule.tsx` (index) | `/app/elevage` | `livestock:read` | — |
| Onglet Lots | `ElevageModule.tsx` | `/app/elevage/lots` | `livestock:read` | voir lots |
| Onglet Animaux | `ElevageModule.tsx` | `/app/elevage/animaux` | `livestock:read` | voir animaux |
| Onglet Événements | `ElevageModule.tsx` | `/app/elevage/evenements` | `livestock:read` | voir événements |
| AnimauxPage (legacy) | `src/pages/exploitation/AnimauxPage.tsx:16` | `/app/exploitation/animaux` | — | créer, éditer, supprimer |
| LotsPage (legacy) | `src/pages/exploitation/LotsPage.tsx:16` | `/app/exploitation/lots` | — | créer, éditer, supprimer |
| AnimalEventManage | `src/pages/AnimalEventManage.tsx` | `/app/elevage/evenements` | — | créer, éditer, supprimer événements |
| AnimalManage | `src/pages/AnimalManage.tsx:107` | (dans élevage) | — | créer, éditer, supprimer, déclarer décès |

### Formulaires

| Formulaire | Fichier | Champs clés | Validation |
|------------|---------|-------------|------------|
| Créer/éditer animal (nouveau) | `AnimalManage.tsx:147-181` | identifier, name, species, breed, date_of_birth, sex, weight_kg, status, location, mother_id, father_id | zod `animalSchema` (lignes 26-46) |
| Créer/éditer animal (legacy) | `AnimauxPage.tsx:206-251` | identifier, species, breed, sex, birth_date, estimated_value, status | état React (pas de zod) |
| Créer/éditer lot (legacy) | `LotsPage.tsx:195-233` | identifier, species, breed, count, location, estimated_value, status | état React (pas de zod) |
| Créer/éditer événement animal | `AnimalEventManage.tsx` | type, date, animal_id, lot_id, cost, description, responsible | — (à confirmer) |
| Modal déclarer décès | `AnimalManage.tsx:256-278` | type='mortalité', date, animal_id, cost:0, description | aucun |

### Cartes rotatives (RotatingCard)

| Composant | Fichier | flipLabel | backLabel | Usage |
|-----------|---------|-----------|-----------|-------|
| AnimalCard | `src/modules/Exploitation/components/AnimalCard.tsx:28` | "Détails" | "Retour" | carte animal legacy |
| LotCard | `src/modules/Exploitation/components/LotCard.tsx:29` | "Détails" | "Retour" | carte lot legacy |
| RotatingCard en ligne (Animaux) | `AnimauxPage.tsx:318-324` | "Détails" | "Retour" | grille animaux legacy |
| RotatingCard en ligne (Lots) | `LotsPage.tsx:300-306` | "Détails" | "Retour" | grille lots legacy |
| RotatingCard en ligne (AnimalManage) | `AnimalManage.tsx:394-508` | "Détails" | "Retour" | grille animaux nouveau |

### Tests

| Test | Fichier | Couvre l'élevage ? |
|------|---------|--------------------|
| Dashboard | `src/pages/Dashboard.test.tsx` | partiel (KPIs globaux) |
| useDashboardStats | `src/hooks/useDashboardStats.test.ts` | partiel |
| useSurveillance | `src/hooks/useSurveillance.test.ts` | non |
| FormField | `src/components/ui/FormPrimitives/FormField.test.tsx` | non |

**Aucun test unitaire dédié aux écrans Animaux/Lots/Événements ni au KPI de mortalité.**

---

## 🔗 Matrice de cohérence (champs critiques)

| Champ | UI (options) | Zod / TS enum | SQL CHECK | Trigger attend | KPI impacté | Statut |
|-------|-------------|---------------|-----------|----------------|-------------|--------|
| `event_type=naissance` | `TYPE_OPTIONS` (AnimalEventManage.tsx:55) | `ANIMAL_EVENT_TYPES` (constants.ts:187) | **aucune** | `NEW.type` tel quel (mig 000002:91) | `calculateMortalityRate` (kpi.ts:155) | ❌ incohérence (UI ≠ canonique `animal_ne`) |
| `event_type=vente` | `TYPE_OPTIONS` (AnimalEventManage.tsx:58) | `ANIMAL_EVENT_TYPES` (constants.ts:189) | **aucune** | `NEW.type` tel quel | `calculateGrossMargin` lit `recette` (kpi.ts:81) | ❌ pas de lien vers `sales` |
| `event_type=achat` | `TYPE_OPTIONS` (AnimalEventManage.tsx:57) | `ANIMAL_EVENT_TYPES` (constants.ts:188) | **aucune** | `NEW.type` tel quel | `calculateGrossMargin` lit `depense` (kpi.ts:84) | ❌ pas de lien vers `expenses` |
| `event_type=mort` / `mortalité` | **absent** de `TYPE_OPTIONS` ; `mortalité` dans modal décès (AnimalManage.tsx:258) | `ANIMAL_EVENT_TYPES` contient `mortalité` (constants.ts:195) ; canonique `animal_mort` (types.ts:511) | **aucune** | `NEW.type` tel quel | `calculateMortalityRate` filtre `'mort'` (kpi.ts:158) | 🔴 **CRITIQUE — taux toujours 0** |
| `status=deceased` / `décédé` | `STATUS_OPTIONS` inclut `deceased` (AnimalManage.tsx:78) ; `ANIMAL_STATUSES` = `décédé` (constants.ts:286) | `zod.enum` inclut `deceased` (AnimalManage.tsx:40) | **aucune** | n'écrit pas dans `event_journal` (pas de trigger sur `animals`) | `calculateMortalityRate` ne lit pas `animals.status` | ❌ incohérence `deceased` vs `décédé` |
| `actor_id` journal | — | `JournalEvent.actor_id` nullable (types.ts:523) | — | `NULL` toujours (animal_events sans created_by) (mig 000002:95) | — | ⚪ attribution impossible |
| `lot_id` animal | `lot_id` dans `Animal` (types.ts:253) | — | — | contexte `lot_id` (mig 000002:99) | — | — |

**Preuves SQL CHECK :** `grep -rn "CHECK" supabase/migrations/*animals* supabase/migrations/*animal*` → **aucune contrainte CHECK** trouvée sur les tables élevage.

---

## 🔴 Écarts critiques (preuves)

### E1 — Option "Mort" absente du formulaire d'événements → KPI mortalité toujours 0

- **Preuve 1 (UI)** : `src/pages/AnimalEventManage.tsx:54-62` — `TYPE_OPTIONS` = `['vaccination','traitement','maladie','naissance','vente','achat','autre']`. Aucune valeur `mort`.
- **Preuve 2 (modal décès)** : `src/pages/AnimalManage.tsx:258` — `type: 'mortalité'` (valeur différente de `'mort'` attendue par le KPI).
- **Preuve 3 (trigger)** : `supabase/migrations/20261106000002_event_journal_triggers_livestock.sql:91` — `event_type, ... NEW.type`. Le trigger reflète exactement la valeur saisie ; comme aucune ne vaut `mort`, aucune ligne n'est jamais insérée avec `event_type='mort'`.
- **Preuve 4 (KPI)** : `src/lib/kpi.ts:154-158` — filtre `e.event_type === 'naissance' || e.event_type === 'mort'`, puis compte `deaths` sur `=== 'mort'`.
- **Conséquence** : `calculateMortalityRate` retourne systématiquement 0.

### E2 — 6 valeurs différentes pour un décès sur 4 surfaces (incohérence de nomenclature)

| Surface | Valeur pour un décès | Fichier:ligne |
|---------|---------------------|---------------|
| Type canonique `EventType` | `animal_mort` | `types.ts:511` |
| Statut animal (zod) | `deceased` | `AnimalManage.tsx:40` |
| `ANIMAL_STATUSES` (constants) | `décédé` | `constants.ts:286` |
| Formulaire événements | `autre` (pas de mort) | `AnimalEventManage.tsx:48` |
| Modal décès | `'mortalité'` | `AnimalManage.tsx:258` |
| KPI mortalité | `'mort'` | `kpi.ts:158` |

Aucune correspondance documentée entre ces 6 valeurs.

---

## 🟠 Écarts importants (preuves)

### I1 — Pas de CHECK constraint en base sur `event_type` / `status`

- **Preuve** : `grep -rn "CHECK" supabase/migrations/*animals* supabase/migrations/*animal*` → aucune contrainte. La cohérence repose uniquement sur l'UI et le zod (côté client), contournable via l'API directe.

### I2 — `actor_id` toujours NULL dans `event_journal` pour les événements animaux

- **Preuve** : `supabase/migrations/20261106000002_event_journal_triggers_livestock.sql:95` — `actor_id, ... NULL`. La table `animal_events` n'a pas de colonne `created_by` (types.ts:281 `responsible: string | null` existe mais n'est pas utilisée pour `actor_id`).
- **Conséquence** : impossible d'attribuer un événement journalisé à un utilisateur.

### I3 — Pas de trigger `log_event` sur `animals` et `animal_lots`

- **Preuve** : seules 4 branches dans `log_event()` : `expenses`, `harvests`, `sales`, `animal_events` (migrations `000000` à `000002`). Aucune branche `animals` ni `animal_lots`.
- **Conséquence** : création/modification d'un animal ou d'un lot n'est pas tracée dans `event_journal` (uniquement dans `audit_logs` via `logAudit`).

### I4 — Incohérence `birth_date` vs `date_of_birth` dans le KPI GMQ

- **Preuve** : `src/lib/kpi.ts:183` — `.select('id, weight_kg, birth_date')` alors que le formulaire et le type utilisent `date_of_birth` (types.ts:247-248, AnimalManage.tsx:156).
- **Conséquence** : `calculateAverageDailyGain` (GMQ) peut retourner `null` si la colonne `birth_date` n'existe pas.

### I5 — Vente d'animal non reliée au module Finance (pas de recette `sales`)

- **Preuve** : `AnimalEventManage.tsx` `TYPE_OPTIONS` inclut `vente` (ligne 58) mais aucune création de ligne `sales` ni mise à jour `expenses`. Le KPI `calculateGrossMargin` lit `event_type='recette'`/`'depense'` (kpi.ts:81-84) qui ne sont jamais générés par un événement animal.

### I6 — Déconnexion lot → animal (orphelins)

- **Preuve** : `Animal.lot_id` (types.ts:253) existe, mais `LotsPage.handleDeleteConfirmed` supprime un lot sans vérifier ni réaffecter les animaux associés (`LotsPage.tsx:67-84`). Aucun contrôle d'intégrité.

---

## 🟡 Améliorations

### A1 — Deux implémentations de carte animale avec statuts différents

- `AnimalCard.tsx:13-24` mappe `actif`/`inactif`/`quarantaine` ; `AnimalManage.tsx:87-95` mappe `healthy`/`sick`/`recovering`/`quarantined`/`sold`/`deceased`/`pregnant`. Vocabulaire divergent.

### A2 — Pas d'écran de création de lot dédié dans le nouveau module

- Le bouton "Nouveau lot" dans `ElevageModule.tsx:106` navigue vers `/app/elevage/lots`, mais `LotsPage.tsx` réside sous `/app/exploitation/lots` (legacy). Pas de composant de création de lot sous `src/pages/elevage/`.

### A3 — Modal décès : coût et date ignorés

- `AnimalManage.tsx:261` — `cost: 0` en dur (le champ `deathCost` saisi n'est pas envoyé) ; `date: new Date()` forcé (pas de champ date de décès).

---

## ⚪ Décisions métier

### D1 — Valeur d'événement à adopter pour un décès

Choisir entre `animal_mort` (type canonique `types.ts:511`), `mort` (filtre KPI actuel `kpi.ts:158`), ou `mortalité` (`ANIMAL_EVENT_TYPES` constants.ts:195), puis aligner formulaire, modal décès, trigger et KPI sur cette unique valeur.

### D2 — Persistance du coût et de la date de décès

Valider si le coût saisi (`deathCost`) et une date de décès explicite doivent être stockés dans `animal_events` (actuellement `cost: 0` et `new Date()` forcés).

---

## 🧪 Couverture de test

- Aucun test unitaire dédié aux écrans `AnimauxPage`, `LotsPage`, `AnimalEventManage`, `AnimalManage`.
- Aucun test sur `calculateMortalityRate`.
- Les tests existants couvrent partiellement `Dashboard` et `useDashboardStats` (KPIs globaux, pas la mortalité spécifique).

---

## 🔗 Liens avec autres modules

| Module cible | Lien depuis l'élevage | Statut |
|-------------|----------------------|--------|
| Finance | vente animal → `sales` (recette) | ❌ absent (I5) |
| Finance | achat animal / soin → `expenses` (dépense) | ❌ absent |
| Cultures | alimentation (fourrage) → intrants | ❌ absent |
| Chantiers | bâtiments d'élevage → `project_steps` | ❌ absent |
| Surveillance | mort → alerte | ❌ absent |

---

## 🎯 Plan de correction (3 vagues)

### Vague 1 — Bug mortalité (critique, immédiat)

1. Ajouter l'option `mort` dans `TYPE_OPTIONS` de `AnimalEventManage.tsx` (ou renommer `mortalité` → `mort` dans la modal `AnimalManage.tsx`).
2. Aligner le KPI `calculateMortalityRate` et le type canonique `EventType` sur la valeur retenue (décision D1).
3. Vérifier que le trigger enregistre bien la valeur retenue (il écrit déjà `NEW.type`, donc cohérent si l'UI envoie la bonne valeur).

### Vague 2 — Cohérence et traçabilité (important)

4. Persister le coût et la date de décès dans la modal (décision D2) — `AnimalManage.tsx:256-278`.
5. Remplacer `actor_id = NULL` par l'utilisateur connecté (ajouter `created_by` sur `animal_events` ou passer l'actor).
6. Ajouter des triggers `log_event` sur `animals` et `animal_lots`.
7. Corriger `calculateAverageDailyGain` : `birth_date` → `date_of_birth`, exclure animaux `deceased`.

### Vague 3 — Liens inter-modules et qualité (amélioration)

8. Relier vente animal → recette Finance (`sales`).
9. Créer le composant de formulaire de lot pour `/app/elevage/lots`.
10. Ajouter des CHECK constraints en base sur `event_type` et `status`.
11. Unifier le vocabulaire des cartes rotatives (AnimalCard vs AnimalManage).

---

## 📝 Annexe — Preuves techniques

Extrait `TYPE_OPTIONS` (`src/pages/AnimalEventManage.tsx:54-62`) :
```ts
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

Extrait modal décès (`src/pages/AnimalManage.tsx:257-264`) :
```ts
type: 'mortalité',
date: new Date().toISOString().split('T')[0],
animal_id: deathAnimal?.id || null,
cost: 0,
```

Extrait trigger (`supabase/migrations/20261106000002_event_journal_triggers_livestock.sql:90-96`) :
```sql
INSERT INTO public.event_journal (
  farm_id, occurred_at, event_type, entity_type, entity_id,
  actor_id, amount, currency, source_module, context
) VALUES (
  v_farm_id, NEW.date, NEW.type, 'animal', NEW.animal_id,
  NULL, COALESCE(NEW.cost, 0), 'XOF', 'elevage', ...
);
```

Extrait KPI mortalité (`src/lib/kpi.ts:154-158`) :
```ts
const relevant = data.filter(
  (e) => e.event_type === 'naissance' || e.event_type === 'mort'
);
const deaths = relevant.filter((e) => e.event_type === 'mort').length;
```

Extrait type canonique (`src/lib/types.ts:509-513`) :
```ts
export type EventType =
  | 'campagne_ouverte' | 'semis' | 'intrant_applique' | 'traitement' | 'recolte' | 'campagne_cloturee'
  | 'animal_achete' | 'animal_ne' | 'animal_vendu' | 'animal_mort' | 'soin_applique' | 'aliment_distribue' | 'production'
  ...
```

Extrait constantes (`src/lib/constants.ts:186-196`, `:286-287`) :
```ts
export const ANIMAL_EVENT_TYPES = ['naissance','achat','vente','vaccination','traitement','pesée','transfert','reproduction','mortalité'];
export const ANIMAL_STATUSES = ['actif', 'vendu', 'décédé', 'transféré'] as const;
```

Extrait routes (`src/routes/AppRoutes.tsx:235-242`) :
```tsx
path: 'elevage',
<RequireModule module="livestock" action="read">
{ index: true, element: <Navigate to="/app/elevage/lots" replace /> },
```

---

**Fichiers modifiés : aucun** (audit en lecture seule, aucun commit).

**Prochaine étape : ** appliquer la Vague 1 (ajout de l'option "Mort" + alignement KPI/type canonique) après validation des décisions D1 et D2.
