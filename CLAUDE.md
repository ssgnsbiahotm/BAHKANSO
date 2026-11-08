# CLAUDE.md — BAHKANSO
## Règles stables du projet

Ce fichier fixe le cadre commun de travail. Il contient uniquement des règles durables.
L'état du projet, les priorités, les décisions en cours et les TODO sont dans `docs/CONTEXT.md`.

---

## RÈGLES ABSOLUES (valables pour toute mission)

1. Aucun commit, push, déploiement, migration ou suppression sans demande explicite de la mission.
2. Jamais de `--force`, `-f`, `git add .`, `git stash`, `git reset --hard` ni `git clean`.
3. Jamais de base distante ou de production touchée : local uniquement, après `supabase status`.
4. Règle métier absente du code ou de CONTEXT.md : STOP et question ciblée, jamais d'invention.
5. Toute affirmation cite sa preuve (fichier:ligne ou résultat de commande), sinon elle est marquée « supposé » ou « à vérifier ».
6. Jamais de secret affiché (clés, `VITE_*`, chaînes de connexion, jetons).
7. Contradiction entre ce fichier, la mission et le code : signaler, ne rien faire de destructif avant clarification.

---

## 0. HIÉRARCHIE DES CONSIGNES

1. Ce fichier est un plancher de sécurité. Une mission peut restreindre davantage, jamais lever une règle absolue.
2. Une mission n'autorise une action du §16 que si elle la cite explicitement, et seulement pour cette mission.
3. Début de mission : lire `docs/CONTEXT.md`, puis `git status` et noter l'état initial (des fichiers non commités d'autres missions peuvent exister).
4. Ordre de priorité en cas de conflit : règles absolues > mission > ce fichier > CONTEXT.md > code existant.
5. En cas de contradiction non résolue : signaler, ne pas trancher seul.

---

## 1. OBJECTIF

Faire évoluer Bahkanso en une application agro-pastorale cohérente et réellement utilisable : conserver les modules existants, corriger par lots limités et vérifiables, réutiliser les mécanismes corrects, préserver les données et les travaux en cours.

Ne pas confondre : code présent et fonctionnalité vérifiée ; compilation réussie et validation fonctionnelle ; navigation vers une page et action sur un élément ; prototype visuel et persistance réelle.
Ne pas déclarer l'application ou un module fonctionnel sans preuves.

---

## 2. IDENTITÉ ET LANGUE

- Nom : Bahkanso — Pilotage agro-pastoral. Exploitation : Ferme AgroVision, Sikensi, Côte d'Ivoire.
- Interface entièrement en français (titres, boutons, formulaires, erreurs, confirmations, états vides).
- Montants en FCFA (ex. 1 500 000 FCFA). Dates au format français (ex. 12 oct. 2026).
- Réutiliser les fonctions de formatage existantes. Ne pas renommer les valeurs techniques stockées pour traduire un libellé.
- Ne pas inventer de chiffres, résultats, témoignages, certifications ou caractéristiques de l'exploitation.
- Les sites cités dans le contexte métier (Katadji, Aheremou, Braffoueby, Abidjan, Grd-Bassam) ne constituent pas une instruction de seed ou de migration.

---

## 3. SOURCE DE VÉRITÉ ET PREUVES

Pour connaître l'état du projet : instructions applicables, code et différences locales, migrations, types, conventions existantes. Distinguer le dépôt de l'état réellement vérifié d'une base.

Ne jamais :
- supposer qu'une migration est appliquée parce qu'elle existe ;
- supposer qu'une table ou colonne distante existe après lecture du dépôt ;
- inventer un nom de table, colonne, rôle, route ou composant.

