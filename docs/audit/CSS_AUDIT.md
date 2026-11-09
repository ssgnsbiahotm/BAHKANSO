# BAHKANSO — Audit CSS / Design System

**Généré le** : 2026-11-03 23:06  
**Fichiers scannés** : 123 (115 TSX/TS, 8 CSS)

## Résumé exécutif

| Métrique | Total | Statut |
|---|---|---|
| Couleurs hardcodées | 210 | 🔴 |
| Classes Tailwind par défaut | 313 | 🔴 |
| Styles inline `style={{...}}` | 211 | 🔴 |
| Variables CSS non définies | 1 | 🔴 |
| Variables CSS non utilisées | 48 | 🟡 |
| Classes CSS orphelines | 688 | 🟠 |

## 🔴 Variables CSS utilisées mais NON définies

*Cause de styles cassés silencieux.*

| Variable | Utilisée dans |
|---|---|
| `--border-night-subtle` | src/pages/LandingPage.tsx:440 |

## 🎨 Couleurs hardcodées

### Top 10 fichiers

| Fichier | Occurrences |
|---|---|
| `src/styles/tokens.css` | 41 |
| `docs/pattern-hub/module-theme.css` | 33 |
| `src/lib/constants.ts` | 27 |
| `src/pages/SiteContentEditor.tsx` | 20 |
| `docs/pattern-hub/ParcellesPage.model.tsx` | 16 |
| `src/pages/Configuration.tsx` | 15 |
| `src/styles/components.css` | 14 |
| `src/styles/theme-app.css` | 11 |
| `src/styles/theme-editorial.css` | 7 |
| `src/pages/LandingPagePrototype.tsx` | 6 |

### 30 premières occurrences

| Fichier | Ligne | Couleur | Type |
|---|---|---|---|
| `vite.config.ts` | 17 | `#B9D86B` | hex |
| `vite.config.ts` | 18 | `#F4F1E8` | hex |
| `src/lib/constants.ts` | 2 | `#111A18` | hex |
| `src/lib/constants.ts` | 3 | `#1C2925` | hex |
| `src/lib/constants.ts` | 4 | `#B9D86B` | hex |
| `src/lib/constants.ts` | 5 | `#F4F1E8` | hex |
| `src/lib/constants.ts` | 6 | `#202824` | hex |
| `src/lib/constants.ts` | 7 | `#C87551` | hex |
| `src/lib/constants.ts` | 8 | `#2E7D32` | hex |
| `src/lib/constants.ts` | 9 | `#F57F17` | hex |
| `src/lib/constants.ts` | 10 | `#C62828` | hex |
| `src/lib/constants.ts` | 11 | `#0277BD` | hex |
| `src/lib/constants.ts` | 12 | `#5A6560` | hex |
| `src/lib/constants.ts` | 13 | `#8A948E` | hex |
| `src/lib/constants.ts` | 14 | `#EBE6DA` | hex |
| `src/lib/constants.ts` | 15 | `#DDD5C4` | hex |
| `src/lib/constants.ts` | 16 | `#243430` | hex |
| `src/lib/constants.ts` | 17 | `#202824` | hex |
| `src/lib/constants.ts` | 18 | `#B9D86B` | hex |
| `src/lib/constants.ts` | 19 | `#C87551` | hex |
| `src/lib/constants.ts` | 20 | `#F0F7E0` | hex |
| `src/lib/constants.ts` | 21 | `#0277BD` | hex |
| `src/lib/constants.ts` | 22 | `#DBEAFE` | hex |
| `src/lib/constants.ts` | 23 | `#F57F17` | hex |
| `src/lib/constants.ts` | 24 | `#C62828` | hex |
| `src/lib/constants.ts` | 25 | `#F4F1E8` | hex |
| `src/lib/constants.ts` | 26 | `#5A6560` | hex |
| `src/lib/constants.ts` | 27 | `#111A18` | hex |
| `src/lib/constants.ts` | 28 | `#FFFFFF` | hex |
| `src/pages/Configuration.tsx` | 114 | `#6B8E3A` | hex |

## 🎨 Classes Tailwind par défaut

### Background (126)

| Fichier | Ligne | Classe |
|---|---|---|
| `src/lib/Toast.tsx` | 37 | `bg-green-600` |
| `src/lib/Toast.tsx` | 39 | `bg-blue-600` |
| `src/lib/Toast.tsx` | 40 | `bg-amber-500` |
| `src/pages/Configuration.tsx` | 1034 | `hover:bg-red-50` |
| `src/pages/Configuration.tsx` | 1078 | `hover:bg-red-50` |
| `src/pages/Configuration.tsx` | 1129 | `hover:bg-red-50` |
| `src/pages/SiteContentEditor.tsx` | 849 | `hover:bg-red-50` |
| `src/pages/SiteContentEditor.tsx` | 867 | `hover:bg-red-50` |
| `src/pages/SiteContentEditor.tsx` | 895 | `hover:bg-red-50` |
| `src/pages/SiteContentEditor.tsx` | 908 | `hover:bg-red-50` |
| `src/pages/SiteContentEditor.tsx` | 926 | `hover:bg-red-50` |
| `src/pages/SiteContentEditor.tsx` | 938 | `bg-amber-50` |
| `src/pages/SiteContentEditor.tsx` | 944 | `bg-blue-50` |
| `src/pages/UsersPage.tsx` | 236 | `bg-green-600` |
| `src/pages/UsersPage.tsx` | 270 | `hover:bg-red-50` |

