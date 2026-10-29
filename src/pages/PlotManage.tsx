import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, MapPin, Plus } from 'lucide-react';
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
import { FormField, FormInput, FormSelect, FormActions, ConfirmDeleteModal, DetailModal, FormSection } from '@/components/ui/FormPrimitives';
import * as z from 'zod';

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

type PlotFormValues = z.infer<typeof plotSchema>;

const DEFAULT_VALUES: PlotFormValues = {
  reference: '',
  name: '',
  area_hectares: 0,
  location: '',
  soil_type: undefined,
  status: 'active',
  current_crop: '',
};

const SOIL_OPTIONS = [
  { value: 'sandy', label: 'Sableux' },
  { value: 'loamy', label: 'Argilo-sableux' },
  { value: 'clay', label: 'Argileux' },
  { value: 'silty', label: 'Limoneux' },
  { value: 'peaty', label: 'Tourbeux' },
  { value: 'chalky', label: 'Calcaire' },
] as const;

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'en préparation', label: 'En préparation' },
] as const;

function getStatusColor(status: string): 'green' | 'red' | 'yellow' {
  return status === 'active' ? 'green' : status === 'inactive' ? 'red' : 'yellow';
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
  const [searchTerm, setSearchTerm] = useState('');

  const { values: form, setFieldValue: setForm, errors, isSubmitting, handleSubmit: handleFormSubmit } = useValidatedForm({
    schema: plotSchema,
    defaultValues: DEFAULT_VALUES,
    onSubmit: async (values) => {
      const payload = {
        reference: values.reference,
        name: values.name,
        area_hectares: values.area_hectares,
        location: values.location || null,
        soil_type: values.soil_type || null,
        status: values.status,
        current_crop: values.current_crop || null,
      };

      if (editPlot) {
        const { error } = await supabase.from('plots').update(payload).eq('id', editPlot.id);
        if (error) throw error;
        await logAudit(appUser?.name || 'Système', 'UPDATE', 'plot', editPlot.reference, `Parcelle ${editPlot.reference} modifiée`);
        toast.show('Parcelle modifiée');
      } else {
        const { error } = await supabase.from('plots').insert(payload);
        if (error) throw error;
        await logAudit(appUser?.name || 'Système', 'CREATE', 'plot', payload.reference, `Création de la parcelle ${payload.reference}`);
        toast.show('Parcelle créée avec succès');
      }
      refresh();
    },
    onSuccess: () => { setModalOpen(false); setEditPlot(null); },
    onError: (err) => toast.show('Erreur: ' + err.message, 'error'),
    isEdit: !!editPlot,
  });

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

  const openCreate = useCallback(() => {
    setEditPlot(null);
    setForm('reference', '');
    setForm('name', '');
    setForm('area_hectares', 0);
    setForm('location', '');
    setForm('soil_type', undefined);
    setForm('status', 'active');
    setForm('current_crop', '');
    setModalOpen(true);
  }, [setForm]);

  const openEdit = useCallback((plot: any) => {
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
  }, [setForm]);

  const updateStatus = useCallback(async (plot: any, status: string) => {
    const { error } = await supabase.from('plots').update({ status }).eq('id', plot.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'UPDATE', 'plot', plot.reference, `Statut de la parcelle ${plot.reference} → "${status}"`);
      toast.show(`Parcelle marquée "${status}"`);
      refresh();
    }
  }, [appUser, refresh, toast]);

  const handleDelete = useCallback(async () => {
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
  }, [confirmDelete, appUser, refresh, toast]);

  const getPlotName = (p: any) => p.reference || p.name;

  const renderDetailFields = (plot: any) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{plot.reference}</h2>
          <p className="text-sm text-slate-500">{plot.name}</p>
        </div>
        <SimpleBadge color={getStatusColor(plot.status)}>
          {plot.status}
        </SimpleBadge>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><p className="text-xs text-slate-400">Référence</p><p className="text-sm font-medium">{plot.reference}</p></div>
        <div><p className="text-xs text-slate-400">Nom</p><p className="text-sm font-medium">{plot.name}</p></div>
        <div><p className="text-xs text-slate-400">Superficie</p><p className="text-sm font-medium">{plot.area_hectares} ha</p></div>
        <div><p className="text-xs text-slate-400">Localisation</p><p className="text-sm font-medium">{plot.location || '—'}</p></div>
        <div><p className="text-xs text-slate-400">Type de sol</p><p className="text-sm font-medium">{plot.soil_type || '—'}</p></div>
        <div><p className="text-xs text-slate-400">Culture actuelle</p><p className="text-sm font-medium">{plot.current_crop || '—'}</p></div>
        <div><p className="text-xs text-slate-400">Statut</p><p className="text-sm font-medium">{plot.status}</p></div>
      </div>
    </div>
  );

  const renderDetailFooter = (plot: any) => (
    <>
      <button onClick={() => setConfirmDelete(plot)} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Supprimer</button>
      <button onClick={() => openEdit(plot)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Modifier</button>
      {plot.status !== 'inactive' && (
        <>
          {plot.status === 'active' && (
            <button onClick={() => { updateStatus(plot, 'inactive'); setDetailPlot(null); }} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Désactiver</button>
          )}
          {(plot.status === 'inactive' || plot.status === 'en préparation') && (
            <button onClick={() => { updateStatus(plot, 'active'); setDetailPlot(null); }} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Activer</button>
          )}
        </>
      )}
    </>
  );

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
            <div key={plot.id} className="rotatable-card bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailPlot(plot)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600"><Sprout size={20} /></div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{plot.reference}</h3>
                    <p className="text-xs text-slate-500">{plot.name}</p>
                  </div>
                </div>
                <SimpleBadge color={getStatusColor(plot.status)}>
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

      <DetailModal
        entity={detailPlot}
        onClose={() => setDetailPlot(null)}
        onEdit={openEdit}
        onDelete={setConfirmDelete}
        title={`Parcelle ${detailPlot?.reference || ''}`}
        size="lg"
        renderFields={renderDetailFields}
        footer={detailPlot ? renderDetailFooter(detailPlot) : undefined}
      />

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditPlot(null); }}
        title={editPlot ? 'Modifier la parcelle' : 'Nouvelle parcelle'}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <FormSection title="Essentiel">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Référence" required error={errors.reference}>
                <FormInput
                  value={form.reference}
                  onChange={(e) => setForm('reference', e.target.value)}
                  placeholder="PARC-001"
                />
              </FormField>
              <FormField label="Nom" required error={errors.name}>
                <FormInput
                  value={form.name}
                  onChange={(e) => setForm('name', e.target.value)}
                  placeholder="Parcelle Nord"
                />
              </FormField>
              <FormField label="Superficie (hectares)" required error={errors.area_hectares}>
                <FormInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.area_hectares}
                  onChange={(e) => setForm('area_hectares', parseFloat(e.target.value) || 0)}
                  placeholder="5.5"
                />
              </FormField>
              <FormField label="Localisation" error={errors.location}>
                <FormInput
                  value={form.location}
                  onChange={(e) => setForm('location', e.target.value)}
                  placeholder="Nord-ouest de l'exploitation"
                />
              </FormField>
              <FormField label="Type de sol" error={errors.soil_type}>
                <FormSelect
                  value={form.soil_type ?? ''}
                  onChange={(e) => setForm('soil_type', (e.target.value as PlotFormValues['soil_type']) || undefined)}
                >
                  <option value="">Non spécifié</option>
                  {SOIL_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </FormSelect>
              </FormField>
              <FormField label="Statut" error={errors.status}>
                <FormSelect
                  value={form.status}
                  onChange={(e) => setForm('status', e.target.value as PlotFormValues['status'])}
                >
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </FormSelect>
              </FormField>
              <FormField label="Culture actuelle" error={errors.current_crop}>
                <FormInput
                  value={form.current_crop}
                  onChange={(e) => setForm('current_crop', e.target.value)}
                  placeholder="Maïs, riz, coton..."
                />
              </FormField>
            </div>
          </FormSection>

          <FormActions onSubmit={handleFormSubmit} onCancel={() => { setModalOpen(false); setEditPlot(null); }} isSubmitting={isSubmitting} />
        </form>
      </Modal>

      <ConfirmDeleteModal
        entity={confirmDelete}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
        getEntityName={getPlotName}
      />
    </div>
  );
}