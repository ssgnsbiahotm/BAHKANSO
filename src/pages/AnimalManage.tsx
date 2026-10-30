import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Beef, Heart, Scale, Activity, Plus } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/types';
import { useToast } from '@/lib/Toast';
import { formatCurrency, formatDate } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { SimpleBadge } from '@/components/ui/Badge';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { RotatingCard } from '@/components/ui/RotatingCard';
import { Modal } from '@/components/ui/Modal';
import { useValidatedForm } from '@/components/ui/ValidatedForm';
import { FormField, FormInput, FormSelect, FormActions, ConfirmDeleteModal, DetailModal, FormSection } from '@/components/ui/FormPrimitives';
import type { Animal } from '@/lib/types';
import * as z from 'zod';
import { LIVESTOCK_PATHS } from '@/routes/livestockPaths';

// Schéma de validation pour les animaux
const animalSchema = z.object({
  identifier: z.string().min(1, 'L identificateur est obligatoire'),
  name: z.string().optional(),
  species: z.enum(['cattle', 'sheep', 'goat', 'poultry', 'swine']),
  breed: z.string().optional(),
  date_of_birth: z.date().optional(),
  sex: z.enum(['male', 'female']).optional(),
  weight_kg: z.number().nonnegative('Le poids ne peut pas être négatif').optional(),
  status: z.enum([
    'healthy',
    'sick',
    'recovering',
    'quarantined',
    'sold',
    'deceased',
    'pregnant'
  ]).default('healthy'),
  location: z.string().optional(),
  mother_id: z.string().uuid().optional(),
  father_id: z.string().uuid().optional(),
});

type AnimalFormValues = z.infer<typeof animalSchema>;

const DEFAULT_VALUES: AnimalFormValues = {
  identifier: '',
  name: '',
  species: 'cattle',
  breed: '',
  date_of_birth: undefined,
  sex: undefined,
  weight_kg: undefined,
  status: 'healthy',
  location: '',
  mother_id: undefined,
  father_id: undefined,
};

const SPECIES_OPTIONS = [
  { value: 'cattle', label: 'Bovin' },
  { value: 'sheep', label: 'Ovin' },
  { value: 'goat', label: 'Caprin' },
  { value: 'poultry', label: 'Aviaire' },
  { value: 'swine', label: 'Porcin' },
] as const;

const STATUS_OPTIONS = [
  { value: 'healthy', label: 'En bonne santé' },
  { value: 'sick', label: 'Malade' },
  { value: 'recovering', label: 'En rétablissement' },
  { value: 'quarantined', label: 'En quarantaine' },
  { value: 'sold', label: 'Vendu' },
  { value: 'deceased', label: 'Décédé' },
  { value: 'pregnant', label: 'Enceinte' },
] as const;

const SEX_OPTIONS = [
  { value: 'male', label: 'Mâle' },
  { value: 'female', label: 'Femelle' },
] as const;

function getStatusColor(status: string): 'green' | 'red' | 'amber' | 'yellow' | 'blue' | 'purple' | 'gray' {
  return status === 'healthy' ? 'green' :
    status === 'sick' ? 'red' :
    status === 'recovering' ? 'amber' :
    status === 'quarantined' ? 'yellow' :
    status === 'sold' ? 'blue' :
    status === 'deceased' ? 'gray' :
    status === 'pregnant' ? 'purple' : 'gray';
}

function getStatusBadgeColor(status: string): 'green' | 'red' | 'amber' | 'yellow' | 'blue' | 'black' | 'purple' | 'gray' {
  return status === 'healthy' ? 'green' :
    status === 'sick' ? 'red' :
    status === 'recovering' ? 'amber' :
    status === 'quarantined' ? 'yellow' :
    status === 'sold' ? 'blue' :
    status === 'deceased' ? 'black' :
    status === 'pregnant' ? 'purple' : 'gray';
}

