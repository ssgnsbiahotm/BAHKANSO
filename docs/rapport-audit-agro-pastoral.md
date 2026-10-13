# Rapport d'audit de l'application agro-pastorale Bahkanso

**Date de l'audit :** 13 octobre 2026  
**Périmètre :** code et migrations présents dans le dépôt au moment de l'audit. Aucun accès à la base Supabase distante ni essai avec un compte utilisateur réel n'a été effectué.

## Synthèse

**Conclusion : non, l'application n'est pas prête à être utilisée comme outil opérationnel complet de gestion agro-pastorale.** Le dépôt contient une base fonctionnelle de produit : des écrans pour l'agriculture, l'élevage, les stocks et la finance, des modèles de données, des migrations Supabase et une authentification. Mais dans l'état du code examiné, la majorité des écrans métier sont inaccessibles ou ne reçoivent aucune donnée. Les règles d'accès SQL sont par ailleurs beaucoup moins restrictives que le contrôle affiché dans l'interface.

Le projet est donc plus proche d'un **prototype riche en écrans et d'un socle de schéma** que d'une application de gestion prête à être déployée sur une exploitation.

| Domaine évalué | État observé |
|---|---|
| Agriculture | Parcelles, campagnes, opérations et récoltes sont modélisées et affichées, mais leur écran ne comporte pas de flux de saisie métier et les données ne sont pas chargées. |
| Élevage | Animaux, lots et événements sont modélisés et présentés, sans chargement de données ni flux de tenue d'élevage opérationnel dans les écrans examinés. |
| Stock, trésorerie, dépenses et rapports | Plusieurs écrans et tables existent ; le fournisseur de données ne les alimente pas. Certaines écritures isolées sont présentes. |
| Authentification et accès | L'authentification et le profil applicatif existent, mais l'application n'autorise que le propriétaire à atteindre le produit, et les politiques SQL ne restreignent pas les opérations par rôle. |
| Qualité technique | Build, vérification TypeScript et tests unitaires ciblés réussis ; lint en échec. Cela valide la compilation, pas le fonctionnement métier de bout en bout. |

## Modules vérifiés

### 1. Comptes et exploitation

Le schéma prévoit une exploitation (`farms`), des utilisateurs applicatifs, des financeurs, des financements, des comptes, des fournisseurs, des dépenses et des documents. Les paramètres de l'exploitation et le profil utilisateur ont aussi des écrans.

**Limites :** le modèle est essentiellement mono-exploitation : les tables opérationnelles ne sont pas reliées par une clé `farm_id` permettant d'isoler plusieurs exploitations. Le rôle par défaut créé lors de l'inscription est `gestionnaire`, alors que la condition d'accès courante de l'application n'autorise que `propriétaire`. Le nouvel utilisateur créé avec ce rôle ne peut donc pas atteindre les écrans métier sans attribution et parcours d'habilitation supplémentaires.

### 2. Agriculture

Les migrations et types couvrent des sites, parcelles, cultures, campagnes, opérations culturales et récoltes. L'écran présente des onglets pour parcelles, campagnes, opérations et récoltes.

