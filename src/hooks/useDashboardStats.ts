import { useMemo } from 'react';
import { useData } from '@/lib/DataContext';
import type { Animal, Expense, Alert, Transaction, Campaign } from '@/lib/types';

const formatFCFA = (n: number) =>
  new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);

interface DashboardStats {
  totalAnimals: number;
  activeCrops: number;
  netTreasury: number;
  monthExpenses: number;
  expenseTrend: number;
  activeAlerts: number;
  healthScore: number;
  currentSeason: string;
  animalsData: Animal[];
  expensesData: Expense[];
  alertsData: Alert[];
  productionData: { mois: string; agriculture: number; elevage: number }[];
}

const MOCK_ANIMALS: Animal[] = [
  {
    id: 'm1', identifier: 'BOV-01', species: 'Bovins', breed: null, sex: null,
    birth_date: null, origin: null, acquisition_date: null,
    acquisition_value: 0, weight_kg: null, lot_id: null, location: null,
    status: 'actif', estimated_value: 0,
  },
  {
    id: 'm2', identifier: 'OVI-01', species: 'Ovins', breed: null, sex: null,
    birth_date: null, origin: null, acquisition_date: null,
    acquisition_value: 0, weight_kg: null, lot_id: null, location: null,
    status: 'actif', estimated_value: 0,
  },
  {
    id: 'm3', identifier: 'VOL-01', species: 'Volailles', breed: null, sex: null,
    birth_date: null, origin: null, acquisition_date: null,
    acquisition_value: 0, weight_kg: null, lot_id: null, location: null,
    status: 'actif', estimated_value: 0,
  },
];

const MOCK_EXPENSES: Expense[] = [
  {
    id: 'e1', reference: 'EXP-001', date: new Date().toISOString().slice(0, 10), amount: 680000,
    currency: 'XOF', category: 'Alimentation', supplier_id: null, responsible: null,
    payment_method: 'cash', bank_account_id: null, cash_account_id: null, project_id: null,
    activity: null, funding_id: null, description: null, status: 'payé', has_justificatif: false,
    justificatif_url: null, justificatif_file_name: null, justificatif_uploaded_at: null,
    amount_paid: 680000, date_paid: null, payment_method_detail: null, payment_reference: null,
    comment: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    supplier: null,
  },
  {
    id: 'e2', reference: 'EXP-002', date: new Date().toISOString().slice(0, 10), amount: 340000,
    currency: 'XOF', category: 'Santé animale', supplier_id: null, responsible: null,
    payment_method: 'cash', bank_account_id: null, cash_account_id: null, project_id: null,
    activity: null, funding_id: null, description: null, status: 'payé', has_justificatif: false,
    justificatif_url: null, justificatif_file_name: null, justificatif_uploaded_at: null,
    amount_paid: 340000, date_paid: null, payment_method_detail: null, payment_reference: null,
    comment: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    supplier: null,
  },
  {
    id: 'e3', reference: 'EXP-003', date: new Date().toISOString().slice(0, 10), amount: 290000,
    currency: 'XOF', category: 'Équipement', supplier_id: null, responsible: null,
    payment_method: 'cash', bank_account_id: null, cash_account_id: null, project_id: null,
    activity: null, funding_id: null, description: null, status: 'payé', has_justificatif: false,
    justificatif_url: null, justificatif_file_name: null, justificatif_uploaded_at: null,
    amount_paid: 290000, date_paid: null, payment_method_detail: null, payment_reference: null,
    comment: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    supplier: null,
  },
];

const MOCK_ALERTS: Alert[] = [
  { id: 'a1', category: 'santé', severity: 'CRITIQUE', title: 'Vaccination bovins en retard', description: null, object_type: null, object_id: null, status: 'ouvert', assigned_to: null, created_at: new Date().toISOString(), resolved_at: null },
  { id: 'a2', category: 'stock', severity: 'AVERTISSEMENT', title: 'Stock aliment < 20%', description: null, object_type: null, object_id: null, status: 'ouvert', assigned_to: null, created_at: new Date().toISOString(), resolved_at: null },
  { id: 'a3', category: 'météo', severity: 'INFO', title: 'Saison des pluies dans 3 semaines', description: null, object_type: null, object_id: null, status: 'ouvert', assigned_to: null, created_at: new Date().toISOString(), resolved_at: null },
];

