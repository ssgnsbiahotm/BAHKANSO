import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDashboardStats } from './useDashboardStats';
import { useData } from '@/lib/DataContext';
import type { SourceStatus } from '@/lib/DataContext';

vi.mock('@/lib/DataContext', () => ({
  useData: vi.fn(),
}));

const mockUseData = useData as ReturnType<typeof vi.fn>;

type SourceMap = Record<string, SourceStatus>;

function setup(overrides: {
  sourceStatus?: Partial<SourceMap>;
  arrays?: Record<string, any[]>;
  loading?: boolean;
  error?: string | null;
}) {
  const status: SourceMap = {
    transactions: 'success',
    expenses: 'success',
    inventoryItems: 'success',
    projects: 'success',
    alerts: 'success',
    animals: 'success',
    animalLots: 'success',
    campaigns: 'success',
    ...overrides.sourceStatus,
  };
  const arrays = {
    animals: [], animalLots: [], campaigns: [], projects: [],
    expenses: [], transactions: [], inventoryItems: [], alerts: [],
    ...overrides.arrays,
  };
  const sourceError: Record<string, string | null> = {};
  for (const [source, st] of Object.entries(status)) {
    if (st === 'error') sourceError[source] = 'Erreur de chargement';
  }
  mockUseData.mockReturnValue({
    ...arrays,
    loading: overrides.loading ?? false,
    error: overrides.error ?? null,
    sourceStatus: status,
    sourceError,
  });
  return renderHook(() => useDashboardStats());
}

function current(result: ReturnType<typeof renderHook>): any {
  return result.result.current;
}

describe('useDashboardStats', () => {
  beforeEach(() => {
    mockUseData.mockClear();
  });

  it('identifie les huit sources comme disponibles quand leurs requetes reussissent', () => {
    const result = current(setup({
      arrays: { transactions: [{ id: '1', reference: null, type: 'v', amount: 100, currency: 'XOF', direction: 'entree', description: null, funding_id: null, transaction_date: '2026-01-01', bank_account_id: null, cash_account_id: null }] },
    }));
    expect(result.transactionsAvailable).toBe(true);
    expect(result.expensesAvailable).toBe(true);
    expect(result.inventoryAvailable).toBe(true);
    expect(result.projectsAvailable).toBe(true);
    expect(result.alertsAvailable).toBe(true);
    expect(result.animalsAvailable).toBe(true);
    expect(result.animalLotsAvailable).toBe(true);
    expect(result.campaignsAvailable).toBe(true);
    expect(result.allSourcesResolved).toBe(true);
  });

  it('distingue une liste vide d une requete en erreur', () => {
    const ok = current(setup({ arrays: { transactions: [] } }));
    expect(ok.transactionsAvailable).toBe(true);
    expect(ok.hasData).toBe(false);

    const err = current(setup({ sourceStatus: { transactions: 'error' }, arrays: { transactions: [] } }));
    expect(err.transactionsAvailable).toBe(false);
    expect(err.hasData).toBe(false);
  });

  it('ne transforme pas l echec d une source en faux resultat zero', () => {
    const result = current(setup({ sourceStatus: { transactions: 'error' }, arrays: { transactions: [] } }));
    expect(result.transactionsAvailable).toBe(false);
    expect(result.sourceStatus.transactions).toBe('error');
    expect(result.sourceError.transactions).toBeTruthy();
  });

  it('une erreur partielle permet encore de presenter les donnees valides des autres sections', () => {
    const result = current(setup({
      sourceStatus: { transactions: 'error', animals: 'success' },
      arrays: { transactions: [], animals: [{ id: 'a', identifier: null, name: null, species: 'bovin', breed: null, sex: null, birth_date: null, date_of_birth: null, origin: null, acquisition_date: null, acquisition_value: 0, weight_kg: null, lot_id: null, location: null, status: 'vivant', estimated_value: 0 }] },
    }));
    expect(result.transactionsAvailable).toBe(false);
    expect(result.animalsAvailable).toBe(true);
    expect(result.hasData).toBe(true);
  });

  it('letat vraiment vide fonctionne quand toutes les sources sont disponibles', () => {
    const result = current(setup({}));
    expect(result.allSourcesResolved).toBe(true);
    expect(result.hasData).toBe(false);
    expect(result.transactionsAvailable).toBe(true);
  });

  it('calcule le résultat net et la marge brute sur la période courante', () => {
    const result = current(setup({
      arrays: {
        transactions: [
          { id: 'current-income', reference: null, type: 'v', amount: 1000, currency: 'XOF', direction: 'entree', description: null, funding_id: null, transaction_date: '2026-10-10', bank_account_id: null, cash_account_id: null },
          { id: 'current-expense', reference: null, type: 'v', amount: 400, currency: 'XOF', direction: 'sortie', description: null, funding_id: null, transaction_date: '2026-10-11', bank_account_id: null, cash_account_id: null },
          { id: 'historical-income', reference: null, type: 'v', amount: 9000, currency: 'XOF', direction: 'entree', description: null, funding_id: null, transaction_date: '2026-09-10', bank_account_id: null, cash_account_id: null },
        ],
      },
    }));

    expect(result.periodIncome).toBe(1000);
    expect(result.periodExpenses).toBe(400);
    expect(result.periodNetResult).toBe(600);
    expect(result.grossMargin).toBe(60);
    expect(result.netTreasury).toBe(9600);
  });

  it('expose le libellé de la période courante', () => {
    const result = current(setup({}));
    expect(result.periodLabel).toMatch(/2026/);
  });

  it('distingue les sources encore en attente des sources définitivement vides', () => {
    const result = current(setup({ sourceStatus: { expenses: 'loading' as SourceStatus } }));
    expect(result.expensesAvailable).toBe(false);
    expect(result.prioritySourcesPending).toBe(true);
  });

  it('ne compte pas les avertissements dans les alertes critiques', () => {
    const result = current(setup({
      arrays: {
        alerts: [
          { id: 'critical', severity: 'CRITIQUE', status: 'ouvert' },
          { id: 'warning', severity: 'AVERTISSEMENT', status: 'ouvert' },
        ],
      },
    }));
    expect(result.openCriticalAlerts).toBe(1);
  });
});
