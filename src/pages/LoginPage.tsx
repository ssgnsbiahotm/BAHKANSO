import { useState } from 'react';
import { Lock, Mail, ArrowRight, Eye, EyeOff, ArrowLeft, Check, User, AlertCircle } from 'lucide-react';
import { useToast } from '@/lib/Toast';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { Logo } from '@/components/ui/Logo';

interface LoginPageProps {
  onLogin: () => void;
  onBack: () => void;
}

type Mode = 'login' | 'signup' | 'forgot';

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const toast = useToast();
  const { signIn, signUp, resetPassword } = useAuth();
  const { siteContent, farm } = useData();
  const branding = (siteContent.branding?.value as Record<string, string>) || {};
  const loginContent = (siteContent.login?.value as Record<string, unknown>) || {};

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Adresse email requise';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (mode === 'signup') {
      if (!name.trim()) newErrors.name = 'Nom requis';
      if (!password) {
        newErrors.password = 'Mot de passe requis';
      } else if (password.length < 8) {
        newErrors.password = 'Le mot de passe doit faire au moins 8 caractères';
      } else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        newErrors.password = 'Le mot de passe doit contenir majuscules, minuscules et chiffres';
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    } else if (mode === 'login') {
      if (!password) newErrors.password = 'Mot de passe requis';
    }

    if (mode === 'forgot' && !validateEmail(email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) {
        toast.show('Email ou mot de passe incorrect', 'error');
      } else {
        toast.show('Connexion réussie');
        onLogin();
      }
    } else if (mode === 'signup') {
      const { error } = await signUp(email, password, name.trim());
      setLoading(false);
      if (error) {
        if (error.includes('already')) {
          toast.show('Un compte existe déjà avec cet email', 'error');
        } else {
          toast.show('Erreur: ' + error, 'error');
        }
      } else {
        toast.show('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      }
    } else if (mode === 'forgot') {
      const { error } = await resetPassword(email);
      setLoading(false);
      if (error) {
        toast.show('Erreur: ' + error, 'error');
      } else {
        toast.show('Un lien de réinitialisation a été envoyé à votre email');
        setMode('login');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      <div className="lg:w-1/2 bg-gradient-to-br from-green-700 via-green-800 to-slate-900 text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 30% 20%, white 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <Logo
              icon={branding.logoIcon || 'Sprout'}
              color={branding.logoColor || '#FFFFFF'}
              bgColor={branding.logoBgColor || '#16A34A'}
              size={48}
              imageUrl={farm?.logo_url}
            />
            <div>
              <h1 className="font-bold text-xl">{branding.appName || 'Bahkanso'}</h1>
              <p className="text-xs text-green-200">{branding.appTagline || ''}</p>
            </div>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-4">
            {String(loginContent.title || 'Pilotez votre exploitation en toute transparence')}
          </h2>
          <p className="text-green-100 text-lg leading-relaxed mb-8">
            {String(loginContent.subtitle || 'Gérez financements, dépenses, cultures et élevage avec une traçabilité complète.')}
          </p>
          <div className="space-y-3">
            {((loginContent.benefits as string[]) || []).map(t => (
              <div key={t} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="text-green-300" />
                </div>
                <span className="text-sm text-green-50">{t}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative mt-12 pt-6 border-t border-white/10">
          <p className="text-xs text-green-200">
            « {String(loginContent.quote || '')} »
          </p>
          <p className="text-xs text-green-300 mt-2">— {String(loginContent.quoteAuthor || '')}</p>
        </div>
      </div>

      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-8">
            <ArrowLeft size={16} /> Retour au site
          </button>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {mode === 'login' ? 'Connexion' : mode === 'signup' ? 'Créer un compte' : 'Mot de passe oublié'}
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            {mode === 'login' ? 'Accédez à votre espace de pilotage' : mode === 'signup' ? 'Rejoignez la plateforme Bahkanso' : 'Entrez votre email pour recevoir un lien de réinitialisation'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Nom complet</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Jean Kouassi"
                    className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 ${errors.name ? 'border-red-300' : 'border-slate-200 focus:border-green-500'}`}
                  />
                </div>
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Adresse email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="vous@ferme.ci"
                  className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 ${errors.email ? 'border-red-300' : 'border-slate-200 focus:border-green-500'}`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Mot de passe</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 ${errors.password ? 'border-red-300' : 'border-slate-200 focus:border-green-500'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 ${errors.confirmPassword ? 'border-red-300' : 'border-slate-200 focus:border-green-500'}`}
                  />
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-500">
                  <input type="checkbox" className="rounded border-slate-300 text-green-600 focus:ring-green-500/20" />
                  Se souvenir de moi
                </label>
                <button type="button" onClick={() => { setMode('forgot'); setErrors({}); }} className="text-green-600 hover:underline">
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            {mode === 'signup' && (
              <div className="flex items-start gap-2 text-xs text-slate-500">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-slate-400" />
                <span>Le mot de passe doit contenir au moins 8 caractères avec majuscules, minuscules et chiffres.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Se connecter' : mode === 'signup' ? 'Créer mon compte' : 'Envoyer le lien'} <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' && (
              <>Pas encore de compte ? <button onClick={() => { setMode('signup'); setErrors({}); }} className="text-green-600 font-medium hover:underline">S'inscrire</button></>
            )}
            {mode === 'signup' && (
              <>Déjà inscrit ? <button onClick={() => { setMode('login'); setErrors({}); }} className="text-green-600 font-medium hover:underline">Se connecter</button></>
            )}
            {mode === 'forgot' && (
              <>Retour à la <button onClick={() => { setMode('login'); setErrors({}); }} className="text-green-600 font-medium hover:underline">connexion</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
