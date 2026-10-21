import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Layers, Wheat, Plus, Trash2, Pencil, Eye, Loader2, Save, CheckCircle, XCircle } from 'lucide-react';
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
import * as z from 'zod';

// Schéma de validation pour les campagnes
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

interface CampaignFormValues {
  year: number;
  plot_id: string;
  crop_name: string;
  start_date: Date;
  expected_harvest_date?: Date;
  budget: number;
  responsible?: string;
  status: 'planned' | 'planted' | 'growing' | 'harvested' | 'completed';
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
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { values: form, setFieldValue: setForm, errors } = useValidatedForm({
    schema: campaignSchema,
    defaultValues: {
      year: new Date().getFullYear(),
      plot_id: '',
      crop_name: '',
      start_date: new Date(),
      expected_harvest_date: undefined,
      budget: 0,
      responsible: '',
      status: 'planned',
    },
    onSubmit: async () => {
      // Fonction factice pour satisfaire TypeScript
      // La vraie logique de soumission est dans handleSubmit ci-dessous
    }
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

  const openCreate = () => {
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
  };

  const openEdit = (campaign: any) => {
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
  };

  const handleSubmit = async () => {
    // Validation avec Zod
    const validationResult = campaignSchema.safeParse(form);
    if (!validationResult.success) {
      // Créer un objet d'erreurs à partir du résultat de validation
      const newErrors: Record<string, string> = {};
      validationResult.error.issues.forEach(issue => {
        if (issue.path[0]) {
          const key = String(issue.path[0]);
          newErrors[key] = issue.message;
        }
      });
      setFormErrors(newErrors);

      // Afficher la première erreur pour simplicité
      const firstError = validationResult.error.issues[0];
      toast.show(`${String(firstError.path[0])}: ${firstError.message}`, 'error');
      return;
    }

    // Effacer les erreurs si la validation réussit
    setFormErrors({});

    setSaving(true);
    try {
      const payload = {
        year: form.year,
        plot_id: form.plot_id,
        crop_name: form.crop_name,
        start_date: form.start_date ? form.start_date.toISOString().split('T')[0] : null,
        expected_harvest_date: form.expected_harvest_date ? form.expected_harvest_date.toISOString().split('T')[0] : null,
        budget: form.budget,
        responsible: form.responsible || null,
        status: form.status,
      };

      if (editCampaign) {
        const { error } = await supabase.from('campaigns').update(payload).eq('id', editCampaign.id);
        if (error) {
          toast.show('Erreur: ' + error.message, 'error');
        } else {
          await logAudit(appUser?.name || 'Système', 'UPDATE', 'campaign', editCampaign?.reference || editCampaign?.id, `Campagne ${editCampaign?.reference || editCampaign?.id} modifiée`);
          toast.show('Campagne modifiée');
          setModalOpen(false);
          refresh();
        }
      } else {
        const { error } = await supabase.from('campaigns').insert(payload);
        if (error) {
          toast.show('Erreur: ' + error.message, 'error');
        } else {
          // Générer une référence simple pour l'affichage
          const ref = `CAMP-${form.year}-${Date.now().toString().slice(-4)}`;
          await logAudit(appUser?.name || 'Système', 'CREATE', 'campaign', ref, `Création de la campagne ${ref}`);
          toast.show('Campagne créée avec succès');
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

  const updateStatus = async (campaign: any, status: string) => {
    if (!campaign) return;
    const { error } = await supabase.from('campaigns').update({ status }).eq('id', campaign.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'UPDATE', 'campaign', campaign?.reference || campaign?.id, `Statut de la campagne ${campaign?.reference || campaign?.id} → "${status}"`);
      toast.show(`Campagne marquée "${status}"`);
      refresh();
    }
  };

  const handleDelete = async () => {
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
  };

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
                    <SimpleBadge color={
                      campaign.status === 'planned' ? 'yellow' :
                      campaign.status === 'planted' ? 'blue' :
                      campaign.status === 'growing' ? 'green' :
                      campaign.status === 'harvested' ? 'amber' :
                      'gray'
                    }>{campaign.status}</SimpleBadge>
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

      {/* Detail modal */}
      <Modal
        open={!!detailCampaign && !confirmDelete}
        onClose={() => setDetailCampaign(null)}
        title={`Campagne ${detailCampaign?.reference || ''}`}
        size="lg"
        footer={
          detailCampaign ? (
            <>
              <button onClick={() => setConfirmDelete(detailCampaign)} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Supprimer</button>
              <button onClick={() => openEdit(detailCampaign)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Modifier</button>
              {detailCampaign.status !== 'completed' && (
                <>
                  {detailCampaign.status === 'planned' && (
                    <button onClick={() => { updateStatus(detailCampaign, 'planted'); setDetailCampaign(null); }} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Marquer plantée</button>
                  )}
                  {(detailCampaign.status === 'planted') && (
                    <button onClick={() => { updateStatus(detailCampaign, 'growing'); setDetailCampaign(null); }} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Marquer en croissance</button>
                  )}
                  {(detailCampaign.status === 'growing') && (
                    <button onClick={() => { updateStatus(detailCampaign, 'harvested'); setDetailCampaign(null); }} className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700">Marquer récoltée</button>
                  )}
                  {(detailCampaign.status === 'harvested') && (
                    <button onClick={() => { updateStatus(detailCampaign, 'completed'); setDetailCampaign(null); }} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Marquer terminée</button>
                  )}
                </>
              )}
            </>
          ) : undefined
        }
      >
        {detailCampaign && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{detailCampaign?.reference || `CAMP-${detailCampaign?.year ?? ''}`}</h2>
                <p className="text-sm text-slate-500">{detailCampaign.crop_name ?? '—'}</p>
              </div>
              <SimpleBadge color={
                detailCampaign.status === 'planned' ? 'yellow' :
                detailCampaign.status === 'planted' ? 'blue' :
                detailCampaign.status === 'growing' ? 'green' :
                detailCampaign.status === 'harvested' ? 'amber' :
                'gray'
              }>
                {detailCampaign.status}
              </SimpleBadge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-slate-400">Année</p><p className="text-sm font-medium">{detailCampaign.year}</p></div>
              <div><p className="text-xs text-slate-400">Parcelle</p><p className="text-sm font-medium">{detailCampaign.plot?.name || '—'}</p></div>
              <div><p className="text-xs text-slate-400">Culture</p><p className="text-sm font-medium">{detailCampaign.crop_name ?? '—'}</p></div>
              <div><p className="text-xs text-slate-400">Date de début</p><p className="text-sm font-medium">{formatDate(String(detailCampaign.start_date))}</p></div>
              <div><p className="text-xs text-slate-400">Récolte prévue</p><p className="text-sm font-medium">{detailCampaign.expected_harvest_date ? formatDate(String(detailCampaign.expected_harvest_date)) : '—'}</p></div>
              <div><p className="text-xs text-slate-400">Budget</p><p className="text-sm font-medium">{formatCurrency(detailCampaign.budget)}</p></div>
              <div><p className="text-xs text-slate-400">Responsable</p><p className="text-sm font-medium">{detailCampaign.responsible ?? '—'}</p></div>
              <div><p className="text-xs text-slate-400">Statut</p><p className="text-sm font-medium">{detailCampaign.status}</p></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editCampaign ? 'Modifier la campagne' : 'Nouvelle campagne'}
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
                  {editCampaign ? 'Modifier' : 'Créer'}
                </>
              )}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Année *</label>
            <input
              type="number"
              min="1900"
              max="2100"
              value={form.year}
              onChange={(e) => setForm('year', parseInt(e.target.value))}
              className={`form-input ${errors.year ? 'border-red-500' : ''}`}
            />
            {errors.year && (
              <p className="mt-1 text-xs text-red-500">{errors.year}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Parcelle *</label>
            <select
              value={form.plot_id}
              onChange={(e) => setForm('plot_id', e.target.value)}
              className="form-input"
            >
              <option value="">Sélectionner une parcelle...</option>
              {plots.map((plot: any) => (
                <option key={plot.id} value={plot.id}>
                  {plot.reference} - {plot.name} ({plot.area_hectares} ha)
                </option>
              ))}
            </select>
            {errors.plot_id && (
              <p className="mt-1 text-xs text-red-500">{errors.plot_id}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nom de la culture *</label>
            <input
              type="text"
              value={form.crop_name}
              onChange={(e) => setForm('crop_name', e.target.value)}
              className={`form-input ${errors.crop_name ? 'border-red-500' : ''}`}
              placeholder="Mais, riz, coton, manioc..."
            />
            {errors.crop_name && (
              <p className="mt-1 text-xs text-red-500">{errors.crop_name}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date de début *</label>
            <input
              type="date"
              value={form.start_date ? form.start_date.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setForm('start_date', new Date(e.target.value));
                }
                // Ignorer les valeurs vides pour maintenir la validité du schéma
              }}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date prévue de récolte</label>
            <input
              type="date"
              value={form.expected_harvest_date ? form.expected_harvest_date.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setForm('expected_harvest_date', new Date(e.target.value));
                }
                // Ignorer les valeurs vides pour maintenir la validité du schéma
              }}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Budget (FCFA)</label>
            <input
              type="number"
              min="0"
              value={form.budget}
              onChange={(e) => setForm('budget', parseFloat(e.target.value) || 0)}
              className={`form-input ${errors.budget ? 'border-red-500' : ''}`}
            />
            {errors.budget && (
              <p className="mt-1 text-xs text-red-500">{errors.budget}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Responsable</label>
            <input
              type="text"
              value={form.responsible}
              onChange={(e) => setForm('responsible', e.target.value)}
              className="form-input"
            />
            {errors.responsible && (
              <p className="mt-1 text-xs text-red-500">{errors.responsible}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Statut</label>
            <select
              value={form.status}
              onChange={(e) => setForm('status', e.target.value as any)}
              className="form-input"
            >
              <option value="planned">Planifiée</option>
              <option value="planted">Plantée</option>
              <option value="growing">En croissance</option>
              <option value="harvested">Récoltée</option>
              <option value="completed">Terminée</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-xs text-red-500">{errors.status}</p>
            )}
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
            <button onClick={handleDelete} disabled={saving} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">Supprimer</button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Voulez-vous vraiment supprimer la campagne « {confirmDelete?.reference || confirmDelete?.id || 'cette campagne'} » ? Cette action est irréversible.</p>
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