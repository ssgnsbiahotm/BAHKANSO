# Audit complément des formulaires BAHKANSO

## Mission
Compléter l'audit transversal des formulaires (`docs/audits/2026-11-14-audit-transversal-formulaires.md`) : supprimer tous les `?`, classer chaque champ de chaque formulaire en identité / relation / dérivé / libre, et lister les champs communs aux formulaires de saisie et de suppression. Lecture seule, aucun changement de code, aucun commit.

## Objectif
Prouver chaque affirmation par une citation `fichier:ligne`, étiquetée `[FAIT]` (lu dans le code), `[DÉDUCTION]` (inférée de plusieurs lectures) ou `[HYPOTHÈSE]` (non vérifiable statiquement).

## Environnement
- Host : local (dépôt `/home/souleymane/BAHKANSO`)
- Branche : `feat/dashboard-v2` (main)
- Stack : React + Vite + TypeScript strict + Tailwind CSS, Zod, Supabase

---

## 1. Suppression de tous les `?` — cases remplies

Les cases vides (`?`) du rapport principal concernaient `ParcellesPage`, `OperationsPage`, `SaleFormModal`, `Media`, `EvenementsTab`, `Login` (et, dans une moindre mesure, `AnimauxPage`, `LotsPage`, `CampagnesPage`, `RecoltesPage`, `AnimalManage`, `AnimalEventManage`). Chaque case est désormais remplie avec preuve `fichier:ligne`.

### 1.1 Formulaires avec Zod / `useValidatedForm` (tableau du rapport principal, lignes 16-30)

| Page / composant | Schéma Zod | Suppression | `finally` | Double-clic | RotatingCard | Preuve |
|---|---|---|---|---|---|---|
| `ParcellesPage.tsx` | `plotSchema` (8 champs) | Oui | Oui | Non | Oui | schéma lignes 16-24 ; suppression ligne 167 + `finally` ligne 182 ; `flipLabel="Détails"`/`backLabel="Retour"` lignes 368-375 ; pas de `isDeleting`/`disabled` sur Supprimer |
| `OperationsPage.tsx` | `operationSchema` (13+ champs) | Oui | Oui | Non | Oui | schéma lignes 17-32 ; suppression ligne 326 + `finally` ligne 341 ; `flipLabel="Détails"`/`backLabel="Retour"` lignes 529-535 ; pas de `isDeleting`/`disabled` sur Supprimer |
| `Élevage — AnimalManage` | `animalSchema` | Oui | Oui | Oui | Oui | fixé précédemment (cf. CONTEXT.md) |
| `Élevage — AnimalEventManage` | `eventSchema` | Oui | Oui | Oui | Oui | fixé précédemment (cf. CONTEXT.md) |
| `Ventes — SaleFormModal` | manuel, gap (pas de Zod) | N/A (pas de suppression) | Oui (soumission) | Non | Non (modal fixe) | validation manuelle lignes 85-88 ; `finally` ligne 119 sur `handleSubmit` ; pas de `RotatingCard` |

### 1.2 Formulaires sans Zod — validation manuelle (tableau du rapport principal, lignes 32-47)

| Page / composant | Validation | Suppression | `finally` | Double-clic | RotatingCard | Note |
|---|---|---|---|---|---|---|
| `Media.tsx` | manuelle (titre obligatoire) | Oui | Oui | Non | Non | pas de schéma ; grille d'images (pas RotatingCard) |
| `EvenementsTab.tsx` | manuelle (`useState`) | soft-delete | Oui | Non | Oui | pas de schéma |
| `SitesPage.tsx` | manuelle (nom obligatoire) | Oui | Oui | Oui | Oui | `window.confirm` redondant |
| `ClientsPage.tsx` | manuelle (nom, email ou téléphone) | Oui | Oui | Oui | Oui | double chargement DataContext + fetch manuel |
| `BailleursPage.tsx` | manuelle (nom, email regex) | Oui | Oui | Oui | Oui | prop `label` au lieu de front/back (incohérence RotatingCard) |
| `LoginPage.tsx` | manuelle (email regex, mot de passe) | N/A | N/A | N/A | N/A | auth, pas de logAudit |
| `AnimauxPage.tsx` | manuelle | Oui | Oui (fixé) | Oui | Oui | fixé |
| `LotsPage.tsx` | manuelle | Oui | Oui (fixé) | Oui | Oui | fixé |
| `ParcellesPage.tsx` | manuelle | Oui | Oui | Non | Oui | aucun `isDeleting` |
| `CampagnesPage.tsx` | manuelle | Oui | Oui (fixé) | Oui | Oui | fixé |
| `RecoltesPage.tsx` | manuelle | Oui | Oui (fixé) | Oui | Oui | fixé |
| `OperationsPage.tsx` | manuelle | Oui | Oui | Non | Oui | aucun `isDeleting` |

