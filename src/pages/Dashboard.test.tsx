import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import type { SourceStatus } from '@/lib/DataContext';

vi.mock('@/lib/DataContext', () => ({
  useData: vi.fn(),
}));
vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn(() => ({ appUser: { id: 'u1', name: 'Test', auth_id: 'a1', farm_id: 'f1', role: 'administrateur' } })),
}));
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    Link: ({ children, to, ...props }: any) => <a href={to || '#'} {...props}>{children}</a>,
  };
});
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return actual;
});

const mockUseData = useData as ReturnType<typeof vi.fn>;
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

function renderDash(overrides: {
  role?: string;
  sourceStatus?: Partial<SourceStatus>;
  arrays?: Record<string, any[]>;
  loading?: boolean;
  error?: string | null;
} = {}) {
  const status: SourceStatus = {
    transactions: 'success', expenses: 'success', inventoryItems: 'success',
    projects: 'success', alerts: 'success', animals: 'success',
    animalLots: 'success', campaigns: 'success',
    ...overrides.sourceStatus,
  };
  const arrays = {
    animals: [], animalLots: [], campaigns: [], projects: [],
    expenses: [], transactions: [], inventoryItems: [], alerts: [],
    ...overrides.arrays,
  };
  const sourceError: Record<string, string | null> = {};
  for (const [s, st] of Object.entries(status)) {
    if (st === 'error') sourceError[s] = 'Erreur de chargement';
  }
  mockUseData.mockReturnValue({
    ...arrays,
    loading: overrides.loading ?? false,
    error: overrides.error ?? null,
    sourceStatus: status,
    sourceError,
  });
  mockUseAuth.mockReturnValue({
    appUser: { id: 'u1', name: 'Test', auth_id: 'a1', farm_id: 'f1', role: overrides.role ?? 'administrateur' },
  });
  return render(<BrowserRouter><Dashboard /></BrowserRouter>);
}

describe('Dashboard', () => {
  beforeEach(() => {
    mockUseData.mockClear();
    mockUseAuth.mockClear();
  });

  it('le bouton d explication ouvre/ferme et met a jour ses attributs ARIA', () => {
    renderDash({ role: 'administrateur' });
    const btn = screen.getByRole('button', { name: /Comprendre les chiffres/ });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(btn).toHaveAttribute('aria-controls', 'dashboard-finance-help');

    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Ces indicateurs présentent/)).toBeInTheDocument();

    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/Ces indicateurs présentent/)).not.toBeInTheDocument();
  });

  it('les restrictions d affichage financier sont preservees pour les roles non autorises', () => {
    renderDash({ role: 'visiteur' });
    expect(screen.getByText(/Accès r\u00e9serv/)).toBeInTheDocument();
    expect(screen.queryByText(/Solde des mouvements/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Entr\u00e9es/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sorties/)).not.toBeInTheDocument();
  });

  it("la mention 'Aucune priorite detectee' n apparait pas si une source prioritaire est indisponible", () => {
    renderDash({ sourceStatus: { expenses: 'error' }, arrays: { expenses: [], transactions: [] } });
    expect(screen.queryByText(/Aucune priorit\u00e9 d\u00e9tecte/)).not.toBeInTheDocument();
    expect(screen.getByText(/Certaines sources de priorit\u00e9 sont indisponibles/)).toBeInTheDocument();
  });

  it("l etat vraiment vide affiche 'Aucune priorite detectee' quand toutes les sources sont disponibles", () => {
    renderDash({});
    // eslint-disable-next-line no-console
    console.log("DEBUG4_BODY_START");
    // eslint-disable-next-line no-console
    console.log(document.body.innerHTML);
    // eslint-disable-next-line no-console
    console.log("DEBUG4_BODY_END");
    expect(document.body.innerHTML).toContain("Aucune priorité détecte");
  });

  it("les transactions en erreur n affichent pas 'Aucune operation' mais une indisponibilite explicite", () => {
    renderDash({ sourceStatus: { transactions: 'error' }, arrays: { transactions: [] } });
    expect(screen.getByText(/La source des transactions est indisponible/)).toBeInTheDocument();
    expect(screen.queryByText(/Aucune op\u00e9ration/)).not.toBeInTheDocument();
  });
});
