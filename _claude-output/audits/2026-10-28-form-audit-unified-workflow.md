# BAHKANSO — Audit des formulaires de création & Workflow unifié recommandé

**Date :** 2026-10-28  
**Mission :** Audit complet de tous les formulaires de création/modification, analyse croisée, proposition d'un workflow unifié optimal

---

## 1. État des lieux — 3 patterns coexistants

| Pattern | Fichiers concernés | Composants clés | Validation |
|---------|-------------------|-----------------|------------|
| **A — FormSimplifie** | `ParcellesPage`, `CampagnesPage`, `OperationsPage`, `RecoltesPage` | `FormSimplifie`, `FormGroup`, `Accordion`, Zod schema externe | Schema passé en prop, `onSubmit` callback |
| **B — useValidatedForm direct** | `AnimalManage`, `CropOperationManage`, `HarvestManage`, `AnimalLotManage`, `AnimalEventManage`, `CampaignManage`, `PlotManage` | `useValidatedForm` hook, Zod schema inline, `handleSubmit` manuel | Hook interne, `safeParse` à la soumission |
| **C — useState inline simple** | `Suppliers`, `Projects` | `useState` brut, validation manuelle `if (!form.name.trim())` | Aucune lib validation |

**Total : 15+ fichiers avec formulaires CRUD**

---

## 2. Analyse comparative détaillée

### 2.1 Structure des modals (création/édition)

| Fichier | Modal unique ? | États modal | Fermeture auto après succès | Refresh auto |
|---------|---------------|-------------|----------------------------|--------------|
| ParcellesPage | ✅ 1 modal création/édition | `modalOpen`, `editPlot` | ✅ `setModalOpen(false)` | ✅ `refresh()` |
| CampagnesPage | ✅ 1 modal | `modalOpen`, `editCampaign` | ✅ | ✅ |
| OperationsPage | ✅ 1 modal | `modalOpen`, `editOperation` | ✅ | ✅ |
| RecoltesPage | ✅ 1 modal | `modalOpen`, `editHarvest` | ✅ | ✅ |
| AnimalManage | ✅ 1 modal | `modalOpen`, `editAnimal` | ✅ | ✅ |
| CropOperationManage | ✅ 1 modal | `modalOpen`, `editOperation` | ✅ | ✅ |
| HarvestManage | ✅ 1 modal | `modalOpen`, `editHarvest` | ✅ | ✅ |
| AnimalLotManage | ✅ 1 modal | `modalOpen`, `editLot` | ✅ | ✅ |
| AnimalEventManage | ✅ 1 modal | `modalOpen`, `editEvent` | ✅ | ✅ |
| CampaignManage | ✅ 1 modal | `modalOpen`, `editCampaign` | ✅ | ✅ |
| PlotManage | ✅ 1 modal | `modalOpen`, `editPlot` | ✅ | ✅ |
| Suppliers | ✅ 1 modal | `modalOpen`, `editSupplier` | ✅ | ✅ |
| Projects | ✅ 1 modal | `modalOpen`, `editProject` | ✅ | ✅ |

**Constat :** Tous utilisent le pattern **1 modal unique pour création + édition** avec état `editX` null/objet. C'est cohérent.

### 2.2 Gestion du formulaire (valeurs + erreurs)

| Pattern | État valeurs | État erreurs | Réinitialisation | Type-safety |
|---------|--------------|--------------|------------------|-------------|
| **FormSimplifie** | `form` state local + `onChange` prop | Géré par composant (affichage auto) | Via `onCancel` callback | Zod schema prop → inference partielle |
| **useValidatedForm** | `values` du hook + `setFieldValue` | `errors` objet du hook | `setForm` champ par champ dans `openCreate/openEdit` | **Total** (inférence `z.infer`) |
| **useState inline** | `form` objet unique | Aucun (validation ad-hoc) | `setForm(emptyForm())` | **Aucun** (any) |

### 2.3 Soumission & effets de bord

| Pattern | Async handler | Try/catch | Toast succès/erreur | Audit log | Refresh |
|---------|---------------|-----------|---------------------|-----------|---------|
| FormSimplifie | Callback `onSubmit` async | ✅ dans callback | ✅ | ✅ | ✅ |
| useValidatedForm | `handleSubmit` manuel async | ✅ | ✅ | ✅ | ✅ |
| useState inline | `handleSubmit` async | ✅ | ✅ | ✅ | ✅ |

