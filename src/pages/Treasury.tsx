import { useMemo } from 'react';
import { Landmark, Wallet, ArrowDownCircle, ArrowUpCircle, ArrowRightLeft } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { BarChart } from '@/components/ui/Charts';

export function Treasury() {
  const { bankAccounts, cashAccounts, transactions } = useData();

  const totals = useMemo(() => {
    const bankTotal = bankAccounts.reduce((s, a) => s + a.balance, 0);
    const cashTotal = cashAccounts.reduce((s, a) => s + a.balance, 0);
    return { bankTotal, cashTotal, grandTotal: bankTotal + cashTotal };
  }, [bankAccounts, cashAccounts]);

  const flowData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const data = months.map(label => ({ label, value: 0 }));
    transactions.forEach(t => {
      const d = new Date(t.transaction_date);
      const mi = d.getMonth();
      if (mi >= 0 && mi < 12) {
        data[mi].value += t.direction === 'in' ? t.amount : -t.amount;
      }
    });
    const nonEmpty = data.filter(d => d.value !== 0);
    return nonEmpty.length > 0 ? nonEmpty : data.slice(0, 6);
  }, [transactions]);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader title="Trésorerie" subtitle="Vue d'ensemble de la trésorerie de l'exploitation" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Solde total" value={formatCurrency(totals.grandTotal)} icon={<Wallet size={20} />} color="green" />
        <KpiCard label="Banques" value={formatCurrency(totals.bankTotal)} icon={<Landmark size={20} />} color="blue" />
        <KpiCard label="Caisses" value={formatCurrency(totals.cashTotal)} icon={<Wallet size={20} />} color="amber" />
        <KpiCard label="Mouvements" value={String(transactions.length)} icon={<ArrowRightLeft size={20} />} color="dark" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Comptes bancaires</h3>
          <div className="space-y-3">
            {bankAccounts.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    <Landmark size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.bank_name} · {a.account_number?.slice(-4).padStart(8, '•')}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(a.balance, a.currency)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Caisses</h3>
          <div className="space-y-3">
            {cashAccounts.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                    <Wallet size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.location} · {a.responsible}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(a.balance, a.currency)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">Flux de trésorerie (entrées/sorties)</h3>
        <BarChart data={flowData} formatValue={v => formatCurrency(v)} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Mouvements récents</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Référence</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDateTime(t.transaction_date)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-900">{t.reference}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs ${
                      t.direction === 'in' ? 'text-green-600' : t.direction === 'out' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {t.direction === 'in' ? <ArrowDownCircle size={14} /> : t.direction === 'out' ? <ArrowUpCircle size={14} /> : <ArrowRightLeft size={14} />}
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{t.description}</td>
                  <td className={`px-4 py-3 text-sm font-medium text-right ${
                    t.direction === 'in' ? 'text-green-600' : t.direction === 'out' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {t.direction === 'in' ? '+' : t.direction === 'out' ? '-' : ''}{formatCurrency(t.amount, t.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
