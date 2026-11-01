/**
 * ElevageModule — Destination principale du module Élevage.
 *
 * Page mère avec onglets de navigation interne déléguant aux pages dédiées :
 *  - Vue d'ensemble -> /app/elevage
 *  - Lots -> /app/elevage/lots
 *  - Animaux -> /app/elevage/animaux
 *  - Événements -> /app/elevage/evenements
 *
 * Remplace l'ancienne page /app/livestock et centralise l'élevage sous
 * /app/elevage. Le CRUD complet reste dans les pages dédiées.
 */

import { useMemo, useState, KeyboardEvent } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/lib/DataContext';
import { RotatingCard } from '@/components/ui/RotatingCard';
import { useToast } from '@/lib/Toast';
import { Beef, Building, Users, Calendar } from 'lucide-react';

import '@/styles/components.css';

type ElevageTab = 'overview' | 'lots' | 'animaux' | 'evenements';

const ELEVAGE_TABS: ElevageTab[] = ['overview', 'lots', 'animaux', 'evenements'];

const TAB_LABELS: Record<ElevageTab, string> = {
  overview: 'Vue d\'ensemble',
  lots: 'Lots',
  animaux: 'Animaux',
  evenements: 'Événements',
};

const TAB_PATHS: Record<ElevageTab, string> = {
  overview: '/app/elevage',
  lots: '/app/elevage/lots',
  animaux: '/app/elevage/animaux',
  evenements: '/app/elevage/evenements',
};

export function ElevageModule() {
  const { lots, animaux, animalEvents } = useData();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as ElevageTab | null;
  const [tab, setTab] = useState<ElevageTab>(
    ELEVAGE_TABS.includes(urlTab as ElevageTab) ? (urlTab as ElevageTab) : 'overview'
  );
  const navigate = useNavigate();

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = ELEVAGE_TABS.indexOf(tab);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % ELEVAGE_TABS.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + ELEVAGE_TABS.length) % ELEVAGE_TABS.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = ELEVAGE_TABS.length - 1;
    if (nextIndex === currentIndex) return;

    event.preventDefault();
    const nextTab = ELEVAGE_TABS[nextIndex];
    setTab(nextTab);
    document.getElementById(`elevage-tab-${nextTab}`)?.focus();
  };

  const kpis = useMemo(() => {
    return {
      totalLots: lots.length,
      totalAnimals: animaux.length,
      totalEvents: animalEvents.length,
    };
  }, [lots, animaux, animalEvents]);

  return (
    <div className="module-page">
      {/* ========== HEADER ========== */}
      <header className="module-header">
        <div className="module-header-left">
          <h1 className="text-primary">Élevage</h1>
          <p className="module-subtitle">Gestion des lots, animaux et événements d'élevage</p>
        </div>
        <div className="module-header-right">
          <button
            onClick={() => navigate('/app/elevage/lots')}
            className="module-btn module-btn-primary"
          >
            <Building size={16} /> Nouveau lot
          </button>
        </div>
      </header>

      {/* ========== KPI GRID ========== */}
      <div className="module-kpi-grid">
        <div className="module-kpi-card border-l-[var(--accent-primary)]">
          <div className="module-kpi-header">
            <div className="module-kpi-icon bg-[var(--accent-soft)] text-[var(--accent-primary)]">
              <Building size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">Lots</p>
            <div className="module-kpi-value text-[var(--accent-primary)]">
              {kpis.totalLots}
            </div>
          </div>
        </div>
        <div className="module-kpi-card border-l-[var(--info)]">
          <div className="module-kpi-header">
            <div className="module-kpi-icon bg-[var(--info-soft)] text-[var(--info)]">
              <Users size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">Animaux</p>
            <div className="module-kpi-value text-[var(--info)]">
              {kpis.totalAnimals}
            </div>
          </div>
        </div>
        <div className="module-kpi-card border-l-[var(--warning)]">
          <div className="module-kpi-header">
            <div className="module-kpi-icon bg-[var(--warning-soft)] text-[var(--warning)]">
              <Calendar size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">Événements</p>
            <div className="module-kpi-value text-[var(--warning)]">
              {kpis.totalEvents}
            </div>
          </div>
        </div>
      </div>

      {/* ========== TABS ========== */}
      <div className="module-tabs" role="tablist" aria-label="Sections Élevage">
        {ELEVAGE_TABS.map((t) => (
          <button
            key={t}
            id={`elevage-tab-${t}`}
            role="tab"
            aria-selected={tab === t}
            aria-controls={`elevage-panel-${t}`}
            tabIndex={tab === t ? 0 : -1}
            onClick={() => setTab(t)}
            onKeyDown={handleTabKeyDown}
            className={`module-tab ${tab === t ? 'active' : ''}`}
          >
            {TAB_LABELS[t]} ({tabCounts(t)})
          </button>
        ))}
      </div>

      {/* ========== PANELS (délégation aux pages dédiées via Outlet) ========== */}
      <section id="elevage-panel-overview" role="tabpanel" tabIndex={0} className="module-section" aria-labelledby="elevage-tab-overview" hidden={tab !== 'overview'}>
        <Outlet context={{ mode: 'tab', section: 'overview' }} />
      </section>
      <section id="elevage-panel-lots" role="tabpanel" tabIndex={0} className="module-section" aria-labelledby="elevage-tab-lots" hidden={tab !== 'lots'}>
        <Outlet context={{ mode: 'tab', section: 'lots' }} />
      </section>
      <section id="elevage-panel-animaux" role="tabpanel" tabIndex={0} className="module-section" aria-labelledby="elevage-tab-animaux" hidden={tab !== 'animaux'}>
        <Outlet context={{ mode: 'tab', section: 'animaux' }} />
      </section>
      <section id="elevage-panel-evenements" role="tabpanel" tabIndex={0} className="module-section" aria-labelledby="elevage-tab-evenements" hidden={tab !== 'evenements'}>
        <Outlet context={{ mode: 'tab', section: 'evenements' }} />
      </section>
    </div>
  );

  function tabCounts(t: ElevageTab): number {
    if (t === 'overview') return kpis.totalLots + kpis.totalAnimals + kpis.totalEvents;
    if (t === 'lots') return kpis.totalLots;
    if (t === 'animaux') return kpis.totalAnimals;
    return kpis.totalEvents;
  }
}
