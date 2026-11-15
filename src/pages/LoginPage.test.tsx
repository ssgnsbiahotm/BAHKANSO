import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginPage } from './LoginPage';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { useToast } from '@/lib/Toast';
import { validatePasswordStrength } from '@/lib/password';
import { validateEmail } from '@/lib/validation/schemas';

const toastShow = vi.fn();

vi.mock('@/lib/DataContext', () => ({
  useData: vi.fn(),
}));
vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('@/lib/Toast', () => ({
  useToast: () => ({ show: toastShow, success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}));
vi.mock('@/lib/password', () => ({
  validatePasswordStrength: vi.fn(() => ({ isValid: true, errors: [] })),
}));
vi.mock('@/lib/validation/schemas', () => ({
  validateEmail: vi.fn((val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)),
}));
vi.mock('react-router-dom', () => {
  const navigate = vi.fn();
  return {
    useNavigate: () => navigate,
    navigate,
  };
});
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return actual;
});

const mockUseAuth = vi.mocked(useAuth);
const mockUseData = vi.mocked(useData);
const mockValidatePasswordStrength = vi.mocked(validatePasswordStrength);
const mockValidateEmail = vi.mocked(validateEmail);

function setup({
  mode = 'login',
  signInResult = { error: null },
  signUpResult = { error: null, emailRequiresConfirmation: false },
  resetPasswordResult = { error: null },
  appUser = { id: 'u1', name: 'Test User', email: 'test@ferme.ci', role: 'gestionnaire', auth_id: 'auth-1' },
}: {
  mode?: 'login' | 'signup' | 'forgot';
  signInResult?: { error: string | null };
  signUpResult?: { error: string | null; emailRequiresConfirmation?: boolean };
  resetPasswordResult?: { error: string | null };
  appUser?: { id: string; name: string; email: string; role: string; auth_id: string };
} = {}) {
  mockUseAuth.mockReturnValue({
    signIn: vi.fn().mockResolvedValue(signInResult),
    signUp: vi.fn().mockResolvedValue(signUpResult),
    resetPassword: vi.fn().mockResolvedValue(resetPasswordResult),
    appUser,
    loading: false,
  } as never);

  mockUseData.mockReturnValue({
    siteContent: { branding: { value: {} }, login: { value: {} } },
    farm: { id: 'farm-1', name: 'Test Farm' },
  } as never);

  toastShow.mockClear();
  mockValidateEmail.mockImplementation((val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val));
  mockValidatePasswordStrength.mockReturnValue({ isValid: true, errors: [] });
}

describe('LoginPage — mode connexion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setup({ mode: 'login' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TEST 1 — login valide appelle signIn et redirige vers /app', async () => {
    const { signIn } = mockUseAuth();
    const { navigate } = await import('react-router-dom');
    vi.mocked(navigate).mockClear();

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/vous@ferme.ci/), {
      target: { value: 'test@ferme.ci' },
    });
    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/)[0], {
      target: { value: 'Password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Se connecter/ }));

    await vi.waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('test@ferme.ci', 'Password123');
    });
    expect(navigate).toHaveBeenCalledWith('/app', { replace: true });
    expect(toastShow).toHaveBeenCalledWith('Connexion réussie');
  });

  it('TEST 2 — login avec email invalide affiche une erreur', async () => {
    mockValidateEmail.mockReturnValue(false);

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/vous@ferme.ci/), {
      target: { value: 'not-an-email' },
    });
    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/)[0], {
      target: { value: 'Password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Se connecter/ }));

    expect(screen.getByText(/Format d'email invalide/)).toBeInTheDocument();
    expect(mockUseAuth().signIn).not.toHaveBeenCalled();
  });

  it('TEST 3 — login avec mot de passe incorrect affiche un toast d\'erreur', async () => {
    const { signIn } = mockUseAuth();
    vi.mocked(signIn).mockResolvedValueOnce({ error: 'Invalid credentials' });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/vous@ferme.ci/), {
      target: { value: 'test@ferme.ci' },
    });
    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/)[0], {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Se connecter/ }));

    await vi.waitFor(() => {
      expect(toastShow).toHaveBeenCalledWith('Email ou mot de passe incorrect', 'error');
    });
  });

  it('TEST 4 — bascule vers le mode inscription', async () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: /S'inscrire/ }));

    expect(screen.getByRole('button', { name: /Créer mon compte/ })).toBeInTheDocument();
    // Le ModeLink "Se connecter" (pour revenir au login) est aussi présent en mode signup
  });

  it('TEST 5 — bascule vers le mode mot de passe oublié', async () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: /Mot de passe oublié/ }));

    expect(screen.getByRole('button', { name: /Envoyer le lien/ })).toBeInTheDocument();
  });
});

