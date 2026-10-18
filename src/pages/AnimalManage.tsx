import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useValidatedForm } from '@/components/ui/ValidatedForm';
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
  const { animals, animalLots, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [editAnimal, setEditAnimal] = useState<any>(null);
  const [detailAnimal, setDetailAnimal] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { values: form, setFieldValue: setForm, errors } = useValidatedForm({
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
    onSubmit: async () => {
      // Fonction factice pour satisfaire TypeScript
      // La vraie logique de soumission est dans handleSubmit ci-dessous
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
    const events = 0; // À calculer si on avait accès aux événements
    const vaccinations = 0; // À calculer si on avait accès aux événements
    return { totalAnimals, totalValue: totalValue + individualValue, events, vaccinations };
  }, [animals, animalLots]);

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
    setDetailAnimal(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    // Validation avec Zod
    const validationResult = animalSchema.safeParse(form);
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
        identifier: form.identifier,
        name: form.name || null,
        species: form.species,
        breed: form.breed || null,
        date_of_birth: form.date_of_birth ? (form.date_of_birth as Date).toISOString().split('T')[0] : null,
        sex: form.sex || null,
        weight_kg: form.weight_kg,
        status: form.status,
        location: form.location || null,
        mother_id: form.mother_id || null,
        father_id: form.father_id || null,
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
    } catch (error) {
      toast.show('Erreur inattendue: ' + (error as Error).message, 'error');
    } finally {
      setSaving(false);
    }
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
      setDetailAnimal(null);
      refresh();
    }
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
          {filteredAnimals.map(animal => (
            <div key={animal.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">{animal.identifier ?? 'Non renseigné'}</h3>
              <p className="text-xs text-slate-500 mb-2">
                {animal.status ? animal.status : 'Non renseigné'}
              </p>
              {animal.species && (
                <p className="text-xs text-slate-600 mb-1">
                  <span className="font-medium text-slate-700">Espèce :</span> {animal.species}
                </p>
              )}
              {animal.breed && (
                <p className="text-xs text-slate-600 mb-3">
                  <span className="font-medium text-slate-700">Race :</span> {animal.breed}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { setDetailAnimal(animal); setModalOpen(false); }}
                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Voir
                </button>
                <button
                  type="button"
                  onClick={() => { openEdit(animal); setModalOpen(false); }}
                  className="px-3 py-1.5 text-xs bg-amber-600 text-white rounded hover:bg-amber-700"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => { setConfirmDelete(animal); setModalOpen(false); }}
                  className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={!!detailAnimal && !confirmDelete}
        onClose={() => setDetailAnimal(null)}
        title={`Animal ${detailAnimal?.identifier || ''}`}
        size="lg"
        footer={
          detailAnimal ? (
            <>
              <button onClick={() => setConfirmDelete(detailAnimal)} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Supprimer</button>
              <button onClick={() => openEdit(detailAnimal)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Modifier</button>
              {detailAnimal.status !== 'deceased' && detailAnimal.status !== 'sold' && (
                <>
                  {detailAnimal.status === 'healthy' && (
                    <button onClick={() => { updateStatus(detailAnimal, 'sick'); setDetailAnimal(null); }} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Marquer malade</button>
                  )}
                  {(detailAnimal.status === 'sick') && (
                    <button onClick={() => { updateStatus(detailAnimal, 'recovering'); setDetailAnimal(null); }} className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700">Marquer en rétablissement</button>
                  )}
                  {(detailAnimal.status === 'recovering') && (
                    <button onClick={() => { updateStatus(detailAnimal, 'healthy'); setDetailAnimal(null); }} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Marquer guéri</button>
                  )}
                  {(detailAnimal.status === 'healthy' || detailAnimal.status === 'recovering') && (
                    <>
                      <button onClick={() => { updateStatus(detailAnimal, 'quarantined'); setDetailAnimal(null); }} className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">Mettre en quarantaine</button>
                      {detailAnimal.sex === 'female' && (
                        <button onClick={() => { updateStatus(detailAnimal, 'pregnant'); setDetailAnimal(null); }} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">Marquer enceinte</button>
                      )}
                    </>
                  )}
                  {(detailAnimal.status === 'quarantined') && (
                    <button onClick={() => { updateStatus(detailAnimal, 'healthy'); setDetailAnimal(null); }} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Retirer de quarantaine</button>
                  )}
                </>
              )}
            </>
          ) : undefined
        }
      >
        {detailAnimal && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{detailAnimal.identifier}</h2>
                <p className="text-sm text-slate-500">{detailAnimal.name || '—'}</p>
              </div>
              <SimpleBadge color={
                detailAnimal.status === 'healthy' ? 'green' :
                detailAnimal.status === 'sick' ? 'red' :
                detailAnimal.status === 'recovering' ? 'amber' :
                detailAnimal.status === 'quarantined' ? 'yellow' :
                detailAnimal.status === 'sold' ? 'blue' :
                detailAnimal.status === 'deceased' ? 'black' :
                detailAnimal.status === 'pregnant' ? 'purple' :
                'gray'
              }>
                {detailAnimal.status}
              </SimpleBadge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-slate-400">Identifiant</p><p className="text-sm font-medium">{detailAnimal.identifier}</p></div>
              <div><p className="text-xs text-slate-400">Nom</p><p className="text-sm font-medium">{detailAnimal.name ?? '—'}</p></div>
              <div><p className="text-xs text-slate-400">Espèce</p><p className="text-sm font-medium">{detailAnimal.species}</p></div>
              <div><p className="text-xs text-slate-400">Race</p><p className="text-sm font-medium">{detailAnimal.breed ?? '—'}</p></div>
              <div><p className="text-xs text-slate-400">Sexe</p><p className="text-sm font-medium">{detailAnimal.sex ?? '—'}</p></div>
              <div><p className="text-xs text-slate-400">Date de naissance</p><p className="text-sm font-medium">{detailAnimal.date_of_birth ? formatDate(String(detailAnimal.date_of_birth)) : '—'}</p></div>
              <div><p className="text-xs text-slate-400">Poids (kg)</p><p className="text-sm font-medium">{detailAnimal.weight_kg ?? '—'}</p></div>
              <div><p className="text-xs text-slate-400">Valeur estimée</p><p className="text-sm font-medium">{detailAnimal.estimated_value !== null ? formatCurrency(detailAnimal.estimated_value) : '—'}</p></div>
              <div><p className="text-xs text-slate-400">Statut</p><p className="text-sm font-medium">{detailAnimal.status}</p></div>
              <div><p className="text-xs text-slate-400">Localisation</p><p className="text-sm font-medium">{detailAnimal.location ?? '—'}</p></div>
              <div><p className="text-xs text-slate-400">Mère</p><p className="text-sm font-medium">{detailAnimal.mother_id ?? '—'}</p></div>
              <div><p className="text-xs text-slate-400">Père</p><p className="text-sm font-medium">{detailAnimal.father_id ?? '—'}</p></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editAnimal ? "Modifier l'animal" : "Nouvel animal"}
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
                  <span>{editAnimal ? 'Modifier' : 'Créer'}</span>
                </>
              )}
            </button>
          </>
        }
      >
        <div className="space-y-6">
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
            </div>
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
            <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Supprimer</button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Voulez-vous vraiment supprimer l'animal « {confirmDelete?.identifier} » ? Cette action est irréversible.</p>
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