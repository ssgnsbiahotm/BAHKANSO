import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, CreditCard, Wallet, List, Plus, Trash2, Edit2, Eye, ExternalLink, ArrowUp, ArrowDown } from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';
import { ValidatedForm } from '@/components/ui/ValidatedForm';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import type { Transaction } from '@/lib/types';
import { useTreasuryTransactions } from '@/modules/Finance/hooks/useFinanceData';
import { RotatingCard } from '@/components/ui/RotatingCard';
import { formatCurrency, formatDate } from '@/lib/format';

interface TreasuryTabProps {
  treasuryData: ReturnType<typeof useTreasuryTransactions>;
}

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

const DIRECTION_LABELS: Record<string, string> = {
  entrée: 'Entrée',
  sortie: 'Sortie',
};

const DIRECTION_COLORS: Record<string, string> = {
  entrée: 'text-green-700 bg-green-50',
  sortie: 'text-amber-700 bg-amber-50',
};

const TransactionCardFront = ({ transaction, onEdit, onDelete, onView }: {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}) => {
  const isIncome = transaction.direction === 'entrée';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', paddingBottom: '3rem' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{transaction.description || transaction.reference || 'Opération'}</p>
          <p className="text-xs text-slate-500 truncate">{transaction.reference ?? '—'}</p>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${DIRECTION_COLORS[transaction.direction]} flex-shrink-0`}>
          {isIncome ? <ArrowUp size={10} className="inline" /> : <ArrowDown size={10} className="inline" />}
          {DIRECTION_LABELS[transaction.direction] ?? transaction.direction}
        </span>
      </div>
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-500 capitalize">{transaction.type}</span>
        <div className="text-right">
          <p className="text-lg font-bold" style={{ color: isIncome ? '#166534' : '#92400E' }}>
            {formatCurrency(transaction.amount)}
          </p>
          <p className="text-xs text-slate-500">{formatDate(transaction.transaction_date)}</p>
        </div>
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-1 pointer-events-none">
        <button
          onClick={onView}
          className="pointer-events-auto text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 px-2 py-1 bg-white/90 hover:bg-slate-50 rounded border border-slate-200"
          aria-label="Voir les détails"
        >
          <Eye size={12} /> Détail
        </button>
        <div className="flex items-center gap-1 pointer-events-auto">
          <button
            onClick={onEdit}
            className="text-xs text-slate-500 hover:text-green-700 flex items-center gap-1 px-2 py-1 bg-white/90 hover:bg-green-50 rounded border border-slate-200"
            aria-label="Modifier"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-slate-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 bg-white/90 hover:bg-red-50 rounded border border-slate-200"
            aria-label="Supprimer"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

const TransactionCardBack = ({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) => {
  const isIncome = transaction.direction === 'entrée';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', paddingBottom: '3rem', overflow: 'auto' }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">{transaction.description || transaction.reference || 'Opération'}</h3>
          <p className="text-xs text-slate-500">{transaction.reference ?? '—'}</p>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${DIRECTION_COLORS[transaction.direction]} flex-shrink-0`}>
          {isIncome ? <ArrowUp size={10} className="inline" /> : <ArrowDown size={10} className="inline" />}
          {DIRECTION_LABELS[transaction.direction] ?? transaction.direction}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-slate-500">Type</p>
          <p className="font-medium capitalize">{transaction.type}</p>
        </div>
        <div>
          <p className="text-slate-500">Montant</p>
          <p className="font-bold" style={{ color: isIncome ? '#166534' : '#92400E' }}>{formatCurrency(transaction.amount)}</p>
        </div>
        <div>
          <p className="text-slate-500">Devise</p>
          <p className="font-medium">{transaction.currency}</p>
        </div>
        <div>
          <p className="text-slate-500">Date</p>
          <p className="font-medium">{formatDate(transaction.transaction_date)}</p>
        </div>
        <div>
          <p className="text-slate-500">Compte Banque</p>
          <p className="font-medium">{transaction.bank_account_id ?? '—'}</p>
        </div>
        <div>
          <p className="text-slate-500">Compte Caisse</p>
          <p className="font-medium">{transaction.cash_account_id ?? '—'}</p>
        </div>
      </div>
      {transaction.description && (
        <div>
          <p className="text-slate-500 text-sm">Description</p>
          <p className="text-sm">{transaction.description}</p>
        </div>
      )}
      <div className="mt-auto flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          Retour
        </button>
      </div>
    </div>
  );
};

const CreateTransactionCard = ({ onCreate }: { onCreate: () => void }) => (
  <div className="rc" style={{ minHeight: '180px' }}>
    <div className="rc-inner" style={{ transform: 'none' }}>
      <div className="rc-face rc-face--front" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '1rem', padding: '2rem', border: '2px dashed #CBD5E1', background: '#FAFAFA',
        transform: 'rotateY(0deg)', backfaceVisibility: 'hidden'
      }}>
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Plus size={28} className="text-primary" />
        </div>
        <div className="text-center">
          <h4 className="font-semibold text-slate-900">Nouvelle opération</h4>
          <p className="text-sm text-slate-500">Enregistrer une entrée ou sortie</p>
        </div>
        <button
          onClick={onCreate}
          className="mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
        >
          Créer une opération
        </button>
      </div>
    </div>
  </div>
);

