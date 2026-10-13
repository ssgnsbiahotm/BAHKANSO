import React from 'react';
import { LineChart, DonutChart } from '@/components/ui/Charts';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useData } from '@/lib/DataContext';
import { formatCurrency } from '@/lib/format';
import { matchesPeriod } from '@/lib/business';

interface ChartsSectionProps {
  period: '2026' | '2025' | 'all';
}

export function ChartsSection({ period }: ChartsSectionProps) {
  const { fundings, expenses, transactions, projects } = useData();

  const filterByPeriod = (dateStr: string | null | undefined) => matchesPeriod(dateStr, period);

  // Treasury flow data (monthly income vs expenses)
  const treasuryFlow = () => {
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
  };

  // Expense by category data
  const expenseByCategory = () => {
    const map: Record<string, number> = {};
    expenses.filter(e => e.status === 'validée' && filterByPeriod(e.date)).forEach(e => {
      const cat = e.category || 'Autre';
      map[cat] = (map[cat] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  };

  // Budget vs actual data
  const budgetVsActual = () => {
    return projects.slice(0, 4).map(p => ({
      label: p.name.substring(0, 15),
      budget: p.revised_budget || p.initial_budget,
      actual: expenses.filter(e => e.project_id === p.id && e.status === 'validée').reduce((s, e) => s + e.amount, 0),
    }));
  };

  const maxValue = () => {
    const flow = treasuryFlow();
    const allVals = flow.flatMap(d => [d.income, d.expense]);
    return Math.max(...allVals, 1);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Évolution de la trésorerie</h3>
        {treasuryFlow().length > 0 ? (
          <LineChart
            data={treasuryFlow().map(d => ({ label: d.label, value: d.income - d.expense }))}
            formatValue={v => formatCurrency(v)}
          />
        ) : (
          <p className="text-sm text-slate-400 py-8 text-center">Aucune donnée pour cette période</p>
        )}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Financements vs Dépenses</h3>
        <div className="flex items-end gap-2" style={{ height: 200 }}>
          {treasuryFlow().map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="w-full flex-1 flex items-end gap-0.5">
                <div className="w-full flex-1 flex items-end gap-0.5">
                  <div className="flex-1 bg-blue-500 rounded-t-md transition-all duration-700 hover:bg-blue-600" style={{ height: `${(d.income / maxValue()) * 100}%`, minHeight: d.income > 0 ? '4px' : '0' }} title={formatCurrency(d.income)} />
                  <div className="flex-1 bg-amber-500 rounded-t-md transition-all duration-700 hover:bg-amber-600" style={{ height: `${(d.expense / maxValue()) * 100}%`, minHeight: d.expense > 0 ? '4px' : '0' }} title={formatCurrency(d.expense)} />
                </div>
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

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Budget vs Réel par projet</h3>
        <div className="space-y-3">
          {budgetVsActual().length > 0 ? budgetVsActual().map((b, i) => (
            <div key={i}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600">{b.label}</span>
                <span className="text-slate-900 font-medium">{formatCurrency(b.actual)} / {formatCurrency(b.budget)}</span>
              </div>
              <ProgressBar value={b.actual} max={b.budget} color="green" />
            }
          )) : (
            <p className="text-sm text-slate-400 py-4 text-center">Aucun projet</p>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Répartition des dépenses</h3>
        {expenseByCategory().length > 0 ? (
          <DonutChart
            data={expenseByCategory().map((d, i) => ({
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
  );
}