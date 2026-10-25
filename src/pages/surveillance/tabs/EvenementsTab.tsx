import { useMemo, useState, useEffect } from 'react';
import { FormSimplifie } from '@/components/ui/FormSimplifie';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSurveillance } from '@/hooks/useSurveillance';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/Toast';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { RotatingCard } from '@/components/ui/RotatingCard';
import { Modal } from '@/components/ui/Modal';
import { useValidatedForm } from '@/components/ui/ValidatedForm';
import { z } from 'zod';
import { Plus, Edit2, Trash2, CheckCircle, Calendar, Filter, Search , Wrench, AlertTriangle, RotateCw} from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  phyto_traitement: 'Traitement phytosanitaire',
  equip_panne: 'Panne équipement',
};

/* ---- Types ---- */
type SurveillanceTab = 'tous' | 'planifie' | 'en_cours' | 'termine' | 'annule';

const TYPE_OPTIONS = [
  { value: 'phyto_traitement', label: 'Traitement phytosanitaire' },
  { value: 'equip_panne', label: 'Panne équipement' },
] as const;

const STATUS_OPTIONS = [
  { value: 'planifie', label: 'Planifié' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'termine', label: 'Terminé' },
  { value: 'annule', label: 'Annulé' },
] as const;

const TYPE_COLORS: Record<string, string> = {
  phyto_traitement: 'bg-green-100 text-green-700',
  equip_panne: 'bg-red-100 text-red-700',
};

const STATUS_COLORS: Record<string, string> = {
  planifie: 'bg-blue-100 text-blue-700',
  en_cours: 'bg-amber-100 text-amber-700',
  termine: 'bg-green-100 text-green-700',
  annule: 'bg-slate-100 text-slate-700',
};

const STATUS_LABELS: Record<string, string> = {
  planifie: 'Planifié',
  en_cours: 'En cours',
  termine: 'Terminé',
  annule: 'Annulé',
};

/* ---- Schéma Zod ---- */
const surveillanceSchema = z.object({
  type: z.enum(['phyto_traitement', 'equip_panne']),
  plot_id: z.string().nullable().optional(),
  campaign_id: z.string().nullable().optional(),
  lot_id: z.string().nullable().optional(),
  animal_id: z.string().nullable().optional(),
  project_id: z.string().nullable().optional(),
  label: z.string().min(1, 'Libellé obligatoire').max(255),
  description: z.string().nullable().optional(),
  scheduled_at: z.string().min(1, 'Date planifiée obligatoire'),
  completed_at: z.string().nullable().optional(),
  status: z.enum(['planifie', 'en_cours', 'termine', 'annule']).default('planifie'),
  cost_amount: z.number().nonnegative('Coût doit être positif ou nul').nullable().optional(),
  responsible_id: z.string().nullable().optional(),
  details: z.record(z.string(), z.unknown()).default({}),
});

type SurveillanceFormValues = z.infer<typeof surveillanceSchema>;

