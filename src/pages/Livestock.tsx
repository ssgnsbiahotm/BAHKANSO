import { useMemo, useState } from 'react';
import { Beef, Heart, Scale, Activity } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { formatCurrency, formatDate } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { SimpleBadge } from '@/components/ui/Badge';

export function Livestock() {
  const { animals, animalLots, animalEvents } = useData();
  const [tab, setTab] = useState<'overview' | 'lots' | 'animals' | 'events'>('overview');

  const kpis = useMemo(() => {
    const totalAnimals = animalLots.reduce((s, l) => s + l.count, 0);
    const totalValue = animalLots.reduce((s, l) => s + l.estimated_value, 0);
    const individualValue = animals.reduce((s, a) => s + a.estimated_value, 0);
    const events = animalEvents.length;
    const vaccinations = animalEvents.filter(e => e.type === 'vaccination').length;
    return { totalAnimals, totalValue: totalValue + individualValue, events, vaccinations };
  }, [animals, animalLots, animalEvents]);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader title="Élevage" subtitle="Gestion du cheptel, santé et événements" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total animaux" value={String(kpis.totalAnimals)} icon={<Beef size={20} />} color="green" />
        <KpiCard label="Valeur estimée" value={formatCurrency(kpis.totalValue)} icon={<Scale size={20} />} color="blue" />
        <KpiCard label="Événements" value={String(kpis.events)} icon={<Activity size={20} />} color="amber" />
        <KpiCard label="Vaccinations" value={String(kpis.vaccinations)} icon={<Heart size={20} />} color="red" />
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {(['overview', 'lots', 'animals', 'events'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${tab === t ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {t === 'overview' ? 'Vue d\'ensemble' : t === 'lots' ? 'Lots' : t === 'animals' ? 'Animaux suivis' : 'Événements'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {animalLots.map(lot => (
            <div key={lot.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600"><Beef size={20} /></div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{lot.identifier}</h3>
                    <p className="text-xs text-slate-500">{lot.species} — {lot.breed}</p>
                  </div>
                </div>
                <SimpleBadge color="green">{lot.status}</SimpleBadge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Effectif</span><span className="font-medium">{lot.count} têtes</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Localisation</span><span className="font-medium">{lot.location || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Valeur estimée</span><span className="font-medium text-green-600">{formatCurrency(lot.estimated_value)}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'lots' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Identifiant</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Espèce</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Race</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Effectif</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Localisation</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Valeur</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Statut</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {animalLots.map(l => (
                <tr key={l.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-slate-900">{l.identifier}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{l.species}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{l.breed || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">{l.count}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{l.location || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">{formatCurrency(l.estimated_value)}</td>
                  <td className="px-4 py-3"><SimpleBadge color="green">{l.status}</SimpleBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'animals' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Espèce</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Race</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Sexe</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Naissance</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Poids (kg)</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Valeur</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {animals.map(a => (
                <tr key={a.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-slate-900">{a.identifier}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{a.species}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{a.breed || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{a.sex || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDate(a.birth_date)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">{a.weight_kg || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-600 text-right">{formatCurrency(a.estimated_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'events' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Responsable</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Coût</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {animalEvents.map(e => (
                <tr key={e.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDate(e.date)}</td>
                  <td className="px-4 py-3"><SimpleBadge color={e.type === 'vaccination' ? 'blue' : e.type === 'traitement' ? 'amber' : e.type === 'naissance' ? 'green' : e.type === 'vente' ? 'purple' : 'gray'}>{e.type}</SimpleBadge></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{e.description || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{e.responsible || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">{e.cost ? formatCurrency(e.cost) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
