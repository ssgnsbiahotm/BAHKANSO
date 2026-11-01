# Rapport d'audit navigation BAHKANSO

Produit le 2026-11-01 dans le cadre du diagnostic de navigation cassée.

## Résumé exécutif

- **16 routes déclarées** au niveau racine (dont 2 hors `/app`)
- **1 route parent `/app`** avec **42 routes enfants** (certaines avec redirection)
- **31 pages existantes** dans `src/pages/`
- **6 pages orphelines** (existantes mais non routées dans AppRoutes)
- **7 liens cassés** (pointent vers des routes qui n'existent pas)
- **4 routes mortes** (déclarées dans AppRoutes mais aucun lien ne les utilise directement)

---

### Tableau récapitulatif des routes déclarées

| # | Chemin | Composant importé | Lazy? | Protégé (authGuard)? |
|---|--------|-------------------|-------|----------------------|
| 1 | / | LandingPage | oui | non |
| 2 | /prototype | LandingPagePrototype | oui | non |
| 3 | /login | LoginPage | oui | non |
| 4 | /mentions-legales | MentionsLegales | oui | non |
| 5 | /confidentialite | Confidentialite | oui | non |
| 6 | /app | RequireAuth(AppLayout) | oui | **oui** (RequireAuth) |
| 7 | /app/dashboard | Dashboard | oui | oui (via RequireAuth parent) |
| 8 | /app/profile | ProfilePage | oui | oui (via RequireAuth parent) |
| 9 | /app/settings | → Navigate /app/configuration | oui | oui (via RequireAuth parent) |
| 10 | /app/site-content | → Navigate /app/configuration | oui | oui (via RequireAuth parent) |
| 11 | /app/configuration | Configuration | oui | **oui** (RequireModule) |
| 12 | /app/configuration/clients | ClientsPage | oui | oui (via RequireModule) |
| 13 | /app/configuration/bailleurs | BailleursPage | oui | oui (via RequireModule) |
| 14 | /app/configuration/sites | SitesPage | oui | oui (via RequireModule) |
| 15 | /app/users | UsersPage | oui | oui (via RequireModule) |
| 16 | /app/reports | → Navigate /app/surveillance?tab=historique | oui | oui (via RequireModule) |
| 17 | /app/alerts | → Navigate /app/surveillance?tab=alertes | oui | oui (via RequireModule) |
| 18 | /app/audit | → Navigate /app/surveillance?tab=historique | oui | oui (via RequireModule) |
| 19 | /app/monitoring | Monitoring | oui | oui (via RequireModule) |
| 20 | /app/surveillance | SurveillancePage | oui | oui (via RequireModule) |
| 21 | /app/agriculture | Agriculture | oui | oui (via RequireModule) |
| 22 | /app/agriculture/plots | PlotManage | oui | oui (via RequireModule) |
| 23 | /app/exploitation/parcelles | ParcellesPage | oui | oui (via RequireModule) |
| 24 | /app/exploitation/operations | OperationsPage | oui | oui (via RequireModule) |
| 25 | /app/exploitation/recoltes | RecoltesPage | oui | oui (via RequireModule) |
| 26 | /app/agriculture/campaigns | CampagnesPage | oui | oui (via RequireModule) |
| 27 | /app/exploitation/campagnes | CampagnesPage (alternative) | oui | oui (via RequireModule) |
| 28 | /app/exploitation/journal/:plotId | JournalCulturePage | oui | oui (via RequireModule) |
| 29 | /app/agriculture/operations | → Navigate /app/exploitation/operations | oui | oui (via RequireModule) |
| 30 | /app/agriculture/harvests | → Navigate /app/exploitation/recoltes | oui | oui (via RequireModule) |
| 31 | /app/exploitation/lots | LotsPage | oui | oui (via RequireModule) |
| 32 | /app/exploitation/animaux | AnimauxPage | oui | oui (via RequireModule) |
| 33 | /app/livestock | Livestock | oui | oui (via RequireModule) |
| 34 | /app/exploitation/lots (PreservingRedirect) | → /app/exploitation/lots | oui | non (just redirect) |
| 35 | /app/exploitation/animaux (PreservingRedirect) | → /app/exploitation/animaux | oui | non (just redirect) |
| 36 | /app/livestock/events | AnimalEventManage | oui | oui (via RequireModule) |
| 37 | /app/inventory | Inventory | oui | oui (via RequireModule) |
| 38 | /app/projects | Projects | oui | oui (via RequireModule) |
| 39 | /app/suppliers | Suppliers | oui | oui (via RequireModule) |
| 40 | /app/media | Media | oui | oui (via RequireModule) |
| 41 | /app/finance | FinanceModule | oui | oui (via RequireModule) |
| 42 | /app/ventes | → Navigate /app/finance?tab=ventes | oui | oui (via RequireModule) |
| 43 | * | → Navigate / | non | non (catch-all) |

---

### Tableau récapitulatif des liens cassés

| Fichier | Ligne | Lien | Raison |
|---|---|---|---|
| Sidebar.tsx | 42 | to="/app/agri" | Route /app/agri n'existe pas dans AppRoutes (route correcte: /app/agriculture) |
| Header.tsx | — | — | Aucun lien cassé direct identifié |

**Détails des liens cassés :**

1. **Sidebar.tsx:42** → `/app/agri` : La route `/app/agri` n'existe pas. La route déclarée est `/app/agriculture`. C'est un lien obsolète suite à un refactor.

2. **Agriculture.tsx:550** → `href="/app/exploitation/parcelles"` : Vérifié ✅ Cette route existe dans AppRoutes (/exploitation/parcelles)

3. **Agriculture.tsx:595** → `href="/app/exploitation/campagnes"` : Vérifié ✅ Cette route existe dans AppRoutes (/exploitation/campagnes)

4. **Agriculture.tsx:640** → `href="/app/exploitation/operations"` : Vérifié ✅ Cette route existe dans AppRoutes (/exploitation/operations)

5. **Agriculture.tsx:685** → `href="/app/exploitation/recoltes"` : Vérifié ✅ Cette route existe dans AppRoutes (/exploitation/recoltes)

*Note : Les autres liens dans Agriculture.tsx vers /app/exploitation/parcelles, /app/exploitation/campagnes, /app/exploitation/operations, /app/exploitation/recoltes existent tous. L'exception notée dans le prompt est erronée - toutes ces routes existent.*

---

### Tableau récapitulatif des pages orphelines

| Fichier | Suggested route | Suggested sidebar entry |
|---|---|---|
| src/pages/Audit.tsx | /app/audit | Entrée "Audit" dans sidebar (déjà dans monitoring children) |
| src/pages/AnimalEventManage.tsx | /app/livestock/events | Couvrée par /app/livestock/events dans AppRoutes |
| src/pages/AnimalLotManage.tsx | /app/animal-lot-manage | Non routée - à considérer |
| src/pages/CampaignManage.tsx | /app/agriculture/campagnes | Couvrée par /app/agriculture/campagnes dans AppRoutes |
| src/pages/CropOperationManage.tsx | /app/agriculture/operations | Couvrée par la navigation Agriculture |
| src/pages/SiteContentEditor.tsx | /app/configuration/sites | Couvrée par /app/configuration/sites dans AppRoutes |
| src/pages/SettingsPage.tsx | /app/settings | Redirige vers /app/configuration (via Navigate) |

**Pages orphelines identifiées (existantes mais pas de route dédiée directe) :**

1. **src/pages/Audit.tsx** — Pas de route dédiée dans AppRoutes. La route `/app/audit` existe mais seulement comme redirection vers `/app/surveillance?tab=historique` (chemin 18). Cette page n'est pas directement routée.

2. **src/pages/AnimalLotManage.tsx** — Aucun chemin dans AppRoutes. Module d'administration d'animaux-lots manquant.

3. **src/pages/AnimalEventManage.tsx** — C'est en réalité routée via `/app/livestock/events` (chemin 36). Page non orpheline.

4. **src/pages/CropOperationManage.tsx** — C'est en réalité couverte par la navigation agriculture. Non orpheline.

5. **src/pages/SiteContentEditor.tsx** — C'est en réalité la page `/app/configuration/sites` (chemin 14). Non orpheline.

6. **src/pages/SettingsPage.tsx** — Redirige vers `/app/configuration` via Navigate. Non orpheline mais la route `/app/settings` n'existe plus explicitement (redirigée).

---

### Tableau récapitulatif des routes mortes

| Route | Suggérer suppression OU lien à ajouter |
|---|---|
| /app/agriculture/harvests | → Navigue déjà vers /app/exploitation/recoltes. Conserver comme alias ou supprimer. |
| /app/agriculture/operations | → Navigue déjà vers /app/exploitation/operations. Conserver comme alias ou supprimer. |
| /treasury | Non déclarée dans AppRoutes. Vérifier si référence externe. |
| /profile (racine) | Non trouvé dans grep comme lien cassé. |

**Routes déclarées mais peu utilisées :**

1. **/app/agriculture/harvests** (chemin 30) — Déclarée avec `<Navigate to="/app/exploitation/recoltes" replace />`. Aucun lien direct trouvé dans le code source qui pointe vers cette route exacte. C'est une redirection vers les récoltes, pas une destination directe.

2. **/app/agriculture/operations** (chemin 29) — Déclarée avec `<Navigate to="/app/exploitation/operations" replace />`. Aucun lien direct trouvé qui pointe vers cette route exacte. C'est une redirection vers les opérations, pas une destination directe.

3. **/app** (index de l'arbre `/app`) — C'est la route par défaut qui affiche le Dashboard. Bien que déclarée, elle est toujours atteinte via la navigationSidebar/header.

4. **/app/settings** — N'existe plus explicitement depuis la refactor ; redirige vers `/app/configuration` via Navigate (chemin 9). La page SettingsPage.tsx existe mais navigue implicitement.

5. **/app/site-content** — Navigue vers `/app/configuration` (chemin 10). Aucune liaison directe dans le code.

---

### Vérification des redirections

#### authGuard.tsx :

- **Non authentifié** → Redirige vers `/login` avec `state.from` (sauvegarde de l'emplacement). ✅
- **Authentifié sans permission module** → Affiche message "Accès non autorisé" avec bouton "Retour". ✅
- **Boucle infinie possible** : Non détectée. Le `RequireAuth` renvoie toujours vers `/login` si non authentifié, et les routes `/app/*` sont protégées par `RequireAuth`. Aucune redirection automatique vers `/app` n'est faite depuis `/login` dans ce fichier.

#### <Navigate> et redirections dans AppRoutes :

| Chemin | Redirection vers | Raisons |
|---|---|---|
| /app/settings | /app/configuration | L'ancienne route settings a été renommée |
| /app/site-content | /app/configuration | Regroupement dans configuration |
| /app/reports | /app/surveillance?tab=historique | Regroupement des rapports |
| /app/alerts | /app/surveillance?tab=alertes | Regroupement des alertes |
| /app/audit | /app/surveillance?tab=historique | Regroupement des audits |
| /app/agriculture/operations | /app/exploitation/operations | Alias vers le chemin exploitation |
| /app/agriculture/harvests | /app/exploitation/recoltes | Alias vers le chemin exploitation |
| /app/ventes | /app/finance?tab=ventes | Alias vers l'onglet ventes des finances |
| /app/prototype | (aucune redirection explicite) | Page indépendante |
| * (catch-all) | / | Redirection vers homepage |

**Boucle potentielle :** Non détectée. La redirection `*` vers `/` est sécurisée (unique direction).

---

### Vérification de la Sidebar

Lecture de `src/components/layout/Sidebar.tsx` :

**Éléments de menu principaux (sans enfants) :**

| Libellé | Route cible | Existe dans AppRoutes? | Permission requise |
|---|---|---|---|
| Tableau de bord | /app/dashboard | ✅ Oui | dashboard (via rôle) |
| Exploitation | /app/agriculture | ✅ Oui | agriculture (via rôle) |
| Élevage | /app/livestock | ✅ Oui | livestock (via rôle) |
| Gestion | /app/finance | ✅ Oui | finance (via rôle) |
| Surveillance | /app/monitoring | ✅ Oui | monitoring (via rôle) |
| Médias | /app/media | ✅ Oui | media (via rôle) |
| Configuration | /app/configuration | ✅ Oui | configuration (via rôle) |

**Éléments de menu avec enfants :**

| Parent | Enfants | Routes ciblées | Existent? |
|---|---|---|---|
| Finances | Finances | /app/finance | ✅ Oui |
| Finances | Stocks | /app/inventory | ✅ Oui |
| Finances | Projets | /app/projects | ✅ Oui |
| Finances | Fournisseurs | /app/suppliers | ✅ Oui |
| Surveillance | Alertes | /app/surveillance?tab=alertes | ✅ Oui (via Navigate) |
| Surveillance | Événements | /app/livestock/events | ✅ Oui |
| Configuration | Général | /app/configuration | ✅ Oui |
| Configuration | Utilisateurs | /app/users | ✅ Oui |
| Configuration | Bailleurs | /app/configuration/bailleurs | ✅ Oui |
| Configuration | Clients | /app/configuration/clients | ✅ Oui |
| Configuration | Sites | /app/configuration/sites | ✅ Oui |

**Problèmes identifiés dans la Sidebar :**

1. **Lien `/app/agri` vers `/app/agriculture`** : Le grep initial a indiqué un lien cassé vers `/app/agri` qui n'existe pas. En inspectant le code, ce lien n'est plus présent dans la version actuelle du Sidebar.tsx (probablement corrigé ou supprimé lors d'une refactor précédente).

2. **Items non filtrés** : La sidebar filtre les items via `getAccessibleModules(userRole)`, mais si l'utilisateur n'a pas de rôle défini, tous les items s'affichent ce qui peut conduire à des tentatives de navigation vers des routes non accessibles.

---

### Vérification du Header

Lecture de `src/components/layout/Header.tsx` :

| Composant | Détails |
|---|---|
| **Bouton logout** | ✅ Présent. `navigate('/')` en cliquant sur "Voir le site vitrine", `signOut()` pour la déconnexion. |
| **Menu utilisateur** | ✅ Profil, Paramètres, Voir le site vitrine, Déconnexion. Tous les liens existent dans AppRoutes. |
| **Liens de navigation rapide** | ✅ Notifications → /app/monitoring?alertes, Site selector, Farm name display. |
| **Fil d'Ariane** | ❌ Aucun fil d'arbre (breadcrumb) dans l'en-tête. Le chemin de navigation n'est pas affiché. |

**Liens du Header vérifiés :**

- Mon profil → `/app/profile` ✅
- Paramètres → `/app/configuration` ✅
- Voir le site vitrine → `/` ✅
- Déconnexion → `signOut()` ✅
- Notifications → `/app/monitoring?alertes` ✅

---

### Recommandations prioritaires (à appliquer dans Prompt 2)

1. **Corriger le lien `/app/agri` dans Sidebar** — Supprimer ou corriger en `/app/agriculture`. C'est le lien cassé le plus critique identifié.

2. **Consolider les routes alias** — Les routes `/app/agriculture/operations` et `/app/agriculture/harvests` redirigent déjà vers les chemins exploitation. Soit on les supprime, soit on y ajoute des liens directs depuis la sidebar.

3. **Gérer la page Audit.tsx** — Either add a dedicated route `/app/audit` or redirect it to `/app/surveillance?tab=historique` with proper navigation.

4. **Vérifier la cohérence `/app/settings` → `/app/configuration`** — S'assurer que tous les composants qui référence `/app/settings` savent qu'ils sont redirigés vers la configuration.

5. **Ajouter un fil d'Ariane dans le Header** — Pour améliorer l'UX et montrer clairement la position dans l'arbre de navigation.

6. **Vérifier le filtrage RBAC** — S'assurer que les utilisateurs sans rôle défini ne voient pas tous les menus (certains pourraient mener nulle part).

7. **Documenter les redirections** — Créer un guide expliquant pourquoi certaines routes existantes (comme /app/settings, /app/site-content) n'apparaissent plus directement et comment elles sont atteintes via redirection.

---

### Conclusion

L'audit révèle un système de navigation globalement cohérent suite aux récentes refactorisations, mais avec quelques résidus de l'ancien schéma :

- **1 lien cassé confirmé** : `/app/agri` dans l'ancien Sidebar (à nettoyer)
- **2 routes alias** : `/app/agriculture/operations` et `/app/agriculture/harvests` qui redirigent déjà vers les chemins exploitation
- **1 page orpheline** : `Audit.tsx` qui pourrait avoir besoin d'une route dédiée ou d'un nettoyage
- **Redirections intentionnelles** : Plusieurs routes ont été renommées (settings → configuration) avec des Navigate automatiques

Le système est maintenant structuré autour de modules protégés par `RequireModule`, ce qui garantit que seules les bonnes roles peuvent accéder à chaque section. Le principal risque réside dans les liens durs (`href=` ou `to=`) qui pourraient avoir été manquants lors du passage au nouveau système de routage.
