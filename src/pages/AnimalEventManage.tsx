import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { RotatingCard } from '@/components/ui/RotatingCard';
import { Plus, Trash2, Pencil, Eye } from 'lucide-react';
import * as z from 'zod';
import type { AnimalEvent, Animal, AnimalLot } from '@/lib/types';

const eventSchema = z.object({
  type: z.string().min(1, 'Le type est obligatoire'),
  date: z.string().min(1, 'La date est obligatoire'),
  animal_id: z.string().optional().nullable(),
  lot_id: z.string().optional().nullable(),
  description: z.string().optional(),
  cost: z.number().nonnegative('Le coût ne peut pas être négatif').optional(),
  responsible: z.string().optional(),
});

interface EventFormValues {
  type: string;
  date: string;
  animal_id: string | null;
  lot_id: string | null;
  description: string;
  cost: number;
  responsible: string;
}

const TYPE_LABELS: Record<string, string> = {
  vaccination: 'Vaccination',
  traitement: 'Traitement',
  maladie: 'Maladie',
  naissance: 'Naissance',
  vente: 'Vente',
  achat: 'Achat',
  autre: 'Autre',
};

const TYPE_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'vaccination', label: 'Vaccinations' },
  { id: 'traitement', label: 'Traitements' },
  { id: 'maladie', label: 'Maladies' },
  { id: 'autre', label: 'Autres' },
];

