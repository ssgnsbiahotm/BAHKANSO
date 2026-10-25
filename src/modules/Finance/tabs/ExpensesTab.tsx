import { useState, useMemo, useEffect } from 'react';
import { List, CreditCard, FileText, Plus, Trash2, Edit2, Eye, ExternalLink } from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';
import { ValidatedForm } from '@/components/ui/ValidatedForm';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { z } from 'zod';
import type { Expense } from '@/lib/types';
import { logAudit } from '@/lib/types';
import { useExpenses } from '@/modules/Finance/hooks/useFinanceData';
import { RotatingCard } from '@/components/ui/RotatingCard';
import { formatCurrency, formatDate } from '@/lib/format';

interface ExpensesTabProps {
  expensesData: ReturnType<typeof useExpenses>;
}

const expenseSchema = z.object({
  reference: z.string().min(1, 'Référence obligatoire'),
  label: z.string().min(1, 'Libellé obligatoire'),
  amount: z.number().positive('Montant doit être positif'),
  currency: z.string().min(1, 'Devise obligatoire'),
  category: z.string().nullable(),
  supplier_id: z.string().nullable(),
  responsible: z.string().nullable(),
  payment_method: z.string().min(1, 'Méthode de paiement obligatoire'),
  bank_account_id: z.string().nullable(),
  cash_account_id: z.string().nullable(),
  project_id: z.string().nullable(),
  site_id: z.string().nullable(),
  activity: z.string().nullable(),
  funding_id: z.string().nullable(),
  description: z.string().nullable(),
  status: z.string().min(1, 'Statut obligatoire'),
  has_justificatif: z.boolean().default(false),
  justificatif_url: z.string().nullable(),
  comment: z.string().nullable(),
  amount_paid: z.number().nonnegative().default(0),
  date_paid: z.string().nullable(),
  payment_method_detail: z.string().nullable(),
  payment_reference: z.string().nullable(),
  date: z.string().min(1, 'Date obligatoire'),
});

interface ExpenseFormValues {
  reference: string;
  label: string;
  amount: number;
  currency: string;
  category: string | null;
  supplier_id: string | null;
  responsible: string | null;
  payment_method: string;
  bank_account_id: string | null;
  cash_account_id: string | null;
  project_id: string | null;
  site_id: string | null;
  activity: string | null;
  funding_id: string | null;
  description: string | null;
  status: string;
  has_justificatif: boolean;
  justificatif_url: string | null;
  comment: string | null;
  amount_paid: number;
  date_paid: string | null;
  payment_method_detail: string | null;
  payment_reference: string | null;
  date: string;
}

const STATUS_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  validée: 'Validée',
  rejetée: 'Rejetée',
  payée: 'Payée',
};

const STATUS_COLORS: Record<string, string> = {
  en_attente: 'text-amber-700 bg-amber-50',
  validée: 'text-green-700 bg-green-50',
  rejetée: 'text-red-700 bg-red-50',
  payée: 'text-blue-700 bg-blue-50',
};

