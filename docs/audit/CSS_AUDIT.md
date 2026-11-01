# BAHKANSO — Audit CSS / Design System

**Généré le** : 2026-11-01 17:12  
**Fichiers scannés** : 123 (115 TSX/TS, 8 CSS)

## Résumé exécutif

| Métrique | Total | Statut |
|---|---|---|
| Couleurs hardcodées | 208 | 🔴 |
| Classes Tailwind par défaut | 363 | 🔴 |
| Styles inline `style={{...}}` | 277 | 🔴 |
| Variables CSS non définies | 0 | 🟢 |
| Variables CSS non utilisées | 45 | 🟡 |
| Classes CSS orphelines | 677 | 🟠 |

## 🎨 Couleurs hardcodées

### Top 10 fichiers

| Fichier | Occurrences |
|---|---|
| `src/styles/tokens.css` | 38 |
| `docs/pattern-hub/module-theme.css` | 33 |
| `src/pages/SiteContentEditor.tsx` | 20 |
| `docs/pattern-hub/ParcellesPage.model.tsx` | 16 |
| `src/pages/Configuration.tsx` | 15 |
| `src/pages/LandingPage.tsx` | 13 |
| `src/lib/constants.ts` | 11 |
| `src/styles/theme-app.css` | 11 |
| `src/styles/theme-editorial.css` | 7 |
| `src/pages/LandingPagePrototype.tsx` | 6 |

### 30 premières occurrences

| Fichier | Ligne | Couleur | Type |
|---|---|---|---|
| `vite.config.ts` | 17 | `#B9D86B` | hex |
| `vite.config.ts` | 18 | `#F4F1E8` | hex |
| `src/lib/constants.ts` | 2 | `#166534` | hex |
| `src/lib/constants.ts` | 3 | `#22C55E` | hex |
| `src/lib/constants.ts` | 4 | `#DCFCE7` | hex |
| `src/lib/constants.ts` | 5 | `#2563EB` | hex |
| `src/lib/constants.ts` | 6 | `#DBEAFE` | hex |
| `src/lib/constants.ts` | 7 | `#F59E0B` | hex |
| `src/lib/constants.ts` | 8 | `#DC2626` | hex |
| `src/lib/constants.ts` | 9 | `#F8FAFC` | hex |
| `src/lib/constants.ts` | 10 | `#334155` | hex |
| `src/lib/constants.ts` | 11 | `#0F172A` | hex |
| `src/lib/constants.ts` | 12 | `#FFFFFF` | hex |
| `src/pages/Inventory.tsx` | 78 | `#2E7D32` | hex |
| `src/pages/Inventory.tsx` | 79 | `#0277BD` | hex |
| `src/pages/Inventory.tsx` | 80 | `#C62828` | hex |
| `src/pages/Inventory.tsx` | 81 | `#F57F17` | hex |
| `src/pages/LoginPage.tsx` | 358 | `#FFFFFF` | hex |
| `src/pages/LoginPage.tsx` | 359 | `#16A34A` | hex |
| `src/pages/SiteContentEditor.tsx` | 20 | `#16A34A` | hex |
| `src/pages/SiteContentEditor.tsx` | 20 | `#15803D` | hex |
| `src/pages/SiteContentEditor.tsx` | 20 | `#22C55E` | hex |
| `src/pages/SiteContentEditor.tsx` | 20 | `#2563EB` | hex |
| `src/pages/SiteContentEditor.tsx` | 20 | `#1D4ED8` | hex |
| `src/pages/SiteContentEditor.tsx` | 20 | `#F59E0B` | hex |
| `src/pages/SiteContentEditor.tsx` | 21 | `#DC2626` | hex |
| `src/pages/SiteContentEditor.tsx` | 21 | `#7C3AED` | hex |
| `src/pages/SiteContentEditor.tsx` | 21 | `#0891B2` | hex |
| `src/pages/SiteContentEditor.tsx` | 21 | `#EA580C` | hex |
| `src/pages/SiteContentEditor.tsx` | 21 | `#0F172A` | hex |

## 🎨 Classes Tailwind par défaut

### Background (148)

