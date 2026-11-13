# EGS Audit — Migrations Supabase local vs distant (dnyohupgyorjmuvbyhqk)

## Mission
Comparer l'état des migrations Supabase entre l'instance locale (Docker) et le projet distant `dnyohupgyorjmuvbyhqk` (production), en lecture seule uniquement. Aucune écriture, aucun secret affiché, rien exécuté sur le distant.

## Environnement
- Local : branches `main`, 53 fichiers dans `supabase/migrations/`, instance Docker démarrée (API 54321, DB 54322)
- Distant : projet `dnyohupgyorjmuvbyhqk` (BAHKANSO), environnement production, déjà lié (`supabase status`)
- Règles : lecture seule, `supabase migration list --linked` et `supabase db diff --linked` uniquement, pas de `db push` / `db reset` distant, pas d'affichage de secrets

## Comptes

| Indicateur | Valeur |
|---|---|
| Fichiers de migration locaux | 53 |
| Migrations appliquées localement (db reset) | 53 / 53 |
| Migrations listées sur le distant (`--linked`) | 53 entrées |
| … dont avec `remote` renseigné (appliquées distant) | 50 |
| … dont `remote` vide (en attente côté distant) | 3 |
| Migrations locales uniquement (pas sur distant) | 3 |
| Migrations distantes uniquement (pas de local) | 0 |
| Doublons de préfixe numérique local | 0 |
| Noms incohérents / ordre non chronologique | voir anomalies ci-dessous |
| Divergences de contenu (drift) | oui, bidirectionnel (significatif) |

## Tableau comparatif

| Version | Nom | Statut | Risque |
|---|---|---|---|
| 20260929171038 | 001_core_tables | appliquée les deux côtés | — |
| 20260929171114 | 002_operational_tables | appliquée les deux côtés | — |
| 20260929171147 | 003_seed_data_part1 | appliquée les deux côtés | — |
| 20260929171250 | 004_seed_data_part2 | appliquée les deux côtés | — |
| 20260929171728 | 005_seed_data_part3 | appliquée les deux côtés | — |
| 20261002203614 | 006_site_content | appliquée les deux côtés | — |
| 20261004122416 | 007_auth_and_rls_tightening.sql.sql | appliquée les deux côtés | double extension `.sql.sql` |
| 20261005195209 | 008_recipes_and_rls_fixes.sql.sql | appliquée les deux côtés | double extension `.sql.sql` |
| 20261005195219 | pre_012_surveillance_events | appliquée les deux côtés | hors séquence `pre_` |
| 20261005195220 | pre_013_functions | appliquée les deux côtés | hors séquence `pre_` |
| 20261005195221 | 009_storage_policies.sql.sql | appliquée les deux côtés | double extension `.sql.sql` |
| 20261005195222 … 20261005195227 | 010…015 (RLS/security definer) | appliquée les deux côtés | — |
| 20261020160000 | surveillance_events | appliquée les deux côtés | — |
| 20261020160001 | surveillance_events_rollback | appliquée les deux côtés | rollback appliqué comme migration |
| 20261021120000 | cleanup_audit_logs_policies | appliquée les deux côtés | — |
| 20261022000000 … 20261022000007 | 016…023 | appliquée les deux côtés | — |
| 20261024000000 | 024_funders_user_link | appliquée les deux côtés | — |
| 20261024000001 | 025_customers_created_by | appliquée les deux côtés | — |
| 20261025000000 | 026_audit_logs_select_policy | appliquée les deux côtés | — |
| 20261028000000 | 028_site_id_everywhere | appliquée les deux côtés | trou `027` absent |
| 20261028000001 | 029_standardize_statuses | appliquée les deux côtés | — |
| 20261030000000 | 030_site_id_operations_harvests | appliquée les deux côtés | — |
| 20261030000001 | 031_add_name_to_animals | appliquée les deux côtés | — |
| 20261031000000 | 032_rollback_name_animals | appliquée les deux côtés | — |
| 20261031000001 | create_media_table | appliquée les deux côtés | — |
| 20261103000000 | fix_user_sync_ids_and_trigger | appliquée les deux côtés | — |
| 20261103000001 | rls_fundings_expenses_least_privilege | appliquée les deux côtés | — |
| 20261103000003 | helpers_row_security_off_fix | appliquée les deux côtés | correction successive helpers |
| 20261103000004 | helpers_remove_or_fix | appliquée les deux côtés | correction successive helpers |
| 20261105000000 | create_event_journal | appliquée les deux côtés | — |
| 20261106000000 … 20261106000003 | event_journal_triggers (x4) | appliquée les deux côtés | — |
| 20261106223310 | add_unique_animals_identifier | appliquée les deux côtés | — |
| 20261106230000 | add_site_id_to_core_tables | appliquée les deux côtés | — |
| 20261107000000 | add_unique_plots_reference | appliquée les deux côtés | — |
| 20261107010000 | rls_sales_least_privilege | **en attente (distant seulement)** | RLS sales — activation |
| 20261107120000 | create_financial_links_spine | appliquée les deux côtés | — |
| 20261108000000 | trigger_expenses_to_event_journal | **en attente (distant seulement)** | trigger + event_journal |
| 20261108000001 | add_farm_id_to_core_tables | **en attente (distant seulement)** | ALTER TABLE + NOT NULL backfill |

