import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wheat, Plus } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/types';
import { useToast } from '@/lib/Toast';
import { formatCurrency, formatDate } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { SimpleBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { RotatingCard } from '@/components/ui/RotatingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useValidatedForm } from '@/components/ui/ValidatedForm';
import { FormField, FormInput, FormSelect, FormTextarea, FormActions, ConfirmDeleteModal, DetailModal, FormSection } from '@/components/ui/FormPrimitives';
import * as z from 'zod';
import type { CropOperation } from '@/lib/types';

export const cropOperationSchema = z.object({
  campaign_id: z.string().optional(),
  plot_id: z.string().optional(),
  date: z.string().min(1, 'La date est obligatoire'),
  type: z.string().min(1, 'Le type est obligatoire'),
  comment: z.string().optional(),
  quantity: z.number().nonnegative().optional(),
  unit: z.string().optional(),
  cost: z.number().nonnegative().optional(),
  responsible: z.string().optional(),
}).refine(
  (data) => !!(data.campaign_id || data.plot_id),
  {
    message: 'Une opération doit être liée à au moins une campagne ou une parcelle.',
    path: ['campaign_id'],
  }
);

type CropOperationFormValues = z.infer<typeof cropOperationSchema>;

const DEFAULT_VALUES: CropOperationFormValues = {
  campaign_id: undefined,
  plot_id: undefined,
  date: '',
  type: '',
  comment: '',
  quantity: undefined,
  unit: '',
  cost: undefined,
  responsible: '',
};

const TYPE_OPTIONS = [
  { value: 'semis', label: 'Semis' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'traitement', label: 'Traitement' },
  { value: 'fertilisation', label: 'Fertilisation' },
  { value: 'recolte', label: 'Récolte' },
  { value: 'autre', label: 'Autre' },
] as const;

const UNIT_OPTIONS = [
  { value: 'kg', label: 'kg' },
  { value: 'tonne', label: 'tonne' },
  { value: 'litre', label: 'litre' },
  { value: 'm2', label: 'm²' },
] as const;

export function CropOperationManage() {
  const { cropOperations, campaigns, plots, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [editOperation, setEditOperation] = useState<CropOperation | null>(null);
  const [detailOperation, setDetailOperation] = useState<CropOperation | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CropOperation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { values: form, setFieldValue: setForm, errors, isSubmitting, handleSubmit: handleFormSubmit } = useValidatedForm({
    schema: cropOperationSchema,
    defaultValues: DEFAULT_VALUES,
    onSubmit: async (values) => {
      const payload = {
        campaign_id: values.campaign_id || null,
        plot_id: values.plot_id || null,
        date: values.date,
        type: values.type,
        comment: values.comment || null,
        quantity: values.quantity != null ? values.quantity : null,
        unit: values.unit || null,
        cost: values.cost != null ? values.cost : null,
        responsible: values.responsible || null,
      };

      if (editOperation) {
        const { error } = await supabase
          .from('crop_operations')
          .update(payload)
          .eq('id', editOperation.id);
        if (error) throw error;
        await logAudit(
          appUser?.name || 'Système',
          'UPDATE',
          'crop_operation',
          editOperation.id,
          `Opération ${editOperation.id} modifiée`,
        );
        toast.show('Opération modifiée');
      } else {
        const { error } = await supabase.from('crop_operations').insert([payload]);
        if (error) throw error;
        await logAudit(appUser?.name || 'Système', 'CREATE', 'crop_operation', '', 'Création de l\'opération culturale');
        toast.show('Opération créée avec succès');
      }
      refresh();
    },
    onSuccess: () => { setModalOpen(false); setEditOperation(null); },
    onError: (err) => toast.show('Erreur: ' + err.message, 'error'),
    isEdit: !!editOperation,
  });

  useEffect(() => {
    if (editOperation) {
      setForm('campaign_id', editOperation.campaign_id || undefined);
      setForm('plot_id', editOperation.plot_id || undefined);
      setForm('date', editOperation.date || '');
      setForm('type', editOperation.type || '');
      setForm('comment', editOperation.comment || '');
      setForm('quantity', editOperation.quantity != null ? editOperation.quantity : undefined);
      setForm('unit', editOperation.unit || '');
      setForm('cost', editOperation.cost != null ? editOperation.cost : undefined);
      setForm('responsible', editOperation.responsible || '');
    } else {
      setForm('campaign_id', undefined);
      setForm('plot_id', undefined);
      setForm('date', '');
      setForm('type', '');
      setForm('comment', '');
      setForm('quantity', undefined);
      setForm('unit', '');
      setForm('cost', undefined);
      setForm('responsible', '');
    }
  }, [editOperation, setForm]);

  const filteredOperations = useMemo(() => {
    return cropOperations.filter((o: CropOperation) => {
      const q = searchTerm.toLowerCase();
      return (
        (o.type?.toLowerCase().includes(q) ?? false) ||
        (o.comment?.toLowerCase().includes(q) ?? false) ||
        (o.date?.toLowerCase().includes(q) ?? false) ||
        (o.responsible?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [cropOperations, searchTerm]);

  const totalOps = cropOperations.length;
  const totalCost = cropOperations.reduce((sum, o) => sum + (o.cost || 0), 0);
  const thisMonth = cropOperations.filter((o: CropOperation) => {
    if (!o.date) return false;
    const d = new Date(o.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const getCampaignName = (campaignId: string | null) => {
    if (!campaignId) return '—';
    const c = campaigns.find((x: any) => x.id === campaignId);
    return c ? `Campagne ${c.year} – ${c.crop_name}` : '—';
  };

  const getPlotName = (plotId: string | null) => {
    if (!plotId) return '—';
    const p = plots.find((x: any) => x.id === plotId);
    return p ? `${p.reference || ''} ${p.name || ''}`.trim() : '—';
  };

  const openCreate = useCallback(() => {
    setEditOperation(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((operation: CropOperation) => {
    setEditOperation(operation);
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) return;
    try {
      const { error } = await supabase.from('crop_operations').delete().eq('id', confirmDelete.id);
      if (error) throw error;
      await logAudit(
        appUser?.name || 'Système',
        'DELETE',
        'crop_operation',
        confirmDelete.id,
        `Opération ${confirmDelete.id} supprimée`,
      );
      toast.show('Opération supprimée');
      setConfirmDelete(null);
      refresh();
    } catch (error) {
      toast.show(`Erreur : ${(error as Error).message}`, 'error');
    }
  }, [confirmDelete, appUser, refresh, toast]);

  const getOperationName = (o: CropOperation) => o.type || `Opération ${o.id}`;

  const renderDetailFields = (o: CropOperation) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-500">Type</p>
          <p className="text-lg font-semibold">{o.type}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Date</p>
          <p className="text-lg font-semibold">{formatDate(o.date)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Description</p>
          <p className="text-lg font-semibold">{o.comment || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Coût</p>
          <p className="text-lg font-semibold">{formatCurrency(o.cost)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Quantité</p>
          <p className="text-lg font-semibold">{o.quantity ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Unité</p>
          <p className="text-lg font-semibold">{o.unit || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Responsable</p>
          <p className="text-lg font-semibold">{o.responsible || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Campagne</p>
          <p className="text-lg font-semibold">{getCampaignName(o.campaign_id ?? null)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Parcelle</p>
          <p className="text-lg font-semibold">{getPlotName(o.plot_id ?? null)}</p>
        </div>
      </div>
    </div>
  );

  const renderDetailFooter = (o: CropOperation) => (
    <>
      <button onClick={() => setConfirmDelete(o)} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Supprimer</button>
      <button onClick={() => { setEditOperation(o); setDetailOperation(null); }} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Modifier</button>
    </>
  );

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader title="Opérations culturales" subtitle="Gestion des opérations culturales" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Total opérations" value={String(totalOps)} icon={<Wheat size={20} />} trend={0} />
        <KpiCard label="Coût total" value={formatCurrency(totalCost)} icon={<Plus size={20} />} trend={0} />
        <KpiCard label="Ce mois" value={String(thisMonth)} icon={<Wheat size={20} />} trend={0} />
      </div>

      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Rechercher (type, description, date, responsable…)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-80 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
        />
        <button
          onClick={openCreate}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Plus size={18} /> Nouvelle opération
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOperations.length === 0 ? (
          <div className="col-span-3">
            <EmptyState
              icon={<Wheat size={48} />}
              title="Aucune opération enregistrée"
              message="Enregistrez vos premières opérations culturales pour suivre vos travaux."
              action={
                <button
                  onClick={openCreate}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus size={18} /> Enregistrer ma première opération
                </button>
              }
            />
          </div>
        ) : (
          filteredOperations.map((o: CropOperation) => (
            <RotatingCard
              key={o.id}
              flipLabel="Actions"
              backLabel="Retour"
              className="h-full min-h-[220px]"
              front={
                <div className="bg-white rounded-xl border border-slate-200 p-5 h-full flex flex-col justify-center">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-slate-500 uppercase">{formatDate(o.date)}</p>
                      <h3 className="font-semibold text-slate-900">{o.type}</h3>
                      <p className="text-sm text-slate-500">{o.comment || '—'}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-green-50 text-green-700 ring-1 ring-green-100">
                      <Wheat size={20} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">Coût</div>
                      <div className="font-medium">{formatCurrency(o.cost)}</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">Parcelle</div>
                      <div className="font-medium">{getPlotName(o.plot_id)}</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-auto">Cliquez pour voir les actions</p>
                </div>
              }
              back={
                <div className="bg-white rounded-xl border border-slate-200 p-5 h-full flex flex-col justify-center">
                  <h3 className="font-semibold text-slate-900 mb-4 text-center">Opération culturale</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Type</span>
                      <span className="font-medium">{o.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date</span>
                      <span className="font-medium">{formatDate(o.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Coût</span>
                      <span className="font-medium">{formatCurrency(o.cost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Responsable</span>
                      <span className="font-medium">{o.responsible || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Campagne</span>
                      <span className="font-medium">{getCampaignName(o.campaign_id)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Parcelle</span>
                      <span className="font-medium">{getPlotName(o.plot_id)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <button
                      onClick={() => { setDetailOperation(o); }}
                      className="px-3 py-2 text-sm text-green-600 border border-green-200 rounded-lg hover:bg-green-50"
                    >
                      Voir
                    </button>
                    <button
                      onClick={() => { openEdit(o); }}
                      className="px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => { setConfirmDelete(o); }}
                      className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              }
            />
          ))
        )}
      </div>

      <DetailModal
        entity={detailOperation}
        onClose={() => setDetailOperation(null)}
        onEdit={openEdit}
        onDelete={setConfirmDelete}
        title="Détail de l'opération"
        size="md"
        renderFields={renderDetailFields}
        footer={detailOperation ? renderDetailFooter(detailOperation) : undefined}
      />

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditOperation(null); }}
        title={editOperation ? 'Modifier l\'opération' : 'Nouvelle opération'}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <FormSection title="Essentiel">
            <FormField label="Date" required error={errors.date}>
              <FormInput
                type="date"
                value={form.date}
                onChange={(e) => setForm('date', e.target.value)}
              />
            </FormField>
            <FormField label="Type" required error={errors.type}>
              <FormSelect
                value={form.type}
                onChange={(e) => setForm('type', e.target.value)}
              >
                <option value="">—</option>
                {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </FormSelect>
            </FormField>
          </FormSection>

          <FormSection title="Liens" defaultOpen={true}>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Campagne" error={errors.campaign_id}>
                <FormSelect
                  value={form.campaign_id || ''}
                  onChange={(e) => setForm('campaign_id', e.target.value || undefined)}
                >
                  <option value="">—</option>
                  {campaigns.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      Campagne {c.year} – {c.crop_name}
                    </option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField label="Parcelle" error={errors.plot_id}>
                <FormSelect
                  value={form.plot_id || ''}
                  onChange={(e) => setForm('plot_id', e.target.value || undefined)}
                >
                  <option value="">—</option>
                  {plots.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.reference} — {p.name}
                    </option>
                  ))}
                </FormSelect>
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Détails" defaultOpen={true}>
            <FormField label="Description" error={errors.comment}>
              <FormTextarea
                value={form.comment || ''}
                onChange={(e) => setForm('comment', e.target.value)}
                rows={2}
                placeholder="Détails de l'opération"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Quantité" error={errors.quantity}>
                <FormInput
                  type="number"
                  value={form.quantity ?? ''}
                  onChange={(e) => setForm('quantity', e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormField>
              <FormField label="Unité" error={errors.unit}>
                <FormSelect
                  value={form.unit || ''}
                  onChange={(e) => setForm('unit', e.target.value)}
                >
                  <option value="">—</option>
                  {UNIT_OPTIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </FormSelect>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Coût (FCFA)" error={errors.cost}>
                <FormInput
                  type="number"
                  value={form.cost ?? ''}
                  onChange={(e) => setForm('cost', e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormField>
              <FormField label="Responsable" error={errors.responsible}>
                <FormInput
                  type="text"
                  value={form.responsible || ''}
                  onChange={(e) => setForm('responsible', e.target.value)}
                  placeholder="ex: Jean Dupont"
                />
              </FormField>
            </div>
          </FormSection>

          <FormActions onSubmit={handleFormSubmit} onCancel={() => { setModalOpen(false); setEditOperation(null); }} isSubmitting={isSubmitting} />
        </form>
      </Modal>

      <ConfirmDeleteModal
        entity={confirmDelete}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
        getEntityName={getOperationName}
      />
    </div>
  );
}