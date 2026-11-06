# Correction — Conflit de structure migration pre_012 / surveillance_events

Date : 2026-11-05 17:00
Branche : rls/fundings-expenses
Commit : 9f03396 fix(auth): resolve deadlock, add site selection, ready for production
Auteur : Claude Code (agent)

## Contexte

La migration `supabase/migrations/20261005195219_pre_012_surveillance_events.sql` (pré-012) créait la table `surveillance_events` avec un schéma réduit `(id, site_id, type, description, date, resolved, created_at)`. La migration `20261020160000_surveillance_events.sql` utilise `CREATE TABLE IF NOT EXISTS`, qui ne rajoute **pas** de colonnes manquantes à une table existante. Comme `pre_012` ne définissait pas `farm_id` (ni `label`, `scheduled_at`, etc.), la migration `20261020160000` échouait à la création de ses index sur des colonnes inexistantes.

## Objectif

Modifier `pre_012` pour que `surveillance_events` contienne le schéma complet attendu par `20261020160000` (notamment `farm_id`), afin que `supabase db reset` passe sans erreur.

## Constats

### Avant modification (pre_012)
- Colonnes : `id, site_id, type, description, date, resolved, created_at`
- FK : `site_id → sites(id)` uniquement
- Aucune contrainte `chk_completed_when_terminated`

### Après modification (pre_012)
- Schéma complet aligné sur `20261020160000` : `farm_id`, `type`, `plot_id`, `campaign_id`, `lot_id`, `animal_id`, `project_id`, `label`, `description`, `scheduled_at`, `completed_at`, `status`, `cost_amount`, `responsible_id`, `details`, `deleted_at`, `created_at`, `updated_at`
- `farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE RESTRICT` (pas de `DEFAULT get_farm_id()` car la fonction est définie par la migration `20261020160000`, appliquée après)
- Contrainte `chk_completed_when_terminated`
- RLS activé (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- Indexes, trigger, politiques RLS et fonction `get_farm_id()` **non** redéfinis (appartiennent à `20261020160000` et `012_rls_by_role_complete`)

### Ordre d'application des migrations
Les tables cibles des FK (`farms`, `app_users`, `plots`, `campaigns`, `animal_lots`, `animals`, `projects`, `sites`) sont créées par `001` (20260929) et `002` (20260929 17:11), toutes deux antérieures à `pre_012` (20261005 19:52). Aucune violation de FK.

## Commandes exécutées

1. `supabase start` — démarrage des services locaux Supabase (OK)
2. `supabase db reset` — application séquentielle de toutes les migrations

### Résultat du `db reset`

```
Applying migration 20261005195219_pre_012_surveillance_events.sql...   (OK — pas d'erreur)
Applying migration 20261020160000_surveillance_events.sql...            (OK — pas d'erreur)
Applying migration 20261020160001_surveillance_events_rollback.sql...   (OK — pas d'erreur)
```

Échec subséquent à `20261103000000_fix_user_sync_ids_and_trigger.sql` : `ERROR: relation "public.media" does not exist` — **problème préexistant, sans lien avec ce correctif** (la migration `20261031000001_create_media_table.sql` est non trackée/absente).

### Vérification directe (psql)

Les deux fichiers de migration s'appliquent sans erreur via `psql -f`. Le schéma final de `surveillance_events` contient toutes les colonnes attendues, les 9 indexes, la contrainte `chk_completed_when_terminated`, le trigger `updated_at` et les politiques RLS.

## Analyse

Le conflit structurel est résolu : `pre_012` crée maintenant la table avec le schéma complet, donc `CREATE TABLE IF NOT EXISTS` dans `20261020160000` est un no-op et ses index sont créés sur des colonnes existantes.

## Décisions humaines requises

Aucune. La migration `20261031000001_create_media_table.sql` (non trackée) doit être ajoutée ou le bloc `UPDATE public.media` dans `20261103000000_fix_user_sync_ids_and_trigger.sql` doit être rendu conditionnel pour lever le blocage préexistant du `db reset` complet — hors périmètre de ce correctif.

## Fichiers modifiés

- `supabase/migrations/20261005195219_pre_012_surveillance_events.sql`

## Prochaine étape

Le correctif est validé. Si un `db reset` complet est requis, il faut d'abord régler le problème préexistant de la table `media` manquante.
