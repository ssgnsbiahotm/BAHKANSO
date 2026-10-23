import React, { ReactNode, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardStats, formatFCFA } from '@/hooks/useDashboardStats';
import { formatCurrency, formatDate } from '@/lib/format';
import { useAuth } from '@/lib/AuthContext';
import type { Transaction } from '@/lib/types';
import {
  Wallet, TrendingUp, TrendingDown, AlertTriangle, Package,
  Beef, Sprout, HardHat, ArrowRight, Clock, CheckCircle2,
  AlertCircle, Info, DollarSign, Lock, FileText, RotateCw, RotateCcw
} from 'lucide-react';

import { RotatingCard } from '@/components/ui/RotatingCard';

import './Dashboard.css';

const COLORS = {
  grass: '#2E7D32',
  earth: '#5C4033',
  sky: '#0277BD',
  harvest: '#F57F17',
  alert: '#C62828',
  slate: '#64748B',
};

const isFinanceSensitive = (role: string | null | undefined) =>
  role !== 'administrateur' && role !== 'proprietaire' && role !== 'propriétaire' && role !== 'responsable' && role !== 'responsable agricole' && role !== 'responsable élevage' && role !== 'gestionnaire';

const periodLabel = (bounds: { start: Date; end: Date; label: string }) => bounds.label;

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
  <div className="kpi-card" style={{ borderLeftColor: color }}>
    <div className="kpi-header">
      <div className="kpi-icon" style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>
      {trend && (
        <span className={`kpi-trend ${trend.positive ? 'positive' : 'negative'}`}>
          {trend.value}
        </span>
      )}
    </div>
    <div className="kpi-body">
      <p className="kpi-label">{label}</p>
      <div className="kpi-value" style={{ color }}>
        {value}
        {sub && <span className="kpi-sub">{sub}</span>}
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
  <Link to={to} className={`priority-card ${severe ? 'severe' : ''}`}>
    <div className="priority-icon" style={{ backgroundColor: severe ? '#FEE2E2' : '#F1F5F9', color: severe ? COLORS.alert : COLORS.slate }}>
      {icon}
    </div>
    <div className="priority-content">
      <p className="priority-reason" style={{ color: severe ? COLORS.alert : COLORS.slate }}>{reason}</p>
      <div className="priority-meta">
        <span className="priority-count" style={{ color: severe ? COLORS.alert : COLORS.grass }}>{count}</span>
        <span className="priority-label">{label}</span>
      </div>
    </div>
    <ArrowRight size={18} className="priority-arrow" style={{ color: severe ? COLORS.alert : COLORS.grass }} />
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
  <Link to={to} className="activity-card">
    <div className="activity-icon" style={{ backgroundColor: `${color}15`, color }}>
      {icon}
    </div>
    <div className="activity-body">
      <h3 className="activity-title">{title}</h3>
      <p className="activity-detail">{detail}</p>
      <div className="activity-stats">
        {subValues ? (
          subValues.map((sv) => (
            <span key={sv.label} className="stat-item">
              <span className="stat-count">{sv.count}</span>
              <span className="stat-label">{sv.label}</span>
            </span>
          ))
        ) : value !== null && (
          <span className="stat-item single">
            <span className="stat-count">{value}</span>
            <span className="stat-label">{detail}</span>
          </span>
        )}
      </div>
    </div>
    <div className="activity-cta">
      <span>{toLabel}</span>
      <ArrowRight size={16} />
    </div>
  </Link>
);

const OpCardFront = ({ transaction }: { transaction: Transaction }) => {
  const opLabel = transaction.description || transaction.reference || 'Opération';
  const isIncome = transaction.direction === 'entree';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', paddingBottom: '3rem' }}>
      <div className="flex items-center justify-between">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${isIncome ? 'text-green-700 bg-green-50' : 'text-amber-700 bg-amber-50'}`}>
          {isIncome ? 'Entrée' : 'Sortie'}
        </span>
        <span className="text-xs font-medium">{formatDate(transaction.transaction_date)}</span>
      </div>
      <p className="text-sm font-medium">{opLabel}</p>
      <div className="mt-auto text-right font-bold" style={{ color: isIncome ? '#166534' : '#92400E' }}>
        {formatCurrency(transaction.amount)}
      </div>
    </div>
  );
};

const OpCardBack = ({ transaction }: { transaction: Transaction }) => {
  const opLabel = transaction.description || transaction.reference || 'Opération';
  const isIncome = transaction.direction === 'entree';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', paddingBottom: '3rem' }}>
      <div className="flex items-center justify-between">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${isIncome ? 'text-green-700 bg-green-50' : 'text-amber-700 bg-amber-50'}`}>
          {isIncome ? 'Entrée' : 'Sortie'}
        </span>
        <span className="text-xs font-medium">{formatDate(transaction.transaction_date)}</span>
      </div>
      <p className="text-sm font-medium">{opLabel}</p>
      <div className="mt-auto text-right font-bold" style={{ color: isIncome ? '#166534' : '#92400E' }}>
        {formatCurrency(transaction.amount)}
      </div>
    </div>
  );
};

const EmptyState = ({ icon, title, message, action }: {
  icon: ReactNode;
  title: string;
  message: string;
  action?: React.ReactNode;
}) => (
  <div className="empty-state">
    <div className="empty-icon" style={{ color: '#CBD5E1' }}>
      {icon}
    </div>
    <h4 className="empty-title">{title}</h4>
    <p className="empty-message">{message}</p>
    {action}
  </div>
);

const SectionHeader = ({ title, description, action }: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) => (
  <div className="section-header">
    <div>
      <h2 className="section-title">{title}</h2>
      {description && <p className="section-description">{description}</p>}
    </div>
    {action}
  </div>
);

