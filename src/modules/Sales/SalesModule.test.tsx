import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SalesModule } from './SalesModule';
import { useSalesData } from '@/modules/Sales/hooks/useSalesData';
import { useSite } from '@/lib/SiteContext';
import { useToast } from '@/lib/Toast';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/types';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/modules/Sales/hooks/useSalesData');
vi.mock('@/lib/SiteContext');
vi.mock('@/lib/Toast', () => ({
  useToast: () => toastMock,
}));
vi.mock('@/lib/types', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/types')>();
  return { ...actual, logAudit: vi.fn() };
});
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return actual;
});

const toastMock = {
  show: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
};

const mockUseSalesData = useSalesData as ReturnType<typeof vi.fn>;
const mockUseSite = useSite as ReturnType<typeof vi.fn>;
const mockLogAudit = logAudit as ReturnType<typeof vi.fn>;
const mockFrom = vi.mocked(supabase.from);

const insertMock = vi.fn().mockReturnThis();
const deleteMock = vi.fn().mockReturnThis();
const updateMock = vi.fn().mockReturnThis();

const sale = {
  id: 'sale-1',
  reference: 'VTE-2026-0001',
  site_id: 'site-1',
  customer_id: 'cust-1',
  date: '2026-10-10',
  payment_method: 'espèces',
  total_amount: 15000,
  status: 'payée',
  customer: { id: 'cust-1', name: 'Client Test', type: 'particulier' },
  site: { id: 'site-1', name: 'Site A', code: 'SA' },
  items: [
    { id: 'item-1', description: 'Maïs', quantity: 10, unit: 'kg', unit_price: 1000, total: 10000 },
    { id: 'item-2', description: 'Riz', quantity: 5, unit: 'kg', unit_price: 1000, total: 5000 },
  ],
};

function buildChain(eqResult: { error: any } = { error: null }) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue(eqResult),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  chain.insert = insertMock.mockReturnValue(chain);
  chain.update = updateMock.mockReturnValue(chain);
  chain.delete = deleteMock.mockReturnValue(chain);
  return chain;
}

function setupSupabase({ saleItemsDeleteError }: { saleItemsDeleteError?: any } = {}) {
  mockFrom.mockImplementation((() => {
    const chains = new Map<string, ReturnType<typeof buildChain>>();
    return (table: string) => {
      if (!chains.has(table)) {
        chains.set(table, table === 'sale_items' ? buildChain({ error: saleItemsDeleteError }) : buildChain({ error: null }));
      }
      return chains.get(table)!;
    };
  })() as any);
}

function renderSales(overrides: { sales?: any[]; customers?: any[]; loading?: boolean; saleItemsDeleteError?: any; availableSites?: any[] } = {}) {
  setupSupabase({ saleItemsDeleteError: overrides.saleItemsDeleteError });
  mockUseSalesData.mockReturnValue({
    sales: overrides.sales ?? [sale],
    customers: overrides.customers ?? [sale.customer],
    loading: overrides.loading ?? false,
    refresh: vi.fn(),
    stats: null,
    error: null,
    deleteSale: vi.fn(),
  });
  mockUseSite.mockReturnValue({
    currentSiteId: null,
    availableSites: overrides.availableSites ?? [{ id: 'site-1', name: 'Site A', code: 'SA' }],
    isGlobalView: true,
    setCurrentSiteId: vi.fn(),
    currentSite: null,
  });
  return render(<BrowserRouter><SalesModule /></BrowserRouter>);
}

beforeEach(() => {
  toastMock.success.mockClear();
  toastMock.error.mockClear();
  toastMock.info.mockClear();
  mockLogAudit.mockClear();
  insertMock.mockClear();
  deleteMock.mockClear();
  updateMock.mockClear();
  mockFrom.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SalesModule — régression (Éditer la vente)', () => {
  it('le bouton Modifier (face avant) ouvre la modale et pré-remplit la vente + les articles', () => {
    renderSales();

    const modifier = screen.getByRole('button', { name: /Modifier/ });
    fireEvent.click(modifier);

    expect(screen.getByText('Éditer la vente')).toBeInTheDocument();

    expect((screen.getByLabelText(/Site/) as HTMLSelectElement).value).toBe('site-1');
    expect((screen.getByLabelText(/Client/) as HTMLSelectElement).value).toBe('cust-1');
    expect((screen.getByLabelText(/Date/) as HTMLInputElement).value).toBe('2026-10-10');

    const descriptions = screen.getAllByLabelText(/Description/);
    expect(descriptions[0]).toHaveValue('Maïs');
    expect(descriptions[1]).toHaveValue('Riz');
  });

  it('si la suppression des anciens articles échoue, aucun nouvel article n est inséré, pas de succès ni d audit, erreur de formulaire respectée', async () => {
    const deleteError = { message: 'Contrainte d intégrité' };
    renderSales({ saleItemsDeleteError: deleteError });

    const modifier = screen.getByRole('button', { name: /Modifier/ });
    fireEvent.click(modifier);
    expect(screen.getByText('Éditer la vente')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(deleteMock).toHaveBeenCalled());
    await waitFor(() => expect(toastMock.show).toHaveBeenCalled());

    // Aucun nouvel article inséré
    expect(insertMock).not.toHaveBeenCalled();
    // Pas de log d audit ni de toast de succès
    expect(mockLogAudit).not.toHaveBeenCalled();
    expect(toastMock.show.mock.calls.some(([msg]) => String(msg).includes('Vente modifiée'))).toBe(false);
    // Le toast d erreur du formulaire a bien été levé
    expect(toastMock.show.mock.calls.some(([msg]) => String(msg).includes('Erreur:'))).toBe(true);
  });

  it('modification réussie : anciens articles supprimés, nouveaux insérés, audit et toast de succès', async () => {
    renderSales();

    const modifier = screen.getByRole('button', { name: /Modifier/ });
    fireEvent.click(modifier);
    expect(screen.getByText('Éditer la vente')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(mockLogAudit).toHaveBeenCalled());

    expect(updateMock).toHaveBeenCalled();
    expect(deleteMock).toHaveBeenCalled();
    expect(insertMock).toHaveBeenCalled();

    expect(mockLogAudit).toHaveBeenCalledWith(
      'Test User',
      'UPDATE',
      'sale',
      'VTE-2026-0001',
      'Vente VTE-2026-0001 modifiée',
    );
    expect(toastMock.show).toHaveBeenCalledWith('Vente modifiée');

    // La modale se ferme après succès
    expect(screen.queryByText('Éditer la vente')).not.toBeInTheDocument();
  });
});
