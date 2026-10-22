# Questions en attente — Module Gestion

## À l'utilisateur (décisions requises avant toute modification)

1. **Lecture seule vs modifications** : La mission actuelle est en mode lecture seule stricte (aucun fichier de code, aucune migration, aucun commit). Souhaitez-vous que je passe en mode implémentation pour appliquer le PLAN.md, ou uniquement produire le rapport d'audit ?

2. **Colonnes site_id manquantes** : Souhaitez-vous ajouter `site_id` sur `fundings`, `transactions` et `documents` (nécessite une nouvelle migration SQL) ? Cela impacte le schéma de base de données.

3. **Portée du cloisonnement** : Le cloisonnement par site doit-il s'appliquer à tous les rôles (y compris administrateur/propriétaire avec vue globale possible) ou uniquement aux rôles opérationnels (gestionnaire, comptable, responsables) ?

4. **Tests** : Les tests de validation peuvent-ils être exécutés localement (vitest/playwright) sans modifier les données distantes, ou uniquement en lecture ?

## À l'équipe technique (vérifications à effectuer)

5. Le hook `usePaginatedQuery` / `useSimpleQuery` supporte-t-il le passage d'un filtre `site_id` dynamique basé sur l'utilisateur connecté ?

6. `AuthContext` expose-t-il déjà le `site_id` de l'utilisateur connecté, ou faut-il le récupérer via une requête `app_users` ?

7. Existe-t-il des tests existants couvrant les onglets Finance ou Ventes qui pourraient régresser ?

8. Les policies RLS de la migration 010 (`current_user_has_role`) et 019 (`current_user_site_id()`) sont-elles actives simultanément sur les mêmes tables (risque de récursion ou de conflit) ?

## Non-bloquantes pour le rapport

9. Le module « Projets » et « Fournisseurs » sont-ils dans le périmètre « Gestion » pour un audit ultérieur ?

10. La vue `v_funding_by_site` (migration 016) est-elle utilisée quelque part dans le code client ?
