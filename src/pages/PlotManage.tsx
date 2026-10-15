import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, MapPin, Plus, Trash2, Pencil, Eye, Loader2, Save, CheckCircle, XCircle } from 'lucide-react';
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
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useValidatedForm } from '@/components/ui/ValidatedForm';
import * as z from 'zod';

// Schéma de validation pour les parcelles
const plotSchema = z.object({
  reference: z.string().min(1, 'La référence est obligatoire'),
  name: z.string().min(1, 'Le nom est obligatoire'),
  area_hectares: z.number().positive('La superficie doit être positive'),
  location: z.string().optional(),
  soil_type: z.enum([
    'sandy',
    'loamy',
    'clay',
    'silty',
    'peaty',
    'chalky'
  ]).optional(),
  status: z.enum(['active', 'inactive', 'en préparation']).default('active'),
  current_crop: z.string().optional(),
});

interface PlotFormValues {
  reference: string;
  name: string;
  area_hectares: number;
  location?: string;
  soil_type?: 'sandy' | 'loamy' | 'clay' | 'silty' | 'peaty' | 'chalky';
  status: 'active' | 'inactive' | 'en préparation';
  current_crop?: string;
}

export function PlotManage() {
  const { plots, sites, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [editPlot, setEditPlot] = useState<any>(null);
  const [detailPlot, setDetailPlot] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { values: form, setFieldValue: setForm, errors } = useValidatedForm({
    schema: plotSchema,
    defaultValues: {
      reference: '',
      name: '',
      area_hectares: 0,
      location: '',
      soil_type: undefined,
      status: 'active',
      current_crop: '',
    },
    onSubmit: async () => {
      // Fonction factice pour satisfaire TypeScript
      // La vraie logique de soumission est dans handleSubmit ci-dessous
    }
  });

  // Charger les sites pour le sélecteur (à implémenter si nécessaire)
  // Pour l'instant, on utilise un champ texte libre pour la localisation

  const filteredPlots = useMemo(() => {
    if (!searchTerm) return plots;
    const term = searchTerm.toLowerCase();
    return plots.filter(p =>
      (p.reference || '').toLowerCase().includes(term) ||
      p.name.toLowerCase().includes(term) ||
      (p.location || '').toLowerCase().includes(term) ||
      (p.soil_type || '').toLowerCase().includes(term) ||
      (p.current_crop || '').toLowerCase().includes(term)
    );
  }, [plots, searchTerm]);

  const kpis = useMemo(() => {
    const totalArea = plots.reduce((s, p) => s + p.area_hectares, 0);
    const activePlots = plots.filter(p => p.status === 'active').length;
    return { totalArea, activePlots };
  }, [plots]);

  const openCreate = () => {
    setEditPlot(null);
    setForm('reference', '');
    setForm('name', '');
    setForm('area_hectares', 0);
    setForm('location', '');
    setForm('soil_type', undefined);
    setForm('status', 'active');
    setForm('current_crop', '');
    setModalOpen(true);
  };

  const openEdit = (plot: any) => {
    setEditPlot(plot);
    setForm('reference', plot.reference);
    setForm('name', plot.name);
    setForm('area_hectares', plot.area_hectares);
    setForm('location', plot.location || '');
    setForm('soil_type', plot.soil_type as any);
    setForm('status', plot.status);
    setForm('current_crop', plot.current_crop || '');
    setDetailPlot(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    // Validation avec Zod
    const validationResult = plotSchema.safeParse(form);
    if (!validationResult.success) {
      // Afficher la première erreur pour simplicité
      const firstError = validationResult.error.issues[0];
      toast.show(`${String(firstError.path[0])}: ${firstError.message}`, 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        reference: form.reference,
        name: form.name,
        area_hectares: form.area_hectares,
        location: form.location || null,
        soil_type: form.soil_type || null,
        status: form.status,
        current_crop: form.current_crop || null,
      };

      if (editPlot) {
        const { error } = await supabase.from('plots').update(payload).eq('id', editPlot.id);
        if (error) {
          toast.show('Erreur: ' + error.message, 'error');
        } else {
          await logAudit(appUser?.name || 'Système', 'UPDATE', 'plot', editPlot.reference, `Parcelle ${editPlot.reference} modifiée`);
          toast.show('Parcelle modifiée');
          setModalOpen(false);
          refresh();
        }
      } else {
        const { error } = await supabase.from('plots').insert(payload);
        if (error) {
          toast.show('Erreur: ' + error.message, 'error');
        } else {
          await logAudit(appUser?.name || 'Système', 'CREATE', 'plot', payload.reference, `Création de la parcelle ${payload.reference}`);
          toast.show('Parcelle créée avec succès');
          setModalOpen(false);
          refresh();
        }
      }
    } catch (error) {
      toast.show('Erreur inattendue: ' + (error as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (plot: any, status: string) => {
    const { error } = await supabase.from('plots').update({ status }).eq('id', plot.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'UPDATE', 'plot', plot.reference, `Statut de la parcelle ${plot.reference} → "${status}"`);
      toast.show(`Parcelle marquée "${status}"`);
      refresh();
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('plots').delete().eq('id', confirmDelete.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'DELETE', 'plot', confirmDelete.reference, `Parcelle ${confirmDelete.reference} supprimée`);
      toast.show('Parcelle supprimée');
      setConfirmDelete(null);
      setDetailPlot(null);
      refresh();
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Gestion des parcelles"
        subtitle="Création, modification et suivi des parcelles agricoles"
        actions={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
            <Plus size={18} /> Nouvelle parcelle
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Surface totale" value={`${kpis.totalArea} ha`} icon={<MapPin size={20} />} color="green" />
        <KpiCard label="Parcelles actives" value={String(kpis.activePlots)} icon={<MapPin size={20} />} color="blue" />
        <KpiCard label="Surface active" value={`${plots.filter(p => p.status === 'active').reduce((s, p) => s + p.area_hectares, 0)} ha`} icon={<MapPin size={20} />} color="amber" />
        <KpiCard label="Total parcelles" value={String(plots.length)} icon={<Sprout size={20} />} color="dark" />
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-medium text-slate-600 mb-1">Rechercher des parcelles</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
            placeholder="Rechercher par référence, nom, localisation, type de sol ou culture..."
          />
        </div>
        <button
          onClick={() => setSearchTerm('')}
          className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          Réinitialiser
        </button>
      </div>

      {filteredPlots.length === 0 ? (
        <EmptyState
          icon={<Sprout size={48} />}
          title={searchTerm ? "Aucun résultat" : "Aucune parcelle"}
          message={searchTerm ? "Aucune parcelle ne correspond à votre recherche" : "Aucune parcelle enregistrée"}
          action={searchTerm ? undefined : <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"><Plus size={16} /> Créer une parcelle</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlots.map((plot: any) => (
            <div key={plot.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailPlot(plot)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600"><Sprout size={20} /></div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{plot.reference}</h3>
                    <p className="text-xs text-slate-500">{plot.name}</p>
                  </div>
                </div>
                <SimpleBadge color={plot.status === 'active' ? 'green' : plot.status === 'inactive' ? 'red' : 'yellow'}>
                  {plot.status}
                </SimpleBadge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Superficie</span><span className="font-medium">{plot.area_hectares} ha</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Culture actuelle</span><span className="font-medium">{plot.current_crop || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Type de sol</span><span className="font-medium">{plot.soil_type || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Localisation</span><span className="font-medium">{plot.location || '—'}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={!!detailPlot && !confirmDelete}
        onClose={() => setDetailPlot(null)}
        title={`Parcelle ${detailPlot?.reference || ''}`}
        size="lg"
        footer={
          detailPlot ? (
            <>
              <button onClick={() => setConfirmDelete(detailPlot)} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Supprimer</button>
              <button onClick={() => openEdit(detailPlot)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Modifier</button>
              {detailPlot.status !== 'inactive' && (
                <>
                  {detailPlot.status === 'active' && (
                    <button onClick={() => { updateStatus(detailPlot, 'inactive'); setDetailPlot(null); }} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Désactiver</button>
                  )}
                  {(detailPlot.status === 'inactive' || detailPlot.status === 'en préparation') && (
                    <button onClick={() => { updateStatus(detailPlot, 'active'); setDetailPlot(null); }} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Activer</button>
                  )}
                </>
              )}
            </>
          ) : undefined
        }
      >
        {detailPlot && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{detailPlot.reference}</h2>
                <p className="text-sm text-slate-500">{detailPlot.name}</p>
              </div>
              <SimpleBadge color={detailPlot.status === 'active' ? 'green' : detailPlot.status === 'inactive' ? 'red' : 'yellow'}>
                {detailPlot.status}
              </SimpleBadge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-slate-400">Référence</p><p className="text-sm font-medium">{detailPlot.reference}</p></div>
              <div><p className="text-xs text-slate-400">Nom</p><p className="text-sm font-medium">{detailPlot.name}</p></div>
              <div><p className="text-xs text-slate-400">Superficie</p><p className="text-sm font-medium">{detailPlot.area_hectares} ha</p></div>
              <div><p className="text-xs text-slate-400">Localisation</p><p className="text-sm font-medium">{detailPlot.location || '—'}</p></div>
              <div><p className="text-xs text-slate-400">Type de sol</p><p className="text-sm font-medium">{detailPlot.soil_type || '—'}</p></div>
              <div><p className="text-xs text-slate-400">Culture actuelle</p><p className="text-sm font-medium">{detailPlot.current_crop || '—'}</p></div>
              <div><p className="text-xs text-slate-400">Statut</p><p className="text-sm font-medium">{detailPlot.status}</p></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editPlot ? 'Modifier la parcelle' : 'Nouvelle parcelle'}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {editPlot ? 'Modifier' : 'Créer'}
                </>
              )}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Référence *</label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => setForm('reference', e.target.value)}
              className={`form-input ${errors.reference ? 'border-red-500' : ''}`}
              placeholder="PARC-001"
            />
            {errors.reference && (
              <p className="mt-1 text-xs text-red-500">{errors.reference}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nom *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm('name', e.target.value)}
              className={`form-input ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Parcelle Nord"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Superficie (hectares) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.area_hectares}
              onChange={(e) => setForm('area_hectares', parseFloat(e.target.value) || 0)}
              className={`form-input ${errors.area_hectares ? 'border-red-500' : ''}`}
              placeholder="5.5"
            />
            {errors.area_hectares && (
              <p className="mt-1 text-xs text-red-500">{errors.area_hectares}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Localisation</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm('location', e.target.value)}
              className="form-input"
              placeholder="Nord-ouest de l'exploitation"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type de sol</label>
            <select
              value={form.soil_type}
              onChange={(e) => setForm('soil_type', e.target.value as any)}
              className="form-input"
            >
              <option value="">Non spécifié</option>
              <option value="sandy">Sableux</option>
              <option value="loamy">Argilo-sableux</option>
              <option value="clay">Argileux</option>
              <option value="silty">Limoneux</option>
              <option value="peaty">Tourbeux</option>
              <option value="chalky">Calcaire</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Statut</label>
            <select
              value={form.status}
              onChange={(e) => setForm('status', e.target.value as any)}
              className="form-input"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="en préparation">En préparation</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Culture actuelle</label>
            <input
              type="text"
              value={form.current_crop}
              onChange={(e) => setForm('current_crop', e.target.value)}
              className="form-input"
              placeholder="Mais, riz, coton..."
            />
          </div>
        </div>
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
        <p className="text-sm text-slate-600">Voulez-vous vraiment supprimer la parcelle « {confirmDelete?.reference} » ? Cette action est irréversible.</p>
      </Modal>
    </div>
  );
}

// Extrait les erreurs du hook useValidatedForm pour une utilisation plus simple dans ce composant
function extractErrors<T>(result: any): Partial<Record<keyof T, string>> {
  // Cette fonction serait normalement fournie par le hook useValidatedForm
  // Pour cet exemple, on retourne un objet vide
  return {};
}