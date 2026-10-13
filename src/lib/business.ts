import type { Harvest, Transaction } from '@/lib/types';

export type RevenueStatus = 'validé' | 'prévu' | 'en attente';

export interface RevenueEntry {
  id: string;
  date: string;
  label: string;
  source: string;
  customer: string;
  amount: number;
  currency: string;
  status: RevenueStatus;
}

export const REVENUE_STATUS_COLORS: Record<string, string> = {
  validé: 'bg-green-50 text-green-700 border-green-200',
  prévu: 'bg-amber-50 text-amber-700 border-amber-200',
  'en attente': 'bg-slate-100 text-slate-700 border-slate-200',
};

export const REVENUE_STATUS_OPTIONS = ['all', 'validé', 'prévu', 'en attente'] as const;

export function matchesPeriod(dateStr: string | null | undefined, period: '2026' | '2025' | 'all') {
  if (!dateStr) return true;
  if (period === 'all') return true;
  return dateStr.startsWith(period);
}

export function buildRevenueEntries(harvests: Harvest[] = [], transactions: Transaction[] = []): RevenueEntry[] {
  const harvestEntries: RevenueEntry[] = (harvests || [])
    .filter((harvest) => Number(harvest.revenue ?? 0) > 0)
    .map((harvest) => ({
      id: harvest.id,
      date: harvest.date,
      label: `Vente ${harvest.destination || 'production'}`,
      source: 'Récolte',
      customer: harvest.destination || 'Marché local',
      amount: Number(harvest.revenue ?? 0),
      currency: 'FCFA',
      status: 'validé',
    }));

  const transactionEntries: RevenueEntry[] = (transactions || [])
    .filter((transaction) => {
      const incoming = transaction.direction === 'in' || transaction.type === 'income' || transaction.type === 'vente';
      return incoming && Number(transaction.amount ?? 0) > 0;
    })
    .map((transaction) => ({
      id: transaction.id,
      date: transaction.transaction_date,
      label: transaction.description || 'Vente / encaissement',
      source: transaction.bank_account_id ? 'Banque' : 'Caisse',
      customer: transaction.description || 'Client',
      amount: Number(transaction.amount ?? 0),
      currency: transaction.currency || 'FCFA',
      status: transaction.type === 'vente' ? 'validé' : 'en attente',
    }));

  return [...harvestEntries, ...transactionEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function calculateRevenueTotals(entries: RevenueEntry[]) {
  const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const valid = entries.filter((entry) => entry.status === 'validé').reduce((sum, entry) => sum + entry.amount, 0);
  const pending = entries.filter((entry) => entry.status !== 'validé').reduce((sum, entry) => sum + entry.amount, 0);
  const average = entries.length ? total / entries.length : 0;

  return { total, valid, pending, average };
}
