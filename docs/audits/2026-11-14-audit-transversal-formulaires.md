# Audit transversal des formulaires BAHKANSO

## Mission
Analyser l'harmonie et la cohérence de tous les formulaires de l'application BAHKANSO, croiser leurs champs, identifier les écarts de validation et de comportement, et formuler des recommandations de correction.

## Objectif
Dresser un inventaire exhaustif des formulaires (pages de saisie/édition), classer par mode de validation (Zod/useValidatedForm vs manuel), relever les champs communs et les incohérences, et vérifier la conformité aux règles CLAUDE.md §8 (validation, état d'envoi, anti double-soumission, erreurs, saisie préservée, suppression avec `finally`, double-clic).

## Environnement
- Host : local (dépôt `/home/souleymane/BAHKANSO`)
- Branche : `feat/dashboard-v2` (main)
- Stack : React + Vite + TypeScript strict + Tailwind CSS, Zod, Supabase

## Formulaires inventoriés

### Avec Zod / `useValidatedForm` (conforme CLAUDE.md §8)

| Page / composant | Schéma Zod | Suppression | `finally` | Double-clic | RotatingCard |
|---|---|---|---|---|---|
| `Inventory.tsx` | `itemSchema` (8 champs) | Oui | Oui | Oui | Oui |
| `Suppliers.tsx` | `supplierSchema` (8 champs) | Oui | Oui | Oui | Non |
| `Projects.tsx` | `projectSchema` (9 champs) | Oui | Oui | Oui | Non (CSS 3D manuel) |
| `JournalCulturePage.tsx` | `operationSchema` (migré) | Oui | Oui | Oui | Oui |
| Finance — ExpensesTab | `expenseSchema` | Oui | Oui | Oui | ? |
| Finance — FundingsTab | `fundingSchema` | Oui | Oui | Oui | ? |
| Finance — TreasuryTab | `transactionSchema` | Oui | Oui | Oui | ? |
| Finance — DocumentsTab | `documentSchema` | Oui | Oui | Oui | ? |
| Ventes — SaleFormModal | (manuel, gap) | N/A | Oui | Non | Non |
| Élevage — AnimalManage | `animalSchema` | Oui | Oui | Oui | Oui |
| Élevage — AnimalEventManage | `eventSchema` | Oui | Oui | Oui | Oui |

### Sans Zod — validation manuelle (écart CLAUDE.md §8)

| Page / composant | Validation | Suppression | `finally` | Double-clic | RotatingCard | Note |
|---|---|---|---|---|---|---|
| `Media.tsx` | manuelle (titre obligatoire) | Oui | Oui | Non | Non | pas de schéma |
| `EvenementsTab.tsx` | manuelle (`useState`) | soft-delete | Oui | Non | Oui | pas de schéma |
| `SitesPage.tsx` | manuelle (nom obligatoire) | Oui | Oui | Oui | Oui | `window.confirm` redondant |
| `ClientsPage.tsx` | manuelle (nom, email ou téléphone) | Oui | Oui | Oui | Oui | double chargement DataContext + fetch manuel |
| `BailleursPage.tsx` | manuelle (nom, email regex) | Oui | Oui | Oui | Oui | prop `label` au lieu de front/back (incohérence RotatingCard) |
| `LoginPage.tsx` | manuelle (email regex, mot de passe) | N/A | N/A | N/A | N/A | auth, pas de logAudit |
| `AnimauxPage.tsx` | manuelle | Oui | Oui (fixé) | Oui | Oui | `setConfirmDelete` au lieu de `setDetail*` (fixé) |
| `LotsPage.tsx` | manuelle | Oui | Oui (fixé) | Oui | Oui | `window.confirm` retiré (fixé) |
| `ParcellesPage.tsx` | manuelle | Oui | Oui | Non | Oui | |
| `CampagnesPage.tsx` | manuelle | Oui | Oui (fixé) | Oui | Oui | |
| `RecoltesPage.tsx` | manuelle | Oui | Oui (fixé) | Oui | Oui | |
| `OperationsPage.tsx` | manuelle | Oui | Oui | Non | Oui | |

### Sans formulaire de saisie (lecture seule, hors scope formulaire)

- `Dashboard.tsx` — KPIs, priorités, activités, dernières opérations (lecture seule via `useDashboardStats`)
- `DashboardV2.tsx` — synthèse, tendance, actions (lecture seule via `useDashboardData`)
- `AlertesTab.tsx` — pas de formulaire de saisie, règles automatiques, résolution d'alertes uniquement

## Champs croisés (champs communs entre formulaires)

Les champs suivants reviennent sur plusieurs formulaires, avec des libellés et contraintes parfois divergents :

| Champ technique | Pages concernées | Libellé affiché | Contrainte | Cohérence |
|---|---|---|---|---|
| `name` | Sites, Clients, Bailleurs, Inventory, Suppliers, Projects, Media, Élevage | Nom / Nom du site / Nom du client / Nom du bailleur | obligatoire (souvent manuel) | Incohérent — certains obligatoires Zod, d'autres manuels |
| `date` | JournalCulture, Operations, Finance (transactions), Ventes | Date | obligatoire (Zod `min(1)`) | Cohérent sur les pages Zod |
| `description` / `comment` | JournalCulture (description+comment), Media, Evenements, Projets | Description / Commentaire | optionnel | Doublon conceptuel (JournalCulture fusionne description et comment) |
| `site_id` | Sites, Inventory, Suppliers, Projects, JournalCulture, Evenements | Site | optionnel | Présent sur la plupart, absent de Clients/Bailleurs |
| `status` | Sites, Projects, Clients, Bailleurs, Evenements | Statut | enum / libre | Valeurs non harmonisées (`actif`, `inactif`, `en cours`, `terminé`, `ouverte`) |
| `email` | Clients, Bailleurs, Login | Email | regex manuelle | Regex non partagée (Clients vs Bailleurs vs Login) |
| `phone` / téléphone | Clients, Bailleurs, Sites | Téléphone | optionnel | Pas de contrainte commune |
| `cost` / montant | Inventory, Projects, JournalCulture (cost), Finance | Coût / Montant | `nonnegative` (Zod) | Zod sur certaines, manuel sur d'autres |
| `quantity` / `unit` | JournalCulture, Inventory | Quantité / Unité | optionnel | Cohérent |

### Doublons et notes de champs

- **JournalCulturePage** : `description` et `comment` sont deux champs distincts dans le formulaire mais envoyés tous deux vers la même colonne `comment` en base (lignes 139 et 143 du payload) — redondance à clarifier.
- **BailleursPage** : utilise la prop `label` sur `<RotatingCard>` au lieu de `flipLabel`/`backLabel` — incohérence avec tous les autres appelants de `RotatingCard` (corrigé ailleurs, cf. mémoire `rotating-card-labels-fixed`).
- **SitesPage** : `window.confirm` redondant en plus du `ConfirmDeleteModal` partagé — viole la règle « utiliser le composant de confirmation partagé existant ».
- **ClientsPage** : double chargement (`loadModule('finance')` + `loadModule('exploitation')` + fetch manuel) — source orpheline et chargement redondant.

## Non-conformité CLAUDE.md §8 (règles action / formulaire)

Règle : validation (Zod) réellement exécutée ; état d'envoi visible ; anti double-soumission ; erreurs traitées et affichées ; saisie conservée en cas d'échec ; succès annoncé après confirmation ; données actualisées après succès. Suppression : popup se ferme dans un `finally`, liste mise à jour, message d'erreur en cas d'échec, double clic bloqué, composant de confirmation partagé.

| Règle §8 | Pages conformes | Pages non conformes / écart |
|---|---|---|
| Validation Zod réellement exécutée | Inventory, Suppliers, Projects, JournalCulture, 4 tabs Finance, AnimalManage, AnimalEventManage | Media, EvenementsTab, Sites, Clients, Bailleurs, Login, Animaux, Lots, Parcelles, Campagnes, Recoltes, Operations |
| État d'envoi visible | Inventory, Suppliers, Projects, JournalCulture, Finance tabs | Pages manuelles (état `setSaving` partiel, pas toujours visible) |
| Anti double-soumission | Suppliers, Bailleurs, Sites (`isDeleting`), Clients | Partiel sur les autres |
| Erreurs affichées | Toutes (toast) | — |
| Saisie conservée en échec | Pages Zod (ValidatedForm) | Pages manuelles (état local conservé, OK) |
| Suppression avec `finally` | Inventory, Suppliers, Projects, JournalCulture, Bailleurs, Clients, Sites, Animaux, Lots, Campagnes, Recoltes | EvenementsTab (soft-delete), Media (vérifier) |
| Double-clic bloqué | Suppliers, Bailleurs, Sites, Clients, Animaux, Lots, Campagnes, Recoltes, Projects | Partiel |
| Composant confirmation partagé | Bailleurs, Clients, Projects, Sites, Inventory, Suppliers, JournalCulture | SitesPage a aussi `window.confirm` redondant |

## Incohérences d'interface (RotatingCard)

Règle CLAUDE.md §7 : un seul composant `RotatingCard`, props `flipLabel`/`backLabel`, jamais `label`. Style et rotation identiques dans tous les modules.

- **Conforme** : Inventory, Suppliers (pas de RotatingCard mais cohérent), Projects (CSS 3D manuel — dérogation à valider), JournalCulture, Sites, EvenementsTab, Media (pas de RotatingCard, grille d'images), Dashboard.
- **Non conforme / à vérifier** : BailleursPage utilise `label={f.name}` au lieu de `flipLabel`/`backLabel` (incohérence signalée).
- **Dérogation** : Projects utilise des cartes CSS 3D manuelles au lieu de `RotatingCard` — justifiée ou non, à documenter.

## Recommandations (prioritaires)

1. **Migrer les formulaires manuels vers Zod/`useValidatedForm`** (priorité haute) : Media, EvenementsTab, Sites, Clients, Bailleurs, Animaux, Lots, Parcelles, Campagnes, Recoltes, Operations, Login (si formulaire de création compte). C'est le plus grand écart de cohérence.
2. **Supprimer `window.confirm` dans SitesPage** et utiliser uniquement `ConfirmDeleteModal` (règle §8).
3. **Harmoniser la prop RotatingCard** : remplacer `label` par `flipLabel`/`backLabel` dans BailleursPage.
4. **Unifier les regex email** entre Clients, Bailleurs et Login (ou extraire un helper partagé).
5. **Clarifier le doublon `description`/`comment`** dans JournalCulturePage (deux champs, une colonne base).
6. **Supprimer le double chargement** dans ClientsPage (fetch manuel app_users en plus de DataContext).
7. **Documenter la dérogation Projects** (cartes CSS 3D vs `RotatingCard`) ou migrer vers `RotatingCard`.
8. **Vérifier EvenementsTab** (soft-delete, pas de vrai formulaire Zod, suppression logique).

## Preuves
- Fichiers lus cette session : `src/pages/Dashboard.tsx`, `src/pages/DashboardV2.tsx`, `src/pages/exploitation/JournalCulturePage.tsx`, `src/pages/configuration/SitesPage.tsx`, `src/pages/configuration/BailleursPage.tsx`, `src/pages/surveillance/tabs/AlertesTab.tsx`, plus l'ensemble des pages listées dans le résumé de session (Finance ×4, Élevage ×4, Surveillance, Configuration ×3, Auth, Media, Inventory, Suppliers, Projects).
- Rapports modules : `docs/audits/2026-11-14-audit-module-*.md` (10 rapports).

## Statut
Audit de lecture seule terminé. Aucun changement de code n'a été effectué dans le cadre de cette mission d'audit. Les corrections ci-dessus nécessitent une mission séparée avec accord explicite (CLAUDE.md §16 — modification de formulaires, migrations, etc.).

---

**Date** : 2026-11-14
**Branche** : `feat/dashboard-v2`
**Auteur** : audit manuel (agent nemotron non disponible — alias non supporté, audit réalisé dans le thread principal)
