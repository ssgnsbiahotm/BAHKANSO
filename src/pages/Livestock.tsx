import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/lib/DataContext';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/format';
import { useToast } from '@/lib/Toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { SimpleBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { RotatingCard } from '@/components/ui/RotatingCard';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';

export function Livestock() {
  const { animals, animalLots, animalEvents, refresh } = useData();
  const toast = useToast();
  const [tab, setTab] = useState<'overview' | 'lots' | 'animals' | 'events'>('overview');
  const navigate = useNavigate();

  const handleDeleteLot = async (id: string) => {
    if (!window.confirm('Supprimer ce lot ? Cette action est irréversible.')) return;
    try {
      const { error } = await supabase.from('animal_lots').delete().eq('id', id);
      if (error) throw error;
      toast.show('Lot supprimé', 'success');
      refresh?.();
    } catch (err: any) {
      console.error(err);
      toast.show('Erreur: ' + err.message, 'error');
    }
  };

  const handleEditLot = (lotId: string) => {
    navigate('/app/livestock/lots?select=' + lotId + '&action=edit');
  };

  const handleDeleteAnimal = async (id: string) => {
    if (!window.confirm('Supprimer cet animal ? Cette action est irréversible.')) return;
    try {
      const { error } = await supabase.from('animals').delete().eq('id', id);
      if (error) throw error;
      toast.show('Animal supprimé', 'success');
      refresh?.();
    } catch (err: any) {
      console.error(err);
      toast.show('Erreur: ' + err.message, 'error');
    }
  };

  const handleEditAnimal = (animalId: string) => {
    navigate('/app/livestock/animals?select=' + animalId + '&action=edit');
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Supprimer cet événement ? Cette action est irréversible.')) return;
    try {
      const { error } = await supabase.from('animal_events').delete().eq('id', id);
      if (error) throw error;
      toast.show('Événement supprimé', 'success');
      refresh?.();
    } catch (err: any) {
      console.error(err);
      toast.show('Erreur: ' + err.message, 'error');
    }
  };

  const handleEditEvent = (eventId: string) => {
    navigate('/app/livestock/events?select=' + eventId + '&action=edit');
  };

  const kpis = useMemo(() => {
    const totalAnimals = animalLots.reduce((s, l) => s + l.count, 0);
    const totalValue = animalLots.reduce((s, l) => s + l.estimated_value, 0);
    const individualValue = animals.reduce((s, a) => s + a.estimated_value, 0);
    const events = animalEvents.length;
    const vaccinations = animalEvents.filter(e => e.type === 'vaccination').length;
    return { totalAnimals, totalValue: totalValue + individualValue, events, vaccinations };
  }, [animals, animalLots, animalEvents]);

  const openCreateAnimal = () => navigate('/app/livestock/animals');
  const openCreateLot = () => navigate('/app/livestock/lots');
  const openCreateEvent = () => navigate('/app/livestock/events');

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader title="Élevage" subtitle="Gestion du cheptel, santé et événements" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total animaux" value={String(kpis.totalAnimals)} icon={null} color="green" />
        <KpiCard label="Valeur estimée" value={formatCurrency(kpis.totalValue)} icon={null} color="blue" />
        <KpiCard label="Événements" value={String(kpis.events)} icon={null} color="amber" />
        <KpiCard label="Vaccinations" value={String(kpis.vaccinations)} icon={null} color="red" />
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {(['overview', 'lots', 'animals', 'events'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${tab === t ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {t === 'overview' ? 'Vue d\'ensemble' : t === 'lots' ? 'Lots' : t === 'animals' ? 'Animaux suivis' : 'Événements'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {animalLots.map(lot => (
            <div key={lot.id} className="rotatable-card bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600"></div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{lot.identifier}</h3>
                    <p className="text-xs text-slate-500">{lot.species} — {lot.breed}</p>
                  </div>
                </div>
                <SimpleBadge color="green">{lot.status}</SimpleBadge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Effectif</span><span className="font-medium">{lot.count} têtes</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Localisation</span><span className="font-medium">{lot.location || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Valeur estimée</span><span className="font-medium text-green-600">{formatCurrency(lot.estimated_value)}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'lots' && (
        <>
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900">Lots</h2>
              <button
                onClick={openCreateLot}
                className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus size={18} /> Nouveau lot
              </button>
            </div>
            <p className="mt-2 text-slate-600">
              Utilisez la page de gestion détaillée pour créer, modifier ou supprimer un lot.
            </p>
          </div>
          {animalLots.length === 0 ? (
            <EmptyState
              icon={null}
              title="Aucun lot"
              message="Aucun lot d'animaux enregistré"
              action={<button onClick={openCreateLot} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">Créer un lot</button>}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {animalLots.map(lot => (
                <RotatingCard key={lot.id} flipLabel="Détails" backLabel="Retour"
                  front={
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full flex flex-col justify-between">
                      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">{lot.identifier}</h3>
            <p className="text-sm text-slate-500">{lot.species} — {lot.breed}</p>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${lot.status === 'actif' ? 'bg-green-100 text-green-700' : lot.status === 'quarantaine' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
            {lot.status}
          </span>
        </div>
        <div className="space-y-1 text-sm">
          <p><span className="text-slate-500">Effectif :</span> <span className="font-medium">{lot.count} têtes</span></p>
          <p><span className="text-slate-500">Localisation :</span> <span className="font-medium">{lot.location || '—'}</span></p>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-sm text-emerald-700 font-medium">Voir les détails →</p>
      </div>
    </div>
                  }
                  back={
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm h-full flex flex-col justify-between">
                      <div className="space-y-2 text-sm">
                        <h3 className="font-semibold text-slate-900 mb-3">{lot.identifier}</h3>
                        <p><span className="text-slate-500">Espèce :</span> {lot.species}</p>
                        <p><span className="text-slate-500">Race :</span> {lot.breed || '—'}</p>
                        <p><span className="text-slate-500">Effectif :</span> {lot.count} têtes</p>
                        <p><span className="text-slate-500">Localisation :</span> {lot.location || '—'}</p>
                        <p><span className="text-slate-500">Valeur estimée :</span> {formatCurrency(lot.estimated_value)}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-emerald-200 space-y-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); navigate(`/app/livestock/lots?select=${lot.id}&action=view`); }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <Eye size={16} /> Voir détails
                        </button>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleEditLot(lot.id); }}
                            className="flex-1 bg-white text-blue-600 border border-blue-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 flex items-center justify-center gap-1"
                          >
                            <Pencil size={14} /> Modifier
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteLot(lot.id); }}
                            className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-1"
                          >
                            <Trash2 size={14} /> Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'animals' && (
        <>
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900">Animaux suivis</h2>
              <button
                onClick={openCreateAnimal}
                className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus size={18} /> Nouveau animal
              </button>
            </div>
            <p className="mt-2 text-slate-600">
              Utilisez la page de gestion détaillée pour créer, modifier ou supprimer un animal individuel.
            </p>
          </div>
          {animals.length === 0 ? (
            <EmptyState
              icon={null}
              title="Aucun animal"
              message="Aucun animal suivi enregistré"
              action={<button onClick={openCreateAnimal} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">Créer un animal</button>}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {animals.map(a => (
                <RotatingCard key={a.id} flipLabel="Détails" backLabel="Retour"
                  front={
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full flex flex-col justify-between">
                      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">{a.identifier}</h3>
            <p className="text-sm text-slate-500">{a.species} — {a.breed || '—'}</p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            {a.status}
          </span>
        </div>
        <div className="space-y-1 text-sm">
          <p><span className="text-slate-500">Sexe :</span> <span className="font-medium">{a.sex || '—'}</span></p>
          <p><span className="text-slate-500">Naissance :</span> <span className="font-medium">{formatDate(a.birth_date)}</span></p>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-sm text-emerald-700 font-medium">Voir les détails →</p>
      </div>
    </div>
                  }
                  back={
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm h-full flex flex-col justify-between">
                      <div className="space-y-2 text-sm">
                        <h3 className="font-semibold text-slate-900 mb-3">{a.identifier}</h3>
                        <p><span className="text-slate-500">Espèce :</span> {a.species}</p>
                        <p><span className="text-slate-500">Race :</span> {a.breed || '—'}</p>
                        <p><span className="text-slate-500">Sexe :</span> {a.sex || '—'}</p>
                        <p><span className="text-slate-500">Naissance :</span> {formatDate(a.birth_date)}</p>
                        <p><span className="text-slate-500">Poids :</span> {a.weight_kg || '—'} kg</p>
                        <p><span className="text-slate-500">Valeur :</span> {formatCurrency(a.estimated_value)}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-emerald-200 space-y-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); navigate(`/app/livestock/animals?select=${a.id}&action=view`); }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <Eye size={16} /> Voir détails
                        </button>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleEditAnimal(a.id); }}
                            className="flex-1 bg-white text-blue-600 border border-blue-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 flex items-center justify-center gap-1"
                          >
                            <Pencil size={14} /> Modifier
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteAnimal(a.id); }}
                            className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-1"
                          >
                            <Trash2 size={14} /> Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'events' && (
        <>
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900">Événements</h2>
              <button
                onClick={openCreateEvent}
                className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus size={18} /> Nouvel événement
              </button>
            </div>
            <p className="mt-2 text-slate-600">
              Utilisez la page de gestion détaillée pour créer, modifier ou supprimer un événement.
            </p>
          </div>
          {animalEvents.length === 0 ? (
            <EmptyState
              icon={null}
              title="Aucun événement"
              message="Aucun événement animal enregistré"
              action={<button onClick={openCreateEvent} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">Créer un événement</button>}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {animalEvents.map(e => {
                const TYPE_LABELS: Record<string, string> = {
                  vaccination: 'Vaccination',
                  traitement: 'Traitement',
                  maladie: 'Maladie',
                  naissance: 'Naissance',
                  vente: 'Vente',
                  achat: 'Achat',
                  autre: 'Autre',
                };
                const color =
                  e.type === 'vaccination' ? 'blue' :
                  e.type === 'traitement' ? 'amber' :
                  e.type === 'naissance' ? 'green' :
                  e.type === 'vente' ? 'purple' :
                  'gray';
                return (
                  <RotatingCard key={e.id} flipLabel="Détails" backLabel="Retour"
                    front={
                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full flex flex-col justify-between">
                        <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{formatDate(e.date)}</h3>
                  <p className="text-sm text-slate-500">{e.description || '—'}</p>
                </div>
                <SimpleBadge color={color}>{TYPE_LABELS[e.type] || e.type}</SimpleBadge>
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="text-slate-500">Responsable :</span> <span className="font-medium">{e.responsible || '—'}</span></p>
                <p><span className="text-slate-500">Coût :</span> <span className="font-medium">{e.cost ? formatCurrency(e.cost) : '—'}</span></p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-sm text-emerald-700 font-medium">Voir les détails →</p>
            </div>
                      </div>
                    }
                    back={
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm h-full flex flex-col justify-between">
                        <div className="space-y-2 text-sm">
                          <h3 className="font-semibold text-slate-900 mb-3">{formatDate(e.date)}</h3>
                          <p><span className="text-slate-500">Type :</span> {TYPE_LABELS[e.type] || e.type}</p>
                          <p><span className="text-slate-500">Description :</span> {e.description || '—'}</p>
                          <p><span className="text-slate-500">Responsable :</span> {e.responsible || '—'}</p>
                          <p><span className="text-slate-500">Coût :</span> {e.cost ? formatCurrency(e.cost) : '—'}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-emerald-200 space-y-2">
                          <button
                            type="button"
                            onClick={(e2) => { e2.stopPropagation(); navigate(`/app/livestock/events?select=${e.id}&action=view`); }}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Eye size={16} /> Voir détails
                          </button>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(e2) => { e2.stopPropagation(); handleEditEvent(e.id); }}
                              className="flex-1 bg-white text-blue-600 border border-blue-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 flex items-center justify-center gap-1"
                            >
                              <Pencil size={14} /> Modifier
                            </button>
                            <button
                              type="button"
                              onClick={(e2) => { e2.stopPropagation(); handleDeleteEvent(e.id); }}
                              className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-1"
                            >
                              <Trash2 size={14} /> Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    }
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
