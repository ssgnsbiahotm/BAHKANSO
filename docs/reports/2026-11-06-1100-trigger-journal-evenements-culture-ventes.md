# Trigger Journal d'Événements — Extension aux récoltes et ventes

Date : 2026-11-06
Branche : main
Commit : feaf55c (HEAD)
Auteur : Claude Code (agent) + validation humaine

## Contexte

Le Journal d'Événements (`event_journal`) était déjà alimenté par les dépenses via le trigger `trg_log_expense` (migration `20261106000000`). Cette étape étend l'alimentation aux récoltes (`harvests`) et aux ventes (`sales`).

## Décisions d'adaptation du schéma

Lors de l'implémentation, deux colonnes référencées dans le SQL de mission n'existent pas dans le schéma actuel :
- `harvests.created_by` n'existe pas → `actor_id` mis à `NULL` (colonne nullable sur `event_journal`)
- `sales.currency` n'existe pas → valeur par défaut `'XOF'` utilisée

Ces adaptations ont été validées avec l'utilisateur.

## Fichiers modifiés

### `supabase/migrations/20261106000001_event_journal_triggers_culture_sales.sql` (nouveau)

- `public.log_event()` recréée (CREATE OR REPLACE) pour gérer 3 tables :
  - `expenses` → `event_type='depense'`, `source_module='finance'`, `farm_id` depuis `NEW.site_id`
  - `harvests` → `event_type='recolte'`, `source_module='culture'`, `farm_id` depuis `NEW.site_id` (ajouté par migration 030), `actor_id=NULL`
  - `sales` → `event_type='recette'`, `source_module='finance'`, `farm_id` depuis `NEW.site_id`, `currency='XOF'`
- Chaque insertion est conditionnée par `v_farm_id IS NOT NULL` : si le site n'est lié à aucune exploitation, l'insertion de la ressource réussit sans alerter le journal.
- `REVOKE ALL ON FUNCTION public.log_event() FROM PUBLIC`
- Nouveaux triggers : `trg_log_harvest` sur `harvests`, `trg_log_sale` sur `sales` (AFTER INSERT, FOR EACH ROW)
- Garde-fou DO block : vérifie `row_security=off` dans `proconfig` et absence de `current_setting` dans `prosrc`

### `tests/integration/event-journal.test.mjs` (modifié)

- 3 tests au lieu d'1 :
  1. Dépense alimente le journal (`event_type='depense'`)
  2. Récolte alimente le journal (`event_type='recolte'`, `entity_type='harvest'`, `quantity`, `source_module='culture'`)
  3. Vente alimente le journal (`event_type='recette'`, `entity_type='sale'`, `amount`, `source_module='finance'`)
- Les assertions utilisent `filter()` sur le journal pour isoler les événements par `event_type` (les tests partagent la même ferme, plusieurs événements peuvent coexister).
- La vente ne fournit pas de `reference` explicite : le trigger `generate_sale_reference` (BEFORE INSERT) l'auto-génère (`VTE-YYYY-NNNNN`).

## Validation

1. `supabase db reset` → exit 0, toutes les migrations appliquées dont `20261106000001_event_journal_triggers_culture_sales.sql`, garde-fou passé.
2. `npx vitest run tests/integration/event-journal.test.mjs` → 3/3 PASS.
3. `npx vitest run tests/integration/` → 14/14 PASS (helpers 6, rls-fundings 2, rls-expenses 3, event-journal 3).

## Résultat

Le Journal d'Événements est désormais alimenté automatiquement pour les 3 modules : dépenses, récoltes et ventes. Création d'une récolte ou d'une vente sur un site lié à une génère un événement correspondant dans `event_journal`.

## Rapport

- Migration SHA : fichier `supabase/migrations/20261106000001_event_journal_triggers_culture_sales.sql` (non committed, voir `git status`)
- Sortie des tests : 14/14 PASS, exit 0

## Décisions humaines requises

Aucune.

## Prochaine étape

Aucune.
