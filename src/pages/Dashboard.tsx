import { useMemo, useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, HardHat, FileCheck, Bell, ArrowRight, Clock, Sprout } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { formatCurrency, timeAgo } from '@/lib/format';
import { KpiCard } from '@/components/ui/KpiCard';
import { LineChart, DonutChart } from '@/components/ui/Charts';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PageHeader } from '@/components/ui/PageHeader';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { farm, expenses, fundings, bankAccounts, cashAccounts, projects, documents, alerts, auditLogs, inventoryItems, campaigns, transactions } = useData();
  const [period, setPeriod] = useState<'2026' | '2025' | 'all'>('2026');

  const filterByPeriod = useMemo(() => {
    return (dateStr: string | null | undefined) => {
      if (!dateStr) return true;
      if (period === 'all') return true;
      return dateStr.startsWith(period);
    };
  }, [period]);

  const kpis = useMemo(() => {
    const periodFundings = fundings.filter(f => filterByPeriod(f.date_sent));
    const periodExpenses = expenses.filter(e => filterByPeriod(e.date));
    const totalFunded = periodFundings.filter(f => f.status === 'reçu').reduce((s, f) => s + (f.amount_received || 0), 0);
    const totalSpent = periodExpenses.filter(e => e.status === 'validée').reduce((s, e) => s + e.amount, 0);
    const bankTotal = bankAccounts.reduce((s, a) => s + a.balance, 0);
    const cashTotal = cashAccounts.reduce((s, a) => s + a.balance, 0);
    const treasury = bankTotal + cashTotal;
    const budgetRemaining = totalFunded - totalSpent;
    const ongoingProjects = projects.filter(p => p.status === 'en cours').length;
    const docsToVerify = documents.filter(d => d.status === 'à vérifier').length;
    const openAlerts = alerts.filter(a => a.status === 'ouverte').length;
    return { totalFunded, totalSpent, treasury, budgetRemaining, ongoingProjects, docsToVerify, openAlerts };
  }, [expenses, fundings, bankAccounts, cashAccounts, projects, documents, alerts, filterByPeriod]);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.filter(e => e.status === 'validée' && filterByPeriod(e.date)).forEach(e => {
      const cat = e.category || 'Autre';
      map[cat] = (map[cat] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [expenses, filterByPeriod]);

  const treasuryFlow = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const year = period === 'all' ? null : parseInt(period);
    const data = months.map(label => ({ label, income: 0, expense: 0 }));

    fundings.filter(f => f.status === 'reçu' && f.date_sent).forEach(f => {
      const d = new Date(f.date_sent);
      if (year && d.getFullYear() !== year) return;
      const mi = d.getMonth();
      data[mi].income += f.amount_received || f.amount_sent;
    });
    transactions.filter(t => t.direction === 'in' && t.transaction_date).forEach(t => {
      const d = new Date(t.transaction_date);
      if (year && d.getFullYear() !== year) return;
      const mi = d.getMonth();
      data[mi].income += t.amount;
    });
    expenses.filter(e => e.status === 'validée' && e.date).forEach(e => {
      const d = new Date(e.date);
      if (year && d.getFullYear() !== year) return;
      const mi = d.getMonth();
      data[mi].expense += e.amount;
    });
    transactions.filter(t => t.direction === 'out' && t.transaction_date).forEach(t => {
      const d = new Date(t.transaction_date);
      if (year && d.getFullYear() !== year) return;
      const mi = d.getMonth();
      data[mi].expense += t.amount;
    });

    return data.filter(d => d.income > 0 || d.expense > 0).length > 0
      ? data.filter(d => d.income > 0 || d.expense > 0)
      : data.slice(0, 6);
  }, [fundings, expenses, transactions, period]);

  const maxValue = useMemo(() => {
    const allVals = treasuryFlow.flatMap(d => [d.income, d.expense]);
    return Math.max(...allVals, 1);
  }, [treasuryFlow]);

  const budgetVsActual = useMemo(() => {
    return projects.slice(0, 4).map(p => ({
      label: p.name.substring(0, 15),
      budget: p.revised_budget || p.initial_budget,
      actual: expenses.filter(e => e.project_id === p.id && e.status === 'validée').reduce((s, e) => s + e.amount, 0),
    }));
  }, [projects, expenses]);

  const toVerify = useMemo(() => {
    const items: { type: string; desc: string; amount: string; page: string }[] = [];
    expenses.filter(e => !e.has_justificatif && e.status !== 'annulée' && e.status !== 'rejetée').forEach(e => {
      items.push({ type: 'Dépense sans justificatif', desc: `${e.reference} — ${e.description || ''}`, amount: formatCurrency(e.amount), page: 'expenses' });
    });
    expenses.filter(e => e.status === 'en attente').forEach(e => {
      items.push({ type: 'Validation en attente', desc: `${e.reference} — ${e.description || ''}`, amount: formatCurrency(e.amount), page: 'expenses?pending' });
    });
    inventoryItems.filter(i => i.current_stock < i.min_stock).forEach(i => {
      items.push({ type: 'Stock faible', desc: `${i.name} — ${i.current_stock} ${i.unit} (min: ${i.min_stock})`, amount: '', page: 'inventory' });
    });
    projects.filter(p => p.status === 'en retard').forEach(p => {
      items.push({ type: 'Projet en retard', desc: p.name, amount: '', page: 'projects' });
    });
    return items.slice(0, 6);
  }, [expenses, inventoryItems, projects]);

  const recentActivity = useMemo(() => {
    return auditLogs.slice(0, 8).map(log => ({
      ...log,
      timeStr: timeAgo(log.created_at),
    }));
  }, [auditLogs]);

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
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Trésorerie disponible"
          value={formatCurrency(kpis.treasury)}
          icon={<Wallet size={20} />}
          color="green"
        />
        <KpiCard
          label="Total financé"
          value={formatCurrency(kpis.totalFunded)}
          icon={<TrendingUp size={20} />}
          color="blue"
          subtitle={`${fundings.filter(f => f.status === 'reçu' && filterByPeriod(f.date_sent)).length} financements reçus`}
        />
        <KpiCard
          label="Total dépensé"
          value={formatCurrency(kpis.totalSpent)}
          icon={<TrendingDown size={20} />}
          color="amber"
          subtitle={`${expenses.filter(e => e.status === 'validée' && filterByPeriod(e.date)).length} dépenses validées`}
        />
        <KpiCard
          label="Budget restant"
          value={formatCurrency(kpis.budgetRemaining)}
          icon={<PiggyBank size={20} />}
          color="emerald"
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
          value={String(campaigns.filter(c => c.status === 'en cours').length)}
          icon={<Sprout size={20} />}
          color="green"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Évolution de la trésorerie</h3>
          {treasuryFlow.length > 0 ? (
            <LineChart
              data={treasuryFlow.map(d => ({ label: d.label, value: d.income - d.expense }))}
              formatValue={v => formatCurrency(v)}
            />
          ) : (
            <p className="text-sm text-slate-400 py-8 text-center">Aucune donnée pour cette période</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Financements vs Dépenses</h3>
          <div className="flex items-end gap-2" style={{ height: 200 }}>
            {treasuryFlow.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full flex-1 flex items-end gap-0.5">
                  <div className="flex-1 bg-blue-500 rounded-t-md transition-all duration-700 hover:bg-blue-600" style={{ height: `${(d.income / maxValue) * 100}%`, minHeight: d.income > 0 ? '4px' : '0' }} title={formatCurrency(d.income)} />
                  <div className="flex-1 bg-amber-500 rounded-t-md transition-all duration-700 hover:bg-amber-600" style={{ height: `${(d.expense / maxValue) * 100}%`, minHeight: d.expense > 0 ? '4px' : '0' }} title={formatCurrency(d.expense)} />
                </div>
                <span className="text-xs text-slate-500">{d.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 rounded" />Financements</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-500 rounded" />Dépenses</span>
          </div>
        </div>
      </div>

      {/* Budget vs Actual + Expense breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Budget vs Réel par projet</h3>
          <div className="space-y-3">
            {budgetVsActual.length > 0 ? budgetVsActual.map((b, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">{b.label}</span>
                  <span className="text-slate-900 font-medium">{formatCurrency(b.actual)} / {formatCurrency(b.budget)}</span>
                </div>
                <ProgressBar value={b.actual} max={b.budget} color="green" />
              </div>
            )) : (
              <p className="text-sm text-slate-400 py-4 text-center">Aucun projet</p>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Répartition des dépenses</h3>
          {expenseByCategory.length > 0 ? (
            <DonutChart
              data={expenseByCategory.map((d, i) => ({
                label: d.label,
                value: d.value,
                color: ['#166534', '#22C55E', '#2563EB', '#F59E0B', '#DC2626', '#8B5CF6'][i],
              }))}
              formatValue={v => formatCurrency(v)}
            />
          ) : (
            <p className="text-sm text-slate-400 py-8 text-center">Aucune dépense validée</p>
          )}
        </div>
      </div>

      {/* To verify + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">À vérifier</h3>
            <button onClick={() => onNavigate('alerts')} className="text-xs text-green-600 hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {toVerify.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Rien à vérifier</p>
            ) : (
              toVerify.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => onNavigate(item.page)}>
                  <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{item.type}</p>
                    <p className="text-xs text-slate-500 truncate">{item.desc}</p>
                  </div>
                  {item.amount && <span className="text-sm font-medium text-slate-700">{item.amount}</span>}
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Activité récente</h3>
            <button onClick={() => onNavigate('audit')} className="text-xs text-green-600 hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Aucune activité</p>
            ) : recentActivity.map(log => (
              <div key={log.id} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock size={14} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900">
                    <span className="font-medium">{log.user_name}</span> — {log.description}
                  </p>
                  <p className="text-xs text-slate-400">{log.timeStr}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
