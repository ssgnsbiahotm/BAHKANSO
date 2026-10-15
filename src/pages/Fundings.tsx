import { useState, useMemo } from 'react';
import { Plus, Wallet, Trash2, Pencil, Eye } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/types';
import { useToast } from '@/lib/Toast';
import { formatCurrency, formatDate } from '@/lib/format';
import { FUNDING_STATUS_COLORS, FUNDING_STATUSES } from '@/lib/constants';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { KpiCard } from '@/components/ui/KpiCard';
import type { Funding } from '@/lib/types';

function emptyForm() {
  return {
    funder_id: '',
    amount_sent: '',
    currency_sent: 'EUR',
    exchange_rate: '655.95',
    transfer_fees: '',
    date_sent: new Date().toISOString().slice(0, 10),
    date_received: '',
    destination_account_id: '',
    bank_reference: '',
    status: 'prévu',
    comment: '',
  };
}

export function Fundings() {
  const { fundings, funders, bankAccounts, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editFunding, setEditFunding] = useState<Funding | null>(null);
  const [detailFunding, setDetailFunding] = useState<Funding | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Funding | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const kpis = useMemo(() => {
    const received = fundings.filter(f => f.status === 'reçu');
    const totalSent = received.reduce((s, f) => s + f.amount_sent, 0);
    const totalReceived = received.reduce((s, f) => s + (f.amount_received || 0), 0);
    const totalFees = received.reduce((s, f) => s + (f.transfer_fees || 0), 0);
    const inTransit = fundings.filter(f => f.status === 'en transit').length;
    return { totalSent, totalReceived, totalFees, inTransit, count: received.length };
  }, [fundings]);

  const openCreate = () => {
    setEditFunding(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (f: Funding) => {
    setEditFunding(f);
    setForm({
      funder_id: f.funder_id || '',
      amount_sent: String(f.amount_sent),
      currency_sent: f.currency_sent || 'EUR',
      exchange_rate: String(f.exchange_rate || '655.95'),
      transfer_fees: f.transfer_fees ? String(f.transfer_fees) : '',
      date_sent: f.date_sent || '',
      date_received: f.date_received || '',
      destination_account_id: f.destination_account_id || '',
      bank_reference: f.bank_reference || '',
      status: f.status || 'prévu',
      comment: f.comment || '',
    });
    setDetailFunding(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.funder_id || !form.amount_sent) {
      toast.show('Veuillez remplir les champs obligatoires', 'error');
      return;
    }
    setSaving(true);
    const amountSent = parseFloat(form.amount_sent);
    const rate = parseFloat(form.exchange_rate) || 1;
    const fees = parseFloat(form.transfer_fees) || 0;
    const amountReceived = amountSent * rate - fees;
    const payload = {
      funder_id: form.funder_id,
      amount_sent: amountSent,
      currency_sent: form.currency_sent,
      exchange_rate: rate,
      amount_received: form.status === 'reçu' ? amountReceived : null,
      transfer_fees: fees,
      date_sent: form.date_sent,
      date_received: form.date_received || null,
      destination_account_id: form.destination_account_id || null,
      bank_reference: form.bank_reference || null,
      status: form.status,
      comment: form.comment || null,
    };

    if (editFunding) {
      const { error } = await supabase.from('fundings').update(payload).eq('id', editFunding.id);
      if (error) {
        toast.show('Erreur: ' + error.message, 'error');
      } else {
        await logAudit(appUser?.name || 'Système', 'UPDATE', 'funding', editFunding.reference, `Financement ${editFunding.reference} modifié`);
        toast.show('Financement modifié');
        setModalOpen(false);
        refresh();
      }
    } else {
      const ref = `FND-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`;
      const { error } = await supabase.from('fundings').insert({ ...payload, reference: ref });
      if (error) {
        toast.show('Erreur: ' + error.message, 'error');
      } else {
        await logAudit(appUser?.name || 'Système', 'CREATE', 'funding', ref, `Création du financement ${ref}`);
        toast.show('Financement créé avec succès');
        setModalOpen(false);
        refresh();
      }
    }
    setSaving(false);
  };

  const updateStatus = async (funding: Funding, status: string) => {
    const updateData: Record<string, unknown> = { status };
    if (status === 'reçu') {
      const amountReceived = (funding.amount_received || (funding.amount_sent * (funding.exchange_rate || 1) - (funding.transfer_fees || 0)));
      updateData.amount_received = amountReceived;
      updateData.date_received = new Date().toISOString().slice(0, 10);
    }
    const { error } = await supabase.from('fundings').update(updateData).eq('id', funding.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'UPDATE', 'funding', funding.reference, `Statut du financement ${funding.reference} → "${status}"`);
      toast.show(`Financement marqué "${status}"`);
      refresh();
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('fundings').delete().eq('id', confirmDelete.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'DELETE', 'funding', confirmDelete.reference, `Financement ${confirmDelete.reference} supprimé`);
      toast.show('Financement supprimé');
      setConfirmDelete(null);
      setDetailFunding(null);
      refresh();
    }
  };

  const columns: Column<Funding>[] = [
    { key: 'reference', label: 'ID', sortable: true, render: f => <span className="font-mono text-xs font-medium text-slate-900">{f.reference}</span> },
    { key: 'funder', label: 'Financeur', sortable: true, sortValue: f => f.funder?.name || '', render: f => f.funder?.name || '—' },
    { key: 'date_sent', label: 'Date', sortable: true, render: f => formatDate(f.date_sent) },
    { key: 'amount_sent', label: 'Montant envoyé', sortable: true, sortValue: f => f.amount_sent, render: f => `${formatCurrency(f.amount_sent, f.currency_sent)}` },
    { key: 'exchange_rate', label: 'Taux', render: f => f.exchange_rate?.toFixed(2) || '—' },
    { key: 'amount_received', label: 'Montant reçu', sortable: true, sortValue: f => f.amount_received || 0, render: f => f.amount_received ? formatCurrency(f.amount_received) : '—' },
    { key: 'transfer_fees', label: 'Frais', render: f => f.transfer_fees ? formatCurrency(f.transfer_fees) : '—' },
    { key: 'status', label: 'Statut', sortable: true, render: f => <StatusBadge status={f.status} colorMap={FUNDING_STATUS_COLORS} /> },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Financements"
        subtitle="Suivi des financements reçus et en transit"
        actions={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
            <Plus size={18} /> Nouveau financement
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total envoyé" value={formatCurrency(kpis.totalSent, 'EUR')} icon={<Wallet size={20} />} color="blue" />
        <KpiCard label="Total reçu" value={formatCurrency(kpis.totalReceived)} icon={<Wallet size={20} />} color="green" />
        <KpiCard label="Frais de transfert" value={formatCurrency(kpis.totalFees)} icon={<Wallet size={20} />} color="amber" />
        <KpiCard label="En transit" value={String(kpis.inTransit)} icon={<Wallet size={20} />} color="red" />
      </div>

      <DataTable
        columns={columns}
        data={fundings}
        rowKey={f => f.id}
        searchable
        searchKeys={f => `${f.reference} ${f.funder?.name} ${f.status}`}
        onRowClick={f => setDetailFunding(f)}
        actions={(f) => (
          <div className="flex items-center gap-1">
            <button onClick={() => openEdit(f)} title="Modifier" className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"><Pencil size={16} /></button>
            <button onClick={() => setConfirmDelete(f)} title="Supprimer" className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
            <button onClick={() => setDetailFunding(f)} title="Voir" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Eye size={16} /></button>
          </div>
        )}
        pageSize={10}
      />

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editFunding ? 'Modifier le financement' : 'Nouveau financement'}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Enregistrement...' : editFunding ? 'Modifier' : 'Créer'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Financeur *">
            <select value={form.funder_id} onChange={e => setForm({...form, funder_id: e.target.value})} className="form-input">
              <option value="">Sélectionner...</option>
              {funders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </Field>
          <Field label="Montant envoyé *">
            <input type="number" value={form.amount_sent} onChange={e => setForm({...form, amount_sent: e.target.value})} className="form-input" placeholder="5000" />
          </Field>
          <Field label="Devise">
            <select value={form.currency_sent} onChange={e => setForm({...form, currency_sent: e.target.value})} className="form-input">
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="FCFA">FCFA</option>
            </select>
          </Field>
          <Field label="Taux de change">
            <input type="number" step="0.01" value={form.exchange_rate} onChange={e => setForm({...form, exchange_rate: e.target.value})} className="form-input" />
          </Field>
          <Field label="Frais de transfert">
            <input type="number" value={form.transfer_fees} onChange={e => setForm({...form, transfer_fees: e.target.value})} className="form-input" />
          </Field>
          <Field label="Date d'envoi *">
            <input type="date" value={form.date_sent} onChange={e => setForm({...form, date_sent: e.target.value})} className="form-input" />
          </Field>
          <Field label="Date de réception">
            <input type="date" value={form.date_received} onChange={e => setForm({...form, date_received: e.target.value})} className="form-input" />
          </Field>
          <Field label="Compte de destination">
            <select value={form.destination_account_id} onChange={e => setForm({...form, destination_account_id: e.target.value})} className="form-input">
              <option value="">Sélectionner...</option>
              {bankAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <Field label="Référence bancaire">
            <input type="text" value={form.bank_reference} onChange={e => setForm({...form, bank_reference: e.target.value})} className="form-input" />
          </Field>
          <Field label="Statut">
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="form-input">
              {FUNDING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <div className="col-span-1 sm:col-span-2">
            <Field label="Commentaire">
              <textarea value={form.comment} onChange={e => setForm({...form, comment: e.target.value})} className="form-input" rows={2} />
            </Field>
          </div>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal
        open={!!detailFunding && !confirmDelete}
        onClose={() => setDetailFunding(null)}
        title={`Financement ${detailFunding?.reference || ''}`}
        size="lg"
        footer={
          detailFunding ? (
            <>
              <button onClick={() => setConfirmDelete(detailFunding)} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Supprimer</button>
              <button onClick={() => openEdit(detailFunding)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Modifier</button>
              {detailFunding.status !== 'reçu' && detailFunding.status !== 'annulé' && (
                <>
                  {detailFunding.status === 'prévu' && (
                    <button onClick={() => { updateStatus(detailFunding, 'envoyé'); setDetailFunding(null); }} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Marquer envoyé</button>
                  )}
                  {(detailFunding.status === 'envoyé') && (
                    <button onClick={() => { updateStatus(detailFunding, 'en transit'); setDetailFunding(null); }} className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700">En transit</button>
                  )}
                  {(detailFunding.status === 'envoyé' || detailFunding.status === 'en transit') && (
                    <button onClick={() => { updateStatus(detailFunding, 'reçu'); setDetailFunding(null); }} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Marquer reçu</button>
                  )}
                </>
              )}
            </>
          ) : undefined
        }
      >
        {detailFunding && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(detailFunding.amount_received || detailFunding.amount_sent, detailFunding.currency_sent)}</p>
                <p className="text-sm text-slate-500">{detailFunding.funder?.name || '—'}</p>
              </div>
              <StatusBadge status={detailFunding.status} colorMap={FUNDING_STATUS_COLORS} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DetailItem label="Financeur" value={detailFunding.funder?.name || '—'} />
              <DetailItem label="Montant envoyé" value={formatCurrency(detailFunding.amount_sent, detailFunding.currency_sent)} />
              <DetailItem label="Taux de change" value={detailFunding.exchange_rate?.toFixed(2) || '—'} />
              <DetailItem label="Montant reçu" value={detailFunding.amount_received ? formatCurrency(detailFunding.amount_received) : '—'} />
              <DetailItem label="Frais de transfert" value={detailFunding.transfer_fees ? formatCurrency(detailFunding.transfer_fees) : '—'} />
              <DetailItem label="Date d'envoi" value={formatDate(detailFunding.date_sent)} />
              <DetailItem label="Date de réception" value={formatDate(detailFunding.date_received)} />
              <DetailItem label="Référence bancaire" value={detailFunding.bank_reference || '—'} />
              <DetailItem label="Commentaire" value={detailFunding.comment || '—'} />
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
        <p className="text-sm text-slate-600">Voulez-vous vraiment supprimer le financement « {confirmDelete?.reference} » ? Cette action est irréversible.</p>
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