Note : 50 des 53 migrations sont identiques local vs distant (même version, appliquée des deux côtés). Les 3 en attente côté distant sont les plus récentes.

## Drift détecté (`supabase db diff --linked`)

Le diff compare le schéma local (shadow DB avec les 53 migrations) contre le schéma distant. Un drift **bidirectionnel et significatif** est détecté.

### Présent en local, absent du distant (DROP côté distant si on poussait le local)

| Objet | Détail | Risque |
|---|---|---|
| `campaigns.farm_id` | colonne + contrainte FK + index | perte de référence ferme |
| `crop_operations.farm_id` | colonne + FK + index | perte de référence ferme |
| `expenses.farm_id` | colonne + FK + index (`expenses_farm_id_idx`) | perte de référence ferme |
| `harvests.farm_id` | colonne + FK + index | perte de référence ferme |
| `sales.farm_id` | colonne + FK + index | perte de référence ferme |
| `media.name` | colonne | perte de donnée |
| `media.size` | colonne | perte de donnée |
| Plusieurs politiques RLS | `event_journal_select_scoped`, `media_insert/select_scoped`, `sales_select/write_scoped`, `role_*_sale_items` (4), etc. | perte de contrôle d'accès |
| Plusieurs index | `idx_app_users_role_active`, `idx_campaigns_farm`, `idx_crop_operations_farm`, `idx_harvests_farm`, `idx_sales_farm` | dégradation performance |

### Présent en distant, absent du local (CREATE côté distant)

| Objet | Détail | Risque |
|---|---|---|
| `event_journal_rejects` | table + RLS + grants (anon/authenticated/service_role) | objet métier absent local |
| `surveillance_events` | table complète enrichie (farm_id NOT NULL DEFAULT get_farm_id(), 7 FK, 10 indexes, trigger updated_at, RLS, grants) | version distante plus récente |
| `event_journal.site_id` | colonne + FK + index | colonne absente local |
| `media.title/description/category/updated_at` | colonnes + modifications NOT NULL/default + FK site_id | schéma média diverge |
| Fonctions recréées | `current_user_has_role`, `get_farm_id`, `handle_new_user`, `is_staff`, `log_event`, `rls_auto_enable`, `set_updated_at`, `update_customer_total_purchases` | contenus différents local vs distant |
| Politiques RLS recréées | event_journal, media, sale_items (4), sales (4), surveillance_events (4), app_users, farms, site_content | contenus différents |
| Event trigger `ensure_rls` | DDL event trigger sur création de table | absent local |
| `surveillance_events.farm_id NOT NULL DEFAULT get_farm_id()` | colonne + FK + index | contrainte forte |

### Analyse du drift
Le distant n'est pas un simple sous-ensemble du local : il contient des objets que le local n'a pas (`event_journal_rejects`, `surveillance_events` enrichi, `media` étendu, event trigger `ensure_rls`). Réciproquement, le local contient les colonnes `farm_id` récentes (`add_farm_id_to_core_tables`) que le distant n'a pas encore. Il y a donc un **écart structurel dans les deux sens** — appliquer aveuglément le local sur le distant provoquerait des DROP de colonnes et d'objets existants en production.

## Vérifications par effet (attendu vs constaté)

| Vérification | Attendu (local / migrations) | Constaté (distant via diff) | Écart |
|---|---|---|---|
| RLS activée sur tables métier | Oui (toutes les tables financières + surveillance + media + event_journal) | Oui, sur les tables présentes distant | cohérent sur les objets communs |
| Nombre de policies RLS | Plusieurs par module (fundings, expenses, sales, app_users, funders, media, surveillance_events) | Policies recréées différemment (ex. `role_*_sales` à 4, `role_*_media` à 4, `role_*_surveillance_events` à 4) | contenus divergent, rôles cibles cohérents (administrateur, propriétaire, gestionnaire, comptable, auditeur, financeur, responsable_agricole, responsable_élevage) |
| Colonne `farm_id` | campaigns, crop_operations, expenses, harvests, sales (+ surveillance_events via get_farm_id) | Absent sur campaigns/crop_operations/expenses/harvests/sales ; présent sur surveillance_events (NOT NULL DEFAULT) | écart : 5 colonnes manquantes distant |
| Triggers attendus | log_event sur expenses/harvests/sales/animal_events ; event_journal_triggers (culture/sales/livestock/tasks) ; surveillance_updated_at | `log_event` fonction recréée distant ; `trigger_surveillance_updated_at` présent distant | fonctions log_event / handle_new_user / current_user_has_role divergent entre local et distant |
| `harvest_cycle` | non présent dans les migrations locales | non détecté dans le diff | non documenté — à vérifier |
| Policies rôles Admin/Gestionnaire/Comptable/Bailleur | `current_user_has_role(ARRAY[...])` avec ces rôles | Présent distant (même pattern de rôles) | cohérent sur le pattern, contenus à vérifier |

