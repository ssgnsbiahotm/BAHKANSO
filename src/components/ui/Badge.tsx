import { STATUS_CLASS_SUCCESS, STATUS_CLASS_INFO, STATUS_CLASS_WARNING, STATUS_CLASS_DANGER } from '@/lib/constants';

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
    gray: 'bg-surface-hover text-secondary border-default',
    success: STATUS_CLASS_SUCCESS,
    info: STATUS_CLASS_INFO,
    danger: STATUS_CLASS_DANGER,
    warning: STATUS_CLASS_WARNING,
    slate: 'bg-surface-hover text-secondary border-default',
    accent: 'bg-surface-hover text-secondary border-default',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorMap[color] || colorMap.gray} ${className}`}>
      {children}
    </span>
  );
}