Les anciennes pages (dont celles d'origine Bolt) peuvent être réutilisées et améliorées ; leur origine n'est pas une raison de les supprimer.

---

## 4. STACK ET DÉPENDANCES

Références (versions exactes dans `package.json` et le lockfile) : React, Vite, TypeScript strict, Tailwind CSS, lucide-react, react-router, TanStack React Query, Zod, Supabase (Postgres, Auth, Storage), PWA (service worker), hébergement statique (surge). Vérifier ce qui est réellement présent avant de s'appuyer dessus.

Règles :
- réutiliser la stack et les composants existants ; pas de seconde bibliothèque pour un besoin déjà couvert ;
- aucune dépendance, version ou gestionnaire de paquets modifié sans accord ;
- interdits pour faire taire le compilateur : `any`, `@ts-ignore`, `@ts-expect-error`, assertion non nulle `!`, cast `as unknown as`, désactivation globale de règles. Corriger par typage ou narrowing explicite ;
- pas de remise à niveau technique pendant un lot fonctionnel.

---

## 5. MODULES ET NAVIGATION

- Conserver les modules présents (Cultures/Exploitation, Élevage, Finance, Chantiers/Projets, Stocks, Fournisseurs, Médias, Surveillance, etc.).
- Conserver le menu latéral, les sous-menus utiles et les routes existantes ; pas de duplication d'entrées ni de routes ; pas de réécriture du layout pour ajouter un module.
- Ne supprimer une page ou une route qu'après demande explicite et vérification exhaustive de ses références (imports statiques et lazy, barrels, routes, tests, liens, redirections).
- Ne pas créer une page de gestion si une page existante répond au besoin.

---

## 6. TRAVAIL SIMULTANÉ

Avant toute édition : `git status`, différences des fichiers concernés, modifications préexistantes. Limiter le nombre de fichiers partagés touchés. Ne pas écraser le travail d'un autre agent ou d'une autre mission. Si un composant partagé est modifié en parallèle, signaler et proposer une intervention limitée.
L'accueil public est traité séparément : ne pas le modifier sans demande explicite.

---

## 7. DESIGN ET CARTES RETOURNABLES

Identité : conserver menu latéral, en-tête, modules, indicateurs. Palette de référence : `#2D5016` (vert agricole), `#4A7C2E` (interaction), `#E8B923` (blé), `#8B6F47` (terre), `#FAF7F2` (crème), textes slate-800 / slate-500. Pas de recoloration globale hors lot autorisé.

1. **Un seul composant.** Les listes métier s'affichent avec le composant de carte retournable existant (`RotatingCard`, `src/components/ui/`, à confirmer par `grep -r "RotatingCard\|FlipCard" src` avant toute création). Jamais de seconde implémentation. Style, rotation et boutons sont identiques dans tous les modules. Exceptions (tableau) : justifiées et validées. Pas de cartes pour formulaires, menus, filtres, graphiques ni KPIs.
2. **Recto / verso.** Recto : nom, visuel, statut, infos essentielles, commande « détails ». Verso : infos complémentaires, relations, actions, commande « retour ».
3. **Retournement volontaire et accessible.** Jamais automatique ; fonctionne au clic, au tactile et au clavier ; focus visible ; face masquée non interactive ; rien d'essentiel au survol ; préférence de réduction des animations respectée.
4. **Actions indépendantes.** Les boutons d'action ne dépendent pas de l'état retourné. Un formulaire ouvert depuis une carte ou une carte géographique ne la retourne pas : `stopPropagation` sur le déclencheur, modal rendu via portal, arrêt de propagation aussi sur le conteneur du modal (clic, pointeur, molette), car les événements React remontent l'arbre React même avec un portal. Ne pas confondre défilement d'un carrousel et retournement.
5. **Lisibilité d'abord.** Aucun texte coupé, aucun bouton inaccessible, adaptation aux petits écrans et aux contenus longs. Une hauteur fixe n'est pas une obligation.

---

## 8. ACTIONS FONCTIONNELLES

Le libellé d'un bouton correspond à son effet réel :
- Détails : affiche l'élément sélectionné ;
- Modifier : ouvre son formulaire prérempli ;
- Supprimer : confirmation nommant l'élément, puis suppression autorisée ;
- une navigation vers une liste porte un libellé tel que « Gérer les animaux », pas « Modifier ».
Ne pas ajouter un paramètre d'URL que la destination ne traite pas.

Formulaires et mutations :
- validation (Zod) réellement exécutée ; état d'envoi visible ; anti double soumission ;
- erreurs traitées et affichées ; saisie conservée en cas d'échec ;
- succès annoncé seulement après confirmation de l'opération ;
- données actualisées après réussite (la liste concernée se met à jour sans rechargement de page).

Suppression (règle systématique, tous modules) :
- la popup de confirmation se ferme dans un bloc `finally` (succès ET erreur) ;
- la liste se met à jour par le mécanisme existant du module ;
- message d'erreur affiché en cas d'échec ; double clic bloqué ;
- utiliser le composant de confirmation partagé existant.

Ne pas fermer automatiquement un formulaire après un échec. Ne pas présenter un échec d'audit ou de rafraîchissement comme un échec de l'écriture principale : l'audit ne doit pas faire échouer visiblement une action déjà réussie.

États à traiter : chargement, absence de données, absence de résultat après filtre, erreur de chargement, permission insuffisante, action en cours.
Aucun bouton vide, faux succès ou `href="#"`. Une action indisponible est désactivée avec explication et déclarée non livrée.

---

## 9. DONNÉES APPLICATIVES (DataContext)

Le DataContext charge les données par module : un chargement par défaut, puis `loadModule(...)` à la demande (état par source : idle / loading / loaded / error). Conséquences à respecter :
- une source non chargée renvoie un tableau vide sans erreur : ne jamais afficher « Aucune donnée » ni des KPIs à 0 tant que les sources ne sont pas chargées ;
- une page ou un formulaire qui lit une source d'un autre module doit déclarer ce module (dépendances croisées) ;
- un consommateur global (en-tête, menu, badges, notifications) ne doit lire que des sources du chargement par défaut ;
- une mutation sur une source non chargée ne la marque jamais « chargée » ;
- une source en erreur n'est pas marquée chargée et peut être retentée ;
- ne jamais réduire les colonnes d'une source dont un formulaire d'édition renvoie l'objet entier (risque d'écraser des colonnes à null) ;
- ne pas ajouter de rechargements, de cache ni de librairie sans accord.

