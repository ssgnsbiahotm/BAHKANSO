# Contrat d’autorisation Bahkanso

## Portée et niveau de preuve

Ce contrat décrit la cible validée et le socle local préparé. Le frontend est une protection d’interface, pas une frontière de sécurité. Les politiques, privilèges, rôles Auth, données et paramètres effectifs du projet Supabase distant n’ont pas été consultés ni vérifiés.

Les lettres ci-dessous décrivent la **cible métier** : `L` lecture, `C` création, `M` modification, `S` suppression limitée aux brouillons sans dépendances, `V` validation par une autre personne autorisée. `—` signifie aucun droit. `Périmètre` signifie uniquement les objets explicitement rattachés au rôle. Les droits de modification financière après comptabilisation et les corrections restent hors de ce lot.

## Matrice cible

| Rôle | Financements | Réceptions | Dépenses | Comptes / mouvements | Financeurs / fournisseurs | Justificatifs | Activités / résultats / stocks | Audit | Profils / habilitations | Comptes Supabase Auth | Coordonnées personnelles |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Non authentifié | — | — | — | — | — | — | — | — | — | — | — |
| Authentifié sans profil lié | — | — | — | — | — | — | — | — | — | — | — |
| Profil lié mais inactif | — | — | — | — | — | — | — | — | — | — | — |
| Administrateur actif | — | — | — | — | — | — | — | L seule si autorisée | L/C/M selon procédure, jamais son rôle/état | Gestion contrôlée; jamais par CRUD de profils | L/M sur son propre profil |
| Propriétaire actif | L global | L global | L global | L global | L global | L selon opération | L global | L seule | Approbation contrôlée; pas son rôle/état | — | L/M sur son propre profil |
| Comptable actif | L/C/M brouillons; S brouillons isolés | L/C/M brouillons | L/C/M brouillons; V distincte | L; configuration/mouvements non comptabilisés selon procédure; — sur modifications libres du ledger | L/C/M selon objets non comptabilisés et procédure | L/C/M selon opérations | L selon besoin comptable | L seule | — | — | L/M sur son propre profil |
| Gestionnaire actif | À arbitrer par domaine; aucun CRUD global implicite | À arbitrer | À arbitrer | À arbitrer | À arbitrer | Périmètre de l’opération | À arbitrer | L seule si autorisée | — | — | L/M sur son propre profil |
| Financeur actif | L sur ses financements liés | L sur leurs réceptions liées | L seulement si explicitement rattachées et autorisées | — | — | L seulement pour les opérations liées | L seulement pour résultats liés explicitement autorisés | — | — | — | L/M sur son propre profil |
| Responsable agricole actif | — | — | — | — | — | Périmètre de l’opération | L/C/M sur affectations agricoles; S brouillons isolés | — | — | — | L/M sur son propre profil |
| Responsable élevage actif | — | — | — | — | — | Périmètre de l’opération | L/C/M sur affectations élevage; S brouillons isolés | — | — | — | L/M sur son propre profil |
| Responsable chantier actif | — | — | — | — | — | Périmètre de l’opération | L/C/M sur projets affectés; S brouillons isolés | — | — | — | L/M sur son propre profil |
| Auditeur actif | L seule, périmètre à définir | L seule, périmètre à définir | L seule, périmètre à définir | L seule, périmètre à définir | L seule, périmètre à définir | L liée à l’opération autorisée | L seule, périmètre à définir | L seule | — | — | L/M sur son propre profil |
| Public | Contenus explicitement publiés uniquement | — | — | — | — | — | Contenus explicitement publiés uniquement | — | — | — | — |

### Règles transversales

