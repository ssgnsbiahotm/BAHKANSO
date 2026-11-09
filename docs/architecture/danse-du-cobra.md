# Danse du Cobra — chorégraphie inter-modules BAHKANSO

Date : 2026-11-08
Branche : main
Auteur : Claude Code (agent)

## Objectif

Relier les modules (Cultures, Élevage, Finance, Chantiers) pour que chaque action alimente, déclenche ou contraigne les autres, avec le moins de saisie possible pour l'utilisateur. Aucun code applicatif n'a été écrit à ce stade : ce document est l'audit (PHASE 1) et s'arrête ici en attente de votre accord.

## 3 piliers de conception

1. **Unification** : une donnée de référence vivante (ex. nom de parcelle) est lue en lecture seule via la relation, jamais ressaisie. Une donnée comptable/historique (ex. culture d'une campagne, prix) est copiée en instantané à la création puis figée.
2. **Imbrication** : une action à impact financier/logistique *propose* ses conséquences (switch « Générer une dépense », jamais d'écriture financière silencieuse). Chaque entité liée porte une clé de liaison explicite. Idempotence à l'édition. Suppression documentée. Échec partiel = avertissement clair.
3. **Synchronisation** : invalidation ciblée du cache après mutation (pas de WebSocket). Ici : `refresh()` de DataContext (pas de React Query).

---

## PHASE 1 — Audit de chorégraphie

### Cadre technique constaté

- **Framework de données** : `src/lib/DataContext.tsx` — charge toutes les sources au mount via Supabase, expose `refresh()` pour tout recharger. Pas de React Query côté client (présent dans `package.json` mais non utilisé pour le cache des formulaires).
- **Backend** : Supabase (`src/lib/supabase.ts`), RLS activé, mutations directes depuis le front.
- **Formulaires** : `zod` + `ValidatedForm` (`src/components/ui/ValidatedForm`).
- **Types** : `src/lib/types.ts`.
- **KPIs** : `src/lib/kpi.ts` lit `event_journal` (event_type `depense`/`recette`), `crop_operations` (`cost`, `labor_cost`), `harvests` (`revenue`).
- **Liaison financière existante** : table `financial_links` (transaction_type, transaction_id, entity_type, entity_id, amount_allocated, currency, percent_allocated, note, created_by) — déjà utilisée par `ExpensesTab` pour répartir une dépense sur plusieurs entités (plot, campaign, supplier, …).
- **Event journal** : `event_journal` (event_type dont `depense`, `recette`) lu par `kpi.ts` ; aucune écriture vers `event_journal` trouvée lors de la création d'une dépense/opération (à confirmer : gap possible).

### Tableau de correspondance des données

| Donnée | Module source | Module consommateur / formulaire | Traitement | État actuel | Migration requise | Priorité |
|---|---|---|---|---|---|---|
| `current_crop` (parcelle) | Cultures (Plot) | Campagne → « Nom de la culture » | Héritage (lecture seule) + instantané | **OK** (déjà implémenté : pré-remplissage + readOnly, `CampagnesPage.tsx`) | Non | Haute (fait) |
| `crop_name` (campagne) | Cultures (Campaign) | — | Instantané figé à la création | Présent en colonne DB, pas de copie séparée | Non | — |
| Type d'opération | Cultures (CropOperation.type) | Finance → catégorie de dépense | Instantané (label figé) | **Partiel** : `TYPE_OPTIONS` ajouté (travail/intrants/transport/récolte/autre), pas de lien vers dépense | Non (frontend) | Haute |
| Coût d'opération | Cultures (CropOperation.cost/labor_cost) | Finance → montant de dépense | Proposition (switch) | Absent (aucun lien opération → dépense) | Oui : `operation_id` sur `expenses` ou `expense_id` sur `crop_operations` | Haute |
| Lien opération ↔ dépense | — | — | Clé explicite (idempotent) | Absent | Oui (idem ci-dessus) | Haute |
| Dépense créée depuis opération | Cultures → Finance | Écriture financière | Proposer (switch), jamais silencieux | Absent | Oui | Haute |
| `source_type`/`source_id` | Finance (`SaleItem`) | — | Pattern existant de liaison | Présent sur `SaleItem` uniquement | Non | — |
| `financial_links` | Finance | Dépense ↔ entités | Répartition N entités | OK (déjà utilisé par ExpensesTab) | Non | — |
| KPI coût de revient | Finance (`event_journal` depense) | Dashboard | Invalidation après mutation | Absent (pas d'invalidation ciblée) | Non | Moyenne |
| KPI marge campagne | `harvests.revenue` − `crop_operations.cost` | Dashboard | Recalcul | Présent (`calculateCampaignMargin`) | Non | — |

### Mutations et caches/KPIs à invalider

| Mutation | Cibles à invalider / rafraîchir | Mécanisme actuel |
|---|---|---|
| Création opération (avec dépense proposée) | `crop_operations`, `expenses`, `financial_links`, KPI coût de revient, KPI marge campagne | `refresh()` (DataContext) — tout recharger |
| Édition opération (dépense liée mise à jour, pas de doublon) | `crop_operations`, `expenses`, `financial_links`, KPIs | `refresh()` |
| Suppression opération | `crop_operations`, `expenses` (selon décision : cascade/détachement/blocage), KPIs | `refresh()` |
| Création dépense dans Finance | `expenses`, `financial_links`, KPI coût de revient | `refetch()` local (ExpensesTab) + `refresh()` global |

### Décisions proposées (à valider)

1. **Clé de liaison** : ajouter `operation_id` (nullable) sur la table `expenses`, pointant vers `crop_operations.id`. Une opération peut générer au plus une dépense (idempotence). Alternative : réutiliser `financial_links` (transaction_type='expense', entity_type='crop_operation', entity_id=<operation_id>). À trancher.
2. **TYPE_OPTIONS** : aligner sur `Saignée, Entretien, Transport, Achat d'intrants, Récolte, Autre` (value stable séparée du label). Mapping des anciennes valeurs en base nécessaire (compatibilité production). Cela entre en conflit avec l'implémentation déjà faite (`travail/intrants/transport/récolte/autre`) — à harmoniser.
3. **Switch de dépense** : pour `Transport` et `Achat d'intrants`, afficher un switch « Générer une dépense associée » avec montant pré-rempli = coût de l'opération, catégorie pré-mappée. Écriture uniquement si l'utilisateur valide.
4. **Édition** : mettre à jour la dépense liée (montant, catégorie, libellé) sans la dupliquer.
5. **Suppression** : détacher la dépense (mettre `operation_id` à null) ou bloquer si la dépense est déjà payée — à documenter.
6. **Échec partiel** : opération créée mais échec de la dépense → avertissement clair, jamais de succès silencieux. Privilégier une fonction RPC/transaction si l'infra le permet.

### Questions ouvertes

- Faut-il écrire dans `event_journal` (event_type `depense`) quand une dépense est créée depuis une opération, pour que les KPI `calculateGrossMargin`/`calculateCostPerUnit` la prennent en compte ?
- La colonne `operation_id` sur `expenses` suffit-elle, ou préfère-t-on `financial_links` (déjà en place) pour éviter une migration ?
- Comportement exact à la suppression d'une opération liée à une dépense payée : bloquer, détacher, ou cascade ?
- Élevage et Chantiers : pas de lien à fort impact identifié dans cet audit → listés comme « prochaine vague » (hors périmètre Cultures ↔ Finance).

### Migrations nécessaires (non appliquées — à documenter seulement)

À rédiger en SQL dans ce document une fois la clé de liaison tranchée (Point 1 ci-dessus). Aucune migration n'est appliquée dans cette phase.

---

## Statut

**PHASE 1 terminée — STOP.** Aucun code applicatif n'a été écrit dans le cadre de cette mission (au-delà de ce qui existait déjà). En attente de votre validation de l'audit avant la PHASE 2 (implémentation lien par lien).