Toute modification du DataContext est un changement d'architecture : lecture préalable de tous les consommateurs, validation par parcours des routes avec rechargement du navigateur.

---

## 10. CONVENTIONS MÉTIER ET FORMULAIRES

- **Listes de valeurs** (types, catégories, statuts, unités) : une seule source, valeur technique stable séparée du libellé, alignée sur les contraintes de la base (CHECK, enum). Gérer les anciennes valeurs déjà en base.
- **Héritage vs instantané.** Une donnée existant dans une entité parente est lue, pas ressaisie. Donnée de référence vivante (nom, surface de la parcelle) : lecture seule via la relation. Donnée historique ou comptable (culture d'une campagne, montant, prix) : copiée en instantané à la création, puis figée. En cas de doute : instantané, avec justification.
- **Cascades.** Une action à impact financier ou logistique propose la création liée (ex. dépense pour un transport), jamais d'écriture financière silencieuse. Clé de liaison explicite (réutiliser le pattern existant, ex. `operation_id` ou `source_type`/`source_id`). Idempotence à l'édition (mise à jour, pas de doublon). Comportement à la suppression documenté (défaut recommandé : confirmation avec choix « supprimer aussi » ou « conserver détachée »). Échec partiel signalé, jamais de succès silencieux.
- **Suppression d'enregistrements** : respecter le mode du module (soft-delete par `deleted_at` ou suppression physique) et ne pas en changer sans décision. Les lecteurs d'une table à soft-delete filtrent `deleted_at IS NULL`.
- **Audit (`logAudit`)** : conserver les valeurs d'action et de type d'entité existantes ; ne pas en créer de nouvelles sans vérifier l'affichage de l'historique.
- **Erreurs Supabase** : ce sont des objets simples (`{ message }`), pas des instances de `Error`. Ne pas utiliser `instanceof Error` (affiche « [object Object] ») ; typer le résultat (`error: { message?: string } | null`).
- **`farm_id` / `site_id`** : ne jamais déduire le rattachement sans vérifier le chemin réel dans le schéma ; les relations sont documentées dans `docs/CONTEXT.md` et les rapports.
- **KPIs** : avant de toucher à l'invalidation ou au calcul, lire comment ils sont réellement calculés ; vérifier l'absence de double comptage.

---

## 11. RÈGLES MÉTIER À PRÉSERVER

Principe : une règle métier se RETROUVE dans le code, les migrations, CONTEXT.md ou les rapports, ou se DEMANDE. Elle ne s'invente jamais. Règle introuvable : STOP, une seule question ciblée avec les options, puis attendre.

L'agent NE DOIT PAS :

**Élevage**
- créer une règle d'effectif entre lots et animaux (ne pas additionner les deux sans validation) ;
- inventer des compatibilités d'espèces ou des règles de filiation ;
- faire changer un statut ou un effectif automatiquement à la suite d'un événement.

**Opérations et cultures**
- attribuer une parcelle ou une campagne aux anciennes opérations non rattachées ;
- accepter une opération dont la campagne et la parcelle se contredisent (si une campagne est choisie, sa parcelle fait référence) ;
- modifier la culture d'une campagne passée parce que la parcelle a changé.

**Finance**
- créer une dépense, une vente ou toute écriture financière sans proposition visible à l'utilisateur ;
- changer la formule d'un KPI (marge brute, coût de revient) sans décision ;
- créer des doublons à l'édition (mettre à jour l'écriture liée).

