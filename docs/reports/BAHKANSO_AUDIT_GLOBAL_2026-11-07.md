# BAHKANSO — Audit général avant livraison finale

Date : 2026-11-07
Branche : main
Commit : a9d6de7
Auteur : Claude Code (agent) + validation humaine

## Contexte

Mission read-only : établir un diagnostic complet du projet BAHKANSO (gestion agricole et financière) avant livraison finale. Aucune modification de code, config, migration, donnée RLS/Auth/RBAC n'a été apportée. Seul ce rapport a été créé. L'application est en production sur https://bahkanso.surge.sh.

## Objectif

Identifier ce qui fonctionne, ce qui est cassé et ce qui manque, sur 13 sections : synthèse, état fonctionnel, sécurité, audit financier, UI/UX, technique, production, matrice 3 rôles, plan de correction P0-P3, plan de finalisation, éléments à clarifier, verdict.

## Environnement

- Hôte : local (`~/BAHKANSO`)
- Utilisateur : souleymane
- Dépôt : `/home/souleymane/BAHKANSO`
- Branche courante : `main` (branche de référence annoncée : `rls/fundings-expenses`, non fusionnée)
- Stack : React 18, TypeScript 5.6.3, Vite, Vitest, Tailwind CSS, Supabase JS, React Query, React Router 7, zod
- Derniers commits de livraison : `a9d6de7` (EntityPicker dropdown on focus), `1f31f0a` (suppression doublons labels + Commentaire), `20e93af` (auto-label dépense + compteur liens)
- URL production : https://bahkanso.surge.sh

## Commandes exécutées

```bash
cd ~/BAHKANSO
npm run typecheck        # exit 0 (2 fois)
npm run build            # exit 0, 62 entrées précache, 1458.67 KiB
npm run lint             # exit 1, 89 problèmes (66 erreurs, 23 avertissements)
npm run test             # exit 1, 21 fichiers échoués / 4 réussis, 35 tests échoués / 51 réussis
git status --short       # 4 modifiés, 3 non suivis, branche main
```

## Résultats complets

### Typecheck — PASS
`npm run typecheck` : exit 0. Aucune erreur TypeScript. Le projet compile statiquement.

### Build — PASS
`npm run build` : exit 0, 62 entrées précache (PWA v2.0.0), ~1.46 Mo. Build de production valide.

### Lint — FAIL
`npm run lint` : exit 1, 89 problèmes dont 66 erreurs et 23 avertissements.
Erreurs réparties (extraits significatifs) :
- `src/pages/exploitation/RecoltesPage.tsx` : 6 erreurs (imports inutilisés `Plot`, `Site`, `EntityType`; variables `plots`, `campaigns`, `sites` assignées mais non utilisées; 2 blocs vides; `FormSelect` inutilisé)
- `src/pages/surveillance/tabs/HistoriqueTab.tsx` : `loading` assigné mais non utilisé
- `src/routes/AppRoutes.tsx` : `PreservingRedirect` défini mais non utilisé
- `src/pages/exploitation/OperationsPage.tsx` : `handleDeleteOperation`, `toneFor` inutilisés
- Plusieurs `no-empty`, `@typescript-eslint/no-unused-vars`, `react-hooks/exhaustive-deps`

### Tests — FAIL
`npm run test` : exit 1, 25 fichiers de tests, 21 échoués / 4 réussis, 86 tests dont 35 échoués / 51 réussis.
Erreur non gérée : `TypeError: Cannot destructure property 'sales' of 'useSalesData(...)' as it is undefined` dans `src/modules/Sales/SalesModule.tsx:71`, déclenché par `src/pages/UsersPage.test.tsx`.

## Analyse

