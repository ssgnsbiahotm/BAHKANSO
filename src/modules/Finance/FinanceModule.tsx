import { useSearchParams } from 'react-router-dom';
import { RequireModule } from '@/routes/authGuard';
import { useFundings } from '@/modules/Finance/hooks/useFinanceData';
import { useExpenses } from '@/modules/Finance/hooks/useFinanceData';
import { useDocuments } from '@/modules/Finance/hooks/useFinanceData';
import { useTreasuryTransactions } from '@/modules/Finance/hooks/useFinanceData';
import { FundingsTab } from '@/modules/Finance/tabs/FundingsTab';
import { ExpensesTab } from '@/modules/Finance/tabs/ExpensesTab';
import { DocumentsTab } from '@/modules/Finance/tabs/DocumentsTab';
import { TreasuryTab } from '@/modules/Finance/tabs/TreasuryTab';
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
  ] as const;

  return (
    <RequireModule module="finance" action="read">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-1 bg-gray-50 p-2 rounded-lg shadow-sm">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === t.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
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
      </div>
    </RequireModule>
  );
};