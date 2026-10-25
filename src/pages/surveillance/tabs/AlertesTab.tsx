import { useMemo } from 'react';
import { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle , Search} from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/Toast';
import { formatDate, timeAgo } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { SimpleBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useValidatedForm } from '@/components/ui/ValidatedForm';
import { z } from 'zod';
import { logAudit } from '@/lib/types';

export function AlertesTab() {
  const { alerts, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();

  // Schéma de validation pour la résolution d'alerte
  const resolveSchema = z.object({
    status: z.enum(['résolue']),
    resolved_at: z.string().optional(),
  });

  const kpis = useMemo(() => {
    const open = alerts.filter(a => a.status === 'ouverte').length;
    const high = alerts.filter(a => a.severity === 'high' && a.status === 'ouverte').length;
    const medium = alerts.filter(a => a.severity === 'medium' && a.status === 'ouverte').length;
    const resolved = alerts.filter(a => a.status === 'résolue').length;
    return { open, high, medium, resolved };
  }, [alerts]);

  const resolveAlert = async (alert: { id: string; title: string }) => {
    const { error } = await supabase.from('alerts').update({ status: 'résolue', resolved_at: new Date().toISOString() }).eq('id', alert.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'UPDATE', 'alert', alert.id, `Alerte résolue: ${alert.title}`);
      toast.show('Alerte résolue');
      refresh();
    }
  };

  // Filtres
  const [filterStatus, setFilterStatus] = useState<'ouverte' | 'résolue' | ''>('');
  const [filterSeverity, setFilterSeverity] = useState<'high' | 'medium' | 'low' | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (filterStatus && a.status !== filterStatus) return false;
      if (filterSeverity && a.severity !== filterSeverity) return false;
      if (searchQuery && !`${a.title} ${a.description}`.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [alerts, filterStatus, filterSeverity, searchQuery]);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader title="Alertes" subtitle="Centre de gestion des alertes et anomalies" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Alertes ouvertes" value={String(kpis.open)} icon={<Bell size={20} />} color="amber" />
        <KpiCard label="Haute priorité" value={String(kpis.high)} icon={<AlertTriangle size={20} />} color="red" />
        <KpiCard label="Priorité moyenne" value={String(kpis.medium)} icon={<Bell size={20} />} color="amber" />
        <KpiCard label="Résolues" value={String(kpis.resolved)} icon={<CheckCircle size={20} />} color="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher une alerte..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/20"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
        >
          <option value="">Tous les statuts</option>
          <option value="ouverte">Ouvertes</option>
          <option value="résolue">Résolues</option>
        </select>
        <select
          value={filterSeverity}
          onChange={e => setFilterSeverity(e.target.value as any)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
        >
          <option value="">Toutes les sévérités</option>
          <option value="high">Haute</option>
          <option value="medium">Moyenne</option>
          <option value="low">Basse</option>
        </select>
      </div>

      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-400">Aucune alerte enregistrée.</p>
          </div>
        ) : (
          filteredAlerts.map(a => (
            <div key={a.id} className={`bg-white rounded-xl border p-4 ${a.status === 'ouverte' ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  a.severity === 'high' ? 'bg-red-100 text-red-600' : a.severity === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {a.severity === 'high' ? <AlertTriangle size={18} /> : a.severity === 'medium' ? <Bell size={18} /> : <CheckCircle size={18} />}
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
                  </div>
                </div>
              </div>
              {a.status === 'ouverte' && (
                <button onClick={() => resolveAlert({ id: a.id, title: a.title })} className="flex items-center gap-1 px-3 py-1.5 text-xs text-green-700 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200">
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