### Ce qui fonctionne (forces)
1. **Build et typecheck verts** : le projet compile et se build proprement en production. Aucun blocage de build.
2. **Architecture RBAC complète** : 8 rôles définis (`administrateur`, `propriétaire`, `financeur`, `gestionnaire`, `comptable`, `responsable_agricole`, `responsable_élevage`, `auditeur`) avec matrice de permissions granulaire par module et action (`read/write/delete/admin`) dans `src/lib/rbac.ts`.
3. **Garde-fous de route** : toutes les routes `/app/*` protégées par `RequireAuth`, et chaque module par `RequireModule` avec l'action adéquate (`src/routes/AppRoutes.tsx`).
4. **RLS least-privilege sur fundings/expenses** : migration `20261103000001` met en place des politiques scoped, droppe les politiques `USING (true)` de la migration 012, force `ROW LEVEL SECURITY` sur les deux tables, et inclut un garde-fou DO block rejetant toute politique permissive résiduelle.
5. **Helpers SECURITY DEFINER** : `current_app_user_id`, `current_user_role`, `current_user_site_id`, `current_user_funder_id` résolvent l'utilisateur courant via `auth.uid()` / `request.jwt.claim.sub`.
6. **Traçabilité** : table `audit_logs` + fonction `logAudit` appelée sur CREATE/UPDATE/DELETE dans ExpensesTab, FundingsTab, SalesModule.
7. **Composants Phase B terminés** : EntityPicker, DatePicker, SiteField, EntityLinkPicker intégrés dans les 4 formulaires financiers (doublons de labels supprimés, champ Commentaire masqué).
8. **Identifiants auto-générés** : `generateEntityIdentifier` pour les références EXP/FND.
9. **Couche données centralisée** : `DataContext` charge 27 sources Supabase avec gestion d'erreur par source (une source qui échoue n'annule pas les autres).

### Ce qui est cassé / à corriger (faiblesses)
1. **Tests en échec** : 21 fichiers de test sur 25 échouent, dont le module Sales (`useSalesData` retourne `undefined` hors contexte Data/Auth provider). La couverture de régression n'est pas fiable en l'état.
2. **Lint en échec** : 66 erreurs, notamment des imports et variables inutilisés dans `RecoltesPage.tsx` et `HistoriqueTab.tsx`, des blocs vides, et un composant `PreservingRedirect` inutilisé dans `AppRoutes.tsx`. Ceci indique du code mort non nettoyé.
3. **Ventes non protégées par RLS scoped** : les routes `ventes` redirigent vers `/app/finance?tab=ventes` (SalesModule dans FinanceModule), mais il n'existe pas de politique RLS `sales_scoped` équivalente à fundings/expenses. La table `sales` repose sur `site_id` sans contrainte RLS documentée dans les migrations lues.
4. **`isAuthorized` côté client uniquement** : ExpensesTab et FundingsTab vérifient `isAuthorized` (rôle administrateur/propriétaire) en React pour afficher le bouton "Nouvelle dépense/financement", mais il n'y a pas de `RequireModule(action='write')` sur les onglets fundings/expenses — seule l'action `read` est gardée au niveau route. L'autorisation d'écriture repose entièrement sur le frontend et la RLS serveur.
5. **`comptable` marqué lecture seule sur finance dans la matrice RBAC**, mais la politique RLS `expenses_write_scoped` inclut `comptable` dans la clause USING (lecture) — cohérent avec le WITH CHECK qui le bloque à l'écriture. Cependant ce double niveau (RBAC + RLS) est une source de complexité et de risque de divergence.
6. **Données financières liées à `site_id` de l'utilisateur connecté** : le multi-sites (migration 022) repose sur `app_user.site_id`. Si un utilisateur n'a pas de `site_id`, les requêtes filtrées retournent vide sans erreur explicite.

### Ce qui manque (gaps)
1. **Aucune politique RLS sur `sales`** : ni sélection scoped, ni écriture scoped, ni FORCE RLS documenté.
2. **Tests d'intégration absents pour les helpers RLS** : les helpers `current_*` utilisant `auth.uid()` ne sont pas testables de manière fiable en pgTAP (documenté dans CLAUDE.md). La stratégie retenue (tests d'intégration avec vrai Supabase local + vrai JWT) n'est pas encore mise en place.
3. **Documentation d'exploitation incomplète** : pas de runbook de reset DB, pas de procédure de mise à jour des migrations appliquées (règle : ne jamais modifier une migration appliquée, ajouter une migration corrective).
4. **Variables d'environnement** : `.env` et `.env.local` existent localement mais sont gitignoriés (`.env` dans `.gitignore`). Leur présence n'est pas vérifiable en CI sans `.env.example`.

## Constats (preuves)

