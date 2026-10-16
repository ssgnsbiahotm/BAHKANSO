# RÉSULTATS TECHNIQUES

## Commandes exécutées et résultats

### 1. Vérification de l'environnement
```
pwd
/home/ssgnsa/projects/project-bahkanso

git status --short
 M AUDIT_BOUTONS.md
 M src/lib/DataContext.tsx
?? .aider.chat.history.md
?? .aider.input.history
?? .aider.tags.cache.v4/
?? .backup_audit_boutons_20261015-225109/
?? AUDIT_BOUTONS.md.tmp
?? AUDIT_BOUTONS_NEW.md
?? BUTTON_AUDIT_SUMMARY.md
?? FINAL_AUDIT_REPORT.md
?? SCHEMA_MAP.md
?? src/routes/AppRoutes.tsx.backup

git log -1 --oneline
280060c navigation: prefixe /app sur les routes des pages de gestion

npm run
Scripts available in vite-react-typescript-starter@0.0.0 via `npm run`:
  dev
    vite
  build
    vite build
  lint
    eslint .
  preview
    vite preview
  typecheck
    tsc --noEmit -p tsconfig.app.json
```

### 2. Tests de qualité du code
```
npm run typecheck
ok

npm run build
vite v5.4.8 building for production...
transforming...
✓ 1796 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.72 kB │ gzip:   0.39 kB
dist/assets/index-B_0hOxx4.css   47.07 kB │ gzip:   8.08 kB
dist/assets/index-CvI0hWjJ.js   837.51 kB │ gzip: 210.52 kB
✓ built in 6.45s
(node_modules/zod/v4/core/regexes.js: Warnings about Rollup unable to parse certain comments - harmless)

npm run lint
Exit code 1
ESLint: 413 errors, 20 warnings in 41 files
[Details: voir AUDIT_FONCTIONNEL_BAHKANSO.md section 6]
```

### 3. Analyse du problème principal
**Fichier inspecté** : src/lib/DataContext.tsx
**Ligne problématique** : 109
**Requête actuelle** :
```typescript
supabase.from("expenses").select("*, supplier:suppliers(*), funding:fundings(funder:funders(*))").order("date", { ascending: false }),
```

**Analyse** : La relation `funding:fundings(funder:funders(*))` tente de faire une jointure imbriquée à deux niveaux depuis la table expenses :
1. expenses.funding_id → fundings.id
2. fundings.funder_id → funders.id

Cette syntaxe peut ne pas être supportée par Supabase ou générer un mappage de propriétés incorrect entraînant des erreurs HTTP 400.

**Preuve** : Les erreurs HTTP 400 répétés mentionnés dans la correspondance initiale sur l'URL :
```
expenses?select=*,supplier:suppliers(*),funder:funders(*)&order=date.desc
```