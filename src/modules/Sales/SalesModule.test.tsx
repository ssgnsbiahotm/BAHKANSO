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

// Espions distincts par table/opération : aucune valeur de retour partagée
// entre sales et sale_items, afin d'assert finement chaque appel Supabase.
const salesUpdateSpy = vi.fn();
const salesEqSpy = vi.fn();
const saleItemsDeleteSpy = vi.fn();
const saleItemsDeleteEqSpy = vi.fn();
const saleItemsInsertSpy = vi.fn();

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

function salesChain(eqResult: { error: any } = { error: null }) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: salesEqSpy.mockResolvedValue(eqResult),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  chain.update = salesUpdateSpy.mockReturnValue(chain);
  return chain;
}

function saleItemsChain(deleteEqResult: { error: any } = { error: null }) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: saleItemsDeleteEqSpy.mockResolvedValue(deleteEqResult),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  chain.delete = saleItemsDeleteSpy.mockReturnValue(chain);
  // insert n'est pas chaîné avec .eq dans le code : il se résout directement.
  chain.insert = saleItemsInsertSpy.mockResolvedValue({ error: null });
  return chain;
}

function setupSupabase({ saleItemsDeleteError }: { saleItemsDeleteError?: any } = {}) {
  mockFrom.mockImplementation(((table: string) => {
    if (table === 'sales') return salesChain({ error: null });
    if (table === 'sale_items') return saleItemsChain({ error: saleItemsDeleteError });
    return salesChain({ error: null });
  }) as any);
}

function renderSales(overrides: {
  sales?: any[];
  customers?: any[];
  loading?: boolean;
  saleItemsDeleteError?: any;
  availableSites?: any[];
} = {}) {
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
  toastMock.show.mockClear();
  toastMock.success.mockClear();
  toastMock.error.mockClear();
  toastMock.info.mockClear();
  mockLogAudit.mockClear();
  salesUpdateSpy.mockClear();
  salesEqSpy.mockClear();
  saleItemsDeleteSpy.mockClear();
  saleItemsDeleteEqSpy.mockClear();
  saleItemsInsertSpy.mockClear();
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

    await waitFor(() => expect(saleItemsDeleteSpy).toHaveBeenCalled());
    await waitFor(() => expect(toastMock.show).toHaveBeenCalled());

    // L update de sales précède encore les opérations sur ses articles :
    // le risque d écritures partielles n est pas masqué.
    expect(salesUpdateSpy).toHaveBeenCalled();
    expect(salesEqSpy).toHaveBeenCalledWith('id', sale.id);

    // Suppression des anciens articles tentée sur le bon sale_id.
    expect(saleItemsDeleteSpy).toHaveBeenCalled();
    expect(saleItemsDeleteEqSpy).toHaveBeenCalledWith('sale_id', sale.id);

    // Aucun nouvel article inséré en cas d échec du delete.
    expect(saleItemsInsertSpy).not.toHaveBeenCalled();

    // Pas de log d audit ni de toast de succès.
    expect(mockLogAudit).not.toHaveBeenCalled();
    expect(toastMock.show.mock.calls.some(([msg]) => String(msg).includes('Vente modifiée'))).toBe(false);

    // Le toast d erreur du formulaire a bien été levé (onError).
    expect(toastMock.show.mock.calls.some(([msg]) => String(msg).includes('Erreur:'))).toBe(true);

    // La fenêtre reste ouverte après l erreur.
    expect(screen.getByText('Éditer la vente')).toBeInTheDocument();
  });

  it('modification réussie : anciens articles supprimés, nouveaux insérés, audit et toast de succès', async () => {
    renderSales();

    const modifier = screen.getByRole('button', { name: /Modifier/ });
    fireEvent.click(modifier);
    expect(screen.getByText('Éditer la vente')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(mockLogAudit).toHaveBeenCalled());

    // Update de la vente sur l identifiant attendu.
    expect(salesUpdateSpy).toHaveBeenCalled();
    expect(salesEqSpy).toHaveBeenCalledWith('id', sale.id);

    // Suppression des anciens articles sur le sale_id attendu.
    expect(saleItemsDeleteSpy).toHaveBeenCalled();
    expect(saleItemsDeleteEqSpy).toHaveBeenCalledWith('sale_id', sale.id);

    // Insertion des nouveaux articles avec leurs données.
    expect(saleItemsInsertSpy).toHaveBeenCalled();
    const inserted = saleItemsInsertSpy.mock.calls[0][0];
    expect(Array.isArray(inserted)).toBe(true);
    expect(inserted.every((item: any) => item.sale_id === sale.id)).toBe(true);
    expect(inserted.map((item: any) => item.description).sort()).toEqual(['Maïs', 'Riz']);
    expect(inserted.map((item: any) => item.total).sort((a: number, b: number) => a - b)).toEqual([5000, 10000]);

    // Audit et toast de succès.
    expect(mockLogAudit).toHaveBeenCalledWith(
      'Test User',
      'UPDATE',
      'sale',
      'VTE-2026-0001',
      'Vente VTE-2026-0001 modifiée',
    );
    expect(toastMock.show).toHaveBeenCalledWith('Vente modifiée');

    // La modale se ferme après succès.
    expect(screen.queryByText('Éditer la vente')).not.toBeInTheDocument();
  });
});
