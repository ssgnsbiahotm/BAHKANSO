# Rapport — Branchement URL Facebook sur le module Site vitrine

## Mission
Brancher l'URL Facebook de la landing sur le module Site vitrine (administrable depuis l'interface), au lieu du placeholder `[URL_PAGE_FACEBOOK]`.

## Objectif
Remplacer l'URL placeholder `[URL_PAGE_FACEBOOK]` dans `FacebookFeed` par une valeur réelle stockée dans `site_content`, éditable depuis l'interface d'administration `SiteContentEditor.tsx`, et affichée sur la landing page.

## Environnement
- Host : local (machine de développement)
- Répertoire : /home/souleymane/BAHKANSO
- Branche : feat/dashboard-v2 (HEAD 80e642d)
- Stack : React + Vite + TypeScript strict + Tailwind CSS
- Date : 2026-11-13

## Commands Executés
1. `npx tsc --noEmit` — typecheck : exit 0
2. `npm run build` — build : exit 0, 63 entrées précache
3. `npx eslint src/pages/LandingPage.tsx src/components/landing/FacebookFeed.tsx src/pages/SiteContentEditor.tsx` — lint : 0 erreur
4. `npx vitest run src/` — tests : 121/121 passés

## Choix d'implémentation
La table `site_content` (migration 006) stocke chaque section sous une clé `key` avec une valeur JSON `value`. Aucun schéma n'a besoin d'être modifié : la clé `facebook_url` est ajoutée comme champ du JSON de la section existante `cta` (Call to Action), qui est thématiquement liée aux contacts et réseaux sociaux.

Aucune migration n'a été écrite ni appliquée (la règle du projet interdit de modifier une migration existante ; ajouter un champ à un JSON existant ne nécessite pas de changement de schéma).

## Fichiers modifiés

### 1. `src/pages/LandingPage.tsx`
- Ligne ~137 : lecture de `facebookUrl` depuis `ctaContent.facebook_url` (la section `cta` est déjà chargée via `siteContent`)
- Ligne ~598 : `<FacebookFeed pageUrl={facebookUrl} />` remplace `<FacebookFeed pageUrl="[URL_PAGE_FACEBOOK]" />`

### 2. `src/components/landing/FacebookFeed.tsx`
- `pageUrl` devient optionnel (`pageUrl?`)
- Le test de garde `pageUrl === '[URL_PAGE_FACEBOOK]'` est remplacé par `!pageUrl || pageUrl.trim() === ''` → le composant rend `null` si aucune URL n'est configurée (pas de placeholder, pas d'affichage fantôme)

### 3. `src/pages/SiteContentEditor.tsx`
- Section `cta` : ajout d'un champ `FormField` "URL de la page Facebook" qui met à jour `cta.facebook_url` via `updateField('cta', 'facebook_url', v)`
- La valeur est persistée en base via `handleSave` / `handlePublish` (mécanisme existant, `supabase.from('site_content').update({ value: drafts['cta'], ... }).eq('key', 'cta')`)

## Résultats

| Vérification | Résultat | Statut |
|---|---|---|
| typecheck (`tsc --noEmit`) | exit 0 | ✅ |
| build (`npm run build`) | exit 0, 63 entrées précache | ✅ |
| lint (3 fichiers modifiés) | 0 erreur | ✅ |
| tests (`npx vitest run src/`) | 121/121 passés | ✅ |

## Comportement
- Si `facebook_url` est vide ou non renseigné dans `site_content` : `FacebookFeed` rend `null`, aucune section n'est affichée (pas de placeholder, pas d'erreur).
- Si `facebook_url` est renseigné : la section Facebook s'affiche avec chargement au clic (consentement), iframe Page Plugin, fallback si l'URL est invalide.
- L'URL est modifiable depuis l'interface d'administration (Site vitrine > Section CTA > "URL de la page Facebook"), puis enregistrée/publiée en base.

## Actions réalisées
- `src/pages/LandingPage.tsx` : lecture de `facebookUrl` depuis `siteContent['cta']?.value.facebook_url`, passage à `FacebookFeed`
- `src/components/landing/FacebookFeed.tsx` : `pageUrl` optionnel, garde sur URL vide, suppression du placeholder
- `src/pages/SiteContentEditor.tsx` : champ d'édition `facebook_url` dans la section CTA
- Rapport écrit : `docs/audits/landing/rapport-facebook-sitevitrine-2026-11-13.md`

## Fichiers modifiés (un par ligne)
- `src/pages/LandingPage.tsx`
- `src/components/landing/FacebookFeed.tsx`
- `src/pages/SiteContentEditor.tsx`
- `docs/audits/landing/rapport-facebook-sitevitrine-2026-11-13.md` (nouveau)

## Git status final
Aucun commit effectué (conformément aux règles du projet).
