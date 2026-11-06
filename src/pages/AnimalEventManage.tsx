import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/types';
import { useToast } from '@/lib/Toast';
import { formatCurrency, formatDate } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { SimpleBadge } from '@/components/ui/Badge';
import { STATUS_CLASS_SUCCESS, STATUS_CLASS_INFO, STATUS_CLASS_WARNING, STATUS_CLASS_DANGER } from '@/lib/constants';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useValidatedForm } from '@/components/ui/ValidatedForm';
import { RotatingCard } from '@/components/ui/RotatingCard';
import { FormField, FormInput, FormSelect, FormTextarea, FormActions, ConfirmDeleteModal, DetailModal, FormSection } from '@/components/ui/FormPrimitives';
import { Plus } from 'lucide-react';
import * as z from 'zod';
import type { AnimalEvent } from '@/lib/types';

const eventSchema = z.object({
  type: z.string().min(1, 'Le type est obligatoire'),
  date: z.string().min(1, 'La date est obligatoire'),
  animal_id: z.string().optional().nullable(),
  lot_id: z.string().optional().nullable(),
  description: z.string().optional(),
  cost: z.number().nonnegative('Le coût ne peut pas être négatif').optional(),
  responsible: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

const DEFAULT_VALUES: EventFormValues = {
  type: '',
  date: '',
  animal_id: null,
  lot_id: null,
  description: '',
  cost: 0,
  responsible: '',
};

const TYPE_LABELS: Record<string, string> = {
  vaccination: 'Vaccination',
  traitement: 'Traitement',
  maladie: 'Maladie',
  naissance: 'Naissance',
  vente: 'Vente',
  achat: 'Achat',
  autre: 'Autre',
};

const TYPE_OPTIONS = [
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'traitement', label: 'Traitement' },
  { value: 'maladie', label: 'Maladie' },
  { value: 'naissance', label: 'Naissance' },
  { value: 'vente', label: 'Vente' },
  { value: 'achat', label: 'Achat' },
  { value: 'mort', label: 'Mort' },
  { value: 'autre', label: 'Autre' },
] as const;

const TYPE_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'naissance', label: 'Naissances' },
  { id: 'vaccination', label: 'Vaccinations' },
  { id: 'traitement', label: 'Traitements' },
  { id: 'maladie', label: 'Maladies' },
  { id: 'mort', label: 'Morts' },
  { id: 'vente', label: 'Ventes' },
  { id: 'achat', label: 'Achats' },
  { id: 'autre', label: 'Autres' },
] as const;

