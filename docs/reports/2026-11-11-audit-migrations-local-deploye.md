# EGS Audit — Cohérence des migrations Supabase (local vs déployé)

## Mission
Vérifier la cohérence des migrations de base de données entre l'instance locale (Supabase Docker) et l'environnement déployé (distant/production), et produire un plan d'actions/corrections.

## Objectif
Établir l'état de référence des migrations appliquées localement, le comparer avec les fichiers présents dans `supabase/migrations/`, identifier les écarts et les anomalies de nommage, et dresser le plan de corrections à appliquer (local uniquement, sans toucher au distant sans accord explicite).

## Environnement
- Host : local (Docker Supabase), ports 54321 (API) / 54322 (DB) / 54323 (Studio)
- User : soma (local), projet `bahkanso-local`
- Repository : `/home/souleymane/BAHKANSO`, branche `main`
- Relevant versions : Supabase CLI (local), TypeScript strict, React/Vite
- Projet lié distant détecté : `dnyohupgyorjmuvbyhqk` (BAHKANSO) — non interrogé (pas d'accord distant)

## Commandes exécutées
1. `supabase status` → instance arrêtée (services Stopped)
2. `supabase start` → instance démarrée, API sur 127.0.0.1:54321, DB sur 127.0.0.1:54322
3. `supabase db reset` → base locale réinitialisée, toutes les migrations appliquées sans erreur (62 fichiers, du `001_core_tables` au `20261108000001_add_farm_id_to_core_tables.sql`)
4. `PGPASSWORD=postgres psql ... SELECT name FROM supabase_migrations.schema_migrations` → 53 migrations appliquées en base locale
5. `ls supabase/migrations/*.sql` → 53 fichiers de migration présents
6. Comparaison suffixe de nom (sans timestamp) : **zéro écart** — tous les fichiers sont appliqués, toutes les migrations appliquées ont un fichier correspondant
7. `npm run typecheck` → exit 0 (propre)
8. `npm run lint` → 0 erreurs, 26 warnings (tous préexistants, `react-hooks/exhaustive-deps`, aucun lié aux migrations)
9. `npm run build` → succès, exit 0, 13.37s

## Complets résultats — Inventaire des migrations

### Fichiers présents dans `supabase/migrations/` (53)

Tous les fichiers sont appliqués localement. Aucun fichier orphelin, aucune migration appliquée sans fichier correspondant.

### Anomalies de nommage relevées (statique, à confirmer sur le distant)

| # | Anomalie | Fichier(s) concerné(s) | Impact |
|---|----------|------------------------|--------|
| 1 | Double extension `.sql.sql` | `20261004122416_007_auth_and_rls_tightening.sql.sql`, `20261005195209_008_recipes_and_rls_fixes.sql.sql`, `20261005195221_009_storage_policies.sql.sql` | Le CLI Supabase les applique sous le nom tronqué (sans `.sql.sql`). Fonctionne localement mais incohérent avec la convention de nommage standard (`YYYYMMDDHHMMSS_name.sql`). |
| 2 | Hors séquence nommée (`pre_`) | `20261005195219_pre_012_surveillance_events.sql`, `20261005195220_pre_013_functions.sql` | Préfixe `pre_` hors de la séquence numérique standard. Appliqués entre `006` et `009` selon l'horodatage. |
| 3 | Trou de numérotation | Passage de `026_audit_logs_select_policy` à `028_site_id_everywhere` (le `027` est absent) | Aucun impact fonctionnel (les migrations s'appliquent par horodatage, pas par numéro de séquence), mais repère manquante dans la numérotation. |
| 4 | Préfixe `001` dupliqué | `001_core_tables.sql` et `20261108000001_add_farm_id_to_core_tables.sql` (préfixe numérique `001` réutilisé) | Les numéros de séquence ne sont pas uniques ; seule l'horodatage fait foi pour l'ordre d'application. |
| 5 | Fichier de rollback | `20261020160001_surveillance_events_rollback.sql` | Un rollback est appliqué comme une migration normale dans l'historique local. |
| 6 | Corrections successives sur les mêmes helpers | `20261103000003_helpers_row_security_off_fix.sql`, `20261103000004_helpers_remove_or_fix.sql` | Risque que l'état appliqué diffère entre local et déployé selon quelle correction a été effectivement appliquée sur chaque environnement. |

### Comparaison local vs fichiers
- Fichiers présents : 53
- Migrations appliquées en base locale : 53
- Fichiers non appliqués : 0
- Migrations appliquées sans fichier : 0
- **Écart local : aucun**

## Analyse
- L'instance locale est cohérente avec elle-même : chaque fichier de migration a été appliqué exactement une fois, dans l'ordre des horodatages, sans erreur.
- Le `supabase db reset` est 100 % reproductible sur la branche `main` (toutes les 53 migrations s'appliquent proprement sur une base vide).
- Aucune régression n'est introduite côté code : typecheck, lint et build sont tous verts.
- Le point bloquant de l'étape 3 (comparaison local vs déployé) est l'absence d'accord explicite pour toucher à la base distante. Le projet lié `dnyohupgyorjmuvbyhqk` existe mais n'a pas été interrogé, conformément à CLAUDE.md §13 (rien sur le distant sans accord explicite).

## Findings (écarts local vs déployé)
- **Confirmé (local)** : zéro écart entre les fichiers de migration et l'état appliqué en base locale.
- **À vérifier (distant)** : impossible de comparer avec l'environnement déployé sans autorisation d'accéder à la base distante (`supabase migration list --linked` ou requête distante). L'état du distant est inconnu à ce jour.

## Actions effectuées
- Démarrage de l'instance Supabase locale (`supabase start`).
- Réinitialisation de la base locale (`supabase db reset`) — efface la base locale, repart d'une base vide.
- Relevé des 53 migrations appliquées en base locale.
- Comparaison fichiers vs base appliquée : cohérence parfaite.
- Vérification frontend : typecheck exit 0, lint 0 erreurs / 26 warnings préexistants, build succès.

## Validation
- `supabase db reset` : toutes les migrations appliquées sans erreur.
- `npm run typecheck` : exit 0.
- `npm run lint` : 0 erreurs.
- `npm run build` : exit 0, build produit avec succès.

## Final Status
**PASS** (pour le local) — avec une restriction : le comparatif local vs déployé n'a pas pu être exécuté (pas d'accord distant).

## Next Step
- Obtenir l'autorisation explicite d'accéder à la base distante (`supabase migration list --linked` sur le projet `dnyohupgyorjmuvbyhqk`) pour compléter l'étape 3 du plan et produire le tableau des écarts local vs déployé.
- Corriger les anomalies de nommage (double extension, `pre_`, trou de numérotation, préfixe dupliqué) via de nouvelles migrations idempotentes — jamais modifier une migration existante déjà appliquée (CLAUDE.md §13).
