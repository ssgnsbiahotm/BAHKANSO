# Environnement Supabase isolé

Ce projet CLI est distinct de la configuration Supabase habituelle du dépôt :

- identifiant local : `bahkanso-isolated-access-test` ;
- API : `http://127.0.0.1:56321` ;
- PostgreSQL : `127.0.0.1:56322` ;
- migrations et seeds automatiques désactivés ;
- les migrations historiques et les seeds du dépôt ne sont pas copiés ici.

## CI d'intégration isolée

Le workflow manuel
`.github/workflows/isolated-supabase-ci.yml` s'exécute sur un runner GitHub-hosted
éphémère (`ubuntu-24.04`). Le démarrage part d'un daemon Docker vierge et d'un
volume neuf; il ne dépend pas du volume du Codespace. Les actions sont épinglées
à des commits précis (checkout 7.0.1, setup-node 7.1.0, upload-artifact 7.0.2).
Ces versions sont compatibles avec Node 24 et les runners GitHub actuels;
`ubuntu-24.04` fournit Docker pour Supabase local. Le runtime Node.js est fixé à
`24.21.0` dans `.nvmrc`, la CLI Supabase à `2.120.0` dans le lockfile npm, et
PostgreSQL major 17 dans la configuration locale. La version du daemon Docker
reste fournie par l'image maintenue par GitHub, plutôt que remplacée dans le job.

L'ordre est automatisé et sans commande de reset :

1. npm installe le lockfile, les tests unitaires, le typecheck et le lint. Le
   build utilise deux valeurs Vite factices limitées à cette étape et écrit
   dans un dossier temporaire; les fichiers dotenv du checkout ont été retirés.
2. `supabase start --workdir supabase/isolated` démarre PostgreSQL, GoTrue,
   PostgREST et Kong. Les services Studio, Storage, Realtime, Logflare et autres
   services non requis sont exclus. Le CLI n'est jamais lié à un projet distant.
3. `status --output json` (le format de variables `-o json` du CLI 2.120.0)
   omet les clés `linked_*` quand le projet n'est pas lié; le format distinct
   `--output-format json` utilise `linked_project: null`. Le test vérifie le
   contrat de sortie utilisé, les URL API/Postgres locales attendues, l'identifiant
   de projet local, l'absence des fichiers/variables de liaison et les commandes
   de base explicitement locales avant toute préparation SQL. Les diagnostics
   n'affichent que des types, indicateurs de présence et correspondances booléennes.
4. `fixture.sql` crée quatre tables représentatives et le trigger Auth synthétique;
   `auth_test_users.sql` insère cinq identités Auth SQL à UUID fixes pour pgTAP.
5. Le même test crée séparément cinq comptes avec GoTrue via la clé anon locale.
   `bootstrap_profiles.sql` attribue les rôles aux profils API synthétiques.
   Les identités SQL fixes et les comptes GoTrue (UUID générés) ne se recouvrent pas.
6. La CLI applique les candidates 010 et 011 par `db query --local`, puis psql
   exécute les 34 assertions pgTAP. Le harnais vérifie le plan, chaque résultat
   `ok`, l'absence de `not ok`/`Bail out!` et l'échec de psql en cas d'interruption.
7. Les assertions Auth/API utilisent uniquement la clé publique locale et de
   vraies sessions. Un test obligatoire fait échouer le job si l'intégration est
   ignorée. L'arrêt ciblé est tenté dès que l'étape de démarrage a été exécutée,
   y compris après un échec de démarrage ou des tests; il n'utilise pas
   `--no-backup`.

La fixture n'est **pas** une reconstruction du schéma complet : elle ne crée
que `app_users`, `audit_logs`, `funders` et `fundings`, les données synthétiques
et le trigger nécessaires à ces candidates. Elle n'applique aucune migration
historique, seed du dépôt, données Storage ou autres domaines métier. Les cinq
identités SQL servent uniquement aux tests de politiques; les cinq comptes
GoTrue couvrent les appels API. Ce test de fixture ne prouve pas que les
candidates sont prêtes à être appliquées en production.

GitHub Actions n'expose le déclenchement `workflow_dispatch` que si le fichier
workflow existe sur la branche par défaut. Le publier seulement sur une branche
de fonctionnalité ne suffit donc pas à le rendre lançable. Pour éviter de
fusionner les changements applicatifs avant leur validation, publier d'abord le
workflow seul sur la branche par défaut dans une PR dédiée. Ne pas le lancer sur
la branche par défaut, où les scripts/tests requis peuvent ne pas exister.
Après publication contrôlée de la branche de CI, ouvrir **Actions**, sélectionner
**Isolated Supabase integration**, choisir
`ci/isolated-supabase-integration` dans **Run workflow**, puis démarrer le run.
Le workflow reste manuel seulement; cette documentation ne lance ni ne publie
le workflow.

