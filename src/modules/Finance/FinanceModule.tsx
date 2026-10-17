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
  const { tab = 'treasury' } = Object.fromEntries(new URLSearchParams(window.location.search));

  const treasuryData = useTreasuryTransactions();
  const fundingsData = useFundings();
  const expensesData = useExpenses();
  const documentsData = useDocuments();

  return (
    <div className="space-y-6">
      <div className="flex bg-gray-50 p-4 rounded-lg shadow-sm">
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === 'treasury' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          onClick={() => {
            const params = new URLSearchParams(window.location.search);
            params.set('tab', 'treasury');
            window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
          }}
        >
          Trésorerie
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === 'fundings' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          onClick={() => {
            const params = new URLSearchParams(window.location.search);
            params.set('tab', 'fundings');
            window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
          }}
        >
          Financements
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === 'expenses' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          onClick={() => {
            const params = new URLSearchParams(window.location.search);
            params.set('tab', 'expenses');
            window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
          }}
        >
          Dépenses
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === 'documents' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          onClick={() => {
            const params = new URLSearchParams(window.location.search);
            params.set('tab', 'documents');
            window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
          }}
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