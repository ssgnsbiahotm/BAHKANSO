import { useMemo } from 'react';
import { Sprout, Beef, HardHat, Package, Truck, DollarSign, CreditCard, FileText, Wallet, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import { useFundings } from '@/modules/Finance/hooks/useFinanceData';
import { useExpenses } from '@/modules/Finance/hooks/useFinanceData';
import { formatCurrency } from '@/lib/format';

interface ModuleFinanceViewProps {
  expensesData: ReturnType<typeof useExpenses>;
  fundingsData: ReturnType<typeof useFundings>;
}

interface ModuleSummary {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  expenses: number;
  expenseCount: number;
  fundings: number;
  fundingCount: number;
  net: number;
}

const MODULE_CONFIG: Record<string, Omit<ModuleSummary, 'expenses' | 'expenseCount' | 'fundings' | 'fundingCount' | 'net'>> = {
  agriculture: {
    key: 'agriculture',
    label: 'Agriculture',
    icon: <Sprout size={20} />,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
  },
  elevage: {
    key: 'elevage',
    label: 'Élevage',
    icon: <Beef size={20} />,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
  },
  projet: {
    key: 'projet',
    label: 'Projets & Chantiers',
    icon: <HardHat size={20} />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
  },
  inventory: {
    key: 'inventory',
    label: 'Stocks & Achats',
    icon: <Package size={20} />,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
  },
  suppliers: {
    key: 'suppliers',
    label: 'Fournisseurs',
    icon: <Truck size={20} />,
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
  },
  aucun: {
    key: 'aucun',
    label: 'Non lié',
    icon: <Minus size={20} />,
    color: 'text-slate-700',
    bgColor: 'bg-slate-50',
  },
};

function parseActivity(activity: string | null): { module: string; type: string; id: string } | null {
  if (!activity) return null;
  try {
    const parsed = JSON.parse(activity);
    return {
      module: parsed.module || 'aucun',
      type: parsed.type || '',
      id: parsed.id || '',
    };
  } catch {
    return null;
  }
}

export const ModuleFinanceView = ({ expensesData, fundingsData }: ModuleFinanceViewProps) => {
  const { data: expenses = [] } = expensesData;
  const { data: fundings = [] } = fundingsData;

  const moduleSummaries = useMemo(() => {
    const summaries: Record<string, ModuleSummary> = {};

    // Initialiser tous les modules
    Object.entries(MODULE_CONFIG).forEach(([key, config]) => {
      summaries[key] = {
        ...config,
        expenses: 0,
        expenseCount: 0,
        fundings: 0,
        fundingCount: 0,
        net: 0,
      };
    });

    // Agréger les dépenses
    expenses.forEach(expense => {
      const activity = parseActivity(expense.activity);
      const moduleKey = activity?.module || (expense.project_id ? 'projet' : 'aucun');
      const summary = summaries[moduleKey] || summaries.aucun;
      summary.expenses += expense.amount_paid || 0;
      summary.expenseCount += 1;
    });

    // Agréger les financements
    fundings.forEach(funding => {
      const moduleKey = funding.project_id ? 'projet' : 'aucun';
      const summary = summaries[moduleKey] || summaries.aucun;
      summary.fundings += funding.amount || 0;
      summary.fundingCount += 1;
    });

    // Calculer le net par module
    Object.values(summaries).forEach(s => {
      s.net = s.fundings - s.expenses;
    });

    return Object.values(summaries).filter(s => s.expenseCount > 0 || s.fundingCount > 0);
  }, [expenses, fundings]);

  const totals = useMemo(() => ({
    totalExpenses: expenses.reduce((sum, e) => sum + (e.amount_paid || 0), 0),
    totalFundings: fundings.reduce((sum, f) => sum + (f.amount || 0), 0),
    totalExpenseCount: expenses.length,
    totalFundingCount: fundings.length,
    net: fundings.reduce((sum, f) => sum + (f.amount || 0), 0) - expenses.reduce((sum, e) => sum + (e.amount_paid || 0), 0),
  }), [expenses, fundings]);

  return (
    <div className="space-y-6">
      {/* KPIs globaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Total Financements"
          value={formatCurrency(totals.totalFundings)}
          icon={<DollarSign size={20} />}
          trend={{ value: '+', positive: true }}
        />
        <KpiCard
          label="Total Dépenses"
          value={formatCurrency(totals.totalExpenses)}
          icon={<CreditCard size={20} />}
          trend={{ value: '-', positive: false }}
        />
        <KpiCard
          label="Solde Net"
          value={formatCurrency(totals.net)}
          icon={<Wallet size={20} />}
          trend={{ value: totals.net >= 0 ? '+' : '', positive: totals.net >= 0 }}
        />
        <KpiCard
          label="Nb Financements"
          value={String(totals.totalFundingCount)}
          icon={<FileText size={20} />}
        />
        <KpiCard
          label="Nb Dépenses"
          value={String(totals.totalExpenseCount)}
          icon={<FileText size={20} />}
        />
      </div>

      {/* Vue par module */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-900">Répartition par module</h3>
          <p className="text-sm text-slate-500 mt-1">Synthèse des flux financiers rattachés à chaque activité</p>
        </div>
        <div className="divide-y divide-slate-100">
          {moduleSummaries.map(module => (
            <div
              key={module.key}
              className="px-6 py-4 hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${module.bgColor} ${module.color}`}>
                    {module.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{module.label}</h4>
                    <p className="text-sm text-slate-500">
                      {module.expenseCount} dépense{module.expenseCount > 1 ? 's' : ''} •
                      {module.fundingCount} financement{module.fundingCount > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 md:grid-cols-4 text-right">
                  <div>
                    <p className="text-xs text-slate-500">Financements</p>
                    <p className="font-bold text-green-700">{formatCurrency(module.fundings)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Dépenses</p>
                    <p className="font-bold text-amber-700">{formatCurrency(module.expenses)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Solde</p>
                    <p className={`font-bold ${module.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {module.net >= 0 ? '+' : ''}{formatCurrency(module.net)}
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {module.net >= 0 ? (
                      <ArrowUp size={16} className="text-green-600" />
                    ) : (
                      <ArrowDown size={16} className="text-red-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Barre de progression visuelle */}
              {(module.fundings > 0 || module.expenses > 0) && (
                <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{
                      width: module.fundings > 0
                        ? `${Math.min(100, (module.expenses / module.fundings) * 100)}%`
                        : module.expenses > 0
                        ? '100%'
                        : '0%',
                    }}
                  />
                </div>
              )}
            </div>
          ))}

          {moduleSummaries.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-500">
              <DollarSign size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">Aucune donnée financière</p>
              <p className="text-sm">Créez des financements ou des dépenses pour voir la répartition</p>
            </div>
          )}
        </div>
      </div>

      {/* Détail des dépenses par module (tableau repliable) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-900">Détail des dépenses par module</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Module</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Activité liée</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Libellé</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Montant</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Statut</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    Aucune dépense enregistrée
                  </td>
                </tr>
              ) : (
                expenses
                  .sort((a, b) => {
                    const moduleA = parseActivity(a.activity)?.module || 'zzz';
                    const moduleB = parseActivity(b.activity)?.module || 'zzz';
                    if (moduleA !== moduleB) return moduleA.localeCompare(moduleB);
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                  })
                  .map(expense => {
                    const activity = parseActivity(expense.activity);
                    const moduleKey = activity?.module || (expense.project_id ? 'projet' : 'aucun');
                    const moduleConfig = MODULE_CONFIG[moduleKey] || MODULE_CONFIG.aucun;
                    const status = expense.status || 'en_attente';

                    return (
                      <tr key={expense.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${moduleConfig.bgColor} ${moduleConfig.color}`}>
                            {moduleConfig.icon}
                            {moduleConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {activity ? `${activity.type === 'campaign' ? 'Campagne' : activity.type === 'plot' ? 'Parcelle' : activity.type === 'lot' ? 'Lot' : activity.type === 'animal' ? 'Animal' : activity.type} #${activity.id.slice(0, 8)}` : expense.project_id ? `Projet #${expense.project_id.slice(0, 8)}` : '—'}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{expense.label}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(expense.amount_paid)}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-medium capitalize">
                            {status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{expense.date ? new Date(expense.date).toLocaleDateString('fr-FR') : '—'}</td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ModuleFinanceView;