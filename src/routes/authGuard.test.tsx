import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RequireAuth, RequireModule } from './authGuard';
import { useAuth } from '@/lib/AuthContext';

vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
    useLocation: () => ({ pathname: '/app/surveillance' }),
  };
});

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

function renderGuard(
  element: React.ComponentType<any>,
  children: React.ReactNode,
  overrides: {
    loading?: boolean;
    appUserLoading?: boolean;
    authUser: { id: string; email: string } | null;
    appUser: { id: string; role: string } | null;
  }
) {
  mockUseAuth.mockReturnValue({
    loading: overrides.loading ?? false,
    appUserLoading: overrides.appUserLoading ?? false,
    authUser: overrides.authUser,
    appUser: overrides.appUser,
  } as never);

  return render(React.createElement(element, { module: 'surveillance', children }));
}

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));
    mockUseAuth.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('affiche un etat de chargement pendant le chargement du profil (pas de redirection prematuree)', () => {
    renderGuard(
      RequireAuth,
      <div data-testid="children">Contenu app</div>,
      { loading: false, appUserLoading: true, authUser: { id: 'u1', email: 'a@b.fr' }, appUser: null }
    );
    expect(screen.queryByTestId('children')).not.toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('affiche un etat de chargement pendant le chargement de la session initiale', () => {
    renderGuard(
      RequireAuth,
      <div data-testid="children">Contenu app</div>,
      { loading: true, appUserLoading: false, authUser: null, appUser: null }
    );
    expect(screen.queryByTestId('children')).not.toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('redirige vers /login quand la session est resoute mais qu il n y a pas de profil metier', () => {
    renderGuard(
      RequireAuth,
      <div data-testid="children">Contenu app</div>,
      { loading: false, appUserLoading: false, authUser: { id: 'u1', email: 'a@b.fr' }, appUser: null }
    );
    const navigate = screen.getByTestId('navigate');
    expect(navigate).toHaveAttribute('data-to', '/login');
    expect(screen.queryByTestId('children')).not.toBeInTheDocument();
  });

  it('affiche les enfants quand utilisateur est authentifie avec un profil metier', () => {
    renderGuard(
      RequireAuth,
      <div data-testid="children">Contenu app</div>,
      {
        loading: false,
        appUserLoading: false,
        authUser: { id: 'u1', email: 'a@b.fr' },
        appUser: { id: 'u1', role: 'financeur' },
      }
    );
    expect(screen.getByTestId('children')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });
});

describe('RequireModule', () => {
  it('affiche un etat de chargement pendant le chargement du profil', () => {
    renderGuard(
      RequireModule,
      <div data-testid="children">Contenu module</div>,
      { loading: false, appUserLoading: true, authUser: { id: 'u1', email: 'a@b.fr' }, appUser: null }
    );
    expect(screen.queryByTestId('children')).not.toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });
});
