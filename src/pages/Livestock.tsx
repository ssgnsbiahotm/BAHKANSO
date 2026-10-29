import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/lib/DataContext';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/format';
import { useToast } from '@/lib/Toast';
import { RotatingCard } from '@/components/ui/RotatingCard';
import { Plus, Eye, Pencil, Trash2, Beef, AlertTriangle, Syringe } from 'lucide-react';

import '@/styles/module-theme.css';

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
    const totalAnimals = animalLots.reduce((s, l) => s + (l.count || 0), 0);
    const totalValue = animalLots.reduce((s, l) => s + (l.estimated_value || 0), 0);
    const individualValue = animals.reduce((s, a) => s + (a.estimated_value || 0), 0);
    const events = animalEvents.length;
    const vaccinations = animalEvents.filter(e => e.type === 'vaccination').length;
    return { totalAnimals, totalValue: totalValue + individualValue, events, vaccinations };
  }, [animals, animalLots, animalEvents]);

  const statusLabel = (status: string) => {
    if (status === 'actif') return 'Actif';
    if (status === 'quarantaine') return 'Quarantaine';
    return status;
  };

  const eventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      vaccination: 'Vaccination',
      traitement: 'Traitement',
      maladie: 'Maladie',
      naissance: 'Naissance',
      vente: 'Vente',
      achat: 'Achat',
      autre: 'Autre',
    };
    return labels[type] || type;
  };

  const getBadgeColor = (status: string) => {
    if (status === 'actif') return 'green';
    if (status === 'quarantaine') return 'amber';
    if (status === 'vaccination') return 'blue';
    if (status === 'traitement') return 'amber';
    if (status === 'naissance') return 'green';
    if (status === 'vente') return 'purple';
    return 'gray';
  };

  const renderLotFront = (lot: any) => (
    <div className="h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
              <Beef size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{lot.identifier}</h3>
              <p className="text-xs text-slate-500">{lot.species} — {lot.breed || '—'}</p>
            </div>
          </div>
          <span className={`module-badge module-badge-${getBadgeColor(lot.status)}`}>
            {statusLabel(lot.status)}
          </span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Effectif</span><span className="font-medium">{lot.count} têtes</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Localisation</span><span className="font-medium">{lot.location || '—'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Valeur estimée</span><span className="font-medium text-emerald-600">{formatCurrency(lot.estimated_value)}</span></div>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-emerald-200">
        <p className="text-sm text-emerald-700 font-medium">Voir les détails →</p>
      </div>
    </div>
  );

  const renderLotBack = (lot: any) => (
    <div className="h-full flex flex-col justify-between">
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
  );

  const renderAnimalFront = (a: any) => (
    <div className="h-full flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">{a.identifier}</h3>
            <p className="text-sm text-slate-500">{a.species} — {a.breed || '—'}</p>
          </div>
          <span className="module-badge module-badge-blue">{a.status}</span>
        </div>
        <div className="space-y-1 text-sm">
          <p><span className="text-slate-500">Sexe :</span> <span className="font-medium">{a.sex || '—'}</span></p>
          <p><span className="text-slate-500">Naissance :</span> <span className="font-medium">{formatDate(a.birth_date)}</span></p>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-emerald-200">
        <p className="text-sm text-emerald-700 font-medium">Voir les détails →</p>
      </div>
    </div>
  );

  const renderAnimalBack = (a: any) => (
    <div className="h-full flex flex-col justify-between">
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
  );

  const renderEventFront = (e: any) => (
    <div className="h-full flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">{formatDate(e.date)}</h3>
            <p className="text-sm text-slate-500">{e.description || '—'}</p>
          </div>
          <span className={`module-badge module-badge-${getBadgeColor(e.type)}`}>
            {eventTypeLabel(e.type)}
          </span>
        </div>
        <div className="space-y-1 text-sm">
          <p><span className="text-slate-500">Responsable :</span> <span className="font-medium">{e.responsible || '—'}</span></p>
          <p><span className="text-slate-500">Coût :</span> <span className="font-medium">{e.cost ? formatCurrency(e.cost) : '—'}</span></p>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-emerald-200">
        <p className="text-sm text-emerald-700 font-medium">Voir les détails →</p>
      </div>
    </div>
  );

  const renderEventBack = (e: any) => (
    <div className="h-full flex flex-col justify-between">
      <div className="space-y-2 text-sm">
        <h3 className="font-semibold text-slate-900 mb-3">{formatDate(e.date)}</h3>
        <p><span className="text-slate-500">Type :</span> {eventTypeLabel(e.type)}</p>
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
  );

  return (
    <div className="module-page">
      {/* ========== HEADER ========== */}
      <header className="module-header">
        <div className="module-header-left">
          <h1>Élevage</h1>
          <p className="module-subtitle">Gestion du cheptel, santé et événements</p>
        </div>
        <div className="module-header-right">
          <button
            onClick={() => navigate('/app/livestock/lots')}
            className="module-btn module-btn-primary"
          >
            <Plus size={16} /> Nouveau lot
          </button>
        </div>
      </header>

      {/* ========== KPI GRID ========== */}
      <div className="module-kpi-grid">
        <div className="module-kpi-card" style={{ borderLeftColor: '#2E7D32' }}>
          <div className="module-kpi-header">
            <div className="module-kpi-icon" style={{ backgroundColor: 'rgba(46, 125, 50, 0.15)', color: '#2E7D32' }}>
              <Beef size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">Total animaux</p>
            <div className="module-kpi-value" style={{ color: '#2E7D32' }}>
              {kpis.totalAnimals}
            </div>
          </div>
        </div>
        <div className="module-kpi-card" style={{ borderLeftColor: '#0277BD' }}>
          <div className="module-kpi-header">
            <div className="module-kpi-icon" style={{ backgroundColor: 'rgba(2, 119, 189, 0.15)', color: '#0277BD' }}>
              <Beef size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">Valeur estimée</p>
            <div className="module-kpi-value" style={{ color: '#0277BD' }}>
              {formatCurrency(kpis.totalValue).replace(' FCFA', '')}
            </div>
          </div>
        </div>
        <div className="module-kpi-card" style={{ borderLeftColor: '#F57F17' }}>
          <div className="module-kpi-header">
            <div className="module-kpi-icon" style={{ backgroundColor: 'rgba(245, 127, 23, 0.15)', color: '#F57F17' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">Événements</p>
            <div className="module-kpi-value" style={{ color: '#F57F17' }}>
              {kpis.events}
            </div>
          </div>
        </div>
        <div className="module-kpi-card" style={{ borderLeftColor: '#C62828' }}>
          <div className="module-kpi-header">
            <div className="module-kpi-icon" style={{ backgroundColor: 'rgba(198, 40, 40, 0.15)', color: '#C62828' }}>
              <Syringe size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">Vaccinations</p>
            <div className="module-kpi-value" style={{ color: '#C62828' }}>
              {kpis.vaccinations}
            </div>
          </div>
        </div>
      </div>

      {/* ========== TABS ========== */}
      <div className="module-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'overview'}
          onClick={() => setTab('overview')}
          className={`module-tab ${tab === 'overview' ? 'active' : ''}`}
        >
          Vue d'ensemble
        </button>
        <button
          role="tab"
          aria-selected={tab === 'lots'}
          onClick={() => setTab('lots')}
          className={`module-tab ${tab === 'lots' ? 'active' : ''}`}
        >
          Lots ({animalLots.length})
        </button>
        <button
          role="tab"
          aria-selected={tab === 'animals'}
          onClick={() => setTab('animals')}
          className={`module-tab ${tab === 'animals' ? 'active' : ''}`}
        >
          Animaux suivis ({animals.length})
        </button>
        <button
          role="tab"
          aria-selected={tab === 'events'}
          onClick={() => setTab('events')}
          className={`module-tab ${tab === 'events' ? 'active' : ''}`}
        >
          Événements ({animalEvents.length})
        </button>
      </div>

      {/* ========== VUE D'ENSEMBLE - LOTS ========== */}
      {tab === 'overview' && (
        <section className="module-section" aria-labelledby="overview-title">
          <div className="module-section-header">
            <h2 className="module-section-title" id="overview-title">Cheptel par lots</h2>
          </div>

          {animalLots.length === 0 ? (
            <div className="module-empty-state">
              <Beef size={48} className="module-empty-icon" />
              <h3 className="module-empty-title">Aucun lot</h3>
              <p className="module-empty-message">Créez votre premier lot pour commencer le suivi de votre cheptel.</p>
              <button
                onClick={() => navigate('/app/livestock/lots')}
                className="module-btn module-btn-primary"
              >
                <Plus size={14} /> Créer un lot
              </button>
            </div>
          ) : (
            <div className="module-cards-grid">
              {animalLots.map(lot => (
                <RotatingCard
                  key={lot.id}
                  flipLabel="Détails"
                  backLabel="Retour"
                  front={renderLotFront(lot)}
                  back={renderLotBack(lot)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========== LOTS ========== */}
      {tab === 'lots' && (
        <section className="module-section" aria-labelledby="lots-title">
          <div className="module-section-header">
            <h2 className="module-section-title" id="lots-title">Lots d'animaux</h2>
            <button
              onClick={() => navigate('/app/livestock/lots')}
              className="module-view-all-link"
            >
              Gestion détaillée <Eye size={14} />
            </button>
          </div>

          {animalLots.length === 0 ? (
            <div className="module-empty-state">
              <Beef size={48} className="module-empty-icon" />
              <h3 className="module-empty-title">Aucun lot</h3>
              <p className="module-empty-message">Créez votre premier lot d'animaux pour organiser votre cheptel.</p>
              <button
                onClick={() => navigate('/app/livestock/lots')}
                className="module-btn module-btn-primary"
              >
                <Plus size={14} /> Créer un lot
              </button>
            </div>
          ) : (
            <div className="module-cards-grid">
              {animalLots.map(lot => (
                <RotatingCard
                  key={lot.id}
                  flipLabel="Détails"
                  backLabel="Retour"
                  front={renderLotFront(lot)}
                  back={renderLotBack(lot)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========== ANIMAUX SUIVIS ========== */}
      {tab === 'animals' && (
        <section className="module-section" aria-labelledby="animals-title">
          <div className="module-section-header">
            <h2 className="module-section-title" id="animals-title">Animaux suivis individuellement</h2>
            <button
              onClick={() => navigate('/app/livestock/animals')}
              className="module-view-all-link"
            >
              Gestion détaillée <Eye size={14} />
            </button>
          </div>

          {animals.length === 0 ? (
            <div className="module-empty-state">
              <Beef size={48} className="module-empty-icon" />
              <h3 className="module-empty-title">Aucun animal suivi</h3>
              <p className="module-empty-message">Ajoutez des animaux au suivi individuel pour un traçage précis.</p>
              <button
                onClick={() => navigate('/app/livestock/animals')}
                className="module-btn module-btn-primary"
              >
                <Plus size={14} /> Ajouter un animal
              </button>
            </div>
          ) : (
            <div className="module-cards-grid">
              {animals.map(a => (
                <RotatingCard
                  key={a.id}
                  flipLabel="Détails"
                  backLabel="Retour"
                  front={renderAnimalFront(a)}
                  back={renderAnimalBack(a)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========== ÉVÉNEMENTS ========== */}
      {tab === 'events' && (
        <section className="module-section" aria-labelledby="events-title">
          <div className="module-section-header">
            <h2 className="module-section-title" id="events-title">Événements du cheptel</h2>
            <button
              onClick={() => navigate('/app/livestock/events')}
              className="module-view-all-link"
            >
              Gestion détaillée <Eye size={14} />
            </button>
          </div>

          {animalEvents.length === 0 ? (
            <div className="module-empty-state">
              <Syringe size={48} className="module-empty-icon" />
              <h3 className="module-empty-title">Aucun événement</h3>
              <p className="module-empty-message">Enregistrez les événements sanitaires et zootechniques de votre cheptel.</p>
              <button
                onClick={() => navigate('/app/livestock/events')}
                className="module-btn module-btn-primary"
              >
                <Plus size={14} /> Nouvel événement
              </button>
            </div>
          ) : (
            <div className="module-cards-grid">
              {animalEvents.map(e => (
                <RotatingCard
                  key={e.id}
                  flipLabel="Détails"
                  backLabel="Retour"
                  front={renderEventFront(e)}
                  back={renderEventBack(e)}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}