**Alertes et événements**
- inventer ou modifier une règle de déclenchement ou de sévérité (low / medium / high) : décision du responsable ;
- fusionner ou déplacer des tables d'événements sans décision d'architecture ;
- changer une valeur d'action de `logAudit` ou le mode de suppression d'un module.

**Rattachements**
- déduire un lien ferme / site / parcelle sans vérifier le chemin réel dans le schéma (`farm_id`, `site_id`, `plot_id`).

**Vocabulaire et accès**
- « Recettes » = revenus financiers de l'exploitation, jamais un concept de cuisine ;
- ne pas élargir l'accès aux informations de bailleurs ou autres données sensibles ;
- ne pas supposer une valeur de rôle (ex. `'admin'`) : vérifier le modèle d'identité ;
- toute évolution de droits est une mission séparée, avec contrôle côté base.

Les décisions déjà prises ne prouvent pas que leurs protections sont implémentées : vérifier dans le code avant de s'y fier.

---

## 12. CHANTIER REPORTÉ : SITES / EXPLOITATIONS

Fichiers archivés : `docs/deferred/site-farm/` (deux fichiers SQL de cohérence sites / exploitations / opérations). État : proposition non validée, retirée des répertoires actifs.

Ne pas : les réintégrer dans les répertoires actifs, appliquer leur SQL, reprendre leur conception sans demande.

Ne pas confondre cette archive avec les chantiers actifs sur `farm_id` et la relation Ferme/Site (décision en attente, suivie dans `docs/CONTEXT.md`). Les correctifs Opérations antérieurs restent préservés.

---

## 13. BASE DE DONNÉES, AUTH ET STORAGE

Distinguer : dépôt, instance locale (Docker), distant, production. Une application sur localhost peut utiliser une base distante : vérifier la cible avant toute écriture.

**Procédure obligatoire avant `supabase db reset` ou tests d'intégration :**
1. `supabase status` : l'API doit être sur 127.0.0.1 (ex. `http://127.0.0.1:54321`). Rien d'affiché ou erreur : l'instance locale n'est pas démarrée. STOP, ne pas improviser.
2. Vérifier que l'environnement des tests vise le local, sans afficher les valeurs :
   `grep -l "supabase.co" .env* tests/integration/* vitest.config.* 2>/dev/null`
   (adapter les chemins aux fichiers réels du projet). Un fichier listé = cible distante possible. STOP et signaler.
