import { useMemo } from 'react';
import { useData } from '@/lib/DataContext';
import type { Transaction } from '@/lib/types';

export const formatFCFA = (n: number) =>
  new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);

interface PeriodBounds {
  start: Date;
  end: Date;
  label: string;
}

const monthBounds = (year: number, month: number): PeriodBounds => {
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));
  const label = start.toLocaleDateString('fr-CI', { month: 'long', year: 'numeric' });
  return { start, end, label };
};

const currentPeriodBounds = (): PeriodBounds => {
  const now = new Date();
  return monthBounds(now.getFullYear(), now.getMonth());
};

const previousPeriodBounds = (): PeriodBounds => {
  const now = new Date();
  if (now.getMonth() === 0) {
    return monthBounds(now.getFullYear() - 1, 11);
  }
  return monthBounds(now.getFullYear(), now.getMonth() - 1);
};

const inPeriod = (dateString: string | null | undefined, bounds: PeriodBounds): boolean => {
  if (!dateString) return false;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return false;
  return d >= bounds.start && d <= bounds.end;
};

export function useDashboardStats() {
  const {
    animals = [],
    animalLots = [],
    campaigns = [],
    projects = [],
    expenses = [],
    transactions = [],
    inventoryItems = [],
    alerts = [],
    loading,
    error,
  } = useData();

  const stats = useMemo(() => {
    const current = currentPeriodBounds();
    const previous = previousPeriodBounds();

    const currentPeriodTransactions = transactions.filter((t) => inPeriod(t.transaction_date, current));
    const previousPeriodTransactions = transactions.filter((t) => inPeriod(t.transaction_date, previous));

    const sumByDirection = (list: Transaction[], dir: string) =>
      list.reduce((s, t) => (t.direction === dir ? s + t.amount : s), 0);

    const entrees = sumByDirection(currentPeriodTransactions, 'entree');
    const sorties = sumByDirection(currentPeriodTransactions, 'sortie');
    const currentPeriodNetTreasury = entrees - sorties;
    const previousPeriodNetTreasury = sumByDirection(previousPeriodTransactions, 'entree') - sumByDirection(previousPeriodTransactions, 'sortie');
    const netTreasury = sumByDirection(transactions, 'entree') - sumByDirection(transactions, 'sortie');

    const periodIncome = entrees;
    const periodExpenses = sorties;
    const previousPeriodExpenses = sumByDirection(previousPeriodTransactions, 'sortie');
    const previousPeriodIncome = sumByDirection(previousPeriodTransactions, 'entree');

    const expenseTrend =
      previousPeriodExpenses !== 0
        ? Number(Number(((periodExpenses - previousPeriodExpenses) / previousPeriodExpenses) * 100).toFixed(1))
        : null;

    const incomeTrend =
      previousPeriodIncome !== 0
        ? Number(((periodIncome - previousPeriodIncome) / previousPeriodIncome) * 100).toFixed(1)
        : null;

    const treasuryTrend =
      previousPeriodNetTreasury !== 0
        ? Number(((currentPeriodNetTreasury - previousPeriodNetTreasury) / Math.abs(previousPeriodNetTreasury)) * 100).toFixed(1)
        : null;

    // 6 derniers mois pour le graphique de tendance
    const movementData: { mois: string; entrees: number; sorties: number; net: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth() - i, 1));
      const bounds = monthBounds(d.getFullYear(), d.getMonth());
      const mList = transactions.filter((t) => inPeriod(t.transaction_date, bounds));
      const entrees = sumByDirection(mList, 'entree');
      const sorties = sumByDirection(mList, 'sortie');
      movementData.push({
        mois: bounds.label,
        entrees,
        sorties,
        net: entrees - sorties,
      });
    }

    // Dépenses par catégorie (période courante)
    const catMap = new Map<string, number>();
    for (const exp of expenses) {
      if (inPeriod(exp.date, current)) {
        const key = exp.category || 'Non catégorisé';
        catMap.set(key, (catMap.get(key) || 0) + exp.amount);
      }
    }
    const expenseByCategory = Array.from(catMap.entries()).map(([cat, montant]) => ({ cat, montant }));

    // Priorités déduites
    const expensesWithoutJustificatif = expenses.filter((e) => !e.has_justificatif).length;
    const lowStockItems = inventoryItems.filter((i) => i.current_stock <= i.min_stock).length;
    const now = new Date();
    const overdueProjects = projects.filter(
      (p) => p.expected_end_date && new Date(p.expected_end_date) < now && p.status !== 'terminé'
    ).length;
    const openAlerts = alerts.filter((a) => a.status === 'ouvert').length;
    const openCriticalAlerts = alerts.filter(
      (a) => (a.severity === 'CRITIQUE' || a.severity === 'AVERTISSEMENT') && a.status === 'ouvert'
    ).length;

    const latestTransactions = [...transactions]
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
      .slice(0, 5);

    const hasData =
      animals.length > 0 ||
      animalLots.length > 0 ||
      campaigns.length > 0 ||
      projects.length > 0 ||
      expenses.length > 0 ||
      transactions.length > 0 ||
      inventoryItems.length > 0 ||
      alerts.length > 0;

    return {
      netTreasury,
      periodIncome,
      periodExpenses,
      previousPeriodExpenses,
      incomeTrend,
      expenseTrend,
      currentPeriodTransactions,
      previousPeriodTransactions,
      periodBounds: current,
      previousPeriodBounds: previous,
      totalAnimals: animals.length,
      totalAnimalLots: animalLots.length,
      activeCampaigns: campaigns.filter((c) => c.status === 'actif').length,
      activeProjects: projects.filter((p) => p.status === 'en cours').length,
      expensesWithoutJustificatif,
      lowStockItems,
      overdueProjects,
      openAlerts,
      openCriticalAlerts,
      movementData,
      expenseByCategory,
      latestTransactions,
      hasData,
      loading,
      error,
      treasuryTrend,
    };
  }, [
    animals,
    animalLots,
    campaigns,
    projects,
    expenses,
    transactions,
    inventoryItems,
    alerts,
    loading,
    error,
  ]);

  return stats;
}
