import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
    // Nouveaux champs pour le suivi des justificatifs et paiements
    has_justificatif: false,
    justificatif_url: '',
    justificatif_file_name: '',
    justificatif_uploaded_at: '',
    // Pour le suivi du fichier sélectionné lors de l'upload
    selected_justificatif_file: null as File | null,
    amount_paid: '',
    date_paid: '',
    payment_method_detail: '',
    payment_reference: '',
  };
}

export function Expenses() {
  const { expenses, suppliers, fundings, bankAccounts, cashAccounts, projects, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
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
      // Nouveaux champs pour le suivi des justificatifs et paiements
      has_justificatif: e.has_justificatif || false,
      justificatif_url: e.justificatif_url || '',
      justificatif_file_name: e.justificatif_file_name || '',
      justificatif_uploaded_at: e.justificatif_uploaded_at || '',
      selected_justificatif_file: null,
      amount_paid: String(e.amount_paid || 0),
      date_paid: e.date_paid || '',
      payment_method_detail: e.payment_method_detail || '',
      payment_reference: e.payment_reference || '',
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
      // Nouveaux champs pour le suivi des justificatifs et paiements
      has_justificatif: form.has_justificatif || false,
      justificatif_url: form.justificatif_url || null,
      justificatif_file_name: form.justificatif_file_name || null,
      justificatif_uploaded_at: form.justificatif_uploaded_at || null,
      amount_paid: parseFloat(form.amount_paid) || 0,
      date_paid: form.date_paid || null,
      payment_method_detail: form.payment_method_detail || null,
      payment_reference: form.payment_reference || null,
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
        justificatif_url: null,
        justificatif_file_name: null,
        justificatif_uploaded_at: null,
        amount_paid: 0,
        date_paid: null,
        payment_method_detail: null,
        payment_reference: null,
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
        rowKey={(e: Expense) => e.id}
        searchable
        searchKeys={(e: Expense) => `${e.reference} ${e.description} ${e.category} ${e.supplier?.name} ${e.responsible}`}
        onRowClick={(e: Expense) => setDetailExpense(e)}
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
          {/* Informations essentielles */}
          <div className="grid grid-cols-1 gap-2 mb-4">
            <FormField label="Date *">
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="form-input" />
            </FormField>
            <FormField label="Montant (FCFA) *">
              <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="form-input" placeholder="125000" min="0" step="0.01" />
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
          </div>

          {/* Informations de financement et projet */}
          <div className="grid grid-cols-1 gap-2 mb-4">
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
          </div>

          {/* Informations de financement et projet */}
          <div className="grid grid-cols-1 gap-2 mb-4">
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
          </div>

          {/* Suivi des justificatifs (inspiré de Pennylane) */}
          <div className="grid grid-cols-1 gap-2 mb-4">
            <FormField label="Justificatif disponible">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.has_justificatif}
                  onChange={e => setForm({...form, has_justificatif: e.target.checked})}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded"
                />
                <span className="text-sm text-slate-600">
                  {form.has_justificatif ? 'Justificatif disponible' : 'Aucun justificatif'}
                </span>
              </div>
            </FormField>

            {/* Champs conditionnels pour le justificatif - affichés uniquement si un justificatif est disponible */}
            {form.has_justificatif && (
              <>
                <FormField label="Fichier du justificatif">
                  <input
                    type="text"
                    value={form.justificatif_file_name}
                    onChange={e => setForm({...form, justificatif_file_name: e.target.value})}
                    className="form-input"
                    placeholder="Nom du fichier (ex: facture_123.pdf)"
                  />
                </FormField>
                <FormField label="URL du justificatif">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={e => {
                      if (!e.target.files || !e.target.files[0]) {
                        return;
                      }
                      const file = e.target.files[0];
                      if (file) {
                        // Dans une vraie application, nous téléchargerions le fichier ici
                        // et obtiendrions une URL réelle du service de stockage
                        // Pour maintenant, nous simulons cela en créant une URL blob
                        const fileUrl = URL.createObjectURL(file);
                        setForm({
                          ...form,
                          justificatif_url: fileUrl,
                          justificatif_file_name: file.name,
                          selected_justificatif_file: file
                        });
                        // Réinitialiser l'input file pour permettre de sélectionner le même fichier deux fois de suite
                        e.target.value = '';
                      }
                    }}
                    className="form-input"
                  />
                </FormField>
                <FormField label="Date de dépôt du justificatif">
                  <input
                    type="date"
                    value={form.justificatif_uploaded_at}
                    onChange={e => setForm({...form, justificatif_uploaded_at: e.target.value})}
                    className="form-input"
                  />
                </FormField>
              </>
            )}
          </div>

          {/* Suivi des paiements (inspiré d'Odoo et ERPNext) */}
          <div className="grid grid-cols-1 gap-2 mb-4">
            <FormField label="Montant payé (FCFA)">
              <input
                type="number"
                value={form.amount_paid}
                onChange={e => setForm({...form, amount_paid: e.target.value})}
                className="form-input"
                min="0"
                step="0.01"
              />
            </FormField>
            <FormField label="Date de paiement">
              <input
                type="date"
                value={form.date_paid}
                onChange={e => setForm({...form, date_paid: e.target.value})}
                className="form-input"
              />
            </FormField>
            <FormField label="Méthode de paiement détaillée">
              <input
                type="text"
                value={form.payment_method_detail}
                onChange={e => setForm({...form, payment_method_detail: e.target.value})}
                className="form-input"
                placeholder="Ex: Virement bancaire, Chèque nº..., Espèces"
              />
            </FormField>
            <FormField label="Référence de paiement">
              <input
                type="text"
                value={form.payment_reference}
                onChange={e => setForm({...form, payment_reference: e.target.value})}
                className="form-input"
                placeholder="Ex: Référence virement, numéro de chèque"
              />
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

            {/* Informations principales */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <DetailItem label="Date" value={formatDate(detailExpense.date)} />
              <DetailItem label="Responsable" value={detailExpense.responsible || '—'} />
              <DetailItem label="Fournisseur" value={detailExpense.supplier?.name || '—'} />
              <DetailItem label="Moyen de paiement" value={detailExpense.payment_method} />
              <DetailItem label="Statut" value={
                detailExpense.status === 'brouillon' ? 'Brouillon' :
                detailExpense.status === 'en attente' ? 'En attente' :
                detailExpense.status === 'validée' ? 'Validée' :
                detailExpense.status === 'rejetée' ? 'Rejetée' :
                detailExpense.status === 'annulée' ? 'Annulée' : detailExpense.status
              } />
              <DetailItem label="Référence" value={detailExpense.reference || '—'} />
            </div>

            {/* Informations financières */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <DetailItem label="Montant total" value={formatCurrency(detailExpense.amount)} />
              <DetailItem label="Montant payé" value={formatCurrency(detailExpense.amount_paid || 0)} />
              <DetailItem label="Montant restant" value={formatCurrency((detailExpense.amount || 0) - (detailExpense.amount_paid || 0))} />
              <DetailItem label="Date de paiement" value={detailExpense.date_paid ? formatDate(detailExpense.date_paid) : 'Non payé'} />
              <DetailItem label="Méthode de paiement" value={detailExpense.payment_method_detail || '—'} />
              <DetailItem label="Référence de paiement" value={detailExpense.payment_reference || '—'} />
            </div>

            {/* Informations sur le justificatif (inspiré de Pennylane) */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <DetailItem label="Justificatif disponible" value={detailExpense.has_justificatif ? 'Oui' : 'Non'} />
              {detailExpense.has_justificatif && (
                <>
                  <DetailItem label="Fichier du justificatif" value={detailExpense.justificatif_file_name || '—'} />
                  <DetailItem label="URL du justificatif" value={detailExpense.justificatif_url || '—'} />
                  <DetailItem label="Date de dépôt" value={detailExpense.justificatif_uploaded_at ? formatDate(detailExpense.justificatif_uploaded_at) : '—'} />
                </>
              )}
            </div>

            {/* Informations complémentaires */}
            <div className="grid grid-cols-2 gap-4">
              <DetailItem label="Description" value={detailExpense.description || '—'} />
              <DetailItem label="Commentaire" value={detailExpense.comment || '—'} />
              <DetailItem label="Créée le" value={formatDate(detailExpense.created_at)} />
              <DetailItem label="Modifiée le" value={formatDate(detailExpense.updated_at)} />
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

// Déplacé en dehors du composant principal pour éviter l'erreur de définition de fonction dans JSX
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <div className="mt-1">{children}</div>
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