3. Seulement ensuite : `supabase db reset`, puis `npx vitest run tests/integration/`.

**Autorisé (si la mission le prévoit)** : `supabase status`, `supabase db reset` (local), `supabase migration list --local`, requêtes SELECT sur l'instance locale.
**Interdit sans accord explicite** : `supabase db push`, `--linked`, `--db-url` distant, migration appliquée à une base distante, seed, modification RLS ou rôle, écriture de test distante, upload ou suppression Storage.

`supabase db reset` efface la base locale : c'est attendu, à signaler dans le rapport. Il repart d'une base vide : il ne valide pas un backfill sur données existantes.
Ne jamais affaiblir les droits pour faire réussir un test. Ne jamais modifier une migration existante : toute évolution = nouvelle migration, idempotente (`IF NOT EXISTS`, backfill gardé par `IS NULL`), avec script de retour en commentaire. Si une migration n'est pas à appliquer, la documenter (SQL up/down, impact sur les données, rollback).
Ne jamais afficher secrets, jetons, chaînes de connexion, valeurs `VITE_*` ni clés.

Données simulées : ne jamais remplacer silencieusement une panne Supabase par des données fictives. Un mode démonstration est isolé, signalé à l'écran, sans annonce de persistance.

---

## 14. TESTS NAVIGATEUR

Autorisés avec les outils déjà installés (Playwright inclus). Installer un outil ou un navigateur nécessite un accord.

Permis : ouvrir les pages, naviguer, tester le responsive, le retournement des cartes, le clavier, ouvrir et annuler un formulaire, lire les erreurs de console et les requêtes (sans secrets).
Interdit sans autorisation : mutation distante, confirmation destructive, envoi persistant.

Si les réponses sont simulées, le dire : le CRUD réel n'est alors pas validé.
Test impossible : indiquer la commande tentée et l'erreur exacte (outil absent, permission, dépendance manquante ou restriction). Un test navigateur n'autorise ni déploiement ni modification de la base.

---

## 15. MÉTHODE ET LIVRAISON

**Principe directeur :** choisir la solution la plus simple qui satisfait le critère de succès de la mission. Pas de sur-ingénierie : pas de vérification, script, helper, abstraction ou fichier non demandé.

**Avant de modifier** : comprendre le lot, inspecter les fichiers et les modifications préexistantes, identifier les composants réutilisables, relever les seules décisions réellement manquantes. Ne pas redemander les décisions déjà consignées dans `docs/CONTEXT.md`.

**Pendant** : lot cohérent et limité ; corriger la cause ; pas de refonte adjacente ; pas de sous-agent sans accord de la mission ; pas de déplacement ou suppression hors périmètre. Une partie bloquée n'empêche pas de poursuivre les éléments indépendants. Un problème hors périmètre est identifié, signalé, puis laissé.

**Avant de livrer** : exécuter les scripts réellement présents dans `package.json` (typecheck, build, lint ciblé sur les fichiers modifiés, tests, vérifications navigateur). Relever l'état de référence (typecheck, lint, build, tests) AVANT de modifier, pour distinguer défauts introduits et défauts préexistants. Ne pas modifier un script pour masquer un échec. Inspecter les scripts susceptibles d'écrire ou de migrer avant exécution.

**Classification des échecs de tests :**
- JWT / 401 / 403 / clé API / auth : configuration, pas le code testé ;
- SQL / colonne manquante / contrainte / FK : potentiellement lié à la mission, à investiguer dans le périmètre ;
- assertion métier / valeur inattendue : bug métier ou test préexistant, sauf preuve contraire ;
- réseau / Docker / Supabase arrêté : environnement.

**Chaque livraison indique** : résultat obtenu ; fichiers modifiés (un par ligne) ; actions raccordées ; commandes et résultats ; vérifications navigateur et de persistance ; limites ; changements hors périmètre nécessitant un accord ; `git status` final comparé à l'état initial.