export const TreasuryTab = ({ treasuryData }: TreasuryTabProps) => {
  const { data, loading, error, refetch } = treasuryData;
  const { executeAction, loading: actionLoading } = useAsyncAction();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

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
        const transactionData = {
          reference: values.reference,
          type: values.type,
          amount: values.amount,
          currency: values.currency,
          direction: values.direction,
          bank_account_id: values.bank_account_id,
          cash_account_id: values.cash_account_id,
          description: values.description,
          transaction_date: values.transaction_date,
        };

        if (editingTransaction) {
          const { error: updateError } = await supabase
            .from('transactions')
            .update(transactionData)
            .eq('id', editingTransaction.id);
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from('transactions')
            .insert([transactionData]);
          if (insertError) throw insertError;
        }
      }, {
        successMessage: editingTransaction ? 'Opération mise à jour' : 'Opération créée avec succès',
        errorMessage: editingTransaction ? 'Échec de la mise à jour' : 'Échec de la création',
        onSuccess: () => {
          setModalOpen(false);
          setEditingTransaction(null);
          refetch();
        },
      });
    },
  });

  const handleNewTransaction = () => {
    form.resetForm();
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    form.setFieldValues({
      reference: transaction.reference ?? '',
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency,
      direction: transaction.direction as TransactionFormValues['direction'],
      bank_account_id: transaction.bank_account_id ?? null,
      cash_account_id: transaction.cash_account_id ?? null,
      description: transaction.description ?? null,
      transaction_date: transaction.transaction_date ? transaction.transaction_date.slice(0, 16) : new Date().toISOString().slice(0, 16),
    });
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  const handleDelete = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
  };

  const confirmDelete = async () => {
    if (!deletingTransaction) return;
    await executeAction(async () => {
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', deletingTransaction.id);
      if (deleteError) throw deleteError;
    }, {
      successMessage: 'Opération supprimée',
      errorMessage: 'Échec de la suppression',
      onSuccess: () => {
        setDeletingTransaction(null);
        refetch();
      },
    });
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
        <KpiCard label="Solde Total" value={formatCurrency(solde)} icon={<Wallet size={20} />} trend={{ value: solde >= 0 ? '+' : '', positive: solde >= 0 }} />
        <KpiCard label="Entrées" value={formatCurrency(entrees)} icon={<ArrowUp size={20} />} trend={{ value: '+', positive: true }} />
        <KpiCard label="Sorties" value={formatCurrency(sorties)} icon={<ArrowDown size={20} />} trend={{ value: '-', positive: false }} />
        <KpiCard label="Transactions" value={String(rows.length)} icon={<List size={20} />} />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNewTransaction}
          disabled={actionLoading || form.isSubmitting}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={16} /> Nouvelle opération
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ minHeight: '200px' }}>
        {rows.map((transaction) => (
          <RotatingCard
            key={transaction.id}
            flipLabel={`Détail — ${transaction.description || transaction.reference || 'Opération'}`}
            backLabel="Retour"
            front={<TransactionCardFront transaction={transaction} onEdit={() => handleEdit(transaction)} onDelete={() => handleDelete(transaction)} onView={() => handleEdit(transaction)} />}
            back={<TransactionCardBack transaction={transaction} onClose={() => {}} />}
          />
        ))}
        <CreateTransactionCard onCreate={handleNewTransaction} />
      </div>

      {rows.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <CreditCard size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-medium">Aucune opération</p>
          <p className="text-sm">Cliquez sur « Nouvelle opération » pour commencer</p>
        </div>
      )}

      {/* Modal création/édition */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTransaction(null); }}
        title={editingTransaction ? 'Modifier l\'opération' : 'Nouvelle opération de trésorerie'}
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
              onClick={() => { setModalOpen(false); setEditingTransaction(null); }}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!form.isValid || form.isSubmitting}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {form.isSubmitting ? 'Enregistrement...' : (editingTransaction ? 'Mettre à jour' : 'Créer l\'opération')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal confirmation suppression */}
      {deletingTransaction && (
        <Modal
          open={true}
          onClose={() => setDeletingTransaction(null)}
          title="Confirmer la suppression"
          size="sm"
        >
          <p className="text-sm text-slate-600 mb-4">
            Supprimer l'opération <strong>{deletingTransaction.description || deletingTransaction.reference || 'Opération'}</strong> ({deletingTransaction.reference ?? '—'}) ?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeletingTransaction(null)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={confirmDelete}
              disabled={actionLoading}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Supprimer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};