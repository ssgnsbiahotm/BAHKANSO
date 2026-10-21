import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  ArrowLeft,
  User,
  AlertCircle,
  ShieldCheck,
  Zap,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { useToast } from '@/lib/Toast';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { Logo } from '@/components/ui/Logo';
import { validatePasswordStrength } from '@/lib/password';

import './LoginPage.css';

/* ==========================================================================
   DESIGN TOKENS & CONSTANTS
   ========================================================================== */

const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

interface BenefitCard {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor: string;
}

const BENEFIT_CARDS: BenefitCard[] = [
  {
    icon: ShieldCheck,
    title: 'Sécurisé',
    description: 'Vos données sont protégées par Supabase Auth avec chiffrement et authentification renforcée.',
    iconColor: 'text-primary-400',
  },
  {
    icon: Zap,
    title: 'Rapide',
    description: 'Création de compte en quelques secondes. Accédez immédiatement à votre tableau de bord.',
    iconColor: 'text-accent-400',
  },
  {
    icon: BarChart3,
    title: 'Pilotage',
    description: 'Suivez vos financements, dépenses, cultures et élevage avec une traçabilité complète.',
    iconColor: 'text-secondary-400',
  },
] as const;

type Mode = 'login' | 'signup' | 'forgot';

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  terms?: string;
}

interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  showPassword: boolean;
  loading: boolean;
  errors: FormErrors;
  acceptedTerms: boolean;
}

/* ==========================================================================
   HELPER COMPONENTS
   ========================================================================== */

