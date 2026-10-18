import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardStats, formatFCFA } from '@/hooks/useDashboardStats';
import { RotatingCard } from '@/components/ui/RotatingCard';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import './Dashboard.css';

const COLORS = {
  grass: '#2E7D32',
  earth: '#5C4033',
  sky: '#0277BD',
  harvest: '#F57F17',
  alert: '#C62828',
};

const DASHBOARD_PRODUCTION = [
  { mois: 'Jan', agriculture: 320, elevage: 280 },
  { mois: 'Fév', agriculture: 350, elevage: 300 },
  { mois: 'Mar', agriculture: 410, elevage: 340 },
  { mois: 'Avr', agriculture: 480, elevage: 390 },
  { mois: 'Mai', agriculture: 520, elevage: 420 },
  { mois: 'Jun', agriculture: 580, elevage: 460 },
];

const Dashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const {
    totalAnimals,
    activeCrops,
    netTreasury,
    monthExpenses,
    expenseTrend,
    activeAlerts,
    healthScore,
    currentSeason,
    animalsData,
    expensesData,
    alertsData,
    productionData,
  } = useDashboardStats();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const displayAnimals = animalsData;
  const displayExpenses = expensesData;
  const displayAlerts = alertsData;
  const displayProduction = productionData.length > 0 ? productionData : DASHBOARD_PRODUCTION;

  const flipCard = (
    front: React.ReactNode,
    back: React.ReactNode,
    flipLabel: string,
    backLabel: string,
    className?: string
  ) => (
    <RotatingCard front={front} back={back} flipLabel={flipLabel} backLabel={backLabel} className={className} />
  );

  return (
    <div className="dashboard">
      {/* SECTION 1 — HEADER INTELLIGENT */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="farm-info">
            <h1>Bahkanso Exploitation</h1>
            <div className="datetime">
              <span className="date">{currentTime.toLocaleDateString('fr-CI', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span className="time">{currentTime.toLocaleTimeString('fr-CI', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          <div className="header-stats">
            <div className="season-badge">
              <span>{currentSeason}</span>
            </div>
            <div className={`health-score ${healthScore >= 80 ? 'good' : healthScore >= 60 ? 'warning' : 'critical'}`}>
              <span>Score santé :</span>
              <span>{healthScore}/100</span>
            </div>
            <button className="refresh-btn" onClick={() => window.location.reload()}>
              Actualiser
            </button>
          </div>
        </div>
      </header>

      {/* SECTION 2 — RANG HERO : 5 FLIP CARDS KPI */}
      <section className="hero-cards">
        <div className="cards-grid">
          {/* Card 1 — CHEPTEL TOTAL */}
          {flipCard(
            <div className="card-content" style={{ textAlign: 'center' }}>
              <div className="card-value">{totalAnimals}</div>
              <div className="card-label">Animaux totaux</div>
              <div className="card-badge">+5%</div>
            </div>,
            <div className="card-content">
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem' }}>Répartition par espèce</h3>
              <ul className="species-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {displayAnimals.slice(0, 3).map((animal, index) => (
                  <li key={index} style={{ margin: '6px 0', fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{animal.species || 'N/A'}:</span>
                    <span>{animal.identifier || '—'}</span>
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: '14px' }}>
                <Link to="/app/livestock" className="btn-link">Voir le cheptel →</Link>
              </div>
            </div>,
            'Détails',
            'Retour'
          )}

          {/* Card 2 — CULTURES ACTIVES */}
          {flipCard(
            <div className="card-content" style={{ textAlign: 'center' }}>
              <div className="card-value">{activeCrops}</div>
              <div className="card-label">Parcelles actives</div>
              <div className="card-badge">Prochaine récolte</div>
            </div>,
            <div className="card-content">
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem' }}>Cultures en cours</h3>
              <ul className="crops-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ margin: '6px 0', fontSize: '0.95rem' }}>Maïs - Récolte: 15/12</li>
                <li style={{ margin: '6px 0', fontSize: '0.95rem' }}>Riz - Récolte: 30/11</li>
                <li style={{ margin: '6px 0', fontSize: '0.95rem' }}>Manioc - Récolte: 10/01</li>
              </ul>
              <div style={{ marginTop: '14px' }}>
                <Link to="/app/agriculture/plots" className="btn-link">Voir les parcelles →</Link>
              </div>
            </div>,
            'Détails',
            'Retour'
          )}

          {/* Card 3 — TRÉSORERIE NETTE */}
          {flipCard(
            <div className="card-content" style={{ textAlign: 'center' }}>
              <div className="card-value">{formatFCFA(netTreasury)}</div>
              <div className="card-label">Solde net</div>
              <div className={`card-badge ${expenseTrend >= 0 ? 'badge-up' : 'badge-down'}`}>
                {expenseTrend >= 0 ? `+${expenseTrend}%` : `${expenseTrend}%`}
              </div>
            </div>,
            <div className="card-content">
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem' }}>Mois en cours</h3>
              <div className="finance-details" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="detail-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span>Entrées:</span>
                  <span>{formatFCFA(netTreasury + monthExpenses)}</span>
                </div>
                <div className="detail-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span>Sorties:</span>
                  <span>{formatFCFA(monthExpenses)}</span>
                </div>
                <div className="detail-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span>Variation:</span>
                  <span className={expenseTrend >= 0 ? 'positive' : 'negative'}>
                    {expenseTrend >= 0 ? `+${expenseTrend}%` : `${expenseTrend}%`}
                  </span>
                </div>
              </div>
            </div>,
            'Détails',
            'Retour'
          )}

          {/* Card 4 — DÉPENSES DU MOIS */}
          {flipCard(
            <div className="card-content" style={{ textAlign: 'center' }}>
              <div className="card-value">{formatFCFA(monthExpenses)}</div>
              <div className="card-label">Dépenses mois</div>
              <div className="card-badge">-2%</div>
            </div>,
            <div className="card-content">
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem' }}>Top 3 postes de dépenses</h3>
              <ul className="expenses-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {displayExpenses.slice(0, 3).map((exp, index) => (
                  <li key={index} style={{ margin: '6px 0', fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{exp.category || 'N/A'}</span>
                    <span>{formatFCFA(exp.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>,
            'Détails',
            'Retour'
          )}

          {/* Card 5 — ALERTES ACTIVES */}
          {flipCard(
            <div className="card-content" style={{ textAlign: 'center' }}>
              <div className="card-value">{activeAlerts}</div>
              <div className="card-label">Alertes actives</div>
              {activeAlerts > 0 && <div className="card-badge badge-alert">!</div>}
            </div>,
            <div className="card-content">
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem' }}>Alertes critiques</h3>
              <ul className="alerts-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {displayAlerts.slice(0, 3).map((alert, index) => (
                  <li key={index} className={`alert-item alert-${alert.severity.toLowerCase()}`} style={{ margin: '8px 0', display: 'flex', gap: '10px', alignItems: 'start' }}>
                    <div className="alert-info" style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>{alert.title}</h4>
                      <p className="alert-time" style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>il y a 2h</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>,
            'Détails',
            'Retour'
          )}
        </div>
      </section>

      {/* SECTION 3 — RANG GRAPHIQUES (3 colonnes) */}
      <section className="charts-section">
        <div className="charts-grid">
          {/* Graphique A — Évolution production (large) */}
          <div className="chart-item wide" style={{ gridColumn: 'span 2' }}>
            <h2>Évolution de la production</h2>
            <ResponsiveContainer width="100%" height={350}>
              <RechartsLineChart data={displayProduction}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} `} />
                <Legend />
                <Line type="monotone" dataKey="agriculture" stroke={COLORS.grass} name="Agriculture" />
                <Line type="monotone" dataKey="elevage" stroke={COLORS.earth} name="Élevage" />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>

          {/* Graphique B — Répartition dépenses (étroit) */}
          <div className="chart-item narrow">
            <h2>Répartition des dépenses</h2>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={displayExpenses}
                  dataKey="montant"
                  nameKey="cat"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  labelLine={false}
                  label={({ node }: any) => `${node.data.cat}: ${formatFCFA(node.data.montant)}`}
                >
                  {displayExpenses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={[COLORS.harvest, COLORS.grass, COLORS.sky, COLORS.earth, COLORS.alert][index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* SECTION 4 — RANG CHEPTEL + STOCKS */}
      <section className="livestock-stocks-section">
        <div className="two-panel">
          {/* Panel A — STATUT CHEPTEL */}
          <div className="panel">
            <h2>Statut du cheptel</h2>
            <div className="livestock-table">
              <table>
                <thead>
                  <tr>
                    <th>Espèce</th>
                    <th>Effectif</th>
                    <th>Santé %</th>
                    <th>Tendance</th>
                  </tr>
                </thead>
                <tbody>
                  {displayAnimals.map((animal, index) => (
                    <tr key={index} className={''}>
                      <td>{animal.species}</td>
                      <td>{animal.identifier}</td>
                      <td>—</td>
                      <td>
                        <span className="trend-up">Hausse</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="table-footer">
                <Link to="/app/livestock" className="btn-primary">Gérer le cheptel →</Link>
              </div>
            </div>
          </div>

          {/* Panel B — STOCKS CRITIQUES */}
          <div className="panel">
            <h2>Stocks critiques</h2>
            <div className="stocks-list">
              <div className="stock-item">
                <span>Aliments (kg)</span>
                <div className="stock-progress">
                  <div className="stock-bar" style={{ width: '65%' }}></div>
                </div>
                <span className="stock-quantity">650 kg / 1000 kg</span>
              </div>
              <div className="stock-item">
                <span>Médicaments (unités)</span>
                <div className="stock-progress">
                  <div className="stock-bar" style={{ width: '40%' }}></div>
                </div>
                <span className="stock-quantity">120 unités / 300 unités</span>
              </div>
              <div className="stock-item">
                <span>Équipements en maintenance</span>
                <div className="stock-progress">
                  <div className="stock-bar" style={{ width: '20%' }}></div>
                </div>
                <span className="stock-quantity">4 unités / 20 unités</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — RANG OPÉRATIONNEL */}
      <section className="operational-section">
        <div className="three-widgets">
          {/* Widget A — CALENDRIER SAISONNIER */}
          <div className="widget">
            <h2>Calendrier saisonnier</h2>
            <div className="calendar-month">
              <span>Novembre 2026</span>
            </div>
            <div className="calendar-tasks">
              <div className="task-item">
                <span className="task-type agriculture">Agriculture</span>
                <span className="task-description">Récolte du riz</span>
              </div>
              <div className="task-item">
                <span className="task-type livestock">Élevage</span>
                <span className="task-description">Vaccination bovins</span>
              </div>
              <div className="task-item">
                <span className="task-type finance">Finance</span>
                <span className="task-description">Clôture mensuelle</span>
              </div>
            </div>
          </div>

          {/* Widget B — ALERTES PRIORITAIRES */}
          <div className="widget">
            <h2>Alertes prioritaires</h2>
            <div className="priority-alerts">
              {displayAlerts.map((alert, index) => (
                <div key={index} className={`alert-priority alert-${alert.severity.toLowerCase()}`}>
                  <div className="alert-content">
                    <div className="alert-message">
                      <strong>{alert.title}</strong>
                      <p className="alert-time">il y a {index + 1}h</p>
                    </div>
                  </div>
                  {alert.severity === 'CRITIQUE' && <div className="alert-pulse"></div>}
                </div>
              ))}
            </div>
          </div>

          {/* Widget C — FINANCEMENTS EN COURS */}
          <div className="widget">
            <h2>Financements en cours</h2>
            <div className="fundings-list">
              <div className="funding-item">
                <span>Projet irrigation</span>
                <div className="funding-progress">
                  <div className="funding-bar" style={{ width: '70%' }}></div>
                </div>
                <span>2 500 000 XOF</span>
              </div>
              <div className="funding-item">
                <span>Subvention État</span>
                <div className="funding-progress">
                  <div className="funding-bar" style={{ width: '45%' }}></div>
                </div>
                <span>1 200 000 XOF</span>
              </div>
            </div>
            <Link to="/app/finance?tab=fundings" className="btn-link">Voir tous les financements →</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
