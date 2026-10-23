import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '@/lib/DataContext';
import { Logo } from '@/components/ui/Logo';
import { IMAGES } from '@/lib/images';
import {
  ArrowRight,
  Beef,
  HardHat,
  Leaf,
  Clock,
  Calendar,
  MapPin,
  Shield,
  Users,
  Sparkles,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';

import './LandingPage.css';

/* ==========================================================================
   DESIGN TOKENS & CONSTANTS
   ========================================================================== */

const NAV_LINKS = [
  { href: '#projet', label: 'Le projet' },
  { href: '#activites', label: 'Nos activités' },
  { href: '#suivi', label: 'Notre suivi' },
] as const;

const ACTIVITY_CARDS = [
  {
    icon: Beef,
    title: 'Élevage',
    description: 'Suivi du cheptel, alimentation et santé des animaux.',
    href: '/app/livestock/animals',
  },
  {
    icon: Leaf,
    title: 'Cultures',
    description: 'Gestion des parcelles, semis et suivi des récoltes.',
    href: '/app/agriculture/campaigns',
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

const FEATURE_HIGHLIGHTS = [
  { icon: Shield, title: 'Sécurisé', desc: 'Données chiffrées, accès par rôles, audit complet.' },
  { icon: Users, title: 'Collaboratif', desc: 'Équipe terrain + responsable synchronisés en temps réel.' },
  { icon: Sparkles, title: 'Intuitif', desc: 'Interface pensée pour le terrain, fonctionne hors-ligne.' },
  { icon: BarChart3, title: 'Piloté', desc: 'KPIs, alertes, exports — la décision éclairée.' },
] as const;

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

type ActivityCard = typeof ACTIVITY_CARDS[number];

/* ==========================================================================
   HELPER COMPONENTS
   ========================================================================== */

function ActivityCard({ card }: { card: ActivityCard }) {
  const Icon = card.icon;
  return (
    <a
      href={card.href}
      className="block bg-white border border-ivory-deep rounded-xl p-6 transition-all duration-300 hover:border-signal hover:shadow-md focus-visible:outline-signal focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <div className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 bg-signal-soft text-signal mb-4">
        <Icon size={28} aria-hidden="true" />
      </div>
      <h3 className="text-heading-md font-bold text-ink mb-2">{card.title}</h3>
      <p className="text-body-sm text-ink-mut leading-relaxed mb-4">{card.description}</p>
      <div className="flex items-center gap-2 text-sm font-semibold text-signal">
        Voir {card.title.toLowerCase()} <ArrowRight size={14} className="flex-shrink-0" />
      </div>
    </a>
  );
}

function FeatureHighlight({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="bg-white border border-ivory-deep rounded-xl p-6 transition-all duration-300 hover:border-signal">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-signal-soft text-signal shadow-sm mb-4" aria-hidden="true">
        <Icon size={24} />
      </div>
      <h4 className="text-heading-sm font-bold text-ink">{title}</h4>
      <p className="mt-2 text-body-sm text-ink-mut leading-relaxed">{desc}</p>
    </div>
  );
}

function NavLink({ href, label, className = '' }: { href: string; label: string; className?: string }) {
  return (
    <a
      href={href}
      className={`text-sm font-medium text-ink-mut hover:text-signal transition-colors ${className}`}
    >
      {label}
    </a>
  );
}

function MobileNavLink({ href, label, onClose }: { href: string; label: string; onClose: () => void }) {
  return (
    <a
      href={href}
      className="block px-4 py-3 text-base font-medium text-ivory hover:text-signal-soft transition-colors"
      onClick={onClose}
    >
      {label}
    </a>
  );
}

/* ==========================================================================
   SECTION COMPONENTS
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
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-ivory/95 backdrop-blur-md shadow-sm border-b border-ivory-deep'
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
              color="#FFFFFF"
              bgColor="#6B8E3A"
              size={40}
              imageUrl={farm?.logo_url ?? null}
            />
            <span className="font-bold text-xl text-ink dark:text-white hidden sm:block">
              BAHKANSO
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Navigation principale">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white/90 backdrop-blur-sm border border-ivory-deep rounded-xl shadow-sm">
              <div className="relative flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-signal text-night shadow-sm">
                  <Clock size={16} className="text-white" aria-hidden="true" />
                </div>
                <div className="text-left min-w-[160px]">
                  <time
                    dateTime={currentTime.toISOString()}
                    className="block font-mono text-sm font-semibold text-ink tabular-nums"
                    aria-label={`Heure actuelle : ${currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
                  >
                    {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </time>
                  <span className="block text-[10px] font-medium text-signal uppercase tracking-wider">
                    {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="w-px h-6 bg-gradient-to-b from-transparent via-signal-soft to-transparent mx-1 hidden lg:block" aria-hidden="true" />
                <div className="flex items-center gap-1.5 text-signal">
                  <Calendar size={14} aria-hidden="true" />
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
              className="block px-4 py-3 text-center mt-2 bg-signal text-night font-semibold rounded-lg hover:bg-signal hover:opacity-90 transition-colors"
            >
              Espace de gestion
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function Hero({ siteContent }: { siteContent: Record<string, unknown> }) {
  const hero = useMemo(() => (siteContent?.hero?.value as Record<string, unknown> | undefined) || {}, [siteContent]);
  const heroImage = (hero.heroImage as string | undefined) || IMAGES.hero;
  const heroAlt = (hero.heroAlt as string | undefined) || 'Projet agro-pastoral BAHKANSO — vue du terrain';
  const heroBadge = (hero.badge as string | undefined) || 'PLATEFORME DE GOUVERNANCE AGRO-PASTORALE';
  const heroTitle = (hero.title as string | undefined) || 'Pilotez vos investissements agro-pastoraux en toute transparence';
  const heroSubtitle = (hero.subtitle as string | undefined) || 'BAHKANSO relie les investissements, les opérations de terrain et le suivi des résultats, pour que l\'équipe et le responsable à distance travaillent avec les mêmes données.';
  const heroCtaPrimary = (hero.ctaPrimary as string | undefined) || 'Découvrir le projet';
  const heroCtaSecondary = (hero.ctaSecondary as string | undefined) || 'Consulter notre suivi';

  return (
    <section
      className="relative bg-ivory overflow-hidden"
      aria-labelledby="hero-title"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-night text-ivory text-xs font-bold uppercase tracking-wider rounded-full mb-6">
              <span>{heroBadge}</span>
            </div>
            <h1
              id="hero-title"
              className="text-display-sm sm:text-display-md lg:text-display-lg font-bold text-night leading-tight mb-6"
            >
              {heroTitle}
            </h1>
            <p className="text-body-lg text-ink-mut max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-8">
              {heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center lg:justify-start gap-4">
              <a
                href="#projet"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-signal text-night font-semibold text-base px-6 py-4 rounded-xl min-h-[56px] transition-all hover:bg-signal hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-signal focus:ring-offset-2 focus:ring-offset-ivory"
              >
                {heroCtaPrimary} <ArrowRight size={18} className="flex-shrink-0" />
              </a>
              <a
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-2 border-signal text-signal font-semibold text-base px-6 py-4 rounded-xl min-h-[56px] bg-transparent transition-all hover:bg-signal/10 hover:border-signal focus:outline-none focus:ring-2 focus:ring-signal focus:ring-offset-2 focus:ring-offset-ivory"
              >
                {heroCtaSecondary}
              </a>
            </div>
          </div>

          <div className="relative">
            {heroImage ? (
              <picture>
                <source type="image/avif" srcSet={`${heroImage}?avif`} />
                <source type="image/webp" srcSet={`${heroImage}?webp`} />
                <img
                  src={heroImage}
                  alt={heroAlt}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="w-full aspect-[4/3] object-cover rounded-xl border border-ivory-deep shadow-lg transition-all duration-500 hover:scale-[1.01]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </picture>
            ) : (
              <div className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-ivory-deep bg-night/5 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-night/10 rounded-full flex items-center justify-center mb-3">
                  <ImageIcon size={32} className="text-night/30" aria-hidden="true" />
                </div>
                <p className="text-body-sm text-ink-mut max-w-xs">Image du projet attendue : <code className="font-mono text-xs bg-night/10 px-2 py-1 rounded">public/images/hero-projet.jpg</code></p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ImageIcon({ size, className }: { size: number; className?: string }) {
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
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function ProjectSection() {
  return (
    <section
      id="projet"
      className="py-12 sm:py-16 lg:py-20 bg-white"
      aria-labelledby="projet-title"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 lg:mb-14">
          <h2 id="projet-title" className="text-display-sm sm:text-display-md font-bold text-night">
            Notre projet
          </h2>
          <p className="mt-4 text-body-lg text-ink-mut">
            Une exploitation agro-pastorale suivie entre le terrain et le responsable à distance.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8 lg:gap-12 items-start">
          <div className="space-y-6">
            <div>
              <h3 className="text-heading-md font-bold text-night relative pb-3 inline-block">Objectif</h3>
              <div className="w-12 h-1 bg-signal rounded mt-3" />
              <p className="text-body-lg text-ink-mut leading-relaxed">
                Centraliser le suivi des financements, des dépenses, des activités d\'élevage et de culture, ainsi que des chantiers, afin que chaque acteur dispose d\'une information commune et à jour.
              </p>
            </div>

            <div className="mt-2">
              <h3 className="text-heading-md font-bold text-night relative pb-3 inline-block">Organisation</h3>
              <div className="w-12 h-1 bg-signal rounded mt-3" />
              <p className="mt-4 text-body-lg text-ink-mut leading-relaxed">
                L\'équipe de terrain gère les activités sur place. Le responsable à distance envoie les fonds et suit l\'avancement depuis l\'espace privé de l\'application.
              </p>
            </div>

            <div className="mt-2">
              <h3 className="text-heading-md font-bold text-night relative pb-3 inline-block">Ce qui est engagé</h3>
              <div className="w-12 h-1 bg-signal rounded mt-3" />
              <p className="mt-4 text-body-lg text-ink-mut leading-relaxed">
                La gestion des activités (élevage, cultures, aménagements) est déjà opérationnelle dans l\'application privée. Les détails financiers restent réservés aux personnes autorisées.
              </p>
            </div>
          </div>

          <div className="bg-night border border-night/50 rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-night/30 p-6 flex items-start gap-4 transition-colors hover:bg-night/80">
              <span className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl bg-signal/20 text-signal shadow-sm" aria-hidden="true">🏡</span>
              <div>
                <h4 className="text-heading-sm font-bold text-ivory">Sur le terrain</h4>
                <p className="mt-1 text-body-sm text-ivory/80 leading-relaxed">Gestion des activités et des opérations au quotidien.</p>
              </div>
            </div>
            <div className="p-6 flex items-start gap-4 transition-colors hover:bg-night/80">
              <span className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl bg-signal/20 text-signal shadow-sm" aria-hidden="true">🌍</span>
              <div>
                <h4 className="text-heading-sm font-bold text-ivory">À distance</h4>
                <p className="mt-1 text-body-sm text-ivory/80 leading-relaxed">Financement et suivi de l\'avancement du projet.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ActivitiesSection() {
  return (
    <section
      id="activites"
      className="py-12 sm:py-16 lg:py-20 bg-ivory"
      aria-labelledby="activites-title"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 lg:mb-14">
          <h2 id="activites-title" className="text-display-sm sm:text-display-md font-bold text-night">
            Nos activités
          </h2>
          <p className="mt-4 text-body-lg text-ink-mut">
            Ce qui fait vivre le projet, entre élevage, cultures et aménagements.
          </p>
        </div>

        <div
          className="grid sm:grid-cols-3 gap-6"
          role="list"
          aria-label="Activités du projet"
        >
          {ACTIVITY_CARDS.map((card) => (
            <div key={card.title} role="listitem">
              <ActivityCard card={card} />
            </div>
          ))}
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURE_HIGHLIGHTS.map((feature) => (
            <div key={feature.title}>
              <FeatureHighlight {...feature} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrackingSection() {
  return (
    <section
      id="suivi"
      className="py-12 sm:py-16 lg:py-20 bg-night text-ivory"
      aria-labelledby="suivi-title"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 lg:mb-14">
          <h2 id="suivi-title" className="text-display-sm sm:text-display-md font-bold text-ivory">
            Notre suivi
          </h2>
          <p className="mt-4 text-body-lg text-ivory/80">
            Transparence et traçabilité : chaque étape est documentée et partagée.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-signal/30 rounded-full" aria-hidden="true" />
          <div className="space-y-8">
            {TRACKING_STEPS.map((step, index) => (
              <div
                key={step.num}
                className="relative flex gap-6 sm:gap-8"
              >
                <div className="absolute left-1/2 top-2 -translate-x-1/2 w-10 h-10 rounded-full bg-signal text-night font-bold text-lg flex items-center justify-center shadow-lg z-10" aria-hidden="true">
                  {step.num}
                </div>
                <div className={`w-1/2 pr-6 sm:pr-8 flex flex-col ${index % 2 === 0 ? 'text-right' : ''} relative z-10`}>
                  <div className={`bg-night/50 border border-night/40 rounded-xl p-6 transition-all duration-300 hover:border-signal ${index % 2 === 0 ? 'mr-auto' : 'ml-auto'} max-w-md`}>
                    <h4 className="text-heading-sm font-bold text-ivory">{step.title}</h4>
                    <p className="mt-2 text-body-sm text-ivory/80 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
                <div className={`w-1/2 pl-6 sm:pl-8 flex ${index % 2 === 1 ? 'text-left' : ''}`} aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>

        <p className="mt-10 text-center text-caption text-ivory/60 max-w-2xl mx-auto px-4 bg-night/50 border border-night/40 rounded-xl py-4 px-6">
          L\'application privée BAHKANSO structure ce cycle : l\'équipe terrain saisit, le responsable valide, les données restent synchronisées.
        </p>
      </div>
    </section>
  );
}

function ContactSection({ goToLogin }: { goToLogin: () => void }) {
  return (
    <section
      id="contact"
      className="py-12 sm:py-16 lg:py-20 bg-white"
      aria-labelledby="contact-title"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 lg:mb-14">
          <h2 id="contact-title" className="text-display-sm sm:text-display-md font-bold text-night">
            Accès & Contact
          </h2>
          <p className="mt-4 text-body-lg text-ink-mut">
            Rejoignez l\'espace de suivi ou localisez l\'exploitation.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">
          <div>
            <div className="bg-ivory border border-ivory-deep rounded-xl p-8 shadow-sm transition-all duration-300 hover:border-signal">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-signal/20 text-signal shadow-sm" aria-hidden="true">🔐</span>
                <h3 className="text-heading-md font-bold text-night">Espace de gestion</h3>
              </div>
              <p className="text-body-md text-ink-mut leading-relaxed mb-6">Retrouvez les financements, les dépenses et l\'avancement du projet.</p>
              <button
                onClick={goToLogin}
                className="w-full inline-flex items-center justify-center gap-2 bg-signal text-night font-semibold text-base px-6 py-4 rounded-xl min-h-[56px] transition-all hover:bg-signal hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-signal focus:ring-offset-2 focus:ring-offset-white"
              >
                Accéder à l\'espace de suivi <ArrowRight size={18} className="flex-shrink-0" />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-ivory border border-ivory-deep rounded-xl p-6 shadow-sm transition-all duration-300 hover:border-signal">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-signal/20 text-signal shadow-sm" aria-hidden="true">
                  <MapPin size={24} />
                </span>
                <h3 className="text-heading-md font-bold text-night">Localisation</h3>
              </div>
              <p className="text-body-md text-ink-mut leading-relaxed">Côte d\'Ivoire — Région du Bélier, Département de Dimbokro. Exploitation située à 45 km au nord de Yamoussoukro.</p>
            </div>
            <div className="bg-ivory border border-ivory-deep rounded-xl p-6 shadow-sm transition-all duration-300 hover:border-signal">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-signal/20 text-signal shadow-sm" aria-hidden="true">
                  <Clock size={24} />
                </span>
                <h3 className="text-heading-md font-bold text-night">Horaires de suivi</h3>
              </div>
              <p className="text-body-md text-ink-mut leading-relaxed">L\'équipe de terrain est joignable du lundi au samedi, de 7h à 18h (GMT). Le responsable à distance répond sous 24h ouvrées via l\'espace de gestion.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

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
              <span className="font-bold text-xl text-ivory">BAHKANSO</span>
            </Link>
            <p className="text-body-sm text-ivory/60 leading-relaxed max-w-xs">Projet agro-pastoral. Suivi partagé entre l\'équipe de terrain et le responsable à distance.</p>
          </div>

          <nav aria-label="Navigation principale">
            <h3 className="text-overline text-ivory/50 mb-4">Navigation</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.navigation.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-body-sm text-ivory/60 hover:text-signal transition-colors flex items-center gap-2">{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Liens utiles">
            <h3 className="text-overline text-ivory/50 mb-4">Liens utiles</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.useful.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-body-sm text-ivory/60 hover:text-signal transition-colors flex items-center gap-2">{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-4 mt-8 pt-8 border-t border-night/50 text-center">
            <p className="text-caption text-ivory/50">© {currentYear} BAHKANSO — Projet agro-pastoral</p>
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
      <Header
        scrolled={scrolled}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        currentTime={currentTime}
      />
      <main className="flex-1">
        <Hero siteContent={siteContent as Record<string, unknown>} />
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
