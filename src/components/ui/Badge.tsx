interface BadgeProps {
  status: string;
  colorMap: Record<string, string>;
  className?: string;
}

export function StatusBadge({ status, colorMap, className = '' }: BadgeProps) {
  const colorClass = colorMap[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass} ${className}`}>
      {status}
    </span>
  );
}

export function SimpleBadge({ children, color = 'gray', className = '' }: { children: React.ReactNode; color?: string; className?: string }) {
  const colors: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  dark: 'bg-slate-800 text-white border-slate-700',
  light: 'bg-slate-50 text-slate-700 border-slate-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    lime: 'bg-lime-50 text-lime-700 border-lime-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
    fuchsia: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    zinc: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    stone: 'bg-stone-100 text-stone-700 border-stone-200',
  pink: 'bg-pink-50 text-pink-700 border-pink-200',
  brown: 'bg-amber-50 text-amber-900 border-amber-300',
  olive: 'bg-lime-50 text-lime-800 border-lime-300',
    forest: 'bg-green-50 text-green-900 border-green-300',
    navy: 'bg-blue-50 text-blue-900 border-blue-300',
    crimson: 'bg-red-50 text-red-900 border-red-300',
    gold: 'bg-yellow-50 text-yellow-900 border-yellow-300',
    silver: 'bg-gray-50 text-gray-600 border-gray-300',
    bronze: 'bg-orange-50 text-orange-900 border-orange-300',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color] || colors.gray} ${className}`}>
      {children}
    </span>
  );
}
