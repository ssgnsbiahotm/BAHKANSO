import { useMemo, useState, useEffect, useCallback } from 'react';
import { Bell, AlertTriangle, CheckCircle, RefreshCw, Search } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/Toast';
import { timeAgo } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { SimpleBadge } from '@/components/ui/Badge';
import { logAudit } from '@/lib/types';
import {
  STATUS_CLASS_SUCCESS,
  STATUS_CLASS_INFO,
  STATUS_CLASS_WARNING,
  STATUS_CLASS_DANGER,
} from '@/lib/constants';
import { evaluateAlertRules, type CandidateAlert } from '@/lib/alert-rules';

const MODULE_LABELS: Record<string, string> = {
  Stocks: 'Stocks',
  Justificatifs: 'Finance',
  Chantiers: 'Projets',
  Finance: 'Finance',
  Élevage: 'Élevage',
  Agriculture: 'Exploitation',
};

export function AlertesTab() {
  const {
    alerts,
    refresh,
    animals,
    animalEvents,
    campaigns,
    inventoryItems,
    budgets,
    expenses,
    projects,
    loadModule,
    loadedModules,
  } = useData();
  const { appUser } = useAuth();
  const toast = useToast();

  // S'assurer que les sources nécessaires aux règles sont chargées
  useEffect(() => {
    if (!loadedModules.has('elevage')) loadModule('elevage');
  }, [loadModule, loadedModules]);

  const [checkAlertsRunning, setCheckAlertsRunning] = useState(false);

  // Filtres
  const [filterStatus, setFilterStatus] = useState<'ouverte' | 'résolue' | ''>('');
  const [filterSeverity, setFilterSeverity] = useState<'high' | 'medium' | 'low' | ''>('');
  const [filterModule, setFilterModule] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const openAlerts = useMemo(
    () => alerts.filter((a) => a.status === 'ouverte'),
    [alerts],
  );

  const kpis = useMemo(() => {
    const open = openAlerts.length;
    const high = openAlerts.filter((a) => a.severity === 'high').length;
    const medium = openAlerts.filter((a) => a.severity === 'medium').length;
    const resolved = alerts.filter((a) => a.status === 'résolue').length;
    return { open, high, medium, resolved };
  }, [openAlerts, alerts]);

  // Suggestions d'alertes à créer (dérivées en mémoire, pas encore en base)
  const suggestions = useMemo(() => {
    return evaluateAlertRules({
      animals,
      animalEvents,
      campaigns,
      inventoryItems,
      budgets,
      expenses,
      projects,
      openAlerts,
    });
  }, [animals, animalEvents, campaigns, inventoryItems, budgets, expenses, projects, openAlerts]);

  const resolveAlert = async (alert: { id: string; title: string }) => {
    const { error } = await supabase
      .from('alerts')
      .update({ status: 'résolue', resolved_at: new Date().toISOString() })
      .eq('id', alert.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'UPDATE', 'alert', alert.id, `Alerte résolue: ${alert.title}`);
      toast.show('Alerte résolue');
      refresh();
    }
  };

  const createSuggestion = async (s: CandidateAlert) => {
    const { error } = await supabase.from('alerts').insert({
      title: s.title,
      description: s.description,
      severity: s.severity,
      category: s.category,
      object_type: s.object_type,
      object_id: s.object_id,
      status: 'ouverte',
    });
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'CREATE', 'alert', null, `Alerte créée: ${s.title}`);
      toast.show('Alerte créée');
      refresh();
    }
  };

  const checkAlerts = useCallback(async () => {
    setCheckAlertsRunning(true);
    let created = 0;
    try {
      const candidates = evaluateAlertRules({
        animals,
        animalEvents,
        campaigns,
        inventoryItems,
        budgets,
        expenses,
        projects,
        openAlerts,
      });
      for (const c of candidates) {
        const { error } = await supabase.from('alerts').insert({
          title: c.title,
          description: c.description,
          severity: c.severity,
          category: c.category,
          object_type: c.object_type,
          object_id: c.object_id,
          status: 'ouverte',
        });
        if (!error) created++;
      }
      toast.show(`${created} nouvelles alertes créées`);
      refresh();
    } catch (err) {
      console.error('Erreur vérification alertes:', err);
      toast.show('Erreur lors de la vérification des alertes', 'error');
    } finally {
      setCheckAlertsRunning(false);
    }
  }, [animals, animalEvents, campaigns, inventoryItems, budgets, expenses, projects, openAlerts, refresh, toast]);

  const modules = useMemo(() => {
    const set = new Set(alerts.map((a) => a.category));
    return Array.from(set).sort();
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (filterStatus && a.status !== filterStatus) return false;
      if (filterSeverity && a.severity !== filterSeverity) return false;
      if (filterModule && a.category !== filterModule) return false;
      if (
        searchQuery &&
        !`${a.title} ${a.description ?? ''}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [alerts, filterStatus, filterSeverity, filterModule, searchQuery]);

  const severityIcon = (severity: string) => {
    if (severity === 'high') return <AlertTriangle size={18} />;
    if (severity === 'medium') return <Bell size={18} />;
    return <CheckCircle size={18} />;
  };

  const severityColor = (severity: string) => {
    if (severity === 'high') return 'red';
    if (severity === 'medium') return 'amber';
    return 'blue';
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Alertes"
        subtitle="Tour de contrôle — surveillance et actions prioritaires"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => checkAlerts()}
              disabled={checkAlertsRunning}
              className="flex items-center gap-2 px-4 py-2 bg-signal text-white rounded-lg hover:bg-signal/80 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title="Scanner la base et créer les alertes manquantes"
            >
              <RefreshCw size={16} /> Vérifier les alertes
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Alertes ouvertes" value={String(kpis.open)} icon={<Bell size={20} />} color="warning" />
        <KpiCard label="Haute priorité" value={String(kpis.high)} icon={<AlertTriangle size={20} />} color="danger" />
        <KpiCard label="Priorité moyenne" value={String(kpis.medium)} icon={<Bell size={20} />} color="warning" />
        <KpiCard label="Résolues" value={String(kpis.resolved)} icon={<CheckCircle size={20} />} color="success" />
      </div>

      {/* Suggestions d'actions (alertes à créer) */}
      {suggestions.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-primary">Suggestions d'actions</h2>
            <p className="text-xs text-muted">
              Alertes détectées par le moteur de règles, pas encore enregistrées.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {suggestions.map((s) => (
              <div
                key={`${s.object_type}-${s.object_id}`}
                className="bg-surface border border-default rounded-xl p-4"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      s.severity === 'high' ? STATUS_CLASS_DANGER : s.severity === 'medium' ? STATUS_CLASS_WARNING : STATUS_CLASS_INFO
                    }`}
                  >
                    {severityIcon(s.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-primary">{s.title}</h3>
                    <SimpleBadge
                      color={severityColor(s.severity)}
                      className="text-xs"
                    >
                      {s.severity}
                    </SimpleBadge>
                    <SimpleBadge color="gray" className="text-xs">
                      {MODULE_LABELS[s.category] || s.category}
                    </SimpleBadge>
                  </div>
                </div>
                <p className="text-sm text-muted mb-3">{s.description}</p>
                <button
                  onClick={() => createSuggestion(s)}
                  className="w-full flex items-center justify-center gap-1 px-3 py-2 text-xs border border-default rounded-lg hover:bg-surface text-sm font-medium transition-colors"
                >
                  Créer l'alerte
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filtres + liste des alertes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une alerte..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-default rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-slate-500/20"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'ouverte' | 'résolue' | '')}
          className="px-3 py-2 text-sm border border-default rounded-lg bg-surface"
        >
          <option value="">Tous les statuts</option>
          <option value="ouverte">Ouvertes</option>
          <option value="résolue">Résolues</option>
        </select>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as 'high' | 'medium' | 'low' | '')}
          className="px-3 py-2 text-sm border border-default rounded-lg bg-surface"
        >
          <option value="">Toutes les sévérités</option>
          <option value="high">Haute</option>
          <option value="medium">Moyenne</option>
          <option value="low">Basse</option>
        </select>
        <select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
          className="px-3 py-2 text-sm border border-default rounded-lg bg-surface"
        >
          <option value="">Tous les modules</option>
          {modules.map((m) => (
            <option key={m} value={m}>
              {MODULE_LABELS[m] || m}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-surface rounded-xl border border-default p-8 text-center">
            <p className="text-muted">Aucune alerte enregistrée.</p>
          </div>
        ) : (
          filteredAlerts.map((a) => (
            <div
              key={a.id}
              className={`bg-surface rounded-xl border p-4 ${
                a.status === 'ouverte' ? 'border-default' : 'border-slate-100 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    a.severity === 'high' ? STATUS_CLASS_DANGER : a.severity === 'medium' ? STATUS_CLASS_WARNING : STATUS_CLASS_INFO
                  }`}
                >
                  {severityIcon(a.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-primary">{a.title}</h3>
                    <SimpleBadge color={severityColor(a.severity)}>{a.severity}</SimpleBadge>
                    <SimpleBadge color="gray">{MODULE_LABELS[a.category] || a.category}</SimpleBadge>
                    {a.status === 'résolue' && <SimpleBadge color="green">Résolue</SimpleBadge>}
                  </div>
                  <p className="text-sm text-muted">{a.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                    <span>{timeAgo(a.created_at)}</span>
                    {a.assigned_to && <span>· Assignée à {a.assigned_to}</span>}
                  </div>
                </div>
              </div>
              {a.status === 'ouverte' && (
                <button
                  onClick={() => resolveAlert({ id: a.id, title: a.title })}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg ${STATUS_CLASS_SUCCESS}`}
                >
                  <CheckCircle size={14} /> Résoudre
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AlertesTab;
