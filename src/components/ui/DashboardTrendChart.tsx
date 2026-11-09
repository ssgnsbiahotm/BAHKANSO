import { formatCurrency } from '@/lib/format';
import { COLORS } from '@/lib/constants';

export interface TrendPoint {
  month: string; // 'YYYY-MM'
  entrees: number;
  sorties: number;
}

export interface DashboardTrendChartProps {
  title: string;
  data: TrendPoint[];
  height?: number;
}

/**
 * Graphique recettes vs dépenses sur les N derniers mois.
 * SVG pur + Tailwind, zéro dépendance.
 *
 * Règle : pas de données => état vide explicite (jamais de zéro factice).
 */
export function DashboardTrendChart({
  title,
  data,
  height = 220,
}: DashboardTrendChartProps) {
  const hasData = data.length > 0;

  if (!hasData) {
    return (
      <div className="rounded-xl border border-default bg-surface p-5 flex flex-col items-center justify-center h-full min-h-[220px]">
        <p className="text-sm text-primary/60">Aucune donnée sur la période.</p>
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.flatMap((d) => [d.entrees, d.sorties]),
    1
  );
  const pad = 40;
  const width = 100 - pad * 2;
  const chartHeight = height - 60;

  const xStep = width / Math.max(data.length - 1, 1);

  return (
    <div className="rounded-xl border border-default bg-surface p-5">
      <h3 className="text-sm font-semibold text-primary mb-4">{title}</h3>
      <div className="flex items-end gap-2 h-[calc(100%-60px)] px-2">
        {data.map((point, i) => {
          const entreesH = Math.round((point.entrees / maxValue) * chartHeight);
          const sortiesH = Math.round((point.sorties / maxValue) * chartHeight);
          const x = pad + i * xStep;
          return (
            <>
              <rect
                key={`${point.month}-entrees`}
                x={x - 10}
                y={chartHeight - entreesH}
                width={9}
                height={entreesH}
                fill={COLORS.signal}
                className="opacity-90 rounded-t-[3px]"
              />
              <rect
                key={`${point.month}-sorties`}
                x={x - 1}
                y={chartHeight - sortiesH}
                width={9}
                height={sortiesH}
                fill={COLORS.terra}
                className="opacity-90 rounded-t-[3px]"
              />
            </>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-xs text-primary/60 px-1">
        {data.map((point) => (
          <span key={point.month} className="text-center w-[40px]">
            {point.month.slice(5, 7)}/{point.month.slice(2, 4)}
          </span>
        ))}
      </div>
      <div className="flex justify-between mt-3 text-xs text-primary/60">
        <span>
          <span className={`font-semibold text-[${COLORS.signal}]`}>▮</span> Recettes{' '}
          {formatCurrency(data.reduce((acc, d) => acc + d.entrees, 0), 'FCFA')}
        </span>
        <span>
          <span className={`font-semibold text-[${COLORS.terra}]`}>▮</span> Dépenses{' '}
          {formatCurrency(data.reduce((acc, d) => acc + d.sorties, 0), 'FCFA')}
        </span>
      </div>
    </div>
  );
}
