# Rapport — Diagnostic des helpers RLS (étape B)

Date : 2026-11-03 22:30
Branche : rls/fundings-expenses
Commit : 2d16f33 (revert de 3d35f22)
Auteur : Claude Code (agent)

## Contexte

Le commit `3d35f22` a été annulé (`git revert 3d35f22 --no-edit` → commit `2d16f33`).
La migration `20261103000002_helpers_row_security_off.sql` n'existe plus dans la tree de travail.
La migration `20261103000001_rls_fundings_expenses_least_privilege.sql` (commit `7b7104d`) est toujours présente et définit les 4 helpers sans `row_security = off` et avec le fallback `current_setting(...) || auth.uid()`.

## Constats (preuves)

### Check 1 — proconfig des helpers (après revert)

```sql
SELECT proname, proconfig
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname LIKE 'current_%'
  AND proname NOT LIKE 'current_user_has_role'
ORDER BY proname;
```

Résultat :
- `current_app_user_id` | `{search_path=public}`
- `current_user_funder_id` | `{search_path=public}`
- `current_user_role` | `{search_path=public}`
- `current_user_site_id` | `{search_path=public}`

→ Aucun helper n'a `row_security = off`. Ils portent la version de la migration 001.

### Check 2 — `SET LOCAL` / `SET ROLE` / `row_security` dans le test pgTAP

```
grep -n "SET LOCAL\|SET ROLE\|row_security\|RESET" \
  supabase/tests/rls_fundings_expenses_test.sql
```

→ Aucun résultat (exit 1). Rien dans le test n'annule `row_security`.

### Check 3 — Redéfinition des helpers dans les autres migrations

```
grep -rn "current_app_user_id\|current_user_role" \
  supabase/migrations/*.sql | grep -v "20261103000001"
```

→ Aucun résultat (exit 1). Aucune autre migration ne redéfinit ces helpers.

### Check 4 — Pourquoi les helpers retournaient NULL

Test manuel initial avec `sub = 2222...` (id du financeur du test pgTAP) : `current_app_user_id()` et `current_user_role()` renvoyaient NULL.

**Cause réelle** : l'id `2222...` n'existe pas dans les données de seed de la base (`app_users` contient les ids `...0010`…`...0017` et un UUID aléatoire). Ce n'était **pas** un problème de `row_security` ni de récursion. `auth.uid()` et `current_setting('request.jwt.claim.sub')` retournent correctement `2222...` dans une fonction `SECURITY DEFINER`.

Test réel via `supabase test db` (charge ses propres données en transaction, dont l'id `2222...`) :

```
All tests successful.
Files=1, Tests=4,  0 wallclock secs
Result: PASS
```

→ Les 4 assertions passent avec la migration 001 (helpers sans `row_security = off`, avec fallback).

## Analyse

- Le NULL des helpers n'était pas dû à l'absence de `row_security = off`, mais à l'absence de ligne `app_users` correspondante pour le `sub` testé hors contexte pgTAP.
- Avec les données du test pgTAP chargées, les helpers résolvent correctement l'utilisateur via le fallback `current_setting('request.jwt.claim.sub')` / `auth.uid()`, et le test passe 4/4.
- Les deux anti-patterns signalés dans le STOP (pas de `row_security = off`, fallback présent) subsistent donc **dans la migration 001** (le revert de 002 ne change pas le comportement, car 001 définit les mêmes helpers identiques).

## Conclusion

- ÉTAPE A terminée : `3d35f22` reverté, migration 002 supprimée de la tree de travail, pas de nouveau commit de migration.
- ÉTAPE B terminée : la vraie cause du NULL était une donnée de test absente, pas l'attribut `row_security`. Le test passe 4/4 dans l'état actuel.

## Décisions humaines requises

1. La migration 001 doit-elle être corrigée de la même manière (ajout de `row_security = off` sur les 4 helpers, suppression du fallback) pour respecter la règle 5 de CLAUDE.md et préparer l'étape 3 (FORCE RLS sur `app_users`) ?
2. Si oui, créer une nouvelle migration corrective (timestamp postérieur à 001, sans modifier 001 appliquée — règle 6 de CLAUDE.md).

## Fichiers modifiés

- `git revert 3d35f22` → commit `2d16f33` (supprime `supabase/migrations/20261103000002_helpers_row_security_off.sql`)

## Prochaine étape

Attendre la décision de l'utilisateur avant toute nouvelle migration.
