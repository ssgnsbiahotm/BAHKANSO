import { useMemo, useState } from 'react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { formatCurrency, timeAgo } from '@/lib/format';
import { matchesPeriod } from '@/lib/business';
import { PageHeader } from '@/components/ui/PageHeader';
// Import dashboard components
import { KpiGrid } from '@/components/ui/dashboard/KpiGrid';
import { MetricCards } from '@/components/ui/dashboard/MetricCards';
import { ChartsSection } from '@/components/ui/dashboard/ChartsSection';
import { ToVerifyPanel } from '@/components/ui/dashboard/ToVerifyPanel';
import { RecentActivity } from '@/components/ui/dashboard/RecentActivity';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { farm } = useData();
  const [period, setPeriod] = useState<'2026' | '2025' | 'all'>('2026');

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Tableau de bord"
        subtitle={`Vue générale — ${farm?.name || 'Bahkanso'}`}
        actions={
          <select
            value={period}
            onChange={e => setPeriod(e.target.value as '2026' | '2025' | 'all')}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
          >
            <option value="2026">Année 2026</option>
            <option value="2025">Année 2025</option>
            <option value="all">Tout l'historique</option>
          </select>
        }
      />

      {/* KPI Grid */}
      <KpiGrid period={period} />

      {/* Metric Cards (Rotating Cards) */}
      <MetricCards period={period} />

      {/* Charts Section */}
      <ChartsSection period={period} />

      {/* To Verify + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ToVerifyPanel onNavigate={onNavigate} />
        <RecentActivity onNavigate={onNavigate} />
      </div>
    </div>
  );
}