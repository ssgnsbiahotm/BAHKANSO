import { useState, useMemo, useEffect } from 'react';
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
import { Plus, Trash2, Pencil, Eye } from 'lucide-react';
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

interface LotFormValues {
  identifier: string;
  species: string;
  breed?: string;
  count: number;
  location?: string;
  status: 'actif' | 'inactif' | 'quarantaine';
  estimated_value?: number;
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
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Sélection depuis l'URL : ?select=<id>&action=view|edit|delete
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

  const { values: form, setFieldValue: setForm, errors } = useValidatedForm({
    schema: lotSchema,
    defaultValues: {
      identifier: '',
      species: '',
      breed: '',
      count: 1,
      location: '',
      status: 'actif',
      estimated_value: undefined,
    },
    onSubmit: async () => {
      // La vraie logique est dans handleSubmit ci-dessous
    },
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

  const openCreate = () => {
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
  };

  const openEdit = (lot: AnimalLot) => {
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
  };

  const handleSubmit = async () => {
    const validationResult = lotSchema.safeParse(form);
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
        identifier: form.identifier,
        species: form.species,
        breed: form.breed || null,
        count: form.count,
        location: form.location || null,
        status: form.status,
        estimated_value: form.estimated_value ?? null,
      };

      if (editLot?.id) {
        const { error } = await supabase.from('animal_lots').update(payload).eq('id', editLot.id);
        if (error) {
          toast.show('Erreur: ' + error.message, 'error');
        } else {
          await logAudit(appUser?.name || 'Système', 'UPDATE', 'animal_lot', editLot.identifier, `Lot ${editLot.identifier} modifié`);
          toast.show('Lot modifié');
          setModalOpen(false);
          refresh();
        }
      } else {
        const { error } = await supabase.from('animal_lots').insert(payload);
        if (error) {
          toast.show('Erreur: ' + error.message, 'error');
        } else {
          await logAudit(appUser?.name || 'Système', 'CREATE', 'animal_lot', payload.identifier, `Création du lot ${payload.identifier}`);
          toast.show('Lot créé avec succès');
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
  };

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
                    <SimpleBadge color={lot.status === 'actif' ? 'green' : lot.status === 'quarantaine' ? 'amber' : 'gray'}>{lot.status}</SimpleBadge>
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
                    onClick={() => { setDetailLot(lot); setModalOpen(false); }}
                    className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Voir détails
                  </button>
                  <button
                    onClick={() => { openEdit(lot); setModalOpen(false); }}
                    className="w-full px-3 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => { setConfirmDelete(lot); setModalOpen(false); }}
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

      {/* Modal détail */}
      <Modal
        open={!!detailLot && !confirmDelete}
        onClose={() => setDetailLot(null)}
        title={`Lot ${detailLot?.identifier || ''}`}
        size="lg"
        footer={
          detailLot ? (
            <>
              <button onClick={() => setConfirmDelete(detailLot)} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Supprimer</button>
              <button onClick={() => openEdit(detailLot)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Modifier</button>
            </>
          ) : undefined
        }
      >
        {detailLot && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{detailLot.identifier}</h2>
                <p className="text-sm text-slate-500">{detailLot.species}</p>
              </div>
              <SimpleBadge color={
                detailLot.status === 'actif' ? 'green' :
                detailLot.status === 'inactif' ? 'gray' :
                detailLot.status === 'quarantaine' ? 'amber' :
                'gray'
              }>
                {detailLot.status}
              </SimpleBadge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-slate-400">Identifiant</p><p className="text-sm font-medium">{detailLot.identifier}</p></div>
              <div><p className="text-xs text-slate-400">Espèce</p><p className="text-sm font-medium">{detailLot.species}</p></div>
              <div><p className="text-xs text-slate-400">Race</p><p className="text-sm font-medium">{detailLot.breed ?? '—'}</p></div>
              <div><p className="text-xs text-slate-400">Effectif</p><p className="text-sm font-medium">{detailLot.count} têtes</p></div>
              <div><p className="text-xs text-slate-400">Localisation</p><p className="text-sm font-medium">{detailLot.location ?? '—'}</p></div>
              <div><p className="text-xs text-slate-400">Statut</p><p className="text-sm font-medium">{detailLot.status}</p></div>
              <div><p className="text-xs text-slate-400">Valeur estimée</p><p className="text-sm font-medium">{detailLot.estimated_value !== null ? formatCurrency(detailLot.estimated_value) : '—'}</p></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal formulaire création/édition */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editLot ? "Modifier le lot" : "Nouveau lot"}
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
                  <span>{editLot ? 'Modifier' : 'Créer'}</span>
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
                <label className="block text-xs font-medium text-slate-600 mb-1">Identificateur *</label>
                <input
                  type="text"
                  value={form.identifier}
                  onChange={(e) => setForm('identifier', e.target.value)}
                  className={`form-input ${errors.identifier ? 'border-red-500' : ''}`}
                  placeholder="LOT-001"
                />
                {errors.identifier && <p className="mt-1 text-xs text-red-500">{errors.identifier}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Espèce *</label>
                <input
                  type="text"
                  value={form.species}
                  onChange={(e) => setForm('species', e.target.value)}
                  className={`form-input ${errors.species ? 'border-red-500' : ''}`}
                  placeholder="Bovin, Ovin, Caprin..."
                />
                {errors.species && <p className="mt-1 text-xs text-red-500">{errors.species}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Race</label>
                <input
                  type="text"
                  value={form.breed}
                  onChange={(e) => setForm('breed', e.target.value)}
                  className="form-input"
                  placeholder="Holstein, Mérinos..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre de têtes *</label>
                <input
                  type="number"
                  min="1"
                  value={form.count}
                  onChange={(e) => setForm('count', parseInt(e.target.value) || 1)}
                  className={`form-input ${errors.count ? 'border-red-500' : ''}`}
                />
                {errors.count && <p className="mt-1 text-xs text-red-500">{errors.count}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Localisation</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm('location', e.target.value)}
                  className="form-input"
                  placeholder="Établissement A..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Statut</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm('status', e.target.value as 'actif' | 'inactif' | 'quarantaine')}
                  className="form-input"
                >
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="quarantaine">Quarantaine</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Valeur estimée (FCFA)</label>
                <input
                  type="number"
                  min="0"
                  value={form.estimated_value ?? ''}
                  onChange={(e) => setForm('estimated_value', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="form-input"
                  placeholder="0"
                />
              </div>
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
        <p className="text-sm text-slate-600">Voulez-vous vraiment supprimer le lot « {confirmDelete?.identifier} » ? Cette action est irréversible.</p>
      </Modal>
    </div>
  );
}
