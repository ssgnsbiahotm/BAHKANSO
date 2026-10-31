import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type TrendValue = number | null | { value: string; positive: boolean };

interface KpiCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  trend?: TrendValue;
  trendLabel?: string;
  color?: 'accent' | 'success' | 'info' | 'warning' | 'danger' | 'slate' | 'terra';
  subtitle?: string;
}

const colorClasses: Record<string, { bg: string; text: string }> = {
  accent: { bg: 'bg-accent-soft', text: 'text-accent-primary' },
  success: { bg: 'bg-success-soft', text: 'text-success' },
  info: { bg: 'bg-info-soft', text: 'text-info' },
  warning: { bg: 'bg-warning-soft', text: 'text-warning' },
  danger: { bg: 'bg-danger-soft', text: 'text-danger' },
  slate: { bg: 'bg-surface-hover', text: 'text-secondary' },
  terra: { bg: 'bg-terra-soft', text: 'text-terra-text' },
};

const TREND_TEXT: Record<string, string> = {
  positive: 'text-success',
  negative: 'text-danger',
  neutral: 'text-muted',
};
export function KpiCard({ label, value, icon, trend, trendLabel, color = 'success', subtitle }: KpiCardProps) {
  const c = colorClasses[color];

  const renderTrend = () => {
    if (trend === undefined || trend === null) return null;

    if (typeof trend === 'number') {
      return (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend > 0 ? TREND_TEXT.positive : trend < 0 ? TREND_TEXT.negative : TREND_TEXT.neutral}`}>
          {trend > 0 ? <TrendingUp size={14} /> : trend < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
          <span>{Math.abs(trend)}%</span>
        </div>
      );
    }

    // Object format: { value: string; positive: boolean }
    return (
      <div className={`flex items-center gap-1 text-xs font-medium ${trend.positive ? TREND_TEXT.positive : TREND_TEXT.negative}`}>
        {trend.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>{trend.value}</span>
      </div>
    );
  };

  return (
    <div className="rotatable-card bg-surface rounded-lg border border-default p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${c.bg} ${c.text}`}>
          {icon}
        </div>
        {renderTrend()}
      </div>
      <p className="text-sm text-secondary mb-1">{label}</p>
      <p className="text-2xl font-bold text-primary">{value}</p>
      {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
      {trendLabel && <p className="text-xs text-muted mt-1">{trendLabel}</p>}
    </div>
  );
}
