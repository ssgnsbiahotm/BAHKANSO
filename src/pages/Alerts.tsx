import { useMemo } from 'react';
import { Bell, AlertTriangle, CheckCircle } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/types';
import { useToast } from '@/lib/Toast';
import { timeAgo } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { SimpleBadge } from '@/components/ui/Badge';
import { STATUS_CLASS_SUCCESS, STATUS_CLASS_INFO, STATUS_CLASS_WARNING, STATUS_CLASS_DANGER } from '@/lib/constants';
import type { Alert } from '@/lib/types';

export function Alerts() {
  const { alerts, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();

  const kpis = useMemo(() => {
    const open = alerts.filter(a => a.status === 'ouverte').length;
    const high = alerts.filter(a => a.severity === 'high' && a.status === 'ouverte').length;
    const medium = alerts.filter(a => a.severity === 'medium' && a.status === 'ouverte').length;
    const resolved = alerts.filter(a => a.status === 'résolue').length;
    return { open, high, medium, resolved };
  }, [alerts]);

  const resolveAlert = async (alert: Alert) => {
    const { error } = await supabase.from('alerts').update({ status: 'résolue', resolved_at: new Date().toISOString() }).eq('id', alert.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'UPDATE', 'alert', alert.id, `Alerte résolue: ${alert.title}`);
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

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader title="Alertes" subtitle="Centre de gestion des alertes et anomalies" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Alertes ouvertes" value={String(kpis.open)} icon={<Bell size={20} />} color="warning" />
        <KpiCard label="Haute priorité" value={String(kpis.high)} icon={<AlertTriangle size={20} />} color="danger" />
        <KpiCard label="Priorité moyenne" value={String(kpis.medium)} icon={<Bell size={20} />} color="warning" />
        <KpiCard label="Résolues" value={String(kpis.resolved)} icon={<CheckCircle size={20} />} color="success" />
      </div>

      <div className="space-y-3">
        {alerts.map(a => (
          <div key={a.id} className={`bg-surface rounded-xl border p-4 ${a.status === 'ouverte' ? 'border-default' : 'border-default opacity-60'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                a.severity === 'high' ? STATUS_CLASS_DANGER : a.severity === 'medium' ? STATUS_CLASS_WARNING : STATUS_CLASS_INFO
              }`}>
                {categoryIcons[a.category] || <Bell size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-primary">{a.title}</h3>
                  <SimpleBadge color={a.severity === 'high' ? 'danger' : a.severity === 'medium' ? 'warning' : 'info'}>{a.severity}</SimpleBadge>
                  <SimpleBadge color="gray">{a.category}</SimpleBadge>
                  {a.status === 'résolue' && <SimpleBadge color="success">Résolue</SimpleBadge>}
                </div>
                <p className="text-sm text-muted">{a.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                  <span>{timeAgo(a.created_at)}</span>
                  {a.assigned_to && <span>· Assignée à {a.assigned_to}</span>}
                </div>
              </div>
              {a.status === 'ouverte' && (
                <button onClick={() => resolveAlert(a)} className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border ${STATUS_CLASS_SUCCESS}`}>
                  <CheckCircle size={14} /> Résoudre
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
