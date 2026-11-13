import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardData } from './useDashboardData';
import { clientDataSource } from '@/lib/dashboard/dashboard-data-source';
import { useDashboardScope } from './useDashboardScope';

const mockSourceStatus = { sites: 'success' };
const mockSites: { id: string; farm_id: string }[] = [{ id: 'site-1', farm_id: 'farm-1' }];

vi.mock('@/lib/DataContext', () => ({
  useData: () => ({
    sites: mockSites,
    campaigns: [],
    alerts: [],
    loading: false,
    error: null,
    sourceStatus: mockSourceStatus,
  }),
}));

vi.mock('@/lib/SiteContext', () => ({
  useSite: () => ({ availableSites: [] }),
}));

vi.mock('./useDashboardScope', () => ({
  useDashboardScope: vi.fn(() => ({
    siteId: 'all',
    period: '2026-10',
    campaignId: null,
    setSiteId: vi.fn(),
    setPeriod: vi.fn(),
    setCampaignId: vi.fn(),
    reset: vi.fn(),
  })),
}));

vi.mock('@/lib/dashboard/dashboard-data-source', () => ({
  clientDataSource: {
    getKpis: vi.fn(),
  },
}));

const mockUseDashboardScope = vi.mocked(useDashboardScope);
const mockGetKpis = vi.mocked(clientDataSource.getKpis);

function renderWithScope(period: string, sites: { id: string; farm_id: string }[] = [...mockSites]) {
  mockUseDashboardScope.mockReturnValue({
    siteId: 'all',
    period,
    campaignId: null,
    setSiteId: vi.fn(),
    setPeriod: vi.fn(),
    setCampaignId: vi.fn(),
    reset: vi.fn(),
  });
  mockSites.length = 0;
  mockSites.push(...sites);
  return renderHook(() => useDashboardData());
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSourceStatus.sites = 'success';
  mockSites.length = 0;
  mockSites.push({ id: 'site-1', farm_id: 'farm-1' });
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

describe('useDashboardData — états de chargement des sites', () => {
  it('passe en loading quand les sites sont encore en cours de chargement', async () => {
    mockSourceStatus.sites = 'loading';
    const { result } = renderWithScope('2026-10');
    await waitFor(() => expect(result.current.loading).toBe(true));
    expect(mockGetKpis).not.toHaveBeenCalled();
    expect(result.current.kpiNetResult.status).toBe('loading');
  });

  it('retourne no_data quand les sites sont charges sans farm_id resolu', async () => {
    mockSourceStatus.sites = 'success';
    const { result } = renderWithScope('2026-10', []);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGetKpis).not.toHaveBeenCalled();
    expect(result.current.kpiNetResult.status).toBe('no_data');
  });

  it('passe en loading quand le statut des sites est undefined (montage initial)', async () => {
    mockSourceStatus.sites = undefined as unknown as 'success';
    const { result } = renderWithScope('2026-10', []);
    await waitFor(() => expect(result.current.loading).toBe(true));
    expect(mockGetKpis).not.toHaveBeenCalled();
    expect(result.current.kpiNetResult.status).toBe('loading');
  });

  it('transition loading -> no_data quand les sites passent de chargement a succes sans ferme', async () => {
    mockSourceStatus.sites = 'loading';
    const { result, rerender } = renderWithScope('2026-10', []);
    await waitFor(() => expect(result.current.loading).toBe(true));
    expect(result.current.kpiNetResult.status).toBe('loading');

    mockSourceStatus.sites = 'success';
    rerender();

    await waitFor(() => {
      expect(result.current.kpiNetResult.status).toBe('no_data');
    });
    expect(result.current.loading).toBe(false);
    expect(mockGetKpis).not.toHaveBeenCalled();
  });
});