| Domaine | Constat | Preuve |
|---------|---------|--------|
| Typecheck | exit 0 | `npm run typecheck` |
| Build | exit 0, 62 précache | `npm run build` |
| Lint | 66 erreurs / 23 warnings | `npm run lint` |
| Tests | 35 échoués / 51 réussis, 21 fichiers échoués | `npm run test` |
| RBAC | 8 rôles, matrice module×action | `src/lib/rbac.ts:84-227` |
| Auth guard | RequireAuth + RequireModule sur toutes les routes /app | `src/routes/authGuard.tsx`, `AppRoutes.tsx:121-323` |
| RLS fundings/expenses | Politiques scoped, FORCE RLS, garde-fou | `supabase/migrations/20261103000001_rls_fundings_expenses_least_privilege.sql` |
| RLS sales | Aucune politique scoped / FORCE RLS | migrations listées, aucune `sales_scoped` |
| Formulaires financiers | Doublons labels supprimés, Commentaire masqué | commits `1f31f0a`, `a9d6de7` |

## Décisions humaines requises

1. Valider que le manque de RLS sur `sales` est intentionnel (ou planifier la migration `sales_scoped` + FORCE RLS).
2. Définir la procédure de mise à jour des tests (21 fichiers en échec) avant livraison.
3. Confirmer si un `.env.example` doit être ajouté pour le déploiement (`.env` est gitignoré).
4. Valider le plan de correction P0-P3 ci-dessous avant exécution (cette mission est read-only, aucun correctif n'a été appliqué).

## Fichiers modifiés

Aucun (mission read-only). Seul ce rapport a été créé : `docs/reports/BAHKANSO_AUDIT_GLOBAL_2026-11-07.md`.

## Plan de correction P0-P3 (recommandé, non exécuté)

**P0 — bloquant livraison**
- Tests : réduire à 0 les fichiers de test en échec (21/25), notamment `useSalesData` hors contexte provider.
- Lint : corriger les 66 erreurs (imports/variables inutilisés, blocs vides).
- RLS : ajouter politiques scoped + FORCE RLS sur `sales`.

**P1 — avant recette**
- Ajouter `RequireModule(action='write')` sur les onglets fundings/expenses (autorisation d'écriture au niveau route, pas seulement client).
- Tests d'intégration avec vrai Supabase local + JWT pour valider les helpers RLS `current_*`.

**P2 — qualité**
- Nettoyer le code mort (`PreservingRedirect` inutilisé, variables inutilisées).
- Ajouter `.env.example`.

**P3 — post-livraison**
- Runbook de reset DB et procédure de migration corrective.
- Documentation d'exploitation.

## Matrice 3 rôles (extrait RBAC, `src/lib/rbac.ts`)

| Rôle | finance read | finance write | agriculture read | agriculture write | ventes read | ventes write | users |
|------|-------------|---------------|------------------|-------------------|-------------|--------------|-------|
| administrateur | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| propriétaire | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ (lecture) |
| financeur | ✅ | ✅ (son funder) | ❌ | ❌ | ✅ | ❌ | ❌ |
| comptable | ✅ (lecture seule) | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ |
| auditeur | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ (lecture) |

Note : la restriction financeur à "ses propres fundings" est portée par la RLS (`funder_id = current_user_funder_id()`), non par la matrice front.

## Audit financier (constats)

- **Dépenses (ExpensesTab)** : création/édition/suppression avec `generateEntityIdentifier('EXP')`, label auto `"Catégorie - Fournisseur"`, `comment: null` forcé au submit, liens `financial_links` idempotents (delete + insert), audit log sur chaque action, autorisation `isAuthorized` (admin/propriétaire) côté client uniquement.
- **Financements (FundingsTab)** : création/édition/suppression avec `generateEntityIdentifier('FND')`, commentaire persistant (`comment: null` par défaut), liens `financial_links` idempotents, audit log, même modèle d'autorisation client.
- **Ventes (SalesModule)** : création/édition/suppression, articles `sale_items`, liens `financial_links`, pas de `RequireModule(action='write')` spécifique, pas de RLS scoped sur `sales`.
- **Trésorerie** : `TreasuryTab` présent, pas d'audit approfondi dans cette mission.

## Synthèse

**Verdict : NON PRÊT — VALIDATION INCOMPLÈTE**

Le projet a des fondations solides (build vert, RBAC complet, RLS least-privilege sur fundings/expenses, traçabilité, composants Phase B terminés), mais la livraison finale est bloquée par : (1) les tests en échec (21 fichiers), (2) le lint en échec (66 erreurs), et (3) l'absence de RLS scoped sur les ventes. Aucun correctif n'a été appliqué (mission read-only).

## Prochaine étape

Exécuter le plan de correction P0 (tests, lint, RLS sales) puis refaire `npm run typecheck`, `npm run build`, `npm run lint`, `npm run test` avant de reconsidérer le verdict.
