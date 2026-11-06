# Test d'intégration : Journal d'Événements vide après création de dépense

Date : 2026-11-05 19:55
Branche : main
Commit : 9f03396
Auteur : Claude Code (agent)

## Contexte

La table `public.event_journal` existe (migration `20261105000000_create_event_journal.sql`).
Les modules métier (expenses, harvests) écrivent dans leurs propres tables mais **pas encore**
dans le journal. Il n'existe pas encore de trigger/fonction qui alimente `event_journal` lors de
la création d'une dépense.

Objectif de cette étape (Étape 2/3) : écrire un test d'intégration qui **prouve que le journal est
vide (0 ligne) après une création de dépense**. Ce test est marqué `test.fails` car on s'attend à
ce qu'il échoue — c'est la preuve que les triggers n'existent pas encore.

## Constats

### Fichier créé

`tests/integration/event-journal.test.mjs`

Le test suit les conventions du répertoire `tests/integration/` (réutilise `setup.mjs` pour
`adminClient`/`signInAs`/`authedClient` et `fixtures.mjs` pour `setupFixtures`/`teardownFixtures`).
Il :
1. Crée une ferme (`farms`) et lie le site de test à cette ferme (car `event_journal.farm_id`
   référence `public.farms(id)`).
2. Se connecte en tant qu'admin, crée une dépense (`amount: 1000`, `source_module` attendu
   `'finance'`, `event_type` attendu `'depense'`).
3. Vérifie que `event_journal` est vide pour ce `farm_id` — les assertions
   `journal.length === 1`, `event_type === 'depense'`, `source_module === 'finance'`,
   `amount === 1000` échouent car le journal contient 0 ligne.

### Adaptation par rapport au spec utilisateur

Le spec prévoyait `import { test, before, after } from 'vitest'`, mais vitest n'exporte pas
`before`/`after` (ce sont des hooks Mocha). Le codebase utilise `beforeAll`/`afterAll` dans les
tests existants (`helpers.test.mjs`, `rls-expenses.test.mjs`, `rls-fundings.test.mjs`). Le fichier
utilise donc `beforeAll`/`afterAll`.

### Blocage d'environnement (pré-existant, non lié à ce test)

Les tests d'intégration ne peuvent pas s'exécuter à ce jour contre le Supabase local :
- L'auth GoTrue retourne `invalid JWT: unable to parse or verify signature` même pour
  `adminClient.auth.admin.createUser` (service role).
- `signInWithPassword` retourne `Invalid login credentials`.
- Le même blocage affecte **tous** les tests d'intégration existants :
  `tests/integration/helpers.test.mjs` échoue de la même manière (6 tests skip, `JWT cryptographic
  operation failed`).

Tous les conteneurs Docker sont `Up`/`healthy` (db, auth, rest, kong…), donc le problème est de
configuration JWT de l'auth local, pas d'absence de service.

### Résultat du run

```
Test Files  1 failed (1)
      Tests  1 skipped (1)
```
Le test est skipped car le hook `beforeAll` lève avant l'exécution (erreur JWT à la création des
utilisateurs de test). Ce n'est pas l'échec métier attendu (`journal.length === 0`), mais un
échec d'infrastructure environnementale.

## Conclusion

Le fichier de test est **bien écrit** et suit les conventions du projet. Il ne peut pas être
validé à l'exécution tant que l'auth Supabase local n'est pas réparé (JET JWT du service role
inutilisable). Une fois l'environnement réparé, le test échouera comme prévu avec
`journal.length` égal à 0, prouvant que le journal n'est pas encore alimenté.

## Décisions humaines requises

- Réparer la configuration JWT de l'auth Supabase local (ou recréer l'instance locale) pour
  pouvoir exécuter les tests d'intégration.
- Confirmer que le test échoue pour la bonne raison (`journal.length === 0`) avant de passer à
  l'étape 3 (implémentation du trigger qui alimente le journal).

## Fichiers modifiés

- Créé : `tests/integration/event-journal.test.mjs`

## Prochaine étape

Réparer l'environnement d'auth Supabase local, puis relancer
`npx vitest run tests/integration/event-journal.test.mjs` pour confirmer l'échec attendu
(`journal.length` = 0), puis passer à l'étape 3 (implémentation du trigger).
