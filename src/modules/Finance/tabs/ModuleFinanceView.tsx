import { useState, useMemo } from 'react';
import { Sprout, Beef, HardHat, Package, Truck, DollarSign, CreditCard, FileText, Wallet, ArrowUp, ArrowDown, Minus, RotateCw, RotateCcw, ChevronRight } from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import { RotatingCard } from '@/components/ui/RotatingCard';
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

function parseAmount(value: number | string | null | undefined): number {
  return parseFloat(String(value ?? 0)) || 0;
}

export const ModuleFinanceView = ({ expensesData, fundingsData }: ModuleFinanceViewProps) => {
  const { data: expenses = [] } = expensesData;
  const { data: fundings = [] } = fundingsData;
  const [flippedModule, setFlippedModule] = useState<string | null>(null);

  const moduleSummaries = useMemo(() => {
    const summaries: Record<string, ModuleSummary> = {};

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

    expenses.forEach(expense => {
      const activity = parseActivity(expense.activity);
      const moduleKey = activity?.module || (expense.project_id ? 'projet' : 'aucun');
      const summary = summaries[moduleKey] || summaries.aucun;
      summary.expenses += parseAmount(expense.amount);
      summary.expenseCount += 1;
    });

    fundings.forEach(funding => {
      const moduleKey = funding.project_id ? 'projet' : 'aucun';
      const summary = summaries[moduleKey] || summaries.aucun;
      summary.fundings += parseAmount(funding.amount);
      summary.fundingCount += 1;
    });

    Object.values(summaries).forEach(s => {
      s.net = s.fundings - s.expenses;
    });

    return Object.values(summaries).filter(s => s.expenseCount > 0 || s.fundingCount > 0);
  }, [expenses, fundings]);

  const totals = useMemo(() => ({
    totalExpenses: expenses.reduce((sum, e) => sum + parseAmount(e.amount), 0),
    totalFundings: fundings.reduce((sum, f) => sum + parseAmount(f.amount), 0),
    totalExpenseCount: expenses.length,
    totalFundingCount: fundings.length,
    net: fundings.reduce((sum, f) => sum + parseAmount(f.amount), 0) - expenses.reduce((sum, e) => sum + parseAmount(e.amount), 0),
  }), [expenses, fundings]);

  const expensesByModule = useMemo(() => {
    const grouped: Record<string, typeof expenses> = {};
    expenses.forEach(expense => {
      const activity = parseActivity(expense.activity);
      const moduleKey = activity?.module || (expense.project_id ? 'projet' : 'aucun');
      if (!grouped[moduleKey]) grouped[moduleKey] = [];
      grouped[moduleKey].push(expense);
    });
    return grouped;
  }, [expenses]);

  const moduleActivityLabel = (activity: { module: string; type: string; id: string } | null, expense: typeof expenses[number]) => {
    if (activity) {
      const typeLabel = activity.type === 'campaign' ? 'Campagne'
        : activity.type === 'plot' ? 'Parcelle'
        : activity.type === 'lot' ? 'Lot'
        : activity.type === 'animal' ? 'Animal'
        : activity.type;
      return `${typeLabel} #${activity.id.slice(0, 8)}`;
    }
    if (expense.project_id) return `Projet #${expense.project_id.slice(0, 8)}`;
    return '—';
  };

  const formatAmount = (value: number) => value > 0 ? formatCurrency(value) : '0 FCFA';

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

      {/* Vue par module — cartes rotatives */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-900">Répartition par module</h3>
          <p className="text-sm text-slate-500 mt-1">Synthèse des flux financiers rattachés à chaque activité</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {moduleSummaries.map(module => (
              <RotatingCard
                key={module.key}
                flipLabel={`Détail — ${module.label}`}
                backLabel="Retour"
                disabled={flippedModule !== null && flippedModule !== module.key}
                front={(
                  <div className="h-full flex flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${module.bgColor} ${module.color}`}>
                          {module.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{module.label}</h4>
                          <p className="text-xs text-slate-500">
                            {module.expenseCount} dépense{module.expenseCount > 1 ? 's' : ''} •
                            {module.fundingCount} financement{module.fundingCount > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Solde</p>
                        <p className={`font-bold text-slate-900 ${module.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {module.net >= 0 ? '+' : ''}{formatAmount(module.net)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Financements</p>
                        <p className="font-bold text-green-700">{formatAmount(module.fundings)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Dépenses</p>
                        <p className="font-bold text-amber-700">{formatAmount(module.expenses)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Écart</p>
                        <p className="font-bold text-slate-900">{formatAmount(Math.abs(module.net))}</p>
                      </div>
                    </div>
                  </div>
                )}
                back={(
                  <div className="h-full flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div>
                        <h4 className="font-semibold text-slate-900">{module.label}</h4>
                        <p className="text-xs text-slate-500">Activités liées</p>
                      </div>
                      <button
                        onClick={() => setFlippedModule(null)}
                        className="text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
                      >
                        <RotateCcw size={12} /> Retour
                      </button>
                    </div>
                    <div className="space-y-2">
                      {expensesByModule[module.key]?.length ? (
                        expensesByModule[module.key].map(expense => {
                          const activity = parseActivity(expense.activity);
                          return (
                            <div key={expense.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-100 bg-slate-50/50 text-sm">
                              <div className="flex items-center gap-3">
                                <ChevronRight size={14} className={module.color} />
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-900 truncate">{expense.label}</p>
                                  <p className="text-xs text-slate-500 truncate">
                                    {moduleActivityLabel(activity, expense)} • {new Date(expense.date).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                              </div>
                              <p className="font-semibold text-slate-900 text-right">{formatAmount(parseAmount(expense.amount))}</p>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-6 text-xs text-slate-400 uppercase tracking-wider">
                          Aucune activité liée
                        </div>
                      )}
                    </div>
                    <div className="mt-auto pt-4 border-t border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Total dépenses</p>
                      <p className="font-bold text-amber-700">{formatAmount(module.expenses)}</p>
                    </div>
                  </div>
                )}
              />
            ))}
            {moduleSummaries.length === 0 && (
              <div className="col-span-3 px-6 py-12 text-center text-slate-500">
                <DollarSign size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium">Aucune donnée financière</p>
                <p className="text-sm">Créez des financements ou des dépenses pour voir la répartition</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Détail des dépenses par module — supprimé, remplacé par les cartes rotatives */}
    </div>
  );
};

export default ModuleFinanceView;
