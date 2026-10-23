import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRef } from 'react';
import { useData } from '@/lib/DataContext';
import { Logo } from '@/components/ui/Logo';
import { IMAGES } from '@/lib/images';
import {
  ArrowRight,
  Beef,
  HardHat,
  Leaf,
  Image,
  MapPin,
  Clock,
} from 'lucide-react';

import './LandingPage.css';

/* ==========================================================================
   CONSTANTS
   ========================================================================== */

const NAV_LINKS = [
  { href: '#projet', label: 'Le projet' },
  { href: '#activites', label: 'Nos activités' },
  { href: '#suivi', label: 'Notre suivi' },
] as const;

const ACTIVITY_CARDS = [
  {
    icon: Leaf,
    title: 'Cultures',
    description: 'Gestion des parcelles, semis et suivi des récoltes.',
    href: '/app/agriculture/campaigns',
  },
  {
    icon: Beef,
    title: 'Élevage',
    description: 'Suivi du cheptel, alimentation et santé des animaux.',
    href: '/app/livestock/animals',
  },
  {
    icon: HardHat,
    title: 'Travaux',
    description: 'Aménagements, infrastructures et chantiers en cours.',
    href: '/app/projects',
  },
] as const;

const TRACKING_STEPS = [
  {
    num: '01',
    title: 'Planification',
    desc: 'Définition des objectifs, budgétisation et calendrier prévisionnel avec l\'équipe terrain.',
  },
  {
    num: '02',
    title: 'Financement',
    desc: 'Envoi des fonds par le responsable à distance, traçabilité bancaire et notification instantanée.',
  },
  {
    num: '03',
    title: 'Exécution',
    desc: 'Réalisation des opérations sur le terrain, saisie en temps réel, photos et justificatifs.',
  },
  {
    num: '04',
    title: 'Reporting',
    desc: 'Tableaux de bord automatiques, alertes seuils, exports PDF pour le responsable à distance.',
  },
] as const;

/* ==========================================================================
   HELPER COMPONENTS
   ========================================================================== */

function ImageFallback() {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 rounded-full bg-signal/10 flex items-center justify-center mb-3">
        <Image size={32} className="text-signal" aria-hidden="true" />
      </div>
      <p className="font-sans text-body-sm text-ink-mut">Image à venir</p>
    </div>
  );
}



function NavLink({ href, label, className = '' }: { href: string; label: string; className?: string }) {
  return (
    <a
      href={href}
      className={`text-sm font-medium text-ink-mut hover:text-signal transition-colors focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2 ${className}`}
    >
      {label}
    </a>
  );
}

function MobileNavLink({ href, label, onClose }: { href: string; label: string; onClose: () => void }) {
  // Utilise un bouton pour la navigation programmatique (fermeture menu + scroll)
  // Respecte prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleClick = () => {
    onClose();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="block w-full text-left px-4 py-3 text-base font-medium text-ivory hover:text-signal-soft transition-colors focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2"
    >
      {label}
    </button>
  );
}

/* ==========================================================================
   HEADER
   ========================================================================== */

