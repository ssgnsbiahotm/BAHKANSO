import { useEffect, useState, useMemo } from 'react';
import { useData } from '@/lib/DataContext';
import '@/styles/components.css';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

/* ============================================================================
   HERO BACKGROUND — Image with institutional fallback
   ============================================================================ */

interface HeroBackgroundProps {
  imageUrl: string | undefined;
  alt: string;
  children: React.ReactNode;
}

function HeroBackground({ imageUrl, alt, children }: HeroBackgroundProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);

  if (!imageUrl || imgError) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-content"
        style={{
          background: 'linear-gradient(135deg, var(--color-night) 0%, var(--color-forest) 100%), url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 5L34 15H44L36 21L40 31L30 26L20 31L24 21L16 15H26Z\' fill=\'none\' stroke=\'%23B9D86B\' stroke-width=\'0.5\' opacity=\'0.08\'/%3E%3C/svg%3E"), linear-gradient(90deg, var(--color-signal) 0%, transparent 15%)',
          backgroundSize: 'cover, 120px 120px, 100% 100%',
        }}
        role="img"
        aria-label={alt || 'Bandeau BAHKANSO'}
      >
        <div className="relative z-10 px-6" style={{ maxWidth: 'var(--container-max)', margin: '0 auto', width: '100%' }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <>
      <img
        src={imageUrl}
        alt={alt}
        onLoad={() => setImgLoading(false)}
        onError={() => setImgError(true)}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          display: imgError ? 'none' : 'block',
          opacity: imgLoading ? 0 : 1,
          transition: 'opacity var(--duration-500) var(--ease-out)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background: 'linear-gradient(180deg, rgba(17,26,24,0) 0%, rgba(17,26,24,0.35) 55%, rgba(17,26,24,0.65) 100%)',
        }}
      />
      {imgLoading && (
        <div className="absolute inset-0 bg-night animate-pulse" aria-hidden="true" style={{ opacity: 0.3 }} />
      )}
      <div className="relative z-10" style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </>
  );
}

/* ============================================================================
   TRUST BADGES — Inline chips
   ============================================================================ */

interface TrustBadgesProps {
  badges: Array<{ value: string }> | undefined;
}

function TrustBadges({ badges }: TrustBadgesProps) {
  if (!badges?.length) return null;

  return (
    <div className="flex flex-wrap gap-3 mt-8" role="list" aria-label="Badges de confiance">
      {badges.map((badge, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
          style={{
            backgroundColor: 'var(--bg-surface-raised)',
            border: '1px solid var(--border-default)',
            color: 'var(--color-ink)',
          }}
          role="listitem"
        >
          <span aria-hidden="true" style={{ color: 'var(--color-signal)' }}>✓</span>
          {badge.value}
        </span>
      ))}
    </div>
  );
}

/* ============================================================================
   ACTIVITY CARD — Refined with more editorial personality
   ============================================================================ */

interface ActivityCardProps {
  id: string;
  title: string;
  desc: string;
  link: string;
  href: string;
  icon: string;
  color: string;
}

function ActivityCard({ id, title, desc, link, href, icon, color }: ActivityCardProps) {
  return (
    <article
      className="group relative"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-2xl)',
        overflow: 'hidden',
        transition: 'transform var(--duration-300) var(--ease-out), box-shadow var(--duration-300) var(--ease-out), border-color var(--duration-300) var(--ease-out)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-2xl)';
        e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-signal) 50%, var(--border-default))';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
      role="listitem"
      tabIndex={0}
      onFocus={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-2xl)';
        e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-signal) 50%, var(--border-default))';
      }}
      onBlur={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
    >
      {/* Top accent bar — thinner, more refined */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: '3px',
          background: 'linear-gradient(90deg, ' + color + ' 0%, var(--color-signal) 100%)',
        }}
        aria-hidden="true"
      />
      <div className="p-7 flex flex-col" style={{ position: 'relative', zIndex: 1 }}>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-4xl" aria-hidden="true" style={{ lineHeight: 1 }}>{icon}</span>
          <span className="font-mono text-sm font-medium" style={{ color: 'var(--color-ink-dim)', letterSpacing: '0.05em' }}>{id}</span>
        </div>
        <h3 className="font-editorial font-semibold mb-4" style={{
          fontSize: 'clamp(1.1875rem, 2.2vw, 1.3125rem)',
          color: 'var(--color-ink)',
          lineHeight: '1.25',
          letterSpacing: '-0.01em',
        }}>
          {title}
        </h3>
        <p className="mb-7 flex-1" style={{
          color: 'var(--color-ink-mut)',
          lineHeight: '1.7',
          fontSize: '0.9375rem',
          fontWeight: '400',
        }}>
          {desc}
        </p>
        <a
          href={href}
          className="inline-flex items-center gap-2 font-medium transition-transform duration-200 mt-auto"
          style={{
            color: color,
            fontSize: 'var(--text-label-md)',
            fontWeight: '500',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(6px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; }}
          onFocus={(e) => { e.currentTarget.style.transform = 'translateX(6px)'; }}
          onBlur={(e) => { e.currentTarget.style.transform = 'translateX(0)'; }}
        >
          {link}
          <span aria-hidden="true" style={{ transition: 'transform var(--duration-200) var(--ease-out)', fontSize: '1.125em', lineHeight: 1 }}>→</span>
        </a>
      </div>
      {/* Subtle corner pattern — reduced opacity */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0"
        style={{
          width: '140px',
          height: '140px',
          transform: 'translate(25%, 25%)',
          opacity: '0.035',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 5L34 15H44L36 21L40 31L30 26L20 31L24 21L16 15H26Z\' fill=\'none\' stroke=\'%23' + color.slice(1) + '\' stroke-width=\'0.5\'/%3E%3C/svg%3E")',
          backgroundSize: '70px 70px',
          pointerEvents: 'none',
        }}
      />
    </article>
  );
}