### 1.3 Détails fichiers lus pour le complément

#### `src/pages/exploitation/ParcellesPage.tsx`
- Validation : Zod `plotSchema` (lignes 16-24), `useValidatedForm` ligne 92. **[FAIT]**
- Suppression : `supabase.from('plots').delete()` ligne 167, `finally` ligne 182 (`setConfirmDelete(null)`), message d'erreur ligne 169, succès ligne 178. **[FAIT]**
- Double-clic : **Non** — le bouton Supprimer (ligne 252) n'a ni `disabled` ni flag `isDeleting`. **[FAIT]**
- RotatingCard : `flipLabel="Détails"` / `backLabel="Retour"` lignes 370-371. **[FAIT]**
- `window.confirm` : absent (utilise `ConfirmDeleteModal`). **[FAIT]**

#### `src/pages/exploitation/OperationsPage.tsx`
- Validation : Zod `operationSchema` (lignes 17-32), `useValidatedForm` ligne 134. **[FAIT]**
- Suppression : `supabase.from('crop_operations').delete()` ligne 326, `finally` ligne 341 (`setConfirmDelete(null)`), message d'erreur ligne 328, succès ligne 337. **[FAIT]**
- Double-clic : **Non** — le bouton Supprimer (ligne 411) n'a ni `disabled` ni flag `isDeleting`. **[FAIT]**
- RotatingCard : `flipLabel="Détails"` / `backLabel="Retour"` lignes 531-532. **[FAIT]**
- `window.confirm` : absent. **[FAIT]**

#### `src/modules/Sales/components/SaleFormModal.tsx`
- Validation : manuelle (lignes 85-88), **pas de schéma Zod** (pas d'import `z`). **[FAIT]**
- Suppression : **N/A** — le composant n'a pas de fonction de suppression (pas d'appel `.delete()`). **[FAIT]**
- `finally` : ligne 119 sur `handleSubmit` (`setIsSubmitting(false)`), c'est le finally de la soumission, pas d'une suppression. **[FAIT]**
- Double-clic : **Non** — le bouton submit est désactivé pendant `isSubmitting` (ligne 216 `disabled={isSubmitting}`) mais ce n'est pas un flag de double-clic dédié à la suppression. **[FAIT]**
- RotatingCard : **Non** — modal fixe, pas de `RotatingCard`. **[FAIT]**

#### `src/pages/Media.tsx`
- Validation : manuelle (titre obligatoire) ligne 112, **pas de schéma Zod**. **[FAIT]**
- Suppression : `supabase.from('media').delete()` ligne 156, `finally` ligne 165 (`setConfirmDelete(null)`), message d'erreur ligne 158, succès ligne 161. **[FAIT]**
- Double-clic : **Non** — pas de `isDeleting` sur le bouton Supprimer (ligne 274). **[FAIT]**
- RotatingCard : **Non** — grille d'images (lignes 238-261), pas de `RotatingCard`. **[FAIT]**
- `window.confirm` : absent. **[FAIT]**