| Fichier | Ligne | Classe |
|---|---|---|
| `src/lib/Toast.tsx` | 37 | `bg-green-600` |
| `src/lib/Toast.tsx` | 39 | `bg-blue-600` |
| `src/lib/Toast.tsx` | 40 | `bg-amber-500` |
| `src/pages/UsersPage.tsx` | 209 | `bg-green-600` |
| `src/pages/UsersPage.tsx` | 209 | `hover:bg-green-700` |
| `src/pages/UsersPage.tsx` | 218 | `bg-amber-50` |
| `src/pages/UsersPage.tsx` | 235 | `bg-green-600` |
| `src/pages/UsersPage.tsx` | 269 | `hover:bg-red-50` |
| `src/pages/UsersPage.tsx` | 287 | `bg-green-500` |
| `src/pages/UsersPage.tsx` | 302 | `bg-green-600` |
| `src/pages/UsersPage.tsx` | 302 | `hover:bg-green-700` |
| `src/pages/UsersPage.tsx` | 331 | `bg-blue-50` |
| `src/pages/UsersPage.tsx` | 357 | `bg-red-600` |
| `src/pages/UsersPage.tsx` | 357 | `hover:bg-red-700` |
| `src/pages/Monitoring.tsx` | 185 | `bg-cyan-50` |

*... et 133 autres.*

### Text (173)

| Fichier | Ligne | Classe |
|---|---|---|
| `src/pages/UsersPage.tsx` | 218 | `text-amber-800` |
| `src/pages/UsersPage.tsx` | 269 | `text-red-600` |
| `src/pages/UsersPage.tsx` | 331 | `text-blue-700` |
| `src/pages/SettingsPage.tsx` | 214 | `text-slate-300` |
| `src/pages/Monitoring.tsx` | 185 | `text-cyan-600` |
| `src/pages/SiteContentEditor.tsx` | 849 | `text-red-500` |
| `src/pages/SiteContentEditor.tsx` | 852 | `text-green-600` |
| `src/pages/SiteContentEditor.tsx` | 867 | `text-red-500` |
| `src/pages/SiteContentEditor.tsx` | 870 | `text-green-600` |
| `src/pages/SiteContentEditor.tsx` | 895 | `text-red-500` |
| `src/pages/SiteContentEditor.tsx` | 908 | `text-red-500` |
| `src/pages/SiteContentEditor.tsx` | 926 | `text-red-500` |
| `src/pages/SiteContentEditor.tsx` | 929 | `text-green-600` |
| `src/pages/SiteContentEditor.tsx` | 938 | `text-amber-700` |
| `src/pages/SiteContentEditor.tsx` | 944 | `text-blue-700` |

*... et 158 autres.*

### Border (36)

| Fichier | Ligne | Classe |
|---|---|---|
| `src/lib/constants.ts` | 27 | `border-gray-300` |
| `src/lib/constants.ts` | 48 | `border-gray-300` |
| `src/lib/constants.ts` | 66 | `border-gray-300` |
| `src/lib/constants.ts` | 84 | `border-gray-300` |
| `src/lib/constants.ts` | 216 | `border-gray-300` |
| `src/lib/constants.ts` | 255 | `border-gray-300` |
| `src/pages/UsersPage.tsx` | 218 | `border-amber-200` |
| `src/pages/UsersPage.tsx` | 269 | `border-red-200` |
| `src/pages/UsersPage.tsx` | 331 | `border-blue-100` |
| `src/pages/SiteContentEditor.tsx` | 938 | `border-amber-200` |
| `src/pages/SiteContentEditor.tsx` | 944 | `border-blue-200` |
| `src/pages/Configuration.tsx` | 852 | `border-green-300` |
| `src/pages/Configuration.tsx` | 852 | `border-blue-300` |
| `src/pages/Configuration.tsx` | 1034 | `border-red-200` |
| `src/pages/Configuration.tsx` | 1078 | `border-red-200` |

*... et 21 autres.*

### Ring (6)

