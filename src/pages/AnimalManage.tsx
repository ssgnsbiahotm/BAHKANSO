import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Beef, Heart, Scale, Activity, Plus, Trash2, Pencil, Eye, Loader2, Save, CheckCircle, XCircle } from 'lucide-react';
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
import type { Animal } from '@/lib/types';
import * as z from 'zod';

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

interface AnimalFormValues {
  identifier: string;
  name?: string;
  species: 'cattle' | 'sheep' | 'goat' | 'poultry' | 'swine';
  breed?: string;
  date_of_birth?: Date;
  sex?: 'male' | 'female';
  weight_kg?: number;
  status: 'healthy' | 'sick' | 'recovering' | 'quarantined' | 'sold' | 'deceased' | 'pregnant';
  location?: string;
  mother_id?: string;
  father_id?: string;
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
  const [saving, setSaving] = useState(false);
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

  const { values: form, setFieldValue: setForm, errors, handleSubmit } = useValidatedForm({
    schema: animalSchema,
    defaultValues: {
      identifier: '',
      name: '',
      species: 'cattle' as const,
      breed: '',
      date_of_birth: undefined,
      sex: undefined as 'male' | 'female' | undefined,
      weight_kg: undefined,
      status: 'healthy',
      location: '',
      mother_id: '',
      father_id: '',
    },
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
        if (error) {
          toast.show('Erreur: ' + error.message, 'error');
        } else {
          await logAudit(appUser?.name || 'Système', 'UPDATE', 'animal', editAnimal.identifier, `Animal ${editAnimal.identifier} modifié`);
          toast.show('Animal modifié');
          setModalOpen(false);
          refresh();
        }
      } else {
        const { error } = await supabase.from('animals').insert(payload);
        if (error) {
          toast.show('Erreur: ' + error.message, 'error');
        } else {
          await logAudit(appUser?.name || 'Système', 'CREATE', 'animal', payload.identifier, `Création de l'animal ${payload.identifier}`);
          toast.show('Animal créé avec succès');
          setModalOpen(false);
          refresh();
        }
      }
    }
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

  const openCreate = () => {
    setEditAnimal(null);
    setForm('identifier', '');
    setForm('name', '');
    setForm('species', 'cattle' as const);
    setForm('breed', '');
    setForm('date_of_birth', undefined);
    setForm('sex', undefined as 'male' | 'female' | undefined);
    setForm('weight_kg', undefined);
    setForm('status', 'healthy');
    setForm('location', '');
    setForm('mother_id', '');
    setForm('father_id', '');
    setModalOpen(true);
  };

  const openEdit = (animal: any) => {
    setEditAnimal(animal);
    // Mettre à jour les valeurs du formulaire
    setForm('identifier', animal.identifier);
    setForm('name', animal.name || '');
    setForm('species', animal.species);
    setForm('breed', animal.breed || '');
    setForm('date_of_birth', animal.date_of_birth ? new Date(animal.date_of_birth) : undefined);
    setForm('sex', animal.sex as ('male' | 'female') | undefined);
    setForm('weight_kg', animal.weight_kg);
    setForm('status', animal.status);
    setForm('location', animal.location || '');
    setForm('mother_id', animal.mother_id || '');
    setForm('father_id', animal.father_id || '');
    setModalOpen(true);
  };

