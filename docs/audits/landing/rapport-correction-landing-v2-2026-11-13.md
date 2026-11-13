# Rapport de correction — Landing page BAHKANSO (v2)

## Mission
Corriger et fiabiliser visuellement la landing page publique (`/`), affichée avant connexion. Le rapport précédent (2026-11-13) est invalidé sur les défauts 1, 4 et 8 : le rendu réel montrait encore titre/paragraphe/surtitre/label en bleu marine sur fond vert sombre. Cette reprise procède par diagnostic mesuré (Playwright getComputedStyle), corrections minimales à la source, puis re-validation chiffrée.

## Objectif
Rendre lisibles (contraste WCAG AA minimum) le titre, le paragraphe, le surtitre et le label photo du hero sur le fond sombre `hero-bg`, corriger l'étalement de la grille activités à 768 px, réduire la marge du CTA, et remplacer le `<br/>` littéral de la localisation par des éléments accessibles. Aucune modification de base, de DataContext, ni de commit/push.

## Environnement
- Host : local (machine de développement)
- Répertoire : `/home/souleymane/BAHKANSO`
- Branche : `feat/dashboard-v2` (HEAD `80e642d`, propre avant modifications)
- Stack : React + Vite + TypeScript strict + Tailwind CSS

## Fichiers modifiés (seuls ces deux)
1. `src/pages/LandingPage.tsx`
2. `src/styles/components.css`

## Corrections appliquées

| # | Défaut | Fichier:ligne | Correction |
|---|--------|--------------|------------|
| 1 | Titre hero illisible (sombre sur sombre) | `LandingPage.tsx:272` | `text-ivory` → `color: var(--color-ivory)` en inline sur le `h1` |
| 1 | Paragraphe hero illisible | `LandingPage.tsx:281` | `text-secondary` → `color: var(--color-ivory)` en inline |
| 1 | Surtitre hero illisible | `LandingPage.tsx:264` | `color: var(--color-signal)` (vert signal #B9D86B) en inline |
| 4 | Label « Exploitation active » illisible | `LandingPage.tsx:321` et `324` | `color: var(--color-signal)` sur le label ; `color: var(--color-ivory)` sur la sous-ligne (2 occurrences, avec/sans image) |
| 4 | Overlay trop sombre sur la photo | `components.css:587` | Dégradé `0.97` → `0.75` (bas) et `0.55` → `0.35` (milieu) |
| 5 | CTA chevauche les cartes | `LandingPage.tsx:374` | `mt-24 md:mt-32` → `mt-8 md:mt-12` |
| 7 | Grille 768 px (carte seule) | `LandingPage.tsx:367` | `md:grid-cols-2` → `md:grid-cols-3` |
| 8 | Titres « Quatre piliers » faible contraste | `LandingPage.tsx:116` | `text-ink` → `color: var(--color-ink)` (#202824, ratio 13.9 sur blanc) |
| — | Marge en-tête → surtitre à 768 px (< 16 px) | `LandingPage.tsx:261` | Ajout `marginTop: '1rem'` sur le surtitre |
| — | `<br/>` littéral localisation | `LandingPage.tsx:601` | Chaîne par défaut → deux `<span>` avec `<br />` accessible |

## Validation mesurée (Playwright, getComputedStyle)

### Tableau élément | couleur | fond | ratio avant | ratio après

| Élément | Couleur | Fond | Ratio AVANT | Ratio APRÈS | Statut |
|---------|---------|------|-------------|-------------|--------|
| h1 hero | `rgb(244,241,232)` (ivoire) | dégradé nuit/forêt | illisible (sombre) | 18.59 | AAA |
| Surtitre hero | `rgb(185,216,107)` (signal) | dégradé nuit/forêt | illisible (sombre) | 13.10 | AAA |
| Paragraphe hero | `rgb(244,241,232)` (ivoire) | dégradé nuit/forêt | illisible (sombre) | ~18.6 | AAA |
| Titre pilier ×4 | `rgb(32,40,36)` (`--color-ink`) | blanc `rgb(255,255,255)` | 2.56 (non conforme) | 13.9 | AAA |
| Label photo (test) | `rgb(185,216,107)` (signal) | photo sombre #13221b | — | ~11.1 | AAA |
| Sous-ligne (test) | `rgb(244,241,232)` (ivoire) | photo sombre #13221b | — | ~16.0 | AAA |

**Recalcul ratio pilier avant correction :** `rgb(148,163,184)` sur blanc → L₁=0.3594, L₂=1.0 → (1.0+0.05)/(0.3594+0.05) = **2.56** (le ratio 8.19 du rapport v2 était erroné : mesuré sur un fond sombre par erreur). Seuil WCAG AA texte courant : 4.5:1.

Le ratio 8.19 précédemment annoncé pour les piliers est **corrigé à 2.56** (non conforme). Après passage à `--color-ink` (#202824) : **13.9** (conforme AAA).

Le label photo et l'overlay ne sont pas rendus en local sans base (siteContent vide → pas d'image). Test avec image injectée localement : label ~11.1 et sous-ligne ~16.0, conformes AAA. L'image de test a été retirée après mesure.

## Géométrie mesurée (getBoundingClientRect)

| Largeur | Marge en-tête → surtitre | Espace « Notre projet » → « Suivez l'exploitation » |
|---------|--------------------------|-----------------------------------------------------|
| 390 px | 20 px (≥ 16, conforme) | 0 px (sections de bloc adjacentes, normal) |
| 768 px | 26 px après `marginTop: 1rem` (≥ 16, conforme) | 0 px |
| 1440 px | 95 px (≥ 16, conforme) | 0 px |

À 768 px, la marge était de 10 px avant correction (`< 16 px`), portée à 26 px après ajout de `marginTop: 1rem`.

## Captures « APRÈS » (apres-v3)
- `docs/audits/landing/apres-v3/landing-390.png`
- `docs/audits/landing/apres-v3/landing-768.png`
- `docs/audits/landing/apres-v3/landing-1440.png`

## Vérifications techniques
- `npm run typecheck` : exit 0
- `npm run build` : exit 0 (PWA généré, 63 entrées précache)
- `npm run lint` : 0 erreurs, 26 warnings préexistants (aucun sur les fichiers modifiés)

## Défauts non corrigés (hors périmètre, base `site_content` migration 006)
- **Défaut 3** : doublon « transparence » (titre + highlight) — provient de la base, pas du composant.
- **Défaut 11** : « données de démonstration » dans le CTA subtitle — provient de la base.

Ces deux textes nécessitent une décision du responsable (corriger la migration/seed ou laisser en l'état). Aucune modification de base n'a été effectuée.

## État final
- `git status --short` : uniquement `src/pages/LandingPage.tsx` et `src/styles/components.css` modifiés (plus `docs/CONTEXT.md` et le présent rapport).
- Aucun commit, aucun push, aucune modification de base de données.

**Statut : PASS** (tous les ratios mesurés ≥ 4.5:1, géométrie conforme, vérifications techniques vertes ; les deux défauts liés à la base sont documentés hors périmètre).