export function AnimalEventManage() {
  const { animalEvents, animals, animalLots, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<AnimalEvent | null>(null);
  const [detailEvent, setDetailEvent] = useState<AnimalEvent | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AnimalEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const { values: form, setFieldValue: setForm, errors } = useValidatedForm({
    schema: eventSchema,
    defaultValues: {
      type: '',
      date: '',
      animal_id: null,
      lot_id: null,
      description: '',
      cost: 0,
      responsible: '',
    },
    onSubmit: async () => {
      // La vraie logique est dans handleSubmit ci-dessous
    },
  });

  const filteredEvents = useMemo(() => {
    return animalEvents.filter(e => {
      const matchSearch = !searchTerm ||
        (e.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.responsible || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'all' || e.type === filterType;
      return matchSearch && matchType;
    });
  }, [animalEvents, searchTerm, filterType]);

  const kpis = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const thisMonth = animalEvents.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    return {
      totalEvents: animalEvents.length,
      totalCost: animalEvents.reduce((s, e) => s + (e.cost || 0), 0),
      eventsThisMonth: thisMonth.length,
    };
  }, [animalEvents]);

  const animalName = (id: string | null) => {
    if (!id) return '—';
    const a = animals.find(an => an.id === id);
    return a ? (a.identifier || 'Animal') : '—';
  };

  const lotName = (id: string | null) => {
    if (!id) return '—';
    const l = animalLots.find(lot => lot.id === id);
    return l ? (l.identifier || 'Lot') : '—';
  };

  const openCreate = () => {
    setEditEvent(null);
    setForm('type', '');
    setForm('date', '');
    setForm('animal_id', null);
    setForm('lot_id', null);
    setForm('description', '');
    setForm('cost', 0);
    setForm('responsible', '');
    setDetailEvent(null);
    setModalOpen(true);
  };

  const openEdit = (event: AnimalEvent) => {
    setEditEvent(event);
    setForm('type', event.type);
    setForm('date', event.date);
    setForm('animal_id', event.animal_id);
    setForm('lot_id', event.lot_id);
    setForm('description', event.description || '');
    setForm('cost', event.cost || 0);
    setForm('responsible', event.responsible || '');
    setDetailEvent(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const validationResult = eventSchema.safeParse(form);
    if (!validationResult.success) {
      const newErrors: Record<string, string> = {};
      validationResult.error.issues.forEach(issue => {
        if (issue.path[0]) {
          newErrors[String(issue.path[0])] = issue.message;
        }
      });
      const firstError = validationResult.error.issues[0];
      toast.show(`${String(firstError.path[0])}: ${firstError.message}`, 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type: form.type,
        date: form.date,
        animal_id: form.animal_id || null,
        lot_id: form.lot_id || null,
        description: form.description || null,
        cost: form.cost ?? 0,
        responsible: form.responsible || null,
      };

      if (editEvent?.id) {
        const { error } = await supabase.from('animal_events').update(payload).eq('id', editEvent.id);
        if (error) {
          toast.show('Erreur: ' + error.message, 'error');
        } else {
          await logAudit(appUser?.name || 'Système', 'UPDATE', 'animal_event', editEvent.id, `Événement ${editEvent.id} modifié`);
          toast.show('Événement modifié');
          setModalOpen(false);
          refresh();
        }
      } else {
        const { error } = await supabase.from('animal_events').insert(payload);
        if (error) {
          toast.show('Erreur: ' + error.message, 'error');
        } else {
          await logAudit(appUser?.name || 'Système', 'CREATE', 'animal_event', payload.animal_id, `Création d'événement ${payload.type}`);
          toast.show('Événement créé avec succès');
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

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('animal_events').delete().eq('id', confirmDelete.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'DELETE', 'animal_event', confirmDelete.id, `Événement ${confirmDelete.id} supprimé`);
      toast.show('Événement supprimé');
      setConfirmDelete(null);
      setDetailEvent(null);
      refresh();
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Gestion des événements animaux"
        subtitle="Suivi des événements de santé et de production"
        actions={
          <>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
              <Plus size={18} /> Nouvel événement
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total événements" value={String(kpis.totalEvents)} icon={null} color="blue" />
        <KpiCard label="Coût total" value={formatCurrency(kpis.totalCost)} icon={null} color="amber" />
        <KpiCard label="Événements ce mois" value={String(kpis.eventsThisMonth)} icon={null} color="green" />
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-medium text-slate-600 mb-1">Rechercher des événements</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
            placeholder="Rechercher par type, description, responsable..."
          />
        </div>
        <button
          onClick={() => setSearchTerm('')}
          className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          Réinitialiser
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {TYPE_FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              filterType === f.id
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={null}
          title={searchTerm || filterType !== 'all' ? "Aucun résultat" : "Aucun événement"}
          message={searchTerm || filterType !== 'all'
            ? "Aucun événement ne correspond à vos filtres"
            : "Aucun événement animal enregistré"}
          action={searchTerm ? undefined : <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">Créer un événement</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map(event => {
            const animal = animalName(event.animal_id);
            const lot = lotName(event.lot_id);
            return (
              <RotatingCard
                key={event.id}
                front={
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">{formatDate(event.date)}</h3>
                      <SimpleBadge color="blue">{TYPE_LABELS[event.type] || event.type}</SimpleBadge>
                    </div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Animal / Lot</span><span className="font-medium">{animal} {lot !== '—' ? '/' + lot : ''}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Coût</span><span className="font-medium">{formatCurrency(event.cost)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Responsable</span><span className="font-medium">{event.responsible || '—'}</span></div>
                  </div>
                }
                back={
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => { setDetailEvent(event); setModalOpen(false); }}
                      className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Voir détails
                    </button>
                    <button
                      onClick={() => { openEdit(event); setModalOpen(false); }}
                      className="w-full px-3 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => { setConfirmDelete(event); setModalOpen(false); }}
                      className="w-full px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  </div>
                }
                flipLabel="Actions"
                backLabel="Retour"
              />
            );
          })}
        </div>
      )}

      {/* Modal détail */}
      <Modal
        open={!!detailEvent && !confirmDelete}
        onClose={() => setDetailEvent(null)}
        title={`Événement ${detailEvent?.id || ''}`}
        size="lg"
        footer={
          detailEvent ? (
            <>
              <button onClick={() => setConfirmDelete(detailEvent)} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Supprimer</button>
              <button onClick={() => openEdit(detailEvent)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Modifier</button>
            </>
          ) : undefined
        }
      >
        {detailEvent && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{TYPE_LABELS[detailEvent.type] || detailEvent.type}</h2>
                <p className="text-sm text-slate-500">{formatDate(detailEvent.date)}</p>
              </div>
              <SimpleBadge color="blue">{detailEvent.type}</SimpleBadge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-slate-400">Type</p><p className="text-sm font-medium">{detailEvent.type}</p></div>
              <div><p className="text-xs text-slate-400">Date</p><p className="text-sm font-medium">{formatDate(detailEvent.date)}</p></div>
              <div><p className="text-xs text-slate-400">Animal</p><p className="text-sm font-medium">{animalName(detailEvent.animal_id)}</p></div>
              <div><p className="text-xs text-slate-400">Lot</p><p className="text-sm font-medium">{lotName(detailEvent.lot_id)}</p></div>
              <div><p className="text-xs text-slate-400">Coût</p><p className="text-sm font-medium">{formatCurrency(detailEvent.cost)}</p></div>
              <div><p className="text-xs text-slate-400">Responsable</p><p className="text-sm font-medium">{detailEvent.responsible || '—'}</p></div>
              <div><p className="text-xs text-slate-400">Description</p><p className="text-sm font-medium">{detailEvent.description || '—'}</p></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal formulaire création/édition */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editEvent ? "Modifier l'événement" : "Nouvel événement"}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {saving ? (
                <>
                  Enregistrement...
                </>
              ) : (
                <>
                  <span>{editEvent ? 'Modifier' : 'Créer'}</span>
                </>
              )}
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-medium text-slate-600 mb-2">Informations essentielles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm('type', e.target.value)}
                  className={`form-input ${errors.type ? 'border-red-500' : ''}`}
                >
                  <option value="vaccination">Vaccination</option>
                  <option value="traitement">Traitement</option>
                  <option value="maladie">Maladie</option>
                  <option value="naissance">Naissance</option>
                  <option value="vente">Vente</option>
                  <option value="achat">Achat</option>
                  <option value="autre">Autre</option>
                </select>
                {errors.type && <p className="mt-1 text-xs text-red-500">{errors.type}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm('date', e.target.value)}
                  className={`form-input ${errors.date ? 'border-red-500' : ''}`}
                />
                {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Animal</label>
                <select
                  value={form.animal_id ?? ''}
                  onChange={(e) => setForm('animal_id', e.target.value || null)}
                  className="form-input"
                >
                  <option value="">Aucun</option>
                  {animals.map(a => (
                    <option key={a.id} value={a.id}>{a.identifier || 'Animal'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Lot</label>
                <select
                  value={form.lot_id ?? ''}
                  onChange={(e) => setForm('lot_id', e.target.value || null)}
                  className="form-input"
                >
                  <option value="">Aucun</option>
                  {animalLots.map(l => (
                    <option key={l.id} value={l.id}>{l.identifier || 'Lot'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Coût (FCFA)</label>
                <input
                  type="number"
                  min="0"
                  value={form.cost ?? ''}
                  onChange={(e) => setForm('cost', e.target.value ? parseFloat(e.target.value) : 0)}
                  className={`form-input ${errors.cost ? 'border-red-500' : ''}`}
                  placeholder="0"
                />
                {errors.cost && <p className="mt-1 text-xs text-red-500">{errors.cost}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Responsable</label>
                <input
                  type="text"
                  value={form.responsible}
                  onChange={(e) => setForm('responsible', e.target.value)}
                  className="form-input"
                  placeholder="Nom du responsable"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm('description', e.target.value)}
                className="form-input"
                rows={3}
                placeholder="Détails de l'événement..."
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal suppression */}
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
        <p className="text-sm text-slate-600">Voulez-vous vraiment supprimer cet événement ? Cette action est irréversible.</p>
      </Modal>
    </div>
  );
}
