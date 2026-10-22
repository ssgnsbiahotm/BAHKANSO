import { useState, useMemo } from 'react';
import { Plus, DollarSign, FileText, Trash2, Edit2, Eye, ExternalLink } from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';
import { ValidatedForm } from '@/components/ui/ValidatedForm';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { z } from 'zod';
import type { Funding } from '@/lib/types';
import { logAudit } from '@/lib/types';
import { useFundings } from '@/modules/Finance/hooks/useFinanceData';
import { RotatingCard } from '@/components/ui/RotatingCard';
import { formatCurrency, formatDate } from '@/lib/format';

interface FundingsTabProps {
  fundingsData: ReturnType<typeof useFundings>;
}

const fundingSchema = z.object({
  reference: z.string().min(1, 'Référence obligatoire'),
  label: z.string().min(1, 'Libellé obligatoire'),
  amount: z.number().positive('Montant doit être positif'),
  currency: z.string().min(1, 'Devise obligatoire'),
  source_type: z.enum(['investissement', 'pret', 'subvention', 'autre']),
  funding_date: z.string().min(1, 'Date obligatoire'),
  expected_date: z.string().nullable(),
  status: z.enum(['prevue', 'recue', 'en_cours', 'annulee']),
  description: z.string().nullable(),
  justificatif_url: z.string().url().nullable().or(z.literal('')),
  justificatif_file: z.any().optional(),
  site_id: z.string().nullable().optional(),
});

interface FundingFormValues {
  reference: string;
  label: string;
  amount: number;
  currency: string;
  source_type: 'investissement' | 'pret' | 'subvention' | 'autre';
  funding_date: string;
  expected_date: string | null;
  status: 'prevue' | 'recue' | 'en_cours' | 'annulee';
  description: string | null;
  justificatif_url: string | null;
  justificatif_file?: File | null | undefined;
  site_id: string | null;
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  investissement: 'Investissement',
  pret: 'Prêt',
  subvention: 'Subvention',
  autre: 'Autre',
};

const STATUS_LABELS: Record<string, string> = {
  prevue: 'Prévue',
  recue: 'Reçue',
  en_cours: 'En cours',
  annulee: 'Annulée',
};

const STATUS_COLORS: Record<string, string> = {
  prevue: 'text-blue-700 bg-blue-50',
  recue: 'text-green-700 bg-green-50',
  en_cours: 'text-amber-700 bg-amber-50',
  annulee: 'text-slate-700 bg-slate-100',
};

