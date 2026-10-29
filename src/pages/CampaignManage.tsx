import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Layers, Wheat, Plus } from 'lucide-react';
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
import { RotatingCard } from '@/components/ui/RotatingCard';
import { useValidatedForm } from '@/components/ui/ValidatedForm';
import { FormField, FormInput, FormSelect, FormActions, ConfirmDeleteModal, DetailModal, FormSection } from '@/components/ui/FormPrimitives';
import * as z from 'zod';

const campaignSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  plot_id: z.string(),
  crop_name: z.string().min(1, 'Le nom de la culture est obligatoire'),
  start_date: z.date(),
  expected_harvest_date: z.date().optional(),
  budget: z.number().nonnegative('Le budget ne peut pas être négatif'),
  responsible: z.string().optional(),
  status: z.enum([
    'planned',
    'planted',
    'growing',
    'harvested',
    'completed'
  ]).default('planned'),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

const DEFAULT_VALUES: CampaignFormValues = {
  year: new Date().getFullYear(),
  plot_id: '',
  crop_name: '',
  start_date: new Date(),
  expected_harvest_date: undefined,
  budget: 0,
  responsible: '',
  status: 'planned',
};

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planifiée' },
  { value: 'planted', label: 'Plantée' },
  { value: 'growing', label: 'En croissance' },
  { value: 'harvested', label: 'Récoltée' },
  { value: 'completed', label: 'Terminée' },
] as const;

function getStatusColor(status: string): 'yellow' | 'blue' | 'green' | 'amber' | 'gray' {
  return status === 'planned' ? 'yellow' :
    status === 'planted' ? 'blue' :
    status === 'growing' ? 'green' :
    status === 'harvested' ? 'amber' : 'gray';
}

