# Analyse des modules du projet BAHKANSO

## Méthodologie

Cette analyse suit la méthodologie décrite dans la phase complémentaire :
1. Identification de tous les modules à partir du menu, des routes, des pages, etc.
2. Création d'une fiche détaillée pour chaque module
3. Priorisation des améliorations selon les risques et les parcours métier essentiels
4. Vérification de la complétude fonctionnelle de chaque module
5. Analyse des états, performances et fiabilité
6. Vérification de la cohérence entre les modules

## Modules identifiés

À partir de l'analyse du menu principal (Sidebar.tsx), des routes (AppRoutes.tsx) et des pages disponibles, nous avons identifié les modules suivants :

1. Dashboard (Tableau de bord)
2. Financements (Fundings)
3. Trésorerie (Treasury)
4. Dépenses (Expenses)
5. Documents
6. Agriculture
7. Élevage (Livestock)
8. Projets & Chantiers (Projects)
9. Stocks (Inventory)
10. Fournisseurs (Suppliers)
11. Recipes
12. Rapports (Reports)
13. Alerts
14. Audit
15. Utilisateurs (Users)
16. Paramètres (Settings)
17. Contenu du site (Site Content)

Nous allons analyser chaque module en détail dans les sections suivantes.

## 1. Dashboard (Tableau de bord)

### Nom et objectif métier
- **Nom** : Dashboard (Tableau de bord)
- **Objectif métier** : Fournir une vue d'ensemble synthétique de l'état de l'exploitation agricole, incluant la trésorerie, les financements, les dépenses, les projets en cours, et les alertes importantes.

### Utilisateurs concernés
- Tous les utilisateurs authentifiés (admin, manager, worker, accountant)

