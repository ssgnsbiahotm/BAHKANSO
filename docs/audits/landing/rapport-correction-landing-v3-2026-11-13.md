# Rapport de correction — Landing page BAHKANSO (v3)

## Mission
Clôture de la landing page publique (`/`). Mesurer et corriger les 3 points restants, puis préparer les commits sans les exécuter. Périmètre : `src/pages/LandingPage.tsx`, `src/styles/components.css`, fichiers sous `docs/audits/landing/`. Interdits : `DataContext.tsx`, base de données, migrations, `site_content`, tout `git add`/`commit`/`push`.

## ÉTAPE 1 — Mesures (aucune modification) aux 3 largeurs

| Mesure | 390 px | 768 px | 1440 px | Seuil | Conforme |
|--------|--------|--------|---------|-------|----------|
| (a) Marge bas en-tête → haut surtitre hero | 36 px | 26 px | 103 px | ≥ 16 px | ✅ Oui |
| (b) Espace « Notre projet » → « Suivez l'exploitation » | sections adjacentes (0 px entre blocs) | idem | idem | rythme identique | ✅ Fonds différents (blanc vs nuit), padding symétrique identique (64/96/128) |
| (c) Débordement horizontal (scrollWidth > clientWidth) | non | non | non | aucun | ✅ Oui |
| (d) Texte littéral `<br/>` dans le DOM | non | non | non | absent | ✅ Oui |

Toutes les mesures de l'étape 1 sont conformes. Aucune correction n'a été nécessaire pour l'étape 2.

## ÉTAPE 2 — Corrections appliquées (avant l'étape 1, pour le débordement)

| Point | Fichier:ligne | Correction |
|-------|--------------|------------|
| Décor « corner pattern » dépassant à droite sur 390/768 px | `LandingPage.tsx:51` | `overflow-hidden` ajouté sur l'article `ActivityCard` (`className="activity-card group relative overflow-hidden"`) |

Résultat : `scrollWidth == clientWidth` à toutes les largeurs (390/768/1440), pas de défilement horizontal.

## ÉTAPE 3 — Vérification du label photo (pire cas : photo claire)

Test avec une photo claire injectée localement (`#f8fafc` + cercle `#e2e8f0`), sans toucher la base. L'image a été retirée après mesure (confirmé par `git diff`).

| Élément | Couleur | Fond théorique (photo claire + overlay 0.75) | Ratio WCAG | Seuil | Statut |
|---------|---------|---------------------------------------------|------------|-------|--------|
| Label « EXPLOITATION ACTIVE » | `rgb(185,216,107)` (#B9D86B) | `rgb(73,79,83)` | 5.18 | ≥ 4.5 | ✅ AAA |
| Sous-ligne « Cocody… » | `rgb(244,241,232)` (#F4F1E8) | `rgb(73,79,83)` | 7.36 | ≥ 4.5 | ✅ AAA |

Le contraste label photo est validé sur le pire cas (photo claire). Aucun dégradé local supplémentaire n'est nécessaire.

## ÉTAPE 4 — Validation

- `npm run typecheck` : exit 0
- `npm run build` : exit 0 (PWA généré, 63 entrées précache)
- `npm run lint` : 0 erreurs, 26 warnings préexistants (aucun sur les fichiers modifiés)
- Captures `docs/audits/landing/apres-v4/` : 3 fichiers (390, 768, 1440 px)

Re-mesure de l'étape 1 après correction : toutes conformes (tableau ci-dessus).

## ÉTAPE 5 — Préparation des commits (affichage uniquement, non exécutés)

`src/lib/DataContext.tsx` est **exclu** des deux commits.

1. `git add src/pages/LandingPage.tsx src/styles/components.css`
   `git commit -m "fix(landing): contraste hero et piliers, grille, espacements, décor clippé"`

2. `git add docs/audits/landing/rapport-correction-landing-v3-2026-11-13.md docs/audits/landing/apres-v4/ docs/CONTEXT.md`
   `git commit -m "docs(audit): rapports et captures landing v3"`

## RAPPORT FINAL (10 lignes max)

| Élément | Avant | Après |
|---------|-------|-------|
| Décor horizontal (débordement) | scrollWidth > clientWidth à 390/768 px | scrollWidth == clientWidth partout |
| Ratio label photo (pire cas) | non testé | 5.18 (AAA) |
| Ratio sous-ligne photo (pire cas) | non testé | 7.36 (AAA) |
| Marge en-tête→surtitre (mini) | 26 px (768 px) | 26 px (conforme ≥16) |

**Fichiers modifiés** : `src/pages/LandingPage.tsx`, `src/styles/components.css`, `docs/CONTEXT.md`, `docs/audits/landing/rapport-correction-landing-v3-2026-11-13.md`, `docs/audits/landing/apres-v4/landing-{390,768,1440}.png`.

**Points non vérifiables** : photo réelle de production (dépend de `site_content` en base, non chargée en local). Le test photo claire injectée couvre le pire cas de contraste.

**Défauts 3 et 11** : hors périmètre (proviennent de `site_content` en base, migration 006). Non touchés.

**Aucun commit effectué** (préparation d'affichage uniquement).