En cas d'échec, l'artefact du job contient uniquement l'état des conteneurs,
des journaux de services expurgés, le TAP et les sorties des tests ciblés.
Il ne contient ni dump de base ni fichier dotenv. Les journaux de démarrage
bruts restent dans le runner temporaire et ne sont pas téléversés.

Depuis la racine du dépôt, démarrer uniquement les services nécessaires :

```sh
npx supabase start --workdir supabase/isolated --exclude studio,edge-runtime,logflare,vector,postgres-meta,storage-api,imgproxy,realtime,mailpit,supavisor
```

Après démarrage, le garde-fou du test vérifie le format de status du CLI 2.120.0
et refuse toute liaison ou preuve ambiguë avant le bootstrap. Le test complet
automatisé (fixture synthétique,
comptes Auth locaux, candidates 010/011, pgTAP et appels PostgREST) se lance
depuis la racine avec :

```sh
BAHKANSO_RUN_LOCAL_SUPABASE=1 \
BAHKANSO_REQUIRE_LOCAL_SUPABASE=1 \
BAHKANSO_TAP_RESULTS_FILE=/tmp/bahkanso-access.tap \
npm run test:integration
```

Le workflow CI part toujours d'un runner et d'un volume vierges. Pour une
exécution manuelle locale, utiliser uniquement ce projet isolé (un volume
synthétique préexistant peut être réutilisé); ne jamais viser le projet Supabase
habituel ni un projet distant. Ne pas utiliser `db reset` : cela pourrait
exécuter les migrations/seeds historiques dont les tests n'ont pas besoin.
Les scripts de setup contiennent uniquement des identités et données
synthétiques.

Le volume de l’identifiant `bahkanso-isolated-access-test` a déjà été utilisé
pour les tests SQL synthétiques et n’est plus vierge. Il a été conservé à
l’arrêt. Les fixtures sont idempotentes et le test utilise des identités
synthétiques distinctes; ce volume peut donc être réutilisé. Aucune base vierge
ni aucun deuxième projet ne sont nécessaires.

Ce bootstrap minimal n’est pas une reconstruction complète des migrations du
dépôt. Il valide le contrat d’accès sur le schéma synthétique déclaré dans
`fixture.sql`; il ne prouve pas la compatibilité avec l’état distant.

Une première tentative antérieure avait échoué pendant la migration GoTrue
(code de sortie 1). Le code 137 relevé ensuite concernait des conteneurs arrêtés
explicitement et ne démontrait pas un manque de mémoire.

Le 8 octobre 2026, une tentative instrumentée unique a réutilisé le même projet
et volume, avec migrations et seeds automatiques désactivés. PostgreSQL
répondait aux contrôles `pg_isready` dans son conteneur. PostgREST a toutefois
échoué à se connecter à `supabase_db_bahkanso-isolated-access-test` (`172.18.0.2:5432`):
les connexions et l’écoute des notifications PostgreSQL ont expiré. Les
contrôles de santé Auth ont aussi échoué; son journal disponible ne donne pas
de cause plus précise. `supabase start` a donc échoué sur les contrôles de
santé et a arrêté/nettoyé ses conteneurs et son réseau. Les événements Docker
montrent des codes 137 pour Auth et PostgREST au moment de cet arrêt, sans
attribut `OOMKilled`; ils ne prouvent pas un OOM. Après cet arrêt, le volume
`supabase_db_bahkanso-isolated-access-test` était toujours présent, mais les
conteneurs et le réseau du projet ne l’étaient plus.

Le symptôme réseau est confirmé; sa cause sous-jacente n’est pas déterminée.
Les appels GoTrue/PostgREST et la suite d’intégration Auth/API n’ont donc pas
été validés dans ce Codespace. Les 34 assertions pgTAP exécutées
antérieurement sur PostgreSQL isolé restent une preuve SQL distincte, pas une
preuve d’intégration Auth/API.

## Validation complémentaire du schéma complet — préparée, non exécutée

