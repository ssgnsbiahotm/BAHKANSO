# Rapport d’audit initial — BAHKANSO

**Date :** 15 novembre 2026  
**Branche inspectée :** `main`  
**Branche documentaire :** `docs/memory-audit-report`  
**Dépôt :** https://github.com/ssgnsbiahotm/BAHKANSO

## 1. Objet

Ce rapport consigne une première analyse du dépôt BAHKANSO après consultation de sa structure, de sa configuration applicative, de son routage, de ses modules, de ses tests et de son historique de migrations Supabase.

Cette étape est documentaire. Aucun code métier, aucune migration distante et aucune configuration de production n’a été modifiée.

## 2. Synthèse exécutive

BAHKANSO est une application React/TypeScript construite avec Vite et organisée autour de modules agro-pastoraux, d’une couche Supabase et d’un routage protégé par authentification et permissions.

L’architecture présente déjà plusieurs bases solides : séparation des pages et modules, chargement différé des écrans, présence de tests unitaires et E2E, historique RLS conséquent, et documentation d’audits antérieurs.

L’audit complet reste à confirmer par l’exécution locale des commandes et par une inspection plus approfondie des fichiers métier. À ce stade, le niveau de confiance est donc **PARTIEL**.

## 3. Inventaire technique

| Domaine | Constat | Évaluation |
|---|---|---|
| Frontend | React 18, TypeScript, Vite | Cohérent |
| Routage | React Router avec `createBrowserRouter` | Structuré, à tester en navigation réelle |
| Authentification | Contexte Supabase et `RequireAuth` | Présente, à vérifier avec des sessions réelles |
| Autorisations | `RequireModule`, RBAC et politiques RLS | Présentes, audit de cohérence à poursuivre |
| Données | Supabase avec nombreuses migrations | Puissant mais complexe à maintenir |
| Requêtes | TanStack Query et contextes applicatifs | Présents, vérifier les invalidations |
| Tests | Vitest, Testing Library, Playwright | Présents, exécution nécessaire |
| Qualité | ESLint et TypeScript configurés | Vérification locale non exécutée dans cette session |
| Documentation | Rapports nombreux, pas de README racine | À améliorer |

## 4. Fonctionnement applicatif observé

Le point d’entrée `src/App.tsx` compose plusieurs providers : toast, TanStack Query, authentification, données, site et défilement fluide. Le routeur est ensuite rendu via `RouterProvider`.

`src/routes/AppRoutes.tsx` :

- charge les pages avec `lazy()` ;
- affiche `PageSkeleton` pendant le chargement ;
- protège `/app` avec `RequireAuth` ;
- protège les modules avec `RequireModule` ;
- expose des espaces agriculture/exploitation, élevage, finance, configuration, surveillance et gestion ;
- conserve plusieurs redirections de compatibilité entre anciens et nouveaux chemins.

Cette organisation suggère une application modulaire avec évolution progressive des routes historiques.

## 5. Analyse des modules

Les modules principaux repérés sont :

- `src/modules/Exploitation`
- `src/modules/Finance`
- `src/modules/Sales`

Les pages dédiées couvrent notamment les parcelles, campagnes, opérations, récoltes, journaux de culture, lots, animaux, événements, inventaire, projets, fournisseurs, médias et surveillance.

La note existante `memory/sales-cards-display-fix.md` documente une correction ciblée du rendu des cartes de ventes et indique que des tests TypeScript, build et unitaires avaient été exécutés à cette occasion.

## 6. Supabase et migrations

Le dépôt contient un historique important de migrations couvrant notamment :

- tables cœur et tables opérationnelles ;
- données initiales ;
- authentification et synchronisation utilisateur ;
- politiques RLS par rôle et par site ;
- ventes, finance et liens financiers ;
- journal d’événements et triggers ;
- multi-sites, fermes et identifiants métier ;
- stockage média et bucket d’assets ;
- corrections de sécurité et de moindre privilège.

### Risques à examiner

