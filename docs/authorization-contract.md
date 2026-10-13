# Contrat d’autorisation Bahkanso

## Portée

Bahkanso cible une seule exploitation. Les permissions du frontend améliorent l’interface, mais ne constituent pas une frontière de sécurité : les mêmes règles doivent être appliquées par PostgreSQL/RLS. L’affectation fine à une parcelle, un lot ou un projet n’existe pas encore dans le schéma; les responsables ont donc un périmètre limité à leur domaine dans cette exploitation.

La matrice ci-dessous décrit les droits convenus. `L` = lire, `C` = créer, `M` = modifier, `S` = supprimer et `V` = valider. `—` = aucun droit. Les opérations financières et les justificatifs conservent en plus les restrictions de statut décrites après la matrice.

## Matrice rôle × module × action

| Rôle actif | Tableau de bord / rapports | Financements | Trésorerie | Dépenses | Documents | Agriculture | Élevage | Projets | Stocks | Fournisseurs / recettes / alertes | Audit | Utilisateurs | Paramètres | Profil propre |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Non authentifié, profil absent ou inactif | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `propriétaire` | L | L | L | L | L | L | L | L | L | L | L | L | L | L/M |
| `administrateur` | L/C/M/S | L/C/M/S/V | L/C/M/S | L/C/M/S/V | L/C/M/S/V | L/C/M/S | L/C/M/S | L/C/M/S | L/C/M/S | L/C/M/S | L seule | L/M | L/M |
| `gestionnaire` | L/C/M/S | L/C/M/S limité au statut prévu | L seule | L/C/M/S selon statut, sans V | L/C/M/S selon statut, sans V | L/C/M/S | L/C/M/S | L/C/M/S | L/C/M/S | L/C/M/S | — | — | L/M |
| `responsable_agricole` | — | — | — | — | — | L/C/M/S | — | — | — | — | — | — | — | L/M |
| `responsable_élevage` | — | — | — | — | — | — | L/C/M/S | — | — | — | — | — | — | L/M |
| `responsable_chantier` | — | — | — | — | — | — | — | L/C/M/S | — | — | — | — | — | L/M |
| `financeur` | — | L sur ses financements liés | — | — | — | — | — | — | — | — | — | — | — | L/M |

L’accès à un écran ne donne pas toutes les actions de cet écran. En particulier, `propriétaire` dispose d’une consultation métier complète, mais ne peut pas modifier les données métier. Les actions de validation sont réservées à l’administrateur.

### Restrictions financières et de documents

- Le gestionnaire peut préparer les financements au statut `prévu`, mais ne peut pas les marquer reçus.
- Le gestionnaire crée les dépenses en `brouillon` et peut les préparer/soumettre (`en attente`) ou corriger les éléments non validés. Il ne peut ni valider, ni rejeter, ni annuler une dépense. La suppression est réservée aux brouillons.
- Le gestionnaire peut créer et mettre à jour les documents `ajouté` ou `à vérifier`, mais ne peut pas les vérifier/rejeter. L’administrateur valide les dépenses et justificatifs.
- Les mouvements de trésorerie sont consultables par le gestionnaire, mais leur grand livre n’est pas modifiable par celui-ci.
- Le financeur ne voit que les financements associés au `funder_id` de son profil. Sans lien, aucun financement ne lui est exposé.
- Aucune affectation par utilisateur aux sites, parcelles, lots ou projets n’étant disponible, les responsables agricoles, élevage et chantier voient le domaine correspondant de l’exploitation unique; ils ne voient pas les autres domaines.

## Contrôles côté base

La migration `20261013081649_bahkanso_role_based_access.sql` prépare le socle suivant :

- Suppression des anciennes politiques applicatives ouvertes et révocation des privilèges directs `anon`/`authenticated`, puis octroi des seuls privilèges nécessaires aux politiques.
- Résolution du rôle via le profil `app_users` actif lié à `auth.uid()`; les rôles de métadonnées modifiables par l’utilisateur ne sont pas utilisés pour autoriser.
- Inscriptions Auth nouvelles avec profil `pending` et inactif jusqu’à affectation contrôlée.
- Interdiction au titulaire de changer son propre rôle, état actif ou lien Auth. Les actions de gestion de profils sont limitées aux champs applicatifs autorisés.
- Financeur lié par FK à `funders`; politiques de lecture limitées à ce lien.
- Lecture de l’audit limitée à l’administrateur et au propriétaire; écritures directes navigateur refusées et événements générés par des triggers append-only.
- Politiques différenciées par domaine pour agriculture, élevage, projets, stocks, finance et documents.

Les helpers `SECURITY DEFINER` sont placés dans le schéma `private`, utilisent un `search_path` vide et sont accordés aux seuls utilisateurs authentifiés. Le frontend masque les actions interdites à l’aide de `src/lib/permissions.ts`; PostgreSQL reste l’autorité finale.

## État de validation et limites

- Le modèle est mono-exploitation. Aucune isolation `farm_id` n’est introduite.
- Les responsables ne sont pas encore assignés à des sous-périmètres opérationnels; ce contrôle nécessitera des relations d’affectation.
- Les triggers d’audit consignent l’acteur et les valeurs avant/après sur les changements couverts. Ils ne remplacent pas encore un audit métier enrichi des motifs de validation.
- Le bucket public `app-assets` et les URL publiques existantes ne sont pas sécurisés par cette migration; la migration Storage dédiée et les URL signées restent requises avant production.
- La validation pgTAP de cette migration reste incomplète. Un ancien volume Supabase local a présenté une table `audit_logs` sans les colonnes métier du schéma de référence; l’ajout idempotent de ces colonnes est inclus dans la migration, mais le test doit être relancé sur une base fraîche et isolée.
- Le démarrage d’une base Supabase locale fraîche a échoué pendant son initialisation dans l’environnement de développement. L’application de migration sur un volume local existant ne constitue pas une validation propre de bout en bout.
- Aucun déploiement distant ni contrôle de configuration distante n’a été effectué. Ne pas considérer l’application prête pour la production sur la seule base de ce contrat.

## Bootstrap et exploitation

Les inscriptions publiques doivent rester désactivées en production. Le premier administrateur doit être activé par une procédure de bootstrap privilégiée et contrôlée; après initialisation, l’administration des rôles doit être limitée aux profils existants. Une désactivation urgente doit également révoquer les sessions Auth de l’utilisateur, car un jeton déjà émis peut rester valide jusqu’à son expiration.
