# Optimisation des assets et du chargement initial

Date : 2026-11-08 08:00
Branche : main
Commit : HEAD
Auteur : Claude Code (agent)

## Contexte

Mission de diagnostic du chargement initial (première page, `/` publique, LandingPage). Lecture seule — aucune modification de code. L'objectif est de hiérarchifier par impact réel ce qui ralentit le premier affichage, preuves à l'appui. Aucun chiffre n'est inventé : les valeurs proviennent de `npm run build` (Vite 5.4.8) et de la lecture des sources. Aucune mesure Lighthouse / Playwright n'a été effectuée (outils non disponibles ou non exécutés dans le cadre de cette mission) — ce qui est non mesuré est indiqué comme tel.

## Environnement

- Stack : React 18.3, Vite 5.4.2, TypeScript 5.5.3, TanStack React Query v5, Supabase JS v2.119, react-router-dom v7, Tailwind 3.4
- Build : `vite build && cp dist/index.html dist/200.html` — minify esbuild, cssCodeSplit: true, manualChunks configurés
- PWA : VitePWA + workbox, 62 entrées précachées (~1,47 Mo), runtime caching Supabase + Google Fonts
- Page publique : `/` → LandingPage (lazy via React.lazy + Suspense, fallback PageSkeleton)
- Build exécuté avec succès (exit 0)

## Constats

### 1. Inventaire des images (public/)

| Fichier | Poids | Dimensions | Usage |
|---|---|---|---|
| `public/logo.svg` | 433 B | SVG (texte) | Favicon `index.html:5`, logo header/footer LandingPage (via `farm.logo_url` dynamique) |
| `public/images/hero-projet.jpg` | 221 181 B (~216 KiB) | 1080×663, JPEG baseline | Image héro LandingPage (`heroImage` depuis `siteContent['hero']`, `LandingPage.tsx:310`) |

Preuves :
- `file public/images/hero-projet.jpg` → JPEG, 1080×663, 8-bit sRGB, 221181 octets
- `ls -la public/` → logo.svg 433 octets, images/hero-projet.jpg 221181 octets
- `LandingPage.tsx:310` — `OptimizedImage src={heroImage}` dans la colonne visuelle (5/12, `hidden lg:block`)
- `OptimizedImage.tsx` — `loading='lazy'`, `decoding='async'` par défaut

### 2. Bundle de production (dist/assets/)

D'après `npm run build` (exit 0, 6.86s, 1862 modules transformés) :

**Chunks vendors (grossiers, non partagés par page) :**

| Chunk | Taille | Gzip | Contenu |
|---|---|---|---|
| `vendor-react-BgVDZQFM.js` | 235,21 kB | 76,89 kB | react, react-dom, react-router-dom |
| `vendor-supabase-DlNZ_Rpy.js` | 228,74 kB | 59,50 kB | @supabase/supabase-js |
| `vendor-data-itS6fd7s.js` | 129,39 kB | 37,41 kB | @tanstack/react-query, zod |
| `vendor-animation-DYOGTEzH.js` | 90,44 kB | 33,34 kB | gsap, lenis |
| `vendor-ui-DpYWep_E.js` | 38,70 kB | 7,57 kB | lucide-react |

**Chunks d'application (partagés / multi-pages) :**

| Chunk | Taille | Gzip | Rôle |
|---|---|---|---|
| `index-C2_399VQ.js` | 105,18 kB | 34,49 kB | Entrée principale |
| `index-DNYTjhFS.js` | 104,81 kB | 19,95 kB | Entrée secondaire |
| `Configuration-DIoeErpf.js` | 41,95 kB | 10,81 kB | Configuration |
| `Dashboard-CdudhqD-.js` | 27,44 kB | 8,08 kB | Dashboard |
| `LandingPage-D3MUmgQL.js` | 25,24 kB | 6,32 kB | Landing page (publique) |

**CSS :**

| Chunk | Taille | Gzip |
|---|---|---|
| `index-DtMq_mPk.css` | 88,80 kB | 15,25 kB |
| `components-CnryzG4N.css` | 27,53 kB | 4,61 kB |
| `theme-app-CYGvlnJS.css` | 11,21 kB | 2,46 kB |
| `RotatingCard-BbuTIAVm.css` | 1,32 kB | 0,60 kB |
| `LoginPage-B2JShkUM.css` | 1,45 kB | 0,54 kB |

**PWA :**

| Fichier | Taille |
|---|---|
| `sw.js` | 4,7 K |
| `workbox-07e28819.js` | 22,2 K |
| Précache : 62 entrées, ~1 469 KiB total |

### 3. Fonts (Google Fonts, `index.html:9-14`)

Trois familles chargées en bloc sur toutes les pages (incluant `/` publique) :

```
https://fonts.googleapis.com/css2?
  family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&
  family=Inter:wght@400;500;600;700&
  family=Geist+Mono:wght@400;500&
  display=swap
```

- 4 poids pour Fraunces (éditorial, titres héro)
- 4 poids pour Inter (UI, corps)
- 2 poids pour Geist Mono (monospace)
- `<link rel="preconnect">` sur fonts.googleapis.com et fonts.gstatic.com (`index.html:9-10`)
- PWA met en cache les polices (StaleWhileRevalidate pour stylesheets, CacheFirst pour webfonts, 1 an)

### 4. CSS critiques

