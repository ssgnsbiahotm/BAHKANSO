import React from 'react';
import { KpiCard } from '@/components/ui/KpiCard';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, HardHat, FileCheck, Bell, Sprout } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useData } from '@/lib/DataContext';
import { matchesPeriod } from '@/lib/business';

interface KpiGridProps {
  period: '2026' | '2025' | 'all';
}

export function KpiGrid({ period }: KpiGridProps) {
  const { fundings, expenses, bankAccounts, cashAccounts, projects, documents, alerts, campaigns, transactions } = useData();

  const filterByPeriod = (dateStr: string | null | undefined) => matchesPeriod(dateStr, period);

  const kpis = {
    treasury: bankAccounts.reduce((s, a) => s + a.balance, 0) + cashAccounts.reduce((s, a) => s + a.balance, 0),
    totalFunded: fundings.filter(f => f.status === 'reçu' && filterByPeriod(f.date_sent)).reduce((s, f) => s + (f.amount_received || 0), 0),
    totalSpent: expenses.filter(e => e.status === 'validée' && filterByPeriod(e.date)).reduce((s, e) => s + e.amount, 0),
    budgetRemaining:
      fundings.filter(f => f.status === 'reçu' && filterByPeriod(f.date_sent)).reduce((s, f) => s + (f.amount_received || 0), 0) -
      expenses.filter(e => e.status === 'validée' && filterByPeriod(e.date)).reduce((s, e) => s + e.amount, 0),
    ongoingProjects: projects.filter(p => p.status === 'en cours').length,
    docsToVerify: documents.filter(d => d.status === 'à vérifier').length,
    openAlerts: alerts.filter(a => a.status === 'ouverte').length,
    activeCampaigns: campaigns.filter(c => c.status === 'en cours').length
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
      <KpiCard
        label="Trésorerie disponible"
        value={formatCurrency(kpis.treasury)}
        icon={<Wallet size={20} />}
        color="green"
        trend={12.5}
      />
      <KpiCard
        label="Total financé"
        value={formatCurrency(kpis.totalFunded)}
        icon={<TrendingUp size={20} />}
        color="blue"
        subtitle={`${fundings.filter(f => f.status === 'reçu' && filterByPeriod(f.date_sent)).length} financements reçus`}
        trend={8.3}
      />
      <KpiCard
        label="Total dépensé"
        value={formatCurrency(kpis.totalSpent)}
        icon={<TrendingDown size={20} />}
        color="amber"
        subtitle={`${expenses.filter(e => e.status === 'validée' && filterByPeriod(e.date)).length} dépenses validées`}
        trend={-5.2}
      />
      <KpiCard
        label="Budget restant"
        value={formatCurrency(kpis.budgetRemaining)}
        icon={<PiggyBank size={20} />}
        color="emerald"
        trend={15.7}
      />
      <KpiCard
        label="Investissements en cours"
        value={String(kpis.ongoingProjects)}
        icon={<HardHat size={20} />}
        color="dark"
      />
      <KpiCard
        label="Justificatifs à vérifier"
        value={String(kpis.docsToVerify)}
        icon={<FileCheck size={20} />}
        color="amber"
      />
      <KpiCard
        label="Alertes"
        value={String(kpis.openAlerts)}
        icon={<Bell size={20} />}
        color="red"
      />
      <KpiCard
        label="Campagnes actives"
        value={String(kpis.activeCampaigns)}
        icon={<Sprout size={20} />}
        color="green"
      />
    </div>
  );
}