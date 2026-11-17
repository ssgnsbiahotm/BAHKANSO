import { useExpenses } from '@/modules/Finance/hooks/useFinanceData';
import { ExpensesTab } from '@/modules/Finance/tabs/ExpensesTab';
import { RequireModule } from '@/routes/authGuard';
import { PageHeader } from '@/components/ui/PageHeader';

export const DepensesPage = () => {
  const expensesData = useExpenses();

  return (
    <RequireModule module="finance" action="read">
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        <PageHeader title="Dépenses" subtitle="Gestion des dépenses de l'exploitation" />
        <ExpensesTab expensesData={expensesData} />
      </div>
    </RequireModule>
  );
};

export default DepensesPage;
