# Danse du Cobra — Vague 1 : ajout de farm_id aux tables cœur

Date : 2026-11-08
Branche : main
Commit : aucun (aucune commande git n'a été exécutée)
Auteur : Claude Code (agent)

## Contexte
La table `expenses` possède déjà `farm_id` (migration `20261108000000`), mais le code applicatif envoie `farm_id` vers `campaigns`, `harvests`, `sales` et `crop_operations`, qui ne disposaient pas de la colonne en base — erreurs à l'insertion attendues. Objectif : aligner la base sur le code.

## Constats (diagnostic, étape 1)
- `sites.farm_id` existe (migration `016_multi_sites`), nullable (`ON DELETE SET NULL`).
- Les 4 tables cibles ont déjà `site_id` (campaigns/sales via 016 ; harvests/crop_operations via 030), toutes nullable.
- Aucune des 4 tables n'avait de colonne `farm_id` avant cette migration.
- Chemin de jointure retenu : `table.site_id → sites.farm_id` (direct sur les 4 tables, pas de détournement via `campaigns → plots` pour `crop_operations` qui possède déjà `site_id`).
- Aucune hypothèse du prompt n'est infirmée : pas de stop conditionnel déclenché.

## Migration créée
Fichier : `supabase/migrations/20261108000001_add_farm_id_to_core_tables.sql`
Hash SHA256 : `21bf819d6c1893c38ae4daa74b23f675383aa10688f63e4ce9002cc2f0219af6`

Contenu (par table) :
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS farm_id uuid REFERENCES public.farms(id);` (nullable, pas de NOT NULL)
- `CREATE INDEX IF NOT EXISTS idx_<table>_farm ON ...(farm_id);`
- Bloc BACKFILL : `UPDATE ... SET farm_id = s.farm_id FROM public.sites s WHERE <t>.site_id = s.id AND <t>.farm_id IS NULL` pour les 4 tables.
- Idempotent (`IF NOT EXISTS`, UPDATE gardé par `IS NULL`).
- Down script documenté en commentaire en fin de fichier (à ne pas exécuter).
- Aucune policy RLS modifiée.

## Validation (étape 3)

### `supabase status`
Cible confirmée locale (127.0.0.1:54321 / 54322), branch `main`.

### `supabase db reset`
Passe sans erreur, y compris l'application de `20261108000001_add_farm_id_to_core_tables.sql`.

### Vérification colonnes et index
```
table_name        column_name  data_type  is_nullable
campaigns         farm_id      uuid       YES
crop_operations   farm_id      uuid       YES
harvests          farm_id      uuid       YES
sales             farm_id      uuid       YES
```
Index confirmés : `idx_campaigns_farm`, `idx_crop_operations_farm`, `idx_harvests_farm`, `idx_sales_farm`.

### Test du backfill
Inséré une ligne par table avec `site_id` mais sans `farm_id`, sur un site pointant vers la ferme `Ferme AgroVision`. Rejoué uniquement le bloc `UPDATE` de la migration : toutes les lignes se sont vu affecter `farm_id = 00000000-0000-0000-0000-000000000001`. Données de test nettoyées après vérification (site `farm_id` remis à NULL, lignes supprimées).

### `npm run typecheck`
Exit 0. Aucune erreur TypeScript.

### `npx vitest run tests/integration/`
Résultat : 7 fichiers échoués / 10 ; 15 tests échoués / 39 ; 20 passés ; 4 sautés.

**Aucun échec ne mentionne `farm_id`.** Les échecs portent sur :
- Helpers auth (`current_user_site_id`, `current_user_funder_id`, `current_user_role`) — problèmes JWT / identifiants de connexion.
- Assertions RLS (financeur / comptable) — politiques de ligne.
- Journal d'événements et KPI — dépendants des données de seed après `db reset`.

Ces échecs sont pré-existants (documentés dans les rapports antérieurs, indépendants de l'ajout de la colonne `farm_id`). Aucun échec n'est lié à `farm_id` (pas de "column farm_id does not exist", pas d'erreur de schéma).

## Conclusion
La migration est créée, idempotente, appliquée avec succès sur la base locale. Les 4 colonnes et 4 index sont confirmés. Le backfill fonctionne. Le typecheck passe. Les échecs de tests d'intégration sont pré-existants et sans rapport avec `farm_id`.

## Décisions humaines requises
Aucune.

## Fichiers modifiés
- `supabase/migrations/20261108000001_add_farm_id_to_core_tables.sql` (nouveau, non commité)

## Prochaine étape
Rien d'autre dans le périmètre de cette vague. Aucun commit, aucun push, aucune commande ciblant la base distante n'a été exécuté.

## Statut final
PASS