/* ============================================================================
   KPI CARD — Refined: stronger hierarchy, editorial presence
   ============================================================================ */

interface KPICardProps {
  id: string;
  title: string;
  desc: string;
}

function KPICard({ id, title, desc }: KPICardProps) {
  return (
    <article
      className="module-kpi-card"
      role="listitem"
      style={{
        borderLeftColor: 'var(--color-signal)',
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform var(--duration-300) var(--ease-out), box-shadow var(--duration-300) var(--ease-out), border-color var(--duration-300) var(--ease-out)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
        e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-signal) 40%, var(--border-default))';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
      onFocus={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
        e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-signal) 40%, var(--border-default))';
      }}
      onBlur={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
    >
      <div className="module-kpi-header" style={{ paddingBottom: 'var(--space-3)' }}>
        <span className="font-mono text-sm font-medium" style={{ color: 'var(--color-signal)', letterSpacing: '0.08em' }}>{id}</span>
      </div>
      <div className="module-kpi-body flex-1">
        <h3 className="module-kpi-label font-editorial" style={{
          color: 'var(--color-ink)',
          fontSize: 'clamp(1.125rem, 2vw, 1.25rem)',
          lineHeight: '1.3',
          letterSpacing: '-0.01em',
          fontWeight: '600',
          margin: '0 0 var(--space-2)',
        }}>{title}</h3>
        <p style={{ color: 'var(--color-ink-mut)', fontSize: 'var(--text-body-sm)', lineHeight: '1.7', margin: 0, fontWeight: '400' }}>{desc}</p>
      </div>
    </article>
  );
}

