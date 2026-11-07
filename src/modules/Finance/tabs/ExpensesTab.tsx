import { useState, useMemo, useCallback } from 'react';
import { List, CreditCard, Plus, Trash2, Edit2, Eye, ExternalLink } from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';
import { ValidatedForm } from '@/components/ui/ValidatedForm';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { z } from 'zod';
import type { Expense } from '@/lib/types';
import { logAudit } from '@/lib/types';
import { useExpenses } from '@/modules/Finance/hooks/useFinanceData';
import { generateEntityIdentifier } from '@/lib/entity-ids';
import { RotatingCard } from '@/components/ui/RotatingCard';
import { formatCurrency, formatDate } from '@/lib/format';
import { EntityLinkPicker, type EntityLink } from '@/components/ui/EntityLinkPicker';
import { EntityPicker, type EntityType } from '@/components/ui/EntityPicker';
import { DatePicker } from '@/components/ui/DatePicker';
import { SiteField } from '@/components/ui/SiteField';

interface ExpensesTabProps {
  expensesData: ReturnType<typeof useExpenses>;
}

const expenseSchema = z.object({
  reference: z.string().min(1, 'Référence obligatoire'),
  label: z.string().optional().default(''),
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

export const ExpensesTab = ({ expensesData }: ExpensesTabProps) => {
  const { data, loading, error, refetch } = expensesData;
  const { authUser, appUser } = useAuth();
  const { suppliers } = useData();
  const isAuthorized = useMemo(() => {
    if (!appUser) return false;
    const role = appUser.role;
    return role === 'administrateur' || role === 'propriétaire' || role === 'proprietaire' || role === 'admin' || role === 'owner';
  }, [appUser]);
  const { executeAction, loading: actionLoading } = useAsyncAction();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [links, setLinks] = useState<EntityLink[]>([]);

  const currentUser = appUser?.name ?? authUser?.email ?? 'Utilisateur inconnu';

  const persistExpenseLinks = useCallback(
    async (
      transactionId: string,
      amount: number,
      currency: string,
      expenseLinks: EntityLink[],
    ) => {
      // Supprime les anciens liens avant d'insérer les nouveaux (idempotent à l'édition)
      await supabase
        .from('financial_links')
        .delete()
        .eq('transaction_type', 'expense')
        .eq('transaction_id', transactionId);

      const rows = expenseLinks
        .filter((l) => l.entity_id && l.entity_id.trim().length > 0)
        .map((l) => ({
          transaction_type: 'expense' as const,
          transaction_id: transactionId,
          entity_type: l.entity_type,
          entity_id: l.entity_id,
          amount_allocated: Number(l.amount_allocated) || 0,
          currency,
          percent_allocated: l.percent_allocated ?? null,
          note: l.note ?? null,
          created_by: appUser?.id ?? null,
        }));

      if (rows.length > 0) {
        const { error } = await supabase.from('financial_links').insert(rows);
        if (error) throw error;
      }
    },
    [appUser?.id, supabase],
  );

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
      let finalReference = values.reference?.trim();
      if (!finalReference) {
        finalReference = await generateEntityIdentifier('EXP', 'expenses', 'reference', supabase);
      }
      await executeAction(async () => {
        const supplierObj = suppliers.find((s) => s.id === values.supplier_id);
        const computedLabel = [values.category || 'Dépense', supplierObj?.name]
          .filter(Boolean)
          .join(' - ');
        const expenseData = {
          reference: finalReference,
          label: computedLabel || values.reference,
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
          comment: null,
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

        // Persist les liens financial_links (répartition de la dépense sur N entités)
        if (createdId) {
          await persistExpenseLinks(createdId, values.amount, values.currency, links);
        }

        await logAudit(
          currentUser,
          editingExpense ? 'UPDATE' : 'CREATE',
          'expense',
          createdId,
          `${editingExpense ? 'Modification' : 'Création'} de la dépense "${computedLabel || values.reference}"`,
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

  const handleNewExpense = async () => {
    if (!isAuthorized) return;
    form.resetForm();
    setEditingExpense(null);
    setLinks([]);
    let preview = '';
    try {
      preview = await generateEntityIdentifier('EXP', 'expenses', 'reference', supabase);
    } catch {}
    form.setFieldValue('reference', preview);
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

    supabase
      .from('financial_links')
      .select('*')
      .eq('transaction_type', 'expense')
      .eq('transaction_id', expense.id)
      .then(({ data, error }) => {
        if (error || !data) {
          setLinks([]);
          return;
        }
        setLinks(
          (data as EntityLink[]).map((l) => ({
            entity_type: l.entity_type as EntityType,
            entity_id: l.entity_id,
            amount_allocated: l.amount_allocated,
            percent_allocated: l.percent_allocated,
            note: l.note,
          })),
        );
      });
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
          onClick={() => void handleNewExpense()}
          disabled={actionLoading || form.isSubmitting || !isAuthorized}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={16} /> Nouvelle dépense
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ minHeight: '200px' }}>
        {rows.map((expense) => {
          const status = expense.status || 'en_attente';
          return (
            <RotatingCard
              key={expense.id}
              flipLabel={`Détail — ${expense.reference ?? expense.label}`}
              backLabel="Retour"
              front={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', paddingBottom: '3rem' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{expense.reference ?? '—'}</p>
                      <p className="text-xs text-muted truncate">{expense.label ?? '—'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status]} flex-shrink-0`}>
                      {STATUS_LABELS[status] ?? status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-xs text-muted">
                      <span>{expense.category ?? '—'}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{formatCurrency(expense.amount_paid ?? expense.amount)} {expense.currency}</p>
                      <p className="text-xs text-muted">{formatDate(expense.date)}</p>
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-1 pointer-events-none">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="pointer-events-auto text-xs text-muted hover:text-secondary flex items-center gap-1 px-2 py-1 bg-surface/90 hover:bg-surface-hover rounded border border-default"
                      aria-label="Voir les détails"
                    >
                      <Eye size={12} /> Détail
                    </button>
                    <div className="flex items-center gap-1 pointer-events-auto">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-xs text-muted hover:text-green-700 flex items-center gap-1 px-2 py-1 bg-surface/90 hover:bg-green-50 rounded border border-default"
                        aria-label="Modifier"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(expense)}
                        className="text-xs text-muted hover:text-red-700 flex items-center gap-1 px-2 py-1 bg-surface/90 hover:bg-red-50 rounded border border-default"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              }
              back={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', paddingBottom: '3rem', overflow: 'auto' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold">{expense.label ?? 'Dépense'}</h3>
                      <p className="text-xs text-muted">{expense.reference ?? '—'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status]} flex-shrink-0`}>
                      {STATUS_LABELS[status] ?? status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted">Fournisseur</p>
                      <p className="font-medium">{expense.supplier?.name ?? expense.supplier_id ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted">Méthode de paiement</p>
                      <p className="font-medium">{expense.payment_method ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted">Justificatif</p>
                      <p className="font-medium">{expense.has_justificatif ? 'Oui' : 'Non'}</p>
                    </div>
                    <div>
                      <p className="text-muted">Montant</p>
                      <p className="font-medium">{formatCurrency(expense.amount_paid ?? expense.amount)} {expense.currency}</p>
                    </div>
                    <div>
                      <p className="text-muted">Catégorie</p>
                      <p className="font-medium capitalize">{expense.category ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted">Responsable</p>
                      <p className="font-medium">{expense.responsible ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted">Date</p>
                      <p className="font-medium">{formatDate(expense.date)}</p>
                    </div>
                  </div>
                  {expense.description && (
                    <div>
                      <p className="text-muted text-sm">Description</p>
                      <p className="text-sm">{expense.description}</p>
                    </div>
                  )}
                  {expense.justificatif_url && (
                    <div>
                      <p className="text-muted text-sm">Justificatif</p>
                      <a href={expense.justificatif_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-700 hover:underline flex items-center gap-1">
                        <ExternalLink size={12} /> Ouvrir le fichier
                      </a>
                    </div>
                  )}
                  <div className="mt-auto flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-1"
                    >
                      <Edit2 size={14} /> Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(expense)}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Supprimer
                    </button>
                    <button
                      onClick={() => {}}
                      className="px-3 py-1.5 text-sm text-secondary hover:bg-surface-hover rounded-lg"
                    >
                      Retour
                    </button>
                  </div>
                </div>
              }
            />
          );
        })}
        <button
          onClick={() => void handleNewExpense()}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
        >
          <Plus size={16} /> Nouvelle dépense
        </button>
      </div>

      {rows.length === 0 && (
        <div className="text-center py-12 text-muted">
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
              <label className="block text-xs font-medium text-secondary mb-1">Référence *</label>
              <input
                type="text"
                value={form.values.reference}
                readOnly
                className="form-input w-full bg-surface-hover cursor-not-allowed"
                placeholder="Généré automatiquement"
              />
              {form.errors.reference && <p className="text-xs text-red-500 mt-1">{form.errors.reference}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Montant *</label>
              <input
                type="number"
                value={form.values.amount}
                onChange={(e) => form.setFieldValue('amount', parseFloat(e.target.value) || 0)}
                className="form-input w-full"
              />
              {form.errors.amount && <p className="text-xs text-red-500 mt-1">{form.errors.amount}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Devise *</label>
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
              <label className="block text-xs font-medium text-secondary mb-1">Catégorie</label>
              <input
                type="text"
                value={form.values.category ?? ''}
                onChange={(e) => form.setFieldValue('category', e.target.value || null)}
                className="form-input w-full"
                placeholder="Transport, matériel…"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Statut *</label>
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
            <EntityPicker
              label="Fournisseur"
              entityType="supplier"
              value={form.values.supplier_id ?? null}
              onChange={(id) => form.setFieldValue('supplier_id', id)}
              placeholder="Sélectionner un fournisseur…"
              className="w-full"
            />
            {form.errors.supplier_id && <p className="text-xs text-red-500 mt-1">{form.errors.supplier_id}</p>}
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Responsable</label>
              <input
                type="text"
                value={form.values.responsible ?? ''}
                onChange={(e) => form.setFieldValue('responsible', e.target.value || null)}
                className="form-input w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Méthode de paiement *</label>
            <input
              type="text"
              value={form.values.payment_method}
              onChange={(e) => form.setFieldValue('payment_method', e.target.value)}
              className="form-input w-full"
            />
            {form.errors.payment_method && <p className="text-xs text-red-500 mt-1">{form.errors.payment_method}</p>}
          </div>
          <DatePicker
            mode="engagement-payment"
            engagementDate={form.values.date}
            paymentDate={form.values.date_paid}
            onEngagementChange={(v) => form.setFieldValue('date', v || '')}
            onPaymentChange={(v) => form.setFieldValue('date_paid', v || '')}
            status={form.values.status}
            error={form.errors.date ?? form.errors.date_paid ?? undefined}
          />
          {form.errors.date && <p className="text-xs text-red-500 mt-1">{form.errors.date}</p>}
          {form.errors.date_paid && (
            <p className="text-xs text-red-500 mt-1">{form.errors.date_paid}</p>
          )}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Description</label>
            <textarea
              value={form.values.description ?? ''}
              onChange={(e) => form.setFieldValue('description', e.target.value || null)}
              className="form-input w-full"
              rows={4}
              placeholder="ex: Achat de carburant pour le tracteur"
            />
          </div>
          <SiteField
            label="Site"
            value={form.values.site_id ?? null}
            onChange={(id) => form.setFieldValue('site_id', id)}
          />
          {form.errors.site_id && <p className="text-xs text-red-500 mt-1">{form.errors.site_id}</p>}

          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Répartition (liens métier)</label>
            <EntityLinkPicker
              links={links}
              onChange={setLinks}
              totalAmount={form.values.amount}
              currency={form.values.currency || 'XOF'}
              allowedTypes={[
                'supplier',
                'customer',
                'project',
                'plot',
                'campaign',
                'animal',
                'animal_lot',
                'site',
                'funder',
              ]}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setModalOpen(false); setEditingExpense(null); }}
              className="px-4 py-2 text-sm text-secondary hover:bg-surface-hover rounded-lg"
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
          <p className="text-sm text-secondary mb-4">
            Supprimer la dépense <strong>{deletingExpense.label ?? deletingExpense.reference ?? '—'}</strong> ?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeletingExpense(null)}
              className="px-4 py-2 text-sm text-secondary hover:bg-surface-hover rounded-lg"
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
