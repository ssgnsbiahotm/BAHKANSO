import React, { ReactNode, useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { formatCurrency, formatDate } from '@/lib/format';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { SiteContext } from '@/lib/SiteContext';
import {
  TrendingUp, AlertTriangle, Package,
  Beef, Sprout, HardHat, ArrowRight, Clock, CheckCircle2,
  AlertCircle, Info, DollarSign, FileText, Lock, Target
} from 'lucide-react';
import { LIVESTOCK_PATHS } from '@/routes/livestockPaths';
import {
  calculateYield,
  calculateProjectProgress,
  calculateCostPerUnit,
  calculateMortalityRate,
  calculateAverageDailyGain,
  calculateCampaignMargin,
} from '@/lib/kpi';
import { Accordion } from '@/components/ui/Accordion';

import '@/styles/components.css';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

// Activités — couleurs d'icône (mappées aux tokens sémantiques)
const ACTIVITY_COLORS: Record<string, 'signal' | 'warning' | 'info'> = {
  Agriculture: 'signal',
  Élevage: 'warning',
  Projets: 'warning',
};

const LiveClock = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const dateString = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="live-clock" title={dateString}>
      <div className="clock-time">{timeString}</div>
      <div className="clock-date">{dateString.charAt(0).toUpperCase() + dateString.slice(1)}</div>
    </div>
  );
};

// Carte KPI réutilisable (variante locale du dashboard, conservée telle quelle)
const LocalKpiCard = ({
  label,
  value,
  sub,
  color,
  icon,
  trend,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  color?: 'signal' | 'warning' | 'info' | 'muted';
  icon: ReactNode;
  trend?: { value: string; positive: boolean };
}) => (
  <div className={`dashboard-kpi-card ${color || ''}`}>
    <div className="dashboard-kpi-header">
      <div className={`dashboard-kpi-icon ${color || ''}`}>
        {icon}
      </div>
      {trend && (
        <span className={`dashboard-kpi-trend ${trend.positive ? 'positive' : 'negative'}`}>
          {trend.value}
        </span>
      )}
    </div>
    <div className="dashboard-kpi-body">
      <p className="dashboard-kpi-label">{label}</p>
      <div className={`dashboard-kpi-value ${color || ''}`}>
        {value}
        {sub && <span className="dashboard-kpi-sub">{sub}</span>}
      </div>
    </div>
  </div>
);

const PriorityCard = ({
  reason,
  count,
  to,
  label,
  severe,
  icon,
}: {
  reason: string;
  count: number;
  to: string;
  label: string;
  severe: boolean;
  icon: ReactNode;
}) => (
  <Link to={to} className={`dashboard-priority-card ${severe ? 'severe' : ''}`}>
    <div className="dashboard-priority-icon">{icon}</div>
    <div className="dashboard-priority-content">
      <p className="dashboard-priority-reason">{reason}</p>
      <div className="dashboard-priority-meta">
        <span className="dashboard-priority-count">{count}</span>
        <span className="dashboard-priority-label">{label}</span>
      </div>
    </div>
    <ArrowRight size={18} className="dashboard-priority-arrow" />
  </Link>
);

const ActivityCard = ({
  title,
  value,
  detail,
  icon,
  color,
  to,
  toLabel,
  subValues,
}: {
  title: string;
  value: number | null;
  detail: string;
  icon: ReactNode;
  color: 'signal' | 'warning' | 'info';
  to: string;
  toLabel: string;
  subValues?: { label: string; count: number }[];
}) => (
  <Link to={to} className="dashboard-activity-card">
    <div className={`dashboard-activity-icon ${color}`}>
      {icon}
    </div>
    <div className="dashboard-activity-body">
      <h3 className="dashboard-activity-title">{title}</h3>
      <p className="dashboard-activity-detail">{detail}</p>
      <div className="dashboard-activity-stats">
        {subValues ? (
          subValues.map((sv) => (
            <span key={sv.label} className="dashboard-stat-item">
              <span className="dashboard-stat-count">{sv.count}</span>
              <span className="dashboard-stat-label">{sv.label}</span>
            </span>
          ))
        ) : value !== null && (
          <span className="dashboard-stat-item single">
            <span className="dashboard-stat-count">{value}</span>
            <span className="dashboard-stat-label">{detail}</span>
          </span>
        )}
      </div>
    </div>
    <div className="dashboard-activity-cta">
      <span>{toLabel}</span>
      <ArrowRight size={16} />
    </div>
  </Link>
);