export function CampaignManage() {
  const { campaigns, plots, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<any>(null);
  const [detailCampaign, setDetailCampaign] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { values: form, setFieldValue: setForm, errors, isSubmitting, handleSubmit: handleFormSubmit } = useValidatedForm({
    schema: campaignSchema,
    defaultValues: DEFAULT_VALUES,
    onSubmit: async (values) => {
      const payload = {
        year: values.year,
        plot_id: values.plot_id,
        crop_name: values.crop_name,
        start_date: values.start_date ? values.start_date.toISOString().split('T')[0] : null,
        expected_harvest_date: values.expected_harvest_date ? values.expected_harvest_date.toISOString().split('T')[0] : null,
        budget: values.budget,
        responsible: values.responsible || null,
        status: values.status,
      };

      if (editCampaign) {
        const { error } = await supabase.from('campaigns').update(payload).eq('id', editCampaign.id);
        if (error) throw error;
        await logAudit(appUser?.name || 'Système', 'UPDATE', 'campaign', editCampaign?.reference || editCampaign?.id, `Campagne ${editCampaign?.reference || editCampaign?.id} modifiée`);
        toast.show('Campagne modifiée');
      } else {
        const { error } = await supabase.from('campaigns').insert(payload);
        if (error) throw error;
        const ref = `CAMP-${values.year}-${Date.now().toString().slice(-4)}`;
        await logAudit(appUser?.name || 'Système', 'CREATE', 'campaign', ref, `Création de la campagne ${ref}`);
        toast.show('Campagne créée avec succès');
      }
      refresh();
    },
    onSuccess: () => { setModalOpen(false); setEditCampaign(null); },
    onError: (err) => toast.show('Erreur: ' + err.message, 'error'),
    isEdit: !!editCampaign,
  });

  const filteredCampaigns = useMemo(() => {
    if (!searchTerm) return campaigns;
    const term = searchTerm.toLowerCase();
    return campaigns.filter(c =>
      String(c.year).includes(term) ||
      c.plot?.name?.toLowerCase().includes(term) ||
      c.crop_name.toLowerCase().includes(term) ||
      (c.responsible || '').toLowerCase().includes(term) ||
      c.status.toLowerCase().includes(term)
    );
  }, [campaigns, searchTerm, plots]);

  const kpis = useMemo(() => {
    const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
    const activeCampaigns = campaigns.filter(c =>
      c.status === 'planted' || c.status === 'growing' || c.status === 'harvested'
    ).length;
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
    return { totalBudget, activeCampaigns, completedCampaigns };
  }, [campaigns]);

  const openCreate = useCallback(() => {
    setEditCampaign(null);
    setForm('year', new Date().getFullYear());
    setForm('plot_id', '');
    setForm('crop_name', '');
    setForm('start_date', new Date());
    setForm('expected_harvest_date', undefined);
    setForm('budget', 0);
    setForm('responsible', '');
    setForm('status', 'planned');
    setModalOpen(true);
  }, [setForm]);

  const openEdit = useCallback((campaign: any) => {
    setEditCampaign(campaign);
    setForm('year', campaign.year);
    setForm('plot_id', campaign.plot_id);
    setForm('crop_name', campaign.crop_name);
    setForm('start_date', new Date(campaign.start_date));
    setForm('expected_harvest_date', campaign.expected_harvest_date ? new Date(campaign.expected_harvest_date) : undefined);
    setForm('budget', campaign.budget);
    setForm('responsible', campaign.responsible || '');
    setForm('status', campaign.status);
    setDetailCampaign(null);
    setModalOpen(true);
  }, [setForm]);

  const updateStatus = useCallback(async (campaign: any, status: string) => {
    if (!campaign) return;
    const { error } = await supabase.from('campaigns').update({ status }).eq('id', campaign.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'UPDATE', 'campaign', campaign?.reference || campaign?.id, `Statut de la campagne ${campaign?.reference || campaign?.id} → "${status}"`);
      toast.show(`Campagne marquée "${status}"`);
      refresh();
    }
  }, [appUser, refresh, toast]);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('campaigns').delete().eq('id', confirmDelete.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'DELETE', 'campaign', confirmDelete?.reference || confirmDelete?.id, `Campagne ${confirmDelete?.reference || confirmDelete?.id} supprimée`);
      toast.show('Campagne supprimée');
      setConfirmDelete(null);
      setDetailCampaign(null);
      refresh();
    }
  }, [confirmDelete, appUser, refresh, toast]);

  const getCampaignName = (c: any) => c.crop_name || `Campagne ${c.year}`;

  const renderDetailFields = (campaign: any) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{campaign?.reference || `CAMP-${campaign?.year ?? ''}`}</h2>
          <p className="text-sm text-slate-500">{campaign.crop_name ?? '—'}</p>
        </div>
        <SimpleBadge color={getStatusColor(campaign.status)}>
          {campaign.status}
        </SimpleBadge>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><p className="text-xs text-slate-400">Année</p><p className="text-sm font-medium">{campaign.year}</p></div>
        <div><p className="text-xs text-slate-400">Parcelle</p><p className="text-sm font-medium">{campaign.plot?.name || '—'}</p></div>
        <div><p className="text-xs text-slate-400">Culture</p><p className="text-sm font-medium">{campaign.crop_name ?? '—'}</p></div>
        <div><p className="text-xs text-slate-400">Date de début</p><p className="text-sm font-medium">{formatDate(String(campaign.start_date))}</p></div>
        <div><p className="text-xs text-slate-400">Récolte prévue</p><p className="text-sm font-medium">{campaign.expected_harvest_date ? formatDate(String(campaign.expected_harvest_date)) : '—'}</p></div>
        <div><p className="text-xs text-slate-400">Budget</p><p className="text-sm font-medium">{formatCurrency(campaign.budget)}</p></div>
        <div><p className="text-xs text-slate-400">Responsable</p><p className="text-sm font-medium">{campaign.responsible ?? '—'}</p></div>
        <div><p className="text-xs text-slate-400">Statut</p><p className="text-sm font-medium">{campaign.status}</p></div>
      </div>
    </div>
  );

  const renderDetailFooter = (campaign: any) => (
    <>
      <button onClick={() => setConfirmDelete(campaign)} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Supprimer</button>
      <button onClick={() => openEdit(campaign)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Modifier</button>
      {campaign.status !== 'completed' && (
        <>
          {campaign.status === 'planned' && (
            <button onClick={() => { updateStatus(campaign, 'planted'); setDetailCampaign(null); }} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Marquer plantée</button>
          )}
          {campaign.status === 'planted' && (
            <button onClick={() => { updateStatus(campaign, 'growing'); setDetailCampaign(null); }} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Marquer en croissance</button>
          )}
          {campaign.status === 'growing' && (
            <button onClick={() => { updateStatus(campaign, 'harvested'); setDetailCampaign(null); }} className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700">Marquer récoltée</button>
          )}
          {campaign.status === 'harvested' && (
            <button onClick={() => { updateStatus(campaign, 'completed'); setDetailCampaign(null); }} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Marquer terminée</button>
          )}
        </>
      )}
    </>
  );

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Gestion des campagnes"
        subtitle="Planification et suivi des campagnes culturales"
        actions={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
            <Plus size={18} /> Nouvelle campagne
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Budget total" value={formatCurrency(kpis.totalBudget)} icon={<Calendar size={20} />} color="blue" />
        <KpiCard label="Campagnes actives" value={String(kpis.activeCampaigns)} icon={<Layers size={20} />} color="green" />
        <KpiCard label="Campagnes terminées" value={String(kpis.completedCampaigns)} icon={<Wheat size={20} />} color="amber" />
        <KpiCard label="Total campagnes" value={String(campaigns.length)} icon={<Calendar size={20} />} color="dark" />
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-medium text-slate-600 mb-1">Rechercher des campagnes</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
            placeholder="Rechercher par année, parcelle, culture, responsable ou statut..."
          />
        </div>
        <button
          type="button"
          onClick={() => setSearchTerm('')}
          className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          Réinitialiser
        </button>
      </div>

      {filteredCampaigns.length === 0 ? (
        <EmptyState
          icon={<Calendar size={48} />}
          title={searchTerm ? "Aucun résultat" : "Aucune campagne"}
          message={searchTerm ? "Aucune campagne ne correspond à votre recherche" : "Aucune campagne enregistrée"}
          action={searchTerm ? undefined : <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"><Plus size={16} /> Créer une campagne</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map((campaign: any) => (
            <RotatingCard
              key={campaign.id}
              flipLabel="Actions"
              backLabel="Retour"
              front={
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{campaign.crop_name}</h3>
                      <p className="text-xs text-slate-500">Année {campaign.year}</p>
                    </div>
                    <SimpleBadge color={getStatusColor(campaign.status)}>{campaign.status}</SimpleBadge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Parcelle</span><span className="font-medium">{campaign.plot?.name || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Date de début</span><span className="font-medium">{formatDate(campaign.start_date)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Récolte prévue</span><span className="font-medium">{formatDate(campaign.expected_harvest_date) || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Budget</span><span className="font-medium text-right">{formatCurrency(campaign.budget)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Responsable</span><span className="font-medium">{campaign.responsible || '—'}</span></div>
                  </div>
                </div>
              }
              back={
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="font-semibold text-slate-900">{campaign.crop_name}</h3>
                      <p className="text-xs text-slate-500">Année {campaign.year}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => openEdit(campaign)}
                      className="w-full text-left px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-100/50"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => setConfirmDelete(campaign)}
                      className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg border border-red-100/50"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              }
            />
          ))}
        </div>
      )}

      <DetailModal
        entity={detailCampaign}
        onClose={() => setDetailCampaign(null)}
        onEdit={openEdit}
        onDelete={setConfirmDelete}
        title={`Campagne ${detailCampaign?.reference || ''}`}
        size="lg"
        renderFields={renderDetailFields}
        footer={detailCampaign ? renderDetailFooter(detailCampaign) : undefined}
      />

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditCampaign(null); }}
        title={editCampaign ? 'Modifier la campagne' : 'Nouvelle campagne'}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <FormSection title="Essentiel">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Année" required error={errors.year}>
                <FormInput
                  type="number"
                  min="1900"
                  max="2100"
                  value={form.year}
                  onChange={(e) => setForm('year', parseInt(e.target.value))}
                />
              </FormField>
              <FormField label="Parcelle" required error={errors.plot_id}>
                <FormSelect
                  value={form.plot_id}
                  onChange={(e) => setForm('plot_id', e.target.value)}
                >
                  <option value="">Sélectionner une parcelle...</option>
                  {plots.map((plot: any) => (
                    <option key={plot.id} value={plot.id}>
                      {plot.reference} - {plot.name} ({plot.area_hectares} ha)
                    </option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField label="Nom de la culture" required error={errors.crop_name}>
                <FormInput
                  value={form.crop_name}
                  onChange={(e) => setForm('crop_name', e.target.value)}
                  placeholder="Maïs, riz, coton, manioc..."
                />
              </FormField>
              <FormField label="Date de début" required error={errors.start_date}>
                <FormInput
                  type="date"
                  value={form.start_date ? form.start_date.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      setForm('start_date', new Date(e.target.value));
                    }
                  }}
                />
              </FormField>
              <FormField label="Date prévue de récolte" error={errors.expected_harvest_date}>
                <FormInput
                  type="date"
                  value={form.expected_harvest_date ? form.expected_harvest_date.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      setForm('expected_harvest_date', new Date(e.target.value));
                    }
                  }}
                />
              </FormField>
              <FormField label="Budget (FCFA)" error={errors.budget}>
                <FormInput
                  type="number"
                  min="0"
                  value={form.budget}
                  onChange={(e) => setForm('budget', parseFloat(e.target.value) || 0)}
                />
              </FormField>
              <FormField label="Responsable" error={errors.responsible}>
                <FormInput
                  value={form.responsible}
                  onChange={(e) => setForm('responsible', e.target.value)}
                />
              </FormField>
              <FormField label="Statut" error={errors.status}>
                <FormSelect
                  value={form.status}
                  onChange={(e) => setForm('status', e.target.value as CampaignFormValues['status'])}
                >
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </FormSelect>
              </FormField>
            </div>
          </FormSection>

          <FormActions onSubmit={handleFormSubmit} onCancel={() => { setModalOpen(false); setEditCampaign(null); }} isSubmitting={isSubmitting} />
        </form>
      </Modal>

      <ConfirmDeleteModal
        entity={confirmDelete}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
        getEntityName={getCampaignName}
      />
    </div>
  );
}