`src/index.css` importe (dans l'ordre) : tokens.css, theme-editorial.css, theme-app.css, components.css, puis `@tailwind base/components/utilities`.

- `theme-editorial.css` (thème clair, pages publiques) — 1,5 K source
- `theme-app.css` (thème sombre, app authentifiée) — 14,4 K source
- `components.css` — 36,2 K source
- `tokens.css` — 4,6 K source

### 5. Chargement des données (DataProvider)

`DataProvider` charge les données via `DataContext.loadAll()` au montage (toutes les tables). Le chargement par module (`loadModule`) a été implémenté pour les pages de l'app authentifiée, mais la page publique `/` ne passe pas par ce chemin (pas de `useData` avec `loadModule` sur LandingPage — elle lit `farm` et `siteContent` directement).

### 6. Service worker

`registerSW({ immediate: true })` dans `src/main.tsx` — le SW est enregistré immédiatement, pas à l'idle. Précache 62 entrées (~1,47 Mo) dès le premier chargement.

## Analyse (hiérarchisation par impact)

| # | Facteur | Impact estimé | Preuve | Mesuré |
|---|---|---|---|---|
| 1 | `vendor-react` (235 kB / 77 kB gzip) | Élevé | `dist/assets/vendor-react-BgVDZQFM.js` | Oui (build) |
| 2 | `vendor-supabase` (229 kB / 60 kB gzip) | Élevé | `dist/assets/vendor-supabase-DlNZ_Rpy.js` | Oui (build) |
| 3 | `vendor-data` (129 kB / 37 kB gzip) | Élevé | `dist/assets/vendor-data-itS6fd7s.js` | Oui (build) |
| 4 | `index-DtMq_mPk.css` (88,8 kB / 15 kB gzip) | Moyen-élevé | `dist/assets/index-DtMq_mPk.css` | Oui (build) |
| 5 | `vendor-animation` (90 kB / 33 kB gzip) | Moyen | `dist/assets/vendor-animation-DYOGTEzH.js` | Oui (build) |
| 6 | `hero-projet.jpg` (221 kB, 1080×663) | Moyen (si non lazy) | `public/images/hero-projet.jpg`, `OptimizedImage loading='lazy'` | Oui (taille fichier) |
| 7 | Google Fonts (3 familles, 10 poids) | Moyen (bloquant render si non cache) | `index.html:12`, preconnect présent | Non mesuré |
| 8 | `vendor-ui` lucide-react (38,7 kB) | Faible-moyen | `dist/assets/vendor-ui-DpYWep_E.js` | Oui (build) |
| 9 | SW immédiat + précache 62 entrées | Faible (premiere visite) | `src/main.tsx registerSW immediate: true` | Oui (code) |
| 10 | `logo.svg` (433 B) | Negligeable | `public/logo.svg` | Oui (taille fichier) |

### Points de blocage potentiels pour le premier affichage

1. **CSS monolithe `index.css`** (88,8 kB brut) : importé en une fois dans `index.html` via le module script, bloque le premier rendu tant qu'il n'est pas chargé et parsé. `cssCodeSplit: true` est actif mais le chunk `index-DtMq_mPk.css` reste le plus gros (88,8 kB).

2. **Google Fonts en bloc sur toutes les pages** : même si `display=swap` évite le blocage texte, le stylesheet et les webfonts doivent être fetchés. Le preconnect atténue mais ne supprime pas la latence de connexion TLS.

3. **Chunks vendors non fractionnés par route** : `vendor-react`, `vendor-supabase`, `vendor-data` sont chargés quelle que soit la page visitée, y compris la page publique `/` qui n'a pas besoin de Supabase ni de React Query.

4. **Image héro 221 kB** : `loading='lazy'` est le défaut d'`OptimizedImage`, mais la colonne visuelle est `hidden lg:block` sur desktop — l'image est dans le DOM dès le premier rendu si `heroImage` est renseigné.

5. **Service worker immédiat** : l'enregistrement immédiat + précache de 62 entrées (~1,47 Mo) consomme de la bande passante au premier chargement sans contribuer au premier rendu.

## Conclusion

Les actifs les plus lourds pour le chargement initial sont, par ordre d'impact : le bundle `vendor-react` (235 kB), `vendor-supabase` (229 kB), `vendor-data` (129 kB), le CSS principal `index.css` (88,8 kB), l'animation (90 kB), puis l'image héro (221 kB). La page publique `/` charge des vendors (Supabase, React Query) qu'elle n'utilise pas.

**Recommandations (à confirmer par mesure Lighthouse / Playwright) :**

1. Fractionner `vendor-supabase` et `vendor-data` hors du chunk commun, les charger uniquement sur les routes authentifiées (`/app/*`).
2. Examiner si `vendor-animation` (gsap, lenis) est nécessaire sur la page publique.
3. Étudier le chargement conditionnel des Google Fonts par thème (editorial vs app).
4. Vérifier que l'image héro respecte bien `loading='lazy'` et n'est pas préchargée sur mobile (`hidden lg:block`).
5. Déplacer l'enregistrement du Service Worker à `idle` ou après le premier rendu plutôt que `immediate: true`.

## Décisions humaines requises

Aucune — ce rapport est un diagnostic en lecture seule. Aucune modification de code n'a été effectuée.

## Fichiers modifiés

Aucun.

## Prochaine étape

Exécuter une mesure réelle (Lighthouse CI ou Playwright) sur `/` pour confirmer l'impact de chaque facteur et prioriser les optimisations.

Rapport écrit : docs/reports/optimisation-assets.md
Résumé : Diagnostic lecture seule des assets et du chargement initial — vendors React/Supabase/data dominent le bundle (593 kB brut), CSS principal à 88,8 kB, image héro 221 kB, Google Fonts en bloc ; aucune modification de code.
Décisions requises : aucune (mission diagnostic uniquement).