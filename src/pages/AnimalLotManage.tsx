import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { RotatingCard } from '@/components/ui/RotatingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useValidatedForm } from '@/components/ui/ValidatedForm';
import { FormField, FormInput, FormSelect, FormActions, ConfirmDeleteModal, DetailModal, FormSection } from '@/components/ui/FormPrimitives';
import { Plus } from 'lucide-react';
import * as z from 'zod';
import type { AnimalLot } from '@/lib/types';

const lotSchema = z.object({
  identifier: z.string().min(1, 'L identificateur est obligatoire'),
  species: z.string().min(1, 'L espèce est obligatoire'),
  breed: z.string().optional(),
  count: z.number().min(1, 'Le nombre de têtes doit être d\'au moins 1'),
  location: z.string().optional(),
  status: z.enum(['actif', 'inactif', 'quarantaine']),
  estimated_value: z.number().nonnegative('La valeur estimée ne peut pas être négative').optional(),
});

type LotFormValues = z.infer<typeof lotSchema>;

const DEFAULT_VALUES: LotFormValues = {
  identifier: '',
  species: '',
  breed: '',
  count: 1,
  location: '',
  status: 'actif',
  estimated_value: undefined,
};

const STATUS_OPTIONS = [
  { value: 'actif', label: 'Actif' },
  { value: 'inactif', label: 'Inactif' },
  { value: 'quarantaine', label: 'Quarantaine' },
] as const;

function getStatusColor(status: string): 'green' | 'amber' | 'gray' {
  return status === 'actif' ? 'green' : status === 'quarantaine' ? 'amber' : 'gray';
}