describe('LoginPage — mode inscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setup({ mode: 'signup' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TEST 6 — inscription valide appelle signUp avec email, password, name', async () => {
    const { signUp } = mockUseAuth();

    render(<LoginPage />);

    // Passer en mode inscription
    fireEvent.click(screen.getByRole('button', { name: /S'inscrire/ }));

    // Cocher la case "conditions d'utilisation" (input id="terms")
    fireEvent.click(screen.getByRole('checkbox'));

    fireEvent.change(screen.getByPlaceholderText(/Jean Kouassi/), {
      target: { value: 'Jean Kouassi' },
    });
    fireEvent.change(screen.getByPlaceholderText(/vous@ferme.ci/), {
      target: { value: 'newuser@ferme.ci' },
    });
    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/)[0], {
      target: { value: 'Password123' },
    });
    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/)[1], {
      target: { value: 'Password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Créer mon compte/ }));

    await vi.waitFor(() => {
      expect(signUp).toHaveBeenCalledWith('newuser@ferme.ci', 'Password123', 'Jean Kouassi');
    });
  });

  it('TEST 7 — mot de passe trop court bloque l\'inscription', async () => {
    mockValidatePasswordStrength.mockReturnValue({
      isValid: false,
      errors: ['Au moins 8 caractères'],
    });

    render(<LoginPage />);

    // Passer en mode inscription
    fireEvent.click(screen.getByRole('button', { name: /S'inscrire/ }));

    // Cocher la case "conditions d'utilisation" (input id="terms")
    fireEvent.click(screen.getByRole('checkbox'));

    fireEvent.change(screen.getByPlaceholderText(/Jean Kouassi/), {
      target: { value: 'Jean Kouassi' },
    });
    fireEvent.change(screen.getByPlaceholderText(/vous@ferme.ci/), {
      target: { value: 'newuser@ferme.ci' },
    });
    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/)[0], {
      target: { value: 'short' },
    });
    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/)[1], {
      target: { value: 'short' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Créer mon compte/ }));

    expect(screen.getByText(/Au moins 8 caractères/)).toBeInTheDocument();
    expect(mockUseAuth().signUp).not.toHaveBeenCalled();
  });

  it('TEST 8 — emails différents bloquent l\'inscription', async () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: /S'inscrire/ }));

    fireEvent.change(screen.getByPlaceholderText(/Jean Kouassi/), {
      target: { value: 'Jean Kouassi' },
    });
    fireEvent.change(screen.getByPlaceholderText(/vous@ferme.ci/), {
      target: { value: 'newuser@ferme.ci' },
    });
    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/)[0], {
      target: { value: 'Password123' },
    });
    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/)[1], {
      target: { value: 'Different123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Créer mon compte/ }));

    expect(screen.getByText(/Les mots de passe ne correspondent pas/)).toBeInTheDocument();
    expect(mockUseAuth().signUp).not.toHaveBeenCalled();
  });

  it('TEST 9 — email déjà existant affiche le bon message', async () => {
    const { signUp } = mockUseAuth();
    vi.mocked(signUp).mockResolvedValueOnce({ error: 'User already exists' });

    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: /S'inscrire/ }));

    // Cocher la case "conditions d'utilisation"
    fireEvent.click(screen.getByRole('checkbox'));

    fireEvent.change(screen.getByPlaceholderText(/Jean Kouassi/), {
      target: { value: 'Jean Kouassi' },
    });
    fireEvent.change(screen.getByPlaceholderText(/vous@ferme.ci/), {
      target: { value: 'existing@ferme.ci' },
    });
    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/)[0], {
      target: { value: 'Password123' },
    });
    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/)[1], {
      target: { value: 'Password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Créer mon compte/ }));

    await vi.waitFor(() => {
      expect(toastShow).toHaveBeenCalledWith(
        'Un compte existe déjà avec cet email',
        'error',
      );
    });
  });
});

describe('LoginPage — mode mot de passe oublié', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setup({ mode: 'forgot' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TEST 10 — email valide appelle resetPassword et bascule vers login', async () => {
    const { resetPassword } = mockUseAuth();

    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: /Mot de passe oublié/ }));

    fireEvent.change(screen.getByPlaceholderText(/vous@ferme.ci/), {
      target: { value: 'test@ferme.ci' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Envoyer le lien/ }));

    await vi.waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith('test@ferme.ci');
    });
    expect(toastShow).toHaveBeenCalledWith('Un lien de réinitialisation a été envoyé à votre email');
  });

  it('TEST 11 — email invalide bloque la demande de réinitialisation', async () => {
    mockValidateEmail.mockReturnValue(false);

    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: /Mot de passe oublié/ }));

    fireEvent.change(screen.getByPlaceholderText(/vous@ferme.ci/), {
      target: { value: 'not-an-email' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Envoyer le lien/ }));

    expect(screen.getByText(/Format d'email invalide/)).toBeInTheDocument();
    expect(mockUseAuth().resetPassword).not.toHaveBeenCalled();
  });
});
