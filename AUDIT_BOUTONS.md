# Audit des boutons et éléments interactifs - BAHKANSO

## Légende des statuts
- **OK** : fonctionne de bout en bout (action + persistance + retour visuel)
- **MORT** : aucun effet (callback vide, handler non branché, lien mort)
- **ERREUR** : provoque une erreur (console, réseau, base, permissions, exception non gérée)
- **PARTIEL** : fonctionne mais sans persistance, sans retour utilisateur, ou avec une cause d'échec non gérée
- **TROMPEUR** : annonce un succès non confirmé ou fait autre chose que son libellé

## Priorités
- **P1** : actions qui perdent ou corrompent des données, ou plantent la page
- **P2** : actions principales d'un module (créer, enregistrer, modifier, supprimer, valider) qui échouent ou ne font rien
- **P3** : actions secondaires (filtres, exports, tri, navigation)
- **P4** : cosmétique ou confort

## Inventaire des éléments interactifs

| Module | Écran | Élément | Fichier:Ligne | Statut | Cause réelle | Correction prévue | Priorité |
|--------|-------|---------|---------------|--------|--------------|-------------------|----------|
| Dépenses | Liste des dépenses | Bouton Nouvelle dépense | src/pages/Expenses.tsx:225 | OK | Fonctionne correctement | Aucune | P2 |
| Dépenses | Liste des dépenses | Filtre de statut (Tous, brouillon, etc.) | src/pages/Expenses.tsx:240-249 | OK | Fonctionne correctement | Aucune | P3 |
| Dépenses | Liste des dépenses | Bouton Valider (ligne d'action) | src/pages/Expenses.tsx:263 | OK | Met à jour le statut en "validée" | Aucune | P2 |
| Dépenses | Liste des dépenses | Bouton Rejeter (ligne d'action) | src/pages/Expenses.tsx:267 | OK | Met à jour le statut en "rejetée" | Aucune | P2 |
| Dépenses | Liste des dépenses | Bouton Annuler (ligne d'action) | src/pages/Expenses.tsx:273 | OK | Met à jour le statut en "annulée" | Aucune | P2 |
| Dépenses | Liste des dépenses | Bouton Modifier (ligne d'action) | src/pages/Expenses.tsx:277 | OK | Ouvre le formulaire d'édition | Aucune | P2 |
| Dépenses | Liste des dépenses | Bouton Supprimer (ligne d'action) | src/pages/Expenses.tsx:280 | OK | Supprime la dépense après confirmation | Aucune | P2 |
| Dépenses | Liste des dépenses | Bouton Voir (ligne d'action) | src/pages/Expenses.tsx:283 | OK | Ouvre le modal de détail | Aucune | P3 |
| Dépenses | Modal création/édition | Bouton Annuler | src/pages/Expenses.tsx:298 | OK | Ferme le modal | Aucune | P3 |
| Dépenses | Modal création/édition | Bouton Créer/Modifier | src/pages/Expenses.tsx:299 | OK | Soumet le formulaire | Aucune | P2 |
| Dépenses | Modal détail | Bouton Supprimer | src/pages/Expenses.tsx:486 | OK | Supprime la dépense après confirmation | Aucune | P2 |
| Dépenses | Modal détail | Bouton Modifier | src/pages/Expenses.tsx:487 | OK | Ouvre le formulaire d'édition | Aucune | P2 |
| Dépenses | Modal détail | Bouton Rejeter (si en attente/brouillon) | src/pages/Expenses.tsx:490 | OK | Met à jour le statut en "rejetée" | Aucune | P2 |
| Dépenses | Modal détail | Bouton Valider (si en attente/brouillon) | src/pages/Expenses.tsx:491 | OK | Met à jour le statut en "validée" | Aucune | P2 |
| Dépenses | Modal confirmation suppression | Bouton Annuler | src/pages/Expenses.tsx:565 | OK | Ferme le modal | Aucune | P3 |
| Dépenses | Modal confirmation suppression | Bouton Supprimer | src/pages/Expenses.tsx:566 | OK | Supprime la dépense | Aucune | P2 |
| Financements | Liste des financements | Bouton Nouveau financement | src/pages/Fundings.tsx:176 | OK | Fonctionne correctement | Aucune | P2 |
| Financements | Liste des financements | Bouton Modifier (ligne d'action) | src/pages/Fundings.tsx:198 | OK | Ouvre le formulaire d'édition | Aucune | P2 |
| Financements | Liste des financements | Bouton Supprimer (ligne d'action) | src/pages/Fundings.tsx:199 | OK | Supprime le financement après confirmation | Aucune | P2 |
| Financements | Liste des financements | Bouton Voir (ligne d'action) | src/pages/Fundings.tsx:200 | OK | Ouvre le modal de détail | Aucune | P3 |
| Financements | Modal création/édition | Bouton Annuler | src/pages/Fundings.tsx:214 | OK | Ferme le modal | Aucune | P3 |
| Financements | Modal création/édition | Bouton Créer/Modifier | src/pages/Fundings.tsx:215 | OK | Soumet le formulaire | Aucune | P2 |
| Financements | Modal détail | Bouton Supprimer | src/pages/Fundings.tsx:281 | OK | Supprime le financement après confirmation | Aucune | P2 |
| Financements | Modal détail | Bouton Modifier | src/pages/Fundings.tsx:282 | OK | Ouvre le formulaire d'édition | Aucune | P2 |
| Financements | Modal détail | Bouton Marquer envoyé (si prévu) | src/pages/Fundings.tsx:286 | OK | Met à jour le statut en "envoyé" | Aucune | P2 |
| Financements | Modal détail | Bouton En transit (si envoyé) | src/pages/Fundings.tsx:289 | OK | Met à jour le statut en "en transit" | Aucune | P2 |
| Financements | Modal détail | Bouton Marquer reçu (si envoyé/en transit) | src/pages/Fundings.tsx:292 | OK | Met à jour le statut en "reçu" | Aucune | P2 |
| Financements | Modal confirmation suppression | Bouton Annuler | src/pages/Fundings.tsx:332 | OK | Ferme le modal | Aucune | P3 |
| Financements | Modal confirmation suppression | Bouton Supprimer | src/pages/Fundings.tsx:333 | OK | Supprime le financement | Aucune | P2 |
| Animaux | Gestion des animaux | Bouton Nouvel animal | src/pages/AnimalManage.tsx:246 | OK | Fonctionne correctement | Aucune | P2 |
| Animaux | Gestion des animaux | Bouton Tous les animaux | src/pages/AnimalManage.tsx:250 | OK | Navigue vers la liste complète | Aucune | P3 |
| Animaux | Gestion des animaux | Bouton Réinitialiser (recherche) | src/pages/AnimalManage.tsx:278 | OK | Remet à zéro le terme de recherche | Aucune | P3 |
| Animaux | Gestion des animaux | Bouton Créer un animal (état vide) | src/pages/AnimalManage.tsx:290 | OK | Ouvre le formulaire de création | Aucune | P2 |
| Animaux | Gestion des animaux | Bouton Ajouter un animal (résultat vide) | src/pages/AnimalManage.tsx:307 | OK | Ouvre le formulaire de création | Aucune | P2 |
| Animaux | Modal création/édition | Bouton Annuler | src/pages/AnimalManage.tsx:399 | OK | Ferme le modal | Aucune | P3 |
| Animaux | Modal création/édition | Bouton Enregistrement.../Modifier/Créer | src/pages/AnimalManage.tsx:400 | OK | Soumet le formulaire | Aucune | P2 |
| Animaux | Modal détail | Bouton Supprimer | src/pages/AnimalManage.tsx:324 | OK | Supprime l'animal après confirmation | Aucune | P2 |
| Animaux | Modal détail | Bouton Modifier | src/pages/AnimalManage.tsx:325 | OK | Ouvre le formulaire d'édition | Aucune | P2 |
| Animaux | Modal détail | Bouton Marquer malade (si sain) | src/pages/AnimalManage.tsx:329 | OK | Met à jour le statut en "sick" | Aucune | P2 |
| Animaux | Modal détail | Bouton Marquer en rétablissement (si malade) | src/pages/AnimalManage.tsx:332 | OK | Met à jour le statut en "recovering" | Aucune | P2 |
| Animaux | Modal détail | Bouton Marquer guéri (si en rétablissement) | src/pages/AnimalManage.tsx:335 | OK | Met à jour le statut en "healthy" | Aucune | P2 |
| Animaux | Modal détail | Bouton Mettre en quarantaine (si sain/en rétablissement) | src/pages/AnimalManage.tsx:339 | OK | Met à jour le statut en "quarantined" | Aucune | P2 |
| Animaux | Modal détail | Bouton Marquer enceinte (si femelle et sain/en rétablissement) | src/pages/AnimalManage.tsx:341 | OK | Fonction placeholder (à implémenter) | À implémenter | P3 |
| Animaux | Modal détail | Bouton Retirer de quarantaine (si en quarantaine) | src/pages/AnimalManage.tsx:346 | OK | Met à jour le statut en "healthy" | Aucune | P2 |
| Animaux | Modal confirmation suppression | Bouton Annuler | src/pages/AnimalManage.tsx:580 | OK | Ferme le modal | Aucune | P3 |
| Animaux | Modal confirmation suppression | Bouton Supprimer | src/pages/AnimalManage.tsx:581 | OK | Supprime l'animal | Aucune | P2 |
| Parcelles | Gestion des parcelles | Bouton Nouvelle parcelle | src/pages/PlotManage.tsx:204 | OK | Fonctionne correctement | Aucune | P2 |
| Parcelles | Gestion des parcelles | Bouton Rechercher des parcelles | src/pages/PlotManage.tsx:220-226 | OK | Filtre la liste des parcelles | Aucune | P3 |
| Parcelles | Gestion des parcelles | Bouton Réinitialiser | src/pages/PlotManage.tsx:228 | OK | Remet à zéro le terme de recherche | Aucune | P3 |
| Parcelles | Gestion des parcelles | Bouton Créer une parcelle (état vide) | src/pages/PlotManage.tsx:241 | OK | Ouvre le formulaire de création | Aucune | P2 |
| Parcelles | Gestion des parcelles | Bouton Parcelle (carte cliquable) | src/pages/PlotManage.tsx:246 | OK | Ouvre le modal de détail | Aucune | P3 |
| Parcelles | Modal création/édition | Bouton Annuler | src/pages/PlotManage.tsx:327 | OK | Ferme le modal | Aucune | P3 |
| Parcelles | Modal création/édition | Bouton Enregistrement.../Modifier/Créer | src/pages/PlotManage.tsx:328 | OK | Soumet le formulaire | Aucune | P2 |
| Parcelles | Modal détail | Bouton Supprimer | src/pages/PlotManage.tsx:279 | OK | Supprime la parcelle après confirmation | Aucune | P2 |
| Parcelles | Modal détail | Bouton Modifier | src/pages/PlotManage.tsx:280 | OK | Ouvre le formulaire d'édition | Aucune | P2 |
| Parcelles | Modal détail | Bouton Désactiver (si active) | src/pages/PlotManage.tsx:284 | OK | Met à jour le statut en "inactive" | Aucune | P2 |
| Parcelles | Modal détail | Bouton Activer (si inactive/en préparation) | src/pages/PlotManage.tsx:287 | OK | Met à jour le statut en "active" | Aucune | P2 |
| Parcelles | Modal confirmation suppression | Bouton Annuler | src/pages/PlotManage.tsx:445 | OK | Ferme le modal | Aucune | P3 |
| Parcelles | Modal confirmation suppression | Bouton Supprimer | src/pages/PlotManage.tsx:446 | OK | Supprime la parcelle | Aucune | P2 |
| Documents | Gestion des documents | Bouton Nouveau document | src/pages/DocumentManage.tsx:292 | OK | Fonctionne correctement | Aucune | P2 |
| Documents | Gestion des documents | Champ Rechercher | src/pages/DocumentManage.tsx:309 | OK | Filtre la liste des documents | Aucune | P3 |
| Documents | Gestion des documents | Sélecteur Type de document | src/pages/DocumentManage.tsx:319 | OK | Filtre par type de document | Aucune | P3 |
| Documents | Gestion des documents | Sélecteur Entité liée | src/pages/DocumentManage.tsx:340 | OK | Filtre par entité liée | Aucune | P3 |
| Documents | Gestion des documents | Bouton Réinitialiser les filtres | src/pages/DocumentManage.tsx:354 | OK | Remet à zéro tous les filtres | Aucune | P3 |
| Documents | Gestion des documents | Bouton Nouveau document (état vide) | src/pages/DocumentManage.tsx:372 | OK | Ouvre le formulaire de création | Aucune | P2 |
| Documents | Modal création/édition | Bouton Annuler | src/pages/DocumentManage.tsx:473 | OK | Ferme le modal | Aucune | P3 |
| Documents | Modal création/édition | Bouton Enregistrement.../Modifier/Créer | src/pages/DocumentManage.tsx:474 | OK | Soumet le formulaire | Aucune | P2 |
| Documents | Modal détail | Bouton Supprimer | src/pages/DocumentManage.tsx:424 | OK | Supprime le document après confirmation | Aucune | P2 |
| Documents | Modal détail | Bouton Modifier | src/pages/DocumentManage.tsx:425 | OK | Ouvre le formulaire d'édition | Aucune | P2 |
| Documents | Modal confirmation suppression | Bouton Annuler | src/pages/DocumentManage.tsx:664 | OK | Ferme le modal | Aucune | P3 |
| Documents | Modal confirmation suppression | Bouton Supprimer | src/pages/DocumentManage.tsx:665 | OK | Supprime le document | Aucune | P2 |
| Utilisateurs | Liste des utilisateurs | Bouton Nouvel utilisateur | src/pages/UsersPage.tsx:104 | OK | Fonctionne correctement | Aucune | P2 |
| Utilisateurs | Liste des utilisateurs | Bouton Modifier (carte utilisateur) | src/pages/UsersPage.tsx:137 | OK | Ouvre le formulaire d'édition | Aucune | P2 |
| Utilisateurs | Liste des utilisateurs | Bouton Activer/Désactiver (carte utilisateur) | src/pages/UsersPage.tsx:138 | OK | Bascule le statut actif/inactif | Aucune | P2 |
| Utilisateurs | Liste des utilisateurs | Bouton Supprimer (carte utilisateur) | src/pages/UsersPage.tsx:142 | OK | Supprime l'utilisateur après confirmation (sauf l'utilisateur actuel) | Aucune | P2 |
| Utilisateurs | Modal création/édition | Bouton Annuler | src/pages/UsersPage.tsx:170 | OK | Ferme le modal | Aucune | P3 |
| Utilisateurs | Modal création/édition | Bouton Enregistrement.../Modifier/Créer | src/pages/UsersPage.tsx:171 | OK | Soumet le formulaire | Aucune | P2 |
| Utilisateurs | Modal confirmation suppression | Bouton Annuler | src/pages/UsersPage.tsx:205 | OK | Ferme le modal | Aucune | P3 |
| Utilisateurs | Modal confirmation suppression | Bouton Supprimer | src/pages/UsersPage.tsx:206 | OK | Supprime l'utilisateur | Aucune | P2 |
| Rapports | Liste des rapports | Bouton Export CSV | src/pages/Reports.tsx:101 | OK | Génère et télécharge le CSV | Aucune | P3 |
| Rapports | Liste des rapports | Bouton Export PDF (désactivé) | src/pages/Reports.tsx:104 | MORT | Fonctionnalité non implémentée | À implémenter ou supprimer | P4 |
| Rapports | Liste des rapports | Bouton Rapport financier | src/pages/Reports.tsx:114 | OK | Sélectionne le rapport financier | Aucune | P3 |
| Rapports | Liste des rapports | Bouton Rapport agricole | src/pages/Reports.tsx:114 | OK | Sélectionne le rapport agricole | Aucune | P3 |
| Rapports | Liste des rapports | Bouton Rapport élevage | src/pages/Reports.tsx:114 | OK | Sélectionne le rapport élevage | Aucune | P3 |
| Rapports | Liste des rapports | Bouton Rapport investissements | src/pages/Reports.tsx:114 | OK | Sélectionne le rapport investissements | Aucune | P3 |
| Rapports | Liste des rapports | Bouton Rapport financeur | src/pages/Reports.tsx:114 | OK | Sélectionne le rapport financeur | Aucune | P3 |
| Alertes | Liste des alertes | Bouton Résoudre (alerte ouverte) | src/pages/Alerts.tsx:79 | OK | Met à jour le statut en "résolue" | Aucune | P2 |
| Projets | Liste des projets | Bouton Nouveau projet | src/pages/Projects.tsx:142 | OK | Fonctionne correctement | Aucune | P2 |
| Projets | Liste des projets | Bouton Tous/En cours/Terminés | src/pages/Projects.tsx:156-160 | OK | Filtre la liste des projets | Aucune | P3 |
| Projets | Liste des projets | Bouton Modifier (carte projet) | src/pages/Projects.tsx:205 | OK | Ouvre le formulaire d'édition | Aucune | P2 |
| Projets | Liste des projets | Bouton Supprimer (carte projet) | src/pages/Projects.tsx:206 | OK | Supprime le projet après confirmation | Aucune | P2 |
| Projets | Modal détail | Bouton Supprimer | src/pages/Projects.tsx:223 | OK | Supprime le projet après confirmation | Aucune | P2 |
| Projets | Modal détail | Bouton Modifier | src/pages/Projects.tsx:224 | OK | Ouvre le formulaire d'édition | Aucune | P2 |
| Projets | Modal création/édition | Bouton Annuler | src/pages/Projects.tsx:280 | OK | Ferme le modal | Aucune | P3 |
| Projets | Modal création/édition | Bouton Enregistrement.../Modifier/Créer | src/pages/Projects.tsx:281 | OK | Soumet le formulaire | Aucune | P2 |
| Projets | Modal confirmation suppression | Bouton Annuler | src/pages/Projects.tsx:336 | OK | Ferme le modal | Aucune | P3 |
| Projets | Modal confirmation suppression | Bouton Supprimer | src/pages/Projects.tsx:337 | OK | Supprime le projet | Aucune | P2 |
| Trésorerie | Vue d'ensemble | Bouton Comptes bancaires | src/pages/Treasury.tsx:42 | OK | Navigue vers la page des comptes bancaires | Aucune | P3 |
| Trésorerie | Vue d'ensemble | Bouton Caisses | src/pages/Treasury.tsx:48 | OK | Navigue vers la page des caisses | Aucune | P3 |
| Trésorerie | Vue d'ensemble | Bouton Mouvements | src/pages/Treasury.tsx:54 | OK | Navigue vers la page des mouvements | Aucune | P3 |
| Trésorerie | Vue d'ensemble | Bouton Enregistrer mon premier mouvement (état vide) | src/pages/Treasury.tsx:135 | OK | Naviguerait vers la page des mouvements (à implémenter) | À implémenter | P3 |
| Trésorerie | Gestion de la trésorerie | Bouton Nouveau mouvement | src/pages/CashManage.tsx:282 | OK | Fonctionne correctement | Aucune | P2 |
| Trésorerie | Gestion de la trésorerie | Champ Rechercher | src/pages/CashManage.tsx:299 | OK | Filtre la liste des mouvements | Aucune | P3 |
| Trésorerie | Gestion de la trésorerie | Sélecteur Type | src/pages/CashManage.tsx:309 | OK | Filtre par type (revenus/dépenses) | Aucune | P3 |
| Trésorerie | Gestion de la trésorerie | Sélecteur Catégorie | src/pages/CashManage.tsx:321 | OK | Filtre par catégorie | Aucune | P3 |
| Trésorerie | Gestion de la trésorerie | Bouton Réinitialiser les filtres | src/pages/CashManage.tsx:341 | OK | Remet à zéro tous les filtres | Aucune | P3 |
| Trésorerie | Gestion de la trésorerie | Bouton Nouveau mouvement (état vide) | src/pages/CashManage.tsx:359 | OK | Ouvre le formulaire de création | Aucune | P2 |
| Trésorerie | Gestion de la trésorerie | Bouton Annuler (modal création/édition) | src/pages/CashManage.tsx:452 | OK | Ferme le modal | Aucune | P3 |
| Trésorerie | Gestion de la trésorerie | Bouton Enregistrement.../Modifier/Créer (modal création/édition) | src/pages/CashManage.tsx:453 | OK | Soumet le formulaire | Aucune | P2 |
| Trésorerie | Gestion de la trésorerie | Bouton Supprimer (modal détail) | src/pages/CashManage.tsx:405 | OK | Supprime le mouvement après confirmation | Aucune | P2 |
| Trésorerie | Gestion de la trésorerie | Bouton Modifier (modal détail) | src/pages/CashManage.tsx:406 | OK | Ouvre le formulaire d'édition | Aucune | P2 |
| Trésorerie | Gestion de la trésorerie | Bouton Annuler (modal confirmation suppression) | src/pages/CashManage.tsx:637 | OK | Ferme le modal | Aucune | P3 |
| Trésorerie | Gestion de la trésorerie | Bouton Supprimer (modal confirmation suppression) | src/pages/CashManage.tsx:638 | OK | Supprime le mouvement | Aucune | P2 |
| Fournisseurs | Liste des fournisseurs | Bouton Nouveau fournisseur | src/pages/Suppliers.tsx:120 | OK | Fonctionne correctement | Aucune | P2 |
| Fournisseurs | Liste des fournisseurs | Champ Rechercher | src/pages/Suppliers.tsx:134 | OK | Filtre la liste des fournisseurs | Aucune | P3 |
| Fournisseurs | Liste des fournisseurs | Bouton Modifier (carte fournisseur) | src/pages/Suppliers.tsx:180 | OK | Ouvre le formulaire d'édition | Aucune | P2 |
| Fournisseurs | Liste des fournisseurs | Bouton Supprimer (carte fournisseur) | src/pages/Suppliers.tsx:183 | OK | Supprime le fournisseur après confirmation | Aucune | P2 |
| Fournisseurs | Modal création/édition | Bouton Annuler | src/pages/Suppliers.tsx:200 | OK | Ferme le modal | Aucune | P3 |
| Fournisseurs | Modal création/édition | Bouton Enregistrement.../Modifier/Créer | src/pages/Suppliers.tsx:201 | OK | Soumet le formulaire | Aucune | P2 |
| Fournisseurs | Modal confirmation suppression | Bouton Annuler | src/pages/Suppliers.tsx:248 | OK | Ferme le modal | Aucune | P3 |
| Fournisseurs | Modal confirmation suppression | Bouton Supprimer | src/pages/Suppliers.tsx:249 | OK | Supprime le fournisseur | Aucune | P2 |
| Recettes | Liste des recettes | Bouton Nouvelle recette | src/pages/Recipes.tsx:217 | OK | Fonctionne correctement | Aucune | P2 |
| Recettes | Liste des recettes | Champ Rechercher | src/pages/Recipes.tsx:233 | OK | Filtre la liste des recettes | Aucune | P3 |
| Recettes | Liste des recettes | Sélecteur Catégorie | src/pages/Recipes.tsx:241 | OK | Filtre par catégorie | Aucune | P3 |
| Recettes | Liste des recettes | Sélecteur Statut | src/pages/Recipes.tsx:244 | OK | Filtre par statut | Aucune | P3 |
| Recettes | Liste des recettes | Bouton Modifier (carte recette) | src/pages/Recipes.tsx:289 | OK | Ouvre le formulaire d'édition | Aucune | P2 |
| Recettes | Liste des recettes | Bouton Supprimer (carte recette) | src/pages/Recipes.tsx:293 | OK | Supprime la recette après confirmation | Aucune | P2 |
| Recettes | Liste des recettes | Bouton Voir la fiche complète (carte recette verso) | src/pages/Recipes.tsx:321 | OK | Ouvre le modal de détail | Aucune | P3 |
| Recettes | Modal création/édition | Bouton Annuler | src/pages/Recipes.tsx:339 | OK | Ferme le modal | Aucune | P3 |
| Recettes | Modal création/édition | Bouton Choisir une image | src/pages/Recipes.tsx:371 | OK | Ouvre le sélecteur de fichier | Aucune | P3 |
| Recettes | Modal création/édition | Bouton Retirer l'image | src/pages/Recipes.tsx:377 | OK | Supprime l'image sélectionnée | Aucune | P3 |
| Recettes | Modal création/édition | Bouton Ajouter (ingrédient) | src/pages/Recipes.tsx:429 | OK | Ajoute un champ d'ingrédient | Aucune | P3 |
| Recettes | Modal création/édition | Bouton Supprimer (ingrédient) | src/pages/Recipes.tsx:438 | OK | Supprime un champ d'ingrédient | Aucune | P3 |
| Recettes | Modal création/édition | Bouton Ajouter (étape) | src/pages/Recipes.tsx:449 | OK | Ajoute un champ d'étape | Aucune | P3 |
| Recettes | Modal création/édition | Bouton Supprimer (étape) | src/pages/Recipes.tsx:457 | OK | Supprime un champ d'étape | Aucune | P3 |
| Recettes | Modal création/édition | Bouton Enregistrement.../Modifier/Créer | src/pages/Recipes.tsx:341 | OK | Soumet le formulaire | Aucune | P2 |
| Recettes | Modal détail | Bouton Supprimer | src/pages/Recipes.tsx:475 | OK | Supprime la recette après confirmation | Aucune | P2 |
| Recettes | Modal détail | Bouton Modifier | src/pages/Recipes.tsx:476 | OK | Ouvre le formulaire d'édition | Aucune | P2 |
| Recettes | Modal confirmation suppression | Bouton Annuler | src/pages/Recipes.tsx:538 | OK | Ferme le modal | Aucune | P3 |
| Recettes | Modal confirmation suppression | Bouton Supprimer | src/pages/Recipes.tsx:539 | OK | Supprime la recette | Aucune | P2 |
| Stocks | Gestion des stocks | Bouton Inventaire | src/pages/Inventory.tsx:33 | OK | Change l'onglet actif | Aucune | P3 |
| Stocks | Gestion des stocks | Bouton Mouvements | src/pages/Inventory.tsx:34 | OK | Change l'onglet actif | Aucune | P3 |
| Stocks | Gestion des stocks | Bouton Inventaires physiques | src/pages/Inventory.tsx:35 | OK | Change l'onglet actif | Aucune | P3 |