export function AnimalEventManage() {
  const { animalEvents, animals, animalLots, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [modalOpen, setModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<AnimalEvent | null>(null);
  const [detailEvent, setDetailEvent] = useState<AnimalEvent | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AnimalEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const selectId = searchParams.get('select');
    const action = searchParams.get('action') || 'edit';
    if (!selectId) return;
    const event = animalEvents.find((e: AnimalEvent) => e.id === selectId);
    if (event) {
      if (action === 'view') {
        setDetailEvent(event);
        setModalOpen(false);
      } else if (action === 'delete') {
        setConfirmDelete(event);
        setModalOpen(false);
      } else {
        openEdit(event);
      }
      searchParams.delete('select');
      searchParams.delete('action');
      window.history.replaceState(null, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { values: form, setFieldValue: setForm, errors, isSubmitting, handleSubmit: handleFormSubmit } = useValidatedForm({
    schema: eventSchema,
    defaultValues: DEFAULT_VALUES,
    onSubmit: async (values) => {
      const payload = {
        type: values.type,
        date: values.date,
        animal_id: values.animal_id || null,
        lot_id: values.lot_id || null,
        description: values.description || null,
        cost: values.cost ?? 0,
        responsible: values.responsible || null,
      };

      if (editEvent?.id) {
        const { error } = await supabase.from('animal_events').update(payload).eq('id', editEvent.id);
        if (error) throw error;
        await logAudit(appUser?.name || 'Système', 'UPDATE', 'animal_event', editEvent.id, `Événement ${editEvent.id} modifié`);
        toast.show('Événement modifié');
      } else {
        const { error } = await supabase.from('animal_events').insert(payload);
        if (error) throw error;
        await logAudit(appUser?.name || 'Système', 'CREATE', 'animal_event', payload.animal_id, `Création d'événement ${payload.type}`);
        toast.show('Événement créé avec succès');
      }
      refresh();
    },
    onSuccess: () => { setModalOpen(false); setEditEvent(null); },
    onError: (err) => toast.show('Erreur: ' + err.message, 'error'),
    isEdit: !!editEvent,
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

  const openCreate = useCallback(() => {
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
  }, [setForm]);

  const openEdit = useCallback((event: AnimalEvent) => {
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
  }, [setForm]);

  const handleDelete = useCallback(async () => {
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
  }, [confirmDelete, appUser, refresh, toast]);

  const getEventName = (e: AnimalEvent) => TYPE_LABELS[e.type] || e.type;

  const renderDetailFields = (event: AnimalEvent) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-surface-hover rounded-lg">
        <div>
          <h2 className="text-2xl font-bold text-primary">{TYPE_LABELS[event.type] || event.type}</h2>
          <p className="text-sm text-muted">{formatDate(event.date)}</p>
        </div>
        <SimpleBadge color="info">{event.type}</SimpleBadge>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><p className="text-xs text-muted">Type</p><p className="text-sm font-medium">{event.type}</p></div>
        <div><p className="text-xs text-muted">Date</p><p className="text-sm font-medium">{formatDate(event.date)}</p></div>
        <div><p className="text-xs text-muted">Animal</p><p className="text-sm font-medium">{animalName(event.animal_id)}</p></div>
        <div><p className="text-xs text-muted">Lot</p><p className="text-sm font-medium">{lotName(event.lot_id)}</p></div>
        <div><p className="text-xs text-muted">Coût</p><p className="text-sm font-medium">{formatCurrency(event.cost)}</p></div>
        <div><p className="text-xs text-muted">Responsable</p><p className="text-sm font-medium">{event.responsible || '—'}</p></div>
        <div><p className="text-xs text-muted">Description</p><p className="text-sm font-medium">{event.description || '—'}</p></div>
      </div>
    </div>
  );

  const renderDetailFooter = (event: AnimalEvent) => (
    <>
      <button onClick={() => setConfirmDelete(event)} className={`px-4 py-2 text-sm border border-default rounded-lg ${STATUS_CLASS_DANGER}`}>Supprimer</button>
      <button onClick={() => openEdit(event)} className="px-4 py-2 text-sm text-secondary border border-default rounded-lg hover:bg-surface-hover">Modifier</button>
    </>
  );

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Gestion des événements animaux"
        subtitle="Suivi des événements de santé et de production"
        actions={
          <>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-lg hover:bg-success text-sm font-medium">
              <Plus size={18} /> Nouvel événement
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total événements" value={String(kpis.totalEvents)} icon={null} color="info" />
        <KpiCard label="Coût total" value={formatCurrency(kpis.totalCost)} icon={null} color="warning" />
        <KpiCard label="Événements ce mois" value={String(kpis.eventsThisMonth)} icon={null} color="success" />
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-medium text-secondary mb-1">Rechercher des événements</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-default rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
            placeholder="Rechercher par type, description, responsable..."
          />
        </div>
        <button
          onClick={() => setSearchTerm('')}
          className="px-3 py-2 text-sm text-secondary hover:bg-surface-hover"
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
                ? 'bg-success text-white border-success'
                : 'bg-surface text-secondary border-default hover:bg-surface-hover'
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
          action={searchTerm ? undefined : <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-lg hover:bg-success text-sm font-medium">Créer un événement</button>}
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
                      <h3 className="font-semibold text-primary">{formatDate(event.date)}</h3>
                      <SimpleBadge color="info">{TYPE_LABELS[event.type] || event.type}</SimpleBadge>
                    </div>
                    <div className="flex justify-between text-sm"><span className="text-muted">Animal / Lot</span><span className="font-medium">{animal} {lot !== '—' ? '/' + lot : ''}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted">Coût</span><span className="font-medium">{formatCurrency(event.cost)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted">Responsable</span><span className="font-medium">{event.responsible || '—'}</span></div>
                  </div>
                }
                back={
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => { setDetailEvent(event); }}
                      className="w-full px-3 py-2 text-sm bg-accent-primary text-white rounded-lg hover:bg-accent-primary-hover"
                    >
                      Voir détails
                    </button>
                    <button
                      onClick={() => { openEdit(event); }}
                      className="w-full px-3 py-2 text-sm bg-warning text-white rounded-lg hover:bg-warning"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => { setConfirmDelete(event); }}
                      className={`w-full px-3 py-2 text-sm border border-default rounded-lg ${STATUS_CLASS_DANGER}`}
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

      <DetailModal
        entity={detailEvent}
        onClose={() => setDetailEvent(null)}
        onEdit={openEdit}
        onDelete={setConfirmDelete}
        title={`Événement ${detailEvent?.id || ''}`}
        size="lg"
        renderFields={renderDetailFields}
        footer={detailEvent ? renderDetailFooter(detailEvent) : undefined}
      />

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditEvent(null); }}
        title={editEvent ? "Modifier l'événement" : "Nouvel événement"}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <FormSection title="Informations essentielles">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Type" required error={errors.type}>
                <FormSelect
                  value={form.type}
                  onChange={(e) => setForm('type', e.target.value)}
                >
                  {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </FormSelect>
              </FormField>
              <FormField label="Date" required error={errors.date}>
                <FormInput
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm('date', e.target.value)}
                />
              </FormField>
              <FormField label="Animal" error={errors.animal_id}>
                <FormSelect
                  value={form.animal_id ?? ''}
                  onChange={(e) => setForm('animal_id', e.target.value || null)}
                >
                  <option value="">Aucun</option>
                  {animals.map(a => (
                    <option key={a.id} value={a.id}>{a.identifier || 'Animal'}</option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField label="Lot" error={errors.lot_id}>
                <FormSelect
                  value={form.lot_id ?? ''}
                  onChange={(e) => setForm('lot_id', e.target.value || null)}
                >
                  <option value="">Aucun</option>
                  {animalLots.map(l => (
                    <option key={l.id} value={l.id}>{l.identifier || 'Lot'}</option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField label="Coût (FCFA)" error={errors.cost}>
                <FormInput
                  type="number"
                  min="0"
                  value={form.cost ?? ''}
                  onChange={(e) => setForm('cost', e.target.value ? parseFloat(e.target.value) : 0)}
                  placeholder="0"
                />
              </FormField>
              <FormField label="Responsable" error={errors.responsible}>
                <FormInput
                  type="text"
                  value={form.responsible}
                  onChange={(e) => setForm('responsible', e.target.value)}
                  placeholder="Nom du responsable"
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Description" defaultOpen={true}>
            <FormField label="Description" error={errors.description}>
              <FormTextarea
                value={form.description}
                onChange={(e) => setForm('description', e.target.value)}
                rows={3}
                placeholder="Détails de l'événement..."
              />
            </FormField>
          </FormSection>

          <FormActions onSubmit={handleFormSubmit} onCancel={() => { setModalOpen(false); setEditEvent(null); }} isSubmitting={isSubmitting} />
        </form>
      </Modal>

      <ConfirmDeleteModal
        entity={confirmDelete}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
        getEntityName={getEventName}
      />
    </div>
  );
}
