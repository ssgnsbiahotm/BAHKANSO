import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  trend?: number | null;
  trendLabel?: string;
  color?: 'green' | 'blue' | 'amber' | 'red' | 'dark' | 'emerald';
  subtitle?: string;
}

const colorClasses: Record<string, { bg: string; text: string; ring: string }> = {
  green: { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-100' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-100' },
  red: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-100' },
  dark: { bg: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-100' },
};

export function KpiCard({ label, value, icon, trend, trendLabel, color = 'green', subtitle }: KpiCardProps) {
  const c = colorClasses[color];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${c.bg} ${c.text} ring-1 ${c.ring}`}>
          {icon}
        </div>
        {trend !== undefined && trend !== null && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {trend > 0 ? <TrendingUp size={14} /> : trend < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      {trendLabel && <p className="text-xs text-slate-400 mt-1">{trendLabel}</p>}
    </div>
  );
}
