# Vague 2 — Diagnostic : Événements (constats B2)

Date : 2026-11-08
Branche : main
Commit : HEAD (c69f4af)
Auteur : Claude Code (agent) + validation humaine en attente

## Contexte

Dans le cadre de la mission "Danse du Cobra, Vague 2 : correctifs UI sûrs + clarification métier", le constat de terrain "Événements non transversaux" signale que les événements de surveillance ne sont pas partagés/consolidés entre les domaines (élevage, agriculture, surveillance). Ce diagnostic est en lecture seule : aucune modification de code, aucune migration, aucun commit.

## Environnement

- Stack : React 18, TypeScript, Vite 5, Supabase JS, TanStack React Query, Tailwind CSS
- Base : Supabase local (config.toml), table `surveillance_events` avec colonnes `deleted_at` (soft delete), `farm_id`, `site_id`, `plot_id`, `campaign_id`, `lot_id`, `animal_id`, `project_id`, `responsible_id`
- Entrées : `/app/surveillance?tab=evenements` (SurveillancePage → EvenementsTab), `/app/elevage/evenements` (AnimalEventManage)

## Constats

### 1. Deux écrans d'événements avec deux schémas de données différents

**Surveillance → EvenementsTab** (`src/pages/surveillance/tabs/EvenementsTab.tsx`) :
- Source : `useSurveillance()` hook (`src/hooks/useSurveillance.ts:41`), table `surveillance_events`, filtre `deleted_at IS NULL` (ligne 28).
- Types supportés : `phyto_traitement` (Traitement phytosanitaire) et `equip_panne` (Panne équipement) — `SurveillanceEventType` (types.ts:411).
- Statuts : `planifie`, `en_cours`, `termine`, `annule` — `SurveillanceEventStatus` (types.ts:412).
- Colonnes : `farm_id`, `site_id`, `plot_id`, `campaign_id`, `lot_id`, `animal_id`, `project_id`, `label`, `description`, `scheduled_at`, `completed_at`, `status`, `cost_amount`, `responsible_id`, `details` (types.ts:414-432, useSurveillance.ts:62-78).
- Suppression : `ConfirmDeleteModal` avec `handleConfirmDelete` qui fait un DELETE physique (`supabase.from('surveillance_events').delete()` ligne 125), puis `setConfirmDelete(null)` et `refetch()` (EvenementsTab.tsx:123-134). Pas de `finally` pour le `setConfirmDelete(null)` — voir risque ci-dessous.

**Élevage → AnimalEventManage** (`src/pages/AnimalEventManage.tsx`) :
- Source : `animalEvents` depuis `useData()` (DataContext), table `animal_events`.
- Types : `vaccination`, `traitement`, `maladie`, `naissance`, `vente`, `achat`, `autre`, `animal_mort` (AnimalEventManage.tsx:44-53).
- Colonnes : `animal_id`, `lot_id`, `type`, `date`, `description`, `cost`, `responsible` (types.ts:278-287).
- Pas de `farm_id`, `site_id`, `plot_id`, `campaign_id`, `project_id`, `scheduled_at`, `completed_at`, `status`, `cost_amount`, `responsible_id`, `details`, `deleted_at`.
- Suppression : `handleDelete` (ligne 209-224) avec try/finally — `setConfirmDelete(null)` dans le `finally`, conforme au pattern de sûreté appliqué dans Vague 2 Partie A.

### 2. `useSurveillance` exclut les soft-deleted mais EvenementsTab supprime physiquement

`useSurveillance` (useSurveillance.ts:28) filtre systématiquement `deleted_at IS NULL`, et `useSurveillanceMutations.softDelete` (ligne 148-162) met à jour `deleted_at` plutôt que de supprimer. Pourtant, `EvenementsTab.handleConfirmDelete` (ligne 125) effectue un `.delete()` physique, contournant le soft-delete et le hook dédié. Ceci crée une incohérence : les événements supprimés via EvenementsTab disparaissent immédiatement et ne sont pas récupérables, alors que le hook prévoit une suppression logique.

### 3. Risque de popup bloqué sur erreur dans EvenementsTab (hors périmètre Partie A)

Dans `EvenementsTab.handleConfirmDelete` (ligne 123-134), `setConfirmDelete(null)` n'est appelé que dans la branche `else` (succès), pas dans un `finally`. Si la suppression échoue, le `ConfirmDeleteModal` reste affiché indéfiniment. Ce pattern contraste avec `AnimalEventManage.handleDelete` (ligne 221-223) qui place `setConfirmDelete(null)` dans un `finally`, et avec toutes les pages corrigées en Partie A (try/finally). C'est une régression potentielle d'expérience utilisateur non couverte par les correctifs déjà appliqués.

### 4. Les événements ne sont pas transversaux aux domaines

Il n'existe pas de table ou vue unique consolidant les événements :
- `surveillance_events` (domaine surveillance/agriculture) : phyto_traitement, equip_panne, liés à `site_id`, `plot_id`, `campaign_id`, `project_id`.
- `animal_events` (domaine élevage) : vaccination, traitement, maladie, naissance, vente, achat, mort, liés à `animal_id`, `lot_id`.

Aucune clé étrangère ni vue ne relie `animal_events` à `surveillance_events`. Un utilisateur qui veut voir "tous les événements de l'exploitation" doit consulter deux écrans séparés (`/app/surveillance?tab=evenements` et `/app/elevage/evenements`) avec deux schémas, deux jeux de statuts et deux jeux de types incompatibles.

### 5. Le KPI "En retard" est calculé côté client, pas stocké

`EvenementsTab` calcule `enRetard` en filtrant `status === 'planifie' && scheduled_at < now` (ligne 92). Le hook fournit l'helper `isOverdue(event)` (useSurveillance.ts:176) mais il n'est pas utilisé dans EvenementsTab, qui fait son propre calcul inline. Pas de régression, mais duplication de logique.

### 6. Audit des suppressions d'événements

`EvenementsTab.handleConfirmDelete` logge l'audit via `logAudit(appUser?.name, 'DELETE', 'surveillance_event', ...)` (ligne 129) uniquement en cas de succès. `AnimalEventManage` logge aussi l'audit sur suppression (ligne 216). L'historique est consultable dans `HistoriqueTab` (SurveillancePage onglet historique, lit `audit_logs`).

## Conclusion

Les événements sont gérés par deux écrans isolés avec deux schémas distincts (`surveillance_events` pour l'agriculture/surveillance, `animal_events` pour l'élevage), sans consolidation transversale. `EvenementsTab` supprime physiquement alors que `useSurveillance` prévoit le soft-delete, et son `handleConfirmDelete` ne remet pas `confirmDelete` à null en cas d'erreur (popup bloquée). L'audit des suppressions est présent des deux côtés.

## Décisions humaines requises

1. Corriger `EvenementsTab.handleConfirmDelete` pour mettre `setConfirmDelete(null)` dans un `finally` (pattern Vague 2 Partie A) ?
2. Aligner la suppression d'événements sur le soft-delete (`useSurveillanceMutations.softDelete`) plutôt que le DELETE physique ?
3. Unifier les schémas `surveillance_events` et `animal_events` en une seule table d'événements transversale, ou maintenir deux écrans séparés par domaine ?
4. Créer une vue/écran "Tous les événements" consolidant élevage + surveillance ?

## Fichiers modifiés

Aucun (diagnostic en lecture seule).

## Prochaine étape

Présenter les deux rapports B1 (alertes) et B2 (événements) pour décision produit, puis éventuellement traiter A4 (Ferme/Site dashboard) sous réserve d'accord utilisateur explicite.
