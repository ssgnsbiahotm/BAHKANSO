import React, { ReactNode, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardStats, formatFCFA } from '@/hooks/useDashboardStats';
import { formatCurrency, formatDate } from '@/lib/format';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import {
  TrendingUp, AlertTriangle, Package,
  Beef, Sprout, HardHat, ArrowRight, Clock, CheckCircle2,
  AlertCircle, Info, DollarSign, Lock, FileText
} from 'lucide-react';
import { LIVESTOCK_PATHS } from '@/routes/livestockPaths';

import '@/styles/components.css';

const COLORS = {
  grass: 'var(--accent-primary)',
  earth: 'var(--warning)',
  sky: 'var(--info)',
  harvest: 'var(--warning)',
  alert: 'var(--danger)',
  slate: 'var(--text-muted)',
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
  color?: string;
  icon: ReactNode;
  trend?: { value: string; positive: boolean };
}) => (
  <div className="dashboard-kpi-card" style={{ borderLeftColor: color }}>
    <div className="dashboard-kpi-header">
      <div className="dashboard-kpi-icon" style={{ backgroundColor: `${color}15`, color }}>
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
      <div className="dashboard-kpi-value" style={{ color }}>
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
  color: string;
  to: string;
  toLabel: string;
  subValues?: { label: string; count: number }[];
}) => (
  <Link to={to} className="dashboard-activity-card">
    <div className="dashboard-activity-icon" style={{ backgroundColor: `${color}15`, color }}>
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
  const { media, siteContent, sourceStatus } = useData();
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
      color: COLORS.grass,
      to: '/app/agriculture/campaigns',
      toLabel: 'Voir les campagnes',
    },
    {
      title: 'Élevage',
      value: null,
      detail: 'Registre du cheptel',
      icon: <Beef size={24} />,
      color: COLORS.earth,
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
      color: COLORS.harvest,
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
          <img src={heroImageUrl} alt="" loading="eager" decoding="async" />
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
                  color="#B9D86B"
                />
                <KpiCard
                  label="Résultat net"
                  value={formatFCFA(periodNetResult)}
                  trend={{ value: `${periodResultTrend?.toFixed(1) || '0'}%`, positive: (periodResultTrend ?? 0) >= 0 }}
                  sub="Entrées − sorties de la période"
                  icon={<TrendingUp size={20} />}
                  color="#B9D86B"
                />
                <KpiCard
                  label="Marge brute"
                  value={`${grossMargin.toFixed(1)}%`}
                  sub="(Entrées − sorties) / entrées"
                  icon={<DollarSign size={20} />}
                  color="#8FD3F4"
                />
              </>
            ) : (
              <div className="dashboard-kpi-card restricted" style={{ gridColumn: '1 / -1' }}>
                <div className="dashboard-kpi-header">
                  <div className="dashboard-kpi-icon" style={{ backgroundColor: 'rgba(100, 116, 139, 0.15)', color: '#64748B' }}>
                    <Lock size={20} />
                  </div>
                </div>
                <div className="dashboard-kpi-body">
                  <p className="dashboard-kpi-label">Données financières</p>
                  <div className="dashboard-kpi-value" style={{ color: '#64748B' }}>Accès réservé</div>
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

        {/* ========== B. PRIORITÉS ET ACTIONS ========== */}
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
                  <Link to={`/app/finance/transactions/${t.id}`} className="dashboard-op-card-inner">
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
                      <ArrowRight size={14} style={{ color: 'var(--dn-accent)', opacity: 0.5 }} />
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