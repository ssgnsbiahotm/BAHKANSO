import { useState, useMemo, useCallback } from 'react';
import { Sprout, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/types';
import { useToast } from '@/lib/Toast';
import { formatCurrency, formatDate } from '@/lib/format';
import { RotatingCard } from '@/components/ui/RotatingCard';
import * as z from 'zod';
import type { Plot, Site } from '@/lib/types';

import '@/styles/module-theme.css';

const plotSchema = z.object({
  reference: z.string().min(1, 'La référence est obligatoire'),
  name: z.string().min(1, 'Le nom est obligatoire'),
  area_hectares: z.number().positive('La superficie doit être positive'),
  location: z.string().optional(),
  soil_type: z.enum(['sandy', 'loamy', 'clay', 'silty', 'peaty', 'chalky']).optional(),
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

function statusLabel(status: string) {
  return status === 'active' ? 'Actif' : status === 'inactive' ? 'Inactif' : status;
}

const soilTypeLabels: Record<string, string> = {
  sandy: 'Sableux',
  loamy: 'Limoneux',
  clay: 'Argileux',
  silty: 'Limoneux fin',
  peaty: 'Tourbeux',
  chalky: 'Calcaire',
};

export function ParcellesPage() {
  const navigate = useNavigate();
  const { plots, sites, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editPlot, setEditPlot] = useState<Plot | null>(null);
  const [detailPlot, setDetailPlot] = useState<Plot | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Plot | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlots = useMemo(() => {
    if (!searchTerm) return plots;
    const term = searchTerm.toLowerCase();
    return plots.filter(p =>
      (p.reference || '').toLowerCase().includes(term) ||
      p.name.toLowerCase().includes(term) ||
      (p.location || '').toLowerCase().includes(term) ||
      (p.current_crop || '').toLowerCase().includes(term)
    );
  }, [plots, searchTerm]);

  const kpis = useMemo(() => {
    const totalArea = plots.reduce((s, p) => s + (p.area_hectares || 0), 0);
    const activePlots = plots.filter(p => p.status === 'active').length;
    const activeArea = plots
      .filter(p => p.status === 'active')
      .reduce((s, p) => s + (p.area_hectares || 0), 0);
    return [
      { label: 'Surface totale', value: totalArea.toFixed(2), unit: 'ha' },
      { label: 'Parcelles actives', value: String(activePlots), unit: '' },
      { label: 'Surface active', value: activeArea.toFixed(2), unit: 'ha' },
      { label: 'Total parcelles', value: String(plots.length), unit: '' },
    ];
  }, [plots]);

  const { values: form, setFieldValue: setForm, resetForm, errors, isSubmitting, handleSubmit: handleFormSubmit } = useValidatedForm({
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
        await logAudit(
          appUser?.name || 'Système',
          'UPDATE',
          'plot',
          editPlot.reference,
          `Parcelle ${editPlot.reference} modifiée`,
        );
        toast.show('Parcelle modifiée');
      } else {
        const { error } = await supabase.from('plots').insert(payload);
        if (error) throw error;
        await logAudit(
          appUser?.name || 'Système',
          'CREATE',
          'plot',
          payload.reference,
          `Création de la parcelle ${payload.reference}`,
        );
        toast.show('Parcelle créée avec succès');
      }
      refresh();
    },
    onSuccess: () => { setModalOpen(false); setEditPlot(null); },
    onError: (err) => toast.show('Erreur: ' + err.message, 'error'),
    isEdit: !!editPlot,
  });

  const openCreate = useCallback(() => {
    resetForm();
    setEditPlot(null);
    setModalOpen(true);
  }, [resetForm]);

  const openEdit = useCallback((plot: Plot) => {
    setEditPlot(plot);
    setForm('reference', plot.reference ?? '');
    setForm('name', plot.name);
    setForm('area_hectares', plot.area_hectares);
    setForm('location', plot.location ?? '');
    setForm('soil_type', plot.soil_type as PlotFormValues['soil_type']);
    setForm('status', plot.status as PlotFormValues['status']);
    setForm('current_crop', plot.current_crop ?? '');
    setModalOpen(true);
  }, []);

  const openDetail = useCallback((plot: Plot) => {
    setDetailPlot(plot);
  }, []);

  const handleDelete = useCallback(
    (plot: Plot) => {
      setConfirmDelete(plot);
    },
    [],
  );

  const handleDeleteConfirmed = useCallback(async (plot: Plot) => {
    const { error } = await supabase.from('plots').delete().eq('id', plot.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(
        appUser?.name || 'Système',
        'DELETE',
        'plot',
        plot.reference,
        `Parcelle ${plot.reference} supprimée`,
      );
      toast.show('Parcelle supprimée');
      setDetailPlot(null);
      refresh();
    }
  }, [appUser, refresh, toast]);

  const getPlotName = (p: Plot) => p.reference || p.name;

  const getBadgeColor = (status: string) => {
    if (status === 'active') return 'green';
    if (status === 'inactive') return 'gray';
    return 'amber';
  };

  const renderPlotFront = (p: Plot) => (
    <div className="h-full flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">{p.reference || p.name}</h3>
            <p className="text-sm text-slate-500">{p.name}</p>
          </div>
          <span className={`module-badge module-badge-${getBadgeColor(p.status)}`}>
            {statusLabel(p.status)}
          </span>
        </div>
        <div className="space-y-1 text-sm">
          <p><span className="text-slate-500">Superficie :</span> <span className="font-medium">{p.area_hectares} ha</span></p>
          <p><span className="text-slate-500">Culture :</span> <span className="font-medium">{p.current_crop || '—'}</span></p>
          <p><span className="text-slate-500">Sol :</span> <span className="font-medium">{soilTypeLabels[p.soil_type || ''] || '—'}</span></p>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-emerald-200">
        <p className="text-sm text-emerald-700 font-medium">Voir les détails →</p>
      </div>
    </div>
  );

  const renderPlotBack = (p: Plot) => (
    <div className="h-full flex flex-col justify-between">
      <div className="space-y-2 text-sm">
        <h3 className="font-semibold text-slate-900 mb-3">{p.reference || p.name}</h3>
        <p><span className="text-slate-500">Référence :</span> {p.reference || '—'}</p>
        <p><span className="text-slate-500">Nom :</span> {p.name}</p>
        <p><span className="text-slate-500">Superficie :</span> {p.area_hectares} ha</p>
        <p><span className="text-slate-500">Culture :</span> {p.current_crop || '—'}</p>
        <p><span className="text-slate-500">Type de sol :</span> {soilTypeLabels[p.soil_type || ''] || '—'}</p>
        <p><span className="text-slate-500">Localisation :</span> {p.location || '—'}</p>
        <p><span className="text-slate-500">Statut :</span> {statusLabel(p.status)}</p>
        <p><span className="text-slate-500">Site :</span> {(sites as Site[]).find(s => s.id === p.site_id)?.name || '—'}</p>
      </div>
      <div className="mt-4 pt-3 border-t border-emerald-200 space-y-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(`/app/exploitation/parcelles?select=${p.id}&action=view`); }}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
        >
          <Eye size={16} /> Voir détails
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); openEdit(p); }}
            className="flex-1 bg-white text-blue-600 border border-blue-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 flex items-center justify-center gap-1"
          >
            <Pencil size={14} /> Modifier
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(p); }}
            className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-1"
          >
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      </div>
    </div>
  );

  const renderDetailFields = (p: Plot) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Référence</p>
          <p className="font-mono text-slate-900">{p.reference || '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Nom</p>
          <p className="text-slate-900">{p.name}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Superficie</p>
          <p className="text-slate-900">{p.area_hectares} ha</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Culture</p>
          <p className="text-slate-900">{p.current_crop || '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Type de sol</p>
          <p className="text-slate-900">{soilTypeLabels[p.soil_type || ''] || '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Localisation</p>
          <p className="text-slate-900">{p.location || '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Statut</p>
          <p className={`text-slate-900 font-medium ${p.status === 'active' ? 'text-green-600' : 'text-slate-500'}`}>
            {statusLabel(p.status)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Site</p>
          <p className="text-slate-900">
            {(sites as Site[]).find(s => s.id === p.site_id)?.name || '—'}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="module-page">
      {/* ========== HEADER ========== */}
      <header className="module-header">
        <div className="module-header-left">
          <h1>Parcelles</h1>
          <p className="module-subtitle">Création, modification et suivi des parcelles agricoles</p>
        </div>
        <div className="module-header-right">
          <button
            onClick={openCreate}
            className="module-btn module-btn-primary"
          >
            <Plus size={16} /> Nouvelle parcelle
          </button>
        </div>
      </header>

      {/* ========== KPI GRID ========== */}
      <div className="module-kpi-grid">
        <div className="module-kpi-card" style={{ borderLeftColor: '#2E7D32' }}>
          <div className="module-kpi-header">
            <div className="module-kpi-icon" style={{ backgroundColor: 'rgba(46, 125, 50, 0.15)', color: '#2E7D32' }}>
              <Sprout size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">Surface totale</p>
            <div className="module-kpi-value" style={{ color: '#2E7D32' }}>
              {kpis[0].value}
            </div>
          </div>
        </div>
        <div className="module-kpi-card" style={{ borderLeftColor: '#0277BD' }}>
          <div className="module-kpi-header">
            <div className="module-kpi-icon" style={{ backgroundColor: 'rgba(2, 119, 189, 0.15)', color: '#0277BD' }}>
              <Sprout size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">Parcelles actives</p>
            <div className="module-kpi-value" style={{ color: '#0277BD' }}>
              {kpis[1].value}
            </div>
          </div>
        </div>
        <div className="module-kpi-card" style={{ borderLeftColor: '#F57F17' }}>
          <div className="module-kpi-header">
            <div className="module-kpi-icon" style={{ backgroundColor: 'rgba(245, 127, 23, 0.15)', color: '#F57F17' }}>
              <Sprout size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">Surface active</p>
            <div className="module-kpi-value" style={{ color: '#F57F17' }}>
              {kpis[2].value}
            </div>
          </div>
        </div>
        <div className="module-kpi-card" style={{ borderLeftColor: '#C62828' }}>
          <div className="module-kpi-header">
            <div className="module-kpi-icon" style={{ backgroundColor: 'rgba(198, 40, 40, 0.15)', color: '#C62828' }}>
              <Sprout size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">Total parcelles</p>
            <div className="module-kpi-value" style={{ color: '#C62828' }}>
              {kpis[3].value}
            </div>
          </div>
        </div>
      </div>

      {/* ========== SECTION ========== */}
      <section className="module-section" aria-labelledby="parcelles-title">
        <div className="module-section-header">
          <h2 className="module-section-title" id="parcelles-title">Parcelles agricoles</h2>
        </div>

        <div className="module-search-wrapper mb-4">
          <input
            type="search"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher par référence, nom, localisation, culture…"
            className="module-search-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="module-btn module-btn-ghost ml-2"
            >
              Réinitialiser
            </button>
          )}
        </div>

        {filteredPlots.length === 0 ? (
          <div className="module-empty-state">
            <Sprout size={48} className="module-empty-icon" />
            <h3 className="module-empty-title">Aucune parcelle</h3>
            <p className="module-empty-message">Créez votre première parcelle pour commencer.</p>
            <button
              onClick={openCreate}
              className="module-btn module-btn-primary"
            >
              <Plus size={14} /> Créer une parcelle
            </button>
          </div>
        ) : (
          <div className="module-cards-grid">
            {filteredPlots.map((plot) => (
              <RotatingCard
                key={plot.id}
                flipLabel="Détails"
                backLabel="Retour"
                front={renderPlotFront(plot)}
                back={renderPlotBack(plot)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ========== MODALS ========== */}
      <DetailModal
        entity={detailPlot}
        onClose={() => setDetailPlot(null)}
        onEdit={openEdit}
        onDelete={setConfirmDelete}
        title="Fiche de la parcelle"
        size="lg"
        renderFields={renderDetailFields}
      />

      <Modal
        open={modalOpen}
        onClose={() => { resetForm(); setModalOpen(false); setEditPlot(null); }}
        title={editPlot ? 'Éditer la parcelle' : 'Nouvelle parcelle'}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <FormSection title="Essentiel">
            <FormField label="Nom" required error={errors.name}>
              <FormInput
                value={form.name}
                onChange={e => setForm('name', e.target.value)}
              />
            </FormField>
            <FormField label="Superficie (ha)" required error={errors.area_hectares}>
              <FormInput
                type="number"
                step="0.01"
                min="0.01"
                value={form.area_hectares}
                onChange={e => setForm('area_hectares', Number(e.target.value) || 0)}
              />
            </FormField>
            <FormField label="Culture actuelle" error={errors.current_crop}>
              <FormInput
                value={form.current_crop}
                onChange={e => setForm('current_crop', e.target.value)}
              />
            </FormField>
            <FormField label="Localisation" error={errors.location}>
              <FormInput
                value={form.location}
                onChange={e => setForm('location', e.target.value)}
              />
            </FormField>
            <FormField label="Statut" error={errors.status}>
              <FormSelect
                value={form.status}
                onChange={e => setForm('status', e.target.value as PlotFormValues['status'])}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="en préparation">En préparation</option>
              </FormSelect>
            </FormField>
          </FormSection>
          <Accordion title="Champs avancés" defaultOpen={false}>
            <FormField label="Référence" error={errors.reference}>
              <FormInput
                value={form.reference}
                onChange={e => setForm('reference', e.target.value)}
              />
            </FormField>
            <FormField label="Type de sol" error={errors.soil_type}>
              <FormSelect
                value={form.soil_type ?? ''}
                onChange={e => setForm('soil_type', (e.target.value as PlotFormValues['soil_type']) || undefined)}
              >
                <option value="">—</option>
                {['sandy', 'loamy', 'clay', 'silty', 'peaty', 'chalky'].map((s) => (
                  <option key={s} value={s}>{soilTypeLabels[s]}</option>
                ))}
              </FormSelect>
            </FormField>
          </Accordion>
          <FormActions onSubmit={handleFormSubmit} onCancel={() => { resetForm(); setModalOpen(false); setEditPlot(null); }} isSubmitting={isSubmitting} />
        </form>
      </Modal>

      <ConfirmDeleteModal
        entity={confirmDelete}
        onConfirm={() => confirmDelete && handleDeleteConfirmed(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        getEntityName={getPlotName}
      />
    </div>
  );
}

// Import form primitives
import { FormField, FormInput, FormSelect, FormActions, FormSection, ConfirmDeleteModal, DetailModal } from '@/components/ui/FormPrimitives';
import { useValidatedForm } from '@/components/ui/ValidatedForm';
import { Accordion } from '@/components/ui/Accordion';
import { Modal } from '@/components/ui/Modal';
import { useNavigate } from 'react-router-dom';