  const handleOpenDeathModal = (animal: any) => {
    setDeathAnimal(animal);
    setDeathReason('');
    setDeathCost(0);
    setOpenDeathModal(true);
  };

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

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('animals').delete().eq('id', confirmDelete.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'DELETE', 'animal', confirmDelete.identifier, `Animal ${confirmDelete.identifier} supprimé`);
      toast.show('Animal supprimé');
      setConfirmDelete(null);
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
    setModalOpen(false);
    refresh();
  };

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
              onClick={() => navigate('/app/livestock/animals')}
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
                    <SimpleBadge color={
                      animal.status === 'healthy' ? 'green' :
                      animal.status === 'sick' ? 'red' :
                      animal.status === 'recovering' ? 'amber' :
                      animal.status === 'quarantined' ? 'yellow' :
                      animal.status === 'sold' ? 'blue' :
                      animal.status === 'deceased' ? 'black' :
                      animal.status === 'pregnant' ? 'purple' :
                      'gray'
                    }>
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

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editAnimal ? "Modifier l'animal" : "Nouvel animal"}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  <span>{editAnimal ? 'Modifier' : 'Créer'}</span>
                </>
              )}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section Informations essentielles */}
          <div className="space-y-4">
            <h3 className="text-xs font-medium text-slate-600 mb-2">Informations essentielles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Identificateur *</label>
                <input
                  type="text"
                  value={form.identifier}
                  onChange={(e) => setForm('identifier', e.target.value)}
                  className={`form-input ${errors.identifier ? 'border-red-500' : ''}`}
                  placeholder="ANI-001 ou bouclerole"
                />
                {errors.identifier && (
                  <p className="mt-1 text-xs text-red-500">{errors.identifier}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Espèce *</label>
                <select
                  value={form.species}
                  onChange={(e) => setForm('species', e.target.value as any)}
                  className="form-input"
                >
                  <option value="cattle">Bovin</option>
                  <option value="sheep">Ovin</option>
                  <option value="goat">Caprin</option>
                  <option value="poultry">Aviaire</option>
                  <option value="swine">Porcin</option>
                </select>
                {errors.species && (
                  <p className="mt-1 text-xs text-red-500">{errors.species}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section Informations complémentaires */}
          <div className="space-y-4">
            <h3 className="text-xs font-medium text-slate-600 mb-2">Informations complémentaires</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nom</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm('name', e.target.value)}
                  className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Boucle d'or (optionnel)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Race</label>
                <input
                  type="text"
                  value={form.breed}
                  onChange={(e) => setForm('breed', e.target.value)}
                  className={`form-input ${errors.breed ? 'border-red-500' : ''}`}
                  placeholder="Holstein, Mérinos, etc."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date de naissance</label>
                <input
                  type="date"
                  value={form.date_of_birth ? form.date_of_birth.toISOString().split('T')[0] : ''}
                  onChange={(e) => setForm('date_of_birth', e.target.value ? new Date(e.target.value) : undefined)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sexe</label>
                <select
                  value={form.sex ?? ''}
                  onChange={(e) => setForm('sex', e.target.value ? e.target.value as 'male' | 'female' : undefined)}
                  className="form-input"
                >
                  <option value="">Non spécifié</option>
                  <option value="male">Mâle</option>
                  <option value="female">Femelle</option>
                </select>
                {errors.sex && (
                  <p className="mt-1 text-xs text-red-500">{errors.sex}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Poids (kg)</label>
                <input
                  type="number"
                  min="0"
                  value={form.weight_kg}
                  onChange={(e) => setForm('weight_kg', parseFloat(e.target.value) || undefined)}
                  className={`form-input ${errors.weight_kg ? 'border-red-500' : ''}`}
                />
                {errors.weight_kg && (
                  <p className="mt-1 text-xs text-red-500">{errors.weight_kg}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Statut</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm('status', e.target.value as any)}
                  className="form-input"
                >
                  <option value="healthy">En bonne santé</option>
                  <option value="sick">Malade</option>
                  <option value="recovering">En rétablissement</option>
                  <option value="quarantined">En quarantaine</option>
                  <option value="sold">Vendu</option>
                  <option value="deceased">Décédé</option>
                  <option value="pregnant">Enceinte</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-xs text-red-500">{errors.status}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section Informations avancées */}
          <div className="space-y-4">
            <h3 className="text-xs font-medium text-slate-600 mb-2">Informations avancées</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Localisation</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm('location', e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ID de la mère</label>
                <input
                  type="text"
                  value={form.mother_id ?? ''}
                  onChange={(e) => setForm('mother_id', e.target.value || undefined)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ID du père</label>
                <input
                  type="text"
                  value={form.father_id ?? ''}
                  onChange={(e) => setForm('father_id', e.target.value || undefined)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Raison du décès</label>
                <input
                  type="text"
                  value={deathReason}
                  onChange={(e) => setDeathReason(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Coût du décès (FCFA)</label>
                <input
                  type="number"
                  min="0"
                  value={deathCost}
                  onChange={(e) => setDeathCost(e.target.value ? parseFloat(e.target.value) : 0)}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Détail animal (consultation lecture seule) */}
      <Modal
        open={!!detailAnimal && !confirmDelete}
        onClose={() => setDetailAnimal(null)}
        title={`Animal ${detailAnimal?.identifier || ''}`}
        size="lg"
      >
        {detailAnimal && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{detailAnimal.identifier}</h2>
                <p className="text-sm text-slate-500">{detailAnimal.name || '—'}</p>
              </div>
              <SimpleBadge color="blue">{detailAnimal.status}</SimpleBadge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-slate-400">Identifiant</p><p className="text-sm font-medium">{detailAnimal.identifier}</p></div>
              <div><p className="text-xs text-slate-400">Nom</p><p className="text-sm font-medium">{detailAnimal.name || '—'}</p></div>
              <div><p className="text-xs text-slate-400">Espèce</p><p className="text-sm font-medium">{detailAnimal.species}</p></div>
              <div><p className="text-xs text-slate-400">Race</p><p className="text-sm font-medium">{detailAnimal.breed || '—'}</p></div>
              <div><p className="text-xs text-slate-400">Sexe</p><p className="text-sm font-medium">{detailAnimal.sex || '—'}</p></div>
              <div><p className="text-xs text-slate-400">Date de naissance</p><p className="text-sm font-medium">{detailAnimal.date_of_birth ? formatDate(String(detailAnimal.date_of_birth)) : '—'}</p></div>
              <div><p className="text-xs text-slate-400">Poids (kg)</p><p className="text-sm font-medium">{detailAnimal.weight_kg ?? '—'}</p></div>
              <div><p className="text-xs text-slate-400">Valeur estimée</p><p className="text-sm font-medium">{detailAnimal.estimated_value !== null ? formatCurrency(detailAnimal.estimated_value) : '—'}</p></div>
              <div><p className="text-xs text-slate-400">Localisation</p><p className="text-sm font-medium">{detailAnimal.location || '—'}</p></div>
              <div><p className="text-xs text-slate-400">Statut</p><p className="text-sm font-medium">{detailAnimal.status}</p></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(detailAnimal!)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Modifier</button>
              <button onClick={() => setConfirmDelete(detailAnimal)} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Supprimer</button>
            </div>
          </div>
        )}
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
        <p className="text-sm text-slate-600">Voulez-vous vraiment supprimer l'animal « {confirmDelete?.identifier} » ? Cette action est irréversible.</p>
      </Modal>
      {/* Modal declaration décès */}
      <Modal
        open={!!openDeathModal}
        onClose={() => setOpenDeathModal(false)}
        title="Déclarer le décès"
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button onClick={handleDeathSubmit} disabled={saving} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  <span>Enregistrer</span>
                </>
              )}
            </button>
          </>
        }
      >
        {deathAnimal && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Vous allez déclarer le décès de l'animal {deathAnimal.identifier}.{deathAnimal.name ? ' – ' + deathAnimal.name : ''}
            </p>
            <p className="text-sm text-slate-500">Un événement de décès sera créé et le statut de l'animal sera mis à jour à "décédé".</p>
            <div className="pt-4 border-t border-slate-100">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
              <button onClick={handleDeathSubmit} disabled={saving} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    <span>Enregistrer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
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