export function EvenementsTab() {
  const navigate = useNavigate();
  const location = useLocation();

  // Détecter l'onglet actif depuis l'URL (?tab=) ET le mettre à jour
  const [activeTab, setActiveTab] = useState<'tous' | 'planifie' | 'en_cours' | 'termine' | 'annule'>('tous');

  useEffect(() => {
    const search = location.search;
    if (search.includes('?tab=')) {
      const params = new URLSearchParams(search);
      const tab = params.get('tab');
      if (tab && STATUS_OPTIONS.some(o => o.value === tab)) {
        setActiveTab(tab as SurveillanceTab);
      }
    }
  }, [location.search]);

  // Synchroniser le changement d'onglet via navigation
  const handleTabChange = (tab: SurveillanceTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams();
    params.set('tab', tab);
    navigate(`?${params.toString()}`, { replace: true });
  };

  const events = useSurveillance(
    { type: undefined, status: (activeTab !== "tous" ? activeTab : undefined) as any },
    1,
    100
  );
  const loading = events.isLoading;
  const refetch = events.refetch;

  // KPIs
  const kpis = useMemo(() => {
    const data = events.data?.data ?? [];
    return {
      total: data.length,
      planifies: data.filter((e: any) => e.status === 'planifie').length,
      enCours: data.filter((e: any) => e.status === 'en_cours').length,
      enRetard: data.filter((e: any) => e.status === 'planifie' && new Date(e.scheduled_at) < new Date()).length,
    };
  }, [events.data?.data]);

  // Filtres
  const [filterType, setFilterType] = useState<'phyto_traitement' | 'equip_panne' | ''>('');
  const [filterStatus, setFilterStatus] = useState<'planifie' | 'en_cours' | 'termine' | 'annule' | ''>('');

  const filtered = useMemo(() => {
    return (events.data?.data ?? []).filter((e: any) => {
      if (filterType && e.type !== filterType) return false;
      if (filterStatus && e.status !== filterStatus) return false;
      return true;
    });
  }, [events.data?.data, filterType, filterStatus]);

  // Modal création/édition
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  const handleNewEvent = () => {
    setEditingEvent(null);
    setModalOpen(true);
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setModalOpen(true);
  };

  const handleDelete = (event: any) => {
    if (!window.confirm('Supprimer cet événement ?')) return;
    // TODO: appeler softDelete via useSurveillanceMutations
    setEditingEvent(null);
    setModalOpen(false);
    refetch();
  };

  const handleModalSubmit = async (values: SurveillanceFormValues) => {
    // TODO: implémenter create/update via useSurveillanceMutations
    setModalOpen(false);
    setEditingEvent(null);
    refetch();
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Événements de surveillance"
        subtitle="Traitements phytosanitaires & Pannes équipement"
        actions={
          <button
            onClick={handleNewEvent}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Plus size={16} /> Nouvel événement
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total" value={String(kpis.total)} icon={<Calendar size={16} />} color="dark" />
        <KpiCard label="Planifiés" value={String(kpis.planifies)} icon={<Calendar size={16} />} color="blue" />
        <KpiCard label="En cours" value={String(kpis.enCours)} icon={<Wrench size={16} />} color="amber" />
        <KpiCard label="En retard" value={String(kpis.enRetard)} icon={<AlertTriangle size={16} />} color="red" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            aria-label="Filtrer par type"
          >
            <option value="">Tous les types</option>
            {TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="relative flex-1">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            aria-label="Filtrer par statut"
          >
            <option value="">Tous les statuts</option>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ minHeight: '200px' }}>
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium">Aucun événement</p>
            <p className="text-sm">Cliquez sur « Nouvel événement » pour commencer</p>
          </div>
        ) : (
          filtered.map((event: any) => (
            <RotatingCard
              key={event.id}
              flipLabel={`Détail — ${event.label}`}
              backLabel="Retour"
              front={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', paddingBottom: '3.5rem' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[event.type]}`}>
                          {TYPE_LABELS[event.type]}
                        </span>
                        {event.status === 'planifie' && new Date(event.scheduled_at) < new Date() && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                            <AlertTriangle size={10} /> En retard
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">{event.label}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[event.status]} flex-shrink-0`}>
                      {STATUS_LABELS[event.status]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{formatDate(event.scheduled_at)}</span>
                    </div>
                    {event.cost_amount !== null && event.cost_amount !== undefined && (
                      <span className="font-medium text-slate-900">{formatCurrency(event.cost_amount)}</span>
                    )}
                  </div>

                  {event.responsible && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Wrench size={12} />
                      <span className="truncate">{event.responsible.name}</span>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-1 pointer-events-none">
                    <button
                      onClick={() => {}}
                      className="pointer-events-auto text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 px-2 py-1 bg-white/90 hover:bg-slate-50 rounded border border-slate-200"
                      aria-label="Voir les détails"
                    >
                      <RotateCw size={12} /> Détail
                    </button>
                    <div className="flex items-center gap-1 pointer-events-auto">
                      <button
                        onClick={() => handleEdit(event)}
                        className="text-xs text-slate-500 hover:text-green-700 flex items-center gap-1 px-2 py-1 bg-white/90 hover:bg-green-50 rounded border border-slate-200"
                        aria-label="Modifier"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(event)}
                        className="text-xs text-slate-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 bg-white/90 hover:bg-red-50 rounded border border-slate-200"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              }
              back={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', paddingBottom: '3.5rem', overflow: 'auto' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold">{event.label}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[event.type]}`}>
                          {TYPE_LABELS[event.type]}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[event.status]}`}>
                          {STATUS_LABELS[event.status]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Date planifiée</p>
                      <p className="font-medium">{formatDateTime(event.scheduled_at)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Statut</p>
                      <p className="font-medium capitalize">{STATUS_LABELS[event.status]}</p>
                    </div>
                    {event.completed_at && (
                      <div>
                        <p className="text-slate-500">Date réalisée</p>
                        <p className="font-medium">{formatDateTime(event.completed_at)}</p>
                      </div>
                    )}
                    {event.cost_amount !== null && event.cost_amount !== undefined && (
                      <div>
                        <p className="text-slate-500">Coût</p>
                        <p className="font-bold text-slate-900">{formatCurrency(event.cost_amount)}</p>
                      </div>
                    )}
                    {event.responsible && (
                      <div>
                        <p className="text-slate-500">Responsable</p>
                        <p className="font-medium">{event.responsible.name}</p>
                      </div>
                    )}
                    {event.plot && (
                      <div>
                        <p className="text-slate-500">Parcelle</p>
                        <p className="font-medium">{event.plot.reference ?? event.plot.name}</p>
                      </div>
                    )}
                    {event.campaign && (
                      <div>
                        <p className="text-slate-500">Campagne</p>
                        <p className="font-medium">{event.campaign.crop_name} ({event.campaign.year})</p>
                      </div>
                    )}
                    {event.lot && (
                      <div>
                        <p className="text-slate-500">Lot</p>
                        <p className="font-medium">{event.lot.identifier} — {event.lot.species}</p>
                      </div>
                    )}
                    {event.animal && (
                      <div>
                        <p className="text-slate-500">Animal</p>
                        <p className="font-medium">{event.animal.identifier ?? event.animal.species}</p>
                      </div>
                    )}
                    {event.project && (
                      <div>
                        <p className="text-slate-500">Projet</p>
                        <p className="font-medium">{event.project.name}</p>
                      </div>
                    )}
                  </div>

                  {event.description && (
                    <div>
                      <p className="text-slate-500 text-sm">Description</p>
                      <p className="text-sm">{event.description}</p>
                    </div>
                  )}

                  {Object.keys(event.details || {}).length > 0 && (
                    <div>
                      <p className="text-slate-500 text-sm">Détails</p>
                      <pre className="text-xs bg-slate-50 p-2 rounded overflow-auto max-h-24">
                        {JSON.stringify(event.details, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="mt-auto flex justify-end gap-2 pt-2 border-t border-slate-100">
                    {event.status !== 'termine' && event.status !== 'annule' && (
                      <button
                        onClick={() => {}}
                        className="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-1"
                      >
                        <CheckCircle size={14} /> Marquer terminé
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(event)}
                      className="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-1"
                    >
                      <Edit2 size={14} /> Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(event)}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Supprimer
                    </button>
                    <button
                      onClick={() => {}}
                      className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Retour
                    </button>
                  </div>
                </div>
              }
            />
          ))
        )}
        <CreateEventCard onCreate={handleNewEvent} />
      </div>

      {/* Modal création/édition */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEvent(null); }}
        title={editingEvent ? 'Modifier l\'événement' : 'Nouvel événement'}
      >
        <form onSubmit={handleModalSubmit as unknown as (e: React.FormEvent) => Promise<void>} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-ink-mut">Type</label>
            <select
              value={editingEvent?.type || 'phyto_traitement'}
              onChange={(e) => setEditingEvent(editingEvent ? { ...editingEvent, type: e.target.value } : null)}
              className="w-full px-3 py-2 bg-white border border-ivory-deep rounded-sm text-ink"
            >
              <option value="phyto_traitement">Traitement phytosanitaire</option>
              <option value="equip_panne">Panne équipement</option>
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-ink-mut">Libellé</label>
            <input
              type="text"
              value={editingEvent?.label || ''}
              onChange={(e) => setEditingEvent(editingEvent ? { ...editingEvent, label: e.target.value } : null)}
              className="w-full px-3 py-2 bg-white border border-ivory-deep rounded-sm text-ink"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-ink-mut">Date planifiée</label>
            <input
              type="datetime-local"
              value={editingEvent?.scheduled_at?.replace(' ', 'T').slice(0, 16) || ''}
              onChange={(e) => setEditingEvent(editingEvent ? { ...editingEvent, scheduled_at: e.target.value } : null)}
              className="w-full px-3 py-2 bg-white border border-ivory-deep rounded-sm text-ink"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => { setModalOpen(false); setEditingEvent(null); }}
              className="px-4 py-2 text-sm text-ink-mut hover:bg-ivory-alt rounded-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-signal text-night rounded-sm hover:bg-signal/90 disabled:opacity-50"
            >
              {loading ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ---- Card vide de création ---- */
const CreateEventCard = ({ onCreate }: { onCreate: () => void }) => (
  <div className="rc" style={{ minHeight: '180px' }}>
    <div className="rc-inner" style={{ transform: 'none' }}>
      <div className="rc-face rc-face--front" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '1rem', padding: '2rem', border: '2px dashed #CBD5E1', background: '#FAFAFA',
        transform: 'rotateY(0deg)', backfaceVisibility: 'hidden'
      }}>
        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
          <Plus size={28} className="text-blue-600" />
        </div>
        <div className="text-center">
          <h4 className="font-semibold text-slate-900">Nouvel événement</h4>
          <p className="text-sm text-slate-500">Créer un événement de surveillance</p>
        </div>
        <button
          onClick={onCreate}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Créer un événement
        </button>
      </div>
    </div>
  </div>
);