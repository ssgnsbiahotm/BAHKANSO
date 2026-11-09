import { AlertTriangle, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { COLORS } from '@/lib/constants';
import type { Alert } from '@/lib/types';

export interface DashboardActionListProps {
  alerts: Alert[];
  onViewAll?: () => void;
}

/**
 * Liste "À traiter" : alertes ouvertes du site (même source que la cloche /
 * la Sidebar = status === 'ouverte').
 */
export function DashboardActionList({
  alerts,
  onViewAll,
}: DashboardActionListProps) {
  const ouvertes = alerts.filter((a) => a.status === 'ouverte');

  if (ouvertes.length === 0) {
    return (
      <section className="rounded-xl border border-default bg-surface p-5">
        <h2 className="text-sm font-semibold text-primary mb-3">À traiter</h2>
        <p className="text-xs text-primary/60">Aucune alerte ouverte sur ce site.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-default bg-surface p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-primary">À traiter</h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            Voir toutes les alertes <ChevronRight size={14} />
          </button>
        )}
      </div>
      <div className="space-y-2">
        {ouvertes.slice(0, 5).map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded border border-default/50 text-sm"
          >
            <AlertTriangle size={16} className={severityIconClass(a.severity)} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-primary leading-tight">{a.title}</p>
              {a.description && (
                <p className="text-xs text-primary/60 truncate">{a.description}</p>
              )}
            </div>
            <span className={`text-xs font-medium ${severityTextClass(a.severity)}`}>
              {a.severity}
            </span>
            <span className="text-xs text-primary/50 ml-auto">
              {formatDate(a.created_at)}
            </span>
          </div>
        ))}
        {ouvertes.length > 5 && (
          <p className="text-xs text-primary/60 text-center px-3 py-2">
            + {ouvertes.length - 5} autre{ouvertes.length > 6 ? 's' : ''}
          </p>
        )}
      </div>
    </section>
  );
}

function severityIconClass(severity: string): string {
  if (severity === 'high') return `text-[${COLORS.red}]`;
  if (severity === 'medium') return `text-[${COLORS.orange}]`;
  return `text-[${COLORS.blue}]`;
}

function severityTextClass(severity: string): string {
  if (severity === 'high') return `text-[${COLORS.red}]`;
  if (severity === 'medium') return `text-[${COLORS.orange}]`;
  return `text-[${COLORS.blue}]`;
}
