import { useParams, useSearchParams } from 'react-router-dom';
import { useTreasuryTransactions } from '@/modules/Finance/hooks/useFinanceData';
import { useFundings } from '@/modules/Finance/hooks/useFinanceData';
import { useExpenses } from '@/modules/Finance/hooks/useFinanceData';
import { useDocuments } from '@/modules/Finance/hooks/useFinanceData';
import { TreasuryTab } from '@/modules/Finance/tabs/TreasuryTab';
import { FundingsTab } from '@/modules/Finance/tabs/FundingsTab';
import { ExpensesTab } from '@/modules/Finance/tabs/ExpensesTab';
import { DocumentsTab } from '@/modules/Finance/tabs/DocumentsTab';

export const FinanceModule = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'treasury';

  const treasuryData = useTreasuryTransactions();
  const fundingsData = useFundings();
  const expensesData = useExpenses();
  const documentsData = useDocuments();

  return (
    <div className="space-y-6">
      <div className="flex bg-gray-50 p-4 rounded-lg shadow-sm">
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === 'treasury' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          onClick={() => setSearchParams({ tab: 'treasury' })}
        >
          Trésorerie
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === 'fundings' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          onClick={() => setSearchParams({ tab: 'fundings' })}
        >
          Financements
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === 'expenses' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          onClick={() => setSearchParams({ tab: 'expenses' })}
        >
          Dépenses
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === 'documents' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          onClick={() => setSearchParams({ tab: 'documents' })}
        >
          Justificatifs
        </button>
      </div>

      {tab === 'treasury' && <TreasuryTab treasuryData={treasuryData} />}
      {tab === 'fundings' && <FundingsTab fundingsData={fundingsData} />}
      {tab === 'expenses' && <ExpensesTab expensesData={expensesData} />}
      {tab === 'documents' && <DocumentsTab documentsData={documentsData} />}
    </div>
  );
};