Cette piste conserve la suite de fixture comme preuve indépendante et prépare
un second job CI avec son propre runner, son propre volume et son propre
artefact. Le job de schéma dépend du succès du job fixture; ses résultats ne
sont pas fusionnés avec ceux de la fixture. Ce parcours n’a pas été lancé.

### Inventaire des migrations

L’ordre ci-dessous est celui des versions préfixées dans les noms de fichiers.
« Destructif » indique ici la suppression de politiques ou de lignes, pas un
`DROP TABLE`.

| Migration | Objets et effets | DML / opérations destructives | Dépendances | Décision |
|---|---|---|---|---|
| `20260929171038_001_core_tables.sql` | 11 tables cœur, index, RLS, politiques anon CRUD, `generate_expense_reference()` initiale SECURITY DEFINER | Aucun DML exécuté à l’application; `DROP POLICY IF EXISTS` remplace des politiques | Schéma PostgreSQL/Supabase de base, rôles `anon` et `authenticated` | Incluse byte-for-byte; 007 remplace la fonction et 010/011 resserrent ensuite l’accès |
| `20260929171114_002_operational_tables.sql` | 18 tables opérationnelles, index, RLS et politiques anon CRUD | Aucun DML exécuté à l’application; `DROP POLICY IF EXISTS` sur politiques | Tables cœur et rôles créés/présents après 001 | Incluse byte-for-byte |
| `20260929171147_003_seed_data_part1.sql` | Aucun objet de schéma | Supprime les données de nombreux domaines puis insère les données de démonstration, dont profils et coordonnées d’exemple | Tables de 001/002; suppression ordonnée selon leurs relations | Exclue entièrement |
| `20260929171250_004_seed_data_part2.sql` | Aucun objet de schéma | Inserts de démonstration pour financements et domaines opérationnels | Tables de 001/002 et données de référence créées par 003 | Exclue entièrement |
| `20260929171728_005_seed_data_part3.sql` | Aucun objet de schéma | Supprime des données partielles puis insère dépenses, documents, transactions, alertes et journaux d’exemple | Tables de 001/002 et enregistrements de référence des seeds précédents | Exclue entièrement |
| `20261002203614_006_site_content.sql` | `site_content`, RLS et politiques anon SELECT / authenticated write | Contient un INSERT terminal de contenus de démonstration | Schéma `public` et rôles Supabase | Incluse sous forme dérivée : seul cet INSERT terminal est omis; DDL et politiques gardés textuellement |
| `20261004122416_007_auth_and_rls_tightening.sql.sql` | Lien `app_users.auth_id`, politiques Auth, fonctions et trigger sur `auth.users` | Remplace de nombreuses politiques; l’INSERT métier est dans le corps de `handle_new_user()` et ne s’exécute qu’à l’inscription Auth | `auth.users` fourni par Auth local et `app_users`/tables de 001/002 | Incluse byte-for-byte; nécessaire au lien Auth et au test du trigger |
| `20261005195209_008_recipes_and_rls_fixes.sql.sql` | Table `recipes`, politiques et réparation des politiques `crops` | Remplace les politiques ciblées; aucun DML de données | `crops` créé par 002 et rôles Auth | Incluse byte-for-byte |
| `20261005195221_009_storage_policies.sql.sql` | Politiques RLS sur `storage.objects`, bucket ciblé `app-assets` | Supprime puis recrée quatre politiques ciblées | `storage.objects` fourni par le service/migrations Storage locales | Incluse byte-for-byte; service Storage activé dans le projet local |

La migration 006 mélange bien DDL et contenu. Le préparateur
`scripts/prepare-full-schema-validation.mjs` vérifie le marqueur exact et la
fin de fichier avant de dériver le seul fichier temporaire de migration. Il
garde le préfixe source inchangé et omet uniquement le `INSERT INTO
site_content ... ON CONFLICT (key) DO NOTHING`. Les migrations 001, 002, 007,
008 et 009 sont copiées byte-for-byte. Les versions 003–005 ne sont jamais
copiées; les seeds Supabase restent désactivés.

La reconstruction est donc fidèle aux migrations structurelles retenues mais
n’est **pas** l’exécution intégrale du répertoire historique : 006 est dérivée,
les migrations de démonstration sont exclues, et Auth/Storage/PostgreSQL de
base proviennent toujours des images locales associées au CLI épinglé. Elle ne
représente pas l’état distant.

### Ordre et données synthétiques

