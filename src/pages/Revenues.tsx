import { useMemo, useState } from 'react';
import { Search, TrendingUp, ArrowUpRight, CircleDollarSign, CalendarRange, CheckCircle2 } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { buildRevenueEntries, calculateRevenueTotals, REVENUE_STATUS_COLORS, REVENUE_STATUS_OPTIONS, type RevenueEntry, type RevenueStatus } from '@/lib/business';
import { formatCurrency, formatDate } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/Badge';

export function Revenues() {
  const { harvests, transactions } = useData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RevenueStatus>('all');

  const entries = useMemo<RevenueEntry[]>(() => buildRevenueEntries(harvests, transactions), [harvests, transactions]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return entries.filter((entry) => {
      const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
      const matchesSearch = !q || [entry.label, entry.customer, entry.source].some((value) => value.toLowerCase().includes(value));
      return matchesStatus && matchesSearch;
    });
  }, [entries, search, statusFilter]);

  const totals = useMemo(() => calculateRevenueTotals(entries), [entries]);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Revenus de vente"
        subtitle="Suivi du chiffre d’affaires et des encaissements"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total revenus" value={formatCurrency(totals.total, 'FCFA')} icon={<TrendingUp size={20} />} color="green" />
        <KpiCard label="Validées" value={formatCurrency(totals.valid, 'FCFA')} icon={<CheckCircle2 size={20} />} color="blue" />
        <KpiCard label="En attente" value={formatCurrency(totals.pending, 'FCFA')} icon={<CalendarRange size={20} />} color="amber" />
        <KpiCard label="Moyenne / vente" value={formatCurrency(totals.average, 'FCFA')} icon={<CircleDollarSign size={20} />} color="dark" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            type="text"
            placeholder="Rechercher une vente, un client ou une source"
            className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as 'all' | RevenueStatus)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
        >
          {REVENUE_STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'all' ? 'Tous statuts' : option === 'validé' ? 'Validées' : option === 'prévu' ? 'Prévu' : 'En attente'}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<TrendingUp size={36} />}
          title="Aucun revenu de vente"
          message="Aucune donnée de chiffre d’affaires n’a été trouvée pour cette période."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Libellé</th>
                  <th className="px-4 py-3 text-left font-medium">Source</th>
                  <th className="px-4 py-3 text-left font-medium">Client</th>
                  <th className="px-4 py-3 text-right font-medium">Montant</th>
                  <th className="px-4 py-3 text-left font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-600">{formatDate(entry.date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{entry.label}</td>
                    <td className="px-4 py-3 text-slate-600">{entry.source}</td>
                    <td className="px-4 py-3 text-slate-600">{entry.customer}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">
                      <span className="inline-flex items-center gap-1">
                        <ArrowUpRight size={14} />
                        {formatCurrency(entry.amount, entry.currency)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={entry.status} colorMap={REVENUE_STATUS_COLORS} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}