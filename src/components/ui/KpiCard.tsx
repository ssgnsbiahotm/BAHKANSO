import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type TrendValue = number | null | { value: string; positive: boolean };

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: TrendValue;
  trendLabel?: string;
  tone?: 'success' | 'info' | 'warning' | 'danger' | 'neutral';
  color?:
    | 'accent'
    | 'success'
    | 'info'
    | 'warning'
    | 'danger'
    | 'slate'
    | 'terra';
  subtitle?: string;
}

// Color -> tailwind class mapping (existing API, unchanged behavior)
import { STATUS_CLASS_SUCCESS, STATUS_CLASS_INFO, STATUS_CLASS_WARNING, STATUS_CLASS_DANGER, STATUS_CLASS_TERRA, STATUS_CLASS_ACCENT, STATUS_CLASS_MUTED } from '@/lib/constants';

const colorClasses: Record<string, { bg: string; text: string }> = {
  accent: { bg: STATUS_CLASS_ACCENT.split(' ')[0], text: STATUS_CLASS_ACCENT.split(' ')[1] },
  success: { bg: STATUS_CLASS_SUCCESS.split(' ')[0], text: STATUS_CLASS_SUCCESS.split(' ')[1] },
  info: { bg: STATUS_CLASS_INFO.split(' ')[0], text: STATUS_CLASS_INFO.split(' ')[1] },
  warning: { bg: STATUS_CLASS_WARNING.split(' ')[0], text: STATUS_CLASS_WARNING.split(' ')[1] },
  danger: { bg: STATUS_CLASS_DANGER.split(' ')[0], text: STATUS_CLASS_DANGER.split(' ')[1] },
  slate: { bg: STATUS_CLASS_MUTED.split(' ')[0], text: STATUS_CLASS_MUTED.split(' ')[1] },
  terra: { bg: STATUS_CLASS_TERRA.split(' ')[0], text: STATUS_CLASS_TERRA.split(' ')[1] },
};

// Tone classes using Tailwind arbitrary values — opt-in override
const toneClasses: Record<string, { bg: string; text: string }> = {
  success: { bg: 'bg-[var(--success-soft)]', text: 'text-[var(--success)]' },
  info: { bg: 'bg-[var(--info-soft)]', text: 'text-[var(--info)]' },
  warning: { bg: 'bg-[var(--warning-soft)]', text: 'text-[var(--warning)]' },
  danger: { bg: 'bg-[var(--danger-soft)]', text: 'text-[var(--danger)]' },
  neutral: { bg: 'bg-[var(--bg-surface-hover)]', text: 'text-[var(--text-secondary)]' },
};

const TREND_TEXT: Record<string, string> = {
  positive: 'text-success',
  negative: 'text-danger',
  neutral: 'text-muted',
};
export function KpiCard({
  label,
  value,
  icon,
  trend,
  trendLabel,
  tone,
  color = 'success',
  subtitle,
}: KpiCardProps) {
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

  // tone (opt-in) overrides color with CSS variables; otherwise tailwind classes via color
  const c = colorClasses[color] || colorClasses.success;
  const bgClass = tone ? toneClasses[tone]?.bg || toneClasses.success.bg : c.bg;
  const textClass = tone ? toneClasses[tone]?.text || toneClasses.success.text : c.text;

  return (
    <div className="rotatable-card bg-surface rounded-lg border border-default p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${bgClass} ${textClass}`}>
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