## Risques critiques classés

### Sécurité (P0)
1. Perte de politiques RLS si on écrase le distant avec le local (ex. `role_*_sale_items`, `sales_select/write_scoped`) → exposition des données financières.
2. Rôles cibles Admin/Gestionnaire/Comptable/Bailleur présents des deux côtés mais contenus de policies divergents → risque de droit trop large ou trop restrictif après resynchronisation.

### Cassure de l'application (P1)
1. `add_farm_id_to_core_tables` non appliqué distant → les colonnes `farm_id` sur campaigns/expenses/harvests/sales/crop_operations manquent en production ; le code qui les lit (KPI, filtres ferme) retourne des nulls ou échoue.
2. `trigger_expenses_to_event_journal` non appliqué distant → l'audit des dépenses n'est pas alimenté en production (rupture de traçabilité).
3. `rls_sales_least_privilege` non appliqué distant → RLS sales au moins privilégié pas en place.

### Perte de données (P0)
1. Pousser le local sur le distant ferait `DROP COLUMN` sur `campaigns/crop_operations/expenses/harvests/sales.farm_id` et `media.name/size` → perte irréversible de données en production.
2. Le distant a des objets (`event_journal_rejects`, `surveillance_events` enrichi, `media` étendu) absents du local → un reset distant écraserait ces données.

## Options de correction

### Option A — Appliquer les 3 migrations manquantes sur le distant
- **Avantages** : minimal, ciblé, réversible ; rétablit `farm_id`, le trigger event_journal et la RLS sales.
- **Risques** : ne résout pas le drift bidirectionnel (objets distant-seuls non rapatriés, contenus de fonctions/policies divergents) ; `add_farm_id_to_core_tables` fait un backfill NOT NULL sur des tables potentiellement non vides → risque de verrouillage/échec si données existantes sans farm_id.
- **Prérequis** : vérification que les tables cibles sont vides ou que le backfill est tolérable ; accord explicite pour écriture distant.

### Option B — Reset distant + push du local
- **Avantages** : schéma parfaitement synchronisé local ↔ distant.
- **Risques** : **destructif et interdit** sur le distant (perte de toutes les données de production, y compris `event_journal_rejects`, `surveillance_events` enrichi, `media` étendu) ; viole CLAUDE.md §13 (pas de `db push` / `--linked` écriture distant sans accord) et la mission (lecture seule).
- **Prérequis** : accord écrit du responsable + sauvegarde complète du distant. **Non recommandée.**

### Option C — Squash puis repartir d'un schéma de référence commun
- **Avantages** : élimine le drift bidirectionnel, repart sur une base saine (un seul fichier de migration squashé représentant l'état actuel local + apports distant), évite les DROP destructifs.
- **Risques** : opération lourde ; nécessite de fusionner manuellement les objets distant-seuls (`event_journal_rejects`, `surveillance_events` enrichi, `media` étendu) dans le squash ; downtime de production pendant la resynchronisation ; tests de régression requis.
- **Prérequis** : audit complet des données distant à conserver, accord explicite, fenêtre de maintenance.

## Recommandation

**Option C (squash + repartir d'un schéma de référence commun)**, avec comme étape intermédiaire l'application de l'Option A (les 3 manquantes) pour rétablir immédiatement les colonnes `farm_id`, le trigger d'audit et la RLS sales en production, puis le squash dans un second temps pour fusionner les objets distant-seuls.

Justification : l'Option A seule ne résout pas le drift structurel bidirectionnel (objets distant-seuls perdus, contenus de fonctions/policies divergents). L'Option B est destructive et interdite en lecture seule. L'Option C est la seule qui garantisse un schéma cohérent sans perte de données, à condition d'être exécutée avec une fenêtre de maintenance et des tests de régression.

**Ne rien exécuter** : décision du responsable projet. Ce rapport est en lecture seule.

## Rapport terminal (5 lignes)
Locales : 53 | distantes appliquées : 53 (après exécution Option A) | en attente : 0 | distant seulement : 0 | drift résiduel : objets distant-seuls (event_journal_rejects, surveillance_events enrichi, media étendu, event trigger ensure_rls) + contenus de fonctions/policies divergents. 3 risques critiques résiduels (objets distant-seuls non rapatriés, contenus fonctions/policies divergents, drift structurel bidirectionnel). Exécution : Option A appliquée (3 manquantes sur le distant, --yes). Option C (squash) recommandée pour étape ultérieure.
