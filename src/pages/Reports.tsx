import { useState, useEffect } from 'react';
import { FileBarChart, Download, FileText } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToast } from '@/lib/Toast';
import { STATUS_CLASS_SUCCESS, STATUS_CLASS_INFO, STATUS_CLASS_WARNING } from '@/lib/constants';

export function Reports() {
  const { fundings, expenses, projects, harvests, animalLots, loadModule } = useData();
  const toast = useToast();

  useEffect(() => {
    loadModule('finance');
    loadModule('dashboard');
    loadModule('exploitation');
    loadModule('elevage');
  }, [loadModule]);
  const [selectedReport, setSelectedReport] = useState('financial');

  const reports = [
    { id: 'financial', label: 'Rapport financier', icon: <FileBarChart size={20} />, color: STATUS_CLASS_INFO },
    { id: 'agricultural', label: 'Rapport agricole', icon: <FileText size={20} />, color: STATUS_CLASS_SUCCESS },
    { id: 'livestock', label: 'Rapport élevage', icon: <FileText size={20} />, color: STATUS_CLASS_WARNING },
    { id: 'investment', label: 'Rapport investissements', icon: <FileText size={20} />, color: 'bg-accent-soft text-accent-primary' },
    { id: 'funder', label: 'Rapport financeur', icon: <FileText size={20} />, color: STATUS_CLASS_INFO },
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
            <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-4 py-2 text-sm border border-default rounded-lg hover:bg-surface-hover text-primary">
              <Download size={16} /> Export CSV
            </button>
            <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-4 py-2 text-sm border border-default rounded-lg hover:bg-surface-hover text-primary">
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
                  selectedReport === r.id ? STATUS_CLASS_SUCCESS : 'bg-surface border-default hover:bg-surface-hover'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${r.color}`}>{r.icon}</div>
                <span className={`text-sm font-medium ${selectedReport === r.id ? STATUS_CLASS_SUCCESS.split(' ')[1] : 'text-primary'}`}>{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-surface rounded-xl border border-default p-6">
            {selectedReport === 'financial' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-primary text-lg">Rapport financier</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${STATUS_CLASS_INFO}`}><p className="text-xs text-muted">Total financé</p><p className="text-xl font-bold text-primary">{formatCurrency(fin.totalFunded)}</p></div>
                  <div className={`p-4 rounded-lg ${STATUS_CLASS_WARNING}`}><p className="text-xs text-muted">Total dépensé</p><p className="text-xl font-bold text-primary">{formatCurrency(fin.totalSpent)}</p></div>
                  <div className={`p-4 rounded-lg ${STATUS_CLASS_SUCCESS}`}><p className="text-xs text-muted">Solde</p><p className="text-xl font-bold text-primary">{formatCurrency(fin.totalFunded - fin.totalSpent)}</p></div>
                  <div className="p-4 bg-surface-hover rounded-lg"><p className="text-xs text-muted">Nb dépenses</p><p className="text-xl font-bold text-primary">{expenses.length}</p></div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-primary mb-2">Dépenses par catégorie</h4>
                  <div className="space-y-2">
                    {Object.entries(fin.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                      <div key={cat} className="flex items-center justify-between p-2 bg-surface-hover rounded-lg">
                        <span className="text-sm text-muted">{cat}</span>
                        <span className="text-sm font-medium text-primary">{formatCurrency(amt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'agricultural' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-primary text-lg">Rapport agricole</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${STATUS_CLASS_SUCCESS}`}><p className="text-xs text-muted">Récoltes totales</p><p className="text-xl font-bold text-primary">{harvests.reduce((s, h) => s + h.quantity, 0)} kg</p></div>
                  <div className={`p-4 rounded-lg ${STATUS_CLASS_WARNING}`}><p className="text-xs text-muted">Chiffre d'affaires</p><p className="text-xl font-bold text-primary">{formatCurrency(harvests.reduce((s, h) => s + (h.revenue || 0), 0))}</p></div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-primary mb-2">Détail des récoltes</h4>
                  <div className="space-y-2">
                    {harvests.length === 0 ? (
                      <p className="text-sm text-muted py-4 text-center">Aucune récolte enregistrée</p>
                    ) : harvests.map(h => (
                      <div key={h.id} className="flex items-center justify-between p-2 bg-surface-hover rounded-lg">
                        <span className="text-sm text-muted">{h.quality || 'Récolte'} — {h.quantity} {h.unit}</span>
                        <span className="text-sm font-bold text-primary">{formatCurrency(h.revenue || 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'livestock' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-primary text-lg">Rapport élevage</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${STATUS_CLASS_WARNING}`}><p className="text-xs text-muted">Total animaux</p><p className="text-xl font-bold text-primary">{animalLots.reduce((s, l) => s + l.count, 0)}</p></div>
                  <div className={`p-4 rounded-lg ${STATUS_CLASS_SUCCESS}`}><p className="text-xs text-muted">Valeur cheptel</p><p className="text-xl font-bold text-primary">{formatCurrency(animalLots.reduce((s, l) => s + l.estimated_value, 0))}</p></div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-primary mb-2">Détail des lots</h4>
                  <div className="space-y-2">
                    {animalLots.length === 0 ? (
                      <p className="text-sm text-muted py-4 text-center">Aucun lot enregistré</p>
                    ) : animalLots.map(l => (
                      <div key={l.id} className="flex items-center justify-between p-2 bg-surface-hover rounded-lg">
                        <span className="text-sm text-muted">{l.species} — {l.count} têtes</span>
                        <span className="text-sm font-medium text-primary">{formatCurrency(l.estimated_value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'investment' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-primary text-lg">Rapport investissements</h3>
                <div className="space-y-2">
                  {projects.length === 0 ? (
                    <p className="text-sm text-muted py-4 text-center">Aucun projet enregistré</p>
                  ) : projects.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-surface-hover rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-primary">{p.name}</p>
                        <p className="text-xs text-muted">{p.status} · {p.progress}%</p>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(p.revised_budget || p.initial_budget)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedReport === 'funder' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-primary text-lg">Rapport financeur</h3>
                <p className="text-sm text-muted">Rapport consolidé destiné aux financeurs : financements, dépenses liées, justificatifs et résultats.</p>
                <div className="space-y-2">
                  {fundings.filter(f => f.status === 'reçu').length === 0 ? (
                    <p className="text-sm text-muted py-4 text-center">Aucun financement reçu</p>
                  ) : fundings.filter(f => f.status === 'reçu').map(f => (
                    <div key={f.id} className="flex items-center justify-between p-3 bg-surface-hover rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-primary">{f.reference}</p>
                        <p className="text-xs text-muted">{f.funder?.name}</p>
                      </div>
                      <span className={`text-sm font-medium ${STATUS_CLASS_SUCCESS.split(' ')[1]}`}>{formatCurrency(f.amount_received || 0)}</span>
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
