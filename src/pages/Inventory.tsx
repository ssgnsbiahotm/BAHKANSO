import { useMemo, useState } from 'react';
import { Package, AlertTriangle, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { SimpleBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';

export function Inventory() {
  const { inventoryItems, inventoryMovements, inventoryCounts } = useData();
  const [tab, setTab] = useState<'items' | 'movements' | 'counts'>('items');

  const kpis = useMemo(() => {
    const totalValue = inventoryItems.reduce((s, i) => s + i.current_stock * i.unit_cost, 0);
    const lowStock = inventoryItems.filter(i => i.current_stock < i.min_stock).length;
    const anomalies = inventoryCounts.filter(c => c.difference !== 0 && c.status === 'en attente').length;
    return { totalValue, lowStock, anomalies, count: inventoryItems.length };
  }, [inventoryItems, inventoryCounts]);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader title="Stocks" subtitle="Gestion de l'inventaire et des mouvements" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Articles" value={String(kpis.count)} icon={<Package size={20} />} color="dark" />
        <KpiCard label="Valeur du stock" value={formatCurrency(kpis.totalValue)} icon={<Package size={20} />} color="green" />
        <KpiCard label="Stock faible" value={String(kpis.lowStock)} icon={<AlertTriangle size={20} />} color="amber" />
        <KpiCard label="Anomalies" value={String(kpis.anomalies)} icon={<AlertTriangle size={20} />} color="red" />
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {(['items', 'movements', 'counts'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${tab === t ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {t === 'items' ? 'Inventaire' : t === 'movements' ? 'Mouvements' : 'Inventaires physiques'}
          </button>
        ))}
      </div>

      {tab === 'items' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventoryItems.map(i => {
            const isLow = i.current_stock < i.min_stock;
            return (
              <div key={i.id} className={`bg-white rounded-xl border p-5 ${isLow ? 'border-amber-300' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isLow ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                      <Package size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{i.name}</h3>
                      <p className="text-xs text-slate-500">{i.category}</p>
                    </div>
                  </div>
                  {isLow && <SimpleBadge color="amber">Stock faible</SimpleBadge>}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Stock actuel</span><span className={`font-bold ${isLow ? 'text-amber-600' : 'text-slate-900'}`}>{i.current_stock} {i.unit}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Stock minimum</span><span className="font-medium">{i.min_stock} {i.unit}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Coût unitaire</span><span className="font-medium">{formatCurrency(i.unit_cost)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Valeur totale</span><span className="font-medium text-green-600">{formatCurrency(i.current_stock * i.unit_cost)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Emplacement</span><span className="font-medium">{i.location || '—'}</span></div>
                </div>
                <div className="mt-3">
                  <ProgressBar value={i.current_stock} max={Math.max(i.min_stock * 3, i.current_stock)} color={isLow ? 'amber' : 'green'} size="sm" showLabel label="Niveau" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'movements' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Article</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Quantité</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Raison</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Responsable</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {inventoryMovements.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDateTime(m.date)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{m.item?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs ${m.type === 'achat' || m.type === 'entrée' ? 'text-green-600' : m.type === 'consommation' || m.type === 'perte' ? 'text-red-600' : 'text-blue-600'}`}>
                      {m.type === 'achat' || m.type === 'entrée' ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
                      {m.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">{m.quantity} {m.item?.unit || ''}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{m.reason || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{m.responsible || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'counts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inventoryCounts.map(c => (
            <div key={c.id} className={`bg-white rounded-xl border p-5 ${c.difference !== 0 ? 'border-red-300' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">{c.item?.name || 'Article'}</h3>
                <SimpleBadge color={c.difference !== 0 ? 'red' : 'green'}>{c.status}</SimpleBadge>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Théorique</p>
                  <p className="font-bold text-slate-900">{c.theoretical_stock}</p>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Physique</p>
                  <p className="font-bold text-slate-900">{c.physical_stock}</p>
                </div>
                <div className={`text-center p-2 rounded-lg ${c.difference < 0 ? 'bg-red-50' : c.difference > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                  <p className="text-xs text-slate-500">Écart</p>
                  <p className={`font-bold ${c.difference < 0 ? 'text-red-600' : c.difference > 0 ? 'text-amber-600' : 'text-green-600'}`}>{c.difference > 0 ? '+' : ''}{c.difference}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">{c.justification || 'Aucune justification'}</p>
              <p className="text-xs text-slate-400 mt-1">Comptage du {formatDate(c.count_date)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