const ExpenseCardFront = ({ expense, onEdit, onDelete, onView }: {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}) => {
  const status = expense.status || 'en_attente';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', paddingBottom: '3rem' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{expense.reference ?? '—'}</p>
          <p className="text-xs text-slate-500 truncate">{expense.label ?? '—'}</p>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status]} flex-shrink-0`}>
          {STATUS_LABELS[status] ?? status}
        </span>
      </div>
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <span>{expense.category ?? '—'}</span>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-900">{formatCurrency(expense.amount_paid ?? expense.amount)} {expense.currency}</p>
          <p className="text-xs text-slate-500">{formatDate(expense.date)}</p>
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

const ExpenseCardBack = ({ expense, onClose, onEdit, onDelete }: {
  expense: Expense;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const status = expense.status || 'en_attente';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', paddingBottom: '3rem', overflow: 'auto' }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">{expense.label ?? 'Dépense'}</h3>
          <p className="text-xs text-slate-500">{expense.reference ?? '—'}</p>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status]} flex-shrink-0`}>
          {STATUS_LABELS[status] ?? status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-slate-500">Fournisseur</p>
          <p className="font-medium">{expense.supplier?.name ?? expense.supplier_id ?? '—'}</p>
        </div>
        <div>
          <p className="text-slate-500">Méthode de paiement</p>
          <p className="font-medium">{expense.payment_method ?? '—'}</p>
        </div>
        <div>
          <p className="text-slate-500">Justificatif</p>
          <p className="font-medium">{expense.has_justificatif ? 'Oui' : 'Non'}</p>
        </div>
        <div>
          <p className="text-slate-500">Montant</p>
          <p className="font-medium">{formatCurrency(expense.amount_paid ?? expense.amount)} {expense.currency}</p>
        </div>
        <div>
          <p className="text-slate-500">Catégorie</p>
          <p className="font-medium capitalize">{expense.category ?? '—'}</p>
        </div>
        <div>
          <p className="text-slate-500">Responsable</p>
          <p className="font-medium">{expense.responsible ?? '—'}</p>
        </div>
        <div>
          <p className="text-slate-500">Date</p>
          <p className="font-medium">{formatDate(expense.date)}</p>
        </div>
      </div>
      {expense.description && (
        <div>
          <p className="text-slate-500 text-sm">Description</p>
          <p className="text-sm">{expense.description}</p>
        </div>
      )}
      {expense.justificatif_url && (
        <div>
          <p className="text-slate-500 text-sm">Justificatif</p>
          <a href={expense.justificatif_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-700 hover:underline flex items-center gap-1">
            <ExternalLink size={12} /> Ouvrir le fichier
          </a>
        </div>
      )}
      <div className="mt-auto flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={onEdit}
          className="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-1"
        >
          <Edit2 size={14} /> Modifier
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
        >
          <Trash2 size={14} /> Supprimer
        </button>
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

const CreateExpenseCard = ({ onCreate }: { onCreate: () => void }) => (
  <div className="rc" style={{ minHeight: '180px' }}>
    <div className="rc-inner" style={{ transform: 'none' }}>
      <div className="rc-face rc-face--front" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '1rem', padding: '2rem', border: '2px dashed #CBD5E1', background: '#FAFAFA',
        transform: 'rotateY(0deg)', backfaceVisibility: 'hidden'
      }}>
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <Plus size={28} className="text-red-600" />
        </div>
        <div className="text-center">
          <h4 className="font-semibold text-slate-900">Nouvelle dépense</h4>
          <p className="text-sm text-slate-500">Enregistrer une dépense</p>
        </div>
        <button
          onClick={onCreate}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Créer une dépense
        </button>
      </div>
    </div>
  </div>
);