1. **Complexité de l’historique** : plusieurs migrations corrigent ou complètent des migrations antérieures. Il faut comparer l’état déclaré avec l’état réellement appliqué.
2. **RLS** : les politiques par rôle, site et module doivent être testées avec des profils distincts, notamment lecture, écriture, finance, surveillance et administration.
3. **Migrations de rollback** : les fichiers de rollback doivent être explicitement distingués des migrations normales et ne doivent pas être appliqués par erreur.
4. **Configuration locale** : `supabase/config.toml` contient un JWT local de développement. Il ne doit pas être considéré comme un secret de production.
5. **Site/farm scope** : les migrations récentes ajoutent ou consolident des identifiants de site et de ferme. Il faut vérifier qu’aucune requête frontend ne contourne ces périmètres.

Aucune migration n’a été appliquée pendant cette tâche.

## 7. Bugs ou anomalies potentielles

Les éléments suivants sont des points à vérifier, et non des bugs confirmés :

| Priorité | Élément | Risque |
|---|---|---|
| Haute | Absence de `README.md` racine | Installation et reprise du projet moins accessibles |
| Haute | Secret JWT local dans la configuration versionnée | Mauvaise réutilisation possible en environnement non local |
| Moyenne | Grand nombre de migrations correctives | Drift ou ordre d’application incorrect |
| Moyenne | Nombreuses redirections de routes historiques | Risque de liens obsolètes ou d’états d’onglets incohérents |
| Moyenne | Activation du dashboard V2 par `localStorage` au chargement du module | Configuration non réactive après changement de valeur |
| Faible | Rapport et documentation dispersés à la racine | Difficulté à identifier la source de vérité |

La présence d’un problème doit être confirmée par les tests et les logs avant toute correction.

## 8. Tests et vérifications à exécuter

Les commandes suivantes sont recommandées dans un environnement local correctement configuré :

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
npx playwright test
```

Vérifications complémentaires :

- tests d’accès avec plusieurs rôles utilisateurs ;
- tests RLS par site et par module ;
- navigation sur les anciennes routes et les nouvelles routes ;
- affichage aux largeurs 375, 768 et 1440 px ;
- contraste WCAG AA et focus clavier ;
- absence de données fictives présentées comme réelles ;
- comportement lorsque Supabase est indisponible ou renvoie une erreur.

Ces commandes n’ont pas été exécutées par cette consultation distante du dépôt ; le statut de validation technique reste donc **NON EXÉCUTÉ**.

## 9. Recommandations priorisées

### Priorité 1 — sécurité et reproductibilité

- Décrire clairement la séparation local/staging/production.
- Vérifier qu’aucun secret de production n’est versionné.
- Auditer les politiques RLS avec des scénarios de profils et de sites.
- Documenter les variables d’environnement dans un README et un `.env.example` non sensible.

### Priorité 2 — qualité et exploitation

- Ajouter un `README.md` racine.
- Centraliser l’index des migrations et les procédures d’application.
- Exécuter et archiver les résultats de typecheck, lint, tests, build et E2E.
- Ajouter des tests de non-régression pour les redirections et permissions.

### Priorité 3 — maintenabilité

- Réduire la dispersion des rapports ou créer un index documentaire.
- Documenter les contrats de `DataContext`, `AuthContext` et des modules.
- Vérifier l’invalidation TanStack Query après chaque mutation métier.
- Clarifier la stratégie de remplacement du dashboard historique par le dashboard V2.

## 10. Statut final de cette étape

**Statut : PARTIEL / DOCUMENTAIRE**

- Consultation du dépôt : **PASS**
- Création de la mémoire projet : **PASS**
- Création du rapport : **PASS**
- Modification de `main` : **NON EFFECTUÉE**
- Migration Supabase distante : **NON EFFECTUÉE**
- Typecheck local : **NON EXÉCUTÉ**
- Lint local : **NON EXÉCUTÉ**
- Tests locaux : **NON EXÉCUTÉS**
- Tests E2E et captures : **NON EXÉCUTÉS**

## 11. Suite proposée

La prochaine étape peut être un audit approfondi, réalisé par priorité :

1. exécution et collecte des vérifications automatiques ;
2. audit de l’authentification et des autorisations ;
3. audit des migrations et politiques RLS ;
4. audit des flux finance/ventes/exploitation ;
5. audit visuel et accessibilité ;
6. corrections ciblées sur une branche dédiée, avec tests avant modification.
