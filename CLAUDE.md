# RÈGLES ABSOLUES POUR CE PROJET — BAHKANSO

## 🛑 INTERDICTIONS STRICTES
1. **JAMAIS** de "mode planification" ou de plans en plusieurs étapes
2. **JAMAIS** de modification de code sans demande explicite
3. **JAMAIS** de suppression des directives `@tailwind` dans `src/index.css`
4. **JAMAIS** de tentative d'authentification ou de remplissage de formulaire
5. **JAMAIS** de migration de Tailwind, ajout de CDN, ou installation de dépendances

### Vérifications navigateur

Les tests navigateur sont autorisés avec les outils déjà
disponibles, notamment Playwright ou un outil navigateur MCP,
dans le périmètre demandé par l’utilisateur.

Cette autorisation ne permet pas :
- d’installer des dépendances ou navigateurs sans accord ;
- de contourner l’authentification ou les permissions ;
- de modifier des données distantes ;
- d’envoyer des formulaires persistants sur une base distante ;
- de confirmer une suppression ;
- d’effectuer un upload distant ;
- de déployer.

Avant les tests, identifier la destination des connexions
de données. Une interface sur localhost ne prouve pas
que sa base est locale.

Les tests sans mutation peuvent couvrir :
navigation, cartes, détails, ouverture et annulation des
formulaires, confirmations annulées, responsive et clavier.

Si un accès authentifié autorisé manque, signaler le blocage.
Si un outil échoue, fournir l’erreur exacte.
Ne pas déclarer les tests navigateur interdits par ce fichier.

### Périmètre actuel

Conserver les modules existants, notamment Agriculture et Élevage.
Les anciennes consignes limitant l’application à sept pages
ou imposant la suppression de ces modules sont suspendues.

Claude intervient sur le module Élevage.
Codex intervient séparément sur l’accueil public.
Ne pas écraser les modifications de l’autre intervenant.

Le chantier sites/exploitations archivé dans
docs/deferred/site-farm/ reste reporté et ne doit pas être appliqué.

## ✅ COMPORTEMENT ATTENDU
1. **UNE action par prompt**, puis ARRÊT et RAPPORT
2. **Lire les fichiers** avant de proposer une correction
3. **Un diagnostic d'abord**, un correctif seulement après validation
4. **Réponses courtes** : maximum 10 lignes
5. **Pas de refactorisation non demandée**

## 🏗️ STACK
- Vite + React + TypeScript
- Tailwind CSS v3 (via `postcss.config.js`)
- Supabase (auth + database)
- Déploiement : Surge (`bahkanso.surge.sh`)

## 📁 FICHIERS SENSIBLES (ne jamais toucher sans demande)
- `src/index.css` (contient les directives @tailwind)
- `src/lib/supabase.ts`
- `.env`
- `.mcp.json`

## 🔁 PROCESSUS POUR TOUTE DEMANDE
1. Lis le fichier concerné
2. Confirme ce que tu vois (2 lignes max)
3. Attends validation avant de modifier

## CADRAGE DE LA VITRINE PUBLIQUE BAHKANSO

### Nature et objectif

BAHKANSO présente un projet agro-pastoral en Côte d’Ivoire.
La page d’accueil publique est la vitrine du projet, pas une page
commerciale de logiciel, de SaaS ou de collecte ouverte d’investissements.

Présenter d’abord le projet, ses activités réelles et ses avancées.
Présenter ensuite, brièvement, son organisation et son suivi privé.

### Informations publiques

- Distinguer explicitement les réalisations, les activités en cours
  et les projets prévus.
- Ne pas confondre une fonctionnalité de l’application avec une
  réalisation effective sur le terrain.
- Ne jamais inventer de chiffres, résultats, témoignages, partenaires,
  certifications, photos du site ou coordonnées.
- Utiliser uniquement les informations et médias validés pour publication.
- Une information disponible dans l’espace privé n’est pas, de ce seul
  fait, autorisée à être publiée.
- Ne pas exposer les financements, dépenses, justificatifs, données
  personnelles ou autres informations privées.
- Sans image disponible, prévoir une présentation sobre sans afficher
  de message technique de configuration au visiteur.

### Parcours public et espace privé

- Distinguer clairement la découverte publique des activités et
  la connexion à l’espace privé.
- Un lien public « Découvrir » ou « Voir le détail » doit mener à
  un contenu public adapté, et non implicitement à un écran de gestion.
- Ne pas rendre une route privée publique pour résoudre un problème
  de navigation.
- Ne pas modifier l’authentification, les permissions ou les règles
  de sécurité dans le cadre du chantier vitrine.
- Ne pas créer de formulaire, de coordonnées ou de bouton de contact
  sans destination réelle validée par l’utilisateur.

### Présentation et cartes

- Privilégier les textes simples, les photos réelles autorisées
  et les preuves concrètes de progression.
- Éviter les répétitions sur le fonctionnement de l’outil de gestion.
- Conserver le principe des cartes rotatives lorsqu’elles existent.
- Ne pas remplacer arbitrairement les cartes par des tableaux ou listes.
- Garder les informations essentielles lisibles sur la face avant.
- La rotation doit rester utilisable au toucher et au clavier,
  sans dépendre uniquement du survol.
- Ne pas ajouter de bibliothèque d’animation ou de dépendance.

### Périmètre et coordination

- Ce cadrage ne constitue pas une autorisation de modifier le code.
- La répartition actuelle reste inchangée : Claude intervient sur
  l’Élevage ; Codex intervient sur l’accueil public.
- Toute réattribution doit être explicitement demandée par l’utilisateur.
- Avant une intervention autorisée, lire les fichiers concernés et
  leurs différences Git existantes.
- Préserver toutes les modifications déjà présentes, notamment celles
  de l’autre intervenant.
- Ne pas restaurer, écraser ou annuler des modifications existantes
  sans autorisation explicite.
- Ne pas toucher aux modules métier, au schéma de base de données,
  aux règles de sécurité ou aux fichiers sensibles pour une demande
  limitée à la vitrine.
- Aucun commit, push ou déploiement sans demande explicite.

### Validation

- Appliquer le processus existant : lecture, diagnostic, validation,
  puis une action limitée suivie d’un rapport.
- Vérifier uniquement avec les outils déjà disponibles et dans
  les limites des autorisations de tests navigateur ci-dessus.
- Rapporter les vérifications réellement effectuées et les blocages.
- Ne pas déclarer un résultat testé ou fonctionnel sans vérification.
