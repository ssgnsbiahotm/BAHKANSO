---
name: sales-cards-display-fix
description: Corrigé la compression verticale des cartes de ventes (RotatingCard) dans SalesModule — theme-app.css forçait position: absolute + height: 100% sur .rc-face/.rc-inner, effondrant la hauteur des cartes. Remplacé par un empilement CSS Grid (content-based sizing).
metadata:
  type: project
  originSessionId: db9a42d8-bd78-4110-8459-cc09300f3bb5
  modified: 2026-11-06
---

# Sales cards display fix — cartes de ventes comprimées

**Fact :** `src/styles/theme-app.css` surchargeait `RotatingCard` via `.module-page .rc-inner { height: 100% }` et `.module-page .rc-face { position: absolute; height: 100% }`. Comme `.rc-container` n'a pas de hauteur définie, `height: 100%` s'effondre à ~0 (faces absoutes hors flux), écrasant les cartes et créant scrollbars internes + texte chevauché/tronqué dans "Gestion financière → Ventes → Ventes enregistrées".

**Correction apportée :**
- `.module-page .rc-inner` : `display: grid; grid-template-areas: "card";` (suppression `height: 100%`), `position: relative` conservé pour l'icône flip.
- `.module-page .rc-face` : `grid-area: card;` (suppression `position: absolute` + `height: 100%`), `backface-visibility` conservé.

**Contraintes respectées :** pas de logique métier/Auth/RLS/SQL, pas d'overflow: hidden masquant, pas d'overlay absolu sur faces, pas de réduction de police, pas de refactor CSS globale, pas de commit/push.

**Vérification :**
- `npx tsc --noEmit -p tsconfig.app.json` → exit 0
- `npm run build` → exit 0 (règle grid confirmée dans le CSS compilé)
- `npx vitest run src/components/ui/` → 14/14 passés
- `npx vitest run src/modules/Sales/SalesModule.test.tsx` → 3/3 passés

**Rapport :** `docs/reports/SALES_CARDS_DISPLAY_FIX.md`

**Limite documentée :** vérification visuelle réactive (1440×900, 1280×800, 768px, 390px) non exécutable car l'e2e `sales.spec.ts` échoue en amont sur le champ email (problème pré-existant, non modifié).

**Next :** aucun.
