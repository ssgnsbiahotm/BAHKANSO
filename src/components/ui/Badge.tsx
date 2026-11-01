import { STATUS_CLASS_SUCCESS, STATUS_CLASS_INFO, STATUS_CLASS_WARNING, STATUS_CLASS_DANGER, STATUS_CLASS_NEUTRAL, STATUS_CLASS_MUTED, STATUS_CLASS_ACCENT } from '@/lib/constants';

interface BadgeProps {
  status: string;
  colorMap: Record<string, string>;
  className?: string;
}

export function StatusBadge({ status, colorMap, className = '' }: BadgeProps) {
  const colorClass = colorMap[status] || 'bg-surface-hover text-secondary border-default';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass} ${className}`}>
      {status}
    </span>
  );
}

export function SimpleBadge({ children, color = 'gray', className = '' }: { children: React.ReactNode; color?: string; className?: string }) {
  const colorMap: Record<string, string> = {
    gray: STATUS_CLASS_NEUTRAL,
    success: STATUS_CLASS_SUCCESS,
    info: STATUS_CLASS_INFO,
    danger: STATUS_CLASS_DANGER,
    warning: STATUS_CLASS_WARNING,
    slate: STATUS_CLASS_MUTED,
    accent: STATUS_CLASS_ACCENT,
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorMap[color] || colorMap.gray} ${className}`}>
      {children}
    </span>
  );
}
