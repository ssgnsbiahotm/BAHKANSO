import { useState } from 'react';
import { FileBarChart, Download, FileText } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToast } from '@/lib/Toast';

export function Reports() {
  const { fundings, expenses, projects, harvests, animalLots } = useData();
  const toast = useToast();
  const [selectedReport, setSelectedReport] = useState('financial');

  const reports = [
    { id: 'financial', label: 'Rapport financier', icon: <FileBarChart size={20} />, color: 'bg-blue-50 text-blue-600' },
    { id: 'agricultural', label: 'Rapport agricole', icon: <FileText size={20} />, color: 'bg-green-50 text-green-600' },
    { id: 'livestock', label: 'Rapport élevage', icon: <FileText size={20} />, color: 'bg-amber-50 text-amber-600' },
    { id: 'investment', label: 'Rapport investissements', icon: <FileText size={20} />, color: 'bg-purple-50 text-purple-600' },
    { id: 'funder', label: 'Rapport financeur', icon: <FileText size={20} />, color: 'bg-cyan-50 text-cyan-600' },
  ];

  const financialData = () => {
    const totalFunded = fundings.filter(f => f.status === 'reçu').reduce((s, f) => s + (f.amount_received || 0), 0);
    const totalSpent = expenses.filter(e => e.status === 'validée').reduce((s, e) => s + e.amount, 0);
    const byCategory: Record<string, number> = {};
    expenses.filter(e => e.status === 'validée').forEach(e => {
      byCategory[e.category || 'Autre'] = (byCategory[e.category || 'Autre'] || 0) + e.amount;
    });
    return { totalFunded, totalSpent, byCategory };
  };

  const fin = financialData();

  const buildCsv = (): string => {
    const rows: string[] = [];
    rows.push('Type,Reference,Date,Montant,Devise,Statut,Categorie,Description');

    if (selectedReport === 'financial') {
      expenses.forEach(e => {
        rows.push([
          'Dépense', e.reference, e.date, String(e.amount), e.currency || 'FCFA',
          e.status, e.category || '', (e.description || '').replace(/,/g, ';'),
        ].join(','));
      });
    } else if (selectedReport === 'investment') {
      projects.forEach(p => {
        rows.push([
          'Projet', p.name, '', String(p.revised_budget || p.initial_budget),
          'FCFA', p.status, '', (p.description || '').replace(/,/g, ';'),
        ].join(','));
      });
    } else if (selectedReport === 'funder') {
      fundings.forEach(f => {
        rows.push([
          'Financement', f.reference, f.date_sent, String(f.amount_received || f.amount_sent),
          f.currency_sent || 'FCFA', f.status, f.funder?.name || '', (f.comment || '').replace(/,/g, ';'),
        ].join(','));
      });
    } else if (selectedReport === 'agricultural') {
      harvests.forEach(h => {
        rows.push([
          'Récolte', String(h.id), h.date, String(h.quantity), h.unit,
          h.quality || '', h.destination || '',
        ].join(','));
      });
    } else if (selectedReport === 'livestock') {
      animalLots.forEach(l => {
        rows.push([
          'Lot', String(l.id), '', String(l.estimated_value), 'FCFA', '', l.species || '', (l.location || '').replace(/,/g, ';'),
        ].join(','));
      });
    }

    return rows.join('\n');
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const csv = buildCsv();
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapport-${selectedReport}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.show('Export CSV généré');
    } else {
      toast.show('Export PDF non disponible — utilisez l\'export CSV', 'info');
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Rapports"
        subtitle="Génération de rapports et exports"
        actions={
          <>
            <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700">
              <Download size={16} /> Export CSV
            </button>
            <button onClick={() => handleExport('pdf')} disabled className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-300 text-slate-500 rounded-lg cursor-not-allowed" title="Export PDF non disponible">
              <Download size={16} /> Export PDF
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="space-y-2">
            {reports.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedReport(r.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                  selectedReport === r.id ? 'bg-green-50 border-green-300' : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${r.color}`}>{r.icon}</div>
                <span className={`text-sm font-medium ${selectedReport === r.id ? 'text-green-700' : 'text-slate-700'}`}>{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            {selectedReport === 'financial' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 text-lg">Rapport financier</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg"><p className="text-xs text-slate-500">Total financé</p><p className="text-xl font-bold text-slate-900">{formatCurrency(fin.totalFunded)}</p></div>
                  <div className="p-4 bg-amber-50 rounded-lg"><p className="text-xs text-slate-500">Total dépensé</p><p className="text-xl font-bold text-slate-900">{formatCurrency(fin.totalSpent)}</p></div>
                  <div className="p-4 bg-green-50 rounded-lg"><p className="text-xs text-slate-500">Solde</p><p className="text-xl font-bold text-green-600">{formatCurrency(fin.totalFunded - fin.totalSpent)}</p></div>
                  <div className="p-4 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">Nb dépenses</p><p className="text-xl font-bold text-slate-900">{expenses.length}</p></div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Dépenses par catégorie</h4>
                  <div className="space-y-2">
                    {Object.entries(fin.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                      <div key={cat} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-600">{cat}</span>
                        <span className="text-sm font-medium text-slate-900">{formatCurrency(amt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'agricultural' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 text-lg">Rapport agricole</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg"><p className="text-xs text-slate-500">Récoltes totales</p><p className="text-xl font-bold text-slate-900">{harvests.reduce((s, h) => s + h.quantity, 0)} kg</p></div>
                  <div className="p-4 bg-amber-50 rounded-lg"><p className="text-xs text-slate-500">Chiffre d'affaires</p><p className="text-xl font-bold text-slate-900">{formatCurrency(harvests.reduce((s, h) => s + (h.revenue || 0), 0))}</p></div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Détail des récoltes</h4>
                  <div className="space-y-2">
                    {harvests.length === 0 ? (
                      <p className="text-sm text-slate-400 py-4 text-center">Aucune récolte enregistrée</p>
                    ) : harvests.map(h => (
                      <div key={h.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-600">{h.quality || 'Récolte'} — {h.quantity} {h.unit}</span>
                        <span className="text-sm font-medium text-slate-900">{formatCurrency(h.revenue || 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'livestock' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 text-lg">Rapport élevage</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-amber-50 rounded-lg"><p className="text-xs text-slate-500">Total animaux</p><p className="text-xl font-bold text-slate-900">{animalLots.reduce((s, l) => s + l.count, 0)}</p></div>
                  <div className="p-4 bg-green-50 rounded-lg"><p className="text-xs text-slate-500">Valeur cheptel</p><p className="text-xl font-bold text-slate-900">{formatCurrency(animalLots.reduce((s, l) => s + l.estimated_value, 0))}</p></div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Détail des lots</h4>
                  <div className="space-y-2">
                    {animalLots.length === 0 ? (
                      <p className="text-sm text-slate-400 py-4 text-center">Aucun lot enregistré</p>
                    ) : animalLots.map(l => (
                      <div key={l.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-600">{l.species} — {l.count} têtes</span>
                        <span className="text-sm font-medium text-slate-900">{formatCurrency(l.estimated_value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'investment' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 text-lg">Rapport investissements</h3>
                <div className="space-y-2">
                  {projects.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4 text-center">Aucun projet enregistré</p>
                  ) : projects.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.status} · {p.progress}%</p>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(p.revised_budget || p.initial_budget)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedReport === 'funder' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 text-lg">Rapport financeur</h3>
                <p className="text-sm text-slate-500">Rapport consolidé destiné aux financeurs : financements, dépenses liées, justificatifs et résultats.</p>
                <div className="space-y-2">
                  {fundings.filter(f => f.status === 'reçu').length === 0 ? (
                    <p className="text-sm text-slate-400 py-4 text-center">Aucun financement reçu</p>
                  ) : fundings.filter(f => f.status === 'reçu').map(f => (
                    <div key={f.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{f.reference}</p>
                        <p className="text-xs text-slate-500">{f.funder?.name}</p>
                      </div>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(f.amount_received || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
