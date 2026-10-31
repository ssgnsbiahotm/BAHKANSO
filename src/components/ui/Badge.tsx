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
  const colors: Record<string, string> = {
    gray: 'bg-surface-hover text-secondary border-border-default',
    success: 'bg-success-soft text-success border-border-default',
    info: 'bg-info-soft text-info border-border-default',
    danger: 'bg-danger-soft text-danger border-border-default',
    warning: 'bg-warning-soft text-warning border-border-default',
    slate: 'bg-surface-hover text-secondary border-border-default',
    accent: 'bg-accent-soft text-accent-primary border-border-default',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color] || colors.gray} ${className}`}>
      {children}
    </span>
  );
}
