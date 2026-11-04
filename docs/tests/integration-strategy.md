# Stratégie de test d'intégration — RLS et helpers current_*

Date : 2026-11-04
Branche : rls/fundings-expenses
Commit : 43e40a5 (CLAUDE.md — doc limitation pgTAP)
Auteur : Claude Code (agent) + validation humaine

## Contexte

pgTAP ne simule pas correctement un JWT signé par Supabase Auth. La variable
`request.jwt.claim.sub` positionnée par `SET LOCAL` n'est pas équivalente à un
vrai JWT. Par conséquent :

- Les helpers `current_*` (qui s'appuient sur `auth.uid()`) ne sont PAS
  testables de manière fiable en pgTAP.
- Les politiques RLS qui utilisent ces helpers peuvent être testées par leurs
  résultats, mais pas les helpers eux-mêmes.

Décision architecturale : on ne contourne pas la limitation pgTAP. La stratégie
de test retenue repose sur des **tests d'intégration** avec un vrai Supabase
local et un vrai JWT.

## Objectif

Définir le squelette et la démarche pour tester, contre une base Supabase
locale réelle :
1. Les 4 helpers `current_app_user_id`, `current_user_role`,
   `current_user_site_id`, `current_user_funder_id`.
2. Les politiques RLS sur `fundings`, `expenses`, `app_users`, `funders`.

## Environnement de test

- Supabase local démarré (`supabase start`) sur le port standard (54322).
- Base `postgres`, utilisateur `postgres`.
- Migrations appliquées jusqu'à `20261103000004_helpers_remove_or_fix.sql`.
- Client JS : supabase-js (`@supabase/supabase-js`) pour s'authentifier et
  obtenir un vrai JWT.
- Framework de test à confirmer (Vitest/Jest + supertest, ou scripts Node).

## Démarche

### 1. Créer des utilisateurs réels via Supabase Auth

```ts
const { data, error } = await supabase.auth.signUp({
  email: 'financeur@test.local',
  password: 'motdepasse123',
})
// data.user.id = sub du JWT = auth_id à lier à app_users
```

### 2. Lier app_users via auth_id

```sql
insert into app_users (id, name, email, role, site_id, auth_id)
values (gen_random_uuid(), 'Financeur Test', 'financeur@test.local',
        'financeur', '<site_id>', '<auth.users.id>');
```

### 3. Obtenir un vrai JWT signé

```ts
const { data: session } = await supabase.auth.signInWithPassword({
  email: 'financeur@test.local',
  password: 'motdepasse123',
})
// session.access_token = vrai JWT signé par Supabase Auth
```

### 4. Appeler les helpers avec le vrai JWT

```ts
const { data, error } = await supabase.rpc('current_user_role')
const { data, error } = await supabase.rpc('current_app_user_id')
const { data, error } = await supabase.rpc('current_user_site_id')
const { data, error } = await supabase.rpc('current_user_funder_id')
```

## Cas de test à couvrir

| Cas | Rôle attendu | Résultat attendu |
|-----|--------------|------------------|
| Financeur voit ses propres fundings | `financeur` | 1 ligne (son funder) |
| Financeur ne voit pas les fundings d'un autre funder | `financeur` | 0 ligne |
| Comptable ne peut pas modifier une expense | `comptable` | 42501 |
| Administrateur voit tous les fundings | `administrateur` | toutes les lignes du site |
| current_user_role retourne le bon rôle | n'importe lequel | texte attendu |

## Limites connues

- Nécessite une base Supabase locale fraîche à chaque run (isolation).
- Les tests d'intégration sont plus lents que les tests pgTAP unitaires.
- Nécessite supabase-js en dépendance de test (à confirmer par l'utilisateur).

## Prochaine étape

Implémenter les premiers tests d'intégration contre le Supabase local et
valider que `auth.uid()` résout correctement le sub du vrai JWT dans les
helpers `SECURITY DEFINER`.