function Header({ scrolled, mobileMenuOpen, setMobileMenuOpen, currentTime }: {
  scrolled: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  currentTime: Date;
}) {
  const farm = useData().farm;

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 ${
        scrolled
          ? 'bg-ivory/95 backdrop-blur-md border-b border-ivory-deep'
          : 'bg-transparent'
      }`}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16 sm:h-18">
          <Link
            to="/"
            className="flex items-center gap-3"
            aria-label="Accueil BAHKANSO"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Logo
              icon="Sprout"
              color="#6B8E3A"
              bgColor="#6B8E3A"
              size={40}
              imageUrl={farm?.logo_url ?? null}
            />
            <span className="font-editorial font-semibold text-xl text-ink hidden sm:block">
              BAHKANSO
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Navigation principale">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-signal/10 backdrop-blur-sm border border-ivory-deep rounded-lg shadow-sm">
              <div className="relative flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-signal text-night shadow-sm">
                  <Clock size={16} className="text-white" aria-hidden="true" />
                </div>
                <div className="text-left min-w-[160px]">
                  <time
                    dateTime={new Date(currentTime.getTime() - (currentTime.getTimezoneOffset() * 60000)).toISOString().slice(0, -1) + '+00:00'}
                    className="block font-mono text-sm font-semibold text-ink tabular-nums"
                    aria-label={`Heure actuelle : ${currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
                  >
                    {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </time>
                  <span className="block text-[10px] font-medium text-signal uppercase tracking-wider">
                    {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="w-px h-6 bg-signal/30 mx-1 hidden lg:block" aria-hidden="true" />
                <div className="flex items-center gap-1.5 text-signal">
                  <CalendarIcon size={14} aria-hidden="true" />
                  <span className="text-xs font-medium hidden xs:block">Côte d'Ivoire (GMT)</span>
                </div>
              </div>
            </div>

            <button
              id="bk-mobile-menu-toggle"
              type="button"
              className="md:hidden p-2 rounded-lg text-ink hover:bg-ivory-deep border border-ivory-deep transition-colors min-w-[44px] min-h-[44px]"
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="bk-mobile-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="block w-5 h-0.5 bg-current mb-1" />
              <span className="block w-5 h-0.5 bg-current mb-1" />
              <span className="block w-5 h-0.5 bg-current" />
            </button>
          </div>
        </div>

        <div
          id="bk-mobile-menu"
          className={`md:hidden transition-all duration-300 overflow-hidden ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
          role="navigation"
          aria-label="Menu mobile"
        >
          <div className="py-4 space-y-1 bg-night border-t border-ivory-deep">
            {NAV_LINKS.map((link) => (
              <MobileNavLink key={link.href} href={link.href} label={link.label} onClose={() => setMobileMenuOpen(false)} />
            ))}
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 text-left mt-2 bg-signal text-night font-semibold rounded-lg hover:bg-signal/90 transition-colors"
            >
              Espace de gestion
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function CalendarIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

/* ==========================================================================
   HERO
   ========================================================================== */

function Hero({ siteContent }: { siteContent: Record<string, { value: Record<string, unknown> | unknown[] }> }) {
  const hero = useMemo(() => (siteContent?.hero?.value as Record<string, unknown> | undefined) || {}, [siteContent]);
  const [imageError, setImageError] = useState(false);

  const heroImage = (hero.heroImage as string | undefined) || IMAGES.hero;
  const heroAlt = (hero.heroAlt as string | undefined) || 'Projet agro-pastoral BAHKANSO — vue du terrain';
  const heroBadge = (hero.badge as string | undefined) || 'PLATEFORME DE GOUVERNANCE AGRO-PASTORALE';
  const heroTitle = (hero.title as string | undefined) || 'Pilotez vos investissements agro-pastoraux en toute transparence';
  const heroSubtitle = (hero.subtitle as string | undefined) || 'BAHKANSO relie les investissements, les opérations de terrain et le suivi des résultats, pour que l\'équipe et le responsable à distance travaillent avec les mêmes données.';
  const heroCtaPrimary = (hero.ctaPrimary as string | undefined) || 'Découvrir le projet';
  const heroCtaSecondary = (hero.ctaSecondary as string | undefined) || 'Consulter notre suivi';

  return (
    <section className="relative bg-ivory overflow-hidden" aria-labelledby="hero-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24 relative z-10">
        <div className="grid grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Texte : col-span-5 (gauche) */}
          <div className="col-span-12 lg:col-span-5">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-night text-ivory text-xs font-sans font-semibold uppercase tracking-wider rounded-sm mb-6">
              <span>{heroBadge}</span>
            </div>
            <h1
              id="hero-title"
              className="font-editorial text-6xl md:text-7xl lg:text-8xl font-medium text-ink leading-tight mb-8 text-wrap-balance"
            >
              {heroTitle}
            </h1>
            <p className="font-sans text-body-lg text-ink-mut leading-relaxed mb-10">
              {heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#projet"
                className="inline-flex items-center justify-center gap-2 bg-signal text-night font-sans font-semibold text-base px-6 py-4 rounded-md min-h-[56px] transition-colors hover:bg-signal/90 focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2"
              >
                {heroCtaPrimary} <ArrowRight size={18} className="flex-shrink-0" aria-hidden="true" />
              </a>
              <a
                href="/login"
                className="inline-flex items-center justify-center gap-2 border-2 border-signal text-signal font-sans font-semibold text-base px-6 py-4 rounded-md min-h-[56px] transition-colors hover:bg-signal/10 focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2"
              >
                {heroCtaSecondary}
              </a>
            </div>
          </div>

          {/* Image : col-span-7 (droite) */}
          <div className="col-span-12 lg:col-span-7 relative">
            {!imageError && heroImage ? (
              <img
                src={heroImage}
                alt={heroAlt}
                width={1200}
                height={900}
                loading="eager"
                decoding="async"
                {...({ fetchpriority: high } as Record<string, string>)}
                className="w-full aspect-[4/3] object-cover rounded-xl border border-ivory-deep block"
                onError={() => setImageError(true)}
              />
            ) : (
              <ImageFallback />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   ACTIVITES
   ========================================================================== */

function ActivitiesSection() {
  return (
    <section id="activites" className="scroll-mt-24 py-12 sm:py-16 lg:py-24 bg-ivory" aria-labelledby="activites-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 lg:mb-16">
          <h2 id="activites-title" className="font-editorial text-4xl md:text-5xl font-medium text-ink text-wrap-balance">
            Nos activités
          </h2>
          <p className="mt-4 font-sans text-body-lg text-ink-mut leading-relaxed">
            Ce qui fait vivre le projet, entre élevage, cultures et aménagements.
          </p>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8"
          role="list"
          aria-label="Activités du projet"
        >
          {ACTIVITY_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} role="listitem" className="flex flex-col h-full">
                <a
                  href={card.href}
                  className="flex-1 flex flex-col bg-ivory border border-ivory-deep rounded-lg p-6 lg:p-8 transition-colors focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2"
                >
                  <div className="w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0 bg-signal/10 text-signal mb-6">
                    <Icon size={48} aria-hidden="true" />
                  </div>
                  <h3 className="font-editorial text-2xl font-medium text-ink mb-3">
                    {card.title}
                  </h3>
                  <p className="font-sans text-body-sm text-ink-mut leading-relaxed mb-6 flex-1">
                    {card.description}
                  </p>
                  <span className="font-sans text-sm font-semibold text-signal flex items-center gap-1.5">
                    Voir <span aria-hidden="true">→</span>
                  </span>
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   SUIVI (timeline)
   ========================================================================== */

function TrackingSection() {
  return (
    <section id="suivi" className="scroll-mt-24 py-12 sm:py-16 lg:py-24 bg-night text-ivory" aria-labelledby="suivi-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 lg:mb-16">
          <h2 id="suivi-title" className="font-editorial text-4xl md:text-5xl font-medium text-ivory text-wrap-balance">
            Notre suivi
          </h2>
          <p className="mt-4 font-sans text-body-lg text-ivory/80 leading-relaxed">
            Transparence et traçabilité : chaque étape est documentée et partagée.
          </p>
        </div>

        <div className="relative max-w-3xl mx-auto">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-signal/30" aria-hidden="true" />
          <div className="space-y-16 lg:space-y-20">
            {TRACKING_STEPS.map((step) => (
              <div key={step.num} className="relative flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-signal text-night font-mono font-medium text-lg flex items-center justify-center z-10">
                  {step.num}
                </div>
                <div className="flex-1 pr-8">
                  <h3 className="font-editorial text-xl font-medium text-ivory mb-2">
                    {step.title}
                  </h3>
                  <p className="font-sans text-body-sm text-ivory/70 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-16 font-sans text-caption text-ivory/60 max-w-2xl mx-auto px-4 bg-night/50 border border-signal/30 rounded-lg py-6 px-8">
          L’application privée BAHKANSO structure ce cycle : l’équipe terrain saisit, le responsable valide, les données restent synchronisées.
        </p>
      </div>
    </section>
  );
}

/* ==========================================================================
   PROJET
   ========================================================================== */

function ProjectSection() {
  const [imageError, setImageError] = useState(false);

  return (
    <section id="projet" className="scroll-mt-24 py-12 sm:py-16 lg:py-24 bg-ivory" aria-labelledby="projet-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div className="space-y-10">
            <h2 id="projet-title" className="font-editorial text-4xl md:text-5xl font-medium text-ink text-wrap-balance">
              Notre projet
            </h2>
            <p className="font-sans text-body-lg text-ink-mut leading-relaxed">
              Une exploitation agro-pastorale suivie entre le terrain et le responsable à distance.
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="font-editorial text-xl font-medium text-ink mb-3">Objectif</h3>
                <p className="font-sans text-body-sm text-ink-mut leading-relaxed">
                  Centraliser le suivi des financements, des dépenses, des activités d’élevage et de culture, ainsi que des chantiers, afin que chaque acteur dispose d’une information commune et à jour.
                </p>
              </div>

              <div>
                <h3 className="font-editorial text-xl font-medium text-ink mb-3">Organisation</h3>
                <p className="font-sans text-body-sm text-ink-mut leading-relaxed">
                  L’équipe de terrain gère les activités sur place. Le responsable à distance envoie les fonds et suit l’avancement depuis l’espace privé de l’application.
                </p>
              </div>

              <div>
                <h3 className="font-editorial text-xl font-medium text-ink mb-3">Engagement</h3>
                <p className="font-sans text-body-sm text-ink-mut leading-relaxed">
                  La gestion des activités (élevage, cultures, aménagements) est opérationnelle dans l’application privée. Les détails financiers restent réservés aux personnes autorisées.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            {!imageError ? (
              <img
                src={IMAGES.hero}
                alt="Projet agro-pastoral BAHKANSO — vue du terrain"
                width={1200}
                height={900}
                loading="lazy"
                className="w-full aspect-[4/3] object-cover rounded-xl border border-ivory-deep block"
                onError={() => setImageError(true)}
              />
            ) : null}
            {imageError && <ImageFallback />}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   CONTACT
   ========================================================================== */

function ContactSection({ goToLogin }: { goToLogin: () => void }) {
  return (
    <section id="contact" className="scroll-mt-24 py-12 sm:py-16 lg:py-24 bg-ivory" aria-labelledby="contact-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Gauche : carte Espace de gestion */}
          <div>
            <div className="bg-ivory border border-ivory-deep rounded-lg p-8 lg:p-12">
              <h3 className="font-editorial text-2xl font-medium text-ink mb-4 text-wrap-balance">Espace de gestion</h3>
              <p className="font-sans text-body-sm text-ink-mut leading-relaxed mb-8">
                Retrouvez les financements, les dépenses et l’avancement du projet.
              </p>
              <button
                onClick={goToLogin}
                className="inline-flex items-center justify-center gap-2 bg-signal text-night font-sans font-semibold text-base px-6 py-4 rounded-md min-h-[56px] transition-colors hover:bg-signal/90 focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2"
              >
                Accéder à l’espace de suivi <ArrowRight size={18} className="flex-shrink-0" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Droite : Localisation + Horaires */}
          <div className="space-y-8 lg:space-y-10">
            <div className="bg-ivory border border-ivory-deep rounded-lg p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-md flex items-center justify-center bg-signal/10 text-signal">
                  <MapPin size={24} />
                </div>
                <h3 className="font-editorial text-xl font-medium text-ink text-wrap-balance">Localisation</h3>
              </div>
              <p className="font-sans text-body-sm text-ink-mut leading-relaxed">
                Côte d’Ivoire — Région du Bélier, Département de Dimbokro. Exploitation située à 45 km au nord de Yamoussoukro.
              </p>
            </div>

            <div className="bg-ivory border border-ivory-deep rounded-lg p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-md flex items-center justify-center bg-signal/10 text-signal">
                  <Clock size={24} />
                </div>
                <h3 className="font-editorial text-xl font-medium text-ink text-wrap-balance">Horaires de suivi</h3>
              </div>
              <p className="font-sans text-body-sm text-ink-mut leading-relaxed">
                L’équipe de terrain est joignable du lundi au samedi, de 7h à 18h (GMT). Le responsable à distance répond sous 24h ouvrées via l’espace de gestion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   FOOTER
   ========================================================================== */

const FOOTER_LINKS = {
  navigation: [
    { href: '#projet', label: 'Le projet' },
    { href: '#activites', label: 'Nos activités' },
    { href: '#suivi', label: 'Notre suivi' },
    { href: '/login', label: 'Espace de gestion' },
  ],
  useful: [
    { href: '/login', label: 'Connexion' },
    { href: '#contact', label: 'Nous contacter' },
    { href: '/mentions-legales', label: 'Mentions légales' },
    { href: '/confidentialite', label: 'Confidentialité' },
  ],
} as const;

function Footer({ farm }: { farm: { name: string | null; logo_url: string | null } | null }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-night text-ivory border-t border-night/50" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4" aria-label="Accueil BAHKANSO">
              <Logo
                icon="Sprout"
                color="#FFFFFF"
                bgColor="#6B8E3A"
                size={32}
                imageUrl={farm?.logo_url ?? null}
              />
              <span className="font-editorial font-semibold text-xl text-ivory">BAHKANSO</span>
            </Link>
            <p className="font-sans text-body-sm text-ivory/60 leading-relaxed max-w-xs">Projet agro-pastoral. Suivi partagé entre l’équipe de terrain et le responsable à distance.</p>
          </div>

          <nav aria-label="Navigation principale">
            <h3 className="font-sans text-overline text-ivory/50 mb-4">Navigation</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.navigation.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="font-sans text-body-sm text-ivory/60 hover:text-signal transition-colors flex items-center gap-2">{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Liens utiles">
            <h3 className="font-sans text-overline text-ivory/50 mb-4">Liens utiles</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.useful.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="font-sans text-body-sm text-ivory/60 hover:text-signal transition-colors flex items-center gap-2">{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-4 mt-8 pt-8 border-t border-night/50 text-left lg:text-center">
            <p className="font-sans text-caption text-ivory/50">© {currentYear} BAHKANSO — Projet agro-pastoral</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

export function LandingPage() {
  const navigate = useNavigate();
  const { farm, siteContent } = useData();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        document.getElementById('bk-mobile-menu-toggle')?.focus();
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleResize);
    };
  }, [mobileMenuOpen]);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 60);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const goToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-ivory" lang="fr">
      <a
        href="#contenu-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-signal focus:text-night focus:rounded focus:font-semibold"
      >
        Aller au contenu principal
      </a>
      <Header
        scrolled={scrolled}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        currentTime={currentTime}
      />
      <main className="flex-1" id="contenu-principal">
        <Hero siteContent={siteContent} />
        <ActivitiesSection />
        <TrackingSection />
        <ProjectSection />
        <ContactSection goToLogin={goToLogin} />
      </main>
      <Footer farm={farm} />
    </div>
  );
}

export default LandingPage;
