# Bahkanso

Application de gestion agricole et financière construite avec React, TypeScript, Vite et Supabase.

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase

## Prérequis

- Node.js 24.21.0
- npm 10+
- Un projet Supabase actif
- Un bucket de stockage pour les documents/images si vous souhaitez uploader des médias

## Installation locale

1. Copier les variables d’environnement :
   ```bash
   cp .env.example .env
   ```
2. Remplir les valeurs de votre projet Supabase :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Installer les dépendances :
   ```bash
   npm ci
   ```
4. Démarrer l’application :
   ```bash
   npm run dev
   ```

## Vérification de build

```bash
npm run build
npm run typecheck
npm run lint
```

## Déploiement

### Option 1 : Vercel

1. Importer le dépôt GitHub dans Vercel.
2. Définir les variables d’environnement :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Déployer le projet.
4. Vérifier que le domaine final est ajouté dans les paramètres de sécurité Supabase.

### Option 2 : Netlify / hosting statique

1. Importer le dépôt.
2. Définir les variables d’environnement.
3. Configurer la commande de build : `npm run build`
4. Définir le dossier de publication : `dist`
5. Vérifier la redirection SPA si besoin (fallback index.html).

### Option 3 : Nginx (Ubuntu / Debian)

1. Configurer `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans l’environnement de build, puis générer les fichiers statiques :
   ```bash
   npm ci
   npm run build
   ```
   Les variables `VITE_*` sont intégrées au bundle et visibles dans le navigateur. Utiliser uniquement la clé publique Supabase (`anon`/publishable), jamais une clé `service_role` ou une clé secrète.
2. Copier le contenu de `dist` sur le serveur Nginx :
   ```bash
   sudo install -d -m 755 /var/www/bahkanso/dist
   sudo cp -a dist/. /var/www/bahkanso/dist/
   ```
3. Installer la configuration Nginx fournie. Remplacer `server_name _;` par le nom de domaine si nécessaire :
   ```bash
   sudo install -m 644 nginx.conf /etc/nginx/sites-available/bahkanso
   sudo ln -sfn /etc/nginx/sites-available/bahkanso /etc/nginx/sites-enabled/bahkanso
   sudo nginx -t
   sudo systemctl reload nginx
   ```
   La configuration sert l’application depuis `/var/www/bahkanso/dist`, redirige les routes de l’application monopage vers `index.html` et applique un cache long aux ressources compilées.
4. Configurer HTTPS pour le domaine (par exemple avec Certbot), puis vérifier que ce domaine est autorisé dans les paramètres d’authentification Supabase.

### Autres hébergements statiques

- Commande de build : `npm run build`
- Dossier de sortie : `dist`
- Configurer le fallback des routes vers `index.html`.

## Sécurité et production

- Les valeurs sensibles ne doivent jamais être commitées.
- La configuration Supabase doit être validée avant mise en ligne.
- Les politiques RLS doivent être stricte avant production.
- Les domaines autorisés / CORS doivent être validés dans Supabase.

## Checklist production

- [ ] Variables d’environnement renseignées
- [ ] Supabase projet configuré
- [ ] RLS et politiques de sécurité validées
- [ ] Build de production OK
- [ ] Domaines / CORS validés
- [ ] Logs et monitoring activés
- [ ] Test du flux login + données + écriture réalisé
- [ ] Bucket de stockage vérifié