export function AnimalLotManage() {
  const { animalLots, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [modalOpen, setModalOpen] = useState(false);
  const [editLot, setEditLot] = useState<AnimalLot | null>(null);
  const [detailLot, setDetailLot] = useState<AnimalLot | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AnimalLot | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const selectId = searchParams.get('select');
    const action = searchParams.get('action') || 'edit';
    if (!selectId) return;
    const lot = animalLots.find((l: AnimalLot) => l.id === selectId);
    if (lot) {
      if (action === 'view') {
        setDetailLot(lot);
        setModalOpen(false);
      } else if (action === 'delete') {
        setConfirmDelete(lot);
        setModalOpen(false);
      } else {
        openEdit(lot);
      }
      searchParams.delete('select');
      searchParams.delete('action');
      window.history.replaceState(null, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { values: form, setFieldValue: setForm, errors, isSubmitting, handleSubmit: handleFormSubmit } = useValidatedForm({
    schema: lotSchema,
    defaultValues: DEFAULT_VALUES,
    onSubmit: async (values) => {
      const payload = {
        identifier: values.identifier,
        species: values.species,
        breed: values.breed || null,
        count: values.count,
        location: values.location || null,
        status: values.status,
        estimated_value: values.estimated_value ?? null,
      };

      if (editLot?.id) {
        const { error } = await supabase.from('animal_lots').update(payload).eq('id', editLot.id);
        if (error) throw error;
        await logAudit(appUser?.name || 'Système', 'UPDATE', 'animal_lot', editLot.identifier, `Lot ${editLot.identifier} modifié`);
        toast.show('Lot modifié');
      } else {
        const { error } = await supabase.from('animal_lots').insert(payload);
        if (error) throw error;
        await logAudit(appUser?.name || 'Système', 'CREATE', 'animal_lot', payload.identifier, `Création du lot ${payload.identifier}`);
        toast.show('Lot créé avec succès');
      }
      refresh();
    },
    onSuccess: () => { setModalOpen(false); setEditLot(null); },
    onError: (err) => toast.show('Erreur: ' + err.message, 'error'),
    isEdit: !!editLot,
  });

  const filteredLots = useMemo(() => {
    if (!searchTerm) return animalLots;
    const term = searchTerm.toLowerCase();
    return animalLots.filter(l =>
      (l.identifier || '').toLowerCase().includes(term) ||
      l.species.toLowerCase().includes(term) ||
      (l.breed || '').toLowerCase().includes(term) ||
      (l.location || '').toLowerCase().includes(term) ||
      l.status.toLowerCase().includes(term)
    );
  }, [animalLots, searchTerm]);

  const kpis = useMemo(() => ({
    totalLots: animalLots.length,
    totalHeads: animalLots.reduce((s, l) => s + l.count, 0),
    totalValue: animalLots.reduce((s, l) => s + l.estimated_value, 0),
  }), [animalLots]);

  const openCreate = useCallback(() => {
    setEditLot(null);
    setForm('identifier', '');
    setForm('species', '');
    setForm('breed', '');
    setForm('count', 1);
    setForm('location', '');
    setForm('status', 'actif');
    setForm('estimated_value', undefined);
    setDetailLot(null);
    setModalOpen(true);
  }, [setForm]);

  const openEdit = useCallback((lot: AnimalLot) => {
    setEditLot(lot);
    setForm('identifier', lot.identifier ?? '');
    setForm('species', lot.species);
    setForm('breed', lot.breed ?? '');
    setForm('count', lot.count);
    setForm('location', lot.location ?? '');
    setForm('status', lot.status as 'actif' | 'inactif' | 'quarantaine');
    setForm('estimated_value', lot.estimated_value);
    setDetailLot(null);
    setModalOpen(true);
  }, [setForm]);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('animal_lots').delete().eq('id', confirmDelete.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'DELETE', 'animal_lot', confirmDelete.identifier, `Lot ${confirmDelete.identifier} supprimé`);
      toast.show('Lot supprimé');
      setConfirmDelete(null);
      setDetailLot(null);
      refresh();
    }
  }, [confirmDelete, appUser, refresh, toast]);

  const getLotName = (l: AnimalLot) => l.identifier ?? '';

  const renderDetailFields = (lot: AnimalLot) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{lot.identifier}</h2>
          <p className="text-sm text-slate-500">{lot.species}</p>
        </div>
        <SimpleBadge color={getStatusColor(lot.status)}>
          {lot.status}
        </SimpleBadge>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><p className="text-xs text-slate-400">Identifiant</p><p className="text-sm font-medium">{lot.identifier}</p></div>
        <div><p className="text-xs text-slate-400">Espèce</p><p className="text-sm font-medium">{lot.species}</p></div>
        <div><p className="text-xs text-slate-400">Race</p><p className="text-sm font-medium">{lot.breed ?? '—'}</p></div>
        <div><p className="text-xs text-slate-400">Effectif</p><p className="text-sm font-medium">{lot.count} têtes</p></div>
        <div><p className="text-xs text-slate-400">Localisation</p><p className="text-sm font-medium">{lot.location ?? '—'}</p></div>
        <div><p className="text-xs text-slate-400">Statut</p><p className="text-sm font-medium">{lot.status}</p></div>
        <div><p className="text-xs text-slate-400">Valeur estimée</p><p className="text-sm font-medium">{lot.estimated_value !== null ? formatCurrency(lot.estimated_value) : '—'}</p></div>
      </div>
    </div>
  );

  const renderDetailFooter = (lot: AnimalLot) => (
    <>
      <button onClick={() => setConfirmDelete(lot)} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Supprimer</button>
      <button onClick={() => openEdit(lot)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Modifier</button>
    </>
  );

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Gestion des lots"
        subtitle="Suivi des lots d'animaux d'élevage"
        actions={
          <>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
              <Plus size={18} /> Nouveau lot
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total lots" value={String(kpis.totalLots)} icon={null} color="green" />
        <KpiCard label="Total têtes" value={String(kpis.totalHeads)} icon={null} color="blue" />
        <KpiCard label="Valeur totale" value={formatCurrency(kpis.totalValue)} icon={null} color="amber" />
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-medium text-slate-600 mb-1">Rechercher des lots</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
            placeholder="Rechercher par identificateur, espèce, race, localisation ou statut..."
          />
        </div>
        <button
          onClick={() => setSearchTerm('')}
          className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          Réinitialiser
        </button>
      </div>

      {filteredLots.length === 0 ? (
        <EmptyState
          icon={null}
          title={searchTerm ? "Aucun résultat" : "Aucun lot"}
          message={searchTerm ? "Aucun lot ne correspond à votre recherche" : "Aucun lot d'animaux enregistré"}
          action={searchTerm ? undefined : <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">Créer un lot</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLots.map(lot => (
            <RotatingCard
              key={lot.id}
              front={
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">{lot.identifier}</h3>
                    <SimpleBadge color={getStatusColor(lot.status)}>{lot.status}</SimpleBadge>
                  </div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Espèce</span><span className="font-medium">{lot.species}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Race</span><span className="font-medium">{lot.breed || '—'}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Effectif</span><span className="font-medium">{lot.count} têtes</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Localisation</span><span className="font-medium">{lot.location || '—'}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Valeur estimée</span><span className="font-medium">{formatCurrency(lot.estimated_value)}</span></div>
                </div>
              }
              back={
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => { setDetailLot(lot); }}
                    className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Voir détails
                  </button>
                  <button
                    onClick={() => { openEdit(lot); }}
                    className="w-full px-3 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => { setConfirmDelete(lot); }}
                    className="w-full px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    Supprimer
                  </button>
                </div>
              }
              flipLabel="Actions"
              backLabel="Retour"
            />
          ))}
        </div>
      )}

      <DetailModal
        entity={detailLot}
        onClose={() => setDetailLot(null)}
        onEdit={openEdit}
        onDelete={setConfirmDelete}
        title={`Lot ${detailLot?.identifier || ''}`}
        size="lg"
        renderFields={renderDetailFields}
        footer={detailLot ? renderDetailFooter(detailLot) : undefined}
      />

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditLot(null); }}
        title={editLot ? "Modifier le lot" : "Nouveau lot"}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <FormSection title="Informations essentielles">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Identificateur" required error={errors.identifier}>
                <FormInput
                  value={form.identifier}
                  onChange={(e) => setForm('identifier', e.target.value)}
                  placeholder="LOT-001"
                />
              </FormField>
              <FormField label="Espèce" required error={errors.species}>
                <FormInput
                  value={form.species}
                  onChange={(e) => setForm('species', e.target.value)}
                  placeholder="Bovin, Ovin, Caprin..."
                />
              </FormField>
              <FormField label="Race" error={errors.breed}>
                <FormInput
                  value={form.breed}
                  onChange={(e) => setForm('breed', e.target.value)}
                  placeholder="Holstein, Mérinos..."
                />
              </FormField>
              <FormField label="Nombre de têtes" required error={errors.count}>
                <FormInput
                  type="number"
                  min="1"
                  value={form.count}
                  onChange={(e) => setForm('count', parseInt(e.target.value) || 1)}
                />
              </FormField>
              <FormField label="Localisation" error={errors.location}>
                <FormInput
                  value={form.location}
                  onChange={(e) => setForm('location', e.target.value)}
                  placeholder="Établissement A..."
                />
              </FormField>
              <FormField label="Statut" error={errors.status}>
                <FormSelect
                  value={form.status}
                  onChange={(e) => setForm('status', e.target.value as 'actif' | 'inactif' | 'quarantaine')}
                >
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </FormSelect>
              </FormField>
              <FormField label="Valeur estimée (FCFA)" error={errors.estimated_value}>
                <FormInput
                  type="number"
                  min="0"
                  value={form.estimated_value ?? ''}
                  onChange={(e) => setForm('estimated_value', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0"
                />
              </FormField>
            </div>
          </FormSection>

          <FormActions onSubmit={handleFormSubmit} onCancel={() => { setModalOpen(false); setEditLot(null); }} isSubmitting={isSubmitting} />
        </form>
      </Modal>

      <ConfirmDeleteModal
        entity={confirmDelete}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
        getEntityName={getLotName}
      />
    </div>
  );
}