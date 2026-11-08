import React, { ReactNode, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardStats, formatFCFA } from '@/hooks/useDashboardStats';
import { formatCurrency, formatDate } from '@/lib/format';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import {
  TrendingUp, AlertTriangle, Package,
  Beef, Sprout, HardHat, ArrowRight, Clock, CheckCircle2,
  AlertCircle, Info, DollarSign, Lock, FileText, Target
} from 'lucide-react';
import { LIVESTOCK_PATHS } from '@/routes/livestockPaths';

import '@/styles/components.css';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { supabase } from '@/lib/supabase';
import {
  calculateYield,
  calculateProjectProgress,
  calculateGrossMargin,
  calculateCostPerUnit,
  calculateMortalityRate,
  calculateAverageDailyGain,
  calculateCampaignMargin,
} from '@/lib/kpi';

// Activités — couleurs d'icône (mappées aux tokens sémantiques)
const ACTIVITY_COLORS: Record<string, 'signal' | 'warning' | 'info'> = {
  Agriculture: 'signal',
  Élevage: 'warning',
  Projets: 'warning',
};

const isFinanceSensitive = (role: string | null | undefined) =>
  role !== 'administrateur' && role !== 'proprietaire' && role !== 'propriétaire' && role !== 'responsable' && role !== 'responsable agricole' && role !== 'responsable élevage' && role !== 'gestionnaire';

// Composant horloge en direct
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

