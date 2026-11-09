import { useState, useEffect, useCallback } from 'react';
import { Plus, DollarSign, FileText, Trash2, Edit2, Eye } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ValidatedForm } from '@/components/ui/ValidatedForm';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { supabase } from '@/lib/supabase';
import { generateEntityIdentifier } from '@/lib/entity-ids';
import { hasPermission } from '@/lib/rbac';
import { useAuth } from '@/lib/AuthContext';
import { z } from 'zod';
import type { Funding } from '@/lib/types';
import { logAudit } from '@/lib/types';
import { useFundings } from '@/modules/Finance/hooks/useFinanceData';
import { RotatingCard } from '@/components/ui/RotatingCard';
import { formatCurrency, formatDate } from '@/lib/format';
import { EntityLinkPicker, type EntityLink } from '@/components/ui/EntityLinkPicker';
import { EntityPicker } from '@/components/ui/EntityPicker';
import { DatePicker } from '@/components/ui/DatePicker';
import { SiteField } from '@/components/ui/SiteField';

interface FundingsTabProps {
  fundingsData: ReturnType<typeof useFundings>;
}

const fundingSchema = z.object({
  reference: z.string().min(1, 'Référence obligatoire'),
  funder_id: z.string().nullable(),
  amount_sent: z.number().positive('Montant envoyé doit être positif'),
  currency_sent: z.string().min(1, 'Devise obligatoire'),
  exchange_rate: z.number().nonnegative('Taux de change doit être positif').default(1),
  amount_received: z.number().nonnegative('Montant reçu doit être positif').nullable().default(null),
  transfer_fees: z.number().nonnegative('Frais de transfert doivent être positifs').nullable().default(null),
  date_sent: z.string().min(1, 'Date d\'envoi obligatoire'),
  date_received: z.string().nullable().default(null),
  status: z.string().min(1, 'Statut obligatoire'),
  comment: z.string().nullable().default(null),
  site_id: z.string().nullable(),
});

interface FundingFormValues {
  reference: string;
  funder_id: string | null;
  amount_sent: number;
  currency_sent: string;
  exchange_rate: number;
  amount_received: number | null;
  transfer_fees: number | null;
  date_sent: string;
  date_received: string | null;
  status: string;
  comment: string | null;
  site_id: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  prévu: 'Prévu',
  envoyé: 'Envoyé',
  reçu: 'Reçu',
  annulé: 'Annulé',
};

const STATUS_COLORS: Record<string, string> = {
  prévu: 'text-blue-700 bg-blue-50',
  envoyé: 'text-indigo-700 bg-indigo-50',
  reçu: 'text-green-700 bg-green-50',
  annulé: 'text-secondary bg-surface-hover',
};

