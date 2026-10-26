import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/lib/DataContext';
import { formatCurrency, formatDate } from '@/lib/format';
import { RotatingCard } from '@/components/ui/RotatingCard';
import { Eye } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { SimpleBadge } from '@/components/ui/Badge';

export function Agriculture() {
  const { plots, campaigns, cropOperations, harvests } = useData();
  const [tab, setTab] = useState<'plots' | 'campaigns' | 'operations' | 'harvests'>('plots');
  const navigate = useNavigate();

  const kpis = useMemo(() => {
    const totalArea = plots.reduce((s, p) => s + p.area_hectares, 0);
    // Parcelles actives : count where status === 'actif' || 'active'
    const activeParcels = {
      active: plots.filter(p => p.status === 'actif' || p.status === 'active').length,
      total: plots.length
    };
    const totalOps = cropOperations.length;
    const totalHarvest = harvests.reduce((s, h) => s + h.quantity, 0);
    const totalRevenue = harvests.reduce((s, h) => s + (h.revenue || 0), 0);
    return { totalArea, activeParcels, totalOps, totalHarvest, totalRevenue };
  }, [plots, campaigns, cropOperations, harvests]);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Agriculture"
        subtitle="Gestion des parcelles, campagnes et récoltes"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Surface totale : somme de toutes les parcelles (actives + inactives) */}
        <KpiCard label="Surface totale" value={`${(kpis.totalArea).toFixed(1)} ha`} icon={null} color="green" />
        {/* Parcelles actives : count where status === 'actif' || 'active', display "X / Y" */}
        <KpiCard label="Parcelles actives" value={`${kpis.activeParcels.active} / ${kpis.activeParcels.total}`} icon={null} color="blue" />
        {/* Opérations : length de la liste cropOperations */}
        <KpiCard label="Opérations" value={String(kpis.totalOps)} icon={null} color="amber" />
        {/* Récoltes (kg) : somme avec format "X kg" ou "X.X t" si > 1000 kg */}
        <KpiCard label="Récoltes (kg)" value={`${kpis.totalHarvest.toLocaleString('fr-FR')} kg`} icon={null} color="dark" />
      </div>

      {tab === 'plots' && (
        <>
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900">Parcelles agricoles</h2>
            </div>
            <p className="mt-2 text-slate-600">
              Gérer les parcelles sur la page de gestion détaillée.
              <a
                href="/app/agriculture/plots"
                className="text-green-600 underline underline-offset-4 hover:text-green-700 ml-1"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/app/agriculture/plots');
                }}
              >
                Ouvrir la gestion des parcelles
              </a>
            </p>
          </div>
          {plots.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Aucune parcelle enregistrée</h3>
              <p className="text-slate-600 mb-6">
                Commencez par définir vos parcelles agricoles pour suivre l'utilisation de vos terres et planifier vos cultures.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => navigate('/app/agriculture/plots')}
                  className="px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
                >
                  Créer ma première parcelle
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plots.map(p => (
                <RotatingCard
                  key={p.id}
                  flipLabel="Détails"
                  backLabel="Retour"
                  front={
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full flex flex-col justify-between">
                      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">{p.name}</h3>
            <p className="text-sm text-slate-500">{p.location || '—'}</p>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'actif' || p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {p.status || 'actif'}
          </span>
        </div>
        <div className="space-y-1 text-sm">
          <p><span className="text-slate-500">Culture actuelle :</span> <span className="font-medium">{p.current_crop || '—'}</span></p>
          <p><span className="text-slate-500">Superficie :</span> <span className="font-medium">{p.area_hectares} ha</span></p>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-sm text-emerald-700 font-medium">Voir les détails →</p>
      </div>
    </div>
  }
  back={
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm h-full flex flex-col justify-between">
      <div className="space-y-2 text-sm">
        <h3 className="font-semibold text-slate-900 mb-3">{p.name}</h3>
        <p><span className="text-slate-500">Culture :</span> {p.current_crop || '—'}</p>
        <p><span className="text-slate-500">Superficie :</span> {p.area_hectares} ha</p>
        <p><span className="text-slate-500">Type de sol :</span> {p.soil_type || '—'}</p>
        <p><span className="text-slate-500">Localisation :</span> {p.location || '—'}</p>
      </div>
      <div className="mt-4 pt-3 border-t border-emerald-200">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate('/app/exploitation/journal/' + p.id); }}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
        >
          <Eye size={16} /> Ouvrir le journal
        </button>
      </div>
    </div>
  }
/>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'campaigns' && (
        <>
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900">Campagnes culturales</h2>
            </div>
            <p className="mt-2 text-slate-600">
              Gérer les campagnes sur la page de gestion détaillée.
              <a
                href="/app/agriculture/campaigns"
                className="text-green-600 underline underline-offset-4 hover:text-green-700 ml-1"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/app/agriculture/campaigns');
                }}
              >
                Ouvrir la gestion des campagnes
              </a>
            </p>
          </div>
          {campaigns.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Aucune campagne enregistrée</h3>
              <p className="text-slate-600 mb-6">
                Définissez vos premières campagnes culturales pour planifier vos cultures sur l'année et suivre leurs progrès.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => navigate('/app/agriculture/campaigns')}
                  className="px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
                >
                  Créer ma première campagne
                </button>
              </div>
            </div>
          ) : (
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
                      <td className="px-4 py-3"><SimpleBadge color={
                        c.status === 'planned' ? 'yellow' :
                        c.status === 'planted' ? 'blue' :
                        c.status === 'growing' ? 'green' :
                        c.status === 'harvested' ? 'amber' :
                        'gray'
                      }>{c.status}</SimpleBadge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'operations' && (
        <>
          <div className="mb-4">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-900">Opérations culturales</h2>
            </div>
            <p className="mt-2 text-slate-600">
              Gérer les opérations sur la page de gestion détaillée.
              <a
                href="/app/agriculture/operations"
                className="text-green-600 underline underline-offset-4 hover:text-green-700 ml-1"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/app/agriculture/operations');
                }}
              >
                Ouvrir la gestion des opérations
              </a>
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {cropOperations.length === 0 ? (
            <div className="p-8 text-center">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Aucune opération enregistrée</h3>
              <p className="text-slate-600 mb-6">
                Enregistrez vos premières opérations culturales (semis, traitements, irrigation, etc.) pour suivre les interventions sur vos parcelles.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => navigate('/app/agriculture/operations')}
                  className="px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
                >
                  Enregistrer ma première opération
                </button>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </>
      )}

      {tab === 'harvests' && (
        <>
          <div className="mb-4">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-900">Récoltes agricoles</h2>
            </div>
            <p className="mt-2 text-slate-600">
              Gérer les récoltes sur la page de gestion détaillée.
              <a
                href="/app/agriculture/harvests"
                className="text-green-600 underline underline-offset-4 hover:text-green-700 ml-1"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/app/agriculture/harvests');
                }}
              >
                Ouvrir la gestion des récoltes
              </a>
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {harvests.length === 0 ? (
            <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-8 text-center">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Aucune récolte enregistrée</h3>
              <p className="text-slate-600 mb-6">
                Enregistrez vos premières récoltes pour suivre vos rendements et évaluer la productivité de vos cultures.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => navigate('/app/agriculture/harvests')}
                  className="px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
                >
                  Enregistrer ma première récolte
                </button>
              </div>
            </div>
          ) : harvests.map(h => (
            <div key={h.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">Récolte du {formatDate(h.date)}</h3>
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
      </>
      )}
    </div>
  );
}