const KpiCard = ({
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
    <h4 className="dashboard-empty-title">{title}</h4>
    <p className="dashboard-empty-message">{message}</p>
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

export function Dashboard() {
  const { appUser } = useAuth();
  const { media, siteContent, sourceStatus, loadModule } = useData();
  const {
    netTreasury,
    periodNetResult,
    grossMargin,
    periodLabel,
    totalAnimals,
    totalAnimalLots,
    activeCampaigns,
    activeProjects,
    expensesWithoutJustificatif,
    lowStockItems,
    overdueProjects,
    openCriticalAlerts,
    latestTransactions,
    prioritySourcesPending,
    loading,
    error,
    periodResultTrend,
  } = useDashboardStats();

  const showFinance = !isFinanceSensitive(appUser?.role);
  const [helpExpanded, setHelpExpanded] = useState(false);
  const [campaigns, setCampaigns] = useState<{ id: string; year: number; crop_name: string }[]>([]);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [yieldValue, setYieldValue] = useState<number | null>(null);
  const [yieldLoading, setYieldLoading] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState<number | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [farms, setFarms] = useState<{ id: string; name: string }[]>([]);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [grossMarginValue, setGrossMarginValue] = useState<number | null>(null);
  const [costPerUnitValue, setCostPerUnitValue] = useState<number | null>(null);
  const [grossMarginLoading, setGrossMarginLoading] = useState(false);
  const [costPerUnitLoading, setCostPerUnitLoading] = useState(false);
  const [mortalityRateValue, setMortalityRateValue] = useState<number | null>(null);
  const [adgValue, setAdgValue] = useState<number | null>(null);
  const [mortalityLoading, setMortalityLoading] = useState(false);
  const [adgLoading, setAdgLoading] = useState(false);
  const [campaignMarginValue, setCampaignMarginValue] = useState<number | null>(null);
  const [campaignMarginLoading, setCampaignMarginLoading] = useState(false);

  // S'assurer que les sources du module dashboard sont chargées
  useEffect(() => {
    loadModule('dashboard');
  }, [loadModule]);

  // Charger la liste des campagnes pour le sélecteur de rendement
  useEffect(() => {
    let mounted = true;
    const fetchCampaigns = async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, year, crop_name')
        .order('year', { ascending: false });
      if (!error && mounted) setCampaigns(data || []);
    };
    fetchCampaigns();
    return () => { mounted = false; };
  }, []);

  // Calculer le rendement quand la campagne sélectionnée change
  useEffect(() => {
    let mounted = true;
    const computeYield = async () => {
      if (!campaignId) {
        if (mounted) setYieldValue(null);
        return;
      }
      setYieldLoading(true);
      try {
        const value = await calculateYield(campaignId);
        if (mounted) setYieldValue(value);
      } finally {
        if (mounted) setYieldLoading(false);
      }
    };
    computeYield();
    return () => { mounted = false; };
  }, [campaignId]);

  // Charger la liste des chantiers (projets) pour le sélecteur d'avancement
  useEffect(() => {
    let mounted = true;
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name', { ascending: true });
      if (!error && mounted) setProjects(data || []);
    };
    fetchProjects();
    return () => { mounted = false; };
  }, []);

  // Calculer l'avancement quand le chantier sélectionné change
  useEffect(() => {
    let mounted = true;
    const computeProgress = async () => {
      if (!projectId) {
        if (mounted) setProgressValue(null);
        return;
      }
      setProgressLoading(true);
      try {
        const value = await calculateProjectProgress(projectId);
        if (mounted) setProgressValue(value);
      } finally {
        if (mounted) setProgressLoading(false);
      }
    };
    computeProgress();
    return () => { mounted = false; };
  }, [projectId]);

  // Charger la liste des fermes pour le sélecteur des KPIs finance
  useEffect(() => {
    let mounted = true;
    const fetchFarms = async () => {
      const { data, error } = await supabase
        .from('farms')
        .select('id, name')
        .order('name', { ascending: true });
      if (!error && mounted) setFarms(data || []);
    };
    fetchFarms();
    return () => { mounted = false; };
  }, []);

  // Calculer la marge brute et le coût de revient quand la ferme sélectionnée change
  useEffect(() => {
    let mounted = true;
    const computeFinanceKPIs = async () => {
      if (!farmId) {
        if (mounted) {
          setGrossMarginValue(null);
          setCostPerUnitValue(null);
        }
        return;
      }
      setGrossMarginLoading(true);
      setCostPerUnitLoading(true);
      try {
        const [margin, cost] = await Promise.all([
          calculateGrossMargin(farmId),
          calculateCostPerUnit(farmId),
        ]);
        if (mounted) setGrossMarginValue(margin);
        if (mounted) setCostPerUnitValue(cost);
      } finally {
        if (mounted) setGrossMarginLoading(false);
        if (mounted) setCostPerUnitLoading(false);
      }
    };
    computeFinanceKPIs();
    return () => { mounted = false; };
  }, [farmId]);

  // Calculer le taux de mortalite et le GMQ quand la ferme selectionnee change
  useEffect(() => {
    let mounted = true;
    const computeLivestockKPIs = async () => {
      if (!farmId) {
        if (mounted) {
          setMortalityRateValue(null);
          setAdgValue(null);
        }
        return;
      }
      setMortalityLoading(true);
      setAdgLoading(true);
      try {
        const [mortality, adg] = await Promise.all([
          calculateMortalityRate(farmId),
          calculateAverageDailyGain(farmId),
        ]);
        if (mounted) setMortalityRateValue(mortality);
        if (mounted) setAdgValue(adg);
      } finally {
        if (mounted) setMortalityLoading(false);
        if (mounted) setAdgLoading(false);
      }
    };
    computeLivestockKPIs();
    return () => { mounted = false; };
  }, [farmId]);

  // Calculer la marge de campagne quand la campagne selectionnee change
  useEffect(() => {
    let mounted = true;
    const computeCampaignMargin = async () => {
      if (!campaignId) {
        if (mounted) setCampaignMarginValue(null);
        return;
      }
      setCampaignMarginLoading(true);
      try {
        const value = await calculateCampaignMargin(campaignId);
        if (mounted) setCampaignMarginValue(value);
      } finally {
        if (mounted) setCampaignMarginLoading(false);
      }
    };
    computeCampaignMargin();
    return () => { mounted = false; };
  }, [campaignId]);

  // Recherche de l'image de couverture configurée
  // Priorité : siteContent['hero-cover']?.mediaId -> premier media de type 'image' avec catégorie 'cover' -> premier media de type 'image'
  const getHeroImageUrl = (): string | null => {
    // 1. Vérifier siteContent pour une clé de configuration
    const heroCoverContent = siteContent['hero-cover']?.value as { mediaId?: string } | undefined;
    if (heroCoverContent?.mediaId) {
      const mediaItem = media.find(m => m.id === heroCoverContent.mediaId);
      if (mediaItem?.url) return mediaItem.url;
    }
    // 2. Chercher un média avec catégorie 'cover' ou 'hero'
    const coverMedia = media.find(m => m.type === 'image' && (m.category === 'cover' || m.category === 'hero'));
    if (coverMedia?.url) return coverMedia.url;
    // 3. Premier média de type image
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

  // Vérifier la disponibilité des sources pour les priorités (sourceStatus et sourceError déjà déclarés en haut)
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

  // Activités de la ferme
  const activities = [
    {
      title: 'Agriculture',
      value: activeCampaigns,
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
        { label: 'Lots', count: totalAnimalLots },
        { label: 'Animaux', count: totalAnimals },
      ],
    },
    {
      title: 'Projets',
      value: activeProjects,
      detail: 'Chantiers en cours',
      icon: <HardHat size={24} />,
      color: ACTIVITY_COLORS.Projets,
      to: '/app/projects',
      toLabel: 'Voir les projets',
    },
  ];

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
            <h2 className="hero-title">{typeof siteContent['farm-name']?.value === 'string' ? siteContent['farm-name']!.value : 'Exploitation BAHKANSO'}</h2>
            <p className="hero-subtitle">
              {typeof siteContent['farm-tagline']?.value === 'string' ? siteContent['farm-tagline']!.value : 'Synthèse opérationnelle — données temps réel'}
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

      <div className="dashboard-grid">

        {/* ========== A. SYNTHÈSE FINANCIÈRE ========== */}
        <section className="dashboard-section finance-dashboard-section" aria-labelledby="finance-title">
          <SectionHeader
            id="finance-title"
            title="Synthèse financière"
            description={`Période : ${periodLabel}. Un solde est un état à un instant ; un flux se mesure sur une période.`}
            action={showFinance ? (
              <button
                className="help-btn"
                aria-expanded={helpExpanded}
                aria-controls="dashboard-finance-help"
                id="finance-help-btn"
                onClick={() => setHelpExpanded((prev) => !prev)}
              >
                Comprendre les chiffres
              </button>
            ) : null}
          />

          <div className="dashboard-kpi-grid">
            {showFinance ? (
              <>
                <KpiCard
                  label="Flux net enregistré"
                  value={formatFCFA(netTreasury)}
                  sub="Entrées − sorties connues"
                  icon={<DollarSign size={20} />}
                  color="signal"
                />
                <KpiCard
                  label="Résultat net"
                  value={formatFCFA(periodNetResult)}
                  trend={{ value: `${periodResultTrend?.toFixed(1) || '0'}%`, positive: (periodResultTrend ?? 0) >= 0 }}
                  sub="Entrées − sorties de la période"
                  icon={<TrendingUp size={20} />}
                  color="signal"
                />
                <KpiCard
                  label="Marge brute"
                  value={`${grossMargin.toFixed(1)}%`}
                  sub="(Entrées − sorties) / entrées"
                  icon={<DollarSign size={20} />}
                  color="info"
                />
              </>
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
          </div>

          {showFinance && helpExpanded && (
            <div id="dashboard-finance-help" className="finance-help" role="region" aria-labelledby="finance-help-btn">
              <Info size={16} />
              <div>
                <p>Ces indicateurs présentent les entrées et sorties enregistrées, sans distinction entre financements, recettes commerciales et transferts internes.</p>
                <p>Le flux net présenté ne tient pas compte d'un solde initial et ne constitue pas un rapprochement bancaire.</p>
              </div>
            </div>
          )}
        </section>

        {/* ========== B. RENDEMENT DE CAMPAGNE ========== */}
        <section className="dashboard-section yield-dashboard-section" aria-labelledby="yield-title">
          <SectionHeader
            id="yield-title"
            title="Rendement de campagne"
            description="Somme des quantités récoltées divisée par la surface de la parcelle (kg/ha)."
          />
          <div className="dashboard-yield-selector">
            <label htmlFor="yield-campaign-select">Campagne</label>
            <select
              id="yield-campaign-select"
              value={campaignId ?? ''}
              onChange={(e) => setCampaignId(e.target.value || null)}
              className="dashboard-select"
              disabled={yieldLoading}
            >
              <option value="">Sélectionner une campagne</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.crop_name} ({c.year})
                </option>
              ))}
            </select>
          </div>
          <div className="dashboard-kpi-grid">
            <KpiCard
              label="Rendement (kg/ha)"
              value={yieldLoading ? 'Chargement…' : yieldValue !== null ? `${yieldValue.toFixed(0)} kg/ha` : '—'}
              sub={campaignId ? 'Quantité récoltée ÷ surface de la parcelle' : 'Sélectionnez une campagne'}
              icon={<Sprout size={20} />}
              color="info"
            />
          </div>
        </section>

        {/* ========== BIS. AVANCEMENT DU CHANTIER ========== */}
        <section className="dashboard-section progress-dashboard-section" aria-labelledby="progress-title">
          <SectionHeader
            id="progress-title"
            title="Avancement du chantier"
            description="Part des étapes terminées par rapport au nombre total d'étapes du chantier."
          />
          <div className="dashboard-yield-selector">
            <label htmlFor="progress-project-select">Chantier</label>
            <select
              id="progress-project-select"
              value={projectId ?? ''}
              onChange={(e) => setProjectId(e.target.value || null)}
              className="dashboard-select"
              disabled={progressLoading}
            >
              <option value="">Sélectionner un chantier</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="dashboard-kpi-grid">
            <KpiCard
              label="Avancement"
              value={
                progressLoading
                  ? 'Chargement…'
                  : progressValue !== null
                  ? `${progressValue}%`
                  : '—'
              }
              sub={projectId ? 'Étapes terminées / total des étapes' : 'Sélectionnez un chantier'}
              icon={<Target size={20} />}
              color="warning"
            />
          </div>
        </section>

        {/* ========== BIS2. KPIS FINANCE ========== */}
        <section className="dashboard-section finance-kpis-dashboard-section" aria-labelledby="finance-kpis-title">
          <SectionHeader
            id="finance-kpis-title"
            title="Indicateurs financiers"
            description="Marge brute et coût de revient calculés à partir du journal d'événements de la ferme."
          />
          <div className="dashboard-yield-selector">
            <label htmlFor="finance-farm-select">Ferme</label>
            <select
              id="finance-farm-select"
              value={farmId ?? ''}
              onChange={(e) => setFarmId(e.target.value || null)}
              className="dashboard-select"
              disabled={grossMarginLoading || costPerUnitLoading}
            >
              <option value="">Sélectionner une ferme</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="dashboard-kpi-grid">
            <KpiCard
              label="Marge brute"
              value={
                grossMarginLoading
                  ? 'Chargement…'
                  : grossMarginValue !== null
                  ? `${grossMarginValue.toFixed(0)} XOF`
                  : '—'
              }
              sub={farmId ? 'Recettes − dépenses (journal)' : 'Sélectionnez une ferme'}
              icon={<DollarSign size={20} />}
              color="signal"
            />
            <KpiCard
              label="Coût de revient unitaire"
              value={
                costPerUnitLoading
                  ? 'Chargement…'
                  : costPerUnitValue !== null
                  ? `${costPerUnitValue.toFixed(0)} XOF/unité`
                  : '—'
              }
              sub={farmId ? 'Dépenses ÷ quantité produite (campagne)' : 'Sélectionnez une ferme'}
              icon={<Beef size={20} />}
              color="info"
            />
          </div>
        </section>

        {/* ========== BIS3. KPIS ÉLEVAGE ========== */}
        <section className="dashboard-section livestock-kpis-dashboard-section" aria-labelledby="livestock-kpis-title">
          <SectionHeader
            id="livestock-kpis-title"
            title="Indicateurs d'élevage"
            description="Taux de mortalité, gain moyen quotidien (GMQ) et marge de campagne calculés à partir du journal d'événements de la ferme."
          />
          <div className="dashboard-yield-selector">
            <label htmlFor="livestock-farm-select">Ferme</label>
            <select
              id="livestock-farm-select"
              value={farmId ?? ''}
              onChange={(e) => setFarmId(e.target.value || null)}
              className="dashboard-select"
              disabled={mortalityLoading || adgLoading}
            >
              <option value="">Sélectionner une ferme</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="dashboard-kpi-grid">
            <KpiCard
              label="Taux de mortalité"
              value={
                mortalityLoading
                  ? 'Chargement…'
                  : mortalityRateValue !== null
                  ? `${mortalityRateValue.toFixed(1)}%`
                  : '—'
              }
              sub={farmId ? 'Morts / (naissances + morts)' : 'Sélectionnez une ferme'}
              icon={<AlertTriangle size={20} />}
              color="warning"
            />
            <KpiCard
              label="GMQ (kg/jour)"
              value={
                adgLoading
                  ? 'Chargement…'
                  : adgValue !== null
                  ? `${adgValue.toFixed(2)} kg/j`
                  : '—'
              }
              sub={farmId ? 'Poids ÷ jours depuis la naissance' : 'Sélectionnez une ferme'}
              icon={<TrendingUp size={20} />}
              color="info"
            />
          </div>
        </section>

        {/* ========== BIS4. MARGE DE CAMPAGNE ========== */}
        <section className="dashboard-section campaign-margin-dashboard-section" aria-labelledby="campaign-margin-title">
          <SectionHeader
            id="campaign-margin-title"
            title="Marge de campagne"
            description="Recettes de récoltes moins dépenses d'opérations culturales pour la campagne sélectionnée."
          />
          <div className="dashboard-yield-selector">
            <label htmlFor="campaign-margin-select">Campagne</label>
            <select
              id="campaign-margin-select"
              value={campaignId ?? ''}
              onChange={(e) => setCampaignId(e.target.value || null)}
              className="dashboard-select"
              disabled={campaignMarginLoading}
            >
              <option value="">Sélectionner une campagne</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.crop_name} ({c.year})
                </option>
              ))}
            </select>
          </div>
          <div className="dashboard-kpi-grid">
            <KpiCard
              label="Marge de campagne"
              value={
                campaignMarginLoading
                  ? 'Chargement…'
                  : campaignMarginValue !== null
                  ? `${campaignMarginValue.toFixed(0)} XOF`
                  : '—'
              }
              sub={campaignId ? 'Recettes de récoltes − dépenses culturales' : 'Sélectionnez une campagne'}
              icon={<DollarSign size={20} />}
              color="signal"
            />
          </div>
        </section>

        {/* ========== C. PRIORITÉS ET ACTIONS ========== */}
        <section className="dashboard-section priorities-dashboard-section" aria-labelledby="priorities-title">
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

        {/* ========== C. LA FERME EN BREF ========== */}
        <section className="dashboard-section activities-dashboard-section" aria-labelledby="activities-title">
          <SectionHeader
            id="activities-title"
            title="La ferme en bref"
            description="Synthèse compacte de l'agriculture, de l'élevage et des projets."
          />

          <div className="activities-grid">
            {activities.map((a) => (
              <ActivityCard key={a.title} {...a} />
            ))}
          </div>
        </section>

        {/* ========== D. DERNIÈRES OPÉRATIONS ========== */}
        <section className="dashboard-section operations-dashboard-section" aria-labelledby="operations-title">
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
