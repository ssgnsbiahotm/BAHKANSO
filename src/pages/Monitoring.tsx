/**
 * Monitoring.tsx — Module unifié : Audit, Alertes et Rapports
 *
 * Fusionne trois modules en un seul écran cohérent et utilisable :
 *  - Audit        : Journal d'activité immuable (qui, quoi, quand)
 *  - Alertes      : Centre de gestion des alertes et anomalies
 *  - Rapports     : Génération de rapports et exports CSV/PDF
 *
 * Design :
 *  - Navigation latérale interne (3 sous-sections)
 *  - Tableau de bord KPI unifié avec métriques agrégées
 *  - Styles cohérents entre les trois sous-sections
 *  - Toutes les fonctionnalités originales préservées
 */

import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ScrollText, Bell, FileBarChart, Search, AlertTriangle,
  CheckCircle, ChevronLeft, Download, Layout, List, FileText,
} from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/types';
import { useToast } from '@/lib/Toast';
import {
  formatDateTime, formatCurrency, formatDate, timeAgo,
} from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { SimpleBadge } from '@/components/ui/Badge';
import type { Alert, AuditLog } from '@/lib/types';

/* ============================================================================
   SOUS-SECTIONS
   ============================================================================ */

type MonitoringTab = 'audit' | 'alertes' | 'rapports';

const TABS: { id: MonitoringTab; label: string; icon: React.ReactNode }[] = [
  { id: 'audit', label: 'Audit', icon: <ScrollText size={18} /> },
  { id: 'alertes', label: 'Alertes', icon: <Bell size={18} /> },
  { id: 'rapports', label: 'Rapports', icon: <FileBarChart size={18} /> },
];

const tabColor = (id: MonitoringTab) =>
  id === 'audit' ? 'text-slate-700 bg-slate-50 border-slate-200'
  : id === 'alertes' ? 'text-amber-700 bg-amber-50 border-amber-200'
  : 'text-blue-700 bg-blue-50 border-blue-200';

/* ============================================================================
   AUDIT — COLORS ET HELPERS
   ============================================================================ */

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'green',
  UPDATE: 'blue',
  VALIDATE: 'green',
  REJECT: 'red',
  CANCEL: 'amber',
  DELETE_ATTEMPT: 'red',
  ATTACH_DOCUMENT: 'blue',
  LOGIN: 'gray',
  LOGOUT: 'gray',
};

/* ============================================================================
   COMPOSANT PRINCIPAL
   ============================================================================ */