function BenefitCard({ card, index }: { card: BenefitCard; index: number }) {
  const Icon = card.icon;
  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${100 + index * 150}ms` }}>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-primary-500/40">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 bg-primary-500/20 {card.iconColor} shadow-lg" aria-hidden="true">
          <Icon size={28} />
        </div>
        <h3 className="text-heading-sm font-bold text-white text-center mb-2">{card.title}</h3>
        <p className="text-body-sm text-neutral-400 leading-relaxed text-center">{card.description}</p>
      </div>
    </div>
  );
}

function InputField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
  error,
  showPasswordToggle,
  onTogglePassword,
  showPassword,
  autoComplete,
  disabled,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: LucideIcon;
  error?: string;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
  showPassword?: boolean;
  autoComplete?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400">{label}</label>
      <div className="relative">
        <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
        <input
          type={showPasswordToggle && showPassword ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`w-full pl-10 pr-10 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors ${
            error
              ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20'
              : 'border-neutral-200 dark:border-neutral-700 focus:border-primary-500 bg-white dark:bg-neutral-800'
          }`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${label.toLowerCase().replace(/\s+/g, '-')}-error` : undefined}
        />
        {showPasswordToggle && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${label.toLowerCase().replace(/\s+/g, '-')}-error`} className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function PrimaryButton({
  children,
  disabled,
  loading,
  className = '',
  type = 'submit',
}: {
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'submit' | 'button';
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0 ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="32" strokeDashoffset="8" strokeLinecap="round" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Chargement...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

function ModeLink({
  text,
  linkText,
  onClick,
}: {
  text: string;
  linkText: string;
  onClick: () => void;
}) {
  return (
    <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
      {text} <button type="button" onClick={onClick} className="text-primary-600 dark:text-primary-400 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500/20 rounded">{linkText}</button>
    </p>
  );
}

function QuoteSection({ quote, author }: { quote: string; author: string }) {
  if (!quote && !author) return null;
  return (
    <div className="relative mt-12 pt-6 border-t border-white/10 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
      <p className="text-sm text-neutral-200/80 italic leading-relaxed">« {quote} »</p>
      {author && <p className="text-xs text-neutral-300 mt-2">— {author}</p>}
    </div>
  );
}

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

export function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { signIn, signUp, resetPassword, authUser, appUser } = useAuth();
  const { siteContent, farm } = useData();

  const branding = useMemo(() => (siteContent.branding?.value as Record<string, string>) || {}, [siteContent]);
  const loginContent = useMemo(() => (siteContent.login?.value as Record<string, unknown>) || {}, [siteContent]);

  const [mode, setMode] = useState<Mode>('login');
  const [formState, setFormState] = useState<FormState>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    showPassword: false,
    loading: false,
    errors: {},
    acceptedTerms: false,
  });

  const updateField = useCallback(<K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }, []);

  const clearErrors = useCallback(() => {
    setFormState((prev) => ({ ...prev, errors: {} }));
  }, []);

  const switchMode = useCallback((newMode: Mode) => {
    setMode(newMode);
    clearErrors();
    if (newMode !== 'signup') {
      updateField('confirmPassword', '');
      updateField('acceptedTerms', false);
    }
    if (newMode !== 'login') {
      updateField('showPassword', false);
    }
  }, [clearErrors, updateField]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const { email, password, confirmPassword, name, acceptedTerms } = formState;
    const newErrors: FormErrors = {};

    if (!email) {
      newErrors.email = 'Adresse email requise';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (mode === 'signup') {
      if (!name.trim()) newErrors.name = 'Nom requis';
      if (!password) {
        newErrors.password = 'Mot de passe requis';
      } else {
        const pwdCheck = validatePasswordStrength(password);
        if (!pwdCheck.isValid) {
          newErrors.password = pwdCheck.errors.join(', ');
        }
      }
      if (!acceptedTerms) {
        newErrors.terms = 'Vous devez accepter les conditions d\'utilisation';
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    } else if (mode === 'login') {
      if (!password) newErrors.password = 'Mot de passe requis';
    } else if (mode === 'forgot' && !validateEmail(email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    setFormState((prev) => ({ ...prev, errors: newErrors }));
    if (Object.keys(newErrors).length > 0) return;

    setFormState((prev) => ({ ...prev, loading: true }));

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast.show('Email ou mot de passe incorrect', 'error');
       } else {
         toast.show('Connexion réussie');
          // Attendre que appUser soit chargé pour éviter que RequireAuth ne redirige vers /login
          // (race condition : onAuthStateCharge est asynchrone après signIn)
          if (appUser) {
            navigate('/app');
          } else {
            await new Promise((resolve) => setTimeout(resolve, 400));
            navigate('/app');
          }
       }
      } else if (mode === 'signup') {
        const { error, emailRequiresConfirmation } = await signUp(email, password, name.trim());
        if (error) {
          if (error.includes('already')) {
            toast.show('Un compte existe déjà avec cet email', 'error');
          } else {
            toast.show('Erreur: ' + error, 'error');
          }
        } else {
          if (emailRequiresConfirmation) {
            toast.show('Compte créé ! Vérifiez votre email pour confirmer votre inscription avant de vous connecter.', 'info');
          } else {
            toast.show('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
          }
          switchMode('login');
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          toast.show('Erreur: ' + error, 'error');
        } else {
          toast.show('Un lien de réinitialisation a été envoyé à votre email');
          switchMode('login');
        }
      }
    } finally {
      setFormState((prev) => ({ ...prev, loading: false }));
    }
  }, [formState, mode, signIn, signUp, resetPassword, toast, navigate, switchMode]);

  const appName = branding.appName || 'Bahkanso';
  const appTagline = branding.appTagline || '';
  const logoIcon = branding.logoIcon || 'Sprout';
  const logoColor = branding.logoColor || '#FFFFFF';
  const logoBgColor = branding.logoBgColor || '#16A34A';
  const logoUrl = farm?.logo_url ?? null;

  const heroTitle = (loginContent.title as string) || 'Pilotez votre exploitation en toute transparence';
  const heroSubtitle = (loginContent.subtitle as string) || 'Gérez financements, dépenses, cultures et élevage avec une traçabilité complète.';
  const heroQuote = (loginContent.quote as string) || '';
  const heroQuoteAuthor = (loginContent.quoteAuthor as string) || '';

  const modeLabels = {
    login: { title: 'Connexion', desc: 'Accédez à votre espace de pilotage' },
    signup: { title: 'Créer un compte', desc: 'Rejoignez la plateforme Bahkanso' },
    forgot: { title: 'Mot de passe oublié', desc: 'Entrez votre email pour recevoir un lien de réinitialisation' },
  };

  const currentMode = modeLabels[mode];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-50 dark:bg-neutral-950" lang="fr">
      {/* Marketing Side */}
      <div className="lg:w-1/2 relative bg-gradient-to-br from-primary-700 via-primary-800 to-neutral-900 text-white p-8 lg:p-12 flex flex-col justify-between overflow-hidden hidden lg:flex">
        {/* Ambient pattern */}
        <div className="absolute inset-0 opacity-5" aria-hidden="true">
          <svg viewBox="0 0 60 60" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative flex flex-col flex-1">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-10">
            <Logo
              icon={logoIcon}
              color={logoColor}
              bgColor={logoBgColor}
              size={48}
              imageUrl={logoUrl}
            />
            <div>
              <h1 className="font-bold text-xl text-white">{appName}</h1>
              <p className="text-xs text-primary-200">{appTagline}</p>
            </div>
          </div>

          {/* Hero content */}
          <div className="flex-1 flex flex-col">
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-4 animate-fade-in-up">
              {heroTitle}
            </h2>
            <p className="text-primary-100 text-lg leading-relaxed mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              {heroSubtitle}
            </p>

            {/* Benefit cards */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              {BENEFIT_CARDS.map((card, i) => (
                <BenefitCard key={card.title} card={card} index={i} />
              ))}
            </div>

            {/* Quote */}
            <QuoteSection quote={heroQuote} author={heroQuoteAuthor} />
          </div>
        </div>
      </div>

      {/* Mobile marketing banner */}
      <div className="lg:hidden bg-gradient-to-br from-primary-700 via-primary-800 to-neutral-900 text-white p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" aria-hidden="true">
          <svg viewBox="0 0 60 60" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <pattern id="grid-mobile" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-mobile)" />
          </svg>
        </div>
        <div className="relative flex flex-col items-center text-center">
          <Logo
            icon={logoIcon}
            color={logoColor}
            bgColor={logoBgColor}
            size={40}
            imageUrl={logoUrl}
          />
          <h1 className="font-bold text-xl mt-2">{appName}</h1>
          <p className="text-xs text-primary-200 mt-1">{appTagline}</p>
          <h2 className="text-xl font-bold mt-4">{heroTitle}</h2>
          <p className="text-primary-100 text-sm mt-2">{heroSubtitle}</p>
        </div>
      </div>

      {/* Form Side */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Back link */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400 mb-8 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20 rounded"
          >
            <ArrowLeft size={16} /> Retour au site
          </button>

          {/* Form header */}
          <div className="text-center mb-8 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">{currentMode.title}</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{currentMode.desc}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up" style={{ animationDelay: '100ms' }} noValidate>
            {/* Name field (signup only) */}
            {mode === 'signup' && (
              <InputField
                label="Nom complet"
                type="text"
                value={formState.name}
                onChange={(v) => updateField('name', v)}
                placeholder="Jean Kouassi"
                icon={User}
                error={formState.errors.name}
                autoComplete="name"
              />
            )}

            {/* Email field */}
            <InputField
              label="Adresse email"
              type="email"
              value={formState.email}
              onChange={(v) => updateField('email', v)}
              placeholder="vous@ferme.ci"
              icon={Mail}
              error={formState.errors.email}
              autoComplete={mode === 'login' ? 'email' : 'email'}
            />

            {/* Password field (not in forgot mode) */}
            {mode !== 'forgot' && (
              <InputField
                label="Mot de passe"
                type="password"
                value={formState.password}
                onChange={(v) => updateField('password', v)}
                placeholder="••••••••"
                icon={Lock}
                error={formState.errors.password}
                showPasswordToggle
                onTogglePassword={() => updateField('showPassword', !formState.showPassword)}
                showPassword={formState.showPassword}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            )}

            {/* Confirm password (signup only) */}
            {mode === 'signup' && (
              <InputField
                label="Confirmer le mot de passe"
                type="password"
                value={formState.confirmPassword}
                onChange={(v) => updateField('confirmPassword', v)}
                placeholder="••••••••"
                icon={Lock}
                error={formState.errors.confirmPassword}
                showPasswordToggle
                onTogglePassword={() => updateField('showPassword', !formState.showPassword)}
                showPassword={formState.showPassword}
                autoComplete="new-password"
              />
            )}

            {/* Terms checkbox (signup only) */}
            {mode === 'signup' && (
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formState.acceptedTerms}
                  onChange={(e) => updateField('acceptedTerms', e.target.checked)}
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500/20 mt-0.5 flex-shrink-0"
                  aria-describedby="terms-desc"
                />
                <label htmlFor="terms" className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed cursor-pointer" id="terms-desc">
                  J\'accepte les <span className="text-primary-600 dark:text-primary-400 hover:underline font-medium">conditions d\'utilisation</span> et la <span className="text-primary-600 dark:text-primary-400 hover:underline font-medium">politique de confidentialité</span>
                </label>
              </div>
            )}

            {/* Login options */}
            {mode === 'login' && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 cursor-pointer">
                  <input type="checkbox" className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500/20" />
                  Se souvenir de moi
                </label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-primary-600 dark:text-primary-400 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500/20 rounded"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            {/* Password requirements hint (signup only) */}
            {mode === 'signup' && (
              <div className="flex items-start gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>Le mot de passe doit contenir : 8+ caractères, majuscule, minuscule, chiffre.</span>
              </div>
            )}

            {/* Submit button */}
            <PrimaryButton loading={formState.loading}>
              {mode === 'login' ? 'Se connecter' : mode === 'signup' ? 'Créer mon compte' : 'Envoyer le lien'} <ArrowRight size={18} />
            </PrimaryButton>
          </form>

          {/* Mode switcher */}
          <div className="mt-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            {mode === 'login' && (
              <ModeLink text="Pas encore de compte ?" linkText="S'inscrire" onClick={() => switchMode('signup')} />
            )}
            {mode === 'signup' && (
              <ModeLink text="Déjà inscrit ?" linkText="Se connecter" onClick={() => switchMode('login')} />
            )}
            {mode === 'forgot' && (
              <ModeLink text="Retour à la" linkText="connexion" onClick={() => switchMode('login')} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