export const ExpensesTab = ({ expensesData }: ExpensesTabProps) => {
  const { data, loading, error, refetch } = expensesData;
  const { authUser, appUser } = useAuth();
  const isAuthorized = useMemo(() => {
    if (!appUser) return false;
    const role = appUser.role;
    return role === 'administrateur' || role === 'propriétaire' || role === 'proprietaire' || role === 'admin' || role === 'owner';
  }, [appUser]);
  const { executeAction, loading: actionLoading } = useAsyncAction();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const currentUser = appUser?.name ?? authUser?.email ?? 'Utilisateur inconnu';

  const [siteName, setSiteName] = useState<string | null>(null);

  useEffect(() => {
    if (!appUser?.site_id) {
      setSiteName(null);
      return;
    }
    supabase
      .from('sites')
      .select('name')
      .eq('id', appUser.site_id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setSiteName(null);
          return;
        }
        setSiteName((data as { name: string }).name ?? null);
      });
  }, [appUser?.site_id]);

  const form = ValidatedForm<ExpenseFormValues>({
    schema: expenseSchema,
    defaultValues: {
      reference: '',
      label: '',
      amount: 0,
      currency: 'FCFA',
      category: null,
      supplier_id: null,
      responsible: null,
      payment_method: '',
      bank_account_id: null,
      cash_account_id: null,
      project_id: null,
      site_id: appUser?.site_id ?? null,
      activity: null,
      funding_id: null,
      description: null,
      status: 'en_attente',
      has_justificatif: false,
      justificatif_url: null,
      comment: null,
      amount_paid: 0,
      date_paid: null,
      payment_method_detail: null,
      payment_reference: null,
      date: new Date().toISOString().slice(0, 10),
    },
    onSubmit: async (values) => {
      await executeAction(async () => {
        const expenseData = {
          reference: values.reference,
          label: values.label,
          amount: values.amount,
          currency: values.currency,
          category: values.category,
          supplier_id: values.supplier_id,
          responsible: values.responsible,
          payment_method: values.payment_method,
          bank_account_id: values.bank_account_id,
          cash_account_id: values.cash_account_id,
          project_id: values.project_id,
          site_id: values.site_id,
          activity: values.activity,
          funding_id: values.funding_id,
          description: values.description,
          status: values.status,
          has_justificatif: values.has_justificatif,
          justificatif_url: values.justificatif_url,
          comment: values.comment,
          amount_paid: values.amount_paid,
          date_paid: values.date_paid,
          payment_method_detail: values.payment_method_detail,
          payment_reference: values.payment_reference,
          date: values.date,
        };
        let createdId: string | null = editingExpense?.id ?? null;

        if (editingExpense) {
          const { error: updateError } = await supabase
            .from('expenses')
            .update(expenseData)
            .eq('id', editingExpense.id);
          if (updateError) throw updateError;
          createdId = editingExpense.id;
        } else {
          const { data: inserted, error: insertError } = await supabase
            .from('expenses')
            .insert([expenseData])
            .select('id')
            .single();
          if (insertError) throw insertError;
          createdId = (inserted as { id: string })?.id ?? null;
        }

        await logAudit(
          currentUser,
          editingExpense ? 'UPDATE' : 'CREATE',
          'expense',
          createdId,
          `${editingExpense ? 'Modification' : 'Création'} de la dépense "${values.label}"`,
          editingExpense ? { ...editingExpense } : null,
          expenseData,
        );
      }, {
        successMessage: editingExpense ? 'Dépense mise à jour' : 'Dépense créée avec succès',
        errorMessage: editingExpense ? 'Échec de la mise à jour' : 'Échec de la création',
        onSuccess: () => {
          setModalOpen(false);
          setEditingExpense(null);
          refetch();
        },
      });
    },
  });

  const handleNewExpense = () => {
    if (!isAuthorized) return;
    form.resetForm();
    setEditingExpense(null);
    setModalOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    if (!isAuthorized) return;
    form.setFieldValues({
      reference: expense.reference ?? '',
      label: expense.label ?? '',
      amount: expense.amount,
      currency: expense.currency,
      category: expense.category,
      supplier_id: expense.supplier_id,
      responsible: expense.responsible,
      payment_method: expense.payment_method,
      bank_account_id: expense.bank_account_id,
      cash_account_id: expense.cash_account_id,
      project_id: expense.project_id,
      site_id: expense.site_id,
      activity: expense.activity,
      funding_id: expense.funding_id,
      description: expense.description,
      status: expense.status,
      has_justificatif: expense.has_justificatif,
      justificatif_url: expense.justificatif_url,
      comment: expense.comment,
      amount_paid: expense.amount_paid,
      date_paid: expense.date_paid,
      payment_method_detail: expense.payment_method_detail,
      payment_reference: expense.payment_reference,
      date: expense.date,
    });
    setEditingExpense(expense);
    setModalOpen(true);
  };

  const handleDelete = (expense: Expense) => {
    if (!isAuthorized) return;
    setDeletingExpense(expense);
  };

  const confirmDelete = async () => {
    if (!deletingExpense) return;
    if (!isAuthorized) {
      setDeletingExpense(null);
      return;
    }
    await executeAction(async () => {
      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', deletingExpense.id);
      if (deleteError) throw deleteError;

      await logAudit(
        currentUser,
        'DELETE',
        'expense',
        deletingExpense.id,
        `Suppression de la dépense "${deletingExpense.label}"`,
        { ...deletingExpense },
        null,
      );
    }, {
      successMessage: 'Dépense supprimée',
      errorMessage: 'Échec de la suppression',
      onSuccess: () => {
        setDeletingExpense(null);
        refetch();
      },
    });
  };

  if (loading) return <div className="text-center py-10">Chargement...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Erreur lors du chargement des données</div>;

  const rows = data ?? [];

  const total = rows.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const ceMois = rows.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const avecJustificatif = rows.filter(e => e.has_justificatif).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Dépenses" value={formatCurrency(total)} icon={<CreditCard size={20} />} trend={-5} />
        <KpiCard label="Dépenses ce mois" value={formatCurrency(ceMois)} icon={<CreditCard size={20} />} trend={-5} />
        <KpiCard label="Avec Justificatif" value={String(avecJustificatif)} icon={<List size={20} />} trend={3} />
        <KpiCard label="Dépenses" value={String(rows.length)} icon={<List size={20} />} trend={0} />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNewExpense}
          disabled={actionLoading || form.isSubmitting || !isAuthorized}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={16} /> Nouvelle dépense
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ minHeight: '200px' }}>
        {rows.map((expense) => (
          <RotatingCard
            key={expense.id}
            flipLabel={`Détail — ${expense.reference ?? expense.label}`}
            backLabel="Retour"
            front={<ExpenseCardFront expense={expense} onEdit={() => handleEdit(expense)} onDelete={() => handleDelete(expense)} onView={() => handleEdit(expense)} />}
            back={<ExpenseCardBack expense={expense} onClose={() => {}} onEdit={() => handleEdit(expense)} onDelete={() => handleDelete(expense)} />}
          />
        ))}
        <CreateExpenseCard onCreate={handleNewExpense} />
      </div>

      {rows.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <CreditCard size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-medium">Aucune dépense</p>
          <p className="text-sm">Cliquez sur « Nouvelle dépense » pour commencer</p>
        </div>
      )}

      {/* Modal création/édition */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingExpense(null); }}
        title={editingExpense ? 'Modifier la dépense' : 'Nouvelle dépense'}
        size="lg"
      >
        <form onSubmit={form.handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Référence *</label>
              <input
                type="text"
                value={form.values.reference}
                onChange={(e) => form.setFieldValue('reference', e.target.value)}
                className="form-input w-full"
                placeholder="DEP-2024-0001"
              />
              {form.errors.reference && <p className="text-xs text-red-500 mt-1">{form.errors.reference}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Libellé *</label>
              <input
                type="text"
                value={form.values.label}
                onChange={(e) => form.setFieldValue('label', e.target.value)}
                className="form-input w-full"
              />
              {form.errors.label && <p className="text-xs text-red-500 mt-1">{form.errors.label}</p>}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Catégorie</label>
              <input
                type="text"
                value={form.values.category ?? ''}
                onChange={(e) => form.setFieldValue('category', e.target.value || null)}
                className="form-input w-full"
                placeholder="Transport, matériel…"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Statut *</label>
              <select
                value={form.values.status}
                onChange={(e) => form.setFieldValue('status', e.target.value)}
                className="form-input w-full"
              >
                <option value="en_attente">En attente</option>
                <option value="validée">Validée</option>
                <option value="rejetée">Rejetée</option>
                <option value="payée">Payée</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fournisseur</label>
              <input
                type="text"
                value={form.values.supplier_id ?? ''}
                onChange={(e) => form.setFieldValue('supplier_id', e.target.value || null)}
                className="form-input w-full"
                placeholder="ID du fournisseur"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Responsable</label>
              <input
                type="text"
                value={form.values.responsible ?? ''}
                onChange={(e) => form.setFieldValue('responsible', e.target.value || null)}
                className="form-input w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Méthode de paiement *</label>
            <input
              type="text"
              value={form.values.payment_method}
              onChange={(e) => form.setFieldValue('payment_method', e.target.value)}
              className="form-input w-full"
            />
            {form.errors.payment_method && <p className="text-xs text-red-500 mt-1">{form.errors.payment_method}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date *</label>
              <input
                type="date"
                value={form.values.date}
                onChange={(e) => form.setFieldValue('date', e.target.value)}
                className="form-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date paiement</label>
              <input
                type="date"
                value={form.values.date_paid ?? ''}
                onChange={(e) => form.setFieldValue('date_paid', e.target.value || null)}
                className="form-input w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <input
              type="text"
              value={form.values.description ?? ''}
              onChange={(e) => form.setFieldValue('description', e.target.value || null)}
              className="form-input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Commentaire</label>
            <input
              type="text"
              value={form.values.comment ?? ''}
              onChange={(e) => form.setFieldValue('comment', e.target.value || null)}
              className="form-input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Site</label>
            <input
              type="text"
              value={siteName ?? form.values.site_id ?? ''}
              readOnly
              disabled
              className="form-input w-full bg-slate-100 cursor-not-allowed text-slate-600"
              title="Site déterminé automatiquement depuis votre session"
            />
            <input
              type="hidden"
              value={form.values.site_id ?? appUser?.site_id ?? ''}
              onChange={(e) => form.setFieldValue('site_id', e.target.value || null)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setModalOpen(false); setEditingExpense(null); }}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!form.isValid || form.isSubmitting}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {form.isSubmitting ? 'Enregistrement...' : (editingExpense ? 'Mettre à jour' : 'Créer la dépense')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal confirmation suppression */}
      {deletingExpense && (
        <Modal
          open={true}
          onClose={() => setDeletingExpense(null)}
          title="Confirmer la suppression"
          size="sm"
        >
          <p className="text-sm text-slate-600 mb-4">
            Supprimer la dépense <strong>{deletingExpense.label ?? deletingExpense.reference ?? '—'}</strong> ?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeletingExpense(null)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={confirmDelete}
              disabled={actionLoading || !isAuthorized}
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
