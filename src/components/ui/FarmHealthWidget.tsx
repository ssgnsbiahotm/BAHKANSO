import { AlertTriangle, Bell, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Alert } from '@/lib/types';
import { STATUS_CLASS_DANGER, STATUS_CLASS_INFO, STATUS_CLASS_WARNING } from '@/lib/constants';

interface FarmHealthWidgetProps {
  alerts: Alert[];
}

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function FarmHealthWidget({ alerts = [] }: FarmHealthWidgetProps) {
  const openAlerts = alerts.filter((a) => a.status === 'ouverte');
  const high = openAlerts.filter((a) => a.severity === 'high').length;
  const medium = openAlerts.filter((a) => a.severity === 'medium').length;
  const low = openAlerts.filter((a) => a.severity === 'low').length;

  // Score de santé : 100 moins les pénalités, encadré à 0 minimum
  const score = Math.max(0, 100 - (high * 20 + medium * 10 + low * 5));
  const strokeDashoffset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  const getScoreColor = (): string => {
    if (score >= 75) return 'text-success';
    if (score >= 40) return 'text-warning';
    return 'text-danger';
  };

  const criticalAlerts = openAlerts
    .filter((a) => a.severity === 'high')
    .slice(0, 3);

  return (
    <section className="bg-surface rounded-xl border border-default p-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Score de santé */}
        <div className="flex flex-col items-center gap-4 lg:w-48">
          <svg
            className="w-32 h-32 shrink-0 transform -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r={RADIUS}
              className="text-slate-200"
              stroke="currentColor"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r={RADIUS}
              className={getScoreColor()}
              stroke="currentColor"
              strokeWidth="10"
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transition="stroke-dashoffset 0.4s ease"
            />
          </svg>
          <div className="text-center">
            <span className={`text-3xl font-bold ${getScoreColor()}`}>{score}</span>
            <span className="text-xs text-muted">/ 100 santé ferme</span>
          </div>
        </div>

        {/* Résumé + alertes critiques */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary">Santé de la ferme</h3>
            <Link
              to="/app/surveillance?tab=alertes"
              className="text-xs font-medium text-accent-primary hover:underline"
            >
              Voir tout <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center mb-4">
            <div className="p-2 rounded-lg bg-slate-50/50">
              <div className="text-xs text-muted">Critiques</div>
              <div className={`text-sm font-bold ${STATUS_CLASS_DANGER}`}>{high}</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-50/50">
              <div className="text-xs text-muted">Moyennes</div>
              <div className={`text-sm font-bold ${STATUS_CLASS_WARNING}`}>{medium}</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-50/50">
              <div className="text-xs text-muted">Basses</div>
              <div className={`text-sm font-bold ${STATUS_CLASS_INFO}`}>{low}</div>
            </div>
          </div>

          {criticalAlerts.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-secondary">Dernières alertes critiques</span>
                <span className="text-xs text-muted">{criticalAlerts.length} ouverte(s)</span>
              </div>
              {criticalAlerts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 p-2 rounded-lg border border-default hover:bg-surface-hover cursor-pointer transition-colors group"
                >
                  <AlertTriangle size={14} className="text-danger shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-primary truncate">{a.title}</div>
                    <div className="text-xs text-muted truncate">{a.description ?? ''}</div>
                  </div>
                  <ChevronRight size={14} className="text-muted shrink-0 group-hover:text-accent-primary" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-success-soft border border-success/20 text-center">
              <Bell size={20} className="text-success mx-auto mb-2" />
              <p className="text-xs text-success font-medium">Aucune alerte critique ouverte</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default FarmHealthWidget;
