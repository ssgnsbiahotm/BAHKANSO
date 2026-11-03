# BAHKANSO — Règles projet pour agents IA

> Fichier de référence pour Claude Code, Codex et tout agent intervenant.
> Dernière mise à jour : 2026-11-01

---

## 1. RÔLES ET COORDINATION

- **Utilisateur** : orchestrateur, décisions produit et priorités
- **Claude Code** : module Élevage **+ chantiers transverses** (design system, navigation, tests)
- **Codex** : accueil public (vitrine uniquement)
- **Aucun agent** ne doit écraser les modifications d'un autre

Avant toute intervention :
1. `git status` + `git log --oneline -5` + `git branch -a`
2. Lire les fichiers concernés + leurs diffs récents
3. Signaler si des modifications non commitées existent

---

## 2. INTERDICTIONS ABSOLUES

Ces actions font **échouer la mission automatiquement**, sans exception.

### Sécurité et données
- ❌ S'authentifier (login, signup, reset password) sur une vraie base
- ❌ Soumettre un formulaire persistant sur base distante
- ❌ Confirmer une suppression
- ❌ Uploader un fichier vers un service distant
- ❌ Déployer (surge, vercel, netlify…)
- ❌ Modifier `.env`, `.mcp.json`, `src/lib/supabase.ts`

### Git
- ❌ `git push`, `git reset --hard`, `git rebase --force` sans demande
- ❌ `git rebase main` si `main` est plus ancienne (vérifier `git log main..HEAD`)
- ❌ Supprimer une branche ou un tag
- ❌ Force-push

### Code
- ❌ Installer une dépendance **sans accord explicite dans la conversation**
- ❌ Supprimer les directives `@tailwind` dans `src/index.css`
- ❌ Migration Tailwind, ajout de CDN, changement de version majeure
- ❌ Refactorisation non demandée
- ❌ Modification de code sans demande explicite

### Tests navigateur
Autorisés (Playwright/MCP) dans le périmètre demandé. Ne permettent PAS :
- Installer de navigateur sans accord
- Contourner l'authentification
- Modifier des données distantes / confirmer suppression / uploader / déployer

⚠️ Avant tests : identifier la destination des connexions. Un `localhost` ne prouve **pas** que la base est locale.
⚠️ Si un outil échoue : fournir l'erreur exacte. Ne pas déclarer les tests "interdits".

---

## Rapports et livrables

Tout rapport d'inspection, d'audit, de diagnostic ou de synthèse DOIT être
écrit dans un fichier Markdown sous `docs/reports/`, jamais collé dans le
terminal.

### Convention de nommage

docs/reports/YYYY-MM-DD-HHMM-<sujet>.md

Exemples :
- docs/reports/2026-11-03-1830-rls-schema-inspection.md
- docs/reports/2026-11-03-1915-fix-login-verification.md
- docs/reports/2026-11-03-2045-backfill-auth-id-derogation.md

### Contenu minimal d'un rapport

# <Titre>
Date : YYYY-MM-DD HH:MM
Branche : <branche courante>
Commit : <SHA court>
Auteur : Claude Code (agent) + validation humaine

## Contexte
<2-3 lignes>

## Constats
<liste avec preuves : fichier:ligne, ou sortie de commande, ou requête SQL>

## Conclusion
<réponse claire à la question posée>

## Décisions humaines requises
<liste des points à trancher, s'il y en a>

## Fichiers modifiés
<liste, ou "aucun">

## Prochaine étape
<une phrase>

### Dans le terminal, ne reste qu'un résumé

À la fin de chaque rapport, l'agent affiche dans le terminal UNIQUEMENT :

  Rapport écrit : docs/reports/<nom>.md
  Résumé : <une ligne>
  Décisions requises : <une ligne ou "aucune">

Jamais le corps du rapport.

## 3. STOP CONDITION — VALIDATION TECHNIQUE

**Cause racine des sessions perdues** : les agents écrivaient "passed" alors que `npm run typecheck` retournait des dizaines d'erreurs. Le pipe `| tee` masque l'exit code réel.

### Règle absolue
Pour TOUTE commande de validation :

```bash
set -o pipefail
npm run typecheck 2>&1 | tee /tmp/ts.log
echo "EXIT: $?"   # ← exit RÉEL de tsc, pas de tee
