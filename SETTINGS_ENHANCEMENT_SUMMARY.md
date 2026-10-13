# Amélioration du module de paramètres - Contenu statique

## Demande de l'utilisateur
"module paramettres pour editer tout le contenu static, surtout les images et logo"
(settings module to edit all static content, especially images and logo)

## Ce qui existait déjà
Avant cette amélioration, le module de paramètres (SettingsPage.tsx) permettait déjà de:
- Modifier les informations de base de l'exploitation (nom, localisation, téléphone, email, devise)
- Gérer le logo de l'application (téléversement, visualisation, suppression)
- Configurer d'autres aspects (devises, catégories, notifications, sécurité, apparence)

## Améliorations apportées

### Nouvel onglet "Contenu Statique"
J'ai ajouté un nouvel onglet dans le module de paramètres permettant de gérer tout le contenu statique du site stocké dans la table `site_content`.

#### Fonctionnalités de l'onglet Contenu Statique:
1. **Visualisation du contenu existant** :
   - Affichage de toutes les entrées site_content sous forme de liste
   - Chaque entrée montre la clé et la valeur (texte brut ou JSON formaté)

2. **Édition du contenu existant** :
   - Bouton "Modifier" pour chaque entrée
   - Deux modes d'édition :
     * Éditeur de texte simple pour les valeurs chaîne de caractères
     * Éditeur JSON pour les valeurs complexes (objets, tableaux)
   - Bouton "Sauvegarder" pour enregistrer les modifications
   - Bouton "Annuler" pour abandonner les modifications

3. **Ajout de nouveau contenu** :
   - Formulaire en haut de l'onglet pour ajouter de nouvelles entrées
   - Champs : Clé (ex: homepage_title) et Valeur (le contenu)
   - Bouton "Ajouter le contenu" pour créer la nouvelle entrée

4. **Suppression de contenu** :
   - Bouton "Supprimer" pour chaque entrée avec confirmation
   - Suppression définitive de l'entrée de la base de données

5. **Gestion des états** :
   - États de chargement lors des opérations
   - Messages de feedback (succès/erreur) via le système de toast
   - Validation des champs requis (clé et valeur pour les nouveaux éléments)

#### Exemples de contenu statique pouvant être géré :
- Textes de la page d'accueil (titres, descriptions, bannières)
- Textes de la page "À propos"
- Informations de contact
- Textes du pied de page
- Configurations d'application (seuils, limites, etc.)
- Messages personnalisés
- Étiquettes et libellés de l'interface

### Technologies utilisées
- React avec hooks useState, useEffect
- Intégration avec Supabase pour le stockage persistant (table site_content)
- Interface utilisateur avec Tailwind CSS et Lucide React
- Gestion optimiste de l'état avec rechargement des données après modification

### Avantages de cette amélioration
1. **Centralisation** : Tout le contenu statique modifiable est désormais géré depuis un seul endroit
2. **Flexibilité** : Permet de modifier n'importe quel contenu stocké en tant que site_content sans modifier le code
3. **Sécurité** : Opérations protégées par les vérifications de permissions existantes
4. **Expérience utilisateur** : Interface claire et intuitive pour gérer le contenu
5. **Maintenabilité** : Réduit le besoin de déployer du code pour de simples changements de texte

### Comment utiliser cette fonctionnalité
1. Aller dans la page "Paramètres"
2. Cliquer sur l'onglet "Contenu Statique" (icône de fichier texte)
3. Visualiser le contenu existant ou ajouter de nouvelles entrées
4. Modifier le contenu directement dans l'interface
5. Sauvegarder les changements - ils sont immédiatement applicables dans l'application

## Fichiers modifiés
- `src/pages/SettingsPage.tsx` : Ajout de l'onglet Contenu Statique avec toutes les fonctionnalités ci-dessus

## Prochaines étapes possibles
1. Ajouter des validations spécifiques pour certains types de contenu (URLs, emails, etc.)
2. Implémenter des catégories ou des groupes pour mieux organiser le contenu statique
3. Ajouter un historique des modifications ou une fonctionnalité de restauration
4. Créer des modèles prédéfinis pour les types de contenu courants (bannières, pieds de page, etc.)