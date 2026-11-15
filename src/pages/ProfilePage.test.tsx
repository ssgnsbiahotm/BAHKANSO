import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfilePage } from './ProfilePage';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/Toast';
import { supabase } from '@/lib/supabase';
import { validatePasswordStrength } from '@/lib/password';
import { logAudit } from '@/lib/types';

const toastShow = vi.fn();

vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('@/lib/Toast', () => ({
  useToast: () => ({ show: toastShow, success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    auth: {
      updateUser: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));
vi.mock('@/lib/password', () => ({
  validatePasswordStrength: vi.fn(() => ({ isValid: true, errors: [] })),
}));
vi.mock('@/lib/types', () => ({
  logAudit: vi.fn(),
}));
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return actual;
});

const mockUseAuth = vi.mocked(useAuth);
const mockSupabase = vi.mocked(supabase);
const mockValidatePasswordStrength = vi.mocked(validatePasswordStrength);
const mockLogAudit = vi.mocked(logAudit);

function setup({
  appUser = {
    id: 'u1',
    auth_id: 'auth-1',
    name: 'Test User',
    email: 'test@ferme.ci',
    role: 'gestionnaire',
    phone: '+225 07 00 00 00',
    active: true,
    last_login: null,
    created_at: '2026-01-01',
    site_id: 'site-1',
  },
  updatePasswordResult = { error: null },
  updateProfileResult = { error: null },
}: {
  appUser?: Record<string, unknown>;
  updatePasswordResult?: { error: string | null };
  updateProfileResult?: { error: string | null };
} = {}) {
  mockUseAuth.mockReturnValue({
    appUser,
    signOut: vi.fn().mockResolvedValue(undefined),
    updatePassword: vi.fn().mockResolvedValue(updatePasswordResult),
    refreshAppUser: vi.fn().mockResolvedValue(undefined),
  } as never);

  toastShow.mockClear();

  mockValidatePasswordStrength.mockReturnValue({ isValid: true, errors: [] });

  const mockUpdate = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockResolvedValue(updateProfileResult);
  mockSupabase.from.mockReturnValue({
    update: mockUpdate,
    eq: mockEq,
  } as never);
}

describe('ProfilePage — affichage du profil', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TEST 1 — affiche les informations du profil quand appUser est chargé', () => {
    render(<ProfilePage />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@ferme.ci')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+225 07 00 00 00')).toBeInTheDocument();
    expect(screen.getByText('Gestionnaire')).toBeInTheDocument();
  });

  it('TEST 2 — affiche un état de chargement quand appUser est null', () => {
    setup({ appUser: null as unknown as Record<string, unknown> });

    render(<ProfilePage />);

    expect(screen.getByText(/Chargement du profil/)).toBeInTheDocument();
  });
});

describe('ProfilePage — enregistrement du profil', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TEST 3 — sauvegarde valide met à jour app_users, logAudit et refreshAppUser', async () => {
    const mockUpdate = vi.mocked(mockSupabase.from().update);
    const mockEq = vi.mocked(mockSupabase.from().eq);

    render(<ProfilePage />);

    fireEvent.change(screen.getByDisplayValue('Test User'), {
      target: { value: 'Nouveau Nom' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await vi.waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        name: 'Nouveau Nom',
        phone: '+225 07 00 00 00',
      });
    });
    await vi.waitFor(() => {
      expect(mockEq).toHaveBeenCalledWith('id', 'u1');
      expect(mockLogAudit).toHaveBeenCalled();
      expect(mockUseAuth().refreshAppUser).toHaveBeenCalled();
      expect(toastShow).toHaveBeenCalledWith('Profil mis à jour avec succès');
    });
  });

  it('TEST 4 — nom vide bloque la sauvegarde et affiche une erreur', async () => {
    render(<ProfilePage />);

    fireEvent.change(screen.getByDisplayValue('Test User'), {
      target: { value: '   ' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    expect(toastShow).toHaveBeenCalledWith('Le nom est requis', 'error');
    expect(mockSupabase.from).not.toHaveBeenCalledWith('app_users');
  });

  it('TEST 5 — erreur Supabase affiche un toast d\'erreur', async () => {
    const mockEq = vi.mocked(mockSupabase.from().eq);
    vi.mocked(mockEq).mockResolvedValueOnce({ error: { message: 'DB error' } });

    render(<ProfilePage />);

    fireEvent.change(screen.getByDisplayValue('Test User'), {
      target: { value: 'Nouveau Nom' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await vi.waitFor(() => {
      expect(toastShow).toHaveBeenCalledWith('Erreur: DB error', 'error');
    });
  });
});

describe('ProfilePage — changement de mot de passe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TEST 6 — mot de passe valide appelle updatePassword et vide les champs', async () => {
    const { updatePassword } = mockUseAuth();

    render(<ProfilePage />);

    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/)[0], {
      target: { value: 'NouveauPass123' },
    });
    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/)[1], {
      target: { value: 'NouveauPass123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Modifier le mot de passe/ }));

    await vi.waitFor(() => {
      expect(updatePassword).toHaveBeenCalledWith('NouveauPass123');
    });
    expect(toastShow).toHaveBeenCalledWith('Mot de passe modifié avec succès');
  });

  it('TEST 7 — mot de passe trop court affiche une erreur de validation', async () => {
    mockValidatePasswordStrength.mockReturnValue({
      isValid: false,
      errors: ['Au moins 8 caractères'],
    });

    render(<ProfilePage />);

    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/)[0], {
      target: { value: 'short' },
    });
    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/)[1], {
      target: { value: 'short' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Modifier le mot de passe/ }));

    expect(toastShow).toHaveBeenCalledWith('Au moins 8 caractères', 'error');
    expect(mockUseAuth().updatePassword).not.toHaveBeenCalled();
  });

  it('TEST 8 — mots de passe différents affiche une erreur via toast', async () => {
    render(<ProfilePage />);

    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/)[0], {
      target: { value: 'Password123' },
    });
    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/)[1], {
      target: { value: 'Different123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Modifier le mot de passe/ }));

    expect(toastShow).toHaveBeenCalledWith('Les mots de passe ne correspondent pas', 'error');
    expect(mockUseAuth().updatePassword).not.toHaveBeenCalled();
  });

  it('TEST 9 — erreur updatePassword affiche un toast d\'erreur', async () => {
    const { updatePassword } = mockUseAuth();
    vi.mocked(updatePassword).mockResolvedValueOnce({ error: 'Weak password' });

    render(<ProfilePage />);

    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/)[0], {
      target: { value: 'NouveauPass123' },
    });
    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/)[1], {
      target: { value: 'NouveauPass123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Modifier le mot de passe/ }));

    await vi.waitFor(() => {
      expect(toastShow).toHaveBeenCalledWith('Erreur: Weak password', expect.anything());
    });
  });
});

describe('ProfilePage — déconnexion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TEST 10 — déconnexion appelle signOut', async () => {
    const { signOut } = mockUseAuth();

    render(<ProfilePage />);

    fireEvent.click(screen.getByRole('button', { name: /Se déconnecter/ }));

    await vi.waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
  });
});