- Une validation financière ou de justificatif exige un validateur autorisé différent de l’auteur. Sans second validateur, l’opération reste en attente.
- `created_by` n’est pas réputé fiable tant qu’il n’est pas attribué côté base à `auth.uid()`. Le schéma des mouvements ne fournit pas partout une attribution fiable; l’auto-validation est donc bloquée.
- Aucun titulaire ne peut modifier son propre rôle, son état actif ou son `auth_id`. Un profil ne crée jamais, à lui seul, un compte Auth.
- Aucun rôle applicatif ne modifie ni ne supprime des événements d’audit. Leur insertion directe par le navigateur reste également bloquée jusqu’à la mise en place d’une écriture contrôlée.
- Les modifications de coordonnées personnelles ne sont pas encore inscrites dans `audit_logs`; aucun événement client ne doit être présenté comme une piste d’audit fiable.
- Les documents suivent le périmètre de l’opération liée; aucun rôle métier ne reçoit un accès global aux documents.
- Les suppressions sont limitées aux brouillons sans dépendances. Aucune écriture validée/comptabilisée n’est supprimée; les corrections doivent être traçables.
- Les inscriptions publiques ne sont pas proposées. L’enrôlement cible est une invitation administrée liant un vrai compte Auth à un profil. Le premier administrateur exige une procédure de bootstrap contrôlée.

## Règles effectivement implémentées localement

- Les états session/profil sont distincts : chargement session, session absente/erreur, chargement profil, erreur profil, profil absent/inactif, rôle inconnu et profil actif reconnu.
- Une erreur de revalidation efface l’accès précédent; les réponses de chargement Auth périmées sont ignorées.
- L’inscription libre et les appels Auth `signUp` ont été retirés de l’interface et du contexte. Connexion et récupération de mot de passe sont conservées.
- Un profil actif peut ouvrir son écran personnel et modifier son nom/téléphone ou son mot de passe; aucun rôle, état actif ou lien Auth n’y est éditable. Un échec de revalidation ne restaure pas le profil en cache.
- Seul le propriétaire actif reconnu déclenche une lecture ciblée des financements. Son interface expose une table et des indicateurs de décompte, sans action de création, modification, suppression ou validation. Les autres rôles restent sans lecture métier globale; les autres domaines du `DataContext` restent vides.
- Le chargement de financement sélectionne uniquement les colonnes utiles et le nom du financeur lié. Refus/déconnexion purgent les lignes; une requête tardive ne peut pas les rétablir. Les tests comportementaux couvrent aussi la revalidation Auth et l’invalidation du profil précédent.
- Une déconnexion ou un refus invalide les requêtes en cours et vide l’état privé; les réponses tardives ne peuvent pas le repeupler.
- L’interface de gestion des profils ne crée plus de profils fictifs et ne modifie plus les habilitations.
- Les données `site_content` ne sont plus lues publiquement : le schéma local ne porte pas de marqueur permettant de prouver qu’un contenu est explicitement publié.

Les candidates SQL 010 et 011 ont été appliquées et testées **uniquement** dans PostgreSQL local isolé, sur des tables et identités synthétiques. La suite pgTAP directe a vérifié 34 assertions sous les vrais rôles PostgreSQL `anon` et `authenticated`, avec des claims `auth.uid()` configurés dans la transaction. Cela ne valide ni un vrai jeton Auth/GoTrue, ni PostgREST, ni le schéma distant.

Cela n’implémente **pas** le détail des droits par opération, les restrictions lecture/écriture du comptable, le second validateur ou l’isolation documentaire. Le backend/RLS doit les faire respecter avant toute remise en production.

## Règles bloquées par le schéma ou l’intégration

- Pas de relation Auth → financeur → financements; les utilisateurs financeurs restent sans données métier.
- Pas de relation fiable entre responsables et sites, parcelles, activités, lots ou projets; les responsables restent sans données métier.
- Attribution d’auteur non fiable ou absente sur des opérations, notamment mouvements; validation séparée impossible à garantir en base.
- Pas de statut de publication explicite pour `site_content`.
- Pas de relation de document garantissant le périmètre du parent, ni séparation démontrée des fichiers privés et médias publics.
- Pas de procédure backend contrôlée d’invitation, d’administration Auth ou de bootstrap du premier administrateur.
- Les écrans métier existants n’appliquent pas encore une matrice de droits par action. Les règles SQL candidates ferment les écritures applicatives jusqu’à un lot métier ultérieur.

## Vérifications distantes restantes

Les candidates n’ont pas été exécutées sur le projet distant. Il faut d’abord contrôler les rôles DB, les grants effectifs, les politiques existantes, les fonctions exposées, les vues, les objets, les profils liés et la présence d’un administrateur actif lié à un utilisateur Auth. La présence de SQL dans le dépôt ou les tests locaux ne prouve ni l’application ni le comportement RLS distant. Aucun accès au projet distant n’a été effectué durant ce lot.