**Constat :** Logique métier (Supabase + Audit + Toast + Refresh) **identique** partout, seule la couche validation diffère.

### 2.4 Suppression

| Fichier | Confirmation | Modal dédié ? | Refresh | Audit log |
|---------|-------------|---------------|---------|-----------|
| Tous | `window.confirm` OU `confirmDelete` state + Modal | Mixte : certains Modal dédié (AnimalEventManage, Suppliers, Projects), d'autres `window.confirm` (Agriculture, ParcellesPage) | ✅ | ✅ |

**Incohérence mineure** : 2 patterns de confirmation coexistent.

### 2.5 Affichage liste + actions (Recto/Verso)

| Fichier | Composant carte | Actions verso | Pattern |
|---------|----------------|---------------|---------|
| Agriculture (parcelles) | `RotatingCard` | 3 boutons : Journal, Modifier, Supprimer | **Nouveau standard** |
| Livestock | `RotatingCard` | 3 boutons : Journal, Modifier, Supprimer | **Aligné sur Agriculture** |
| ParcellesPage | `ParcelleCard` (wrapper RotatingCard) | Via props `onEdit`/`onDelete`/`onViewDetail` | Délégué au parent |
| AnimalManage | Tableau + boutons inline | Modifier/Supprimer inline | Classique |
| AnimalEventManage | `RotatingCard` | 3 boutons : Détails, Modifier, Supprimer | Cohérent |
| Suppliers | Carte simple (`rotatable-card` CSS) | Modifier/Supprimer inline | Sans flip |
| Projects | Carte simple (`rotatable-card` CSS) | Modifier/Supprimer inline | Sans flip |

---

## 3. Forces et faiblesses de chaque pattern

### Pattern A — FormSimplifie (Exploitation)

| ✅ Forces | ❌ Faiblesses |
|----------|--------------|
| Séparation claire : schema Zod **extérieur** au composant | `FormSimplifie` impose sa structure (FormGroup, Accordion) |
| `FormGroup` / `Accordion` = DX excellente pour champs organisés | Réutilisabilité limitée aux formulaires "similaires" |
| Validation déléguée au wrapper | Type-safety incomplète (schema passé en prop, pas inféré) |
| `onSubmit` / `onCancel` callbacks clairs | Couplage fort au design system (classes CSS spécifiques) |

### Pattern B — useValidatedForm (Gestion directe)

| ✅ Forces | ❌ Faiblesses |
|----------|--------------|
| **Type-safety totale** : `z.infer<typeof schema>` → `EventFormValues` | Boilerplate : `setForm` champ par champ dans `openCreate`/`openEdit` |
| Hook réutilisable, logique validation encapsulée | `handleSubmit` dupliqué (safeParse + toast + supabase + audit + refresh) |
| Flexibilité totale du JSX (pas de wrapper imposé) | Erreurs affichées manuellement (`errors.field && <p>{errors.field}</p>`) |
| Schema Zod **inline** = colocalisé avec le composant | Pas de structure imposée → divergence possible |

### Pattern C — useState inline (Suppliers, Projects)

| ✅ Forces | ❌ Faiblesses |
|----------|--------------|
| Zéro dépendance, simple | **Aucune validation déclarative** |
| Contrôle total | Duplication massive de logique (validation, toast, audit, refresh) |
| | Pas de type-safety formulaire |
| | Difficile à maintenir/étendre |

---

## 4. Workflow unifié recommandé

### 4.1 Principe directeur

> **Standardiser sur : `useValidatedForm` (Pattern B) + Composants UI partagés pour l'affichage erreurs/champs**
> 
> Rationale : Meilleure type-safety, réutilisabilité du hook, flexibilité JSX, cohérence avec l'existant majoritaire (7/13 fichiers).

### 4.2 Architecture cible

