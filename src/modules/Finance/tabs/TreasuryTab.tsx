import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, CreditCard, Wallet, List, Plus } from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { ValidatedForm } from '@/components/ui/ValidatedForm';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import type { Transaction } from '@/lib/types';
import { useTreasuryTransactions } from '@/modules/Finance/hooks/useFinanceData';

interface TreasuryTabProps {
  treasuryData: ReturnType<typeof useTreasuryTransactions>;
}

// Schéma de validation pour la création d'une opération de trésorerie
const transactionSchema = z.object({
  reference: z.string().min(1, 'Référence obligatoire'),
  type: z.string().min(1, 'Type obligatoire'),
  amount: z.number().positive('Montant doit être positif'),
  currency: z.string().min(1, 'Devise obligatoire'),
  direction: z.enum(['entrée', 'sortie']),
  bank_account_id: z.string().nullable(),
  cash_account_id: z.string().nullable(),
  description: z.string().nullable(),
  transaction_date: z.string().min(1, 'Date obligatoire'),
});

interface TransactionFormValues {
  reference: string;
  type: string;
  amount: number;
  currency: string;
  direction: 'entrée' | 'sortie';
  bank_account_id: string | null;
  cash_account_id: string | null;
  description: string | null;
  transaction_date: string;
}

export const TreasuryTab = ({ treasuryData }: TreasuryTabProps) => {
  const { data, loading, error, refetch } = treasuryData;
  const { executeAction, loading: actionLoading } = useAsyncAction();
  const [modalOpen, setModalOpen] = useState(false);

  const form = ValidatedForm<TransactionFormValues>({
    schema: transactionSchema,
    defaultValues: {
      reference: '',
      type: '',
      amount: 0,
      currency: 'FCFA',
      direction: 'entrée',
      bank_account_id: null,
      cash_account_id: null,
      description: null,
      transaction_date: new Date().toISOString().slice(0, 16),
    },
    onSubmit: async (values) => {
      await executeAction(async () => {
        const { error: insertError } = await supabase
          .from('transactions')
          .insert([{
            reference: values.reference,
            type: values.type,
            amount: values.amount,
            currency: values.currency,
            direction: values.direction,
            bank_account_id: values.bank_account_id,
            cash_account_id: values.cash_account_id,
            description: values.description,
            transaction_date: values.transaction_date,
          }]);
        if (insertError) throw insertError;
      }, {
        successMessage: 'Opération créée avec succès',
        errorMessage: 'Échec de la création de l\'opération',
        onSuccess: () => {
          setModalOpen(false);
          refetch();
        },
      });
    },
  });

  const handleNewTransaction = () => {
    form.resetForm();
    setModalOpen(true);
  };

  if (loading) return <div className="text-center py-10">Chargement...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Erreur lors du chargement des données</div>;

  const rows = data ?? [];

  const solde = rows.reduce((sum, t) => sum + (t.direction === 'entrée' ? t.amount : -t.amount), 0);
  const entrees = rows.filter(t => t.direction === 'entrée').reduce((sum, t) => sum + t.amount, 0);
  const sorties = rows.filter(t => t.direction === 'sortie').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Solde Total" value={String(solde)} icon={<Wallet size={20} />} trend={solde >= 0 ? 5 : -5} />
        <KpiCard label="Entrées" value={String(entrees)} icon={<Plus size={20} />} trend={3} />
        <KpiCard label="Sorties" value={String(sorties)} icon={<Minus size={20} />} trend={-3} />
        <KpiCard label="Transactions" value={String(rows.length)} icon={<List size={20} />} trend={0} />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNewTransaction}
          disabled={actionLoading || form.isSubmitting}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {actionLoading || form.isSubmitting ? 'Chargement...' : 'Nouvelle opération'}
        </button>
      </div>

      <DataTable
        columns={[
          { key: 'transaction_date', label: 'Date', render: (row: Transaction) => row.transaction_date },
          { key: 'reference', label: 'Référence', render: (row: Transaction) => row.reference ?? '-' },
          { key: 'type', label: 'Type', render: (row: Transaction) => row.type },
          { key: 'amount', label: 'Montant', render: (row: Transaction) => `${row.amount} ${row.currency}`, align: 'right' },
          { key: 'currency', label: 'Devise', render: (row: Transaction) => row.currency },
          { key: 'direction', label: 'Direction', render: (row: Transaction) => row.direction },
          { key: 'description', label: 'Description', render: (row: Transaction) => row.description ?? '-' },
          { key: 'bank_account_id', label: 'Compte Banque', render: (row: Transaction) => row.bank_account_id ?? '-' },
          { key: 'cash_account_id', label: 'Compte Caisse', render: (row: Transaction) => row.cash_account_id ?? '-' },
        ]}
        data={rows}
        rowKey={(row: Transaction) => row.id}
        searchKeys={(row: Transaction) => `${row.reference ?? ''} ${row.type} ${row.description ?? ''}`}
        onRowClick={() => {}}
        pageSize={10}
      />

      {/* Modal CashManage — création d'opération de trésorerie */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nouvelle opération de trésorerie"
        size="md"
      >
        <form onSubmit={form.handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Référence *</label>
            <input
              type="text"
              value={form.values.reference}
              onChange={(e) => form.setFieldValue('reference', e.target.value)}
              className="form-input w-full"
              placeholder="OP-2024-0001"
            />
            {form.errors.reference && <p className="text-xs text-red-500 mt-1">{form.errors.reference}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
              <input
                type="text"
                value={form.values.type}
                onChange={(e) => form.setFieldValue('type', e.target.value)}
                className="form-input w-full"
                placeholder="Virement"
              />
              {form.errors.type && <p className="text-xs text-red-500 mt-1">{form.errors.type}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Direction *</label>
              <select
                value={form.values.direction}
                onChange={(e) => form.setFieldValue('direction', e.target.value as 'entrée' | 'sortie')}
                className="form-input w-full"
              >
                <option value="entrée">Entrée</option>
                <option value="sortie">Sortie</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Montant *</label>
              <input
                type="number"
                value={form.values.amount}
                onChange={(e) => form.setFieldValue('amount', parseFloat(e.target.value) || 0)}
                className="form-input w-full"
                placeholder="0"
              />
              {form.errors.amount && <p className="text-xs text-red-500 mt-1">{form.errors.amount}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Devise *</label>
              <input
                type="text"
                value={form.values.currency}
                onChange={(e) => form.setFieldValue('currency', e.target.value)}
                className="form-input w-full"
                placeholder="FCFA"
              />
              {form.errors.currency && <p className="text-xs text-red-500 mt-1">{form.errors.currency}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Compte Banque</label>
            <input
              type="text"
              value={form.values.bank_account_id ?? ''}
              onChange={(e) => form.setFieldValue('bank_account_id', e.target.value || null)}
              className="form-input w-full"
              placeholder="ID du compte bancaire"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Compte Caisse</label>
            <input
              type="text"
              value={form.values.cash_account_id ?? ''}
              onChange={(e) => form.setFieldValue('cash_account_id', e.target.value || null)}
              className="form-input w-full"
              placeholder="ID de la caisse"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <input
              type="text"
              value={form.values.description ?? ''}
              onChange={(e) => form.setFieldValue('description', e.target.value || null)}
              className="form-input w-full"
              placeholder="Libellé de l'opération"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date *</label>
            <input
              type="datetime-local"
              value={form.values.transaction_date}
              onChange={(e) => form.setFieldValue('transaction_date', e.target.value)}
              className="form-input w-full"
            />
            {form.errors.transaction_date && <p className="text-xs text-red-500 mt-1">{form.errors.transaction_date}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!form.isValid || form.isSubmitting}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {form.isSubmitting ? 'Enregistrement...' : 'Créer l\'opération'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