/* ============================================================================
   MAIN LANDING PAGE
   ============================================================================ */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const { farm, siteContent, media } = useData();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- Configuration-driven content ---
  const heroContent = useMemo(() => siteContent['hero']?.value as Record<string, any> || {}, [siteContent]);
  const ctaContent = useMemo(() => siteContent['cta']?.value as Record<string, any> || {}, [siteContent]);
  const footerContent = useMemo(() => siteContent['footer']?.value as Record<string, any> || {}, [siteContent]);

  const heroImage = heroContent.heroImage as string | undefined;
  const heroAlt = heroContent.heroAlt as string | undefined;
  const heroTitle = heroContent.title as string | undefined;
  const heroHighlight = heroContent.highlight as string | undefined;
  const heroSubtitle = heroContent.subtitle as string | undefined;
  const heroBadge = heroContent.badge as string | undefined;
  const heroCtaPrimary = heroContent.ctaPrimary as string | undefined;
  const heroCtaSecondary = heroContent.ctaSecondary as string | undefined;
  const trustBadges = heroContent.trustBadges as Array<{ value: string }> | undefined;

  const ctaTitle = ctaContent.title as string | undefined;
  const ctaSubtitle = ctaContent.subtitle as string | undefined;
  const ctaPrimary = ctaContent.primary as string | undefined;
  const ctaSecondary = ctaContent.secondary as string | undefined;

  const footerDescription = footerContent.description as string | undefined;
  const footerModules = footerContent.modules as Array<{ value: string }> | undefined;
  const footerSecurityTitle = footerContent.securityTitle as string | undefined;
  const footerSecurity = footerContent.security as Array<{ icon: string; text: string }> | undefined;
  const footerCopyright = footerContent.copyright as string | undefined;
  const footerModulesTitle = footerContent.modulesTitle as string | undefined;

  // --- Activities data (no config fields yet — typographic + icons) ---
  const activities = useMemo(() => [
    {
      id: '01',
      title: 'Cultures',
      desc: 'Suivi des semis à la récolte, parcelle par parcelle, avec saisie terrain en temps réel.',
      link: 'Voir le suivi des cultures',
      href: '/app/agriculture',
      icon: '🌱',
      color: 'var(--color-grass)',
    },
    {
      id: '02',
      title: 'Élevage',
      desc: 'Alimentation, état de santé et événements de chaque animal, tracés dans le temps.',
      link: 'Voir le suivi d\'élevage',
      href: '/app/livestock',
      icon: '🐄',
      color: 'var(--color-terra)',
    },
    {
      id: '03',
      title: 'Travaux',
      desc: "Suivi des chantiers d'aménagements et d'infrastructures, de la planification à la réception.",
      link: 'Voir les chantiers',
      href: '/app/projects',
      icon: '🏗️',
      color: 'var(--color-sky)',
    },
  ], []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-page)', color: 'var(--color-ink)' }}>
      {/* ========================================================================
         HEADER — Prototype behavior: light surface → blur on scroll
         ======================================================================== */}
      <header
        className="fixed top-0 left-0 right-0 z-[var(--z-sticky)] transition-all duration-300"
        style={{
          backgroundColor: scrolled
            ? 'color-mix(in srgb, var(--bg-surface) 98%, transparent)'
            : 'var(--bg-surface)',
          borderBottom: scrolled ? '1px solid var(--border-subtle)' : 'none',
          boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
        }}
        role="banner"
      >
        <div className="container mx-auto px-6 py-3" style={{ maxWidth: 'var(--container-max)' }}>
          <div className="flex justify-between items-center gap-4">
            <a href="/" className="flex items-center gap-3" aria-label="BAHKANSO - Accueil">
              {farm?.logo_url ? (
                <OptimizedImage
                  src={farm.logo_url}
                  alt=""
                  className="h-10 w-auto transition-opacity duration-300"
                  aria-hidden="true"
                />
              ) : (
                <span className="font-editorial text-xl font-bold" style={{ color: 'var(--color-ink)' }}>
                  BAHKANSO
                </span>
              )}
            </a>

            <nav className="hidden md:flex items-center gap-6" aria-label="Navigation principale">
              {['Le projet', 'Nos activités', 'Notre suivi'].map((item) => {
                const slug = item.toLowerCase().replace(' ', '-');
                return (
                  <a
                    key={item}
                    href={'#' + slug}
                    className="text-sm font-medium transition-colors duration-200 relative"
                    style={{ color: 'var(--color-ink-mut)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-terra)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-ink-mut)'; }}
                    onFocus={(e) => { e.currentTarget.style.color = 'var(--color-terra)'; }}
                    onBlur={(e) => { e.currentTarget.style.color = 'var(--color-ink-mut)'; }}
                  >
                    {item}
                    <span
                      className="absolute bottom-[-4px] left-0 right-0 h-0.5 bg-current scale-x-0 origin-center transition-transform duration-200"
                      style={{
                        backgroundColor: 'var(--color-terra)',
                        transform: 'scaleX(0)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scaleX(1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scaleX(0)'; }}
                      onFocus={(e) => { e.currentTarget.style.transform = 'scaleX(1)'; }}
                      onBlur={(e) => { e.currentTarget.style.transform = 'scaleX(0)'; }}
                    />
                  </a>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <a
                href="/login"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-default)',
                  color: 'var(--color-ink)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-ink)';
                  e.currentTarget.style.color = 'var(--color-ivory)';
                  e.currentTarget.style.borderColor = 'var(--color-ink)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-ink)';
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-ink)';
                  e.currentTarget.style.color = 'var(--color-ivory)';
                  e.currentTarget.style.borderColor = 'var(--color-ink)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-ink)';
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                }}
              >
                Espace de gestion
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================
         HERO — Asymmetric editorial layout with clear text/image separation
         ======================================================================== */}
      <section
        aria-labelledby="hero-title"
        className="relative min-h-[80vh] flex items-center"
        style={{
          backgroundColor: 'var(--bg-page)',
          overflow: 'hidden',
        }}
      >
        {/* Full-width background atmosphere */}
        <div className="absolute inset-0" aria-hidden="true" style={{
          background: 'linear-gradient(135deg, var(--color-night) 0%, var(--color-forest) 100%), url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 5L34 15H44L36 21L40 31L30 26L20 31L24 21L16 15H26Z\' fill=\'none\' stroke=\'%23B9D86B\' stroke-width=\'0.5\' opacity=\'0.06\'/%3E%3C/svg%3E"), linear-gradient(90deg, var(--color-signal) 0%, transparent 8%)',
          backgroundSize: 'cover, 140px 140px, 100% 100%',
        }} />

        {/* Left accent bar */}
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0"
          style={{
            width: '4px',
            background: 'linear-gradient(180deg, var(--color-terra) 0%, var(--color-signal) 50%, var(--color-grass) 100%)',
            borderRadius: '0 4px 4px 0',
          }}
        />

        <div className="container mx-auto px-6 relative z-10" style={{ maxWidth: 'var(--container-max)' }}>
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            {/* Colonne éditoriale — 7/12 : zone de lecture pure, sans image dessous */}
            <div className="lg:col-span-7">
              <p
                id="hero-overline"
                className="font-mono text-sm tracking-widest uppercase mb-5"
                style={{ color: 'var(--color-signal)', letterSpacing: '0.12em' }}
              >
                {heroBadge || 'Projet agro-pastoral — Côte d\'Ivoire'}
              </p>

              <h1
                id="hero-title"
                className="font-editorial leading-[1.02] mb-6"
                style={{
                  fontSize: 'clamp(2.75rem, 5.5vw, 4.5rem)',
                  lineHeight: '1.02',
                  color: 'var(--color-ink)',
                  fontWeight: '800',
                  letterSpacing: '-0.025em',
                  maxWidth: '18ch',
                }}
              >
                {heroTitle || 'Pilotez l\'exploitation,'}
                <br />
                <span style={{ color: 'var(--color-signal)' }}>
                  {heroHighlight || 'suivez chaque résultat'}
                </span>
              </h1>

              <p className="mb-10 max-w-[50ch]" style={{
                fontSize: 'clamp(1.0625rem, 1.9vw, 1.1875rem)',
                lineHeight: '1.75',
                color: 'var(--color-ink-mut)',
                fontWeight: '400',
              }}>
                {heroSubtitle || 'BAHKANSO centralise le suivi des financements, des cultures, de l\'élevage et des chantiers. Une information commune, à jour, partagée entre l\'équipe terrain et le responsable à distance.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-start" role="group" aria-label="Actions principales">
                <a
                  href="#nos-activites"
                  className="module-btn module-btn-primary module-btn-lg px-9 py-3.5 text-center inline-flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--color-signal)',
                    borderColor: 'var(--color-signal)',
                    color: 'var(--color-night)',
                    fontWeight: '600',
                    fontSize: 'var(--text-label-lg)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  {heroCtaPrimary || 'Découvrir nos activités'}
                  <span aria-hidden="true" style={{ fontSize: '1.125em', lineHeight: 1 }}>→</span>
                </a>
                <a
                  href="/login"
                  className="module-btn module-btn-secondary module-btn-lg px-9 py-3.5 text-center inline-flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--color-ink)',
                    boxShadow: 'var(--shadow-sm)',
                    fontSize: 'var(--text-label-lg)',
                  }}
                >
                  {heroCtaSecondary || 'Espace de gestion'}
                </a>
              </div>

              <TrustBadges badges={trustBadges} />
            </div>

            {/* Colonne visuelle — 5/12 : carte photo immersive, indépendante du texte */}
            <div className="lg:col-span-5 hidden lg:block">
              <div
                className="relative"
                style={{
                  aspectRatio: '4/5',
                  borderRadius: 'var(--radius-2xl)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-2xl), 0 0 0 1px rgba(244,241,232,0.06)',
                  border: 'none',
                }}
              >
                {heroImage ? (
                  <>
                    <OptimizedImage
                      src={heroImage}
                      alt={heroAlt || "Vue de l'exploitation BAHKANSO — cultures et infrastructures"}
                      className="w-full h-full object-cover"
                      style={{
                        transform: 'scale(1.03)',
                        filter: 'brightness(0.85) saturate(1.15) contrast(1.05)',
                        transition: 'transform var(--duration-1000) var(--ease-out), filter var(--duration-700) var(--ease-out)',
                      }}
                    />
                    {/* Overlay infos terrain — plus subtil */}
                    <div className="absolute bottom-0 left-0 right-0 p-6" style={{
                      background: 'linear-gradient(180deg, rgba(17,26,24,0) 0%, rgba(17,26,24,0.55) 50%, rgba(17,26,24,0.92) 100%)',
                    }}>
                      <p className="font-mono text-xs tracking-wider uppercase mb-1.5" style={{ color: 'var(--color-signal)', letterSpacing: '0.1em' }}>
                        Exploitation active
                      </p>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-ivory)', fontWeight: '500' }}>
                        {farm?.location || 'Cocody, Palais de Justice — Abidjan'}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-end p-6" style={{
                    background: 'linear-gradient(180deg, rgba(17,26,24,0) 0%, rgba(17,26,24,0.92) 100%), url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 5L34 15H44L36 21L40 31L30 26L20 31L24 21L16 15H26Z\' fill=\'none\' stroke=\'%23B9D86B\' stroke-width=\'0.5\' opacity=\'0.12\'/%3E%3C/svg%3E")'
                  }}>
                    <div>
                      <p className="font-mono text-xs tracking-wider uppercase mb-1.5" style={{ color: 'var(--color-signal)', letterSpacing: '0.1em' }}>
                        Exploitation active
                      </p>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-ivory)', fontWeight: '500' }}>
                        {farm?.location || 'Cocody, Palais de Justice — Abidjan'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================
         NOS ACTIVITÉS — Refined cards with more personality
         ======================================================================== */}
      <section id="nos-activites" aria-labelledby="activites-title" className="py-16 md:py-24 lg:py-32" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="container mx-auto px-6" style={{ maxWidth: 'var(--container-max)' }}>
          <div className="max-w-3xl mb-14 md:mb-18">
            <p id="activites-overline" className="font-mono text-sm uppercase tracking-wider mb-4" style={{ color: 'var(--color-signal)', letterSpacing: '0.1em' }}>
              Nos activités
            </p>
            <h2 id="activites-title" className="font-editorial leading-tight mb-6" style={{
              fontSize: 'clamp(2.125rem, 4.2vw, 3.25rem)',
              color: 'var(--color-ink)',
              fontWeight: '700',
              letterSpacing: '-0.015em',
            }}>
              Ce qui fait vivre l'exploitation
            </h2>
            <p className="max-w-[48ch]" style={{
              fontSize: 'clamp(1.0625rem, 1.6vw, 1.1875rem)',
              lineHeight: '1.75',
              color: 'var(--color-ink-mut)',
              fontWeight: '400',
            }}>
              Trois métiers, une même exigence de traçabilité : les cultures, l'élevage et les aménagements
              sont pilotés depuis la même plateforme, par la même équipe, avec les mêmes données.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 lg:gap-9" role="list" aria-label="Activités principales">
            {activities.map((item) => (
              <ActivityCard key={item.id} {...item} />
            ))}
          </div>

          {/* CTA section activités */}
          <div className="mt-18 text-center">
            <a
              href="/login"
              className="inline-flex items-center gap-2 px-10 py-4.5 text-base font-semibold rounded-xl transition-all duration-200"
              style={{
                backgroundColor: 'var(--color-ink)',
                color: 'var(--color-ivory)',
                border: '1px solid var(--color-ink)',
                fontSize: 'var(--text-label-lg)',
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-signal)';
                e.currentTarget.style.borderColor = 'var(--color-signal)';
                e.currentTarget.style.color = 'var(--color-night)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-ink)';
                e.currentTarget.style.borderColor = 'var(--color-ink)';
                e.currentTarget.style.color = 'var(--color-ivory)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-signal)';
                e.currentTarget.style.borderColor = 'var(--color-signal)';
                e.currentTarget.style.color = 'var(--color-night)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-ink)';
                e.currentTarget.style.borderColor = 'var(--color-ink)';
                e.currentTarget.style.color = 'var(--color-ivory)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              Accéder à l'espace de gestion complet
              <span aria-hidden="true" style={{ fontSize: '1.125em', lineHeight: 1 }}>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================================
         POURQUOI BAHKANSO — Refined KPI grid: stronger cards, better spacing
         ======================================================================== */}
      <section id="pourquoi" aria-labelledby="pourquoi-title" className="py-18 md:py-26" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <div className="container mx-auto px-6" style={{ maxWidth: 'var(--container-max)' }}>
          <div className="max-w-3xl mb-14 md:mb-18">
            <p id="pourquoi-overline" className="font-mono text-sm uppercase tracking-wider mb-4" style={{ color: 'var(--color-signal)', letterSpacing: '0.1em' }}>
              Pourquoi Bahkanso
            </p>
            <h2 id="pourquoi-title" className="font-editorial leading-tight" style={{
              fontSize: 'clamp(2.125rem, 4.2vw, 3.25rem)',
              color: 'var(--color-ink)',
              fontWeight: '700',
              letterSpacing: '-0.015em',
            }}>
              Quatre piliers pour un pilotage serein
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8" role="list" aria-label="Piliers de la plateforme">
            {[
              { id: '01', title: 'Traçabilité complète', desc: 'Chaque dépense, saisie et décision est horodatée et attribuée.' },
              { id: '02', title: 'Équipe synchronisée', desc: 'Terrain et responsable à distance travaillent sur les mêmes données.' },
              { id: '03', title: 'Sécurité des données', desc: 'Authentification, permissions et audit intègres, hébergement maîtrisé.' },
              { id: '04', title: 'Pilotage par indicateurs', desc: 'Tableaux de bord automatiques, alertes seuls, exports pour le décideur.' },
            ].map((item) => (
              <KPICard key={item.id} {...item} />
            ))}
          </div>

          <TrustBadges badges={trustBadges} />
        </div>
      </section>

      {/* ========================================================================
         NOTRE SUIVI — Refined timeline: clearer hierarchy, better balance
         ======================================================================== */}
      <section id="notre-suivi" aria-labelledby="suivi-title" className="py-18 md:py-26" style={{ backgroundColor: 'var(--color-night)', color: 'var(--color-ivory)', borderTop: '1px solid rgba(244,241,232,0.1)' }}>
        <div className="container mx-auto px-6" style={{ maxWidth: 'var(--container-max)' }}>
          <div className="mb-14 md:mb-18 max-w-2xl">
            <p id="suivi-overline" className="font-mono text-sm uppercase tracking-wider mb-4" style={{ color: 'rgba(244,241,232,0.5)', letterSpacing: '0.1em' }}>
              Notre suivi
            </p>
            <h2 id="suivi-title" className="font-editorial leading-tight" style={{
              fontSize: 'clamp(2.125rem, 4.2vw, 3.25rem)',
              fontWeight: '700',
              letterSpacing: '-0.015em',
            }}>
              Transparence et traçabilité<br/>à chaque étape
            </h2>
          </div>
          <div className="max-w-2xl">
            <ol className="relative" style={{ paddingLeft: 'var(--space-12)', borderLeft: '2px solid rgba(185, 216, 107, 0.18)' }} aria-label="Étapes du cycle de suivi">
              {[
                { id: '01', title: 'Planification', desc: "Définition des objectifs, budgétisation et calendrier prévisionnel avec l'équipe terrain." },
                { id: '02', title: 'Financement', desc: 'Envoi des fonds par le responsable à distance, traçabilité bancaire et notification instantanée.' },
                { id: '03', title: 'Exécution', desc: 'Réalisation des opérations sur le terrain, saisie en temps réel, photos et justificatifs.' },
                { id: '04', title: 'Reporting', desc: 'Tableaux de bord automatiques, alertes seuls, exports PDF pour le responsable à distance.' },
              ].map((step, index) => (
                <li
                  key={step.id}
                  className="relative"
                  style={{
                    paddingLeft: 'var(--space-7)',
                    paddingBottom: index === 3 ? '0' : 'var(--space-14)',
                    position: 'relative',
                  }}
                >
                  {/* Timeline dot with connecting line */}
                  <div
                    className="absolute"
                    style={{
                      left: 'calc(var(--space-12) * -1)',
                      top: '0',
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-night)',
                      border: '3px solid var(--color-signal)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      zIndex: 2,
                      boxShadow: '0 0 0 4px var(--color-night)',
                    }}
                    aria-hidden="true"
                  >
                    <span className="font-mono text-sm font-medium" style={{ color: 'var(--color-signal)' }}>{step.id}</span>
                  </div>
                  <h3 className="font-editorial font-semibold mb-3" style={{
                    fontSize: 'clamp(1.1875rem, 2.2vw, 1.3125rem)',
                    color: 'var(--color-ivory)',
                    lineHeight: '1.3',
                    letterSpacing: '-0.01em',
                  }}>
                    {step.title}
                  </h3>
                  <p style={{ color: 'rgba(244,241,232,0.75)', lineHeight: '1.7', maxWidth: '55ch', fontSize: 'clamp(0.9375rem, 1.5vw, 1rem)', fontWeight: '400' }}>
                    {step.desc}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ========================================================================
         NOTRE PROJET — Rebalanced: editorial text + features panel with better proportions
         ======================================================================== */}
      <section id="le-projet" aria-labelledby="projet-title" className="py-18 md:py-26" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="container mx-auto px-6" style={{ maxWidth: 'var(--container-max)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-start">
            {/* Colonne éditoriale — plus d'espace respirant */}
            <div style={{ paddingRight: 'var(--space-4)' }}>
              <p id="projet-overline" className="font-mono text-sm uppercase tracking-wider mb-5" style={{ color: 'var(--color-ink-mut)', letterSpacing: '0.1em' }}>
                Notre projet
              </p>
              <h2 id="projet-title" className="font-editorial leading-tight mb-7" style={{
                fontSize: 'clamp(2.125rem, 4.2vw, 3.25rem)',
                color: 'var(--color-ink)',
                fontWeight: '700',
                letterSpacing: '-0.015em',
              }}>
                Une plateforme pour piloter l'exploitation
              </h2>
              <p className="mb-8" style={{
                fontSize: 'clamp(1.0625rem, 1.6vw, 1.1875rem)',
                lineHeight: '1.8',
                color: 'var(--color-ink-mut)',
                fontWeight: '400',
                maxWidth: '55ch',
              }}>
                BAHKANSO centralise le suivi des financements, des dépenses, des activités d'élevage et de culture, ainsi que des chantiers, afin que chaque acteur dispose d'une information commune et à jour.
              </p>
              <div className="space-y-8 mt-14" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-10)' }}>
                <div>
                  <h4 className="font-editorial font-medium mb-3" style={{ color: 'var(--color-ink)', fontSize: 'var(--text-label-lg)', letterSpacing: '-0.01em' }}>
                    Objectif
                  </h4>
                  <p style={{ color: 'var(--color-ink-mut)', lineHeight: '1.7', fontSize: 'var(--text-body-sm)', fontWeight: '400' }}>
                    Centraliser le suivi des financements, des dépenses, des activités d'élevage et de culture, ainsi que des chantiers, afin que chaque acteur dispose d'une information commune et à jour.
                  </p>
                </div>
                <div>
                  <h4 className="font-editorial font-medium mb-3" style={{ color: 'var(--color-ink)', fontSize: 'var(--text-label-lg)', letterSpacing: '-0.01em' }}>
                    Organisation
                  </h4>
                  <p style={{ color: 'var(--color-ink-mut)', lineHeight: '1.7', fontSize: 'var(--text-body-sm)', fontWeight: '400' }}>
                    L'équipe de terrain gère les activités sur place. Le responsable à distance envoie les fonds et suit l'avancement depuis l'espace privé de l'application.
                  </p>
                </div>
              </div>
            </div>
            {/* Panneau fonctionnalités — plus de présence, carte élégante */}
            <div className="relative" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-3xl)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
              <div style={{ padding: 'var(--space-9)' }}>
                <p className="font-mono text-sm uppercase tracking-wider mb-7" style={{ color: 'var(--color-ink-mut)', letterSpacing: '0.1em' }}>
                  Fonctionnalités opérationnelles
                </p>
                <ul className="space-y-5" role="list">
                  {[
                    { title: 'Suivi des parcelles', desc: 'Gestion parcelle par parcelle : semis, intrants, récoltes, rendements.' },
                    { title: 'Campagnes culturales', desc: 'Planification, budgets, exécution et clôture de chaque campagne.' },
                    { title: 'Cheptel & santé animale', desc: 'Inventaire animaux, alimentation, traitements, événements de vie.' },
                    { title: 'Dépenses & financements', desc: 'Traçabilité complète des flux : envois fonds, achats, justificatifs.' },
                    { title: 'Ventes & commercialisation', desc: 'Enregistrement des ventes, prix, acheteurs, facturation.' },
                    { title: 'Chantiers & infrastructures', desc: "Suivi des travaux d'aménagement, de la planification à la réception." },
                  ].map((feat, i) => (
                    <li key={i} className="relative" style={{ paddingLeft: 'var(--space-10)', borderLeft: '2px solid var(--border-subtle)' }}>
                      <span className="absolute left-0 top-1 font-mono text-xs" style={{ color: 'var(--color-signal)', transform: 'translateX(-100%) translateX(var(--space-3))' }}>{String(i + 1).padStart(2, '0')}</span>
                      <h4 className="font-sans font-medium text-sm mb-1.5" style={{ color: 'var(--color-ink)' }}>{feat.title}</h4>
                      <p className="text-sm" style={{ color: 'var(--color-ink-mut)', lineHeight: '1.6', fontWeight: '400' }}>{feat.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Accent bottom bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1" aria-hidden="true" style={{
                background: 'linear-gradient(90deg, var(--color-terra) 0%, var(--color-signal) 50%, var(--color-grass) 100%)',
              }} />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================
         CONTACT / CTA — Refined: better typography, spacing
         ======================================================================== */}
      <section id="contact" aria-labelledby="contact-title" className="py-18 md:py-26" style={{ backgroundColor: 'var(--bg-page)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container mx-auto px-6" style={{ maxWidth: 'var(--container-max)' }}>
          <div className="max-w-3xl">
            <h2 id="contact-title" className="font-editorial leading-tight mb-7" style={{
              fontSize: 'clamp(2.125rem, 4.2vw, 3.25rem)',
              color: 'var(--color-ink)',
              fontWeight: '700',
              letterSpacing: '-0.015em',
            }}>
              {ctaTitle || 'Suivez l\'exploitation en temps réel'}
            </h2>
            <p className="mb-12 max-w-2xl" style={{
              fontSize: 'clamp(1.0625rem, 1.6vw, 1.1875rem)',
              lineHeight: '1.8',
              color: 'var(--color-ink-mut)',
              fontWeight: '400',
            }}>
              {ctaSubtitle || 'BAHKANSO centralise le suivi des financements, des dépenses, de l\'élevage, des cultures et des chantiers — une information commune, à jour, partagée entre le terrain et le responsable à distance.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-14 md:mb-18" role="group" aria-label="Actions de contact">
              <a
                href="#le-projet"
                className="module-btn module-btn-primary module-btn-lg text-center"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  borderColor: 'var(--accent-primary)',
                  color: 'var(--text-on-accent)',
                  fontSize: 'var(--text-label-lg)',
                  padding: 'var(--space-3-5) var(--space-6)',
                }}
              >
                {ctaPrimary || 'Découvrir le projet'}
              </a>
              <a
                href="/login"
                className="module-btn module-btn-secondary module-btn-lg text-center"
                style={{
                  backgroundColor: 'var(--bg-surface-raised)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-label-lg)',
                  padding: 'var(--space-3-5) var(--space-6)',
                }}
              >
                {ctaSecondary || 'Espace de gestion'}
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-10)' }}>
              <div>
                <h4 className="font-mono text-sm uppercase mb-3" style={{ color: 'var(--color-ink-dim)', letterSpacing: '0.08em' }}>
                  Espace gestion
                </h4>
                <a href="/login" className="underline underline-offset-2 transition-colors text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                  Connexion à l'espace privé
                </a>
              </div>
              <div>
                <h4 className="font-mono text-sm uppercase mb-3" style={{ color: 'var(--color-ink-dim)', letterSpacing: '0.08em' }}>
                  Localisation
                </h4>
                <p className="text-sm" style={{ color: 'var(--color-ink)', lineHeight: '1.7', fontWeight: '400' }}>
                  {farm?.location || 'Cocody, Palais de Justice<br/>Abidjan, Côte d\'Ivoire'}
                </p>
              </div>
              <div>
                <h4 className="font-mono text-sm uppercase mb-3" style={{ color: 'var(--color-ink-dim)', letterSpacing: '0.08em' }}>
                  Horaires
                </h4>
                <p className="text-sm" style={{ color: 'var(--color-ink)', lineHeight: '1.7', fontWeight: '400' }}>
                  Lundi au Vendredi, 8h - 18h (GMT)<br/>Responsable disponible 24/7
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================
         FOOTER — Config-driven (footer.*)
         ======================================================================== */}
      <footer className="py-12 md:py-16" style={{ backgroundColor: 'var(--color-slate)', color: 'rgba(244,241,232,0.8)' }}>
        <div className="container mx-auto px-6" style={{ maxWidth: 'var(--container-max)' }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
            <div className="col-span-1 md:col-span-2">
              {farm?.logo_url ? (
              <OptimizedImage src={farm.logo_url} alt="" className="h-10 w-auto mb-4" aria-hidden="true" style={{ filter: 'brightness(0) invert(1)' }} />
              ) : (
                <span className="font-editorial text-2xl font-bold" style={{ color: 'var(--color-ivory)' }}>
                  BAHKANSO
                </span>
              )}
              <p className="text-sm max-w-xs" style={{ lineHeight: '1.6' }}>
                {footerDescription || 'Projet agro-pastoral. Suivi partagé entre équipe de terrain et le responsable à distance.'}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4" style={{ color: 'var(--color-ivory)', fontSize: 'var(--text-label-lg)' }}>
                {footerModulesTitle || 'Navigation'}
              </h4>
              <ul className="space-y-2 text-sm">
                {footerModules?.length ? (
                  footerModules.map((mod, i) => {
                    const rawValue = mod?.value ?? mod ?? '';
                    const modValue =
                      typeof rawValue === 'string'
                        ? rawValue
                        : String((rawValue as { value?: string })?.value ?? '');
                    const slug = modValue.toLowerCase().replace(/\s+/g, '-');
                    return (
                      <li key={i}>
                        <a href={'#' + slug} className="hover:text-ivory transition-colors underline underline-offset-2">
                          {modValue}
                        </a>
                      </li>
                    );
                  })
                ) : (
                  <>
                    <li><a href="#le-projet" className="hover:text-ivory transition-colors underline underline-offset-2">Le projet</a></li>
                    <li><a href="#nos-activites" className="hover:text-ivory transition-colors underline underline-offset-2">Nos activités</a></li>
                    <li><a href="#notre-suivi" className="hover:text-ivory transition-colors underline underline-offset-2">Notre suivi</a></li>
                    <li><a href="/login" className="hover:text-ivory transition-colors underline underline-offset-2">Espace de gestion</a></li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4" style={{ color: 'var(--color-ivory)', fontSize: 'var(--text-label-lg)' }}>
                {footerSecurityTitle || 'Liens utiles'}
              </h4>
              <ul className="space-y-2 text-sm">
                {footerSecurity?.length ? (
                  footerSecurity.map((sec, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span aria-hidden="true" style={{ color: 'var(--color-signal)' }}>{sec.icon || '✓'}</span>
                      <a href="#" className="hover:text-ivory transition-colors underline underline-offset-2">{sec.text}</a>
                    </li>
                  ))
                ) : (
                  <>
                    <li><a href="/login" className="hover:text-ivory transition-colors underline underline-offset-2">Connexion</a></li>
                    <li><a href="#contact" className="hover:text-ivory transition-colors underline underline-offset-2">Contact</a></li>
                    <li><a href="/mentions-legales" className="hover:text-ivory transition-colors underline underline-offset-2">Mentions légales</a></li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-xs" style={{ borderColor: 'rgba(244,241,232,0.1)', color: 'rgba(244,241,232,0.5)' }}>
            {footerCopyright || '© 2026 BAHKANSO — Projet agro-pastoral'}
          </div>
        </div>
      </footer>
    </div>
  );
}

export { LandingPage };