| Fichier | Ligne | Classe |
|---|---|---|
| `src/pages/Configuration.tsx` | 1521 | `focus:ring-red-500` |
| `src/pages/surveillance/tabs/AlertesTab.tsx` | 282 | `focus:ring-slate-500` |
| `src/pages/surveillance/tabs/HistoriqueTab.tsx` | 211 | `focus:ring-blue-500` |
| `src/pages/surveillance/tabs/HistoriqueTab.tsx` | 246 | `ring-red-500` |
| `src/pages/surveillance/tabs/EvenementsTab.tsx` | 221 | `focus:ring-blue-500` |
| `src/pages/surveillance/tabs/EvenementsTab.tsx` | 235 | `focus:ring-blue-500` |

## 🎨 Styles inline

| Fichier | Occurrences |
|---|---|
| `src/pages/LandingPage.tsx` | 105 |
| `src/pages/LandingPagePrototype.tsx` | 56 |
| `src/pages/Projects.tsx` | 22 |
| `src/modules/Finance/tabs/FundingsTab.tsx` | 15 |
| `docs/pattern-hub/ParcellesPage.model.tsx` | 12 |
| `src/pages/Dashboard.tsx` | 8 |
| `src/pages/LoginPage.tsx` | 6 |
| `src/components/ui/Charts.tsx` | 6 |
| `src/pages/surveillance/tabs/EvenementsTab.tsx` | 6 |
| `src/modules/Finance/tabs/DocumentsTab.tsx` | 6 |

## 🎨 Classes CSS orphelines (677)

*Définies mais jamais utilisées dans les TSX.*

| Classe | Définie dans |
|---|---|
| `.AnimalEventManage` | `src/routes/AppRoutes.tsx:36` |
| `.AnimauxPage` | `src/routes/AppRoutes.tsx:48` |
| `.BailleursPage` | `src/routes/AppRoutes.tsx:50` |
| `.ButtonHTMLAttributes` | `src/test/setup.tsx:128` |
| `.CI` | `playwright.config.ts:12` |
| `.CONTENU_SECTIONS` | `src/pages/Configuration.tsx:330` |
| `.CSSProperties` | `src/pages/Projects.tsx:303` |
| `.CampagnesPage` | `src/routes/AppRoutes.tsx:88` |
| `.ChangeEvent` | `src/pages/Configuration.tsx:563` |
| `.ClientsPage` | `src/routes/AppRoutes.tsx:54` |
| `.Confidentialite` | `src/routes/AppRoutes.tsx:23` |
| `.Configuration` | `src/routes/AppRoutes.tsx:26` |
| `.Dashboard` | `src/routes/AppRoutes.tsx:24` |
| `.EXPLOITATION_SECTIONS` | `src/pages/Configuration.tsx:330` |
| `.ElevageModule` | `src/routes/AppRoutes.tsx:30` |
| `.ExploitationModule` | `src/routes/AppRoutes.tsx:29` |
| `.FinanceModule` | `src/routes/AppRoutes.tsx:35` |
| `.FormEvent` | `src/pages/LoginPage.tsx:271` |
| `.HTMLAttributes` | `src/test/setup.tsx:134` |
| `.InputHTMLAttributes` | `src/test/setup.tsx:131` |
| `.Inventory` | `src/routes/AppRoutes.tsx:31` |
| `.JournalCulturePage` | `src/routes/AppRoutes.tsx:43` |
| `.KeyboardEvent` | `src/components/ui/FormSimplifie.tsx:93` |
| `.LabelHTMLAttributes` | `src/test/setup.tsx:141` |
| `.LandingPage` | `src/routes/AppRoutes.tsx:19` |
| `.LandingPagePrototype` | `src/routes/AppRoutes.tsx:20` |
| `.LoginPage` | `src/routes/AppRoutes.tsx:21` |
| `.LotsPage` | `src/routes/AppRoutes.tsx:46` |
| `.Media` | `src/routes/AppRoutes.tsx:34` |
| `.MentionsLegales` | `src/routes/AppRoutes.tsx:22` |

## 📋 Plan d'action

- 🔴 **P0** — Remplacer les 208 couleurs hardcodées
- 🟠 **P1** — Migrer les 363 classes Tailwind par défaut
- 🟠 **P1** — Convertir les 277 styles inline
- 🟡 **P2** — Nettoyer les 677 classes orphelines
