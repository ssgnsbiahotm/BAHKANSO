import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDashboardData } from './useDashboardData';
import { clientDataSource } from '@/lib/dashboard/dashboard-data-source';
import { useDashboardScope } from './useDashboardScope';

vi.mock('@/lib/DataContext', () => ({
  useData: () => ({
    sites: [],
    campaigns: [],
    alerts: [],
    loading: false,
    error: null,
  }),
}));

vi.mock('@/lib/SiteContext', () => ({
  useSite: () => ({ availableSites: [] }),
}));

vi.mock('./useDashboardScope', () => ({
  useDashboardScope: vi.fn(),
}));

vi.mock('@/lib/dashboard/dashboard-data-source', () => ({
  clientDataSource: {
    getKpis: vi.fn(),
  },
}));

const mockUseDashboardScope = vi.mocked(useDashboardScope);
const mockGetKpis = vi.mocked(clientDataSource.getKpis);

function renderWithScope(period: string) {
  mockUseDashboardScope.mockReturnValue({
    siteId: 'all',
    period,
    campaignId: null,
    setSiteId: vi.fn(),
    setPeriod: vi.fn(),
    setCampaignId: vi.fn(),
    reset: vi.fn(),
  });
  return renderHook(() => useDashboardData());
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useDashboardData — garde de période', () => {
  it('ne charge pas de données quand la période est mal formée (période incomplète)', () => {
    renderWithScope('2026');
    expect(mockGetKpis).not.toHaveBeenCalled();
  });

  it('ne charge pas de données quand la période est vide', () => {
    renderWithScope('');
    expect(mockGetKpis).not.toHaveBeenCalled();
  });

  it('ne charge pas de données quand le mois est hors bornes (13)', () => {
    renderWithScope('2026-13');
    expect(mockGetKpis).not.toHaveBeenCalled();
  });

  it('charge les données quand la période est valide', () => {
    renderWithScope('2026-10');
    expect(mockGetKpis).toHaveBeenCalled();
  });
});