*... et 111 autres.*

### Text (153)

| Fichier | Ligne | Classe |
|---|---|---|
| `src/pages/Configuration.tsx` | 1175 | `text-red-500` |
| `src/pages/Configuration.tsx` | 1195 | `text-red-500` |
| `src/pages/Configuration.tsx` | 1451 | `hover:text-red-800` |
| `src/pages/Configuration.tsx` | 1487 | `hover:text-red-800` |
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
| `src/pages/SettingsPage.tsx` | 217 | `text-slate-300` |

*... et 138 autres.*

### Border (28)

| Fichier | Ligne | Classe |
|---|---|---|
| `src/pages/Configuration.tsx` | 852 | `border-green-300` |
| `src/pages/Configuration.tsx` | 852 | `border-blue-300` |
| `src/pages/Configuration.tsx` | 1034 | `border-red-200` |
| `src/pages/Configuration.tsx` | 1078 | `border-red-200` |
| `src/pages/Configuration.tsx` | 1129 | `border-red-200` |
| `src/pages/Configuration.tsx` | 1521 | `border-red-500` |
| `src/pages/SiteContentEditor.tsx` | 938 | `border-amber-200` |
| `src/pages/SiteContentEditor.tsx` | 944 | `border-blue-200` |
| `src/pages/UsersPage.tsx` | 270 | `border-red-200` |
| `src/pages/UsersPage.tsx` | 332 | `border-blue-100` |
| `src/pages/configuration/BailleursPage.tsx` | 207 | `border-amber-200` |
| `src/pages/surveillance/tabs/AlertesTab.tsx` | 314 | `border-slate-100` |
| `src/pages/surveillance/tabs/EvenementsTab.tsx` | 408 | `border-slate-100` |
| `src/modules/Finance/tabs/FundingsTab.tsx` | 81 | `border-slate-100` |
| `src/modules/Finance/tabs/FundingsTab.tsx` | 162 | `border-slate-100` |

*... et 13 autres.*

### Ring (6)

| Fichier | Ligne | Classe |
|---|---|---|
| `src/pages/Configuration.tsx` | 1521 | `focus:ring-red-500` |
| `src/pages/surveillance/tabs/HistoriqueTab.tsx` | 211 | `focus:ring-blue-500` |
| `src/pages/surveillance/tabs/HistoriqueTab.tsx` | 246 | `ring-red-500` |
| `src/pages/surveillance/tabs/AlertesTab.tsx` | 283 | `focus:ring-slate-500` |
| `src/pages/surveillance/tabs/EvenementsTab.tsx` | 223 | `focus:ring-blue-500` |
| `src/pages/surveillance/tabs/EvenementsTab.tsx` | 237 | `focus:ring-blue-500` |

## 🎨 Styles inline

| Fichier | Occurrences |
|---|---|
| `src/pages/LandingPagePrototype.tsx` | 56 |
| `src/pages/LandingPage.tsx` | 54 |
| `src/pages/Projects.tsx` | 22 |
| `src/modules/Finance/tabs/FundingsTab.tsx` | 15 |
| `docs/pattern-hub/ParcellesPage.model.tsx` | 12 |
| `src/pages/LoginPage.tsx` | 6 |
| `src/components/ui/Charts.tsx` | 6 |
| `src/pages/Configuration.tsx` | 5 |
| `src/components/ui/SkeletonLoader.tsx` | 5 |
| `src/modules/Finance/tabs/TreasuryTab.tsx` | 5 |

## 🎨 Classes CSS orphelines (688)

*Définies mais jamais utilisées dans les TSX.*

| Classe | Définie dans |
|---|---|
| `.Agriculture` | `src/pages/Dashboard.tsx:311` |
| `.AnimalEventManage` | `src/routes/AppRoutes.tsx:36` |
| `.AnimauxPage` | `src/routes/AppRoutes.tsx:48` |
| `.BailleursPage` | `src/routes/AppRoutes.tsx:50` |
| `.ButtonHTMLAttributes` | `src/test/setup.tsx:128` |
| `.CI` | `playwright.config.ts:12` |
| `.CONTENU_SECTIONS` | `src/pages/Configuration.tsx:330` |
| `.CSSProperties` | `src/pages/Projects.tsx:306` |
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

## 📋 Plan d'action

- 🔴 **P0** — Définir/supprimer les 1 variables CSS fantômes
- 🔴 **P0** — Remplacer les 210 couleurs hardcodées
- 🟠 **P1** — Migrer les 313 classes Tailwind par défaut
- 🟠 **P1** — Convertir les 211 styles inline
- 🟡 **P2** — Nettoyer les 688 classes orphelines
