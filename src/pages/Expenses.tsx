import { useState, useMemo } from 'react';
import { Plus, Eye, CheckCircle, XCircle, Ban, Receipt, TrendingDown, Clock, Trash2, Pencil } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAudit, type Expense } from '@/lib/types';
import { useToast } from '@/lib/Toast';
import { formatCurrency, formatDate } from '@/lib/format';
import { EXPENSE_STATUS_COLORS, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/lib/constants';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge, SimpleBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { KpiCard } from '@/components/ui/KpiCard';

function emptyForm() {
  return {
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    category: 'Alimentation animale',
    supplier_id: '',
    responsible: '',
    payment_method: 'espèces',
    bank_account_id: '',
    cash_account_id: '',
    project_id: '',
    funding_id: '',
    description: '',
    comment: '',
  };
}

export function Expenses() {
  const { expenses, suppliers, fundings, bankAccounts, cashAccounts, projects, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [form, setForm] = useState(emptyForm());

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return expenses;
    return expenses.filter(e => e.status === statusFilter);
  }, [expenses, statusFilter]);

  const kpis = useMemo(() => {
    const validated = expenses.filter(e => e.status === 'validée');
    const pending = expenses.filter(e => e.status === 'en attente');
    const rejected = expenses.filter(e => e.status === 'rejetée');
    return {
      total: validated.reduce((s, e) => s + e.amount, 0),
      count: validated.length,
      pending: pending.length,
      rejected: rejected.length,
    };
  }, [expenses]);

  const openCreate = () => {
    setEditExpense(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditExpense(e);
    setForm({
      date: e.date,
      amount: String(e.amount),
      category: e.category || 'Alimentation animale',
      supplier_id: e.supplier_id || '',
      responsible: e.responsible || '',
      payment_method: e.payment_method || 'espèces',
      bank_account_id: e.bank_account_id || '',
      cash_account_id: e.cash_account_id || '',
      project_id: e.project_id || '',
      funding_id: e.funding_id || '',
      description: e.description || '',
      comment: e.comment || '',
    });
    setDetailExpense(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.amount || !form.category) {
      toast.show('Montant et catégorie obligatoires', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      date: form.date,
      amount: parseFloat(form.amount),
      category: form.category,
      supplier_id: form.supplier_id || null,
      responsible: form.responsible || appUser?.name || null,
      payment_method: form.payment_method,
      bank_account_id: form.bank_account_id || null,
      cash_account_id: form.cash_account_id || null,
      project_id: form.project_id || null,
      funding_id: form.funding_id || null,
      description: form.description || null,
      comment: form.comment || null,
      updated_at: new Date().toISOString(),
    };

    if (editExpense) {
      const { error } = await supabase.from('expenses').update(payload).eq('id', editExpense.id);
      if (error) {
        toast.show('Erreur: ' + error.message, 'error');
      } else {
        await logAudit(appUser?.name || 'Système', 'UPDATE', 'expense', editExpense.reference, `Dépense ${editExpense.reference} modifiée`);
        toast.show('Dépense modifiée');
        setModalOpen(false);
        refresh();
      }
    } else {
      const year = new Date().getFullYear();
      const ref = `DEP-${year}-${Date.now().toString().slice(-5)}`;
      const { error } = await supabase.from('expenses').insert({
        ...payload,
        reference: ref,
        currency: 'FCFA',
        status: 'brouillon',
        has_justificatif: false,
        created_by: appUser?.id || null,
      });
      if (error) {
        toast.show('Erreur: ' + error.message, 'error');
      } else {
        await logAudit(appUser?.name || 'Système', 'CREATE', 'expense', ref, `Création de la dépense ${ref}`);
        toast.show('Dépense créée avec succès');
        setModalOpen(false);
        refresh();
      }
    }
    setSaving(false);
  };

  const updateStatus = async (expense: Expense, status: string) => {
    const { error } = await supabase.from('expenses').update({ status, updated_at: new Date().toISOString() }).eq('id', expense.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      const action = status === 'validée' ? 'VALIDATE' : status === 'rejetée' ? 'REJECT' : status === 'annulée' ? 'CANCEL' : 'UPDATE';
      await logAudit(appUser?.name || 'Système', action, 'expense', expense.reference, `Statut changé à "${status}" pour ${expense.reference}`);
      toast.show(`Dépense ${status === 'validée' ? 'validée' : status === 'rejetée' ? 'rejetée' : 'mise à jour'}`);
      refresh();
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('expenses').delete().eq('id', confirmDelete.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'DELETE', 'expense', confirmDelete.reference, `Dépense ${confirmDelete.reference} supprimée`);
      toast.show('Dépense supprimée');
      setConfirmDelete(null);
      setDetailExpense(null);
      refresh();
    }
  };

  const columns: Column<Expense>[] = [
    { key: 'reference', label: 'ID', sortable: true, render: e => <span className="font-mono text-xs font-medium text-slate-900">{e.reference}</span> },
    { key: 'date', label: 'Date', sortable: true, sortValue: e => e.date, render: e => formatDate(e.date) },
    { key: 'amount', label: 'Montant', sortable: true, sortValue: e => e.amount, render: e => <span className="font-medium text-slate-900">{formatCurrency(e.amount)}</span> },
    { key: 'category', label: 'Catégorie', sortable: true, render: e => <SimpleBadge color="green">{e.category}</SimpleBadge> },
    { key: 'supplier', label: 'Fournisseur', sortValue: e => e.supplier?.name || '', render: e => e.supplier?.name || '—' },
    { key: 'responsible', label: 'Responsable', render: e => e.responsible || '—' },
    { key: 'has_justificatif', label: 'Justificatif', render: e => e.has_justificatif ? <SimpleBadge color="green">Oui</SimpleBadge> : <SimpleBadge color="red">Non</SimpleBadge> },
    { key: 'status', label: 'Statut', sortable: true, render: e => <StatusBadge status={e.status} colorMap={EXPENSE_STATUS_COLORS} /> },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Dépenses"
        subtitle="Traçabilité complète des dépenses de l'exploitation"
        actions={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
            <Plus size={18} /> Nouvelle dépense
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total dépenses validées" value={formatCurrency(kpis.total)} icon={<TrendingDown size={20} />} color="green" subtitle={`${kpis.count} dépenses`} />
        <KpiCard label="En attente" value={String(kpis.pending)} icon={<Clock size={20} />} color="amber" />
        <KpiCard label="Rejetées" value={String(kpis.rejected)} icon={<XCircle size={20} />} color="red" />
        <KpiCard label="Total dépenses" value={String(expenses.length)} icon={<Receipt size={20} />} color="dark" />
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {['all', 'brouillon', 'en attente', 'validée', 'rejetée', 'annulée'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${
              statusFilter === s ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s === 'all' ? 'Toutes' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={e => e.id}
        searchable
        searchKeys={e => `${e.reference} ${e.description} ${e.category} ${e.supplier?.name} ${e.responsible}`}
        onRowClick={e => setDetailExpense(e)}
        actions={(e) => (
          <div className="flex items-center gap-1">
            {e.status === 'en attente' && (
              <>
                <button onClick={() => updateStatus(e, 'validée')} title="Valider" className="p-1.5 text-green-600 hover:bg-green-50 rounded">
                  <CheckCircle size={16} />
                </button>
                <button onClick={() => updateStatus(e, 'rejetée')} title="Rejeter" className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                  <XCircle size={16} />
                </button>
              </>
            )}
            {e.status !== 'annulée' && e.status !== 'rejetée' && (
              <button onClick={() => updateStatus(e, 'annulée')} title="Annuler" className="p-1.5 text-slate-500 hover:bg-slate-100 rounded">
                <Ban size={16} />
              </button>
            )}
            <button onClick={() => openEdit(e)} title="Modifier" className="p-1.5 text-slate-600 hover:bg-slate-100 rounded">
              <Pencil size={16} />
            </button>
            <button onClick={() => setConfirmDelete(e)} title="Supprimer" className="p-1.5 text-red-600 hover:bg-red-50 rounded">
              <Trash2 size={16} />
            </button>
            <button onClick={() => setDetailExpense(e)} title="Voir" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
              <Eye size={16} />
            </button>
          </div>
        )}
        pageSize={10}
      />

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editExpense ? 'Modifier la dépense' : 'Nouvelle dépense'}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Enregistrement...' : editExpense ? 'Modifier' : 'Créer'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Date *">
            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="form-input" />
          </FormField>
          <FormField label="Montant (FCFA) *">
            <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="form-input" placeholder="125000" />
          </FormField>
          <FormField label="Catégorie *">
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="form-input">
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Fournisseur">
            <select value={form.supplier_id} onChange={e => setForm({...form, supplier_id: e.target.value})} className="form-input">
              <option value="">Aucun</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>
          <FormField label="Responsable">
            <input type="text" value={form.responsible} onChange={e => setForm({...form, responsible: e.target.value})} className="form-input" placeholder={appUser?.name || ''} />
          </FormField>
          <FormField label="Moyen de paiement">
            <select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})} className="form-input">
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </FormField>
          <FormField label="Compte bancaire">
            <select value={form.bank_account_id} onChange={e => setForm({...form, bank_account_id: e.target.value})} className="form-input">
              <option value="">Aucun</option>
              {bankAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </FormField>
          <FormField label="Caisse">
            <select value={form.cash_account_id} onChange={e => setForm({...form, cash_account_id: e.target.value})} className="form-input">
              <option value="">Aucune</option>
              {cashAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </FormField>
          <FormField label="Projet">
            <select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} className="form-input">
              <option value="">Aucun</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FormField>
          <FormField label="Financement">
            <select value={form.funding_id} onChange={e => setForm({...form, funding_id: e.target.value})} className="form-input">
              <option value="">Aucun</option>
              {fundings.map(f => <option key={f.id} value={f.id}>{f.reference} — {formatCurrency(f.amount_received || f.amount_sent)}</option>)}
            </select>
          </FormField>
          <div className="col-span-1 sm:col-span-2">
            <FormField label="Description">
              <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="form-input" placeholder="Description de la dépense" />
            </FormField>
          </div>
          <div className="col-span-1 sm:col-span-2">
            <FormField label="Commentaire">
              <textarea value={form.comment} onChange={e => setForm({...form, comment: e.target.value})} className="form-input" rows={2} />
            </FormField>
          </div>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal
        open={!!detailExpense && !confirmDelete}
        onClose={() => setDetailExpense(null)}
        title={`Dépense ${detailExpense?.reference || ''}`}
        size="lg"
        footer={
          detailExpense ? (
            <>
              <button onClick={() => setConfirmDelete(detailExpense)} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Supprimer</button>
              <button onClick={() => openEdit(detailExpense)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Modifier</button>
              {(detailExpense.status === 'en attente' || detailExpense.status === 'brouillon') && (
                <>
                  <button onClick={() => { updateStatus(detailExpense, 'rejetée'); setDetailExpense(null); }} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Rejeter</button>
                  <button onClick={() => { updateStatus(detailExpense, 'validée'); setDetailExpense(null); }} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Valider</button>
                </>
              )}
            </>
          ) : undefined
        }
      >
        {detailExpense && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(detailExpense.amount)}</p>
                <p className="text-sm text-slate-500">{detailExpense.category}</p>
              </div>
              <StatusBadge status={detailExpense.status} colorMap={EXPENSE_STATUS_COLORS} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DetailItem label="Date" value={formatDate(detailExpense.date)} />
              <DetailItem label="Responsable" value={detailExpense.responsible || '—'} />
              <DetailItem label="Fournisseur" value={detailExpense.supplier?.name || '—'} />
              <DetailItem label="Moyen de paiement" value={detailExpense.payment_method} />
              <DetailItem label="Description" value={detailExpense.description || '—'} />
              <DetailItem label="Justificatif" value={detailExpense.has_justificatif ? 'Oui' : 'Non'} />
              <DetailItem label="Commentaire" value={detailExpense.comment || '—'} />
              <DetailItem label="Créée le" value={formatDate(detailExpense.created_at)} />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Confirmer la suppression"
        size="sm"
        footer={
          <>
            <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Supprimer</button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Voulez-vous vraiment supprimer la dépense « {confirmDelete?.reference} » ? Cette action est irréversible.</p>
      </Modal>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