export function Monitoring() {
  const { auditLogs, alerts, fundings, expenses, projects, harvests, animalLots, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // --- Onglet actif ---
  const [activeTab, setActiveTab] = useState<MonitoringTab>('audit');

  // Détecter l'onglet depuis l'URL (paramètres de requête : ?audit, ?alertes, ?rapports)
  useMemo(() => {
    const search = location.search;
    if (search.includes('audit')) setActiveTab('audit');
    else if (search.includes('alertes')) setActiveTab('alertes');
    else if (search.includes('rapports')) setActiveTab('rapports');
  }, [location.search]);

  // =========================================================================
  // KPI AGRÉGÉS (tous domaines confondus)
  // =========================================================================
  const kpis = useMemo(() => {
    const openAlerts = alerts.filter(a => a.status === 'ouverte').length;
    const highAlerts = alerts.filter(a => a.severity === 'high' && a.status === 'ouverte').length;
    const totalEvents = auditLogs.length;
    const today = new Date().toISOString().slice(0, 10);
    const todayEvents = auditLogs.filter(l => l.created_at?.startsWith(today)).length;

    const totalFunded = fundings.filter(f => f.status === 'reçu').reduce((s, f) => s + (f.amount_received || 0), 0);
    const totalSpent = expenses.filter(e => e.status === 'validée').reduce((s, e) => s + e.amount, 0);

    return {
      openAlerts,
      highAlerts,
      totalEvents,
      todayEvents,
      totalFunded,
      totalSpent,
      balance: totalFunded - totalSpent,
    };
  }, [auditLogs, alerts, fundings, expenses]);

  // =========================================================================
  // SOUS-SECTION : AUDIT
  // =========================================================================
  const [filterUser, setFilterUser] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [searchAudit, setSearchAudit] = useState('');

  const auditUsers = useMemo(() => {
    const set = new Set(auditLogs.map(l => l.user_name).filter(Boolean));
    return Array.from(set);
  }, [auditLogs]);

  const auditActions = useMemo(() => {
    const set = new Set(auditLogs.map(l => l.action));
    return Array.from(set);
  }, [auditLogs]);

  const filteredAudit = useMemo(() => {
    return auditLogs.filter(l => {
      if (filterUser !== 'all' && l.user_name !== filterUser) return false;
      if (filterAction !== 'all' && l.action !== filterAction) return false;
      if (searchAudit && !`${l.description} ${l.object_type} ${l.object_id}`.toLowerCase().includes(searchAudit.toLowerCase())) return false;
      return true;
    });
  }, [auditLogs, filterUser, filterAction, searchAudit]);

  const auditKpis = useMemo(() => ({
    total: auditLogs.length,
    creates: auditLogs.filter(l => l.action === 'CREATE').length,
    validates: auditLogs.filter(l => l.action === 'VALIDATE').length,
    rejects: auditLogs.filter(l => l.action === 'REJECT' || l.action === 'CANCEL').length,
  }), [auditLogs]);

  // =========================================================================
  // SOUS-SECTION : ALERTES
  // =========================================================================
  const alertKpis = useMemo(() => {
    const open = alerts.filter(a => a.status === 'ouverte').length;
    const high = alerts.filter(a => a.severity === 'high' && a.status === 'ouverte').length;
    const medium = alerts.filter(a => a.severity === 'medium' && a.status === 'ouverte').length;
    const resolved = alerts.filter(a => a.status === 'résolue').length;
    return { open, high, medium, resolved };
  }, [alerts]);

  const resolveAlert = async (alertItem: Alert) => {
    if (!appUser) return;
    const { error } = await supabase.from('alerts').update({ status: 'résolue', resolved_at: new Date().toISOString() }).eq('id', alertItem.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser.name || 'Système', 'UPDATE', 'alert', alertItem.id, `Alerte résolue: ${alertItem.title}`);
      toast.show('Alerte résolue');
      refresh();
    }
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    Stocks: <AlertTriangle size={18} />,
    Justificatifs: <Bell size={18} />,
    Chantiers: <AlertTriangle size={18} />,
    Finance: <Bell size={18} />,
  };

  // =========================================================================
  // SOUS-SECTION : RAPPORTS
  // =========================================================================
  const [selectedReport, setSelectedReport] = useState('financial');

  const reportList = [
    { id: 'financial', label: 'Rapport financier', icon: <FileBarChart size={20} />, color: 'bg-blue-50 text-blue-600' },
    { id: 'agricultural', label: 'Rapport agricole', icon: <FileText size={20} />, color: 'bg-green-50 text-green-600' },
    { id: 'livestock', label: 'Rapport élevage', icon: <FileText size={20} />, color: 'bg-amber-50 text-amber-600' },
    { id: 'investment', label: 'Rapport investissements', icon: <FileText size={20} />, color: 'bg-purple-50 text-purple-600' },
    { id: 'funder', label: 'Rapport financeur', icon: <FileText size={20} />, color: 'bg-cyan-50 text-cyan-600' },
  ];

  const financialData = () => {
    const totalFunded = fundings.filter(f => f.status === 'reçu').reduce((s, f) => s + (f.amount_received || 0), 0);
    const totalSpent = expenses.filter(e => e.status === 'validée').reduce((s, e) => s + e.amount, 0);
    const byCategory: Record<string, number> = {};
    expenses.filter(e => e.status === 'validée').forEach(e => {
      byCategory[e.category || 'Autre'] = (byCategory[e.category || 'Autre'] || 0) + e.amount;
    });
    return { totalFunded, totalSpent, byCategory };
  };

  const fin = financialData();

  const buildCsv = (): string => {
    const rows: string[] = [];
    rows.push('Type,Reference,Date,Montant,Devise,Statut,Categorie,Description');

    if (selectedReport === 'financial') {
      expenses.forEach(e => {
        rows.push([
          'Dépense', e.reference, e.date, String(e.amount), e.currency || 'FCFA',
          e.status, e.category || '', (e.description || '').replace(/,/g, ';'),
        ].join(','));
      });
    } else if (selectedReport === 'investment') {
      projects.forEach(p => {
        rows.push([
          'Projet', p.name, '', String(p.revised_budget || p.initial_budget),
          'FCFA', p.status, '', (p.description || '').replace(/,/g, ';'),
        ].join(','));
      });
    } else if (selectedReport === 'funder') {
      fundings.forEach(f => {
        rows.push([
          'Financement', f.reference, f.date_sent, String(f.amount_received || f.amount_sent),
          f.currency_sent || 'FCFA', f.status, f.funder?.name || '', (f.comment || '').replace(/,/g, ';'),
        ].join(','));
      });
    } else if (selectedReport === 'agricultural') {
      harvests.forEach(h => {
        rows.push([
          'Récolte', String(h.id), h.date, String(h.quantity), h.unit,
          h.quality || '', h.destination || '',
        ].join(','));
      });
    } else if (selectedReport === 'livestock') {
      animalLots.forEach(l => {
        rows.push([
          'Lot', String(l.id), '', String(l.estimated_value), 'FCFA', '', l.species || '', (l.location || '').replace(/,/g, ';'),
        ].join(','));
      });
    }

    return rows.join('\n');
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const csv = buildCsv();
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapport-${selectedReport}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.show('Export CSV généré');
    } else {
      toast.show('Export PDF non disponible — utilisez l\'export CSV', 'info');
    }
  };

  // =========================================================================
  // RENDU
  // =========================================================================

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ==================================================================== */}
      {/* NAVIGATION INTERNE (sidebar du module) */}
      {/* ==================================================================== */}
      <aside className="hidden lg:flex lg:w-64 flex-col border-r border-slate-200 bg-white">
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Layout size={24} className="text-indigo-600" />
            <h2 className="font-bold text-lg text-slate-800">Surveillance</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">Audit · Alertes · Rapports</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? tabColor(tab.id)
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.icon}
                <span className="flex-1 text-left">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-3 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">Bahkanso · v1.0</p>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* CONTENU PRINCIPAL */}
      {/* ==================================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* En-tête avec KPI agrégés */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {TABS.find(t => t.id === activeTab)?.label}
            </h1>
            <p className="text-sm text-slate-500">
              {activeTab === 'audit' ? 'Journal d’activité immuable de l’exploitation'
              : activeTab === 'alertes' ? 'Centre de gestion des alertes et anomalies'
              : 'Génération de rapports et exports'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <KpiCard label="Alertes ouvertes" value={String(kpis.openAlerts)} icon={<Bell size={16} />} color="amber" />
            <KpiCard label="Priorité haute" value={String(kpis.highAlerts)} icon={<AlertTriangle size={16} />} color="red" />
            <KpiCard label="Événements audit" value={String(kpis.totalEvents)} icon={<ScrollText size={16} />} color="dark" />
            <KpiCard label="Événements aujourd’hui" value={String(kpis.todayEvents)} icon={<List size={16} />} color="blue" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* ================================================================ */}
          {/* AUDIT */}
          {/* ================================================================ */}
          {activeTab === 'audit' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <KpiCard label="Total événements" value={String(auditKpis.total)} icon={<ScrollText size={16} />} color="dark" />
                <KpiCard label="Créations" value={String(auditKpis.creates)} icon={<ScrollText size={16} />} color="green" />
                <KpiCard label="Validations" value={String(auditKpis.validates)} icon={<ScrollText size={16} />} color="blue" />
                <KpiCard label="Rejets/Annulations" value={String(auditKpis.rejects)} icon={<ScrollText size={16} />} color="red" />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchAudit}
                    onChange={e => setSearchAudit(e.target.value)}
                    placeholder="Rechercher dans l’audit…"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                  />
                </div>
                <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                  <option value="all">Tous les utilisateurs</option>
                  {auditUsers.map(u => <option key={u || ''} value={u || ''}>{u || 'Inconnu'}</option>)}
                </select>
                <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                  <option value="all">Toutes les actions</option>
                  {auditActions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Utilisateur</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Action</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Objet</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredAudit.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                            Aucun événement trouvé.
                          </td>
                        </tr>
                      ) : (
                        filteredAudit.map(log => (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-900">{log.user_name || '—'}</td>
                            <td className="px-4 py-3"><SimpleBadge color={ACTION_COLORS[log.action] || 'gray'}>{log.action}</SimpleBadge></td>
                            <td className="px-4 py-3 text-sm text-slate-600">{log.object_type || '—'} {log.object_id ? `· ${log.object_id}` : ''}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{log.description || '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* ALERTES */}
          {/* ================================================================ */}
          {activeTab === 'alertes' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <KpiCard label="Alertes ouvertes" value={String(alertKpis.open)} icon={<Bell size={16} />} color="amber" />
                <KpiCard label="Haute priorité" value={String(alertKpis.high)} icon={<AlertTriangle size={16} />} color="red" />
                <KpiCard label="Priorité moyenne" value={String(alertKpis.medium)} icon={<Bell size={16} />} color="amber" />
                <KpiCard label="Résolues" value={String(alertKpis.resolved)} icon={<CheckCircle size={16} />} color="green" />
              </div>

              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                    <p className="text-slate-400">Aucune alerte enregistrée.</p>
                  </div>
                ) : (
                  alerts.map(a => (
                    <div key={a.id} className={`bg-white rounded-xl border p-4 ${a.status === 'ouverte' ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          a.severity === 'high' ? 'bg-red-100 text-red-600' : a.severity === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {categoryIcons[a.category] || <Bell size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900">{a.title}</h3>
                            <SimpleBadge color={a.severity === 'high' ? 'red' : a.severity === 'medium' ? 'amber' : 'blue'}>{a.severity}</SimpleBadge>
                            <SimpleBadge color="gray">{a.category}</SimpleBadge>
                            {a.status === 'résolue' && <SimpleBadge color="green">Résolue</SimpleBadge>}
                          </div>
                          <p className="text-sm text-slate-500">{a.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                            <span>{timeAgo(a.created_at)}</span>
                            {a.assigned_to && <span>· Assignée à {a.assigned_to}</span>}
                            {a.resolved_at && <span>· Résolue le {formatDate(a.resolved_at)}</span>}
                          </div>
                        </div>
                        {a.status === 'ouverte' && (
                          <button onClick={() => resolveAlert(a)} className="flex items-center gap-1 px-3 py-1.5 text-xs text-green-700 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200">
                            <CheckCircle size={14} /> Résoudre
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* RAPPORTS */}
          {/* ================================================================ */}
          {activeTab === 'rapports' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Liste des rapports */}
                <div className="lg:col-span-1">
                  <div className="space-y-2">
                    {reportList.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setSelectedReport(r.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                          selectedReport === r.id ? 'bg-green-50 border-green-300' : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${r.color}`}>{r.icon}</div>
                        <span className={`text-sm font-medium ${selectedReport === r.id ? 'text-green-700' : 'text-slate-700'}`}>{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contenu du rapport sélectionné */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-semibold text-slate-900 text-lg">{reportList.find(r => r.id === selectedReport)?.label}</h3>
                        <p className="text-sm text-slate-500">Rapport généré le {formatDate(new Date().toISOString())}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700">
                          <Download size={16} /> CSV
                        </button>
                        <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700">
                          <Download size={16} /> PDF
                        </button>
                      </div>
                    </div>

                    {selectedReport === 'financial' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-blue-50 rounded-lg"><p className="text-xs text-slate-500">Total financé</p><p className="text-xl font-bold text-slate-900">{formatCurrency(fin.totalFunded)}</p></div>
                          <div className="p-4 bg-amber-50 rounded-lg"><p className="text-xs text-slate-500">Total dépensé</p><p className="text-xl font-bold text-slate-900">{formatCurrency(fin.totalSpent)}</p></div>
                          <div className="p-4 bg-green-50 rounded-lg"><p className="text-xs text-slate-500">Solde</p><p className="text-xl font-bold text-green-600">{formatCurrency(fin.totalFunded - fin.totalSpent)}</p></div>
                          <div className="p-4 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">Nb dépenses</p><p className="text-xl font-bold text-slate-900">{expenses.length}</p></div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 mb-2">Dépenses par catégorie</h4>
                          <div className="space-y-2">
                            {Object.entries(fin.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                              <div key={cat} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                <span className="text-sm text-slate-600">{cat}</span>
                                <span className="text-sm font-medium text-slate-900">{formatCurrency(amt)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedReport === 'agricultural' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-green-50 rounded-lg"><p className="text-xs text-slate-500">Récoltes totales</p><p className="text-xl font-bold text-slate-900">{harvests.reduce((s, h) => s + h.quantity, 0)} kg</p></div>
                          <div className="p-4 bg-amber-50 rounded-lg"><p className="text-xs text-slate-500">Chiffre d’affaires</p><p className="text-xl font-bold text-slate-900">{formatCurrency(harvests.reduce((s, h) => s + (h.revenue || 0), 0))}</p></div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 mb-2">Détail des récoltes</h4>
                          <div className="space-y-2">
                            {harvests.length === 0 ? (
                              <p className="text-sm text-slate-400 py-4 text-center">Aucune récolte enregistrée</p>
                            ) : harvests.map(h => (
                              <div key={h.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                <span className="text-sm text-slate-600">{h.quality || 'Récolte'} — {h.quantity} {h.unit}</span>
                                <span className="text-sm font-medium text-slate-900">{formatCurrency(h.revenue || 0)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedReport === 'livestock' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-amber-50 rounded-lg"><p className="text-xs text-slate-500">Total animaux</p><p className="text-xl font-bold text-slate-900">{animalLots.reduce((s, l) => s + l.count, 0)}</p></div>
                          <div className="p-4 bg-green-50 rounded-lg"><p className="text-xs text-slate-500">Valeur cheptel</p><p className="text-xl font-bold text-slate-900">{formatCurrency(animalLots.reduce((s, l) => s + l.estimated_value, 0))}</p></div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 mb-2">Détail des lots</h4>
                          <div className="space-y-2">
                            {animalLots.length === 0 ? (
                              <p className="text-sm text-slate-400 py-4 text-center">Aucun lot enregistré</p>
                            ) : animalLots.map(l => (
                              <div key={l.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                <span className="text-sm text-slate-600">{l.species} — {l.count} têtes</span>
                                <span className="text-sm font-medium text-slate-900">{formatCurrency(l.estimated_value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedReport === 'investment' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          {projects.length === 0 ? (
                            <p className="text-sm text-slate-400 py-4 text-center">Aucun projet enregistré</p>
                          ) : projects.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-slate-900">{p.name}</p>
                                <p className="text-xs text-slate-500">{p.status} · {p.progress}%</p>
                              </div>
                              <span className="text-sm font-medium">{formatCurrency(p.revised_budget || p.initial_budget)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedReport === 'funder' && (
                      <div className="space-y-4">
                        <p className="text-sm text-slate-500">Rapport consolidé destiné aux financeurs : financements, dépenses liées, justificatifs et résultats.</p>
                        <div className="space-y-2">
                          {fundings.filter(f => f.status === 'reçu').length === 0 ? (
                            <p className="text-sm text-slate-400 py-4 text-center">Aucun financement reçu</p>
                          ) : fundings.filter(f => f.status === 'reçu').map(f => (
                            <div key={f.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-slate-900">{f.reference}</p>
                                <p className="text-xs text-slate-500">{f.funder?.name}</p>
                              </div>
                              <span className="text-sm font-medium text-green-600">{formatCurrency(f.amount_received || 0)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}