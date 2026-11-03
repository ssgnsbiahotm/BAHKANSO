# Déro­gation — backfill auth_id

## Contexte

**Date :** 2026-11-03

**Migration concernée :** `supabase/migrations/20261103000000_fix_user_sync_ids_and_trigger.sql` (ex `20261102171655`)

## Nature

Modification de contenu d'une migration existante (dérogation unique et encadrée).

## Raison

Le backfill d'origine :

```sql
UPDATE public.app_users
SET auth_id = id
WHERE auth_id IS NULL;
```

est structurellement incorrect : il essaie d'affecter `auth_id = id` sur toutes les lignes `app_users` dont `auth_id` est NULL, y compris les lignes orphelines dont l'`id` n'existe pas dans `auth.users`. Cela viole la contrainte de clé étrangère `app_users_auth_id_fkey` et fait échouer `supabase db reset` / `supabase start`.

## Correction

Ajout d'une clause de filtrage sur `auth.users` existants :

```sql
UPDATE public.app_users
SET auth_id = id
WHERE auth_id IS NULL
  AND id IN (SELECT id FROM auth.users);
```

Seules les lignes `app_users` ayant une correspondance dans `auth.users` sont maintenant synchronisées. Les lignes orphelines (sans `auth.users`) conservent `auth_id = NULL`.

## Portée

- Locale uniquement (branche `rls/fundings-expenses`). Production non touchée.
- Aucune donnée supprimée.
- Aucune autre migration modifiée.
- Aucun fichier d'auth modifié.

## Engagement

Cette dérogation ne doit pas être renouvelée. À l'avenir, préférer un réordonnancement des migrations ou une migration corrective séparée pour nettoyer les données orphelines avant le backfill.