```
┌─────────────────────────────────────────────────────────────────┐
│  Page Module (ex: AnimalManage, ParcellesPage)                 │
│  ├─ useData() → { entities, refresh }                          │
│  ├─ useAuth() → { appUser }                                    │
│  ├─ useToast()                                                 │
│  ├─ useValidatedForm(schema, { defaultValues, onSubmit })     │
│  │     └─ Retourne: values, setFieldValue, errors, isSubmitting│
│  ├─ États UI: modalOpen, editEntity, confirmDelete, detailEntity│
│  └─ Handlers: openCreate, openEdit, handleSubmit, handleDelete │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Composants UI partagés à créer/standardiser

| Composant | Responsabilité | Remplace |
|-----------|----------------|----------|
| `FormField` | Label + Input/Select/Textarea + Affichage erreur (`errors.field`) | `<label>...<input>...{errors.field && <p>}` manuel |
| `FormSection` | Wrapper `<fieldset>` avec titre optionnel | `<div className="space-y-4"><h3>...</h3>` |
| `FormActions` | Boutons Annuler / Soumettre (loading state) | Footer Modal dupliqué partout |
| `ConfirmDeleteModal` | Modal suppression standardisée | 3 variantes actuelles |
| `DetailModal` | Modal fiche lecture seule standardisée | Dupliqué (AnimalEventManage, Projects, ParcellesPage) |

### 4.4 Hook `useValidatedForm` — API enrichie suggérée

```typescript
// src/components/ui/ValidatedForm.tsx — EXTENSION PROPOSÉE
interface UseValidatedFormOptions<T> {
  schema: z.ZodSchema<T>;
  defaultValues: T;
  onSubmit: (values: T) => Promise<void>;
  // NOUVEAU : reset automatique après succès
  resetOnSuccess?: boolean;
  // NOUVEAU : callback succès/erreur pour toast/audit/refresh centralisés
  onSuccess?: (values: T, isEdit: boolean) => void;
  onError?: (error: Error) => void;
}

function useValidatedForm<T>({
  schema,
  defaultValues,
  onSubmit,
  resetOnSuccess = true,
  onSuccess,
  onError,
}: UseValidatedFormOptions<T>) {
  // ... implémentation existante +
  // handleSubmit appelle onSubmit, puis onSuccess/onError, puis reset si resetOnSuccess
}
```

### 4.5 Pattern de page canonique (template)

```tsx
// TEMPLATE : src/pages/[Module]Manage.tsx
import { useValidatedForm } from '@/components/ui/ValidatedForm';
import { FormField, FormSection, FormActions, ConfirmDeleteModal, DetailModal } from '@/components/ui/FormPrimitives';
import { Modal } from '@/components/ui/Modal';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/types';
import { useToast } from '@/lib/Toast';
import * as z from 'zod';

// 1. Schema Zod COLOCALISÉ (source de vérité unique)
const entitySchema = z.object({
  // champs...
});
type EntityFormValues = z.infer<typeof entitySchema>;

// 2. Default values TYPÉS
const DEFAULT_VALUES: EntityFormValues = { /* ... */ };