**Statuts de vérification** : implémenté ; vérifié par lecture ; contrôlé automatiquement ; vérifié dans le navigateur ; testé avec persistance ; non vérifié ; bloqué.
**Statuts de mission** (utilisés dans CONTEXT.md) : terminée ; terminée avec vérifications manuelles en attente ; partielle ; bloquée.

Un parcours CRUD complet n'est annoncé qu'après vérification des permissions, exécution dans un environnement autorisé, persistance confirmée après rechargement, et contrôle des erreurs.

---

## 16. ACTIONS NÉCESSITANT UN ACCORD EXPLICITE

Sans demande explicite de la mission, ne pas : supprimer un module, une page ou une route ; réécrire l'architecture ; installer une dépendance ; modifier un schéma, une politique RLS ou un rôle ; appliquer une migration ou un seed ; modifier des données distantes ; effectuer une suppression destructive ; faire un commit ; faire un push ; déployer.

**LISTE NOIRE**, interdite même avec accord général, sauf mention nominative dans la mission :
- **Git** : `git reset --hard`, `git clean` (tout `-f` / `-fd`), `git stash`, `git restore`, `git checkout <fichier>`, `git checkout -f`, `git commit -a`, `git commit --amend`, `git add .`, `git add -A`, `git push --force`, `git push -f`, `git push --force-with-lease`, `git branch -D`, `git rebase`, `--no-verify`.
- **Fichiers** : `rm -rf` hors `/tmp`, `mv` ou suppression de fichiers hors périmètre.
- **Dépendances** : `npm install --force`, `npm audit fix --force`, `--legacy-peer-deps`.
- **Base** : `supabase db push`, `--linked`, `--db-url` distant.
- Toute option `--force` ou `-f` d'une commande non listée : la considérer interdite.

Pour préparer un commit : `git add` fichier par fichier ou `git add -p`, jamais en bloc.

**Déploiement** : jamais par l'agent. Déployer uniquement depuis un build reproductible sur un clone propre du dépôt. Un déploiement depuis un répertoire contenant des fichiers non commités est un risque à signaler (la production peut alors différer du dépôt).

La demande de produire une interface fonctionnelle n'autorise implicitement aucune de ces actions.

---

## 17. RÈGLE DE SUIVI : MISE À JOUR DE `docs/CONTEXT.md`

À la fin de chaque mission (correctif, vague, optimisation), l'agent met à jour `docs/CONTEXT.md`. Cette règle s'ajoute aux consignes de la mission et ne les remplace jamais : si une mission interdit les commits, cette règle ne les autorise pas.

**Contenu :**
1. « État actuel » : une ligne par mission avec date, nom et statut de mission (§15). Ne marquer « terminée » que si la définition de « terminé » de la mission est satisfaite et vérifiée. Un contrôle non exécuté est écrit tel quel, jamais présumé réussi.
2. Résumé de la mission : 3 à 5 lignes (fait, fichiers principaux, écarts avec la demande).
3. « À faire » : TODO restants, décisions en attente du responsable, vérifications manuelles à faire. Retirer uniquement les TODO réellement terminés.
4. Dernier commit de code : `git rev-parse --short HEAD` avec la mention « (commit précédent) », ou « aucun commit » si le travail n'est pas commité. Ne jamais écrire le SHA du commit qui contient CONTEXT.md.
5. Longueur : les missions terminées depuis plus de deux vagues sont réduites à une ligne ; ne pas dupliquer le contenu de `docs/reports/` : citer le chemin.

**Règles de modification :** modifier uniquement les lignes concernées ; ne pas restructurer le fichier ; aucune clé, URL privée ou variable d'environnement.

**Commit :** seulement si la mission le demande explicitement ; alors limité à ce fichier (`git add docs/CONTEXT.md`, puis `git commit docs/CONTEXT.md -m "docs(context): état du projet après <mission>"`), sans rien d'autre dans l'index, sans push. L'agent ne demande pas à l'utilisateur de mettre à jour CONTEXT.md : s'il ne peut pas écrire, il propose le texte dans son rapport final.