const EmptyState = ({ icon, title, message, action }: {
  icon: ReactNode;
  title: string;
  message: string;
  action?: React.ReactNode;
}) => (
  <div className="dashboard-empty-state">
    <div className="dashboard-empty-icon">
      {icon}
    </div>
    <div className="dashboard-empty-text">
      <h4 className="dashboard-empty-title">{title}</h4>
      <p className="dashboard-empty-message">{message}</p>
    </div>
    {action}
  </div>
);

const SectionHeader = ({ id, title, description, action }: {
  id: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) => (
  <div className="dashboard-section-header">
    <div>
      <h2 id={id} className="dashboard-section-title">{title}</h2>
      {description && <p className="dashboard-section-description">{description}</p>}
    </div>
    {action}
  </div>
);

const isFinanceSensitive = (role: string | null | undefined) =>
  role !== 'administrateur' && role !== 'proprietaire' && role !== 'propriétaire' && role !== 'responsable' && role !== 'responsable agricole' && role !== 'responsable élevage' && role !== 'gestionnaire';

export function Dashboard() {
  const { appUser } = useAuth();
  const {
    grossMargin,
    periodLabel,
    openCriticalAlerts,
    expensesWithoutJustificatif,
    lowStockItems,
    overdueProjects,
    latestTransactions,
    loading,
    error,
  } = useDashboardStats();

  const { media, siteContent, sourceStatus, loadModule, farm } = useData();

  const showFinance = !isFinanceSensitive(appUser?.role);

  // Contexte de site global : dégradé en mode "tous les sites" si le Dashboard
  // est rendu hors d'un SiteProvider (ex. tests unitaires isolés).
  const siteCtx = useContext(SiteContext);
  const currentSiteId = siteCtx?.currentSiteId ?? null;
  const setCurrentSiteId = siteCtx?.setCurrentSiteId ?? (() => {});
  const availableSites = siteCtx?.availableSites ?? [];
  const currentSite = siteCtx?.currentSite ?? null;
  const isGlobalView = siteCtx?.isGlobalView ?? true;

  // S'assurer que les sources du module dashboard sont chargées
  useEffect(() => {
    loadModule('dashboard');
  }, [loadModule]);

  // Données brutes du contexte (sources dashboard déjà chargées)
  const { campaigns = [], projects = [], animals = [], animalLots = [] } = useData();

  // Blocs filtrés par site (campagnes, chantiers, lots, animaux portent site_id)
  const siteFilteredCampaigns = currentSiteId
    ? campaigns.filter((c) => c.site_id === currentSiteId)
    : campaigns;
  const siteFilteredProjects = currentSiteId
    ? projects.filter((p) => p.site_id === currentSiteId)
    : projects;
  const siteFilteredAnimalLots = currentSiteId
    ? animalLots.filter((l) => l.site_id === currentSiteId)
    : animalLots;
  const siteFilteredAnimals = currentSiteId
    ? animals.filter((a) => a.site_id === currentSiteId)
    : animals;

  // Activités de la ferme (filtrées par site quand un site est sélectionné)
  const activities = [
    {
      title: 'Agriculture',
      value: siteFilteredCampaigns.filter((c) => c.status === 'actif').length,
      detail: 'Campagnes actives',
      icon: <Sprout size={24} />,
      color: ACTIVITY_COLORS.Agriculture,
      to: '/app/exploitation/campagnes',
      toLabel: 'Voir les campagnes',
    },
    {
      title: 'Élevage',
      value: null,
      detail: 'Registre du cheptel',
      icon: <Beef size={24} />,
      color: ACTIVITY_COLORS.Élevage,
      to: LIVESTOCK_PATHS.animalsLegacy,
      toLabel: 'Voir l\'élevage',
      subValues: [
        { label: 'Lots', count: siteFilteredAnimalLots.length },
        { label: 'Animaux', count: siteFilteredAnimals.length },
      ],
    },
    {
      title: 'Projets',
      value: siteFilteredProjects.filter((p) => p.status === 'en cours').length,
      detail: 'Chantiers en cours',
      icon: <HardHat size={24} />,
      color: ACTIVITY_COLORS.Projets,
      to: '/app/projects',
      toLabel: 'Voir les projets',
    },
  ];

  // ========== KPIs principaux (niveau ferme — Total exploitation) ==========
  const activeCampaign = campaigns.find((c) => c.status === 'actif');
  const activeProject = projects.find((p) => p.status === 'en cours');

  const [yieldValue, setYieldValue] = useState<number | null>(null);
  const [yieldLoading, setYieldLoading] = useState(false);
  const [progressValue, setProgressValue] = useState<number | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [costPerUnitValue, setCostPerUnitValue] = useState<number | null>(null);
  const [costPerUnitLoading, setCostPerUnitLoading] = useState(false);
  const [mortalityRateValue, setMortalityRateValue] = useState<number | null>(null);
  const [adgValue, setAdgValue] = useState<number | null>(null);
  const [mortalityLoading, setMortalityLoading] = useState(false);
  const [adgLoading, setAdgLoading] = useState(false);
  const [campaignMarginValue, setCampaignMarginValue] = useState<number | null>(null);
  const [campaignMarginLoading, setCampaignMarginLoading] = useState(false);

  const farmId = farm?.id;

  // Rendement de la campagne active (niveau ferme)
  useEffect(() => {
    let mounted = true;
    const compute = async () => {
      if (!farmId || !activeCampaign?.id) {
        if (mounted) setYieldValue(null);
        return;
      }
      setYieldLoading(true);
      try {
        const value = await calculateYield(activeCampaign.id);
        if (mounted) setYieldValue(value);
      } finally {
        if (mounted) setYieldLoading(false);
      }
    };
    compute();
    return () => { mounted = false; };
  }, [farmId, activeCampaign?.id]);

  // Avancement du chantier actif (niveau ferme)
  useEffect(() => {
    let mounted = true;
    const compute = async () => {
      if (!farmId || !activeProject?.id) {
        if (mounted) setProgressValue(null);
        return;
      }
      setProgressLoading(true);
      try {
        const value = await calculateProjectProgress(activeProject.id);
        if (mounted) setProgressValue(value);
      } finally {
        if (mounted) setProgressLoading(false);
      }
    };
    compute();
    return () => { mounted = false; };
  }, [farmId, activeProject?.id]);

  // Coût de revient unitaire (niveau ferme)
  useEffect(() => {
    let mounted = true;
    const compute = async () => {
      if (!farmId) {
        if (mounted) setCostPerUnitValue(null);
        return;
      }
      setCostPerUnitLoading(true);
      try {
        const value = await calculateCostPerUnit(farmId);
        if (mounted) setCostPerUnitValue(value);
      } finally {
        if (mounted) setCostPerUnitLoading(false);
      }
    };
    compute();
    return () => { mounted = false; };
  }, [farmId]);

  // Taux de mortalité (niveau ferme)
  useEffect(() => {
    let mounted = true;
    const compute = async () => {
      if (!farmId) {
        if (mounted) setMortalityRateValue(null);
        return;
      }
      setMortalityLoading(true);
      try {
        const value = await calculateMortalityRate(farmId);
        if (mounted) setMortalityRateValue(value);
      } finally {
        if (mounted) setMortalityLoading(false);
      }
    };
    compute();
    return () => { mounted = false; };
  }, [farmId]);

  // GMQ (niveau ferme)
  useEffect(() => {
    let mounted = true;
    const compute = async () => {
      if (!farmId) {
        if (mounted) setAdgValue(null);
        return;
      }
      setAdgLoading(true);
      try {
        const value = await calculateAverageDailyGain(farmId);
        if (mounted) setAdgValue(value);
      } finally {
        if (mounted) setAdgLoading(false);
      }
    };
    compute();
    return () => { mounted = false; };
  }, [farmId]);

  // Marge par culture / campagne active (niveau ferme)
  useEffect(() => {
    let mounted = true;
    const compute = async () => {
      if (!farmId || !activeCampaign?.id) {
        if (mounted) setCampaignMarginValue(null);
        return;
      }
      setCampaignMarginLoading(true);
      try {
        const value = await calculateCampaignMargin(activeCampaign.id);
        if (mounted) setCampaignMarginValue(value);
      } finally {
        if (mounted) setCampaignMarginLoading(false);
      }
    };
    compute();
    return () => { mounted = false; };
  }, [farmId, activeCampaign?.id]);

  // Recherche de l'image de couverture configurée
  const getHeroImageUrl = (): string | null => {
    const heroCoverContent = siteContent['hero-cover']?.value as { mediaId?: string } | undefined;
    if (heroCoverContent?.mediaId) {
      const mediaItem = media.find(m => m.id === heroCoverContent.mediaId);
      if (mediaItem?.url) return mediaItem.url;
    }
    const coverMedia = media.find(m => m.type === 'image' && (m.category === 'cover' || m.category === 'hero'));
    if (coverMedia?.url) return coverMedia.url;
    const firstImage = media.find(m => m.type === 'image');
    if (firstImage?.url) return firstImage.url;
    return null;
  };

  const heroImageUrl = getHeroImageUrl();

  if (loading) {
    return (
      <div className="dashboard-loading dashboard-error">
        <div className="dashboard-spinner" />
        <p>Chargement du tableau de bord…</p>
      </div>
    );
  }

  // Vérifier la disponibilité des sources pour les priorités
  const prioritySourcesPending =
    sourceStatus.expenses === 'loading' ||
    sourceStatus.inventoryItems === 'loading' ||
    sourceStatus.projects === 'loading' ||
    sourceStatus.alerts === 'loading';

  const prioritySourcesError =
    sourceStatus.expenses === 'error' ||
    sourceStatus.inventoryItems === 'error' ||
    sourceStatus.projects === 'error' ||
    sourceStatus.alerts === 'error';

  const transactionsSourceError = sourceStatus.transactions === 'error';

  // Priorités
  const priorities = [
    {
      reason: 'Justificatifs manquants',
      count: expensesWithoutJustificatif,
      to: '/app/finance',
      label: 'Voir les dépenses',
      severe: expensesWithoutJustificatif > 0,
      icon: <FileText size={18} />,
    },
    {
      reason: 'Stock sous le seuil minimum',
      count: lowStockItems,
      to: '/app/inventory',
      label: 'Gérer les stocks',
      severe: lowStockItems > 0,
      icon: <Package size={18} />,
    },
    {
      reason: 'Échéance de projet dépassée',
      count: overdueProjects,
      to: '/app/projects',
      label: 'Voir les projets',
      severe: overdueProjects > 0,
      icon: <Clock size={18} />,
    },
    {
      reason: 'Alertes critiques ouvertes',
      count: openCriticalAlerts,
      to: '/app/monitoring',
      label: 'Voir les alertes',
      severe: openCriticalAlerts > 0,
      icon: <AlertTriangle size={18} />,
    },
  ];

  const visiblePriorities = priorities.filter((p) => p.count > 0).slice(0, 4);
  const hasAnyPriority = visiblePriorities.length > 0;

  return (
    <div className="dashboard-page">
      {/* ========== HEADER ========== */}
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <h1>Tableau de bord</h1>
          <p className="dashboard-subtitle">Pilotage de l'exploitation : synthèse, priorités et activités.</p>
        </div>
        <div className="dashboard-header-right">
          <LiveClock />
        </div>
      </header>

      {/* ========== HERO PANORAMIQUE ========== */}
      {heroImageUrl ? (
        <div className="hero-panorama" role="img" aria-label="Vue panoramique de l'exploitation agricole">
          <OptimizedImage src={heroImageUrl} alt="" className="w-full h-full object-cover" />
          <div className="hero-overlay" />
          <div className="hero-content">
            <h2 className="hero-title">{typeof siteContent['farm-name']?.value === 'string' ? siteContent['farm-name'].value : 'Exploitation BAHKANSO'}</h2>
            <p className="hero-subtitle">
              {typeof siteContent['farm-tagline']?.value === 'string' ? siteContent['farm-tagline'].value : 'Synthèse opérationnelle — données temps réel'}
            </p>
          </div>
        </div>
      ) : (
        <div className="hero-panorama hero-fallback" role="img" aria-label="Illustration agricole générique">
          <div className="hero-fallback-content">
            <svg className="hero-fallback-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
              <path d="M12 2L13.5 6H19L15 9.5L16.5 14L12 11.5L7.5 14L9 9.5L5 6H10.5Z" />
              <path d="M12 22V18" />
              <path d="M8 18H16" />
              <path d="M9 6H15" />
              <path d="M10 14H14" />
            </svg>
            <h2 className="hero-fallback-title">Exploitation BAHKANSO</h2>
            <p className="hero-fallback-message">
              Aucune couverture configurée.
              <Link to="/app/media">Configurer dans Médias</Link>
            </p>
          </div>
        </div>
      )}

      {/* Erreur partielle */}
      {error && !loading && (
        <div className="partial-error">
          <Info size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ========== SÉLECTEUR DE SITE GLOBAL ========== */}
      <section className="dashboard-section" aria-labelledby="site-selector-title">
        <SectionHeader
          id="site-selector-title"
          title="Périmètre du tableau de bord"
          description="Les indicateurs clés restent au niveau exploitation (Total exploitation) et ne sont pas affectés par ce sélecteur. Seuls les blocs de campagnes, chantiers, lots et animaux en tiennent compte."
        />
        <div className="dashboard-site-selector">
          <label htmlFor="global-site-select" className="dashboard-site-label">Site</label>
          <select
            id="global-site-select"
            value={currentSiteId ?? ''}
            onChange={(e) => setCurrentSiteId(e.target.value || null)}
            className="dashboard-site-select"
          >
            <option value="">Tous les sites</option>
            {availableSites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <span className="dashboard-site-badge">
            {isGlobalView ? 'Vue globale — tous les sites' : currentSite ? `Site : ${currentSite.name}` : 'Tous les sites'}
          </span>
        </div>
      </section>

      <div className="dashboard-grid">

        {/* ========== A. SYNTHÈSE EXPLOITATION (4 KPIs principaux, niveau ferme) ========== */}
        <section className="dashboard-section finance-dashboard-section" aria-labelledby="synthesis-title" style={{ gridColumn: '1 / -1' }}>
          <SectionHeader
            id="synthesis-title"
            title="Synthèse exploitation — Total exploitation"
            description={`Indicateurs calculés au niveau ferme, indépendants du sélecteur de site. Période : ${periodLabel}.`}
          />
          <div className="dashboard-kpi-grid">
            {showFinance ? (
              <LocalKpiCard
                label="Marge brute"
                value={grossMargin.toFixed(1) + '%'}
                sub="Total exploitation"
                icon={<DollarSign size={20} />}
                color="signal"
              />
            ) : (
              <div className="dashboard-kpi-card restricted muted" style={{ gridColumn: '1 / -1' }}>
                <div className="dashboard-kpi-header">
                  <div className="dashboard-kpi-icon muted">
                    <Lock size={20} />
                  </div>
                </div>
                <div className="dashboard-kpi-body">
                  <p className="dashboard-kpi-label">Données financières</p>
                  <div className="dashboard-kpi-value muted">Accès réservé</div>
                  <p className="dashboard-kpi-sub">Réservé aux rôles admin, responsable et gestionnaire</p>
                </div>
              </div>
            )}
            <LocalKpiCard
              label="Coût de revient unitaire"
              value={
                costPerUnitLoading
                  ? 'Chargement…'
                  : costPerUnitValue !== null
                  ? `${costPerUnitValue.toFixed(0)} XOF/unité`
                  : '—'
              }
              sub="Total exploitation"
              icon={<Beef size={20} />}
              color="info"
            />
            <LocalKpiCard
              label="Rendement"
              value={
                yieldLoading
                  ? 'Chargement…'
                  : yieldValue !== null
                  ? `${yieldValue.toFixed(0)} kg/ha`
                  : activeCampaign ? '—' : 'Aucune campagne active'
              }
              sub={activeCampaign ? `Campagne ${activeCampaign.crop_name} (${activeCampaign.year})` : 'Aucune campagne active'}
              icon={<Sprout size={20} />}
              color="info"
            />
            <LocalKpiCard
              label="Alertes critiques ouvertes"
              value={openCriticalAlerts}
              sub="Total exploitation"
              icon={<AlertTriangle size={20} />}
              color="warning"
            />
          </div>
        </section>

        {/* ========== B. PLUS D'INDICATEURS (accordéon, replié par défaut) ========== */}
        <section className="dashboard-section" aria-labelledby="accordion-title" style={{ gridColumn: '1 / -1' }}>
          <SectionHeader
            id="accordion-title"
            title="Indicateurs complémentaires"
            description="Calculés au niveau ferme (Total exploitation), non affectés par le sélecteur de site."
          />
          <Accordion title="Plus d'indicateurs" defaultOpen={false}>
            <div className="dashboard-kpi-grid" style={{ gap: 'var(--space-4)' }}>
              <LocalKpiCard
                label="Avancement chantier"
                value={
                  progressLoading
                    ? 'Chargement…'
                    : progressValue !== null
                    ? `${progressValue}%`
                    : activeProject ? '—' : 'Aucun chantier en cours'
                }
                sub={activeProject ? activeProject.name : 'Aucun chantier en cours'}
                icon={<Target size={20} />}
                color="warning"
              />
              <LocalKpiCard
                label="Taux de mortalité"
                value={
                  mortalityLoading
                    ? 'Chargement…'
                    : mortalityRateValue !== null
                    ? `${mortalityRateValue.toFixed(1)}%`
                    : '—'
                }
                sub="Total exploitation"
                icon={<AlertTriangle size={20} />}
                color="warning"
              />
              <LocalKpiCard
                label="GMQ (kg/jour)"
                value={
                  adgLoading
                    ? 'Chargement…'
                    : adgValue !== null
                    ? `${adgValue.toFixed(2)} kg/j`
                    : '—'
                }
                sub="Total exploitation"
                icon={<TrendingUp size={20} />}
                color="info"
              />
              <LocalKpiCard
                label="Marge par culture"
                value={
                  campaignMarginLoading
                    ? 'Chargement…'
                    : campaignMarginValue !== null
                    ? `${campaignMarginValue.toFixed(0)} XOF`
                    : activeCampaign ? '—' : 'Aucune campagne active'
                }
                sub={activeCampaign ? `Campagne ${activeCampaign.crop_name} (${activeCampaign.year})` : 'Aucune campagne active'}
                icon={<DollarSign size={20} />}
                color="signal"
              />
            </div>
          </Accordion>
        </section>

        {/* ========== C. PRIORITÉS ET ACTIONS ========== */}
        <section className="dashboard-section priorities-dashboard-section" aria-labelledby="priorities-title" style={{ gridColumn: 'span 2' }}>
          <SectionHeader
            id="priorities-title"
            title="À traiter en priorité"
            description="Chaque alerte est déduite des données. L'absence de donnée ne signifie pas « tout va bien »."
          />

          {prioritySourcesPending ? (
            <div className="source-pending-state" role="status" aria-live="polite">
              <div className="dashboard-spinner" aria-hidden="true" />
              <p className="dashboard-empty-message">Évaluation des priorités…</p>
            </div>
          ) : prioritySourcesError ? (
            <div className="source-unavailable-state">
              <AlertCircle className="dashboard-empty-icon" size={32} />
              <h4 className="dashboard-empty-title">Certaines sources de priorité sont indisponibles</h4>
              <p className="dashboard-empty-message">
                Les alertes ne peuvent pas être évaluées fiablement tant que les sources
                dépenses, stocks, projets ou alertes ne sont pas accessibles.
              </p>
            </div>
          ) : hasAnyPriority ? (
            <div className="dashboard-priorities-grid">
              {visiblePriorities.map((p) => (
                <PriorityCard key={p.to} {...p} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CheckCircle2 size={32} />}
              title="Aucune priorité détectée"
              message="Les données actuelles ne révèlent pas d'alerte nécessitant une action immédiate."
            />
          )}
        </section>

        {/* ========== C. LA FERME EN BREF (filtrée par site) ========== */}
        <section className="dashboard-section activities-dashboard-section" aria-labelledby="activities-title" style={{ gridColumn: 'span 2' }}>
          <SectionHeader
            id="activities-title"
            title="La ferme en bref"
            description="Synthèse compacte de l'agriculture, de l'élevage et des projets. Filtrée par le site sélectionné."
          />

          <div className="activities-grid">
            {activities.map((a) => (
              <ActivityCard key={a.title} {...a} />
            ))}
          </div>
        </section>

        {/* ========== D. DERNIÈRES OPÉRATIONS ========== */}
        <section className="dashboard-section operations-dashboard-section" aria-labelledby="operations-title" style={{ gridColumn: '1 / -1' }}>
          <SectionHeader
            id="operations-title"
            title="Dernières opérations"
            description="Les trois dernières transactions. Détails dans Finances."
            action={
              <Link to="/app/finance" className="dashboard-view-all-link">
                Voir les mouvements <ArrowRight size={14} />
              </Link>
            }
          />

          <div className="dashboard-operations-grid">
            {transactionsSourceError ? (
              <div className="source-unavailable-state" style={{ flex: '0 0 280px' }}>
                <AlertCircle className="dashboard-empty-icon" size={32} />
                <h4 className="dashboard-empty-title">La source des transactions est indisponible</h4>
                <p className="dashboard-empty-message">
                  Impossible de charger les dernières opérations. Vérifiez la connectivité
                  ou réessayez plus tard.
                </p>
              </div>
            ) : latestTransactions.length === 0 ? (
              <EmptyState
                icon={<DollarSign size={32} />}
                title="Aucune opération"
                message="Aucune transaction enregistrée pour le moment."
              />
            ) : (
              latestTransactions.slice(0, 3).map((t) => (
                <div key={t.id} className="operation-card">
                  <Link to={`/app/finance?tab=treasury&transaction=${t.id}`} className="dashboard-op-card-inner">
                    <div className="dashboard-op-header">
                      <span className={`dashboard-op-type ${t.direction === 'entree' ? 'dashboard-op-type-income' : 'dashboard-op-type-outcome'}`}>
                        {t.direction === 'entree' ? 'Entrée' : 'Sortie'}
                      </span>
                      <span className="dashboard-op-date">{formatDate(t.transaction_date)}</span>
                    </div>
                    <p className="dashboard-op-label">{t.description || t.reference || 'Opération'}</p>
                    <div className="dashboard-op-footer">
                      <span className={`dashboard-op-amount ${t.direction === 'entree' ? 'dashboard-op-amount-income' : 'dashboard-op-amount-outcome'}`}>
                        {formatCurrency(t.amount)}
                      </span>
                      <ArrowRight size={14} className="text-accent-primary opacity-50" />
                    </div>
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

export default Dashboard;
