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

Arrêt sans suppression des données locales :

```sh
npx supabase stop --workdir supabase/isolated
```