const FundingCardFront = ({ funding, onEdit, onDelete, onView }: {
  funding: Funding;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}) => {
  const status = funding.status || 'prevue';
  const sourceType = funding.source_type || 'autre';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', paddingBottom: '3rem' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{funding.label}</p>
          <p className="text-xs text-slate-500 truncate">{funding.reference ?? '—'}</p>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status]} flex-shrink-0`}>
          {STATUS_LABELS[status] ?? status}
        </span>
      </div>
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-500 capitalize">{SOURCE_TYPE_LABELS[sourceType] ?? sourceType}</span>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-900">{formatCurrency(funding.amount)}</p>
          <p className="text-xs text-slate-500">{formatDate(funding.funding_date)}</p>
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

const FundingCardBack = ({ funding, onClose, onEdit, onDelete }: { funding: Funding; onClose: () => void; onEdit: () => void; onDelete: () => void }) => {
  const status = funding.status || 'prevue';
  const sourceType = funding.source_type || 'autre';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', paddingBottom: '3rem', overflow: 'auto' }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">{funding.label}</h3>
          <p className="text-xs text-slate-500">{funding.reference ?? '—'}</p>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status]} flex-shrink-0`}>
          {STATUS_LABELS[status] ?? status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-slate-500">Type</p>
          <p className="font-medium capitalize">{SOURCE_TYPE_LABELS[sourceType] ?? sourceType}</p>
        </div>
        <div>
          <p className="text-slate-500">Statut</p>
          <p className="font-medium capitalize">{STATUS_LABELS[status] ?? status}</p>
        </div>
        <div>
          <p className="text-slate-500">Montant</p>
          <p className="font-bold text-slate-900">{formatCurrency(funding.amount)}</p>
        </div>
        <div>
          <p className="text-slate-500">Devise</p>
          <p className="font-medium">{funding.currency}</p>
        </div>
        <div>
          <p className="text-slate-500">Date financement</p>
          <p className="font-medium">{formatDate(funding.funding_date)}</p>
        </div>
        <div>
          <p className="text-slate-500">Date attendue</p>
          <p className="font-medium">{funding.expected_date ? formatDate(funding.expected_date) : '—'}</p>
        </div>
      </div>
      {funding.description && (
        <div>
          <p className="text-slate-500 text-sm">Description</p>
          <p className="text-sm">{funding.description}</p>
        </div>
      )}
      {funding.justificatif_url && (
        <div>
          <p className="text-slate-500 text-sm">Justificatif</p>
          <a href={funding.justificatif_url} target="_blank" rel="noopener noreferrer" className="text-sm text-green-700 hover:underline flex items-center gap-1">
            <ExternalLink size={12} /> Voir le document
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

const CreateFundingCard = ({ onCreate }: { onCreate: () => void }) => (
  <div className="rc" style={{ minHeight: '180px' }}>
    <div className="rc-inner" style={{ transform: 'none' }}>
      <div className="rc-face rc-face--front" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '1rem', padding: '2rem', border: '2px dashed #CBD5E1', background: '#FAFAFA',
        transform: 'rotateY(0deg)', backfaceVisibility: 'hidden'
      }}>
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
          <Plus size={28} className="text-green-600" />
        </div>
        <div className="text-center">
          <h4 className="font-semibold text-slate-900">Nouveau financement</h4>
          <p className="text-sm text-slate-500">Ajouter un financement au projet</p>
        </div>
        <button
          onClick={onCreate}
          className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Créer un financement
        </button>
      </div>
    </div>
  </div>
);

export const FundingsTab = ({ fundingsData }: FundingsTabProps) => {
  const { data, loading, error, refetch } = fundingsData;
  const { executeAction, loading: actionLoading } = useAsyncAction();
  const { appUser } = useAuth();

  const isAuthorized = useMemo(() => {
    if (!appUser) return false;
    const role = appUser.role;
    return role === 'administrateur' || role === 'propriétaire' || role === 'proprietaire' || role === 'admin' || role === 'owner';
  }, [appUser]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingFunding, setEditingFunding] = useState<Funding | null>(null);
  const [deletingFunding, setDeletingFunding] = useState<Funding | null>(null);

  const form = ValidatedForm<FundingFormValues>({
    schema: fundingSchema,
    defaultValues: {
      reference: '',
      label: '',
      amount: 0,
      currency: 'FCFA',
      source_type: 'investissement',
      funding_date: new Date().toISOString().slice(0, 10),
      expected_date: null,
      status: 'prevue',
      description: null,
      justificatif_url: null,
      justificatif_file: null,
      site_id: appUser?.site_id ?? null,
    },
    onSubmit: async (values) => {
      await executeAction(async () => {
        const fundingData = {
          reference: values.reference,
          label: values.label,
          amount: values.amount,
          currency: values.currency,
          source_type: values.source_type,
          funding_date: values.funding_date,
          expected_date: values.expected_date,
          status: values.status,
          description: values.description,
          justificatif_url: values.justificatif_url || null,
          site_id: values.site_id ?? null,
        };

        let createdId: string | null = null;

        if (editingFunding) {
          const { error: updateError } = await supabase
            .from('fundings')
            .update(fundingData)
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

        await logAudit(
          appUser?.name || 'Système',
          editingFunding ? 'UPDATE' : 'CREATE',
          'funding',
          createdId,
          `${editingFunding ? 'Modification' : 'Création'} du financement "${values.reference}"`,
          editingFunding ? { ...editingFunding } : null,
          fundingData,
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

  const handleNewFunding = () => {
    if (!isAuthorized) {
      return;
    }
    form.resetForm();
    setEditingFunding(null);
    setModalOpen(true);
  };

  const handleEdit = (funding: Funding) => {
    if (!isAuthorized) {
      return;
    }
    form.setFieldValues({
      reference: funding.reference ?? '',
      label: funding.label ?? '',
      amount: funding.amount,
      currency: funding.currency,
      source_type: (funding.source_type ?? 'investissement') as FundingFormValues['source_type'],
      funding_date: funding.funding_date ? funding.funding_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      expected_date: funding.expected_date ? funding.expected_date.slice(0, 10) : null,
      status: (funding.status ?? 'prevue') as FundingFormValues['status'],
      description: funding.description ?? null,
      justificatif_url: funding.justificatif_url ?? null,
      justificatif_file: null,
      site_id: funding.site_id ?? null,
    });
    setEditingFunding(funding);
    setModalOpen(true);
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
        `Suppression du financement "${deletingFunding.label}"`,
        { ...deletingFunding },
        null,
      );
    }, {
      successMessage: 'Financement supprimé',
      errorMessage: 'Échec de la suppression',
      onSuccess: () => {
        setDeletingFunding(null);
        refetch();
      },
    });
  };

  if (loading) return <div className="text-center py-10">Chargement...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Erreur lors du chargement des données</div>;

  const rows = data ?? [];

  const totalAmount = rows.reduce((sum, f) => sum + f.amount, 0);
  const receivedAmount = rows.filter(f => f.status === 'recue').reduce((sum, f) => sum + f.amount, 0);
  const pendingAmount = rows.filter(f => f.status === 'prevue' || f.status === 'en_cours').reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total financements" value={formatCurrency(totalAmount)} icon={<DollarSign size={20} />} />
        <KpiCard label="Reçus" value={formatCurrency(receivedAmount)} icon={<FileText size={20} />} trend={{ value: '+', positive: true }} />
        <KpiCard label="En attente" value={formatCurrency(pendingAmount)} icon={<FileText size={20} />} />
        <KpiCard label="Nombre" value={String(rows.length)} icon={<FileText size={20} />} />
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
            flipLabel={`Détail — ${funding.label}`}
            backLabel="Retour"
            front={<FundingCardFront funding={funding} onEdit={() => handleEdit(funding)} onDelete={() => handleDelete(funding)} onView={() => handleEdit(funding)} />}
            back={<FundingCardBack funding={funding} onClose={() => {}} onEdit={() => handleEdit(funding)} onDelete={() => handleDelete(funding)} />}
          />
        ))}
        <CreateFundingCard onCreate={handleNewFunding} />
      </div>

      {rows.length === 0 && (
        <div className="text-center py-12 text-slate-500">
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Référence *</label>
              <input
                type="text"
                value={form.values.reference}
                onChange={(e) => form.setFieldValue('reference', e.target.value)}
                className="form-input w-full"
                placeholder="FIN-2024-0001"
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
                placeholder="Apport initial"
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type de source *</label>
              <select
                value={form.values.source_type}
                onChange={(e) => form.setFieldValue('source_type', e.target.value as FundingFormValues['source_type'])}
                className="form-input w-full"
              >
                <option value="investissement">Investissement</option>
                <option value="pret">Prêt</option>
                <option value="subvention">Subvention</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Statut *</label>
              <select
                value={form.values.status}
                onChange={(e) => form.setFieldValue('status', e.target.value as FundingFormValues['status'])}
                className="form-input w-full"
              >
                <option value="prevue">Prévue</option>
                <option value="recue">Reçue</option>
                <option value="en_cours">En cours</option>
                <option value="annulee">Annulée</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date financement *</label>
              <input
                type="date"
                value={form.values.funding_date}
                onChange={(e) => form.setFieldValue('funding_date', e.target.value)}
                className="form-input w-full"
              />
              {form.errors.funding_date && <p className="text-xs text-red-500 mt-1">{form.errors.funding_date}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date attendue</label>
              <input
                type="date"
                value={form.values.expected_date ?? ''}
                onChange={(e) => form.setFieldValue('expected_date', e.target.value || null)}
                className="form-input w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea
              value={form.values.description ?? ''}
              onChange={(e) => form.setFieldValue('description', e.target.value || null)}
              className="form-input w-full"
              rows={3}
              placeholder="Description du financement"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">URL justificatif</label>
            <input
              type="url"
              value={form.values.justificatif_url ?? ''}
              onChange={(e) => form.setFieldValue('justificatif_url', e.target.value || null)}
              className="form-input w-full"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Site</label>
            {isAuthorized ? (
              <input
                type="text"
                value={form.values.site_id ?? ''}
                onChange={(e) => form.setFieldValue('site_id', e.target.value || null)}
                className="form-input w-full"
                placeholder="ID du site"
              />
            ) : (
              <input
                type="text"
                value={form.values.site_id ?? ''}
                readOnly
                disabled
                className="form-input w-full bg-slate-100 cursor-not-allowed text-slate-600"
                title="Site déterminé automatiquement depuis votre session"
              />
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setModalOpen(false); setEditingFunding(null); }}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
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
          <p className="text-sm text-slate-600 mb-4">
            Supprimer le financement <strong>{deletingFunding.label}</strong> ({deletingFunding.reference ?? '—'}) ?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeletingFunding(null)}
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
