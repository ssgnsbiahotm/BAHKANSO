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
- ⚠️ Modifier `.mcp.json` : interdit par défaut, autorisé uniquement sur demande explicite de l'utilisateur (dernière décision : ajout du serveur MCP Perplexity, 2026-11-03)

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

## RLS — Règles non négociables pour ce projet

1. Toute nouvelle table exposée via l'API Supabase DOIT avoir
   `ENABLE ROW LEVEL SECURITY` ET `FORCE ROW LEVEL SECURITY`.
   `FORCE` est indispensable pour que pgTAP teste la RLS réelle
   (sinon le propriétaire postgres contourne la RLS silencieusement,
   et les tests passent sans rien tester).

2. Avant d'écrire une politique, TOUJOURS lister les politiques
   existantes :
     SELECT polname, polcmd FROM pg_policy
     WHERE polrelid = 'public.<table>'::regclass;
   Les politiques se combinent en OR. Ajouter une politique
   restrictive ne retire pas les permissives existantes — il faut
   les DROPPER nommément.

3. Les politiques doivent filtrer par les colonnes RÉELLES du schéma
   (`site_id`, `funder_id`, `created_by`), vérifiées via
   information_schema. Ne jamais supposer un nom de colonne depuis
   les types TypeScript.

4. Les tests pgTAP doivent vérifier le SQLSTATE, pas le message
   (`throws_ok(..., '42501', NULL, ...)`). Le message peut changer
   entre versions PostgreSQL ; le code est stable.

5. Les helpers SECURITY DEFINER qui lisent app_users/funders doivent
   rester hors du périmètre FORCE RLS, ou inclure
   `SET LOCAL row_security = off` dans leur définition. Sinon
   récursion infinie.

6. Ne JAMAIS modifier une migration appliquée. Ajouter une nouvelle
   migration corrective (timestamp postérieur) ou réordonner.
   Exception documentée : dérogation unique, tracée dans
   docs/migrations/.

   ## Tests pgTAP et auth.uid()

pgTAP ne simule pas correctement un JWT de production. La variable
`request.jwt.claim.sub` positionnée par SET LOCAL n'est pas équivalente
à un vrai JWT signé par Supabase Auth.

Conséquences :
- Les helpers `current_*` (qui utilisent `auth.uid()`) ne sont PAS
  testables en pgTAP de manière fiable.
- Les politiques RLS qui les utilisent peuvent être testées (via des
  assertions sur le résultat : « le financeur voit 1 ligne »), mais
  pas les helpers eux-mêmes.

Stratégie de test retenue :
1. **Tests d'intégration avec un vrai Supabase local et un vrai JWT**
   (via supabase-js + auth.signIn) pour les helpers et les politiques.
2. **Tests pgTAP** réservés aux invariants qui ne dépendent PAS de
   auth.uid() (par exemple, la présence de FORCE RLS, l'absence de
   USING (true), la présence des DROP POLICY).

Les tests pgTAP actuels sur fundings/expenses restent valides pour les
assertions qui ne dépendent pas des helpers (FORCE RLS, absence de
USING (true)). Les assertions qui dépendent de current_user_role() sont
marquées comme "à valider en test d'intégration".

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
