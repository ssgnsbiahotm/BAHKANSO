import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useData } from '@/lib/DataContext';
import { Logo } from '@/components/ui/Logo';
import { RotatingCard } from '@/components/ui/RotatingCard';
import type { Farm, SiteContent } from '@/lib/types';
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
    detail: 'Suivi individuel des animaux, gestion des lots, alimentation, santé, reproduction.',
    status: 'En cours',
    statusColor: 'primary',
    gradient: 'from-primary-500 to-primary-600',
    iconBg: 'bg-primary-500/20',
    iconColor: 'text-primary-400',
    ctaColor: 'primary',
  },
  {
    icon: Leaf,
    title: 'Cultures',
    description: 'Gestion des parcelles, semis et suivi des récoltes.',
    detail: 'Parcelles, campagnes, opérations culturales, récoltes, rendements.',
    status: 'En cours',
    statusColor: 'accent',
    gradient: 'from-accent-500 to-accent-600',
    iconBg: 'bg-accent-500/20',
    iconColor: 'text-accent-400',
    ctaColor: 'accent',
  },
  {
    icon: HardHat,
    title: 'Travaux',
    description: 'Aménagements, infrastructures et chantiers en cours.',
    detail: 'Projets d\'infrastructure, chantiers, budgétisation, avancement, planning.',
    status: 'Prévu',
    statusColor: 'secondary',
    gradient: 'from-secondary-500 to-secondary-600',
    iconBg: 'bg-secondary-500/20',
    iconColor: 'text-secondary-400',
    ctaColor: 'secondary',
  },
] as const;

