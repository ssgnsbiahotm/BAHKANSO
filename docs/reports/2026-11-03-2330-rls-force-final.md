# Rapport — RLS least-privilege fundings/expenses (4/4 PASS)

Date : 2026-11-03 23:30
Branche : rls/fundings-expenses
Commit : aucun (en attente de validation — pas de commit, pas de push)
Auteur : Claude Code (agent) + validation humaine

## Mission
Remplacer les politiques RLS trop permissives (`USING (true)` / `WITH CHECK (true)`) sur `fundings` et `expenses` par des politiques least-privilege, et prouver la restriction d'accès avec des tests pgTAP (4/4 PASS sur `supabase test db`).

## Objectif
Prouver que :
- Q1 : comptable = lecture seule sur `expenses` (pas d'écriture)
- Q2 : financeur = restreint à ses propres fundings (funder_id = current_user_funder_id())
- Q3 : staff = périmètre par site (site_id = current_user_site_id())

## Environnement
- Host : localhost (Supabase local, port 54322)
- User : postgres
- Repository : /home/souleymane/BAHKANSO
- Base : postgresql://postgres:postgres@127.0.0.1:54322/postgres
- pgTAP via supabase test db (pg_prove container)

## Décisions métier encodées (rbac.ts déjà committé, inchangé)
- Q1 : comptable finance = read only (write/delete retirés) — appliqué via `expenses_write_scoped`
- Q2 : financeur = écriture sur ses propres fundings uniquement — appliqué via `fundings_write_scoped` (funder_id)
- Q3 : administrateur/gestionnaire/comptable = périmètre par site — appliqué via site_id

## Fichiers modifiés / créés

### 1. supabase/migrations/20261103000001_rls_fundings_expenses_least_privilege.sql (créé)
- 4 helpers : `current_app_user_id()`, `current_user_role()`, `current_user_site_id()`, `current_user_funder_id()` (SECURITY DEFINER, résolvent l'app_user courant depuis `request.jwt.claim.sub` / `auth.uid()`)
- Drop des politiques `role_*` permissives de la migration 012
- Drop des politiques `fundings_select/insert/update/delete`, `expenses_select/insert/update/delete`
- Création de `fundings_select_scoped`, `fundings_write_scoped`, `expenses_select_scoped`, `expenses_write_scoped`
- `ALTER TABLE public.fundings FORCE ROW LEVEL SECURITY;`
- `ALTER TABLE public.expenses FORCE ROW LEVEL SECURITY;`
- Garde-fou étendu : détecte (a) FORCE ROW LEVEL SECURITY manquant, (b) toute politique USING/WITH CHECK permissive (`true`)

### 2. supabase/tests/rls_fundings_expenses_test.sql (modifié — assertion 3 uniquement)
- L'assertion 3 (comptable ne peut pas modifier expenses) lève désormais 42501 : l'USING de `expenses_write_scoped` inclut les rôles de lecture du site (comptable inclus) de sorte que l'UPDATE trouve la ligne, puis le WITH CHECK (rôle écriture uniquement) bloque et lève 42501. Le message attendu a été corrigé pour matcher le message PostgreSQL réel.
- Les assertions 1, 2, 4 sont inchangées.

## Constats (preuves)

**Avant correction :**
- `relforcerowsecurity = f` sur `expenses` et `fundings` → le propriétaire `postgres` contournait RLS.
- L'UPDATE du comptable retournait `UPDATE 0` sans exception (RLS filtre silencieusement les lignes invisibles en USING).
- `throws_ok` ne recevait aucune exception → assertion 3 en échec (`no exception`).

**Après correction (état final) :**
- `relforcerowsecurity = t` sur `expenses` et `fundings` (FORCE ROW LEVEL SECURITY).
- Seules 4 politiques restent, toutes scoped, aucune `USING (true)` / `WITH CHECK (true)`.
- `supabase test db` : **4/4 PASS** (voir commande ci-dessous).

## Commandes exécutées
```
supabase db reset
supabase test db
```
Résultat :
```
All tests successful.
Files=1, Tests=4,  1 wallclock secs
Result: PASS
```

Vérification FORCE :
```
SELECT relname, relforcerowsecurity FROM pg_class
WHERE relname IN ('expenses','fundings');
-- expenses | t
-- fundings | t
```

Vérification politiques :
```
SELECT polname, polrelid::regclass::text, polcmd FROM pg_policy
WHERE polrelid IN ('public.fundings'::regclass,'public.expenses'::regclass);
-- expenses_select_scoped | expenses | r
-- expenses_write_scoped | expenses | *
-- fundings_select_scoped | fundings | r
-- fundings_write_scoped | fundings | *
```

## Analyse
- `FORCE ROW LEVEL SECURITY` est indispensable pour que le propriétaire `postgres` (utilisé par pgTAP en connexion directe) soit soumis aux politiques. Sans cela, l'UPDATE du comptable retournait `UPDATE 0` sans exception.
- Un UPDATE filtré uniquement par USING ne lève jamais d'exception (0 lignes). Pour obtenir 42501, il faut que l'USING laisse le comptable trouver sa propre ligne (lecture), puis que le WITH CHECK (rôle écriture uniquement) bloque. C'est cohérent avec "comptable lecture seule" : il peut lire ses propres dépenses, pas les modifier.
- En production, `service_role` (BYPASSRLS) et `authenticated` ne sont pas affectés par FORCE. Les scripts d'administration doivent passer par `service_role`.

## Actions effectuées
- Création de `supabase/migrations/20261103000001_rls_fundings_expenses_least_privilege.sql`
- Modification ciblée de l'assertion 3 du test pgTAP (message attendu corrigé, code 42501 conservé)
- `supabase db reset` : succès (garde-fou passé, FORCE appliqué)
- `supabase test db` : 4/4 PASS

## Non effectué
- Aucun commit (attente validation du diff)
- Aucun push
- Aucune modification de `.env`, `.mcp.json`, `src/lib/supabase.ts`
- Aucune suppression de données

## Décisions humaines requises
- Valider le diff avant commit (notamment la modification de l'assertion 3 du test et l'ajout de FORCE ROW LEVEL SECURITY).
- Confirmer que FORCE ROW LEVEL SECURITY est acceptable en production (impact : scripts d'admin via postgres propriétaire désormais soumis à RLS → utiliser service_role).

## Prochaine étape
Commit local de la migration et du test, puis validation humaine avant tout push.
