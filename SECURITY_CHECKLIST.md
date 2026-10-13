# Checklist sécurité production

## 1. Supabase / RLS

- Vérifier toutes les politiques RLS sur `app_users`, `fundings`, `transactions`, `expenses`, `documents`, `audit_logs`, `recipes`.
- Limiter les accès en lecture/écriture à `authenticated` uniquement.
- Ne pas laisser les politiques `anon` ouvertes sur les tables métier.
- Ajouter des filtres par `auth_id` ou `owner_id` si le système doit être multi-utilisateur.
- Vérifier les permissions sur les buckets de stockage.

## 2. Authentification

- utiliser des comptes utilisateur réels et non des comptes demo
- configurer les redirections d’authentification en production
- contrôler les rôles (admin / gestionnaire / comptable / opérateur)
- forcer la réauthentification pour les actions sensibles

## 3. Données sensibles

- ne jamais committer les variables d’environnement
- sécuriser les fichiers de logs et les exports
- limiter la publication de documents externes

## 4. Déploiement

- valider les variables d’environnement : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- contrôler CORS / domaines autorisés
- tester le flux complet en production : login → données → ajout → suppression
- activer un monitoring d’erreurs (Sentry, LogRocket, etc.)

## 5. Production minimum

- Build OK
- Typecheck OK
- Lint OK
- RLS validées
- Domaine final approuvé
- Logs et alertes activés
