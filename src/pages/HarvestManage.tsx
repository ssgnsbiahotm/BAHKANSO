import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wheat, Plus, Trash2, Pencil, Eye, Save, List } from 'lucide-react';
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
import { EmptyState } from '@/components/ui/EmptyState';
import { useValidatedForm } from '@/components/ui/ValidatedForm';
import * as z from 'zod';
import type { Harvest } from '@/lib/types';

const harvestSchema = z.object({
  campaign_id: z.string().optional(),
  plot_id: z.string().optional(),
  date: z.string().min(1, 'La date est obligatoire'),
  quantity: z.number().positive('La quantité doit être positive'),
  unit: z.string().default('kg'),
  quality: z.string().optional(),
  estimated_price: z.number().nonnegative().optional(),
  revenue: z.number().nonnegative().optional(),
  destination: z.string().optional(),
});

interface HarvestFormValues {
  campaign_id?: string;
  plot_id?: string;
  date: string;
  quantity: number;
  unit: string;
  quality?: string;
  estimated_price?: number;
  revenue?: number;
  destination?: string;
}

export function HarvestManage() {
  const { harvests, campaigns, plots, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [editHarvest, setEditHarvest] = useState<any>(null);
  const [detailHarvest, setDetailHarvest] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { values: form, setFieldValue: setForm, errors } = useValidatedForm({
    schema: harvestSchema,
    defaultValues: {
      campaign_id: '',
      plot_id: '',
      date: '',
      quantity: 0,
      unit: 'kg',
      quality: '',
      estimated_price: undefined,
      revenue: undefined,
      destination: '',
    },
    onSubmit: async (values) => {
      if (!values.date) {
        toast.show('La date est obligatoire', 'error');
        return;
      }

      setSaving(true);
      try {
        const revenue =
          values.revenue ??
          (values.estimated_price != null && values.quantity != null
            ? values.quantity * values.estimated_price
            : undefined);

        const payload = {
          campaign_id: values.campaign_id || null,
          plot_id: values.plot_id || null,
          date: values.date,
          quantity: values.quantity,
          unit: values.unit || 'kg',
          quality: values.quality || null,
          estimated_price: values.estimated_price ?? null,
          revenue: revenue ?? null,
          destination: values.destination || null,
        };

        if (editHarvest) {
          const { error } = await supabase
            .from('harvests')
            .update(payload)
            .eq('id', editHarvest.id);
          if (error) throw error;
          await logAudit(
            appUser?.name || 'Système',
            'UPDATE',
            'harvest',
            editHarvest.id,
            `Récolte ${editHarvest.id} modifiée`,
          );
          toast.show('Récolte modifiée');
        } else {
          const { error } = await supabase.from('harvests').insert([payload]);
          if (error) throw error;
          await logAudit(appUser?.name || 'Système', 'CREATE', 'harvest', '', 'Création de la récolte');
          toast.show('Récolte créée avec succès');
        }

        setModalOpen(false);
        setEditHarvest(null);
        refresh();
      } catch (error) {
        toast.show(`Erreur : ${(error as Error).message}`, 'error');
      } finally {
        setSaving(false);
      }
    },
  });

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const { error } = await supabase.from('harvests').delete().eq('id', confirmDelete.id);
      if (error) throw error;
      await logAudit(
        appUser?.name || 'Système',
        'DELETE',
        'harvest',
        confirmDelete.id,
        `Récolte ${confirmDelete.id} supprimée`,
      );
      toast.show('Récolte supprimée');
      setConfirmDelete(null);
      refresh();
    } catch (error) {
      toast.show(`Erreur : ${(error as Error).message}`, 'error');
    }
  };

  const filteredHarvests = useMemo(() => {
    return harvests.filter((h: Harvest) => {
      const q = searchTerm.toLowerCase();
      return (
        (h.quantity?.toString().toLowerCase().includes(q) ?? false) ||
        (h.unit?.toLowerCase().includes(q) ?? false) ||
        (h.destination?.toLowerCase().includes(q) ?? false) ||
        (h.date?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [harvests, searchTerm]);

  const totalQuantity = harvests.reduce((sum, h) => sum + (h.quantity || 0), 0);
  const totalRevenue = harvests.reduce((sum, h) => sum + (h.revenue || 0), 0);

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
      <PageHeader title="Récoltes" subtitle="Gestion des récoltes agricoles" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Total récolté" value={formatNumber(totalQuantity)} icon={<Wheat size={20} />} trend={0} unit="kg" />
        <KpiCard label="Chiffre d'affaires" value={formatCurrency(totalRevenue)} icon={<Save size={20} />} trend={0} />
        <KpiCard label="Nombre de récoltes" value={String(harvests.length)} icon={<List size={20} />} trend={0} />
      </div>

      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Rechercher (quantité, unité, destination, date…)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input w-full md:w-80"
        />
        <button
          onClick={() => {
            setEditHarvest(null);
            setModalOpen(true);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Plus size={18} /> Nouvelle récolte
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHarvests.length === 0 ? (
          <div className="col-span-3">
            <EmptyState
              icon={<Wheat size={48} />}
              title="Aucune récolte enregistrée"
              message="Enregistrez vos premières récoltes pour suivre vos rendements."
              action={
                <button
                  onClick={() => {
                    setEditHarvest(null);
                    setModalOpen(true);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus size={18} /> Enregistrer ma première récolte
                </button>
              }
            />
          </div>
        ) : (
          filteredHarvests.map((h: Harvest) => (
            <div key={h.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">Récolte {formatDate(h.date)}</h3>
                  <p className="text-sm text-slate-500">{formatDate(h.date)}</p>
                </div>
                <SimpleBadge color="green">{h.unit}</SimpleBadge>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-xs text-slate-500 mb-1">Quantité</div>
                  <div className="font-medium">{h.quantity}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-xs text-slate-500 mb-1">Prix estimé</div>
                  <div className="font-medium">{formatCurrency(h.estimated_price)}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-xs text-slate-500 mb-1">CA</div>
                  <div className="font-medium">{formatCurrency(h.revenue)}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-xs text-slate-500 mb-1">Qualité</div>
                  <div className="font-medium">{h.quality || '—'}</div>
                </div>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg mb-3">
                <div className="text-xs text-slate-500 mb-1">Destination</div>
                <div className="text-sm">{h.destination || '—'}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setDetailHarvest(h);
                    setModalOpen(true);
                  }}
                  className="flex-1 px-3 py-1.5 text-sm text-green-600 border border-green-200 rounded-lg hover:bg-green-50"
                >
                  Voir
                </button>
                <button
                  onClick={() => {
                    setEditHarvest(h);
                    setModalOpen(true);
                  }}
                  className="flex-1 px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                >
                  Modifier
                </button>
                <button
                  onClick={() => {
                    setConfirmDelete(h);
                    setModalOpen(true);
                  }}
                  className="flex-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal formulaire création/édition */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editHarvest ? 'Modifier la récolte' : 'Nouvelle récolte'} size="lg">
        <form onSubmit={form.handleSubmit} className="space-y-4">
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
            <label className="block text-xs font-medium text-slate-600 mb-1">Quantité *</label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm('quantity', Number(e.target.value))}
              className="form-input w-full"
            />
            {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Unité</label>
              <select
                value={form.unit || 'kg'}
                onChange={(e) => setForm('unit', e.target.value)}
                className="form-input w-full"
              >
                <option value="kg">kg</option>
                <option value="tonne">tonne</option>
                <option value="litre">litre</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Qualité</label>
              <input
                type="text"
                value={form.quality || ''}
                onChange={(e) => setForm('quality', e.target.value)}
                className="form-input w-full"
                placeholder="ex: bonne, moyenne, excellente"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Prix estimé (FCFA/unité)</label>
              <input
                type="number"
                value={form.estimated_price ?? ''}
                onChange={(e) => setForm('estimated_price', e.target.value ? Number(e.target.value) : undefined)}
                className="form-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Chiffre d'affaires (FCFA)</label>
              <input
                type="number"
                value={form.revenue ?? ''}
                onChange={(e) => setForm('revenue', e.target.value ? Number(e.target.value) : undefined)}
                className="form-input w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Destination</label>
            <input
              type="text"
              value={form.destination || ''}
              onChange={(e) => setForm('destination', e.target.value)}
              className="form-input w-full"
              placeholder="ex: marché local, coopérative, stockage"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : editHarvest ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal détail */}
      <Modal
        open={modalOpen && !!detailHarvest}
        onClose={() => setDetailHarvest(null)}
        title="Détail de la récolte"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Quantité</p>
              <p className="text-lg font-semibold">{detailHarvest?.quantity}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Unité</p>
              <p className="text-lg font-semibold">{detailHarvest?.unit}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Qualité</p>
              <p className="text-lg font-semibold">{detailHarvest?.quality || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Prix estimé</p>
              <p className="text-lg font-semibold">{formatCurrency(detailHarvest?.estimated_price)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Chiffre d'affaires</p>
              <p className="text-lg font-semibold">{formatCurrency(detailHarvest?.revenue)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Destination</p>
              <p className="text-lg font-semibold">{detailHarvest?.destination || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Date</p>
              <p className="text-lg font-semibold">{formatDate(detailHarvest?.date)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Campagne</p>
              <p className="text-lg font-semibold">{getCampaignName(detailHarvest?.campaign_id ?? null)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Parcelle</p>
              <p className="text-lg font-semibold">{getPlotName(detailHarvest?.plot_id ?? null)}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDetailHarvest(null)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={() => {
                setEditHarvest(detailHarvest ?? null);
                setDetailHarvest(null);
              }}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Modifier
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmDelete(detailHarvest ?? null);
                setDetailHarvest(null);
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
        title="Supprimer une récolte"
        size="sm"
      >
        <p className="text-sm text-slate-600">
          Voulez-vous vraiment supprimer la récolte du {formatDate(confirmDelete?.date)} ? Cette action est irréversible.
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

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('fr-FR').format(value);
}