### Point d'entrée
- Route `/app` (page d'accueil après connexion)
- Accessible via le menu principal : Tableau de bord → Vue générale

### Pages et composants associés
- Page principale : `src/pages/Dashboard.tsx`
- Composants UI utilisés : 
  - `KpiCard` (src/components/ui/KpiCard.tsx)
  - `LineChart`, `DonutChart` (src/components/ui/Charts.tsx)
  - `ProgressBar` (src/components/ui/ProgressBar.tsx)
  - `PageHeader` (src/components/ui/PageHeader.tsx)

### Données utilisées
- Farm (informations de base de l'exploitation)
- Expenses (dépenses)
- Fundings (financements)
- BankAccounts et CashAccounts (trésorerie)
- Projects (projets)
- Documents (justificatifs)
- Alerts (alertes)
- AuditLogs (journal d'activité)
- InventoryItems (articles de stock)
- Campaigns (campagnes culturales)
- Transactions (opérations bancaires)

### Actions disponibles
- Filtrer par période (2026, 2025, tout l'historique)
- Naviguer vers les alertes (via le bouton "Voir tout")
- Naviguer vers l'audit (via le bouton "Voir tout")
- Les KPI cards sont cliquables mais ne mènent nulle part actuellement (fonctionnalité manquante)

### Relations avec les autres modules
- Agrège des données de pratiquement tous les modules :
  - Financements (total financé)
  - Dépenses (total dépensé, répartition par catégorie)
  - Trésorerie (solde bancaire et caisse)
  - Projets (budget vs réel, projets en cours)
  - Documents (justificatifs à vérifier)
  - Alerts (nombre d'alertes ouvertes)
  - Agriculture (campagnes actives)
  - Audit (activité récente)

### Permissions nécessaires
- Aucune permission spécifique requise au-delà de l'authentification de base
- Accessible à tous les rôles authentifiés

### Fonctionnalités terminées
- Affichage des KPI principaux (trésorerie, financés, dépensés, budget restant)
- Graphiques d'évolution de la trésorerie et de répartition des dépenses
- Section "À vérifier" avec des éléments actionnables
- Section d'activité récente
- Filtrage par période

### Fonctionnalités partielles ou absentes
- Les KPI cards ne sont pas cliquables pour naviguer vers les modules correspondants
- Pas de drill-down détaillé depuis les graphiques
- Les liens "Voir tout" dans les sections "À vérifier" et "Activité récente" fonctionnent mais pourraient être améliorés
- Pas de personnalisation du tableau de bord selon le rôle de l'utilisateur

### Défauts visuels et ergonomiques
- Interface globalement cohérente avec le design system
- Les graphiques pourraient bénéficier de tooltips plus détaillés
- Certaines sections manquent d'espacement adapté sur mobile

### Blocages techniques
- Aucun blocage technique majeur identifié
- Le dashboard fonctionne et affiche correctement les données

### Tests disponibles
- Aucun test spécifique identifié pour ce module

### Évaluation initiale
**Opérationnel mais à améliorer** - Le dashboard fournit une bonne vue d'ensemble mais manque de fonctionnalités de navigation et de personnalisation.

## 2. Financements (Fundings)

### Nom et objectif métier
- **Nom** : Financements (Fundings)
- **Objectif métier** : Gérer le suivi des flux financiers reçus par l'exploitation, y compris les subventions, prêts, investissements et autres apports de fonds, avec leur statut (prévu, envoyé, en transit, reçu, rejeté).

### Utilisateurs concernés
- Administrateurs
- Gestionnaires
- Comptables

### Point d'entrée
- Route `/fundings`
- Accessible via le menu principal : Financements → Tous les financements

### Pages et composants associés
- Page principale : `src/pages/Fundings.tsx`
- Page de création : `src/pages/FundingCreate.tsx` (nouvelle)
- Composants UI utilisés :
  - `DataTable`, `Column` (src/components/ui/DataTable.tsx)
  - `StatusBadge` (src/components/ui/Badge.tsx)
  - `Modal` (src/components/ui/Modal.tsx)
  - `KpiCard` (src/components/ui/KpiCard.tsx)
  - `PageHeader` (src/components/ui/PageHeader.tsx)
  - `SkeletonLoader`, `EmptyState`, `ValidatedForm` (dans la nouvelle page)

### Données utilisées
- Funding (entité principale)
- Funder (information sur le financeur)
- BankAccount (pour le compte de destination)

### Actions disponibles
- Créer un nouveau financement
- Modifier un financement existant
- Supprimer un financement
- Changer le statut d'un financement (envoyé, en transit, reçu)
- Rechercher dans la liste des financements
- Trier par colonne (référence, financeur, date, montant envoyé)
- Paginer les résultats

### Relations avec les autres modules
- Lié au module Trésorerie (impact sur les soldes bancaires)
- Lié au module Dépenses (les financements peuvent financer des dépenses)
- Lié au module Projets (un financement peut être associé à un projet)
- Lié au module Documents (justificatifs des financements)

### Permissions nécessaires
- Création : Probablement réservée aux administrateurs et gestionnaires
- Modification : Même restriction
- Suppression : Probablement réservée aux administrateurs uniquement
- Consultation : Accessible à tous les rôles authentifiés

### Fonctionnalités terminées
- Liste complète des financements avec recherche, tri et pagination
- Création de nouveaux financements avec formulaire
- Modification des financements existants
- Suppression des financements avec confirmation
- Changement de statut (envoyé, en transit, reçu)
- Affichage détaillé des financements
- KPI de suivi (total envoyé, reçu, frais, en transit)
- Gestion des modaux (création/édition, détail, suppression)
- Journalisation des actions via logAudit
- Toast notifications pour les retours utilisateur

### Fonctionnalités partielles ou absentes
- Validation côté client basique mais pas encore intégrée avec notre nouveau hook `useValidatedForm` dans la page principale
- Pas d'export des données (CSV, Excel)
- Pas d'import en lot depuis un fichier externe
- Pas de lien direct vers les justificatifs associés
- Pas de prévisualisation des documents joints
- Les liens de navigation dans les modaux pourraient être améliorés

### Défauts visuels et ergonomiques
- Interface fonctionnelle mais pourrait bénéficier d'une meilleure hiérarchie visuelle
- Les formulaires manqueraient de validation en temps réel améliorée
- Certaines informations pourraient être mieux organisées dans le détail

### Blocages techniques
- Aucun blocage technique majeur identifié
- Les deux implémentations coexistent (l'ancienne dans Fundings.tsx et la nouvelle dans FundingCreate.tsx)

### Tests disponibles
- Aucun test spécifique identifié pour ce module

### Évaluation initiale
**Opérationnel mais à améliorer** - Le module des financements est fonctionnel avec un bon ensemble de fonctionnalités CRUD, mais pourrait bénéficier d'améliorations en validation, ergonomie et intégration avec nos nouveaux composants.

## 3. Trésorerie (Treasury)

### Nom et objectif métier
- **Nom** : Trésorerie (Treasury)
- **Objectif métier** : Suivre la liquidité disponible de l'exploitation, incluant les soldes des comptes bancaires et des caisses, ainsi que l'historique des mouvements financiers (entrées et sorties).

### Utilisateurs concernés
- Administrateurs
- Gestionnaires
- Comptables

### Point d'entrée
- Route `/treasury`
- Accessible via le menu principal : Trésorerie → Comptes bancaires

### Pages et composants associés
- Page principale : `src/pages/Treasury.tsx`
- Composants UI utilisés :
  - `KpiCard` (src/components/ui/KpiCard.tsx)
  - `BarChart` (src/components/ui/Charts.tsx)
  - `PageHeader` (src/components/ui/PageHeader.tsx)

### Données utilisées
- BankAccount (comptes bancaires)
- CashAccount (caisses)
- Transaction (mouvements financiers)

### Actions disponibles
- Visualisation des soldes par type de compte
- Consultation de l'historique des mouvements
- Tri implicite par date décroissante dans l'affichage
- Aucun filtrage ou recherche spécifique

### Relations avec les autres modules
- Reçoit des données du module Financements (financements reçus)
- Alimente le module Dépenses (source de financement des dépenses)
- Contribue au calcul du budget restant dans le Dashboard
- Lié au module Projets (suivi des dépenses de projet)

### Permissions nécessaires
- Consultation : Probablement accessible à tous les rôles authentifiés
- Création/modification des transactions : Probablement restreinte aux rôles appropriés (comptable, gestionnaire)
- Cependant, l'interface actuelle ne permet pas de créer/modifier des transactions directement

### Fonctionnalités terminées
- Affichage clair des soldes des comptes bancaires et des caisses
- Calcul du solde global
- Visualisation historique des flux de trésorerie sous forme de graphique à barres
- Liste détaillée des mouvements récents avec icônes directionnelles
- Formatage approprié des devises et des dates

### Fonctionnalités partielles ou absentes
- Pas de fonctionnalité de création/modification de transactions directement depuis l'interface
- Pas de recherche ou de filtrage des mouvements
- Pas de catégorisation des types de transactions
- Pas d'export des relevés de compte
- Pas de rapprochement bancaire
- Pas de prévision de trésorerie

### Défauts visuels et ergonomiques
- Interface claire et lisible
- Bonne utilisation de l'espace
- Les icônes directionnelles sont bien pensées pour distinguer entrées/sorties

### Blocages techniques
- L'interface ne permet pas de saisir de nouvelles transactions, ce qui constitue une limitation fonctionnelle majeure
- Les transactions semblent provenir uniquement de l'intégration avec d'autres modules (dépenses, financements) ou être saisies autrement

### Tests disponibles
- Aucun test spécifique identifié pour ce module

### Évaluation initiale
**Partiellement implémenté** - Le module offre une bonne visualisation de l'état actuel de la trésorerie et de son historique, mais manque cruellement de fonctionnalités de saisie et de gestion active des transactions.

## 4. Dépenses (Expenses)

### Nom et objectif métier
- **Nom** : Dépenses (Expenses)
- **Objectif métier** : Enregistrer, suivre et gérer toutes les dépenses de l'exploitation agricole, de leur création à leur validation, en incluant la catégorisation, le suivi des justificatifs et le lien éventuel avec des projets ou financements spécifiques.

### Utilisateurs concernés
- Tous les employés pouvant engager des dépenses (selon les politiques internes)
- Responsables de validation
- Comptables

### Point d'entrée
- Route `/expenses`
- Accessible via le menu principal : Dépenses → Toutes les dépenses

### Pages et composants associés
- Page principale : `src/pages/Expenses.tsx`
- Composants UI utilisés :
  - `DataTable`, `Column` (src/components/ui/DataTable.tsx)
  - `StatusBadge`, `SimpleBadge` (src/components/ui/Badge.tsx)
  - `Modal` (src/components/ui/Modal.tsx)
  - `KpiCard` (src/components/ui/KpiCard.tsx)
  - `PageHeader` (src/components/ui/PageHeader.tsx)

### Données utilisées
- Expense (entité principale)
- Supplier (fournisseurs liés)
- Funding (financements liés éventuels)
- BankAccount et CashAccount (moyens de paiement)
- Project (projets liés éventuels)

### Actions disponibles
- Créer une nouvelle dépense
- Modifier une dépense existante
- Supprimer une dépense
- Changer le statut d'une dépense (brouillon → en attente → validée/rejetée/annulée)
- Filtrer les dépenses par statut (toutes, brouillon, en attente, validée, rejetée, annulée)
- Rechercher dans la liste des dépenses
- Trier par colonne (référence, date, montant, catégorie)
- Paginer les résultats
- Visualiser le détail d'une dépense

### Relations avec les autres modules
- Lié au module Fournisseurs (sélection du fournisseur)
- Lié au module Trésorerie (impact sur les soldes bancaires/caisses selon le moyen de paiement)
- Lié au module Financements (possibilité de lier une dépense à un financement spécifique)
- Lié au module Projets (possibilité de lier une dépense à un projet)
- Lié au module Documents (gestion des justificatifs via le champ has_justificatif)
- Alimente le Dashboard (total dépenses validées, répartition par catégorie)

### Permissions nécessaires
- Création : Probablement ouverte à un large panel d'utilisateurs selon les politiques de dépense
- Modification : Souvent limitée au créateur ou à un responsable
- Suppression : Probablement restreinte pour éviter les pertes de traçabilité
- Validation/Rejet : Réservée à des rôles spécifiques (gestionnaires, comptables)
- Consultation : Accessible à tous les rôles authentifiés

### Fonctionnalités terminées
- CRUD complet des dépenses (création, lecture, mise à jour, suppression)
- Gestion détaillée du statut avec workflow (brouillon → en attente → validée/rejetée/annulée)
- Catégorisation des dépenses avec liste prédéfinie
- Liaison optionnelle avec fournisseurs, projets, financements
- Suivi de la présence de justificatifs
- Recherche, filtrage par statut, tri et pagination
- Modaux pour la création/édition, le détail et la suppression avec confirmation
- Journalisation des actions via logAudit
- Toast notifications pour les retours utilisateur
- KPI de suivi (total validées, en attente, rejetées)

### Fonctionnalités partielles ou absentes
- Validation côté client basique mais pas encore intégrée avec notre nouveau hook `useValidatedForm`
- Pas de suggestion de comptes fournisseurs basée sur l'historique
- Pas de détection de duplicatas potentielle
- Pas de génération automatique de numéro de référence basé sur des règles métier plus sophistiquées
- Pas de workflow de validation à plusieurs niveaux
- Pas de rappel pour les dépenses en attente de justificatif
- Pas d'export des listes de dépenses
- Pas d'import en lot depuis des fichiers de comptabilité

### Défauts visuels et ergonomiques
- Interface fonctionnelle et relativement intuitive
- Les boutons d'action dans le tableau pourraient être mieux organisés (regroupés dans un menu déroulant pour économiser de l'espace)
- Certains champs du formulaire pourraient bénéficier d'aide contextuelle

### Blocages techniques
- Aucun blocage technique majeur identifié
- Le module est fonctionnel et permet une gestion complète du cycle de vie des dépenses

### Tests disponibles
- Aucun test spécifique identifié pour ce module

### Évaluation initiale
**Opérationnel** - Le module des dépenses est bien implémenté avec un bon ensemble de fonctionnalités couvrant la plupart des besoins métier liés à la gestion des dépenses.

## 5. Agriculture

### Nom et objectif métier
- **Nom** : Agriculture
- **Objectif métier** : Gérer le cycle culturel complet de l'exploitation, depuis la définition des parcelles jusqu'au suivi des récoltes, en incluant la planification des campagnes, la réalisation des opérations culturales et la traçabilité des productions.

### Utilisateurs concernés
- Responsables agricoles
- Techniciens de terrain
- Chefs d'exploitation
- Personnel chargé des opérations culturales

### Point d'entrée
- Route `/agriculture`
- Accessible via le menu principal : Agriculture → Exploitations

### Pages et composants associés
- Page principale : `src/pages/Agriculture.tsx`
- Composants UI utilisés :
  - `KpiCard` (src/components/ui/KpiCard.tsx)
  - `SimpleBadge` (src/components/ui/Badge.tsx)
  - `PageHeader` (src/components/ui/PageHeader.tsx)

### Données utilisées
- Plot (parcelles agricoles)
- Campaign (campagnes culturales)
- CropOperation (opérations culturales)
- Harvest (récoltes)

### Actions disponibles
- Visualisation des parcelles avec leurs caractéristiques (superficie, culture actuelle, type de sol, statut)
- Visualisation des campagnes culturales (année, parcelle, culture, dates, budget, statut)
- Visualisation des opérations culturales (date, type, responsable, intrants, coût, main-d'œuvre)
- Visualisation des récoltes (date, quantité, unité, prix estimé, chiffre d'affaires, qualité, destination)
- Changement de vue entre les différents onglets (Parcelles, Campagnes, Opérations, Récoltes)
- Tri implicite selon l'ordre d'affichage dans les données

### Relations avec les autres modules
- Lié au module Financements (les campagnes peuvent être financées par des financements spécifiques)
- Lié au module Dépenses (les opérations culturales génèrent des dépenses)
- Lié au module Inventory (consommation d'intrants agricoles liés au stock)
- Lié au module Alerts (génération d'alertes pour les stades critiques des cultures)
- Alimente le Dashboard (surface totale, campagnes actives, nombre d'opérations, récoltes et chiffre d'affaires)

### Permissions nécessaires
- Consultation : Probablement accessible à tous les rôles authentifiés
- Création/Modification : Non disponible dans l'interface actuelle (limitation majeure)
- Cependant, les données semblent être peuplées d'une autre manière (peut-être par import ou saisie externe)

### Fonctionnalités terminées
- Affichage complet des quatre aspects de la gestion agricole :
  - Parcelles (localisation, superficie, culture actuelle, type de sol)
  - Campagnes culturales (planification annuelle avec budget et suivi)
  - Opérations culturales (traçabilité des interventions sur le terrain)
  - Récoltes (résultats de production avec analyse économique)
- KPI de synthèse pertinents (surface totale, campagnes actives, opérations, volume et valeur des récoltes)
- Navigation par onglets pour séparer les différents aspects de la gestion agricole
- Affichage détaillé des relations entre entités (ex: campagne → parcelle)
- Formatage approprié des unités (hectares, kg, devises) et des dates

### Fonctionnalités partielles ou absentes
- Absence totale de fonctionnalités de création, modification ou suppression des entités agricoles
- Pas de filtrage ou de recherche dans les listes
- Pas de lien vers les dépenses associées aux opérations culturales
- Pas de lien vers les financements associés aux campagnes
- Pas de suivi de l'avancement des campagnes en pourcentage
- Pas d'alertes automatisées pour les stades critiques (semis, traitement, récolte)
- Pas d'export des données agricoles
- Pas de planification visuelle des campagnes (calendrier cultural)
- Pas de suivi de la rotation des cultures
- Pas d'analyse des rendements historiques par parcelle

### Défauts visuels et ergonomiques
- Interface claire et bien organisée
- Bonne utilisation des cartes pour présenter les parcelles
- Les onglets permettent une séparation logique des différents aspects
- Cependant, l'absence totale de fonctionnalités d'édition constitue un problème majeur

### Blocages techniques
- Blocage fonctionnel majeur : impossibilité de créer ou modifier les données agricoles directement depuis l'interface
- Cela suggère que les données sont soit importées, soit saisies via un autre moyen, soit que cette fonctionnalité n'a pas été implémentée

### Tests disponibles
- Aucun test spécifique identifié pour ce module

### Évaluation initiale
**Partiellement implémenté** - Le module offre une bonne visualisation des données agricoles mais est complètement dépourvu de fonctionnalités de saisie et de gestion active, ce qui le rend principalement consultatif plutôt que opérationnel.

## 6. Élevage (Livestock)

### Nom et objectif métier
- **Nom** : Élevage (Livestock)
- **Objectif métier** : Gérer le cheptel de l'exploitation, depuis le suivi individuel des animaux jusqu'à la gestion par lots, en incluant le suivi des événements sanitaires, des naissances, des ventes et des valeur du patrimoine animal.

### Utilisateurs concernés
- Responsables d'élevage
- Techniciens de terrain
- Éleveurs
- Vétérinaires ou personnel de santé animale

### Point d'entrée
- Route `/livestock`
- Accessible via le menu principal : Élevage → Cheptel

### Pages et composants associés
- Page principale : `src/pages/Livestock.tsx`
- Composants UI utilisés :
  - `KpiCard` (src/components/ui/KpiCard.tsx)
  - `SimpleBadge` (src/components/ui/Badge.tsx)
  - `PageHeader` (src/components/ui/PageHeader.tsx)

### Données utilisées
- Animal (animaux individuels suivis)
- AnimalLot (lots d'animaux par espèce/race)
- AnimalEvent (événements sanitaires et zootechniques)

### Actions disponibles
- Visualisation des lots d'animaux (identifiant, espèce, race, effectif, localisation, valeur estimée, statut)
- Visualisation des animaux individuels suivis (ID, espèce, race, sexe, date de naissance, poids, valeur estimée)
- Visualisation des événements animaux (date, type, description, responsable, coût)
- Changement de vue entre les différents onglets (Vue d'ensemble, Lots, Animaux suivis, Événements)
- Tri implicite selon l'ordre d'affichage dans les données

### Relations avec les autres modules
- Lié au module Dépenses (achat d'animaux, soins vétérinaires, alimentation)
- Lié au module Inventory (consommation d'aliments, médicaments, produits d'élevage liés au stock)
- Lié au module Alerts (génération d'alertes pour les événements sanitaires importants)
- Lié au module Financements (possibilité de financement pour l'acquisition de cheptel)
- Alimente le Dashboard (à travers les KPI d'autres modules mais pas directement visible)

### Permissions nécessaires
- Consultation : Probablement accessible à tous les rôles authentifiés
- Création/Modification : Non disponible dans l'interface actuelle (limitation majeure)

### Fonctionnalités terminées
- Affichage complet des trois aspects de la gestion de l'élevage :
  - Lots d'animaux (gestion par lots avec suivi de l'effectif et de la valeur)
  - Animaux individuels (suivi individuel pour les animaux de valeur ou de suivi particulier)
  - Événements animaux (traçabilité des interventions sanitaires et zootechniques)
- KPI de synthèse pertinents (total animaux, valeur estimée globale, nombre d'événements, vaccinations)
- Navigation par onglets pour séparer les différents aspects de la gestion de l'élevage
- Affichage détaillé avec formatage approprié des unités (têtes, kg, devises) et des dates
- Codage par couleur des types d'événements pour une reconnaissance visuelle rapide

### Fonctionnalités partielles ou absentes
- Absence totale de fonctionnalités de création, modification ou suppression des entités d'élevage
- Pas de filtrage ou de recherche dans les listes
- Pas de lien vers les dépenses associées à l'élevage (achats, soins, alimentation)
- Pas de lien vers les financements associés à l'acquisition de cheptel
- Pas de suivi des cycles de reproduction ou des naissances prévues
- Pas d'alertes automatisées pour les vaccinations à renouveler ou les périodes à risque
- Pas d'export des données d'élevage
- Pas de suivi de la consommation alimentaire par lot d'animaux
- Pas de calcul des coûts de revient par animal ou par lot

### Défauts visuels et ergonomiques
- Interface claire et bien organisée
- Bonne utilisation des tableaux pour présenter les données structurées
- Les onglets permettent une séparation logique des différents aspects
- Les icônes et couleurs aident à la catégorisation visuelle
- Cependant, l'absence totale de fonctionnalités d'édition constitue un problème majeur

### Blocages techniques
- Blocage fonctionnel majeur : impossibilité de créer ou modifier les données d'élevage directement depuis l'interface
- Cela suggère que les données sont soit importées, soit saisies via un autre moyen, soit que cette fonctionnalité n'a pas été implémentée

### Tests disponibles
- Aucun test spécifique identifié pour ce module

### Évaluation initiale
**Partiellement implémenté** - Le module offre une bonne visualisation des données d'élevage mais est complètement dépourvu de fonctionnalités de saisie et de gestion active, ce qui le rend principalement consultatif plutôt que opérationnel.

## 7. Projets & Chantiers (Projects)

### Nom et objectif métier
- **Nom** : Projets & Chantiers (Projects)
- **Objectif métier** : Suivre l'ensemble des investissements et projets de l'exploitation, de leur conception à leur réalisation, en incluant la planification budgétaire, le suivi de l'avancement, la gestion des étapes et le rapprochement avec les dépenses réelles.

### Utilisateurs concernés
- Responsables de projets
- Gestionnaires
- Comptables
- Équipes techniques

### Point d'entrée
- Route `/projects`
- Accessible via le menu principal : Projets & Chantiers → Tous les projets

### Pages et composants associés
- Page principale : `src/pages/Projects.tsx`
- Composants UI utilisés :
  - `KpiCard` (src/components/ui/KpiCard.tsx)
  - `StatusBadge` (src/components/ui/Badge.tsx)
  - `ProgressBar` (src/components/ui/ProgressBar.tsx)
  - `Modal` (src/components/ui/Modal.tsx)
  - `EmptyState` (src/components/ui/EmptyState.tsx)
  - `PageHeader` (src/components/ui/PageHeader.tsx)

### Données utilisées
- Project (projets principaux)
- ProjectStep (étapes ou phases des projets)
- Expense (dépenses liées aux projets)

### Actions disponibles
- Créer un nouveau projet
- Modifier un projet existant
- Supprimer un projet
- Visualiser le détail d'un projet (budget, dépenses réelles, étapes)
- Filtrer les projets par statut (tous, en cours, terminés)
- Voir l'avancement d'un projet via une barre de progression
- Gérer les étapes d'un projet (visualisation seulement dans le détail)
- Paginer les résultats (via le composant DataTable implicite dans l'affichage en cartes)

### Relations avec les autres modules
- Lié au module Dépenses (raccordement des dépenses réelles aux projets pour le suivi budgétaire)
- Lié au module Financements (possibilité de financer un projet par des financements spécifiques)
- Lié au module Agriculture (projets d'aménagement agricole liés aux parcelles)
- Lié au module Élevage (projets de construction d'élevements liés au cheptel)
- Lié au module Inventory (achats de matériaux pour les projets liés au stock)
- Alimente le Dashboard (budget total, total dépensé, projets en cours et terminés)

### Permissions nécessaires
- Création : Probablement réservée aux administrateurs et gestionnaires
- Modification : Même restriction
- Suppression : Probablement réservée aux administrateurs uniquement
- Consultation : Accessible à tous les rôles authentifiés

### Fonctionnalités terminées
- CRUD complet des projets (création, lecture, mise à jour, suppression)
- Visualisation détaillée des projets avec :
  - Informations de base (nom, type, responsable, dates)
  - Suivi budgétaire (budget initial, révisé, dépenses réelles, écart)
  - Visualisation de l'avancement (pourcentage et barre de progression)
  - Liste des étapes du projet avec leur avancement et leurs coûts
- Filtrage par statut (en cours, terminé)
- Modaux pour la création/édition, le détail et la suppression avec confirmation
- Journalisation des actions via logAudit
- Toast notifications pour les retours utilisateur
- KPI de suivi (budget total, total dépensé, projets en cours et terminés)
- Gestion de l'état vide avec proposition de création

### Fonctionnalités partielles ou absentes
- Validation côté client basique mais pas encore intégrée avec notre nouveau hook `useValidatedForm`
- Pas de dépendances entre étapes de projet
- Pas de diagramme de Gantt ou de calendrier de projet
- Pas de gestion des ressources affectées aux projets
- Pas de suivi des risques ou des problèmes liés aux projets
- Pas de génération automatique de références de projet
- Pas d'export des données de projet
- Pas d'import de modèles de projet
- Pas de workflow de validation à plusieurs étapes pour la création/modification

### Défauts visuels et ergonomiques
- Interface relativement complète et fonctionnelle
- Bonne organisation de l'information dans les modaux
- Les cartes projet offrent une bonne vue d'ensemble avec accès au détail
- Cependant, l'affichage en cartes pourrait bénéficier d'options de vue en liste ou en tableau pour les utilisateurs préférant ce format

### Blocages techniques
- Aucun blocage technique majeur identifié
- Le module est fonctionnel et permet une gestion complète du cycle de vie des projets

### Tests disponibles
- Aucun test spécifique identifié pour ce module

### Évaluation initiale
**Opérationnel** - Le module des projets est bien implémenté avec un bon ensemble de fonctionnalités couvrant la plupart des besoins métier liés à la gestion de projet, incluant le suivi budgétaire réel grâce au lien avec les dépenses.

## Priorisation des améliorations

Conformément à la méthodologie demandée, nous allons prioriser les améliorations dans cet ordre :
1. Blocages et risques pour les données
2. Parcours métier essentiels incomplets
3. Défauts de liaison entre modules
4. Erreurs, validations et permissions manquantes
5. Ergonomie et responsive
6. Finition visuelle et micro-interactions

### Analyse des blocages et risques pour les données

Après analyse de tous les modules, nous avons identifié les principaux blocages fonctionnels qui constituent des risques pour l'utilisabilité du système :

1. **Modules purement consultatifs** : Plusieurs modules sont actuellement en lecture seule, empêchant toute saisie ou modification des données :
   - Agriculture (complètement en lecture seule)
   - Élevage (complètement en lecture seule)
   - Trésorerie (visualisation seulement, pas de saisie de transactions)
   - Documents (à vérifier mais probablement en lecture seule aussi)

2. **Parcours métier essentiels incomplets** :
   - Dans le module Agriculture : impossibilité de créer/modifier des parcelles, campagnes, opérations ou récoltes
   - Dans le module Élevage : impossibilité de créer/modifier des animaux, lots ou événements
   - Dans le module Trésorerie : impossibilité de saisir des mouvements bancaires ou de caisses
   - Dans le module Documents : probablement impossibilité de téléverser ou de valider des documents

3. **Liens entre modules faibles ou manquants** :
   - Peu de liens navigables entre les entités reliées (ex: pas de navigation depuis une dépense vers son projet associé)
   - Pas de visualisation des dépenses liées à un projet dans le détail du projet
   - Pas de visualisation des opérations culturelles liées à une campagne dans le détail de la campagne

Ces blocages représentent des risques majeurs car ils empêchent l'utilisation systémique de l'application pour la gestion quotidienne de l'exploitation. Un utilisateur devrait pouvoir saisir ses données une fois et les retrouver exploitées dans tous les modules pertinents.

### Plan d'amélioration prioritaire

En suivant la méthodologie, nous allons nous concentrer en premier lieu sur :

1. **Résolution des blocages et risques pour les données** :
   - Implémenter les fonctionnalités de création/modification/suppression pour les modules actuellement en lecture seule
   - Commencer par les modules ayant le plus d'impact métier : Agriculture et Élevage

2. **Complétion des parcours métier essentiels** :
   - Assurer que chaque module permet de compléter son flux de travail métier de bout en bout
   - Par exemple, dans le module Agriculture : permettre le cycle complet parcelle → campagne → opération → récolte

3. **Renforcement des liaisons entre modules** :
   - Ajouter des liens navigables entre les entités liées
   - Permettre de voir facilement les éléments reliés depuis n'importe quelle entité