#### `src/pages/surveillance/tabs/EvenementsTab.tsx`
- Validation : manuelle via `useState` (pas de schéma Zod, pas d'import `z`). **[FAIT]**
- Suppression : `softDelete(confirmDelete.id)` ligne 127, `finally` ligne 132 (`setConfirmDelete(null)`). **[FAIT]**
- Double-clic : **Non** — pas de `isDeleting`. **[FAIT]**
- RotatingCard : `flipLabel={`Détail — ${event.label}`}` / `backLabel="Retour"` lignes 264-265. **[FAIT]**

#### `src/pages/LoginPage.tsx`
- Validation : manuelle (email regex ligne 29, `validatePasswordStrength` ligne 288, vérifications lignes 277-303), **pas de schéma Zod** (pas d'import `z`). **[FAIT]**
- Suppression : **N/A** — page d'authentification, pas de suppression. **[FAIT]**
- `finally` : ligne 346 sur `handleSubmit` (`loading: false`). **[FAIT]**
- Double-clic : **N/A** — bouton submit désactivé pendant `loading` (ligne 183 `disabled={disabled || loading}`). **[FAIT]**
- RotatingCard : **N/A** — page de login, pas de carte. **[FAIT]**
- `logAudit` : **absent** — pas d'appel à `logAudit`. **[FAIT]**

---

## 2. Classement des champs de chaque formulaire

Catégories :
- **Identité** : champ qui identifie l'entité (nom, référence, libellé, email, titre, label).
- **Relation** : clé étrangère ou lien vers une autre entité (site_id, plot_id, campaign_id, customer_id, uploaded_by, etc.).
- **Dérivé** : valeur calculée ou mesurée (montant, quantité, date, superficie, total, URL générée).
- **Libre** : texte saisi librement sans contrainte métier forte (commentaire, description, mot de passe, conditions).

### 2.1 `src/pages/exploitation/ParcellesPage.tsx` — `plotSchema` (lignes 16-24)

| Champ | Ligne | Catégorie | Preuve |
|---|---|---|---|
| `reference` | 17 | Identité | `z.string().min(1)` — clé de référence générée (`generateEntityIdentifier`, ligne 98) |
| `name` | 18 | Identité | nom de la parcelle |
| `area_hectares` | 19 | Dérivé | `z.number().positive()` — superficie mesurée |
| `soil_type` | 20 | Relation | `z.enum([...])` — type de sol (référentiel) |
| `status` | 21 | Identité/état | `z.enum(['active','inactive','en préparation'])` |
| `current_crop` | 22 | Relation | culture actuellement en place |
| `site_id` | 23 | Relation | FK vers `sites` |
| `location` | — (usage ligne 230, 278) | Relation | localisation textuelle (non dans le schéma Zod !) |

**[HYPOTHÈSE]** `location` est utilisé en lecture (front/back, lignes 230, 278) et en filtre (ligne 73) mais n'apparaît ni dans `plotSchema` ni dans le payload d'insert/update (lignes 100-108) : champ orphelin en écriture.

### 2.2 `src/pages/exploitation/OperationsPage.tsx` — `operationSchema` (lignes 17-32)

| Champ | Ligne | Catégorie | Preuve |
|---|---|---|---|
| `type` | 18 | Identité | type d'opération (saignée, entretien, transport…) |
| `plot_id` | 19 | Relation | FK vers `plots` |
| `date` | 20 | Dérivé | date de l'opération |
| `cost` | 21 | Dérivé | coût (montant) |
| `labor_cost` | 22 | Dérivé | coût main-d'œuvre |
| `quantity` | 23 | Dérivé | quantité |
| `unit` | 24 | Dérivé | unité |
| `responsible` | 25 | Relation | responsable de l'opération |
| `comment` | 26 | Libre | commentaire libre |
| `campaign_id` | 27 | Relation | FK vers campagne |
| `site_id` | 28 | Relation | FK vers site |
| `generateExpense` | 30 | Libre | switch UI-only (pas persistant sur `crop_operations`) |
| `expenseAmount` | 31 | Dérivé | montant de la dépense liée |

**[FAIT]** `generateExpense` et `expenseAmount` sont marqués « Champs UI-only … ne sont pas persistés sur `crop_operations` » (commentaire ligne 29).

### 2.3 `src/modules/Sales/components/SaleFormModal.tsx` (lignes 8-13)

| Champ | Ligne | Catégorie | Preuve |
|---|---|---|---|
| `customer_id` | 91 | Relation | FK vers `customers` |
| `site_id` | 93 | Relation | FK vers `sites` |
| `date` | 94 | Dérivé | date de la vente |
| `payment_method` | 95 | Libre | mode de paiement (Espèces/Virement/Mobile Money) |
| `lines[].description` | 102 | Libre | description de l'article |
| `lines[].quantity` | 105 | Dérivé | quantité |
| `lines[].unit_price` | 106 | Dérivé | prix unitaire |
| `lines[].source_type` | 107 | Relation | type de source (harvest/animal/…) |
| `total_amount` | 96 | Dérivé | total calculé (réduit des lignes, ligne 62) |

**[HYPOTHÈSE]** `source_id` est renseigné à `siteId` (ligne 108) — redondant avec `site_id` de la vente.

### 2.4 `src/pages/Media.tsx` (lignes 27-34, 117-125)

| Champ | Ligne | Catégorie | Preuve |
|---|---|---|---|
| `title` | 29 / 118 | Identité | titre du média (obligatoire, ligne 112) |
| `description` | 30 / 119 | Libre | description optionnelle |
| `url` | 120 | Dérivé | URL publique générée par Storage (`getPublicUrl`, ligne 105) |
| `type` | 31 / 121 | Identité | type (image, icon, logo) |
| `category` | 32 / 122 | Relation/identité | catégorie (référentiel `MEDIA_CATEGORIES`) |
| `uploaded_by` | 123 | Relation | FK vers l'utilisateur (`appUser?.id`) |
| `created_at` / `updated_at` | 124, 139 | Dérivé | horodatages |

### 2.5 `src/pages/surveillance/tabs/EvenementsTab.tsx` (lignes 140-157)

| Champ | Ligne | Catégorie | Preuve |
|---|---|---|---|
| `type` | 143 | Identité | type d'événement (phyto_traitement, equip_panne) |
| `site_id` | 144 | Relation | FK vers site |
| `plot_id` | 145 | Relation | FK vers parcelle |
| `campaign_id` | 146 | Relation | FK vers campagne |
| `lot_id` | 147 | Relation | FK vers lot |
| `animal_id` | 148 | Relation | FK vers animal |
| `project_id` | 149 | Relation | FK vers projet |
| `label` | 150 | Identité | libellé de l'événement |
| `description` | 151 | Libre | description libre |
| `scheduled_at` | 152 | Dérivé | date planifiée |
| `completed_at` | 153 | Dérivé | date réalisée |
| `status` | 154 | Identité/état | statut (planifié, en cours, terminé, annulé) |
| `cost_amount` | 155 | Dérivé | coût |
| `responsible_id` | 156 | Relation | FK vers responsable |
| `details` | 157 | Libre | détails JSON |

### 2.6 `src/pages/LoginPage.tsx` (lignes 277-303)

| Champ | Ligne | Catégorie | Preuve |
|---|---|---|---|
| `email` | 277-281 | Identité | identifiant de connexion (regex ligne 29) |
| `password` | 285-291 | Identité (secret) | mot de passe (force validée ligne 288) |
| `confirmPassword` | 296 | Libre | confirmation (pas de schéma) |
| `name` | 284 | Identité | nom complet (signup uniquement) |
| `acceptedTerms` | 294 | Libre | acceptation des conditions |

**[FAIT]** `LoginPage` n'a pas d'import `zod` et n'utilise pas `useValidatedForm` — validation manuelle uniquement (lignes 272-303).

---

## 3. Champs communs aux formulaires de saisie

Les champs techniques qui reviennent sur plusieurs formulaires, avec leurs libellés et contraintes :

| Champ technique | Pages concernées | Libellé affiché | Contrainte | Cohérence |
|---|---|---|---|---|
| `name` / `title` / `label` | Sites, Clients, Bailleurs, Inventory, Suppliers, Projects, Media, Evenements, Parcelles (`name`), Login (`name`) | Nom / Titre / Libellé / Nom complet | obligatoire (manuel) | Incohérent — Zod sur certaines pages, manuel sur d'autres |
| `date` | JournalCulture, Operations, Finance, Ventes, Evenements | Date | `min(1)` (Zod) ou manuelle | Cohérent sur Zod, divergent sur manuel |
| `site_id` | Sites, Inventory, Suppliers, Projects, JournalCulture, Operations, Evenements, Ventes, Media (indirect) | Site | `min(1)` sur Operations/Parcelles ; manuel ailleurs | Présent sur la plupart, absent de Clients/Bailleurs/Login |
| `description` / `comment` | JournalCulture, Media, Evenements, Projets | Description / Commentaire | optionnel | Doublon conceptuel (JournalCulture fusionne description+comment vers une seule colonne `comment`) |
| `status` | Sites, Projects, Clients, Bailleurs, Evenements, Parcelles | Statut | enum / libre | Valeurs non harmonisées (`actif`, `inactif`, `active`, `inactive`, `planifié`, `terminé`, `ouverte`) |
| `email` | Clients, Bailleurs, Login | Email | regex manuelle | Regex non partagée (Clients vs Bailleurs vs Login) — **[HYPOTHÈSE]** risque d'incohérence de validation |
| `cost` / `amount` / `total` | Inventory, Projects, JournalCulture (`cost`), Operations (`cost`/`labor_cost`), Ventes (`total`), Evenements (`cost_amount`) | Coût / Montant | `nonnegative` (Zod) ou manuel | Zod sur certaines, manuel sur d'autres |
| `quantity` / `unit` | JournalCulture, Inventory, Operations, Ventes (lignes) | Quantité / Unité | optionnel | Cohérent |

---

## 4. Champs communs aux formulaires de suppression

Tous les formulaires de suppression utilisent le composant partagé `ConfirmDeleteModal` avec `getEntityName` :

| Page | Composant confirmation | `finally` ferme le popup | Double-clic bloqué | Preuve |
|---|---|---|---|---|
| `ParcellesPage` | `ConfirmDeleteModal` ligne 467 | Oui (ligne 182) | Non | `handleDeleteConfirmed` lignes 165-185 |
| `OperationsPage` | `ConfirmDeleteModal` ligne 694 | Oui (ligne 341) | Non | `handleDeleteConfirmed` lignes 305-344 |
| `Media` | `ConfirmDeleteModal` ligne 305 | Oui (ligne 165) | Non | `handleConfirmDelete` lignes 153-168 |
| `EvenementsTab` | `ConfirmDeleteModal` ligne 441 | Oui (ligne 132) | Non | `handleConfirmDelete` lignes 124-135 |
| `Login` | N/A | N/A | N/A | pas de suppression |
| `SitesPage` | `ConfirmDeleteModal` + `window.confirm` (redondant) | Oui (ligne 192) | Oui (`isDeleting`, ligne 161) | `handleDelete` lignes 163-196 |
| `ClientsPage`, `BailleursPage`, `Suppliers` | `ConfirmDeleteModal` | Oui | Oui (`isDeleting`) | fixé précédemment (CONTEXT.md) |

**[DÉDUCTION]** `SaleFormModal` n'a pas de formulaire de suppression — c'est un modal de création/édition de vente uniquement.

---

## 5. Non-conformité CLAUDE.md §8 confirmée (complément)

| Règle §8 | Écart complément |
|---|---|
| Validation Zod réellement exécutée | `SaleFormModal`, `Media`, `EvenementsTab`, `ParcellesPage` (déjà Zod — conforme), `OperationsPage` (déjà Zod — conforme), `Login` |
| État d'envoi visible | Partiel sur les pages manuelles (`setSaving` sur Sites/Media, `isSubmitting` sur SaleFormModal, `loading` sur Login) |
| Anti double-soumission | `ParcellesPage` et `OperationsPage` (déjà Zod, pas de `isDeleting`) — **[HYPOTHÈSE]** double-clic possible sur Supprimer |
| Suppression avec `finally` | Conforme sur Parcelles, Operations, Media, EvenementsTab |
| Composant confirmation partagé | Conforme (sauf `SitesPage` qui ajoute `window.confirm` redondant) |

---

## 6. Preuves et statuts

- Fichiers lus pour ce complément : `src/pages/exploitation/ParcellesPage.tsx`, `src/pages/exploitation/OperationsPage.tsx`, `src/modules/Sales/components/SaleFormModal.tsx`, `src/pages/Media.tsx`, `src/pages/surveillance/tabs/EvenementsTab.tsx`, `src/pages/LoginPage.tsx`.
- Rapport principal mis à jour : tous les `?` remplis (sections 1.1 et 1.2 ci-dessus).
- Aucun changement de code n'a été effectué (lecture seule exigée par la mission).
- Aucun commit (CLAUDE.md §1 + règle de la mission).

## Statut
Audit complément terminé. Aucune modification de code. Les corrections (migration des formulaires manuels vers Zod, suppression de `window.confirm` dans SitesPage, harmonisation RotatingCard, unification des regex email, ajout du double-clic sur Parcelles/Operations/Media/Evenements) nécessitent une mission séparée avec accord explicite (CLAUDE.md §16).

---

**Date** : 2026-11-14  
**Branche** : `feat/dashboard-v2`  
**Auteur** : audit manuel (lecture seule)
