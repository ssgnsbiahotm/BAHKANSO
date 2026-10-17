# RÈGLES ABSOLUES POUR CE PROJET — BAHKANSO

## 🛑 INTERDICTIONS STRICTES
1. **JAMAIS** de Playwright, MCP, ou tout outil de navigateur automatisé
2. **JAMAIS** de "mode planification" ou de plans en plusieurs étapes
3. **JAMAIS** de modification de code sans demande explicite
4. **JAMAIS** de suppression des directives `@tailwind` dans `src/index.css`
5. **JAMAIS** de tentative d'authentification ou de remplissage de formulaire
6. **JAMAIS** de migration de Tailwind, ajout de CDN, ou installation de dépendances

## ✅ COMPORTEMENT ATTENDU
1. **UNE action par prompt**, puis ARRÊT et RAPPORT
2. **Lire les fichiers** avant de proposer une correction
3. **Un diagnostic d'abord**, un correctif seulement après validation
4. **Réponses courtes** : maximum 10 lignes
5. **Pas de refactorisation non demandée**

## 🏗️ STACK
- Vite + React + TypeScript
- Tailwind CSS v3 (via `postcss.config.js`)
- Supabase (auth + database)
- Déploiement : Surge (`bahkanso.surge.sh`)

## 📁 FICHIERS SENSIBLES (ne jamais toucher sans demande)
- `src/index.css` (contient les directives @tailwind)
- `src/lib/supabase.ts`
- `.env`
- `.mcp.json`

## 🔁 PROCESSUS POUR TOUTE DEMANDE
1. Lis le fichier concerné
2. Confirme ce que tu vois (2 lignes max)
3. Attends validation avant de modifier
