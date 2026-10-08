import { useMemo, useState } from 'react';
import { Sprout, MapPin, Calendar, Layers, Wheat } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { formatCurrency, formatDate } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { SimpleBadge } from '@/components/ui/Badge';

export function Agriculture() {
  const { plots, campaigns, cropOperations, harvests } = useData();
  const [tab, setTab] = useState<'plots' | 'campaigns' | 'operations' | 'harvests'>('plots');

  const kpis = useMemo(() => {
    const totalArea = plots.reduce((s, p) => s + p.area_hectares, 0);
    const activeCampaigns = campaigns.filter(c => c.status === 'en cours').length;
    const totalOps = cropOperations.length;
    const totalHarvest = harvests.reduce((s, h) => s + h.quantity, 0);
    const totalRevenue = harvests.reduce((s, h) => s + (h.revenue || 0), 0);
    return { totalArea, activeCampaigns, totalOps, totalHarvest, totalRevenue };
  }, [plots, campaigns, cropOperations, harvests]);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader title="Agriculture" subtitle="Gestion des parcelles, campagnes et récoltes" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Surface totale" value={`${kpis.totalArea} ha`} icon={<MapPin size={20} />} color="green" />
        <KpiCard label="Campagnes actives" value={String(kpis.activeCampaigns)} icon={<Calendar size={20} />} color="blue" />
        <KpiCard label="Opérations" value={String(kpis.totalOps)} icon={<Layers size={20} />} color="amber" />
        <KpiCard label="Récoltes (kg)" value={String(kpis.totalHarvest)} icon={<Wheat size={20} />} color="dark" />
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {(['plots', 'campaigns', 'operations', 'harvests'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${tab === t ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {t === 'plots' ? 'Parcelles' : t === 'campaigns' ? 'Campagnes' : t === 'operations' ? 'Opérations' : 'Récoltes'}
          </button>
        ))}
      </div>

      {tab === 'plots' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plots.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600"><Sprout size={20} /></div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{p.reference}</h3>
                    <p className="text-xs text-slate-500">{p.name}</p>
                  </div>
                </div>
                <SimpleBadge color="green">{p.status}</SimpleBadge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Superficie</span><span className="font-medium">{p.area_hectares} ha</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Culture actuelle</span><span className="font-medium">{p.current_crop || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Type de sol</span><span className="font-medium">{p.soil_type || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Localisation</span><span className="font-medium">{p.location || '—'}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'campaigns' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Année</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Parcelle</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Culture</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Début</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Récolte prévue</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Budget</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Statut</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{c.year}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{c.plot?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{c.crop_name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDate(c.start_date)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDate(c.expected_harvest_date)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">{formatCurrency(c.budget)}</td>
                  <td className="px-4 py-3"><SimpleBadge color={c.status === 'en cours' ? 'green' : 'gray'}>{c.status}</SimpleBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'operations' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Responsable</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Intrants</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Coût</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Main-d'œuvre</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {cropOperations.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDate(o.date)}</td>
                  <td className="px-4 py-3"><SimpleBadge color="green">{o.type}</SimpleBadge></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{o.responsible || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{o.inputs || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">{formatCurrency(o.cost)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 text-right">{formatCurrency(o.labor_cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'harvests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {harvests.length === 0 ? (
            <p className="text-sm text-slate-400 col-span-2 text-center py-8">Aucune récolte enregistrée</p>
          ) : harvests.map(h => (
            <div key={h.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wheat size={20} className="text-amber-600" />
                  <h3 className="font-semibold text-slate-900">Récolte du {formatDate(h.date)}</h3>
                </div>
                <SimpleBadge color="amber">{h.quality}</SimpleBadge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Quantité</span><p className="font-medium">{h.quantity} {h.unit}</p></div>
                <div><span className="text-slate-500">Prix estimé</span><p className="font-medium">{formatCurrency(h.estimated_price)}</p></div>
                <div><span className="text-slate-500">Chiffre d'affaires</span><p className="font-medium text-green-600">{formatCurrency(h.revenue)}</p></div>
                <div><span className="text-slate-500">Destination</span><p className="font-medium">{h.destination || '—'}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
