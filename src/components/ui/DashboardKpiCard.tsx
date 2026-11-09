import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatNumber } from '@/lib/format';
import { STATUS_CLASS_SUCCESS, STATUS_CLASS_WARNING, STATUS_CLASS_NEUTRAL } from '@/lib/constants';
import { ChevronRight } from 'lucide-react';

export interface DashboardKpiCardProps {
  label: string;
  value: number | null;
  unit: string;
  status: 'idle' | 'loading' | 'no_data' | 'ok' | 'warn' | 'crit';
  hint: string;
  href?: string;
}

export function DashboardKpiCard({
  label,
  value,
  unit,
  status,
  hint,
  href,
}: DashboardKpiCardProps) {
  const [pressed, setPressed] = useState(false);

  const isClickable = Boolean(href);
  const showSkeleton = status === 'loading' || status === 'idle';
  const isEmpty = status === 'no_data';

  // Classe de statut pour la puce d'état.
  let statusClass = STATUS_CLASS_NEUTRAL;
  let statusLabel = 'À venir';
  if (status === 'loading') { statusClass = STATUS_CLASS_NEUTRAL; statusLabel = 'Chargement…'; }
  else if (status === 'no_data') { statusClass = STATUS_CLASS_WARNING; statusLabel = 'Aucune donnée'; }
  else if (status === 'ok') { statusClass = STATUS_CLASS_SUCCESS; statusLabel = 'OK'; }
  else if (status === 'warn') { statusClass = STATUS_CLASS_WARNING; statusLabel = 'Attention'; }
  else if (status === 'crit') { statusClass = STATUS_CLASS_WARNING; statusLabel = 'Critique'; }

  const displayValue = showSkeleton || isEmpty ? '—' : formatCurrency(value, unit);
  // Pour les unités non-monétaires, afficher le nombre brut.
  const displayNumber = showSkeleton || isEmpty ? '—' : (unit === 'FCFA' ? undefined : formatNumber(value));

  return (
    <article
      className="rounded-xl border border-default bg-surface p-5 hover:shadow-sm transition-shadow cursor-pointer group"
      {...(isClickable ? { onMouseEnter: () => setPressed(false), onMouseLeave: () => setPressed(false) } : {})}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-primary">{label}</h3>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        <div className="flex items-baseline gap-1">
          {showSkeleton ? (
            <span className="h-6 w-24 rounded bg-surface-raised animate-pulse" />
          ) : isEmpty ? (
            <span className="text-primary/50">—</span>
          ) : unit === 'FCFA' ? (
            <>
              {displayValue}
              <span className="text-xs text-primary/60">{unit}</span>
            </>
          ) : (
            <>
              {displayNumber}
              <span className="text-xs text-primary/60">{unit}</span>
            </>
          )}
        </div>

        <p className="text-xs text-primary/60 leading-relaxed">{hint}</p>

        {isClickable && (
          <Link
            to={href}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
            onClick={(e) => {
              if (pressed) e.preventDefault();
              setPressed(true);
            }}
          >
            Voir le détail <ChevronRight size={14} />
          </Link>
        )}
      </div>
    </article>
  );
}

