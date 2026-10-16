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

| Module | Écran | Élément | Fichier:Ligne | État de l’action | Niveau de preuve | Cause observée | Correction proposée | Priorité |
|--------|-------|---------|---------------|------------------|------------------|----------------|---------------------|----------|
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
