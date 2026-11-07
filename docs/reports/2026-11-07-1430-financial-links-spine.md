# Phase A — Colonne vertébrale financial_links

Date : 2026-11-07
Branche : main
Commit : 79fb4e6
Auteur : Claude Code (agent) + validation humaine

## Contexte

Architecture "Danse du Cobra" : les transactions financières (expenses, fundings, sales, harvest_revenue) doivent pouvoir être liées à N entités métier (plots, campaigns, animals, animal_lots, crop_operations, harvests, projects, project_steps, sites, suppliers, customers, funders) avec répartition du montant. Table pivot créée : `financial_links`. Permet le coût réel par parcelle, par lot, et la marge nette par activité (KPI impossibles aujourd'hui).

## Constats

**Audit préalable :**
- `expenses` table (migration 001) possède les colonnes `project_id`, `site_id`, `created_by`, `currency`, `amount`, `created_at` — confirmées via lecture de `supabase/migrations/20260929171038_001_core_tables.sql` et `20261022000000_016_multi_sites.sql`.
- Table `app_users` existe avec PK `id` (référencée par la FK `created_by`).
- Fonction `current_user_has_role(text[])` existe (migration 010) — utilisée par les politiques RLS.
- Aucune table `financial_links` n'existait avant la migration.

**Migration créée (fichier unique) :**
- `supabase/migrations/20261107120000_create_financial_links_spine.sql` (170 lignes ajoutées).

**Contenu :**
- Table `public.financial_links` avec : `id` (uuid PK), `transaction_type` (CHECK expense/funding/sale/harvest_revenue/other), `transaction_id` (uuid), `entity_type` (CHECK 14 entités métier), `entity_id` (uuid), `amount_allocated` (numeric 14,2 >= 0), `currency` (défaut XOF), `percent_allocated` (0-100), `metadata` (jsonb), `note`, `created_at`, `created_by` (FK app_users), UNIQUE(transaction_type, transaction_id, entity_type, entity_id).
- 3 index (transaction, entity, created_at).
- RLS : `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY` (règle CLAUDE.md #1).
- 4 politiques RLS (SELECT/INSERT/UPDATE/DELETE) via `current_user_has_role`, avec `DROP POLICY IF EXISTS` avant création (règle CLAUDE.md #2).
- Backfill : `expenses.project_id` → financial_links (7 lignes) et `expenses.site_id` → financial_links quand project_id null (13 lignes). Total 20 liens créés.
- Bloc DO de vérification post-migration (lève une exception si backfill incomplet).

**Aucun fichier TSX modifié** (Phase A = DB only, contrainte respectée).

**État local Supabase :**
- `supabase db reset` échoué en amont sur `20261106230000_add_site_id_to_core_tables.sql` (référence `surveillance_events` inexistante — chaîne de migration locale déjà cassée avant cette mission, non liée à ce changement).
- Migration `20261107120000` appliquée directement en local via psql : succès (CREATE TABLE, 3 index, RLS + FORCE, 4 policies, INSERT 0 7 + INSERT 0 13, DO block sans exception).
- `supabase db push --remote --dry-run` : affiche uniquement `20261107000000_add_unique_plots_reference.sql` et `20261107120000_create_financial_links_spine.sql`. Le push `--remote --yes` n'a PAS été exécuté (nécessite confirmation préalable d'un backup Supabase Dashboard par l'utilisateur, contrainte mission).

**Validation technique :**
```
set -o pipefail; npm run typecheck 2>&1 | tail -3; echo "TSC: $?"
→ TSC: 0
set -o pipefail; npm run build 2>&1 | tail -3; echo "BUILD: $?"
→ BUILD: 0
```

## Conclusion

La colonne vertébrale `financial_links` est créée, appliquée en local, et validée : table présente (20 lignes après backfill), 4 politiques RLS, RLS forcé, typecheck et build verts. Aucun fichier TSX modifié.

## Décisions humaines requises

1. **Backup Supabase avant push prod** : l'utilisateur doit créer un backup via Supabase Dashboard → Database → Backups → "Create backup", attendre le statut "Completed", puis confirmer. Seul après cette confirmation exécuter :
   `supabase db push --remote --yes`
2. Vérification prod après push : `supabase migration list --remote` et requêtes de comptage sur `financial_links`.

## Fichiers modifiés

- `supabase/migrations/20261107120000_create_financial_links_spine.sql` (créé)

## Prochaine étape

Attendre la confirmation du backup utilisateur, puis exécuter `supabase db push --remote --yes` et vérifier la table en prod.
