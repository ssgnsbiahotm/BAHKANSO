# Runbook — Déploiement / Sauvegarde / Restauration (P3)

**Projet** : BAHKANSO — Pilotage agro-pastoral
**Branche** : `fix/security-rls-p0-p1`
**Dernier commit** : `12e6219` (non poussé)
**Cible** : `https://bahkanso.surge.sh` (hébergement statique Surge)

---

## 1. Prérequis (à vérifier avant toute exécution)

- [ ] Compte Surge configuré sur la machine qui déploie (`npx surge --whoami`)
- [ ] Clés Supabase distantes disponibles (service role + anon) — **jamais committées, jamais affichées**
- [ ] Base distante cible identifiée (staging ou production)
- [ ] Sauvegarde récente de la base distante avant toute migration

---

## 2. Déploiement (frontend statique)

Le frontend est une application React + Vite statique, déployée sur Surge.

### 2.1 Build reproductible (obligatoire avant déploiement)

```bash
# Sur un clone propre du dépôt, branche fix/security-rls-p0-p1
git checkout fix/security-rls-p0-p1
git pull --ff-only   # si autorisé ; sinon travailler sur le clone local

# Vérifier l'état de référence
npm run typecheck    # exit 0 attendu
npm run lint         # exit 0 attendu (28 avertissements exhaustive-deps préexistants, 0 erreur)
npm run test         # 142/142 unitaires vert

# Build
npm run build        # génère dist/ + dist/200.html (SPA fallback)
```

**Règle** : ne jamais déployer depuis un répertoire contenant des fichiers non commités (la production différerait du dépôt). `git status --short` doit être propre (hormis `.gitignore`).

### 2.2 Déploiement Surge

```bash
npm run deploy
# Équivalent : npm run build && npx surge dist/ bahkanso.surge.sh
```

**Ne jamais faire par l'agent** (CLAUDE.md §16) : le déploiement est une opération humaine, depuis un clone propre.

---

## 3. Base de données (migrations Supabase)

### 3.1 Règles absolues (CLAUDE.md §13)

- Interdit sans accord explicite : `supabase db push`, `--linked`, `--db-url` distant, migration appliquée à une base distante, seed, modification RLS ou rôle, écriture de test distante, upload/suppression Storage.
- Autorisé (local uniquement) : `supabase status`, `supabase db reset` (local), `supabase migration list --local`, requêtes SELECT sur l'instance locale.

### 3.2 Procédure locale (validation avant toute mise en production distante)

```bash
supabase status          # API sur 127.0.0.1:54321 requis
supabase db reset        # réinitialise la base locale (perd toutes les données locales)
supabase migration list --local   # vérifie 001 → 022 appliquées
```

La migration de nettoyage RLS `20261126000001_nettoyage_rls_legacy.sql` est committée. Elle doit être appliquée sur l'instance locale pour validation, puis sur la distante **seulement après accord explicite du responsable**.

---

## 4. Sauvegarde

### 4.1 Base de données distante

Avant toute migration sur la base distante :

```bash
# Exemple (à adapter selon l'hébergement Supabase distant) — faire sur la machine de l'opérateur, pas par l'agent
pg_dump $DATABASE_URL > sauvegarde_YYYYMMDD.sql
```

Ou via l'interface Supabase dashboard : section Backup → prendre un snapshot manuel.

### 4.2 Frontend

Le frontend est statique (Surge). Pas de base à sauvegarder côté applicatif. Les médias uploadés (Supabase Storage) doivent être sauvegardés séparément si utilisés en production.

---

## 5. Restauration

### 5.1 Base de données distante

```bash
# Restauration depuis un dump — opérateur humain, base distante
psql $DATABASE_URL < sauvegarde_YYYYMMDD.sql
```

### 5.2 Frontend (roll-back Surge)

Surge ne propose pas de roll-back natif一键. En cas de régression :
- Redéployer la version précédente (commit connu, build reproductible) : `git checkout <commit-precedent> && npm run deploy`
- Ou supprimer le déploiement et recréer.

---

## 6. Checklist pré-déploiement production

| Item | Statut | Preuve |
|------|--------|--------|
| typecheck exit 0 | ✅ | vérifié cette session |
| lint exit 0 | ✅ | vérifié (28 warnings préexistants, 0 erreur) |
| tests unitaires 142/142 | ✅ | vérifié |
| tests intégration 39/39 | ✅ | vérifié sur Supabase local réinitialisé |
| Migration nettoyage RLS committée | ✅ | `e35104e` |
| docs/CONTEXT.md à jour | ✅ | `12e6219` |
| Build sur clone propre | ❌ | non exécuté cette session |
| Déploiement Surge | ❌ | jamais fait par l'agent (interdit) |
| Migration sur base distante | ❌ | interdit sans accord explicite |
| Sauvegarde avant migration | ❌ | à faire par l'opérateur |

---

## 7. Items P3 en attente (décision responsable)

1. **URL production `https://bahkanso.surge.sh`** : non vérifiable par l'agent (pas d'accès distant, CLAUDE.md §3/§13). À vérifier par le responsable.
2. **Utilisateur sans `site_id`** : décision métier en attente (comportement à définir). Non implémenté.
3. **Module Finance > Dépenses** : route existe, écart QA résolu, complétion à décider avec le responsable.

---

**Statut final** : code prêt (P0/P1 vert), production non déployée. Aucun commit, push ou déploiement n'a été effectué par l'agent au-delà de `docs/CONTEXT.md` et de la migration déjà committées sur `fix/security-rls-p0-p1`.
