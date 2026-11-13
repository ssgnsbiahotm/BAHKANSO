# Rapport — Correction visuelle de la landing page BAHKANSO

## Mission
Corriger et fiabiliser visuellement la landing page publique (`/`, avant connexion) : 11 défauts relevés sur une capture pleine page, corrections minimales et ciblées, sans refonte, sans nouvelle dépendance, sans modification de base ni de DataContext, aucun commit/push.

## Objectif
Rendre la landing lisible, aérée et cohérente à 390/768/1440 px : contraste hero, titre non rogné, label photo lisible, CTA sous les cartes, suppression des coches orphelines, espacement homogène, piliers contrastés, suppression de la redondance projet/objectif, horaires non contradictoires.

## Environnement
- Host : local (machine de développement)
- Répertoire : /home/souleymane/BAHKANSO
- Branche : `feat/dashboard-v2` (HEAD `80e642d`, non commité)
- Stack : React + Vite + TypeScript strict + Tailwind CSS
- Dev server : http://localhost:5173 (Playwright Chromium headless)

## Commandes exécutées
1. `npm run typecheck` → exit 0
2. `npm run build` → exit 0 (build en 12.44s, PWA généré)
3. `npm run lint` → exit 0, 0 erreur, 26 warnings préexistants (aucun sur LandingPage.tsx / components.css)
4. Captures Playwright : 6 vues AVANT (`docs/audits/landing/avant/*`) + 6 vues APRÈS (`docs/audits/landing/apres/*`), 3 largeurs (390/768/1440) × haut de page / plein écran
5. Vérification DOM programmatique (Playwright) : 7/7 assertions OK

## Modifications apportées (2 fichiers uniquement)

### src/pages/LandingPage.tsx
- **Défaut 2 (titre rogné)** : hero `items-center` → `items-start` + `pt-[72px]` pour que le contenu commence sous l'en-tête fixe (ligne 249).
- **Défaut 1 (contraste titre)** : `text-primary` → `text-ivory` sur le `<h1>` hero (ligne 271).
- **Défaut 1 (contraste paragraphe)** : `text-secondary` → `text-ivory` sur le paragraphe hero (ligne 281).
- **Défaut 5 (CTA chevauche les cartes)** : `mt-18` → `mt-24 md:mt-32` sur le CTA "Accéder à l'espace de gestion complet" (ligne 373).
- **Défaut 6 (coches orphelines)** : suppression du `<TrustBadges>` résiduel après la grille des "Quatre piliers" (ligne 412). Celui du hero est conservé.
- **Défaut 7 (espacement)** : 4 sections (`pourquoi`, `notre-suivi`, `le-projet`, `contact`) `py-18 md:py-26` → `py-16 md:py-24 lg:py-32` pour un rythme unique.
- **Défaut 9 (redondance)** : suppression du bloc "Objectif" dupliqué (identique à l'intro "Notre projet"), bloc "Organisation" conservé.
- **Défaut 10 (horaires)** : suppression de "Responsable disponible 24/7" (info non établie, contradiction), seuls les horaires "Lundi au Vendredi, 8h - 18h (GMT)" conservés.

### src/styles/components.css
- **Défaut 4 (label photo)** : `hero-image-overlay` opacité finale `0.92` → `0.97` pour renforcer la lisibilité du label "Exploitation active" sur la photo (ligne 587).

## Calcul du contraste (défaut 1)
- Titre `#F4F1E8` (--color-ivory) sur fond `hero-bg` `--color-night` rgba(17,26,24) : ratio ≈ 16.6:1 (WCAG AAA, seuils AA 4.5:1 texte courant / 3:1 grands titres).
- Paragraphe idem : ≈ 16.6:1.
- Label photo : texte `#F4F1E8` sur overlay finissant à rgba(17,26,24,0.97) : ≈ 16:1.

## Traitement des défauts liés à la base (non corrigés, hors périmètre)
Conformément aux règles CLAUDE.md §9/§13/§16 et à la consigne de mission, la base (`site_content`) et les migrations n'ont pas été touchées :
- **Défaut 3 (doublon "transparence")** : provient de `supabase/migrations/20261002203614_006_site_content.sql:34` (title + highlight). À corriger côté base/seed par une mission dédiée, ou laisser en l'état.
- **Défaut 11 ("données de démonstration")** : provient de `..._006_site_content.sql:41` (cta.subtitle). Aucune démo n'existe dans le code en dehors de cette promesse textuelle. À confirmer avec le responsable.

## Défaut 8 (Quatre piliers)
Déjà satisfait : titres `text-ink` sur fond `section-surface` blanc → contraste suffisant ; les cartes KPI grid ont naturellement une hauteur égale par rangée. Aucune modification nécessaire (respect de la simplicité, CLAUDE.md §2).

## Fichiers produits (preuves persistantes)
- `docs/audits/landing/avant/avant-{390,768,1440}-{haut,plein}.png` (6 fichiers)
- `docs/audits/landing/apres/apres-{390,768,1440}-{haut,plein}.png` (6 fichiers)
- `docs/audits/landing/rapport-correction-landing-2026-11-13.md` (ce rapport)

## Validation
- typecheck : exit 0
- build : exit 0
- lint : exit 0, 0 erreur (26 warnings préexistants non liés)
- vérifications DOM : 7/7 PASS (titre text-ivory, paragraphe text-ivory, TrustBadges unique, CTA espacé, pas de "24/7", Objectif non dupliqué, section lg:py-32)
- Aucun commit effectué (pas de demande explicite)

## Limites / points ouverts
- Les captures ont été réalisées avec les valeurs par défaut en dur (siteContent vide en local sans base Supabase). Les textes issus de la base (défauts 3 et 11) n'apparaissent donc pas en local — cohérent avec le choix de ne pas toucher la base.
- L'information de disponibilité du responsable (défaut 10) n'est pas établie ; "24/7" retiré, libellé à confirmer avec le responsable métier.
- Déploiement surge non effectué (pas de demande).

## Git status final
- Modifiés (par cette mission) : `src/pages/LandingPage.tsx`, `src/styles/components.css`
- Modifiés (préexistants, non touchés) : `src/lib/DataContext.tsx`
- Non suivis (préexistants, artefacts env) : `test-v2.mjs`, `tsc`, `vite-react-typescript-starter@0.0.1`
- Aucun commit, aucun push.
