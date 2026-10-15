import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { Logo, getIcon } from '@/components/ui/Logo';

interface LandingPageProps {
  onEnter: () => void;
  onLogin: () => void;
}

export function LandingPage({ onEnter, onLogin }: LandingPageProps) {
  const { siteContent, farm } = useData();
  const [menuOpen, setMenuOpen] = useState(false);

  const branding = (siteContent.branding?.value as Record<string, string>) || {};
  const hero = (siteContent.hero?.value as Record<string, unknown>) || {};
  const heroCard = (siteContent.heroCard?.value as Record<string, unknown>) || {};
  const stats = (siteContent.stats?.value as Record<string, string>[]) || [];
  const features = (siteContent.features?.value as Record<string, string>[]) || [];
  const featuresSection = (siteContent.featuresSection?.value as Record<string, string>) || {};
  const workflow = (siteContent.workflow?.value as Record<string, unknown>) || {};
  const rolesContent = (siteContent.roles?.value as Record<string, unknown>) || {};
  const cta = (siteContent.cta?.value as Record<string, string>) || {};
  const footer = (siteContent.footer?.value as Record<string, unknown>) || {};

  const titleStr = String(hero.title || '');
  const highlight = String(hero.highlight || '');
  const titleParts = highlight && titleStr.includes(highlight)
    ? titleStr.split(highlight)
    : [titleStr, ''];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo
              icon={branding.logoIcon || 'Sprout'}
              color={branding.logoColor || '#FFFFFF'}
              bgColor={branding.logoBgColor || '#16A34A'}
              size={40}
              imageUrl={farm?.logo_url}
            />
            <div>
              <h1 className="font-bold text-lg text-slate-900 leading-tight">{branding.appName || 'Bahkanso'}</h1>
              <p className="text-xs text-slate-500 hidden sm:block">{branding.appTagline || ''}</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-600 hover:text-green-700 transition-colors">Fonctionnalités</a>
            <a href="#roles" className="text-sm text-slate-600 hover:text-green-700 transition-colors">Pour qui ?</a>
            <a href="#workflow" className="text-sm text-slate-600 hover:text-green-700 transition-colors">Comment ça marche</a>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={onLogin} className="text-sm font-medium text-slate-700 hover:text-green-700 px-3 py-2">
              Connexion
            </button>
            <button onClick={onEnter} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors">
 Accéder <ArrowRight size={16} />
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-100">
              <span className="block w-5 h-0.5 bg-slate-700 mb-1"></span>
              <span className="block w-5 h-0.5 bg-slate-700 mb-1"></span>
              <span className="block w-5 h-0.5 bg-slate-700"></span>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 px-6 py-4 space-y-3">
            <a href="#features" onClick={() => setMenuOpen(false)} className="block text-sm text-slate-600">Fonctionnalités</a>
            <a href="#roles" onClick={() => setMenuOpen(false)} className="block text-sm text-slate-600">Pour qui ?</a>
            <a href="#workflow" onClick={() => setMenuOpen(false)} className="block text-sm text-slate-600">Comment ça marche</a>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-50/50 to-white">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, #166534 1px, transparent 1px), radial-gradient(circle at 80% 80%, #22C55E 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              {String(hero.badge || '') && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium mb-6">
                  <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                  {String(hero.badge)}
                </div>
              )}
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-6">
                {titleParts[0]}{highlight && <span className="text-green-600">{highlight}</span>}{titleParts[1]}
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                {String(hero.subtitle || '')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={onEnter} className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-colors shadow-lg shadow-green-600/20">
 {String(hero.ctaPrimary || 'Découvrir')} <ArrowRight size={18} />
                </button>
                <button onClick={onLogin} className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors">
 {String(hero.ctaSecondary || 'Se connecter')}
                </button>
              </div>
              <div className="flex items-center gap-6 mt-8 flex-wrap">
                {((hero.trustBadges as string[]) || []).map((t: string) => (
                  <div key={t} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Check size={14} className="text-green-600" /> {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-slate-400">{String(heroCard.label || '')}</p>
                    <p className="text-2xl font-bold text-slate-900">{String(heroCard.value || '')}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
 +{String(heroCard.trend || '')}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {((heroCard.items as Record<string, string>[]) || []).map(s => (
                    <div key={s.label} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500">{s.label}</p>
                      <p className="font-bold text-slate-900 text-sm">{s.value} FCFA</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {((heroCard.lines as Record<string, string>[]) || []).map((line, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{line.text}</span>
                      <span className="font-medium text-slate-900">{line.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl border border-slate-200 p-4 -rotate-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                    <Check size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-900">Justificatif vérifié</p>
                    <p className="text-xs text-slate-400">DOC-008 · Il y a 32 min</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl lg:text-4xl font-bold text-green-600">{s.value}</p>
                <p className="text-sm text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">{featuresSection.title || 'Fonctionnalités'}</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">{featuresSection.subtitle || ''}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const IconComp = getIcon(f.icon || 'Sprout');
              return (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-green-200 transition-all group">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <IconComp size={24} />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="py-16 lg:py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">{String(workflow.title || '')}</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">{String(workflow.subtitle || '')}</p>
          </div>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-2">
            {((workflow.steps as Record<string, string>[]) || []).map((step, i, arr) => {
              const IconComp = getIcon(step.icon || 'Check');
              return (
                <div key={step.label} className="flex items-center gap-4 lg:gap-2">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center text-green-400">
                      <IconComp size={28} />
                    </div>
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                  {i < arr.length - 1 && <ArrowRight size={20} className="text-slate-600 hidden lg:block" />}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">{String(rolesContent.title || '')}</h2>
            <p className="text-lg text-slate-500">{String(rolesContent.subtitle || '')}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {((rolesContent.list as string[]) || []).map(r => {
              const RolesIcon = getIcon('Users');
              return (
                <div key={r} className="flex items-center gap-2 p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700">
                  <RolesIcon size={16} className="text-green-600 flex-shrink-0" /> {r}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">{cta.title || ''}</h2>
          <p className="text-lg text-green-50 mb-8">{cta.subtitle || ''}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onEnter} className="flex items-center justify-center gap-2 px-8 py-3 bg-white text-green-700 rounded-xl hover:bg-green-50 font-medium transition-colors">
 {cta.primary || 'Accéder'} <ArrowRight size={18} />
            </button>
            <button onClick={onLogin} className="flex items-center justify-center gap-2 px-8 py-3 border-2 border-white/30 text-white rounded-xl hover:bg-white/10 font-medium transition-colors">
 {cta.secondary || 'Se connecter'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Logo
                  icon={branding.logoIcon || 'Sprout'}
                  color={branding.logoColor || '#FFFFFF'}
                  bgColor={branding.logoBgColor || '#16A34A'}
                  size={40}
                  imageUrl={farm?.logo_url}
                />
                <div>
                  <h3 className="font-bold text-lg text-white">{branding.appName || 'Bahkanso'}</h3>
                  <p className="text-xs">{branding.appTagline || ''}</p>
                </div>
              </div>
              <p className="text-sm max-w-md">{String(footer.description || '')}</p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-3">{String(footer.modulesTitle || 'Modules')}</h4>
              <ul className="space-y-2 text-sm">
                {((footer.modules as string[]) || []).map(m => <li key={m}>{m}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-3">{String(footer.securityTitle || 'Sécurité')}</h4>
              <ul className="space-y-2 text-sm">
                {((footer.security as Record<string, string>[]) || []).map(sec => {
                  const SecIcon = getIcon(sec.icon || 'Shield');
                  return (
                    <li key={sec.text} className="flex items-center gap-2">
                      <SecIcon size={14} className="text-green-500" /> {sec.text}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-6 text-xs text-center">
            {String(footer.copyright || '')}
          </div>
        </div>
      </footer>
    </div>
  );
}
