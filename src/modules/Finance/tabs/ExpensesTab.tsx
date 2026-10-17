import { List, CreditCard } from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import { DataTable } from '@/components/ui/DataTable';
import type { Expense } from '@/lib/types';
import { useExpenses } from '@/modules/Finance/hooks/useFinanceData';

interface ExpensesTabProps {
  expensesData: ReturnType<typeof useExpenses>;
}

export const ExpensesTab = ({ expensesData }: ExpensesTabProps) => {
  const { data, loading, error } = expensesData;

  if (loading) return <div className="text-center py-10">Chargement...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Erreur lors du chargement des données</div>;

  const rows = data ?? [];

  const total = rows.reduce((sum, e) => sum + e.amount_paid, 0);
  const ceMois = rows.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).reduce((sum, e) => sum + e.amount_paid, 0);
  const avecJustificatif = rows.filter(e => e.has_justificatif).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Dépenses" value={String(total)} icon={<CreditCard size={20} />} trend={-5} />
        <KpiCard label="Dépenses ce mois" value={String(ceMois)} icon={<CreditCard size={20} />} trend={-5} />
        <KpiCard label="Avec Justificatif" value={String(avecJustificatif)} icon={<List size={20} />} trend={3} />
        <KpiCard label="Dépenses" value={String(rows.length)} icon={<List size={20} />} trend={0} />
      </div>

      <DataTable
        columns={[
          { key: 'date', label: 'Date', render: (row: Expense) => row.date },
          { key: 'reference', label: 'Référence', render: (row: Expense) => row.reference ?? '-' },
          { key: 'supplier.name', label: 'Fournisseur', render: (row: Expense) => row.supplier?.name ?? '-' },
          { key: 'amount', label: 'Montant', render: (row: Expense) => `${row.amount} ${row.currency}`, align: 'right' },
          { key: 'currency', label: 'Devise', render: (row: Expense) => row.currency },
          { key: 'category', label: 'Catégorie', render: (row: Expense) => row.category ?? '-' },
          { key: 'responsible', label: 'Responsable', render: (row: Expense) => row.responsible ?? '-' },
          { key: 'payment_method', label: 'Méthode Paiement', render: (row: Expense) => row.payment_method },
          { key: 'status', label: 'Statut', render: (row: Expense) => row.status },
          { key: 'has_justificatif', label: 'Justificatif', render: (row: Expense) => row.has_justificatif ? 'Oui' : 'Non' },
        ]}
        data={rows}
        rowKey={(row: Expense) => row.id}
        searchKeys={(row: Expense) => `${row.reference ?? ''} ${row.supplier?.name ?? ''} ${row.category ?? ''} ${row.responsible ?? ''}`}
        onRowClick={() => {}}
        pageSize={10}
      />
    </div>
  );
};
