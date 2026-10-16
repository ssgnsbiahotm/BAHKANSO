# DOCUMENT DE REPRISE - AUDIT BAHKANSO

## 1. ÉTAT GIT

- **Branche** : `audit-interactions`
- **Référence avant audit** : `master`, commit `7dbb229` ("État initial avant audit complet")
- **Commit ayant laissé DocumentManage tronqué** : `1ad5f87` ("feat: appliquer hook useAsyncAction à DocumentManage.tsx pour factoriser le pattern try/await/toast")
- **Commit de restauration** : `f277dff` ("fix: restaurer DocumentManage tronqué lors de la refactorisation")
- **État de DocumentManage** :
  - Identique à `master` (commit `df7e5c7f08fec246a3e3fda8a070cbca711fdc9f`)
  - Identique à `HEAD` (commit actuel de la branche)
  - Vérifié par : `git diff master -- src/pages/DocumentManage.tsx` (aucune différence) et `git diff HEAD -- src/pages/DocumentManage.tsx` (aucune différence)
- **Fichiers suivis modifiés** : Aucun selon le dernier contrôle (`git status --short` ne montre aucun fichier suivi modifié)
- **Rapports et sauvegardes non suivis** : Tous conservés (fichiers commençant par `.` ou contenant `backup` dans leur nom)

## 2. PORTÉE DE LA RÉPARATION

- **Fichier complet rétabli** : Oui, `src/pages/DocumentManage.tsx` a été rétabli à son état complet de 679 lignes
- **Utilisation de useAsyncAction** : DocumentManage **n'utilise plus** le hook `useAsyncAction` - toutes les modifications liées à ce hook ont été supprimées lors de la restauration
- **Preuve de fonctionnement** : La restauration **ne prouve pas** le fonctionnement de tous les parcours du fichier - elle confirme seulement que le fichier est syntactiquement correct et identique à la version de référence
- **Ancien diff défectueux** : **Non réappliqué** et ne le sera pas conformément aux instructions

## 3. CONTRÔLES TECHNIQUES

### Dernier typecheck
```
Commande : npm run typecheck
Code de sortie : 0 (succès)
Sortie : ok
```

### Dernier build
```
Commande : npm run build
Code de sortie : 0 (succès)
Sortie :
vite v5.4.8 building for production...
transforming...
✓ 1797 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.72 kB │ gzip:   0.39 kB
dist/assets/index-B_0hOxx4.css   47.07 kB │ gzip:   8.08 kB
dist/assets/index-BsALgAc4.js   838.02 kB │ gzip: 210.72 kB
✓ built in 5.21s
node_modules/zod/v4/core/util.js (400:0): A comment
"// Wrapped in a `@__PURE__` IIFE: esbuild never tree-shakes a top-level initializer that contains a member access on `Number`, so the bare object literal survived into every bundle."
in "node_modules/zod/v4/core/util.js" contains an annotation that Rollup cannot interpret due to the position of the comment. The comment will be removed to avoid issues.
node_modules/zod/v4/core/regexes.js (74:0): A comment
"/** Anchors a pattern source. The interpolation lives here rather than at the call site because
 * esbuild will not drop a `@__PURE__` call whose own argument interpolates a variable, but it
 * will drop `anchor(dateSource)`. Keeping it inline pinned `date` into every bundle. */"
in "node_modules/zod/v4/core/regexes.js" contains an annotation that Rollup cannot interpret due to the position of the comment. The comment will be removed to avoid issues.
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit
```
**Qualification des avertissements** : Non bloquants (lisiblement liés à la taille des chunks et à des commentaires dans les nœuds modules zod, pas à notre code application)

## 4. INCIDENT PRIORITAIRE ENCORE OUVERT

**Problème confirmé** : HTTP 400 répétés sur la requête Supabase :
```
expenses
?select=*,supplier:suppliers(*),funder:funders(*)
&order=date.desc
```

**Prochaine action planifiée** (à exécuter après accord) :
1. Récupérer le code, le message, les details et le hint de la réponse Supabase
2. Localiser la requête correspondant à cet appel dans le codebase
3. Expliquer l'origine des répétitions (probablement liées à des mécanismes de retry ou de refetch)
4. **Ne pas modifier** les relations ou la sécurité sans diagnostic complet préalable

## 5. AUTRES POINTS À AUDITER (liste pour reprise future)

- **Chargement des financeurs dans FundingCreate** : Vérifier le mécanisme de chargement et les états de chargement
- **Gestion des dates vides ou invalides** : Auditer la validation et la gestion des cas limites pour les champs date
- **Contrat d’erreur de useAsyncAction et useValidatedForm** : Examiner la cohérence des interfaces et de la propagation des erreurs
- **Protection contre les soumissions concurrentes** : Vérifier l'absence de mécanismes de debounce ou de verrouillage lors des soumissions de formulaire
- **Différence entre écriture réussie et rafraîchissement échoué** : Analyser les cas où l'écriture réussit mais le rafraîchissement des données échoue
- **État actuel du lint** : Surveiller l'évolution du nombre d'erreurs ESLint
- **Absence éventuelle de tests automatisés** : Identifier les manques en couverture de tests unitaires ou d'intégration
- **Refonte Fonctionnalités du site public** : Tâche distincte nécessitant une validation séparée, non incluse dans cet audit

## 6. RÈGLES DE REPRISE CONFIRMÉES

- **Audit uniquement tant que les corrections ne sont pas validées** : Continuer en mode audit seulement, pas d'application de corrections sans accord explicite
- **Distinction des niveaux de validation** :
  - Lecture (analyse statique)
  - Compilation (typecheck/build)
  - Navigateur (exécution réelle)
  - Persistance (vérification de sauvegarde/chargement)
- **Aucune écriture sur les données réelles sans accord** : Respecter scrupuleusement cette règle de sécurité
- **Aucune migration, modification de permissions ou publication sans accord** : Toutes les modifications systèmes nécessitent une validation préalable
- **Aucun reset, nettoyage global ou suppression de sauvegarde** : Préserver l'intégrité du dépôt et de l'historique
- **Aucun git add . pour un commit ciblé** : Utiliser des ajouts de fichiers précis et ciblés

**Chemin du document de reprise** : `/home/ssgnsa/projects/project-bahkanso/DOCUMENT_REPRISE.md`

**Consigne reçue et comprise** : Je n'ai pas créé de commit supplémentaire pour ce document sans accord, comme instructed.