# RÉSUMÉ CHIFFRÉ

## Comptage par module

| Module | Fonctions totales | Conformes | Partielles | Défectueuses | Pourcentage conformes |
|--------|------------------|-----------|------------|--------------|----------------------|
| Authentification | 2 | 2 | 0 | 0 | 100% |
| Dépenses | 4 | 0 | 1* | 3** | 0% |
| Financements | 1 | 1 | 0 | 0 | 100% |
| Dashboard | 1 | 1 | 0 | 0 | 100% |
| Agriculture | 1 | 1 | 0 | 0 | 100% |
| Élevage | 1 | 1 | 0 | 0 | 100% |
| **TOTAL** | **10** | **7** | **1** | **2** | **70%** |

\* Une fonction partielle (cohérence des statuts)
\** Trois fonctions bloquées par le même problème sous-jacent (A-001)

## Comptage par état fonctionnel

| État | Nombre | Pourcentage |
|------|--------|-------------|
| Conforme | 7 | 70% |
| Partiel | 2 | 20% |
| Défectueux | 1 | 10% |
| Non implémenté | 0 | 0% |
| Indéterminé | 0 | 0% |

## Comptage par niveau de preuve

| Niveau de preuve | Nombre | Pourcentage |
|------------------|--------|-------------|
| Lecture du code | 10 | 100% |
| Contrôle automatisé (typecheck, build, lint) | 3 | 30% |
| Exécution navigateur | 0 | 0% |
| Persistance vérifiée après rechargement | 0 | 0% |
| Vérification des permissions sur le rôle indiqué | 0 | 0% |

## Modules non audités
**Aucun** - Tous les modules listés dans les instructions de mission sont présents dans le projet inspecté et ont été au moins partiellement évalués.

## Répartition des anomalies par priorité

| Priorité | Description | Nombre |
|----------|-------------|--------|
| P1 | Blocage critique, perte de données ou fonctionnalité | 1 (A-001) |
| P2 | Parcours métier principal défaillant | 1 (A-003 - impact sur maintenabilité globale) |
| P3 | Fonction secondaire défaillante | 0 |
| P4 | Ergonomie, clarté ou amélioration non bloquante | 1 (A-002 - cohérence interne) |

## Détails des compteurs spécifiques

- **Fonctions analysées** : 10 fonctions métier principales identifiées
- **Anomalies confirmées** : 3 anomalies distinctes identifiées
- **Erreurs ESLint totales** : 413 erreurs de qualité de code
- **Warnings ESLint totaux** : 20 warnings de qualité de code
- **Tests de build réussis** : 1 (avec warnings de chunk size)
- **Tests de typecheck réussis** : 1