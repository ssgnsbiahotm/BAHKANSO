import { useSearchParams } from 'react-router-dom';
import '@/styles/theme-app.css';
import { RequireModule } from '@/routes/authGuard';
import { useFundings } from '@/modules/Finance/hooks/useFinanceData';
import { useExpenses } from '@/modules/Finance/hooks/useFinanceData';
import { useDocuments } from '@/modules/Finance/hooks/useFinanceData';
import { useTreasuryTransactions } from '@/modules/Finance/hooks/useFinanceData';
import { FundingsTab } from '@/modules/Finance/tabs/FundingsTab';
import { ExpensesTab } from '@/modules/Finance/tabs/ExpensesTab';
import { DocumentsTab } from '@/modules/Finance/tabs/DocumentsTab';
import { TreasuryTab } from '@/modules/Finance/tabs/TreasuryTab';
import { SalesModule } from '@/modules/Sales/SalesModule';
import { ModuleFinanceView } from '@/modules/Finance/tabs/ModuleFinanceView';

export const FinanceModule = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'fundings';

  const fundingsData = useFundings();
  const expensesData = useExpenses();
  const documentsData = useDocuments();
  const treasuryData = useTreasuryTransactions();

  const tabs = [
    { key: 'fundings', label: 'Financements' },
    { key: 'expenses', label: 'Dépenses' },
    { key: 'documents', label: 'Documents' },
    { key: 'treasury', label: 'Trésorerie' },
    { key: 'by-module', label: 'Par module' },
    { key: 'ventes', label: 'Ventes' },
  ] as const;

  return (
    <RequireModule module="finance" action="read">
      <div className="module-page">
        <header className="module-header">
          <div className="module-header-left">
            <h1 style={{ color: 'var(--color-ivory)' }}>Finance</h1>
            <p className="module-subtitle">
              Gestion des financements, dépenses, documents et trésorerie
            </p>
          </div>
        </header>

        <div className="module-tabs" role="tablist" aria-label="Sections Finance">
          {tabs.map(t => (
            <button
              key={t.key}
              id={`finance-tab-${t.key}`}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              tabIndex={tab === t.key ? 0 : -1}
              className={`module-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setSearchParams({ tab: t.key })}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'fundings' && <FundingsTab fundingsData={fundingsData} />}
        {tab === 'expenses' && <ExpensesTab expensesData={expensesData} />}
        {tab === 'documents' && <DocumentsTab documentsData={documentsData} />}
        {tab === 'treasury' && <TreasuryTab treasuryData={treasuryData} />}
        {tab === 'by-module' && <ModuleFinanceView expensesData={expensesData} fundingsData={fundingsData} />}
        {tab === 'ventes' && <SalesModule />}
      </div>
    </RequireModule>
  );
};