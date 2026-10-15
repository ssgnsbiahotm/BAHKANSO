interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'green' | 'blue' | 'amber' | 'red';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

const colorClasses: Record<string, string> = {
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

const sizes: Record<string, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3.5',
};

export function ProgressBar({ value, max = 100, color = 'green', size = 'md', showLabel, label }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const autoColor = pct >= 90 ? 'red' : pct >= 70 ? 'amber' : color;
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>{label || ''}</span>
          <span className="font-medium">{Math.round(pct)}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`${colorClasses[autoColor]} ${sizes[size]} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
