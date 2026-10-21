import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, AlertTriangle, Wrench, Plus, Edit2, Trash2, CheckCircle,
  RotateCcw, RotateCw, X, Filter, Search
} from 'lucide-react';
import { useSurveillance, useSurveillanceMutations } from '@/hooks/useSurveillance';
import type { SurveillanceEvent } from '@/lib/types';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/Toast';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { RotatingCard } from '@/components/ui/RotatingCard';
import { Modal } from '@/components/ui/Modal';
import { useValidatedForm } from '@/components/ui/ValidatedForm';
import { z } from 'zod';

/* ============================================================================
   SCHÉMA DE VALIDATION (Zod)
   ============================================================================ */

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

/* ============================================================================
   CONSTANTES & HELPERS
   ============================================================================ */

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

const TYPE_LABELS: Record<string, string> = {
  phyto_traitement: 'Traitement phytosanitaire',
  equip_panne: 'Panne équipement',
};

/* ============================================================================
   COMPOSANTS CARTE ROTATIVE
   ============================================================================ */

interface SurveillanceCardFrontProps {
  event: SurveillanceEvent;
  onEdit: () => void;
  onDelete: () => void;
  onFlip: () => void;
}

const SurveillanceCardFront = ({ event, onEdit, onDelete, onFlip }: SurveillanceCardFrontProps) => {
  const isOverdue = event.status === 'planifie' && new Date(event.scheduled_at) < new Date();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', paddingBottom: '3.5rem' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[event.type]}`}>
              {TYPE_LABELS[event.type]}
            </span>
            {isOverdue && (
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
          onClick={onFlip}
          className="pointer-events-auto text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 px-2 py-1 bg-white/90 hover:bg-slate-50 rounded border border-slate-200"
          aria-label="Voir les détails"
        >
          <RotateCw size={12} /> Détail
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

interface SurveillanceCardBackProps {
  event: SurveillanceEvent;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMarkCompleted: () => void;
}

const SurveillanceCardBack = ({ event, onClose, onEdit, onDelete, onMarkCompleted }: SurveillanceCardBackProps) => {
  const isOverdue = event.status === 'planifie' && new Date(event.scheduled_at) < new Date();

  return (
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
            {isOverdue && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                <AlertTriangle size={10} /> En retard
              </span>
            )}
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
            onClick={onMarkCompleted}
            className="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-1"
          >
            <CheckCircle size={14} /> Marquer terminé
          </button>
        )}
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

/* ============================================================================
   MODAL CRÉATION / ÉDITION
   ============================================================================ */

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  initialValues?: Partial<SurveillanceFormValues> & { id?: string };
  onSubmit: (values: SurveillanceFormValues) => Promise<void>;
  submitting: boolean;
}

const EventModal = ({ open, onClose, title, initialValues, onSubmit, submitting }: EventModalProps) => {
  const { plots, campaigns, animalLots, animals, projects, users } = useData();
  const { appUser } = useAuth();

  const form = useValidatedForm<SurveillanceFormValues>({
    schema: surveillanceSchema,
    defaultValues: {
      type: 'phyto_traitement',
      plot_id: null,
      campaign_id: null,
      lot_id: null,
      animal_id: null,
      project_id: null,
      label: '',
      description: null,
      scheduled_at: new Date().toISOString().slice(0, 16),
      completed_at: null,
      status: 'planifie',
      cost_amount: null,
      responsible_id: null,
      details: {},
      ...initialValues,
    },
    onSubmit: async (values) => {
      await onSubmit(values);
    },
  });

  // Pré-remplir responsible_id après le montage (évite le setState pendant le render)
  useEffect(() => {
    if (!form.values.responsible_id && appUser) {
      form.setFieldValue('responsible_id', appUser.id);
    }
  }, [form, appUser]);

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <form onSubmit={form.handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
            <select
              value={form.values.type}
              onChange={(e) => form.setFieldValue('type', e.target.value as SurveillanceFormValues['type'])}
              className="form-input w-full"
            >
              {TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {form.errors.type && <p className="text-xs text-red-500 mt-1">{form.errors.type}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Statut *</label>
            <select
              value={form.values.status}
              onChange={(e) => form.setFieldValue('status', e.target.value as SurveillanceFormValues['status'])}
              className="form-input w-full"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Libellé *</label>
          <input
            type="text"
            value={form.values.label}
            onChange={(e) => form.setFieldValue('label', e.target.value)}
            className="form-input w-full"
            placeholder="ex: Traitement mildiou parcelle A3"
          />
          {form.errors.label && <p className="text-xs text-red-500 mt-1">{form.errors.label}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Date planifiée *</label>
          <input
            type="datetime-local"
            value={form.values.scheduled_at}
            onChange={(e) => form.setFieldValue('scheduled_at', e.target.value)}
            className="form-input w-full"
          />
          {form.errors.scheduled_at && <p className="text-xs text-red-500 mt-1">{form.errors.scheduled_at}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date réalisée</label>
            <input
              type="datetime-local"
              value={form.values.completed_at ?? ''}
              onChange={(e) => form.setFieldValue('completed_at', e.target.value || null)}
              className="form-input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Coût (FCFA)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.values.cost_amount ?? ''}
              onChange={(e) => form.setFieldValue('cost_amount', e.target.value ? parseFloat(e.target.value) : null)}
              className="form-input w-full"
              placeholder="0"
            />
            {form.errors.cost_amount && <p className="text-xs text-red-500 mt-1">{form.errors.cost_amount}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Responsable</label>
          <select
            value={form.values.responsible_id ?? ''}
            onChange={(e) => form.setFieldValue('responsible_id', e.target.value || null)}
            className="form-input w-full"
          >
            <option value="">— Aucun —</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        {/* Liaison optionnelle selon le type */}
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-medium text-slate-600 mb-2">Lier à une entité (optionnel)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {form.values.type === 'phyto_traitement' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Parcelle</label>
                  <select
                    value={form.values.plot_id ?? ''}
                    onChange={(e) => form.setFieldValue('plot_id', e.target.value || null)}
                    className="form-input w-full"
                  >
                    <option value="">— Aucune —</option>
                    {plots.map(p => (
                      <option key={p.id} value={p.id}>{p.reference ?? p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Campagne</label>
                  <select
                    value={form.values.campaign_id ?? ''}
                    onChange={(e) => form.setFieldValue('campaign_id', e.target.value || null)}
                    className="form-input w-full"
                  >
                    <option value="">— Aucune —</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.crop_name} ({c.year})</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            {form.values.type === 'equip_panne' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Projet / Chantier</label>
                  <select
                    value={form.values.project_id ?? ''}
                    onChange={(e) => form.setFieldValue('project_id', e.target.value || null)}
                    className="form-input w-full"
                  >
                    <option value="">— Aucun —</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
          <textarea
            value={form.values.description ?? ''}
            onChange={(e) => form.setFieldValue('description', e.target.value || null)}
            className="form-input w-full"
            rows={3}
            placeholder="Description de l'événement..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!form.isValid || submitting}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Enregistrement...' : (initialValues?.id ? 'Mettre à jour' : 'Créer l\'événement')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

/* ============================================================================
   MODAL CONFIRMATION SUPPRESSION
   ============================================================================ */

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eventLabel: string;
  loading: boolean;
}

const DeleteConfirmModal = ({ open, onClose, onConfirm, eventLabel, loading }: DeleteConfirmModalProps) => (
  <Modal open={open} onClose={onClose} title="Confirmer la suppression" size="sm">
    <p className="text-sm text-slate-600 mb-4">
      Supprimer l'événement <strong>{eventLabel}</strong> ?
      <br />Cette action est irréversible (suppression logique).
    </p>
    <div className="flex justify-end gap-2">
      <button
        onClick={onClose}
        disabled={loading}
        className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
      >
        Annuler
      </button>
      <button
        onClick={onConfirm}
        disabled={loading}
        className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
      >
        Supprimer
      </button>
    </div>
  </Modal>
);

/* ============================================================================
   PAGE PRINCIPALE
   ============================================================================ */

export function Surveillance() {
  const navigate = useNavigate();
  const { users, farm } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const { create, update, markCompleted, softDelete, loading: mutationsLoading } = useSurveillanceMutations();

  // Filtres
  const [filterType, setFilterType] = useState<'phyto_traitement' | 'equip_panne' | ''>('');
  const [filterStatus, setFilterStatus] = useState<'planifie' | 'en_cours' | 'termine' | 'annule' | ''>('');

  const surveillance = useSurveillance(
    { type: filterType || undefined, status: filterStatus || undefined },
    1,
    100
  );

  // Modal état
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SurveillanceEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<SurveillanceEvent | null>(null);

  const handleNewEvent = () => {
    setEditingEvent(null);
    setModalOpen(true);
  };

  const handleEdit = (event: SurveillanceEvent) => {
    setEditingEvent(event);
    setModalOpen(true);
  };

  const handleDelete = (event: SurveillanceEvent) => {
    setDeletingEvent(event);
  };

  const handleModalSubmit = async (values: SurveillanceFormValues) => {
    const payload = {
      farm_id: farm?.id ?? '',
      type: values.type,
      plot_id: values.plot_id ?? null,
      campaign_id: values.campaign_id ?? null,
      lot_id: values.lot_id ?? null,
      animal_id: values.animal_id ?? null,
      project_id: values.project_id ?? null,
      label: values.label,
      description: values.description ?? null,
      scheduled_at: values.scheduled_at,
      completed_at: values.completed_at ?? null,
      status: values.status,
      cost_amount: values.cost_amount ?? null,
      responsible_id: values.responsible_id ?? null,
      details: values.details ?? {},
    };

    if (editingEvent) {
      try {
        await update(editingEvent.id, payload);
        setModalOpen(false);
        setEditingEvent(null);
        surveillance.refetch();
      } catch (err) {
        toast.show(`Erreur: ${err instanceof Error ? err.message : 'Mise à jour échouée'}`, 'error');
      }
    } else {
      try {
        await create(payload);
        setModalOpen(false);
        setEditingEvent(null);
        surveillance.refetch();
      } catch (err) {
        toast.show(`Erreur: ${err instanceof Error ? err.message : 'Création échouée'}`, 'error');
      }
    }
  };

  const handleMarkCompleted = async (event: SurveillanceEvent) => {
    await markCompleted(event.id);
    if (!mutationsLoading) {
      surveillance.refetch();
    }
  };

  const confirmDelete = async () => {
    if (!deletingEvent) return;
    await softDelete(deletingEvent.id);
    if (!mutationsLoading) {
      setDeletingEvent(null);
      surveillance.refetch();
    }
  };

  // KPIs
  const events = surveillance.data?.data ?? [];
  const kpis = useMemo(() => ({
    total: events.length,
    planifies: events.filter(e => e.status === 'planifie').length,
    enCours: events.filter(e => e.status === 'en_cours').length,
    termines: events.filter(e => e.status === 'termine').length,
    enRetard: events.filter(e => e.status === 'planifie' && new Date(e.scheduled_at) < new Date()).length,
  }), [events]);

  if (surveillance.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-label="Chargement..." />
      </div>
    );
  }

  if (surveillance.error) {
    return (
      <div className="text-center py-10 text-red-500">
        <AlertTriangle size={48} className="mx-auto mb-4" />
        <p className="text-lg font-medium">Erreur de chargement</p>
        <p className="text-sm">{surveillance.error.message}</p>
        <button
          onClick={() => surveillance.refetch()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête + KPIs */}
      <PageHeader
        title="Surveillance"
        subtitle="Traitements phytosanitaires & Pannes équipement"
        actions={
          <button
            onClick={handleNewEvent}
            disabled={mutationsLoading}
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

      {/* Filtres */}
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

      {/* Grille de cartes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ minHeight: '200px' }}>
        {events.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium">Aucun événement</p>
            <p className="text-sm">Cliquez sur « Nouvel événement » pour commencer</p>
          </div>
        ) : (
          events.map((event) => (
            <RotatingCard
              key={event.id}
              flipLabel={`Détail — ${event.label}`}
              backLabel="Retour"
              front={
                <SurveillanceCardFront
                  event={event}
                  onEdit={() => handleEdit(event)}
                  onDelete={() => handleDelete(event)}
                  onFlip={() => {}}
                />
              }
              back={
                <SurveillanceCardBack
                  event={event}
                  onClose={() => {}}
                  onEdit={() => handleEdit(event)}
                  onDelete={() => handleDelete(event)}
                  onMarkCompleted={() => handleMarkCompleted(event)}
                />
              }
            />
          ))
        )}
        <CreateEventCard onCreate={handleNewEvent} />
      </div>

      {/* Modal création/édition */}
      <EventModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEvent(null); }}
        title={editingEvent ? 'Modifier l\'événement' : 'Nouvel événement'}
        initialValues={editingEvent ? {
          id: editingEvent.id,
          type: editingEvent.type,
          plot_id: editingEvent.plot_id,
          campaign_id: editingEvent.campaign_id,
          lot_id: editingEvent.lot_id,
          animal_id: editingEvent.animal_id,
          project_id: editingEvent.project_id,
          label: editingEvent.label,
          description: editingEvent.description,
          scheduled_at: editingEvent.scheduled_at.replace(' ', 'T').slice(0, 16),
          completed_at: editingEvent.completed_at?.replace(' ', 'T').slice(0, 16) ?? null,
          status: editingEvent.status,
          cost_amount: editingEvent.cost_amount,
          responsible_id: editingEvent.responsible_id,
          details: editingEvent.details,
        } : undefined}
        onSubmit={handleModalSubmit}
        submitting={mutationsLoading}
      />

      {/* Modal confirmation suppression */}
      <DeleteConfirmModal
        open={!!deletingEvent}
        onClose={() => setDeletingEvent(null)}
        onConfirm={confirmDelete}
        eventLabel={deletingEvent?.label ?? ''}
        loading={mutationsLoading}
      />
    </div>
  );
}