const MOCK_PRODUCTION = [
  { mois: 'Jan', agriculture: 320, elevage: 280 },
  { mois: 'Fév', agriculture: 350, elevage: 300 },
  { mois: 'Mar', agriculture: 410, elevage: 340 },
  { mois: 'Avr', agriculture: 480, elevage: 390 },
  { mois: 'Mai', agriculture: 520, elevage: 420 },
  { mois: 'Jun', agriculture: 580, elevage: 460 },
];

const getCurrentSeason = (): string => {
  const month = new Date().getMonth();
  if ((month >= 3 && month <= 6) || month === 9 || month === 10) {
    return 'Saison des pluies';
  }
  return 'Saison sèche';
};

export function useDashboardStats(): DashboardStats {
  const { animals = [], expenses = [], alerts = [], transactions = [], campaigns = [] } = useData();

  return useMemo(() => {
    const hasData = animals.length > 0 || expenses.length > 0 || alerts.length > 0;
    const dataAnimals = hasData ? animals : MOCK_ANIMALS;
    const dataExpenses = hasData ? expenses : MOCK_EXPENSES;
    const dataAlerts = hasData ? alerts : MOCK_ALERTS;
    const dataTransactions = hasData ? transactions : [];

    const totalAnimals = dataAnimals.length;

    const activeCrops = hasData
      ? campaigns.filter((c: Campaign) => c.status === 'actif').length
      : 3;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const filterCurrentMonth = (transaction: Transaction) => {
      const tDate = new Date(transaction.transaction_date);
      return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    };

    const currentMonthTransactions = dataTransactions.filter(filterCurrentMonth);
    const entrees = currentMonthTransactions.reduce((sum, t) => sum + (t.direction === 'entree' ? t.amount : 0), 0);
    const sorties = currentMonthTransactions.reduce((sum, t) => sum + (t.direction === 'sortie' ? t.amount : 0), 0);
    const netTreasury = entrees - sorties;

    const monthExpensesFromExpenses = hasData
      ? dataExpenses.reduce((sum, exp) => {
          const expDate = new Date(exp.date);
          return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear
            ? sum + exp.amount
            : sum;
        }, 0)
      : 0;

    const finalMonthExpenses = hasData ? monthExpensesFromExpenses : sorties;

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const filterPreviousMonth = (transaction: Transaction) => {
      const tDate = new Date(transaction.transaction_date);
      return tDate.getMonth() === previousMonth && tDate.getFullYear() === previousYear;
    };

    const previousMonthTransactions = dataTransactions.filter(filterPreviousMonth);
    const previousSorties = previousMonthTransactions.reduce((sum, t) => sum + (t.direction === 'sortie' ? t.amount : 0), 0);
    const previousExpenses = hasData
      ? dataExpenses.reduce((sum, exp) => {
          const expDate = new Date(exp.date);
          return expDate.getMonth() === previousMonth && expDate.getFullYear() === previousYear
            ? sum + exp.amount
            : sum;
        }, 0)
      : 0;

    const previousMonthTotal = hasData ? previousSorties : (previousExpenses || 1);
    const expenseTrend = previousMonthTotal !== 0
      ? Number((((finalMonthExpenses - previousMonthTotal) / previousMonthTotal) * 100).toFixed(1))
      : 0;

    const activeAlerts = dataAlerts.filter(
      (alert: Alert) => alert.severity === 'CRITIQUE' || alert.severity === 'AVERTISSEMENT'
    ).length;

    const criticalAlerts = dataAlerts.filter((a: Alert) => a.severity === 'CRITIQUE').length;
    const warningAlerts = dataAlerts.filter((a: Alert) => a.severity === 'AVERTISSEMENT').length;
    let healthScore = 100 - criticalAlerts * 20 - warningAlerts * 5;
    healthScore = Math.max(0, Math.min(100, healthScore));

    return {
      totalAnimals,
      activeCrops,
      netTreasury,
      monthExpenses: finalMonthExpenses,
      expenseTrend,
      activeAlerts,
      healthScore,
      currentSeason: getCurrentSeason(),
      animalsData: dataAnimals,
      expensesData: dataExpenses,
      alertsData: dataAlerts,
      productionData: hasData ? [] : MOCK_PRODUCTION,
    };
  }, [animals, expenses, alerts, transactions, campaigns]);
}

export { formatFCFA };
