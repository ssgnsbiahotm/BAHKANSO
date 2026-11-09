import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UsersPage } from './UsersPage';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { AppUser } from '@/lib/types';

vi.mock('@/lib/DataContext', () => ({
  useData: vi.fn(),
}));
vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn(),
}));
// useSite doit retourner un objet valide même si le mock de SalesModule.test
// a fuité (singleFork). Sinon SalesModule.tsx:72 plante en détruisant currentSiteId.
vi.mock('@/lib/SiteContext', () => ({
  useSite: vi.fn(() => ({
    currentSiteId: null,
    availableSites: [],
    isGlobalView: true,
    setCurrentSiteId: vi.fn(),
    currentSite: null,
  })),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { signUp: vi.fn() },
    from: vi.fn(),
  },
}));
vi.mock('@/lib/Toast', () => ({
  useToast: () => ({ show: vi.fn(), success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}));
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return actual;
});

const mockSignUp = vi.mocked(supabase.auth.signUp);
const mockFrom = vi.mocked(supabase.from);
const mockAppUsersUpdate = vi.fn();
const mockUseData = vi.mocked(useData);
const mockUseAuth = vi.mocked(useAuth);

function setup({
  sites,
  users,
  role = 'administrateur',
}: {
  sites: { id: string; name: string }[];
  users: AppUser[];
  role?: string;
}) {
  mockUseData.mockReturnValue({
    users,
    sites,
    refresh: vi.fn(),
  } as never);
  mockUseAuth.mockReturnValue({
    appUser: { id: 'admin-1', name: 'Admin', role } as never,
  } as never);

  mockFrom.mockImplementation((table: string) => {
    if (table === 'app_users') {
      return {
        update: (payload: Record<string, unknown>) => ({
          eq: () => {
            mockAppUsersUpdate(payload);
            return Promise.resolve({ data: [], error: null });
          },
        }),
      } as never;
    }
    if (table === 'sites') {
      return {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: sites, error: null }),
      } as never;
    }
    return { insert: vi.fn().mockResolvedValue({ data: null, error: null }) } as never;
  });

  mockSignUp.mockResolvedValue({
    data: { user: { id: 'auth-1', email_confirmed_at: '2026-01-01' } },
    error: null,
  } as never);
}

function fillForm() {
  fireEvent.change(screen.getByPlaceholderText(/Kouadio Mensah/), {
    target: { value: 'Test User' },
  });
  fireEvent.change(screen.getByPlaceholderText(/user@ferme.ci/), {
    target: { value: 'test@ferme.ci' },
  });
  fireEvent.change(screen.getAllByPlaceholderText(/••••••••/)[0], {
    target: { value: 'Password123' },
  });
  fireEvent.change(screen.getAllByPlaceholderText(/••••••••/)[1], {
    target: { value: 'Password123' },
  });
}

describe('UsersPage — création utilisateur avec site', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('TEST 1 — création normale transmet le site_id sélectionné', async () => {
    setup({
      sites: [{ id: 'site-1', name: 'Site Nord' }, { id: 'site-2', name: 'Site Sud' }],
      users: [],
    });

    render(<UsersPage />);

    fireEvent.click(screen.getByRole('button', { name: /Nouvel utilisateur/ }));
    fillForm();

    const selects = document.querySelectorAll('select');
    // select[0] = Rôle, select[1] = Site de rattachement
    const siteSelect = selects[1];
    expect(siteSelect).not.toBeNull();
    fireEvent.change(siteSelect as HTMLSelectElement, {
      target: { value: 'site-1' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Créer/ }));

    await vi.waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@ferme.ci',
          password: 'Password123',
        })
      );
    });

    expect(mockAppUsersUpdate).toHaveBeenCalledTimes(1);
    expect(mockAppUsersUpdate.mock.calls[0][0].site_id).toBe('site-1');
  });

  it('TEST 2 — aucun site sélectionné bloque la soumission', async () => {
    setup({
      sites: [{ id: 'site-1', name: 'Site Nord' }],
      users: [],
    });

    render(<UsersPage />);

    fireEvent.click(screen.getByRole('button', { name: /Nouvel utilisateur/ }));
    fillForm();
    // Aucun site sélectionné

    const createBtn = screen.getByRole('button', { name: /Créer/ });
    expect(createBtn).toBeDisabled();

    fireEvent.click(createBtn);
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('TEST 3 — aucun site accessible bloque la création et affiche un message', async () => {
    setup({ sites: [], users: [] });

    render(<UsersPage />);

    fireEvent.click(screen.getByRole('button', { name: /Nouvel utilisateur/ }));

    expect(
      screen.getByText(/Aucun site accessible pour la création d'un utilisateur/)
    ).toBeInTheDocument();

    const createBtn = screen.getByRole('button', { name: /Créer/ });
    expect(createBtn).toBeDisabled();
    expect(mockSignUp).not.toHaveBeenCalled();
  });
});