export function AnimalManage() {
  const { animals, animalLots, animalEvents, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [modalOpen, setModalOpen] = useState(false);
  const [editAnimal, setEditAnimal] = useState<Animal | null>(null);
  const [detailAnimal, setDetailAnimal] = useState<Animal | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDeathModal, setOpenDeathModal] = useState(false);
  const [deathAnimal, setDeathAnimal] = useState<any>(null);
  const [deathReason, setDeathReason] = useState('');
  const [deathCost, setDeathCost] = useState(0);

  // Sélection depuis l'URL : ?select=<id>&action=view|edit|delete
  useEffect(() => {
    const selectId = searchParams.get('select');
    const action = searchParams.get('action') || 'edit';
    if (!selectId) return;
    const animal = animals.find((a: Animal) => a.id === selectId);
    if (animal) {
      if (action === 'view') {
        setDetailAnimal(animal);
        setModalOpen(false);
      } else if (action === 'delete') {
        setConfirmDelete(animal);
        setModalOpen(false);
      } else {
        openEdit(animal);
      }
      searchParams.delete('select');
      searchParams.delete('action');
      window.history.replaceState(null, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { values: form, setFieldValue: setForm, errors, isSubmitting, handleSubmit: handleFormSubmit } = useValidatedForm({
    schema: animalSchema,
    defaultValues: DEFAULT_VALUES,
    onSubmit: async (values) => {
      const payload = {
        identifier: values.identifier,
        name: values.name || null,
        species: values.species,
        breed: values.breed || null,
        date_of_birth: values.date_of_birth ? (values.date_of_birth as Date).toISOString().split('T')[0] : null,
        sex: values.sex || null,
        weight_kg: values.weight_kg,
        status: values.status,
        location: values.location || null,
        mother_id: values.mother_id || null,
        father_id: values.father_id || null,
      };

      if (editAnimal) {
        const { error } = await supabase.from('animals').update(payload).eq('id', editAnimal.id);
        if (error) throw error;
        await logAudit(appUser?.name || 'Système', 'UPDATE', 'animal', editAnimal.identifier, `Animal ${editAnimal.identifier} modifié`);
        toast.show('Animal modifié');
      } else {
        const { error } = await supabase.from('animals').insert(payload);
        if (error) throw error;
        await logAudit(appUser?.name || 'Système', 'CREATE', 'animal', payload.identifier, `Création de l'animal ${payload.identifier}`);
        toast.show('Animal créé avec succès');
      }
      refresh();
    },
    onSuccess: () => { setModalOpen(false); setEditAnimal(null); },
    onError: (err) => toast.show('Erreur: ' + err.message, 'error'),
    isEdit: !!editAnimal,
  });

  const filteredAnimals = useMemo(() => {
    if (!searchTerm) return animals;
    const term = searchTerm.toLowerCase();
    return animals.filter(a =>
      (a.identifier || '').toLowerCase().includes(term) ||
      (((a as any).name || '') as string).toLowerCase().includes(term) ||
      a.species.toString().includes(term) ||
      ((a.breed || '') as string).toLowerCase().includes(term) ||
      ((a.sex || '') as string).toString().includes(term) ||
      a.status.toLowerCase().includes(term) ||
      (a.location || '').toLowerCase().includes(term)
    );
  }, [animals, searchTerm]);

  const kpis = useMemo(() => {
    const totalAnimals = animalLots.reduce((s, l) => s + (l.count ?? 0), 0);
    const totalValue = animalLots.reduce((s, l) => s + (l.estimated_value ?? 0), 0);
    const individualValue = animals.reduce((s, a) => s + (a.estimated_value ?? 0), 0);
    const events = animalEvents.length;
    const vaccinations = animalEvents.filter(e => e.type === 'vaccination').length;
    return { totalAnimals, totalValue: totalValue + individualValue, events, vaccinations };
  }, [animals, animalLots, animalEvents]);

  const openCreate = useCallback(() => {
    setEditAnimal(null);
    setForm('identifier', '');
    setForm('name', '');
    setForm('species', 'cattle');
    setForm('breed', '');
    setForm('date_of_birth', undefined);
    setForm('sex', undefined);
    setForm('weight_kg', undefined);
    setForm('status', 'healthy');
    setForm('location', '');
    setForm('mother_id', undefined);
    setForm('father_id', undefined);
    setModalOpen(true);
  }, [setForm]);

  const openEdit = useCallback((animal: any) => {
    setEditAnimal(animal);
    setForm('identifier', animal.identifier);
    setForm('name', animal.name || '');
    setForm('species', animal.species);
    setForm('breed', animal.breed || '');
    setForm('date_of_birth', animal.date_of_birth ? new Date(animal.date_of_birth) : undefined);
    setForm('sex', animal.sex as ('male' | 'female') | undefined);
    setForm('weight_kg', animal.weight_kg);
    setForm('status', animal.status);
    setForm('location', animal.location || '');
    setForm('mother_id', animal.mother_id || undefined);
    setForm('father_id', animal.father_id || undefined);
    setModalOpen(true);
  }, [setForm]);

  const handleOpenDeathModal = useCallback((animal: any) => {
    setDeathAnimal(animal);
    setDeathReason('');
    setDeathCost(0);
    setOpenDeathModal(true);
  }, []);

  const updateStatus = async (animal: any, status: string) => {
    const { error } = await supabase.from('animals').update({ status }).eq('id', animal.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'UPDATE', 'animal', animal.identifier, `Statut de l'animal ${animal.identifier} → "${status}"`);
      toast.show(`Animal marqué "${status}"`);
      refresh();
    }
  };

  const handleDeathSubmit = async () => {
    const { error: eventError } = await supabase.from('animal_events').insert({
      type: 'mortalité',
      date: new Date().toISOString().split('T')[0],
      animal_id: deathAnimal?.id || null,
      cost: 0,
      description: 'Décès de l\'animal',
      responsible: appUser?.name || 'Système',
    });
    if (eventError) {
      toast.show('Erreur: ' + eventError.message, 'error');
      return;
    }
    const { error: animalError } = await supabase.from('animals').update({ status: 'deceased' }).eq('id', deathAnimal?.id);
    if (animalError) {
      toast.show('Erreur: ' + animalError.message, 'error');
      return;
    }
    await logAudit(appUser?.name || 'Système', 'UPDATE', 'animal', deathAnimal?.identifier, `Animal ${deathAnimal?.identifier} → décédé`);
    toast.show('Décès enregistré');
    setOpenDeathModal(false);
    refresh();
  };

  const getAnimalName = (a: any) => a.identifier || a.name || `Animal ${a.id}`;

  const renderDetailFields = (a: any) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{a.identifier}</h2>
          <p className="text-sm text-slate-500">{a.name || '—'}</p>
        </div>
        <SimpleBadge color={getStatusBadgeColor(a.status)}>{a.status}</SimpleBadge>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><p className="text-xs text-slate-400">Identifiant</p><p className="text-sm font-medium">{a.identifier}</p></div>
        <div><p className="text-xs text-slate-400">Nom</p><p className="text-sm font-medium">{a.name || '—'}</p></div>
        <div><p className="text-xs text-slate-400">Espèce</p><p className="text-sm font-medium">{a.species}</p></div>
        <div><p className="text-xs text-slate-400">Race</p><p className="text-sm font-medium">{a.breed || '—'}</p></div>
        <div><p className="text-xs text-slate-400">Sexe</p><p className="text-sm font-medium">{a.sex || '—'}</p></div>
        <div><p className="text-xs text-slate-400">Date de naissance</p><p className="text-sm font-medium">{a.date_of_birth ? formatDate(String(a.date_of_birth)) : '—'}</p></div>
        <div><p className="text-xs text-slate-400">Poids (kg)</p><p className="text-sm font-medium">{a.weight_kg ?? '—'}</p></div>
        <div><p className="text-xs text-slate-400">Valeur estimée</p><p className="text-sm font-medium">{a.estimated_value !== null ? formatCurrency(a.estimated_value) : '—'}</p></div>
        <div><p className="text-xs text-slate-400">Localisation</p><p className="text-sm font-medium">{a.location || '—'}</p></div>
        <div><p className="text-xs text-slate-400">Statut</p><p className="text-sm font-medium">{a.status}</p></div>
        <div><p className="text-xs text-slate-400">Mère</p><p className="text-sm font-medium">{a.mother_id || '—'}</p></div>
        <div><p className="text-xs text-slate-400">Père</p><p className="text-sm font-medium">{a.father_id || '—'}</p></div>
      </div>
    </div>
  );

  const renderDetailFooter = (animal: any) => (
    <>
      <button onClick={() => setConfirmDelete(animal)} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Supprimer</button>
      <button onClick={() => openEdit(animal)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Modifier</button>
      {animal.status === 'healthy' && (
        <button onClick={() => { updateStatus(animal, 'sick'); setDetailAnimal(null); }} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Marquer malade</button>
      )}
      {animal.status === 'sick' && (
        <button onClick={() => { updateStatus(animal, 'recovering'); setDetailAnimal(null); }} className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700">Marquer en rétablissement</button>
      )}
      {animal.status === 'recovering' && (
        <button onClick={() => { updateStatus(animal, 'healthy'); setDetailAnimal(null); }} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Marquer guéri</button>
      )}
      {(animal.status === 'healthy' || animal.status === 'recovering') && (
        <>
          <button onClick={() => { updateStatus(animal, 'quarantined'); setDetailAnimal(null); }} className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">Mettre en quarantaine</button>
          {animal.sex === 'female' && (
            <button onClick={() => { updateStatus(animal, 'pregnant'); setDetailAnimal(null); }} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">Marquer enceinte</button>
          )}
        </>
      )}
      {animal.status === 'quarantined' && (
        <button onClick={() => { updateStatus(animal, 'healthy'); setDetailAnimal(null); }} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Retirer de quarantaine</button>
      )}
      {(animal.status !== 'deceased') && (
        <button onClick={() => { handleOpenDeathModal(animal); setDetailAnimal(null); }} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Déclarer décès</button>
      )}
    </>
  );

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Gestion des animaux"
        subtitle="Suivi individuel des animaux d'élevage"
        actions={
          <>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
              <Plus size={18} /> Nouvel animal
            </button>
            <button
              onClick={() => navigate(LIVESTOCK_PATHS.animalsLegacy)}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 ml-2"
            >
              Tous les animaux
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total animaux" value={String(kpis.totalAnimals)} icon={<Beef size={20} />} color="green" />
        <KpiCard label="Valeur estimée" value={formatCurrency(kpis.totalValue)} icon={<Scale size={20} />} color="blue" />
        <KpiCard label="Événements" value={String(kpis.events)} icon={<Activity size={20} />} color="amber" />
        <KpiCard label="Vaccinations" value={String(kpis.vaccinations)} icon={<Heart size={20} />} color="red" />
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-medium text-slate-600 mb-1">Rechercher des animaux</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
            placeholder="Rechercher par identificateur, nom, espèce, race, sexe, statut ou localisation..."
          />
        </div>
        <button
          onClick={() => setSearchTerm('')}
          className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          Réinitialiser
        </button>
      </div>

      {filteredAnimals.length === 0 ? (
        <EmptyState
          icon={null}
          title={searchTerm ? "Aucun résultat" : "Aucun animal"}
          message={searchTerm ? "Aucun animal ne correspond à votre recherche" : "Aucun animal enregistré"}
          action={searchTerm ? undefined : <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">Créer un animal</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAnimals.map((animal: any) => (
            <RotatingCard
              key={animal.id}
              front={
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">{animal.identifier ?? 'Non renseigné'}</h3>
                    <SimpleBadge color={getStatusColor(animal.status)}>
                      {animal.status}
                    </SimpleBadge>
                  </div>
                  {animal.species && (
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Espèce</span><span className="font-medium">{animal.species}</span></div>
                  )}
                  {animal.breed && (
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Race</span><span className="font-medium">{animal.breed}</span></div>
                  )}
                </div>
              }
              back={
                <div className="space-y-4">
                  <div className="space-y-2 text-sm">
                    {animal.name && (
                      <div className="flex justify-between"><span className="text-slate-500">Nom</span><span className="font-medium">{animal.name}</span></div>
                    )}
                    <div className="flex justify-between"><span className="text-slate-500">Sexe</span><span className="font-medium">{animal.sex ?? '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Date de naissance</span><span className="font-medium">{animal.date_of_birth ? formatDate(String(animal.date_of_birth)) : '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Poids (kg)</span><span className="font-medium">{animal.weight_kg ?? '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Valeur estimée</span><span className="font-medium">{animal.estimated_value !== null ? formatCurrency(animal.estimated_value) : '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Localisation</span><span className="font-medium">{animal.location ?? '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Mère</span><span className="font-medium">{animal.mother_id ?? '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Père</span><span className="font-medium">{animal.father_id ?? '—'}</span></div>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {animal.status === 'healthy' && (
                        <button
                          onClick={() => { updateStatus(animal, 'sick'); }}
                          className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Marquer malade
                        </button>
                      )}
                      {animal.status === 'sick' && (
                        <button
                          onClick={() => { updateStatus(animal, 'recovering'); }}
                          className="px-3 py-1.5 text-xs bg-amber-600 text-white rounded hover:bg-amber-700"
                        >
                          Marquer en rétablissement
                        </button>
                      )}
                      {animal.status === 'recovering' && (
                        <button
                          onClick={() => { updateStatus(animal, 'healthy'); }}
                          className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Marquer guéri
                        </button>
                      )}
                      {(animal.status === 'healthy' || animal.status === 'recovering') && (
                        <>
                          <button
                            onClick={() => { updateStatus(animal, 'quarantined'); }}
                            className="px-3 py-1.5 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                          >
                            Mettre en quarantaine
                          </button>
                          {animal.sex === 'female' && (
                            <button
                              onClick={() => { updateStatus(animal, 'pregnant'); }}
                              className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                            >
                              Marquer enceinte
                            </button>
                          )}
                        </>
                      )}
                      {animal.status === 'quarantined' && (
                        <button
                          onClick={() => { updateStatus(animal, 'healthy'); }}
                          className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Retirer de quarantaine
                        </button>
                      )}
                      {(animal.status !== 'deceased') && (
                        <>
                          <button
                            onClick={() => { handleOpenDeathModal(animal); }}
                            className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Déclarer décès
                          </button>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => { openEdit(animal); }}
                        className="px-3 py-1.5 text-xs bg-amber-600 text-white rounded hover:bg-amber-700"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => { setConfirmDelete(animal); }}
                        className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              }
              flipLabel="Détails"
              backLabel="Retour"
            />
          ))}
        </div>
      )}

      <DetailModal
        entity={detailAnimal}
        onClose={() => setDetailAnimal(null)}
        onEdit={openEdit}
        onDelete={setConfirmDelete}
        title={`Animal ${detailAnimal?.identifier || ''}`}
        size="lg"
        renderFields={renderDetailFields}
        footer={detailAnimal ? renderDetailFooter(detailAnimal) : undefined}
      />

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditAnimal(null); }}
        title={editAnimal ? "Modifier l'animal" : "Nouvel animal"}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <FormSection title="Informations essentielles">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Identificateur" required error={errors.identifier}>
                <FormInput
                  value={form.identifier}
                  onChange={e => setForm('identifier', e.target.value)}
                  placeholder="ANI-001 ou bouclerole"
                />
              </FormField>
              <FormField label="Espèce" required error={errors.species}>
                <FormSelect
                  value={form.species}
                  onChange={e => setForm('species', e.target.value as AnimalFormValues['species'])}
                >
                  {SPECIES_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </FormSelect>
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Informations complémentaires" defaultOpen={true}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Nom" error={errors.name}>
                <FormInput
                  value={form.name}
                  onChange={e => setForm('name', e.target.value)}
                  placeholder="Boucle d'or (optionnel)"
                />
              </FormField>
              <FormField label="Race" error={errors.breed}>
                <FormInput
                  value={form.breed}
                  onChange={e => setForm('breed', e.target.value)}
                  placeholder="Holstein, Mérinos, etc."
                />
              </FormField>
              <FormField label="Date de naissance" error={errors.date_of_birth}>
                <FormInput
                  type="date"
                  value={form.date_of_birth ? form.date_of_birth.toISOString().split('T')[0] : ''}
                  onChange={e => setForm('date_of_birth', e.target.value ? new Date(e.target.value) : undefined)}
                />
              </FormField>
              <FormField label="Sexe" error={errors.sex}>
                <FormSelect
                  value={form.sex ?? ''}
                  onChange={e => setForm('sex', e.target.value ? e.target.value as 'male' | 'female' : undefined)}
                >
                  <option value="">Non spécifié</option>
                  {SEX_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </FormSelect>
              </FormField>
              <FormField label="Poids (kg)" error={errors.weight_kg}>
                <FormInput
                  type="number"
                  min="0"
                  value={form.weight_kg ?? ''}
                  onChange={e => setForm('weight_kg', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </FormField>
              <FormField label="Statut" error={errors.status}>
                <FormSelect
                  value={form.status}
                  onChange={e => setForm('status', e.target.value as AnimalFormValues['status'])}
                >
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </FormSelect>
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Informations avancées" defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Localisation" error={errors.location}>
                <FormInput
                  value={form.location}
                  onChange={e => setForm('location', e.target.value)}
                />
              </FormField>
              <FormField label="ID de la mère" error={errors.mother_id}>
                <FormInput
                  value={form.mother_id ?? ''}
                  onChange={e => setForm('mother_id', e.target.value || undefined)}
                />
              </FormField>
              <FormField label="ID du père" error={errors.father_id}>
                <FormInput
                  value={form.father_id ?? ''}
                  onChange={e => setForm('father_id', e.target.value || undefined)}
                />
              </FormField>
              <FormField label="Raison du décès">
                <FormInput
                  value={deathReason}
                  onChange={e => setDeathReason(e.target.value)}
                />
              </FormField>
              <FormField label="Coût du décès (FCFA)">
                <FormInput
                  type="number"
                  min="0"
                  value={deathCost}
                  onChange={e => setDeathCost(e.target.value ? parseFloat(e.target.value) : 0)}
                />
              </FormField>
            </div>
          </FormSection>

          <FormActions onSubmit={handleFormSubmit} onCancel={() => { setModalOpen(false); setEditAnimal(null); }} isSubmitting={isSubmitting} />
        </form>
      </Modal>

      {/* Modal declaration décès */}
      <Modal
        open={openDeathModal}
        onClose={() => setOpenDeathModal(false)}
        title="Déclarer le décès"
        size="lg"
      >
        {deathAnimal && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Vous allez déclarer le décès de l'animal {deathAnimal.identifier}.{deathAnimal.name ? ' – ' + deathAnimal.name : ''}
            </p>
            <p className="text-sm text-slate-500">Un événement de décès sera créé et le statut de l'animal sera mis à jour à "décédé".</p>
            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setOpenDeathModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
              <button onClick={handleDeathSubmit} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDeleteModal
        entity={confirmDelete}
        onConfirm={() => {
          if (confirmDelete) {
            const run = async () => {
              try {
                const { error } = await supabase.from('animals').delete().eq('id', confirmDelete.id);
                if (error) {
                  toast.show('Erreur: ' + error.message, 'error');
                } else {
                  await logAudit(
                    appUser?.name || 'Système',
                    'DELETE',
                    'animal',
                    confirmDelete.identifier,
                    `Animal ${confirmDelete.identifier} supprimé`,
                  );
                  toast.show('Animal supprimé');
                  setDetailAnimal(null);
                  refresh();
                }
              } catch (error) {
                toast.show('Erreur inattendue: ' + (error as Error).message, 'error');
              }
            };
            void run();
            setConfirmDelete(null);
          }
        }}
        onClose={() => setConfirmDelete(null)}
        getEntityName={getAnimalName}
      />
    </div>
  );
}