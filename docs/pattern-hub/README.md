# Pattern "Module Hub" — Référence

## Le modèle : ParcellesPage.tsx

Ce fichier est LE modèle à suivre pour tous les modules.

## Structure du fichier

1. **Imports** :
   - React hooks (useMemo, useState)
   - useData() pour les données
   - useSite() pour le filtre site
   - RotatingCard pour les cartes
   - lucide-react pour les icônes
   - module-theme.css pour le style

2. **4 KPIs** en haut (module-kpi-grid) :
   - Icône colorée + bordure gauche
   - Label + valeur

3. **4 Tabs avec compteurs** (module-tab) :
   - Tab 1 : Parcelles
   - Tab 2 : Campagnes
   - Tab 3 : Opérations
   - Tab 4 : Récoltes

4. **Grille de cartes rotatives** (module-cards-grid) :
   - Recto : nom + statut + culture + superficie + "Retour pour les actions →"
   - Verso : localisation + référence + "Ouvrir le journal" + Modifier + Supprimer

5. **Bouton "+ Nouvelle X"** en haut à droite (module-btn-primary)

6. **"Gestion détaillée ⓘ"** en haut à droite de la section

## Classes CSS à réutiliser (module-theme.css)

- `.module-kpi-grid` : grille des 4 KPIs
- `.module-kpi-card` : carte KPI
- `.module-kpi-icon` : icône colorée
- `.module-tab` : bouton tab
- `.module-tab.active` : tab actif
- `.module-section` : section principale
- `.module-section-header` : header de section
- `.module-cards-grid` : grille des cartes
- `.module-btn` : bouton standard
- `.module-btn-primary` : bouton vert principal
- `.module-empty-state` : état vide

## Principe

1. Le module est un HUB : 4 KPIs + tabs
2. Chaque tab contient une grille de cartes rotatives
3. Le filtre par site s'applique aux KPIs ET aux listes
4. Le bouton "+ Nouvelle X" change selon le tab actif