export function ModuleManage() {
  const { entities, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();

  // 3. États UI minimaux
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntity, setEditEntity] = useState<Entity | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Entity | null>(null);
  const [detailEntity, setDetailEntity] = useState<Entity | null>(null);

  // 4. Hook validation + soumission UNIFIÉE
  const { values: form, setFieldValue: setForm, errors, isSubmitting } = useValidatedForm({
    schema: entitySchema,
    defaultValues: DEFAULT_VALUES,
    onSubmit: async (values) => {
      const payload = { /* mapping values → DB */ };
      if (editEntity) {
        await supabase.from('table').update(payload).eq('id', editEntity.id);
        await logAudit(appUser?.name, 'UPDATE', 'table', editEntity.id, `...`);
        toast.show('Modifié');
      } else {
        await supabase.from('table').insert(payload);
        await logAudit(appUser?.name, 'CREATE', 'table', null, `...`);
        toast.show('Créé');
      }
      refresh();
    },
    onSuccess: () => setModalOpen(false),
    onError: (err) => toast.show('Erreur: ' + err.message, 'error'),
  });

  // 5. Helpers ouverture/fermeture
  const openCreate = () => { setEditEntity(null); setModalOpen(true); };
  const openEdit = (e: Entity) => { 
    setEditEntity(e); 
    Object.entries(e).forEach(([k, v]) => setForm(k as keyof EntityFormValues, v));
    setModalOpen(true); 
  };
  const handleDelete = async () => { /* ... */ refresh(); };

  // 6. Rendu : Liste (RotatingCard standard) + Modals (création/édition, détail, suppression)
  return (
    <>
      <PageHeader actions={<CreateButton onClick={openCreate} />} />
      <EntityGrid entities={entities} onEdit={openEdit} onDelete={handleDelete} onView={setDetailEntity} />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editEntity ? 'Modifier' : 'Créer'}>
        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
          <FormSection title="Essentiel">
            <FormField label="Nom *" error={errors.name}>
              <input value={form.name} onChange={e => setForm('name', e.target.value)} />
            </FormField>
            {/* ... autres champs ... */}
          </FormSection>
          <FormActions onSubmit={form.handleSubmit} isSubmitting={isSubmitting} onCancel={() => setModalOpen(false)} />
        </form>
      </Modal>
      <DetailModal entity={detailEntity} onClose={() => setDetailEntity(null)} onEdit={openEdit} onDelete={handleDelete} />
      <ConfirmDeleteModal entity={confirmDelete} onConfirm={handleDelete} onClose={() => setConfirmDelete(null)} />
    </>
  );
}
```

---

## 5. Plan de migration progressif (sans casser l'existant)

| Phase | Action | Fichiers impactés | Risque |
|-------|--------|-------------------|--------|
| **1. Créer primitives** | `FormField`, `FormSection`, `FormActions`, `ConfirmDeleteModal`, `DetailModal` dans `src/components/ui/FormPrimitives/` | Nouveaux fichiers | **Aucun** (additif) |
| **2. Enrichir `useValidatedForm`** | Ajouter `onSuccess`/`onError`/`resetOnSuccess` + `isSubmitting` | `src/components/ui/ValidatedForm.tsx` | Faible (rétrocompatible) |
| **3. Migrer Pattern C → B** | `Suppliers.tsx`, `Projects.tsx` → `useValidatedForm` + primitives | 2 fichiers | Faible (logique métier inchangée) |
| **4. Migrer Pattern A → B** | `ParcellesPage`, `CampagnesPage`, `OperationsPage`, `RecoltesPage` → `useValidatedForm` + primitives (conserver `Accordion` si besoin via `FormSection`) | 4 fichiers | Moyen (changement structurel formulaire) |
| **5. Harmoniser confirmations suppression** | Remplacer tous les `window.confirm` par `ConfirmDeleteModal` | Agriculture, ParcellesPage, etc. | Faible |
| **6. Standardiser cartes liste** | Généraliser `RotatingCard` 3-boutons (Journal/Modifier/Supprimer) ou `EntityGrid` réutilisable | Selon modules | Moyen (UX) |

---

## 6. Décisions clés à valider

| Question | Recommandation | Alternative |
|----------|----------------|-------------|
| **Schema Zod : inline ou fichier partagé ?** | **Inline** dans chaque page (colocalisation) | Fichier `schemas/` partagé si réutilisé cross-pages |
| **FormSimplifie : déprécier ou garder ?** | **Déprécier** pour nouveaux formulaires, migrer l'existant à terme | Garder pour `Accordion` complexe (ParcellesPage) |
| **Modal détail : unifié ou spécialisé ?** | **Unifié** (`DetailModal` générique + render prop pour champs spécifiques) | Un par module (existant) |
| **RotatingCard vs Tableau** | **RotatingCard** pour grilles (mobile-first), **Tableau** pour listes denses (>5 colonnes) | Selon densité info |
| **`useAsyncAction` (Projects) : garder ?** | **Oui** pour actions complexes multi-étapes, sinon `useValidatedForm` suffit | Remplacer partout par `useValidatedForm` |

---

## 7. Estimation effort

| Tâche | Complexité | Temps estimé |
|-------|------------|--------------|
| Créer `FormPrimitives` (5 composants) | Moyenne | 2-3h |
| Étendre `useValidatedForm` | Faible | 1h |
| Migrer Suppliers + Projects | Faible | 1-2h |
| Migrer 4 pages Exploitation | Moyenne | 3-4h |
| Harmoniser confirmations + cartes | Faible | 1-2h |
| **Total** | | **8-12h** |

---

## 8. Conclusion

**Le pattern `useValidatedForm` (B) est le meilleur candidat standard** : il offre la type-safety TypeScript/Zod la plus forte, encapsule la logique de validation, et laisse la liberté du JSX. Les 7 pages l'utilisant déjà prouvent sa viabilité.

**Prochaine étape recommandée** : Créer le dossier `src/components/ui/FormPrimitives/` avec les 5 composants partagés, puis étendre `useValidatedForm` avec les callbacks `onSuccess`/`onError`. Cela débloquera une migration propre des 2 pages Pattern C puis des 4 pages Pattern A.

---

*Rapport généré automatiquement suite à l'audit croisé des 15+ formulaires BAHKANSO.*