Le préparateur construit un workdir temporaire à partir de la configuration
isolée connue, garde les migrations automatiques et les seeds désactivés,
active Storage et copie uniquement la liste ci-dessus. Le job séparé démarre
les services locaux, puis vérifie le status et les endpoints avec le même
garde-fou expurgé. Ce n’est qu’après cette preuve que le test exécute
`supabase migration up --local --workdir ...`, puis le bootstrap. Aucun projet
lié ou endpoint distant n’est accepté.

Après application des migrations retenues, le test crée six comptes par le
service Auth local réel. `bootstrap.sql` promeut seulement le compte synthétique
administrateur nécessaire au préflight 010, attribue les profils de test,
supprime le profil applicatif d’une identité de test sans supprimer son
utilisateur Auth, puis ajoute un financeur, un financement et un événement
d’audit synthétiques. Les candidates 010 puis 011 sont appliquées ensuite.
Enfin, pgTAP et les appels Auth/PostgREST vérifient le schéma et les permissions.
Les comptes réels Auth ne remplacent pas les identités à UUID fixes de la suite
fixture existante.

Les préconditions visibles des candidates correspondent au schéma retenu :
007 ajoute le lien Auth unique et sa FK, 007 fournit le trigger attendu, et
`fundings.funder_id` référence `funders.id` avec les colonnes de lecture exigées
par 011. Le compte administrateur est créé via Auth local puis vérifié actif et
lié avant 010. Aucune candidate n’est modifiée. Ces éléments sont des
préconditions statiques; ils ne prouvent pas leur exécution réussie tant que le
parcours CI n’a pas tourné.

### Assertions et limites de couverture

`access.test.sql` prévoit 37 assertions pgTAP : inventaire des 31 tables,
activation RLS, droits effectifs, disparition des politiques anon historiques,
fonctions et vues liées, droits Storage visibles, profils absents/inactifs/de
rôle inconnu, propriétaire en lecture seule sur les financements, administrateur
technique et financeur sans accès implicite, protection de `role`, `active` et
`auth_id`, refus UPDATE/DELETE sur l’audit et vérification des valeurs qui
doivent rester inchangées. Le harnais exige le plan `1..37`, chaque résultat
`ok` et zéro skip; l’autre test Node vérifie le trigger après une inscription
Auth réelle et les réponses API correspondantes.

Le périmètre applicatif structuré retenu est : `farms`, `app_users`, `funders`,
`fundings`, `bank_accounts`, `cash_accounts`, `transactions`, `suppliers`,
`expense_categories`, `expenses`, `documents`, `sites`, `plots`, `crops`,
`campaigns`, `crop_operations`, `harvests`, `animals`, `animal_lots`,
`animal_events`, `projects`, `project_steps`, `inventory_items`,
`inventory_movements`, `inventory_counts`, `budgets`, `alerts`, `notifications`,
`audit_logs`, `site_content` et `recipes`. Le test vérifie que les politiques
du jeu de candidates ferment ces tables aux rôles clients sauf le profil propre
et les colonnes de financement explicitement accordées.

Restent notamment hors de la validation comportementale :

- les règles d’autorisation métier de tous les domaines autres que la lecture
  limitée des financements; leurs tables restent fermées plutôt que validées
  pour un usage métier;
- la lecture publique de `site_content`, que le jeu 010/011 bloque également;
- la lecture effective, l’upload, l’upsert, la suppression et l’association des
  objets Storage aux lignes `documents`. 009 conserve une politique de lecture
  publique du bucket `app-assets`; le test ne crée pas d’objet et ne démontre
  donc pas le comportement réel de Storage;
- les appels de fonctions applicatives au-delà des droits et de l’échec attendu
  de `generate_expense_reference()` en SECURITY INVOKER sans privilège sur
  `expenses`; les procédures métier et intégrations externes;
- la cohérence financière (montants, taux, rapprochements, double écriture),
  l’immuabilité transactionnelle de l’audit et les contraintes métier sur les
  statuts, références ou relations polymorphes; leur présence ou absence dans
  les migrations n’est pas une preuve de validation métier;
- le comportement sur les données et contraintes préexistantes réelles, les
  migrations en production et l’état Supabase distant.

Le workflow conserve le job fixture existant et ajoute un job
`full-schema-validation` séparé, avec démarrage, variables de test, résultats
pgTAP et artefact diagnostics distincts. Les deux utilisent le mode obligatoire
et font échouer le job si leur test d’intégration est ignoré. Ce job doit encore
être relu avant publication et lancement.

Arrêt sans suppression des données locales :

```sh
npx supabase stop --workdir supabase/isolated
```