export function Dashboard() {
  const { appUser } = useAuth();
  const {
    netTreasury,
    periodIncome,
    periodExpenses,
    periodBounds,
    totalAnimals,
    totalAnimalLots,
    activeCampaigns,
    activeProjects,
    expensesWithoutJustificatif,
    lowStockItems,
    overdueProjects,
    openCriticalAlerts,
    movementData,
    latestTransactions,
    hasData,
    loading,
    error,
  , sourceStatus, } = useDashboardStats();

  const showFinance = !isFinanceSensitive(appUser?.role);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Chargement du tableau de bord…</p>
      </div>
    );
  }

  if (error && !hasData) {
          {sourceStatus.transactions === "error" ? (
            <EmptyState
              icon={<AlertCircle size={32} />}
              title="La source des transactions est indisponible"
              message="Veuillez vérifier la connectivité Supabase ou contacter le support."
            />
          ) : latestTransactions.length === 0 ? (
            <EmptyState
              icon={<DollarSign size={32} />}
              title="Aucune opération"
              message="Aucune transaction enregistrée pour le moment."
            />
          ) : (
            latestTransactions.slice(0, 3).map((t) => (
              <div key={t.id} style={{ flex: "0 0 280px" }}>
                <RotatingCard
                  flipLabel={`Détail — ${t.description || t.reference || "Opération"}`}
                  backLabel="Retour"
                  front={<OpCardFront transaction={t} />}
                  back={<OpCardBack transaction={t} />}
                />
              </div>
            ))
          )}


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
      to: '/app/livestock/animals',
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
    <div className="dashboard">
      {/* ========== HEADER ========== */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Tableau de bord</h1>
          <p className="header-subtitle">Pilotage de l'exploitation : synthèse, priorités et activités.</p>
        </div>
        <div className="header-right">
          <LiveClock />
        </div>
      </header>

      {/* Erreur partielle */}
      {error && !loading && (
        <div className="partial-error">
          <Info size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="dashboard-grid">

        {/* ========== A. SYNTHÈSE FINANCIÈRE ========== */}
        <section className="section finance-section" aria-labelledby="finance-title">
          <SectionHeader
            title="Synthèse financière"
            description="Un solde est un état à un instant ; un flux se mesure sur une période."
            action={showFinance ? (
              <button className="help-btn" aria-expanded="false">
                Comprendre les chiffres
              </button>
            ) : null}
          />

          <div className="kpi-grid">
            {showFinance ? (
              <>
                <KpiCard
                  label="Solde des mouvements"
                  value={formatFCFA(netTreasury)}
                  sub="Toutes périodes confondues"
                  color={netTreasury >= 0 ? COLORS.grass : COLORS.alert}
                  icon={<Wallet size={20} />}
                  trend={treasuryTrend}
                />
                <KpiCard
                  label={`Entrées — ${periodLabel(periodBounds)}`}
                  value={formatFCFA(periodIncome)}
                  sub="Mouvements de la période"
                  color={COLORS.grass}
                  icon={<TrendingUp size={20} />}
                  trend={incomeTrend}
                />
                <KpiCard
                  label={`Sorties — ${periodLabel(periodBounds)}`}
                  value={formatFCFA(periodExpenses)}
                  sub="Mouvements de la période"
                  color={COLORS.earth}
                  icon={<TrendingDown size={20} />}
                  trend={expenseTrend}
                />
              </>
            ) : (
              <div className="kpi-card restricted" style={{ gridColumn: '1 / -1' }}>
                <div className="kpi-header">
                  <div className="kpi-icon" style={{ backgroundColor: '#F1F5F9', color: COLORS.slate }}>
                    <Lock size={20} />
                  </div>
                </div>
                <div className="kpi-body">
                  <p className="kpi-label">Données financières</p>
                  <div className="kpi-value" style={{ color: COLORS.slate }}>Accès réservé</div>
                  <p className="kpi-sub">Réservé aux rôles admin, responsable et gestionnaire</p>
                </div>
              </div>
            )}
          </div>

          {showFinance && (
            <div className="finance-help">
              <Info size={16} />
              <div>
                <p>Ces indicateurs présentent les entrées et sorties enregistrées, sans distinction entre financements, recettes commerciales et transferts internes.</p>
                <p>Le solde affiché n'intègre pas de solde initial et ne constitue pas un rapprochement bancaire.</p>
              </div>
            </div>
          )}
        </section>

        {/* ========== B. PRIORITÉS ET ACTIONS ========== */}
        <section className="section priorities-section" aria-labelledby="priorities-title">
          <SectionHeader
            title="À traiter en priorité"
            description="Chaque alerte est déduite des données. L'absence de donnée ne signifie pas « tout va bien »."
          />

          {hasAnyPriority ? (
            <div className="priorities-grid">
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
        <section className="section activities-section" aria-labelledby="activities-title">
          <SectionHeader
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
        <section className="section operations-section" aria-labelledby="operations-title">
          <SectionHeader
            title="Dernières opérations"
            description="Les trois dernières transactions. Détails dans Finances."
            action={
              <Link to="/app/finance" className="view-all-link">
                Voir les mouvements <ArrowRight size={14} />
              </Link>
            }
          />

          <div className="operations-grid" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {latestTransactions.length === 0 ? (
              <EmptyState
                icon={<DollarSign size={32} />}
                title="Aucune opération"
                message="Aucune transaction enregistrée pour le moment."
              />
            ) : (
              latestTransactions.slice(0, 3).map((t) => (
                <div key={t.id} style={{ flex: '0 0 280px' }}>
                  <RotatingCard
                    flipLabel={`Détail — ${t.description || t.reference || 'Opération'}`}
                    backLabel="Retour"
                    front={<OpCardFront transaction={t} />}
                    back={<OpCardBack transaction={t} />}
                  />
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