const TRACKING_STEPS = [
  {
    num: '01',
    icon: '🌱',
    title: 'Planification',
    desc: 'Définition des objectifs, budgétisation et calendrier prévisionnel avec l\'équipe terrain.',
  },
  {
    num: '02',
    icon: '💰',
    title: 'Financement',
    desc: 'Envoi des fonds par le responsable à distance, traçabilité bancaire et notification instantanée.',
  },
  {
    num: '03',
    icon: '🚜',
    title: 'Exécution',
    desc: 'Réalisation des opérations sur le terrain, saisie en temps réel, photos et justificatifs.',
  },
  {
    num: '04',
    icon: '📊',
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

function StatusBadge({ label, color }: { label: string; color: 'primary' | 'accent' | 'secondary' }) {
  const variants = {
    primary: 'bg-primary-500/20 text-primary-400 border-primary-500/30',
    accent: 'bg-accent-500/20 text-accent-400 border-accent-500/30',
    secondary: 'bg-secondary-500/20 text-secondary-400 border-secondary-500/30',
  };
  return (
    <span className={`text-overline font-medium px-3 py-1 rounded-full border ${variants[color]}`}>
      {label}
    </span>
  );
}

function ActivityCardFront({ card }: { card: ActivityCard }) {
  const Icon = card.icon;
  return (
    <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-primary-500/40 overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${card.iconBg} ${card.iconColor} shadow-lg relative z-10`}>
        <Icon size={32} aria-hidden="true" />
      </div>
      <div className="flex flex-col justify-between flex-1 min-w-0 relative z-10">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-heading-sm font-bold text-white">{card.title}</h3>
          <StatusBadge label={card.status} color={card.statusColor} />
        </div>
        <p className="text-body-sm text-neutral-400 leading-relaxed flex-1">{card.description}</p>
      </div>
    </div>
  );
}

function ActivityCardBack({ card }: { card: ActivityCard }) {
  const ctaColors = {
    primary: 'text-primary-400 hover:text-primary-300 hover:border-primary-400',
    accent: 'text-accent-400 hover:text-accent-300 hover:border-accent-400',
    secondary: 'text-secondary-400 hover:text-secondary-300 hover:border-secondary-400',
  };
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
      <h3 className="text-heading-sm font-bold text-white">{card.title} — Détails</h3>
      <p className="text-body-sm text-neutral-400 leading-relaxed">{card.detail}</p>
      <a
        href="/login"
        className={`inline-flex items-center gap-2 text-base font-semibold ${ctaColors[card.ctaColor]} transition-colors pb-1 border-b-2 border-transparent mt-auto`}
      >
        Espace privé — se connecter <ArrowRight size={16} />
      </a>
    </div>
  );
}

function FeatureHighlight({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:border-primary-500/40 hover:shadow-xl">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-primary-500/20 text-primary-400 shadow-lg mb-4" aria-hidden="true">
        <Icon size={24} />
      </div>
      <h4 className="text-heading-sm font-bold text-white">{title}</h4>
      <p className="mt-2 text-body-sm text-neutral-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function NavLink({ href, label, className = '' }: { href: string; label: string; className?: string }) {
  return (
    <a
      href={href}
      className={`text-sm font-medium text-neutral-700 hover:text-primary-600 dark:text-neutral-300 dark:hover:text-primary-400 transition-colors ${className}`}
    >
      {label}
    </a>
  );
}

function MobileNavLink({ href, label, onClose }: { href: string; label: string; onClose: () => void }) {
  return (
    <a
      href={href}
      className="block px-4 py-3 text-base font-medium text-white hover:text-primary-400 transition-colors"
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
          ? 'bg-neutral-950/95 backdrop-blur-md shadow-xl border-b border-neutral-800'
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
              bgColor="#16a34a"
              size={40}
              imageUrl={farm?.logo_url ?? null}
            />
            <span className="font-bold text-xl text-neutral-900 dark:text-white hidden sm:block">
              BAHKANSO
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Navigation principale">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Horloge professionnelle agro-pastorale */}
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm border border-primary-100 dark:border-primary-900/30 rounded-xl shadow-sm transition-all hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800/50">
              <div className="relative flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-inner">
                  <Clock size={16} className="text-white" aria-hidden="true" />
                </div>
                <div className="text-left min-w-[160px]">
                  <time
                    dateTime={currentTime.toISOString()}
                    className="block font-mono text-sm font-semibold text-neutral-900 dark:text-white tabular-nums"
                    aria-label={`Heure actuelle : ${currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
                  >
                    {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </time>
                  <span className="block text-[10px] font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                    {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="w-px h-6 bg-gradient-to-b from-transparent via-primary-300 to-transparent dark:via-primary-700/50 mx-1 hidden lg:block" aria-hidden="true" />
                <div className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400">
                  <Calendar size={14} aria-hidden="true" />
                  <span className="text-xs font-medium hidden xs:block">Côte d'Ivoire (GMT)</span>
                </div>
              </div>
            </div>

            <button
              id="bk-mobile-menu-toggle"
              type="button"
              className="md:hidden p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors min-w-[44px] min-h-[44px]"
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
          <div className="py-4 space-y-1 bg-neutral-950 border-t border-neutral-800">
            {NAV_LINKS.map((link) => (
              <MobileNavLink key={link.href} href={link.href} label={link.label} onClose={() => setMobileMenuOpen(false)} />
            ))}
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 text-center mt-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              Espace de gestion
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function Hero({ siteContent }: { siteContent: Record<string, SiteContent> }) {
  const hero = useMemo(() => (siteContent?.hero?.value as Record<string, unknown> | undefined) || {}, [siteContent]);
  const heroImage = (hero.heroImage as string | undefined) || undefined;
  const heroAlt = (hero.heroAlt as string | undefined) || 'Bandeau d\'accueil BAHKANSO';
  const heroBadge = (hero.badge as string | undefined) || 'Projet agro-pastoral · Côte d\'Ivoire';
  const heroTitle = (hero.title as string | undefined) || 'Bahkanso, un projet agro-pastoral ancré dans le terrain';
  const heroSubtitle = (hero.subtitle as string | undefined) || 'BAHKANSO rassemble les informations de notre exploitation pour que l\'équipe de terrain et le responsable à distance travaillent avec les mêmes données.';
  const heroCtaPrimary = (hero.ctaPrimary as string | undefined) || 'Découvrir le projet';
  const heroCtaSecondary = (hero.ctaSecondary as string | undefined) || 'Espace de gestion';

  return (
    <section
      className="relative min-h-screen flex items-center bg-gradient-to-b from-white via-neutral-50 to-neutral-100 overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* Ambient background gradients */}
      <div className="absolute top-[-50%] right-[-20%] w-[60%] h-[150%] bg-[radial-gradient(ellipse_at_center,rgba(22,163,74,0.08)_0%,transparent_70%)] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-[-30%] left-[-10%] w-[40%] h-[100%] bg-[radial-gradient(ellipse_at_center,rgba(92,64,51,0.06)_0%,transparent_70%)] pointer-events-none" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-wider rounded-full border border-primary-100 shadow-sm mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <span>{heroBadge}</span>
            </div>
            <h1
              id="hero-title"
              className="text-display-md sm:text-display-lg lg:text-display-xl text-neutral-900 bg-gradient-to-r from-neutral-900 via-primary-600 to-primary-700 bg-clip-text text-transparent animate-fade-in-up"
              style={{ animationDelay: '200ms' }}
            >
              {heroTitle}
            </h1>
            <p className="mt-6 text-body-lg text-neutral-600 max-w-2xl mx-auto lg:mx-0 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              {heroSubtitle}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center sm:items-center justify-center lg:justify-start gap-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <a
                href="#projet"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-base px-6 py-3.5 rounded-xl min-h-[52px] transition-all hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                {heroCtaPrimary} <ArrowRight size={18} className="flex-shrink-0" />
              </a>
              <a
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-2 border-primary-600 text-primary-600 font-semibold text-base px-6 py-3.5 rounded-xl min-h-[52px] bg-transparent transition-all hover:bg-primary-50 hover:border-primary-500 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                {heroCtaSecondary}
              </a>
            </div>
          </div>

          <div className="relative animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            {heroImage ? (
              <picture>
                <source type="image/avif" srcSet={heroImage} />
                <source type="image/webp" srcSet={heroImage} />
                <img
                  src={heroImage}
                  alt={heroAlt}
                  loading="lazy"
                  decoding="async"
                  fetchPriority="high"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="w-full aspect-[4/3] object-cover rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] border border-neutral-200 transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)]"
                />
              </picture>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 h-64 sm:h-80 border-2 dashed neutral-400 rounded-2xl text-neutral-500 text-sm bg-gradient-to-br from-primary-50/50 to-neutral-100/50">
                <div className="w-16 h-16 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%221.5%22%3E%3Crect%20x%3D%223%22%20y%3D%223%22%20width%3D%2218%22%20height%3D%2218%22%20rx%3D%222%22%20ry%3D%222%22%2F%3E%3Ccircle%20cx%3D%228.5%22%20cy%3D%228.5%22%20r%3D%221.5%22%2F%3E%3Cpolyline%20points%3D%2221%2015%2016%2010%205%2021%22%2F%3E%3C%2Fsvg%3E')] bg-center bg-contain bg-no-repeat opacity-50" aria-hidden="true" />
                <p className="text-center px-4">Aucune image configurée pour le bandeau d\'accueil.</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile hero subtitle fallback */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/80 px-4 py-4 sm:py-6 text-center lg:hidden animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <p className="text-body-sm text-neutral-600 max-w-3xl mx-auto">{heroSubtitle}</p>
        </div>
      </div>
    </section>
  );
}

function ProjectSection() {
  return (
    <section
      id="projet"
      className="py-16 sm:py-24 lg:py-32 bg-neutral-50"
      aria-labelledby="projet-title"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16 animate-fade-in-up">
          <h2 id="projet-title" className="text-display-sm sm:text-display-md text-neutral-900 font-bold">
            Notre projet
          </h2>
          <p className="mt-4 text-body-lg text-neutral-600">
            Une exploitation agro-pastorale suivie entre le terrain et le responsable à distance.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8 lg:gap-12 items-start">
          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div>
              <h3 className="text-heading-md text-neutral-900 font-bold relative pb-3 inline-block">Objectif</h3>
              <div className="w-12 h-1 bg-gradient-to-r from-primary-600 to-accent-500 rounded mt-3" />
            </div>
            <p className="text-body-lg text-neutral-600 leading-relaxed">
              Centraliser le suivi des financements, des dépenses, des activités d\'élevage et de culture, ainsi que des chantiers, afin que chaque acteur dispose d\'une information commune et à jour.
            </p>

            <h3 className="text-heading-md text-neutral-900 font-bold relative pb-3 inline-block mt-2">Organisation</h3>
            <div className="w-12 h-1 bg-gradient-to-r from-primary-600 to-accent-500 rounded mt-3" />
            <p className="mt-4 text-body-lg text-neutral-600 leading-relaxed">
              L\'équipe de terrain gère les activités sur place. Le responsable à distance envoie les fonds et suit l\'avancement depuis l\'espace privé de l\'application.
            </p>

            <h3 className="text-heading-md text-neutral-900 font-bold relative pb-3 inline-block mt-2">Ce qui est engagé</h3>
            <div className="w-12 h-1 bg-gradient-to-r from-primary-600 to-accent-500 rounded mt-3" />
            <p className="mt-4 text-body-lg text-neutral-600 leading-relaxed">
              La gestion des activités (élevage, cultures, aménagements) est déjà opérationnelle dans l\'application privée. Les détails financiers restent réservés aux personnes autorisées.
            </p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="border-b border-neutral-100 p-6 flex items-start gap-4 transition-colors hover:bg-primary-50/30">
              <span className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl bg-primary-50/80 text-primary-700 shadow-sm" aria-hidden="true">🏡</span>
              <div>
                <h4 className="text-heading-sm text-neutral-900 font-semibold">Sur le terrain</h4>
                <p className="mt-1 text-body-sm text-neutral-600 leading-relaxed">Gestion des activités et des opérations au quotidien.</p>
              </div>
            </div>
            <div className="p-6 flex items-start gap-4 transition-colors hover:bg-accent-50/30">
              <span className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl bg-accent-50/80 text-accent-700 shadow-sm" aria-hidden="true">🌍</span>
              <div>
                <h4 className="text-heading-sm text-neutral-900 font-semibold">À distance</h4>
                <p className="mt-1 text-body-sm text-neutral-600 leading-relaxed">Financement et suivi de l\'avancement du projet.</p>
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
      className="py-16 sm:py-24 lg:py-32 bg-neutral-950 text-white relative overflow-hidden"
      aria-labelledby="activites-title"
    >
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[80%] bg-[radial-gradient(ellipse_at_center,rgba(22,163,74,0.12)_0%,transparent_70%)] pointer-events-none" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16 animate-fade-in-up">
          <h2 id="activites-title" className="text-display-sm sm:text-display-md font-bold">Nos activités</h2>
          <p className="mt-4 text-body-lg text-neutral-400">Ce qui fait vivre le projet, entre élevage, cultures et aménagements.</p>
        </div>

        <div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}
          role="list"
          aria-label="Activités du projet"
        >
          {ACTIVITY_CARDS.map((card) => (
            <div key={card.title} role="listitem">
              <RotatingCard
                flipLabel="En savoir plus"
                backLabel="Retour"
                front={<ActivityCardFront card={card} />}
                back={<ActivityCardBack card={card} />}
              />
            </div>
          ))}
        </div>

        {/* Feature highlights */}
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up" style={{ animationDelay: '200ms' }} role="list" aria-label="Points forts de l'application">
          {FEATURE_HIGHLIGHTS.map((feature, index) => (
            <div key={feature.title} role="listitem" style={{ animationDelay: `${300 + index * 100}ms` }}>
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
      className="py-16 sm:py-24 lg:py-32 bg-neutral-950 text-white relative overflow-hidden"
      aria-labelledby="suivi-title"
    >
      <div className="absolute top-0 right-0 w-[50%] h-[60%] bg-[radial-gradient(ellipse_at_center,rgba(92,64,51,0.1)_0%,transparent_70%)] pointer-events-none" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16 animate-fade-in-up">
          <h2 id="suivi-title" className="text-display-sm sm:text-display-md font-bold">Notre suivi</h2>
          <p className="mt-4 text-body-lg text-neutral-400">Transparence et traçabilité : chaque étape est documentée et partagée.</p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-gradient-to-b from-primary-600 via-accent-500 to-secondary-600 rounded-full" aria-hidden="true" />
          <div className="space-y-8">
            {TRACKING_STEPS.map((step, index) => (
              <div
                key={step.num}
                className="relative flex gap-6 sm:gap-8 animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="absolute left-1/2 top-4 -translate-x-1/2 w-11 h-11 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 text-white font-bold text-lg flex items-center justify-center shadow-lg ring-4 ring-neutral-950 z-10" aria-hidden="true">
                  {step.num}
                </div>
                <div className={`w-1/2 pr-6 sm:pr-8 flex flex-col ${index % 2 === 0 ? 'text-right' : ''} relative z-10`}>
                  <div className={`bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-primary-500/40 ${index % 2 === 0 ? 'mr-auto' : 'ml-auto'} max-w-md`}>
                    <span className="text-3xl leading-none block mb-3" aria-hidden="true">{step.icon}</span>
                    <h4 className="text-heading-sm font-bold text-white">{step.title}</h4>
                    <p className="mt-2 text-body-sm text-neutral-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
                <div className={`w-1/2 pl-6 sm:pl-8 flex ${index % 2 === 1 ? 'text-left' : ''}`} aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>

        <p className="mt-10 text-center text-caption text-neutral-500 max-w-2xl mx-auto px-4 bg-white/5 border border-white/10 rounded-xl py-4 px-6 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
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
      className="py-16 sm:py-24 lg:py-32 bg-neutral-950 text-white relative overflow-hidden"
      aria-labelledby="contact-title"
    >
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[50%] bg-[radial-gradient(ellipse_at_center,rgba(22,163,74,0.08)_0%,transparent_70%)] pointer-events-none" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16 animate-fade-in-up">
          <h2 id="contact-title" className="text-display-sm sm:text-display-md font-bold">Accès & Contact</h2>
          <p className="mt-4 text-body-lg text-neutral-400">Rejoignez l\'espace de suivi ou localisez l\'exploitation.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">
          <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 shadow-xl transition-all duration-300 hover:border-primary-500/40 hover:shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-primary-500/20 text-primary-400 shadow-lg" aria-hidden="true">🔐</span>
                <h3 className="text-heading-md font-bold text-white">Espace de gestion</h3>
              </div>
              <p className="text-body-md text-neutral-400 leading-relaxed mb-6">Retrouvez les financements, les dépenses et l\'avancement du projet.</p>
              <button
                onClick={goToLogin}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-base px-6 py-3.5 rounded-xl min-h-[52px] transition-all hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-neutral-950"
              >
                Accéder à l'espace de suivi <ArrowRight size={18} className="flex-shrink-0" />
              </button>
            </div>
          </div>

          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:border-primary-500/40 hover:shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-primary-500/20 text-primary-400 shadow-lg" aria-hidden="true">
                  <MapPin size={24} />
                </span>
                <h3 className="text-heading-md font-bold text-white">Localisation</h3>
              </div>
              <p className="text-body-md text-neutral-400 leading-relaxed">Côte d\'Ivoire — Région du Bélier, Département de Dimbokro. Exploitation située à 45 km au nord de Yamoussoukro.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:border-accent-500/40 hover:shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-accent-500/20 text-accent-400 shadow-lg" aria-hidden="true">
                  <Clock size={24} />
                </span>
                <h3 className="text-heading-md font-bold text-white">Horaires de suivi</h3>
              </div>
              <p className="text-body-md text-neutral-400 leading-relaxed">L\'équipe de terrain est joignable du lundi au samedi, de 7h à 18h (GMT). Le responsable à distance répond sous 24h ouvrées via l\'espace de gestion.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ farm }: { farm: Farm | null }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-950 text-white border-t border-neutral-800" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-1 animate-fade-in-up">
            <Link to="/" className="flex items-center gap-3 mb-4" aria-label="Accueil BAHKANSO">
              <Logo
                icon="Sprout"
                color="#FFFFFF"
                bgColor="#16a34a"
                size={32}
                imageUrl={farm?.logo_url ?? null}
              />
              <span className="font-bold text-xl bg-gradient-to-r from-white to-primary-400 bg-clip-text text-transparent">BAHKANSO</span>
            </Link>
            <p className="text-body-sm text-neutral-500 leading-relaxed max-w-xs">Projet agro-pastoral. Suivi partagé entre l\'équipe de terrain et le responsable à distance.</p>
          </div>

          <nav aria-label="Navigation principale" className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <h3 className="text-overline text-neutral-500 mb-4">Navigation</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.navigation.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-body-sm text-neutral-400 hover:text-primary-400 transition-colors flex items-center gap-2">{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Liens utiles" className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <h3 className="text-overline text-neutral-500 mb-4">Liens utiles</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.useful.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-body-sm text-neutral-400 hover:text-primary-400 transition-colors flex items-center gap-2">{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-4 mt-8 pt-8 border-t border-neutral-800 text-center animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <p className="text-caption text-neutral-500">© {currentYear} BAHKANSO — Projet agro-pastoral</p>
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
    <div className="min-h-screen flex flex-col bg-white" lang="fr">
      <Header
        scrolled={scrolled}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        currentTime={currentTime}
      />
      <main className="flex-1">
        <Hero siteContent={siteContent} />
        <ProjectSection />
        <ActivitiesSection />
        <TrackingSection />
        <ContactSection goToLogin={goToLogin} />
      </main>
      <Footer farm={farm} />
    </div>
  );
}

export default LandingPage;