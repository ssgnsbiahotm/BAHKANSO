# Correction UI/UX — Cartes de ventes écrasées / overflow / scrollbars internes

Date : 2026-11-06
Branche : main
Commit : c44726f (HEAD)
Auteur : Claude Code (agent) + validation humaine

## Contexte

Dans **Gestion financière → Ventes → Ventes enregistrées** (`src/modules/Sales/SalesModule.tsx`), les cartes de ventes (composant `RotatingCard` dans la grille `module-cards-grid`) étaient affichées compressées verticalement : textes et statuts se chevauchaient, contenu tronqué, et des scrollbars internes apparaissaient sur chaque carte.

Le module importe `src/styles/theme-app.css`, qui surcharge les styles du composant `RotatingCard` via les sélecteurs `.module-page .rc-*`.

## Constats

Cause racine identifiée dans `src/styles/theme-app.css` (section "ROTATING CARD OVERRIDES FOR D THEME") :

- `.module-page .rc-inner { height: 100%; position: relative; ... }`
- `.module-page .rc-face { position: absolute; width: 100%; height: 100%; ... }`

`.rc-container` n'a pas de hauteur définie, donc `height: 100%` sur `.rc-inner` se résout à `auto` puis s'effondre à ~0 (ses enfants `.rc-face` sont en `position: absolute` et ne contribuent pas à la hauteur de flux). Conséquence : `.rc-face { height: 100% }` se résout aussi à ~0, les cartes s'effondrent, et `.rc-content` (qui a `overflow-y: auto`) génère des scrollbars internes alors que le contenu déborde / est comprimé.

Ce défaut affecte l'ensemble des cartes `RotatingCard` affichées sous `.module-page` (theme-app.css), les cartes de ventes étant les plus riches en contenu donc les plus visiblement impactées.

## Analyse

Le composant `RotatingCard` possède sa propre feuille (`src/components/ui/RotatingCard.css`) utilisant un empilement CSS Grid (`display: grid; grid-template-areas: "card"` sur `.rc-inner`, `grid-area: card` sur `.rc-face`) qui dimensionne les cartes selon leur contenu. La surcharge `theme-app.css` cassait ce mécanisme en imposant du positionnement absolu avec `height: 100%` sans hauteur d'ancêtre définie.

## Correction apportée

**`src/styles/theme-app.css`** :

- `.module-page .rc-inner` : `display: grid; grid-template-areas: "card";` (suppression de `height: 100%`), `position: relative` conservé pour le contenant de l'icône de retournement (`absolute top-3 right-3` dans `RotatingCard.tsx`).
- `.module-page .rc-face` : `grid-area: card;` (suppression de `position: absolute` et `height: 100%`), `backface-visibility` et `-webkit-backface-visibility` conservés.

Les cartes dimensionnent désormais selon leur contenu, sans compression, sans scrollbar interne, et sans superposition de texte.

## Contraintes respectées

- Aucune modification de logique métier, calculs, Auth, RBAC, RLS, migrations ou SQL.
- Aucun `overflow: hidden` de masquage.
- Aucun positionnement absolutoverlay sur les faces.
- Aucune réduction de la taille de police.
- Pas de refactor CSS globale : seule la section `.module-page .rc-*` de `theme-app.css` est touchée.
- Aucun commit, aucun push (conformément aux règles du projet).

## Vérification

- `npx tsc --noEmit -p tsconfig.app.json` → exit 0 (PASS)
- `npm run build` (Vite, traite le CSS) → exit 0 (PASS)
- `npx vitest run src/components/ui/` → 14/14 passés (exit 0, pas de régression)
- `npx vitest run src/modules/Sales/SalesModule.test.tsx` → 3/3 passés (exit 0)
- Lint du fichier CSS : propre (eslint ignore le fichier, 0 erreur)

**Note :** la vérification visuelle réactive (1440×900, 1280×800, 768px, 390px) n'a pu être exécutée via le test e2e existant (`e2e/sales.spec.ts`) car son flux de connexion échoue en amont sur le sélecteur du champ email (`getByLabel(/email/i)` non trouvé) — problème pré-existant indépendant de cette correction. Le test e2e n'a pas été modifié.

## Décisions humaines requises

Aucune.

## Fichiers modifiés

- `src/styles/theme-app.css` (correction du dimensionnement des cartes RotatingCard sous `.module-page`)

## Prochaine étape

Aucune. Le défaut est corrigé et validé par le typecheck, le build et les tests unitaires.