const FundingCardFront = ({ funding, onEdit, onDelete, onView }: {
  funding: Funding;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}) => {
  const status = funding.status || 'prévu';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', paddingBottom: '3rem' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{funding.reference}</p>
          <p className="text-xs text-muted truncate">{funding.funder_id ?? '—'}</p>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status]} flex-shrink-0`}>
          {STATUS_LABELS[status] ?? status}
        </span>
      </div>
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
        <span className="text-xs text-muted capitalize">{funding.currency_sent}</span>
        <div className="text-right">
          <p className="text-lg font-bold text-primary">{formatCurrency(funding.amount_sent)}</p>
          <p className="text-xs text-muted">{formatDate(funding.date_sent)}</p>
        </div>
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-1 pointer-events-none">
        <button
          onClick={onView}
          className="pointer-events-auto text-xs text-muted hover:text-secondary flex items-center gap-1 px-2 py-1 bg-surface/90 hover:bg-surface-hover rounded border border-default"
          aria-label="Voir les détails"
        >
          <Eye size={12} /> Détail
        </button>
        <div className="flex items-center gap-1 pointer-events-auto">
          <button
            onClick={onEdit}
            className="text-xs text-muted hover:text-green-700 flex items-center gap-1 px-2 py-1 bg-surface/90 hover:bg-green-50 rounded border border-default"
            aria-label="Modifier"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-muted hover:text-red-700 flex items-center gap-1 px-2 py-1 bg-surface/90 hover:bg-red-50 rounded border border-default"
            aria-label="Supprimer"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

const FundingCardBack = ({ funding, onClose, onEdit, onDelete }: { funding: Funding; onClose: () => void; onEdit: () => void; onDelete: () => void }) => {
  const status = funding.status || 'prévu';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', paddingBottom: '3rem', overflow: 'auto' }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">{funding.reference}</h3>
          <p className="text-xs text-muted">{funding.funder_id ?? '—'}</p>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status]} flex-shrink-0`}>
          {STATUS_LABELS[status] ?? status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted">Montant envoyé</p>
          <p className="font-bold text-primary">{formatCurrency(funding.amount_sent)} {funding.currency_sent}</p>
        </div>
        <div>
          <p className="text-muted">Montant reçu</p>
          <p className="font-medium">{funding.amount_received ? formatCurrency(funding.amount_received) : '—'}</p>
        </div>
        <div>
          <p className="text-muted">Taux de change</p>
          <p className="font-medium">{funding.exchange_rate}</p>
        </div>
        <div>
          <p className="text-muted">Frais de transfert</p>
          <p className="font-medium">{funding.transfer_fees ? formatCurrency(funding.transfer_fees) : '—'}</p>
        </div>
        <div>
          <p className="text-muted">Date d'envoi</p>
          <p className="font-medium">{formatDate(funding.date_sent)}</p>
        </div>
        <div>
          <p className="text-muted">Date de réception</p>
          <p className="font-medium">{funding.date_received ? formatDate(funding.date_received) : '—'}</p>
        </div>
      </div>
      {funding.comment && (
        <div>
          <p className="text-muted text-sm">Commentaire</p>
          <p className="text-sm">{funding.comment}</p>
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
          className="px-3 py-1.5 text-sm text-secondary hover:bg-surface-hover rounded-lg"
        >
          Retour
        </button>
      </div>
    </div>
  );
};

export const FundingsTab = ({ fundingsData }: FundingsTabProps) => {
  const { data, loading, error, refetch } = fundingsData;
  const { executeAction, loading: actionLoading } = useAsyncAction();
  const { appUser } = useAuth();

  const isAuthorized = hasPermission(appUser?.role as import('@/lib/rbac').UserRole, 'finance', 'write');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingFunding, setEditingFunding] = useState<Funding | null>(null);
  const [deletingFunding, setDeletingFunding] = useState<Funding | null>(null);
  const [links, setLinks] = useState<EntityLink[]>([]);

  const persistFundingLinks = useCallback(
    async (transactionId: string, amount: number, currency: string, linksState: EntityLink[]) => {
      await supabase
        .from('financial_links')
        .delete()
        .eq('transaction_type', 'funding')
        .eq('transaction_id', transactionId);

      const rows = linksState
        .filter((l) => l.entity_id)
        .map((l) => ({
          transaction_type: 'funding',
          transaction_id: transactionId,
          entity_type: l.entity_type,
          entity_id: l.entity_id,
          amount_allocated: l.amount_allocated ?? null,
          percent_allocated: l.percent_allocated ?? null,
          currency: currency,
          note: l.note ?? null,
          created_by: appUser?.id ?? null,
        }));

      if (rows.length > 0) {
        const { error: insertError } = await supabase.from('financial_links').insert(rows);
        if (insertError) throw insertError;
      }
    },
    [appUser?.id],
  );

  useEffect(() => {
    supabase
      .from('funders')
      .select('id, name')
      .order('name', { ascending: true })
      .then(({ error }) => {
        if (error) {
          console.error('Erreur chargement bailleurs:', error);
          return;
        }
      });

    supabase
      .from('sites')
      .select('id, name')
      .order('name', { ascending: true })
      .then(({ error }) => {
        if (error) {
          console.error('Erreur chargement sites:', error);
          return;
        }
      });
  }, []);

  const form = ValidatedForm<FundingFormValues>({
    schema: fundingSchema,
    defaultValues: {
      reference: '',
      funder_id: null,
      amount_sent: 0,
      currency_sent: 'FCFA',
      exchange_rate: 1,
      amount_received: null,
      transfer_fees: null,
      date_sent: new Date().toISOString().slice(0, 10),
      date_received: null,
      status: 'prévu',
      comment: null,
      site_id: appUser?.site_id ?? null,
    },
    onSubmit: async (values) => {
      let finalReference = values.reference?.trim();
      if (!finalReference) {
        finalReference = await generateEntityIdentifier('FND', 'fundings', 'reference', supabase);
      }
      await executeAction(async () => {
        const payload = {
          funder_id: values.funder_id ?? null,
          amount_sent: Number(values.amount_sent) || 0,
          currency_sent: values.currency_sent,
          exchange_rate: Number(values.exchange_rate) || 1,
          amount_received: values.amount_received ? Number(values.amount_received) : null,
          transfer_fees: values.transfer_fees ? Number(values.transfer_fees) : null,
          date_sent: values.date_sent || null,
          date_received: values.date_received || null,
          status: values.status,
          comment: values.comment ?? null,
          site_id: values.site_id ?? null,
        };

        const fundingData = {
          ...payload,
          reference: finalReference,
        };

        console.log('PAYLOAD UPDATE:', payload);

        let createdId: string | null = null;

        if (editingFunding) {
          const { error: updateError } = await supabase
            .from('fundings')
            .update(payload)
            .eq('id', editingFunding.id);
          if (updateError) throw updateError;
          createdId = editingFunding.id;
        } else {
          const { data: inserted, error: insertError } = await supabase
            .from('fundings')
            .insert([fundingData])
            .select('id')
            .single();
          if (insertError) throw insertError;
          createdId = (inserted as { id: string })?.id ?? null;
        }

        try {
          await persistFundingLinks(createdId, Number(values.amount_sent) || 0, values.currency_sent, links);
        } catch (linkError) {
          console.error('Erreur liens financiers:', linkError);
        }

        await logAudit(
          appUser?.name || 'Système',
          editingFunding ? 'UPDATE' : 'CREATE',
          'funding',
          createdId,
          `${editingFunding ? 'Modification' : 'Création'} du financement "${finalReference}"`,
          editingFunding ? { ...editingFunding } : null,
          editingFunding ? payload : fundingData,
        );
      }, {
        successMessage: editingFunding ? 'Financement mis à jour' : 'Financement créé avec succès',
        errorMessage: editingFunding ? 'Échec de la mise à jour' : 'Échec de la création',
        onSuccess: () => {
          setModalOpen(false);
          setEditingFunding(null);
          refetch();
        },
      });
    },
  });

  const handleNewFunding = async () => {
    if (!isAuthorized) {
      return;
    }
    form.resetForm();
    setEditingFunding(null);
    try {
      const preview = await generateEntityIdentifier('FND', 'fundings', 'reference', supabase);
      form.setFieldValue('reference', preview);
    } catch {}
    setModalOpen(true);
    setLinks([]);
  };

  const handleEdit = async (funding: Funding) => {
    if (!isAuthorized) {
      return;
    }
    form.setFieldValues({
      reference: funding.reference ?? '',
      funder_id: funding.funder_id ?? null,
      amount_sent: funding.amount_sent ?? 0,
      currency_sent: funding.currency_sent,
      exchange_rate: funding.exchange_rate ?? 1,
      amount_received: funding.amount_received ?? null,
      transfer_fees: funding.transfer_fees ?? null,
      date_sent: funding.date_sent ? funding.date_sent.slice(0, 10) : new Date().toISOString().slice(0, 10),
      date_received: funding.date_received ? funding.date_received.slice(0, 10) : null,
      status: (funding.status ?? 'prévu') as FundingFormValues['status'],
      comment: funding.comment ?? null,
      site_id: funding.site_id ?? null,
    });
    setEditingFunding(funding);
    setModalOpen(true);

    try {
      const { data: linked } = await supabase
        .from('financial_links')
        .select('*')
        .eq('transaction_type', 'funding')
        .eq('transaction_id', funding.id);
      setLinks((linked ?? []).map((l) => ({
        entity_type: l.entity_type,
        entity_id: l.entity_id,
        amount_allocated: l.amount_allocated ?? undefined,
        percent_allocated: l.percent_allocated ?? undefined,
        note: l.note ?? undefined,
      })));
    } catch {}
  };

  const handleDelete = (funding: Funding) => {
    if (!isAuthorized) return;
    setDeletingFunding(funding);
  };

  const confirmDelete = async () => {
    if (!deletingFunding) return;
    if (!isAuthorized) {
      setDeletingFunding(null);
      return;
    }
    try {
      await executeAction(async () => {
        const { error: deleteError } = await supabase
          .from('fundings')
          .delete()
          .eq('id', deletingFunding.id);
        if (deleteError) throw deleteError;

        await logAudit(
          appUser?.name || 'Système',
          'DELETE',
          'funding',
          deletingFunding.id,
          `Suppression du financement "${deletingFunding.reference}"`,
          { ...deletingFunding },
          null,
        );
      }, {
        successMessage: 'Financement supprimé',
        errorMessage: 'Échec de la suppression',
        onSuccess: () => {
          refetch();
        },
      });
    } finally {
      setDeletingFunding(null);
    }
  };

  if (loading) return <div className="text-center py-10">Chargement...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Erreur lors du chargement des données</div>;

  const rows = data ?? [];

  const totalAmount = rows.reduce((sum, f) => sum + (f.amount_sent ?? 0), 0);
  const receivedAmount = rows.filter(f => f.status === 'reçu').reduce((sum, f) => sum + (f.amount_received ?? 0), 0);
  const pendingAmount = rows.filter(f => f.status === 'prévu' || f.status === 'envoyé').reduce((sum, f) => sum + (f.amount_sent ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="module-kpi-grid">
        <div className="module-kpi-card" style={{ borderLeftColor: 'var(--accent-primary)' }}>
          <div className="module-kpi-header">
            <div className="module-kpi-icon" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">Total financements</p>
            <div className="module-kpi-value" style={{ color: 'var(--accent-primary)' }}>
              {formatCurrency(totalAmount)}
            </div>
          </div>
        </div>

        <div className="module-kpi-card" style={{ borderLeftColor: 'var(--mdn-grass)' }}>
          <div className="module-kpi-header">
            <div className="module-kpi-icon" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>
              <FileText size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">Reçus</p>
            <div className="module-kpi-value" style={{ color: 'var(--accent-primary)' }}>
              {formatCurrency(receivedAmount)}
            </div>
          </div>
        </div>

        <div className="module-kpi-card" style={{ borderLeftColor: 'var(--mdn-harvest)' }}>
          <div className="module-kpi-header">
            <div className="module-kpi-icon" style={{ backgroundColor: 'var(--mdn-terre-soft)', color: 'var(--mdn-terre)' }}>
              <FileText size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">En attente</p>
            <div className="module-kpi-value" style={{ color: 'var(--mdn-terre)' }}>
              {formatCurrency(pendingAmount)}
            </div>
          </div>
        </div>

        <div className="module-kpi-card" style={{ borderLeftColor: 'var(--mdn-slate)' }}>
          <div className="module-kpi-header">
            <div className="module-kpi-icon" style={{ backgroundColor: 'var(--mdn-bg-surface-hover)', color: 'var(--mdn-slate)' }}>
              <FileText size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">Nombre</p>
            <div className="module-kpi-value" style={{ color: 'var(--mdn-encre)' }}>
              {rows.length}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNewFunding}
          disabled={actionLoading || form.isSubmitting || !isAuthorized}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={16} /> Nouveau financement
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ minHeight: '200px' }}>
        {rows.map((funding) => (
          <RotatingCard
            key={funding.id}
            flipLabel={`Détail — ${funding.reference}`}
            backLabel="Retour"
            front={<FundingCardFront funding={funding} onEdit={() => handleEdit(funding)} onDelete={() => handleDelete(funding)} onView={() => handleEdit(funding)} />}
            back={<FundingCardBack funding={funding} onClose={() => {}} onEdit={() => handleEdit(funding)} onDelete={() => handleDelete(funding)} />}
          />
        ))}
        </div>

      {rows.length === 0 && (
        <div className="text-center py-12 text-muted">
          <DollarSign size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-medium">Aucun financement</p>
          <p className="text-sm">Cliquez sur « Nouveau financement » pour commencer</p>
        </div>
      )}

      {/* Modal création/édition */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingFunding(null); }}
        title={editingFunding ? 'Modifier le financement' : 'Nouveau financement'}
        size="lg"
      >
        <form onSubmit={form.handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Référence *</label>
              <input
                type="text"
                value={form.values.reference}
                onChange={(e) => form.setFieldValue('reference', e.target.value)}
                className="form-input w-full bg-surface-hover cursor-not-allowed"
                readOnly
                placeholder="Généré automatiquement (FND-NNN)"
              />
              {form.errors.reference && <p className="text-xs text-red-500 mt-1">{form.errors.reference}</p>}
            </div>
            <EntityPicker
              label="Bailleur de fonds"
              entityType="funder"
              value={form.values.funder_id ?? null}
              onChange={(id) => form.setFieldValue('funder_id', id)}
              placeholder="Sélectionner un bailleur…"
              error={form.errors.funder_id}
            />
            {form.errors.funder_id && <p className="text-xs text-red-500 mt-1">{form.errors.funder_id}</p>}
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Montant envoyé *</label>
              <input
                type="number"
                value={form.values.amount_sent}
                onChange={(e) => form.setFieldValue('amount_sent', parseFloat(e.target.value) || 0)}
                className="form-input w-full"
                placeholder="0"
              />
              {form.errors.amount_sent && <p className="text-xs text-red-500 mt-1">{form.errors.amount_sent}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Devise *</label>
              <input
                type="text"
                value={form.values.currency_sent}
                onChange={(e) => form.setFieldValue('currency_sent', e.target.value)}
                className="form-input w-full"
                placeholder="FCFA"
              />
              {form.errors.currency_sent && <p className="text-xs text-red-500 mt-1">{form.errors.currency_sent}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Taux de change</label>
              <input
                type="number"
                value={form.values.exchange_rate}
                onChange={(e) => form.setFieldValue('exchange_rate', parseFloat(e.target.value) || 1)}
                className="form-input w-full"
                placeholder="1"
              />
              {form.errors.exchange_rate && <p className="text-xs text-red-500 mt-1">{form.errors.exchange_rate}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Montant reçu</label>
              <input
                type="number"
                value={form.values.amount_received ?? 0}
                onChange={(e) => form.setFieldValue('amount_received', parseFloat(e.target.value) || null)}
                className="form-input w-full"
                placeholder="0"
              />
              {form.errors.amount_received && <p className="text-xs text-red-500 mt-1">{form.errors.amount_received}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Frais de transfert</label>
              <input
                type="number"
                value={form.values.transfer_fees ?? 0}
                onChange={(e) => form.setFieldValue('transfer_fees', parseFloat(e.target.value) || null)}
                className="form-input w-full"
                placeholder="0"
              />
              {form.errors.transfer_fees && <p className="text-xs text-red-500 mt-1">{form.errors.transfer_fees}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Statut *</label>
              <select
                value={form.values.status}
                onChange={(e) => form.setFieldValue('status', e.target.value as FundingFormValues['status'])}
                className="form-input w-full"
              >
                <option value="prévu">Prévu</option>
                <option value="envoyé">Envoyé</option>
                <option value="reçu">Reçu</option>
                <option value="annulé">Annulé</option>
              </select>
            </div>
            <DatePicker
              mode="engagement-payment"
              engagementDate={form.values.date_sent}
              paymentDate={form.values.date_received}
              onEngagementChange={(v) => form.setFieldValue('date_sent', v || '')}
              onPaymentChange={(v) => form.setFieldValue('date_received', v || null)}
              status={form.values.status}
              error={form.errors.date_sent ?? form.errors.date_received ?? undefined}
            />
            {form.errors.date_sent && <p className="text-xs text-red-500 mt-1">{form.errors.date_sent}</p>}
            {form.errors.date_received && <p className="text-xs text-red-500 mt-1">{form.errors.date_received}</p>}
          </div>
          <SiteField
            label="Site"
            value={form.values.site_id ?? null}
            onChange={(id) => form.setFieldValue('site_id', id)}
            error={form.errors.site_id}
          />
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Répartition financière</label>
            <EntityLinkPicker
              links={links}
              onChange={setLinks}
              totalAmount={form.values.amount_sent}
              currency={form.values.currency_sent}
              allowedTypes={['supplier', 'customer', 'project', 'plot', 'campaign', 'animal', 'animal_lot', 'site', 'funder']}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setModalOpen(false); setEditingFunding(null); }}
              className="px-4 py-2 text-sm text-secondary hover:bg-surface-hover rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!form.isValid || form.isSubmitting || !isAuthorized}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {form.isSubmitting ? 'Enregistrement...' : (editingFunding ? 'Mettre à jour' : 'Créer le financement')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal confirmation suppression */}
      {deletingFunding && (
        <Modal
          open={true}
          onClose={() => setDeletingFunding(null)}
          title="Confirmer la suppression"
          size="sm"
        >
          <p className="text-sm text-secondary mb-4">
            Supprimer le financement <strong>{deletingFunding.reference}</strong> ?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeletingFunding(null)}
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
