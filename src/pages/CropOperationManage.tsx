import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wheat, Plus, Trash2, Pencil, Eye, Save, List, Calendar, MapPin } from 'lucide-react';
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

interface CropOperationFormValues {
  campaign_id?: string;
  plot_id?: string;
  date: string;
  type: string;
  comment?: string;
  quantity?: number;
  unit?: string;
  cost?: number;
  responsible?: string;
}

export function CropOperationManage() {
  const { cropOperations, campaigns, plots, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [editOperation, setEditOperation] = useState<any>(null);
  const [detailOperation, setDetailOperation] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { values: form, setFieldValue: setForm, errors, handleSubmit } = useValidatedForm({
    schema: cropOperationSchema,
    defaultValues: {
      campaign_id: '',
      plot_id: '',
      date: '',
      type: '',
      comment: '',
      quantity: undefined,
      unit: '',
      cost: undefined,
      responsible: '',
    },
    onSubmit: async (values) => {
      if (!values.date) {
        toast.show('La date est obligatoire', 'error');
        return;
      }

      setSaving(true);
      setSubmitError(null);
      try {
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

        setModalOpen(false);
        setEditOperation(null);
        refresh();
      } catch {
        setSubmitError(
          'Impossible d’enregistrer l’opération. Un problème technique empêche sa sauvegarde. Vos saisies sont conservées.',
        );
        console.error('Erreur technique sauvegarde opération');
      } finally {
        setSaving(false);
      }
    },
  });

  useEffect(() => {
    if (editOperation) {
      setForm('campaign_id', editOperation.campaign_id || '');
      setForm('plot_id', editOperation.plot_id || '');
      setForm('date', editOperation.date || '');
      setForm('type', editOperation.type || '');
      setForm('comment', editOperation.comment || '');
      setForm('quantity', editOperation.quantity != null ? editOperation.quantity : undefined);
      setForm('unit', editOperation.unit || '');
      setForm('cost', editOperation.cost != null ? editOperation.cost : undefined);
      setForm('responsible', editOperation.responsible || '');
      setSubmitError(null);
    } else {
      setForm('campaign_id', '');
      setForm('plot_id', '');
      setForm('date', '');
      setForm('type', '');
      setForm('comment', '');
      setForm('quantity', undefined);
      setForm('unit', '');
      setForm('cost', undefined);
      setForm('responsible', '');
      setSubmitError(null);
    }
  }, [editOperation]);

  const handleDelete = async () => {
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
  };

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

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader title="Opérations culturales" subtitle="Gestion des opérations culturales" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Total opérations" value={String(totalOps)} icon={<List size={20} />} trend={0} />
        <KpiCard label="Coût total" value={formatCurrency(totalCost)} icon={<Save size={20} />} trend={0} />
        <KpiCard label="Ce mois" value={String(thisMonth)} icon={<Calendar size={20} />} trend={0} />
      </div>

      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Rechercher (type, description, date, responsable…)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input w-full md:w-80"
        />
        <button
          onClick={() => {
            setEditOperation(null);
            setModalOpen(true);
          }}
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
                  onClick={() => {
                    setEditOperation(null);
                    setModalOpen(true);
                  }}
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
                      <MapPin size={20} />
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
                      onClick={() => {
                        setDetailOperation(o);
                        setModalOpen(true);
                      }}
                      className="px-3 py-2 text-sm text-green-600 border border-green-200 rounded-lg hover:bg-green-50"
                    >
                      <Eye size={14} /> Voir
                    </button>
                    <button
                      onClick={() => {
                        setEditOperation(o);
                        setModalOpen(true);
                      }}
                      className="px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                    >
                      <Pencil size={14} /> Modifier
                    </button>
                    <button
                      onClick={() => {
                        setConfirmDelete(o);
                        setModalOpen(true);
                      }}
                      className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={14} /> Supprimer
                    </button>
                  </div>
                </div>
              }
            />
          ))
        )}
      </div>

      {/* Modal formulaire création/édition */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editOperation ? 'Modifier l\'opération' : 'Nouvelle opération'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {submitError}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm('date', e.target.value)}
              className="form-input w-full"
            />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
            <select
              value={form.type}
              onChange={(e) => setForm('type', e.target.value)}
              className="form-input w-full"
            >
              <option value="">—</option>
              <option value="semis">Semis</option>
              <option value="irrigation">Irrigation</option>
              <option value="traitement">Traitement</option>
              <option value="fertilisation">Fertilisation</option>
              <option value="recolte">Récolte</option>
              <option value="autre">Autre</option>
            </select>
            {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Campagne</label>
              <select
                value={form.campaign_id || ''}
                onChange={(e) => setForm('campaign_id', e.target.value || undefined)}
                className="form-input w-full"
              >
                <option value="">—</option>
                {campaigns.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    Campagne {c.year} – {c.crop_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Parcelle</label>
              <select
                value={form.plot_id || ''}
                onChange={(e) => setForm('plot_id', e.target.value || undefined)}
                className="form-input w-full"
              >
                <option value="">—</option>
                {plots.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.reference} — {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea
              value={form.comment || ''}
              onChange={(e) => setForm('comment', e.target.value)}
              className="form-input w-full"
              rows={2}
              placeholder="Détails de l'opération"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Quantité</label>
              <input
                type="number"
                value={form.quantity ?? ''}
                onChange={(e) => setForm('quantity', e.target.value ? Number(e.target.value) : undefined)}
                className="form-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Unité</label>
              <select
                value={form.unit || ''}
                onChange={(e) => setForm('unit', e.target.value)}
                className="form-input w-full"
              >
                <option value="">—</option>
                <option value="kg">kg</option>
                <option value="tonne">tonne</option>
                <option value="litre">litre</option>
                <option value="m2">m²</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Coût (FCFA)</label>
              <input
                type="number"
                value={form.cost ?? ''}
                onChange={(e) => setForm('cost', e.target.value ? Number(e.target.value) : undefined)}
                className="form-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Responsable</label>
              <input
                type="text"
                value={form.responsible || ''}
                onChange={(e) => setForm('responsible', e.target.value)}
                className="form-input w-full"
                placeholder="ex: Jean Dupont"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:justify-end w-full">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="w-full sm:w-auto px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : editOperation ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal détail */}
      <Modal
        open={modalOpen && !!detailOperation}
        onClose={() => setDetailOperation(null)}
        title="Détail de l'opération"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Type</p>
              <p className="text-lg font-semibold">{detailOperation?.type}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Date</p>
              <p className="text-lg font-semibold">{formatDate(detailOperation?.date)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Description</p>
              <p className="text-lg font-semibold">{detailOperation?.comment || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Coût</p>
              <p className="text-lg font-semibold">{formatCurrency(detailOperation?.cost)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Quantité</p>
              <p className="text-lg font-semibold">{detailOperation?.quantity ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Unité</p>
              <p className="text-lg font-semibold">{detailOperation?.unit || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Responsable</p>
              <p className="text-lg font-semibold">{detailOperation?.responsible || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Campagne</p>
              <p className="text-lg font-semibold">{getCampaignName(detailOperation?.campaign_id ?? null)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Parcelle</p>
              <p className="text-lg font-semibold">{getPlotName(detailOperation?.plot_id ?? null)}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDetailOperation(null)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={() => {
                setEditOperation(detailOperation ?? null);
                setDetailOperation(null);
              }}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Modifier
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmDelete(detailOperation ?? null);
                setDetailOperation(null);
              }}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal suppression */}
      <Modal
        open={modalOpen && !!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Supprimer une opération"
        size="sm"
      >
        <p className="text-sm text-slate-600">
          Voulez-vous vraiment supprimer l'opération du {formatDate(confirmDelete?.date)} ? Cette action est irréversible.
        </p>
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => setConfirmDelete(null)}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Supprimer
          </button>
        </div>
      </Modal>
    </div>
  );
}