**Limites :** dans l'écran vérifié, ces onglets affichent des listes ; aucune saisie ou modification opérationnelle n'est implémentée. Les champs décrivent un suivi élémentaire, pas un itinéraire technique détaillé (par exemple dose d'intrant ou produit, interventions datées et traçabilité agronomique complète).

### 3. Élevage

Le modèle prévoit le suivi individuel ou par lot, avec espèce, race, poids, valeur, localisation et événements tels que vaccination, traitement, pesée, reproduction et mortalité.

**Limites :** l'écran consulté est un écran de consultation et ne propose pas de flux de tenue du cheptel. Le modèle ne suffit pas, à lui seul, à établir le suivi approfondi des soins et de la production : détails vétérinaires structurés, généalogie, périodes de retrait, rations/alimentation et productions (lait, œufs ou gain de poids) ne sont pas présents dans les entités examinées.

### 4. Stocks et approvisionnements

Le schéma prévoit des articles, mouvements et inventaires physiques ; un module fournisseurs existe également.

**Limites :** les collections correspondantes ne sont pas chargées par le contexte de données. Le stock affiché ne peut donc pas constituer un registre fiable des entrées, consommations, transferts, pertes et inventaires sur la version examinée.

### 5. Finance, dépenses et recettes

Le schéma couvre les financements, comptes, transactions, dépenses, projets, justificatifs et récoltes. Des opérations d'écriture existent notamment pour les dépenses, fournisseurs et projets.

**Limites :** seul le chargement des financements est raccordé au contexte de données. Les modules finance dépendant des comptes, transactions, dépenses, projets ou récoltes voient des collections vides. Le rafraîchissement du contexte ne recharge que les financements ; après une écriture, les listes métier ne sont donc pas réconciliées par ce mécanisme. Le module recettes dérive ses résultats de récoltes et transactions, qui ne sont pas chargées.

### 6. Documents, alertes et rapports

Les documents peuvent être téléversés dans le bucket `app-assets`; les alertes et rapports ont des écrans.

**Limites :** le bucket autorise la lecture publique de tous ses objets. C'est acceptable seulement si aucun justificatif ou document confidentiel n'y est stocké ; or le module documents gère des pièces telles que factures et justificatifs. Le PDF des rapports est explicitement indisponible ; le CSV est proposé. Les données nécessaires aux rapports ne sont pas chargées actuellement.

## Constats prioritaires

### P1 — Accès utilisateur incompatible avec les rôles annoncés

Le contrôle d'accès de l'application ne laisse poursuivre que le rôle `propriétaire` ; son interface est ensuite réduite au profil et aux financements en lecture seule. Tous les autres rôles, y compris les responsables agricoles et d'élevage, voient un message indiquant que leur périmètre n'est pas configuré et ne peuvent pas ouvrir les modules correspondants. Cela contredit l'objectif d'utilisation opérationnelle par les équipes de terrain.

Voir [App.tsx](../src/App.tsx) (notamment autour des lignes 147–183) et [access.ts](../src/lib/access.ts) (autour des lignes 33–43).

### P1 — Les écrans ne sont pas raccordés à leurs données

Le contexte [DataContext.tsx](../src/lib/DataContext.tsx) récupère les financements uniquement. Les autres champs fournis par ce contexte — exploitation, dépenses, parcelles, campagnes, animaux, stocks, projets, documents, alertes, etc. — sont initialisés à `null`, `[]` ou `{}` (lignes 117–148). La fonction `refresh` ne rafraîchit que les financements. La majorité des écrans s'appuie pourtant sur ces collections.

Résultat : les écrans peuvent paraître présents dans le code sans fournir un registre métier persistant et consultable. La présence de quelques opérations directes d'écriture ne corrige pas ce problème de lecture et de rafraîchissement.

### P1 — RLS autorise toutes les opérations à tout utilisateur authentifié

La migration d'authentification remplace les anciennes politiques et autorise `SELECT`, `INSERT`, `UPDATE` et `DELETE` avec des prédicats `USING (true)` / `WITH CHECK (true)` pour le rôle `authenticated`. Cela inclut entre autres les profils utilisateurs et les journaux d'audit. Les rôles de l'application ne sont donc pas appliqués au niveau de la base : un contrôle visuel dans React ne constitue pas une restriction équivalente pour les appels directs à l'API Supabase.

Ce choix est décrit comme celui d'une application mono-exploitation où tout le personnel partage toutes les données, mais il ne met pas en œuvre des droits différents par rôle. Il permet notamment à un utilisateur authentifié d'altérer des données que l'interface devrait réserver à un responsable ou à un administrateur.

Voir [la migration RLS](../supabase/migrations/20261004122416_007_auth_and_rls_tightening.sql.sql), en particulier les politiques autour des lignes 74–83 et 236–239.

### P1 — Les documents téléversés sont accessibles publiquement

La politique de stockage autorise `anon` et `authenticated` à lire tous les objets du bucket `app-assets`, et l'écran documents y dépose des fichiers puis génère des URL publiques. Si ce bucket contient des factures, contrats, reçus ou autres pièces privées, toute personne disposant de l'URL peut les consulter sans authentification.

Voir [la migration de stockage](../supabase/migrations/20261005195221_009_storage_policies.sql.sql) et [Documents.tsx](../src/pages/Documents.tsx) (autour des lignes 73–78).

### P2 — Couverture métier agro-pastorale encore élémentaire

Le périmètre agricole et animalier couvre des objets fondamentaux, mais pas encore plusieurs pratiques nécessaires à un suivi de production complet : itinéraires techniques détaillés, pâturages et rotations, alimentation, production animale, généalogie et suivi sanitaire structuré. Les besoins précis doivent être confirmés avec les utilisateurs de l'exploitation avant d'étendre le modèle.

### P2 — Rapports incomplets

L'export PDF est désactivé dans l'écran rapports. Les résultats sont en outre calculés côté interface à partir de collections qui ne sont pas alimentées. Ces rapports ne doivent pas être utilisés comme source de décision ou de rapprochement tant que les données ne sont pas reliées et contrôlées.

## Vérifications exécutées

| Vérification | Résultat |
|---|---|
| `npm run test:unit` | Réussi : 25 tests, 0 échec. Les tests couvrent principalement les états d'accès, la gestion des réponses tardives et les garde-fous CI/schema ; ils ne valident pas les parcours complets des modules agricoles et d'élevage. |
| `npm run typecheck` | Réussi. |
| `npm run build` | Réussi. Un avertissement PostCSS indique qu'un plugin ne transmet pas l'option `from`. |
| `npm run lint` | Échec : `Globe` est importé mais inutilisé dans [Sidebar.tsx](../src/components/layout/Sidebar.tsx), ligne 5. |

La documentation d'autorisation du dépôt précise que les migrations candidates 010/011 ont été testées sur PostgreSQL local isolé seulement et qu'aucune validation de la base distante n'a été faite. Il est donc impossible de conclure, depuis cette seule revue, que le schéma, les droits et les migrations effectivement déployés correspondent au dépôt. Voir [authorization-contract.md](./authorization-contract.md).

## Recommandations de remise à niveau

1. **Définir la matrice d'habilitation par rôle et par action**, puis faire respecter les mêmes règles côté base (RLS) et côté application. Vérifier particulièrement la création/modification des profils et l'immutabilité des journaux d'audit.
2. **Séparer les fichiers publics des pièces privées.** Déplacer les justificatifs dans un bucket privé avec des règles d'accès par utilisateur/exploitation ; réserver le bucket public aux logos et images destinés à l'être.
3. **Raccorder les données de chaque module** : chargement initial, états d'erreur, pagination si nécessaire, mutations, rafraîchissement et invalidation après chaque écriture. Ne pas exposer un écran opérationnel sur des collections fictivement vides.
4. **Implémenter les parcours de saisie de terrain**, en priorité parcelles/campagnes/opérations/récoltes et animaux/lots/événements, puis stocks/mouvements. Valider les champs, unités, références et règles de cohérence en base.
5. **Faire valider le modèle par les utilisateurs** pour compléter les dimensions spécifiques à l'exploitation : troupeau, santé, reproduction, alimentation, pâturages, cultures, intrants, ventes et conditions de connectivité terrain.
6. **Compléter les rapports et rapprochements** avec données réelles, export attendu, filtres de période non figés et tests de cohérence financière et de production.
7. **Avant production**, tester les migrations sur un environnement contrôlé, vérifier les politiques et objets réellement déployés, exécuter les tests d'intégration Auth/API/Storage, corriger le lint, et faire une recette avec des utilisateurs de chaque rôle.

## Verdict final

**Socle technique prometteur, mais application métier non prête.** Les modules sont reconnaissables et le schéma couvre une partie importante du vocabulaire agro-pastoral, mais les blocages d'accès, l'absence de chargement de presque toutes les données et les politiques d'accès trop larges empêchent de considérer l'application comme une solution fiable ou sûre de gestion d'exploitation dans son état observé.
