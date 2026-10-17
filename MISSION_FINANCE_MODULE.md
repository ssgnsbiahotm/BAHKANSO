MISSION : FUSION DES MODULES FINANCIERS EN UN MODULE UNIFIÉ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Les 4 modules suivants sont actuellement non fonctionnels et dispersés :
- src/modules/FinancialManagement/Fundings.tsx       → Financements
- src/modules/FinancialManagement/Treasury.tsx       → Trésorerie
- src/modules/FinancialManagement/Expenses.tsx       → Dépenses
- src/modules/FinancialManagement/Documents.tsx      → Justificatifs
- src/modules/FinancialManagement/FundingCreate.tsx  → Formulaire Financement
- src/modules/FinancialManagement/CashManage.tsx     → Gestion Caisse
- src/modules/FinancialManagement/DocumentManage.tsx → Gestion Justificatif

Ils doivent être FUSIONNÉS en un seul module intelligent et 100% fonctionnel.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OBJECTIF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Créer un module unique : src/modules/Finance/

Ce module expose UN seul composant principal <FinanceModule />
avec navigation par onglets internes (tabs) :
  [Trésorerie] [Financements] [Dépenses] [Justificatifs]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARCHITECTURE CIBLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

src/modules/Finance/
├── index.ts                    ← export { FinanceModule }
├── FinanceModule.tsx           ← Composant principal + système d'onglets
├── hooks/
│   └── useFinanceData.ts       ← Hook partagé : fetch de toutes les données financières
├── tabs/
│   ├── TreasuryTab.tsx         ← Contenu onglet Trésorerie (+ modal CashManage intégré)
│   ├── FundingsTab.tsx         ← Contenu onglet Financements (+ modal FundingCreate intégré)
│   ├── ExpensesTab.tsx         ← Contenu onglet Dépenses
│   └── DocumentsTab.tsx        ← Contenu onglet Justificatifs (+ modal DocumentManage intégré)
└── types.ts                    ← Types locaux Finance si nécessaire

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RÈGLES DE DÉVELOPPEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. HOOKS EXISTANTS — Réutiliser obligatoirement :
   - useAsyncAction    (src/hooks/useAsyncAction.ts)     → toutes les actions async
   - usePaginatedQuery (src/hooks/usePaginatedQuery.ts)  → toutes les listes paginées
   - DataContext       (src/lib/DataContext.tsx)          → source de données unique

2. TYPESCRIPT — Aucune erreur tsc tolérée.
   Vérification finale : npm run typecheck doit passer sans erreur.

3. MODALS — CashManage, FundingCreate, DocumentManage ne sont plus des pages
   distinctes. Ils deviennent des modals/drawers intégrés dans leur onglet parent.
   Supprimer leurs routes indépendantes.

4. ÉTAT PARTAGÉ — L'onglet actif est géré par URL via searchParams :
   /finance?tab=treasury    → onglet Trésorerie (défaut)
   /finance?tab=fundings    → onglet Financements
   /finance?tab=expenses    → onglet Dépenses
   /finance?tab=documents   → onglet Justificatifs

5. STYLE — Utiliser exclusivement les composants UI existants :
   DataTable, KpiCard, ValidatedForm (src/components/ui/)
   Ne pas créer de nouveaux composants UI de base.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODIFICATIONS REQUISES DANS AppRoutes.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AVANT (7 routes séparées) :
  { path: 'treasury',          element: <Treasury /> },
  { path: 'treasury/cash',     element: <CashManage /> },
  { path: 'expenses',          element: <Expenses /> },
  { path: 'documents',         element: <Documents /> },
  { path: 'documents/manage',  element: <DocumentManage /> },
  { path: 'fundings',          element: <Fundings /> },
  { path: 'fundings/new',      element: <FundingCreate /> },

APRÈS (1 seule route) :
  { path: 'finance',           element: <FinanceModule /> },

Mettre à jour aussi tous les liens de navigation dans :
  src/components/layout/Sidebar.tsx

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUPPRESSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Supprimer entièrement :
  src/modules/FinancialManagement/   (tout le dossier)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITÈRES DE SUCCÈS — À VÉRIFIER DANS L'ORDRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ ] npm run typecheck   → 0 erreur TypeScript
[ ] npm run build       → build réussi, 0 erreur
[ ] Route /finance      → affiche FinanceModule avec 4 onglets
[ ] Onglet Trésorerie   → liste des entrées/sorties, bouton "Nouvelle opération" ouvre modal
[ ] Onglet Financements → liste des financements, bouton "Nouveau financement" ouvre modal
[ ] Onglet Dépenses     → liste des dépenses avec filtres
[ ] Onglet Justificatifs→ liste des documents, bouton "Gérer" ouvre modal
[ ] Navigation Sidebar  → liens Finance mis à jour, anciens liens supprimés
[ ] Aucune import mort  → grep -r "FinancialManagement" src/ → 0 résultat

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDRE D'EXÉCUTION RECOMMANDÉ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Créer src/modules/Finance/hooks/useFinanceData.ts
2. Créer src/modules/Finance/tabs/ (4 fichiers)
3. Créer src/modules/Finance/FinanceModule.tsx
4. Créer src/modules/Finance/index.ts
5. Mettre à jour src/routes/AppRoutes.tsx
6. Mettre à jour src/components/layout/Sidebar.tsx
7. Supprimer src/modules/FinancialManagement/
8. Exécuter npm run typecheck && npm run build
