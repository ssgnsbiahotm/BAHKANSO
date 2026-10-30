import { useEffect, useState } from 'react';
import { useData } from '@/lib/DataContext';

export default function LandingPagePrototype() {
  const [scrolled, setScrolled] = useState(false);
  const { farm } = useData();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activities = [
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
  ];

  return (
    <div className="module-page" style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* HEADER — Ancré, lisible, logo visible */}
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
                <img
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
              {['Le projet', 'Nos activités', 'Notre suivi'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  className="text-sm font-medium transition-colors duration-200 relative"
                  style={{ color: 'var(--color-ink-mut)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-terra)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-ink-mut)'; }}
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
                  />
                </a>
              ))}
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
              >
                Espace de gestion
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* HERO — Composition équilibrée : texte à gauche, terrain à droite — FOND CLAIR */}
      <section
        aria-labelledby="hero-title"
        className="relative min-h-[80vh] flex items-center"
        style={{
          backgroundColor: 'var(--bg-page)',
          overflow: 'hidden',
        }}
      >
        {/* Image de terrain en fond — très subtile */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/images/hero-projet.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            backgroundRepeat: 'no-repeat',
            opacity: 0.06,
          }}
        />

        {/* Accent latéral gauche — bandeau terre/signal */}
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0"
          style={{
            width: '6px',
            background: 'linear-gradient(180deg, var(--color-terra) 0%, var(--color-signal) 50%, var(--color-grass) 100%)',
            borderRadius: '0 8px 8px 0',
          }}
        />

        {/* Accent terre — bandeau latéral */}
        <div
          aria-hidden="true"
          className="absolute left-0 top-1/2 -translate-y-1/2"
          style={{
            width: '4px',
            height: '120px',
            background: 'linear-gradient(180deg, var(--color-terra) 0%, var(--color-signal) 100%)',
            borderRadius: '0 4px 4px 0',
          }}
        />

        <div className="container mx-auto px-6 relative z-10" style={{ maxWidth: 'var(--container-max)' }}>
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            {/* Colonne contenu — 7/12 */}
            <div className="lg:col-span-7">
              <p
                id="hero-overline"
                className="font-mono text-sm tracking-widest uppercase mb-4"
                style={{ color: 'var(--color-signal)' }}
              >
                Projet agro-pastoral — Côte d'Ivoire
              </p>

              <h1
                id="hero-title"
                className="font-editorial leading-[1.05] mb-6"
                style={{
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                  lineHeight: '1.05',
                  color: 'var(--color-ink)',
                  fontWeight: '800',
                  letterSpacing: '-0.02em',
                  maxWidth: '90%',
                }}
              >
                Pilotez l'exploitation,<br />
                <span style={{ color: 'var(--color-signal)' }}>suivez chaque résultat</span>
              </h1>

              <p className="mb-8 max-w-[55ch]" style={{
                fontSize: 'clamp(1rem, 1.8vw, 1.125rem)',
                lineHeight: '1.7',
                color: 'var(--color-ink-mut)',
              }}>
                BAHKANSO centralise le suivi des financements, des cultures, de l'élevage et des chantiers.
                Une information commune, à jour, partagée entre l'équipe terrain et le responsable à distance.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-start" role="group" aria-label="Actions principales">
                <a
                  href="#nos-activites"
                  className="module-btn module-btn-primary module-btn-lg px-8 py-3 text-center inline-flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--color-signal)',
                    borderColor: 'var(--color-signal)',
                    color: 'var(--color-night)',
                    fontWeight: '600',
                  }}
                >
                  Découvrir nos activités
                  <span aria-hidden="true">→</span>
                </a>
                <a
                  href="/login"
                  className="module-btn module-btn-secondary module-btn-lg px-8 py-3 text-center inline-flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--color-ink)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  Espace de gestion
                </a>
              </div>

              {/* Preuve terrain — stats réelles si dispo, sinon indicateurs qualitatifs */}
              <div className="mt-12 flex flex-wrap gap-8 md:gap-12" role="list" aria-label="Indicateurs terrain">
                {[
                  { label: 'Parcelles suivies', value: 'En cours' },
                  { label: 'Animaux au cheptel', value: 'En cours' },
                  { label: 'Chantiers actifs', value: 'En cours' },
                ].map((stat, i) => (
                  <div key={i} className="flex items-baseline gap-2" role="listitem">
                    <span className="font-editorial" style={{
                      fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                      color: 'var(--color-signal)',
                      fontWeight: '700',
                      lineHeight: '1',
                    }}>
                      {stat.value}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--color-ink-mut)' }}>
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Colonne visuelle — 5/12 : carte "terrain" avec image recadrée */}
            <div className="lg:col-span-5 hidden lg:block">
              <div
                className="relative"
                style={{
                  aspectRatio: '4/5',
                  borderRadius: 'var(--radius-2xl)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-2xl)',
                  border: '1px solid rgba(244,241,232,0.1)',
                }}
              >
                <img
                  src="/images/hero-projet.jpg"
                  alt="Vue de l'exploitation BAHKANSO — cultures et infrastructures"
                  className="w-full h-full object-cover"
                  style={{
                    transform: 'scale(1.02)',
                    filter: 'brightness(0.9) saturate(1.1)',
                  }}
                />
                {/* Overlay infos terrain */}
                <div className="absolute bottom-0 left-0 right-0 p-6" style={{
                  background: 'linear-gradient(180deg, rgba(17,26,24,0) 0%, rgba(17,26,24,0.95) 100%)',
                }}>
                  <p className="font-mono text-xs tracking-wider uppercase mb-1" style={{ color: 'var(--color-signal)' }}>
                    Exploitation active
                  </p>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-ivory)' }}>
                    Cocody, Palais de Justice — Abidjan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NOS ACTIVITÉS — Cartes vivantes, ancrées dans le terrain */}
      <section id="nos-activites" aria-labelledby="activites-title" className="py-16 md:py-24 lg:py-32" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="container mx-auto px-6" style={{ maxWidth: 'var(--container-max)' }}>
          {/* En-tête de section */}
          <div className="max-w-3xl mb-12 md:mb-16">
            <p id="activites-overline" className="font-mono text-sm uppercase tracking-wider mb-4" style={{ color: 'var(--color-signal)' }}>
              Nos activités
            </p>
            <h2 id="activites-title" className="font-editorial leading-tight mb-6" style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              color: 'var(--color-ink)',
              fontWeight: '700',
            }}>
              Ce qui fait vivre l'exploitation
            </h2>
            <p className="max-w-[45ch]" style={{
              fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
              lineHeight: '1.7',
              color: 'var(--color-ink-mut)',
            }}>
              Trois métiers, une même exigence de traçabilité : les cultures, l'élevage et les aménagements
              sont pilotés depuis la même plateforme, par la même équipe, avec les mêmes données.
            </p>
          </div>

          {/* Grille de cartes activités — 3 colonnes sur desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8" role="list" aria-label="Activités principales">
            {activities.map((item, i) => (
              <article
                key={item.id}
                className="group relative"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-2xl)',
                  overflow: 'hidden',
                  transition: 'transform var(--duration-300) var(--ease-out), box-shadow var(--duration-300) var(--ease-out), border-color var(--duration-300) var(--ease-out)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
                  e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-signal) 40%, var(--border-default))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
                role="listitem"
              >
                {/* Bandeau couleur en haut de carte */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{
                    background: `linear-gradient(90deg, ${item.color} 0%, var(--color-signal) 100%)`,
                    transformOrigin: 'left',
                    transform: 'scaleX(1)',
                  }}
                />

                {/* Contenu carte */}
                <div className="p-6" style={{ position: 'relative', zIndex: 1 }}>
                  {/* Icône + numéro */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl" aria-hidden="true">{item.icon}</span>
                      <span className="font-mono text-sm" style={{ color: 'var(--color-ink-dim)' }}>
                        {item.id}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-sans font-semibold mb-3" style={{
                    fontSize: 'clamp(1.125rem, 2vw, 1.25rem)',
                    color: 'var(--color-ink)',
                  }}>
                    {item.title}
                  </h3>

                  <p className="mb-6 flex-1" style={{
                    color: 'var(--color-ink-mut)',
                    lineHeight: '1.65',
                    fontSize: '0.9375rem',
                  }}>
                    {item.desc}
                  </p>

                  <a
                    href={item.href}
                    className="module-view-all-link inline-flex items-center gap-2 font-medium transition-transform duration-200"
                    style={{
                      color: item.color,
                      fontSize: 'var(--text-label-md)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(4px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; }}
                  >
                    {item.link}
                    <span aria-hidden="true" style={{ transition: 'transform var(--duration-200) var(--ease-out)' }}>→</span>
                  </a>
                </div>

                {/* Fond texturé subtil — SVG pattern */}
                <div
                  aria-hidden="true"
                  className="absolute bottom-0 right-0 opacity-5"
                  style={{
                    width: '120px',
                    height: '120px',
                    transform: 'translate(20%, 20%)',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L34 15H44L36 21L40 31L30 26L20 31L24 21L16 15H26Z' fill='none' stroke='%23${item.color.slice(1)}' stroke-width='0.5'/%3E%3C/svg%3E")`,
                    backgroundSize: '60px 60px',
                    pointerEvents: 'none',
                  }}
                />
              </article>
            ))}
          </div>

          {/* CTA section activités */}
          <div className="mt-16 text-center">
            <a
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-xl transition-all duration-200"
              style={{
                backgroundColor: 'var(--color-ink)',
                color: 'var(--color-ivory)',
                border: '1px solid var(--color-ink)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-signal)';
                e.currentTarget.style.borderColor = 'var(--color-signal)';
                e.currentTarget.style.color = 'var(--color-night)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-ink)';
                e.currentTarget.style.borderColor = 'var(--color-ink)';
                e.currentTarget.style.color = 'var(--color-ivory)';
              }}
            >
              Accéder à l'espace de gestion complet
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* POURQUOI BAHKANSO — FOND CLAIR */}
      <section id="pourquoi" aria-labelledby="pourquoi-title" className="py-16 md:py-24" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <div className="container mx-auto px-6" style={{ maxWidth: 'var(--container-max)' }}>
          <div className="max-w-3xl mb-12 md:mb-16">
            <p id="pourquoi-overline" className="font-mono text-sm uppercase tracking-wider mb-4" style={{ color: 'var(--color-signal)' }}>
              Pourquoi Bahkanso
            </p>
            <h2 id="pourquoi-title" className="font-editorial leading-tight" style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              color: 'var(--color-ink)',
              fontWeight: '700',
            }}>
              Quatre piliers pour un pilotage serein
            </h2>
          </div>
          <div className="module-kpi-grid" role="list" aria-label="Piliers de la plateforme">
            {[
              { id: '01', title: 'Traçabilité complète', desc: 'Chaque dépense, saisie et décision est horodatée et attribuée.' },
              { id: '02', title: 'Équipe synchronisée', desc: 'Terrain et responsable à distance travaillent sur les mêmes données.' },
              { id: '03', title: 'Sécurité des données', desc: 'Authentification, permissions et audit intègres, hébergement maîtrisé.' },
              { id: '04', title: 'Pilotage par indicateurs', desc: 'Tableaux de bord automatiques, alertes seuls, exports pour le décideur.' },
            ].map((item, i) => (
              <article
                key={item.id}
                className="module-kpi-card"
                role="listitem"
                style={{
                  borderLeftColor: 'var(--accent-primary)',
                  backgroundColor: 'var(--bg-page)',
                  borderColor: 'var(--border-default)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div className="module-kpi-header">
                  <span className="font-mono text-sm" style={{ color: 'var(--color-terra)' }}>{item.id}</span>
                </div>
                <div className="module-kpi-body">
                  <h3 className="module-kpi-label" style={{ color: 'var(--color-ink-mut)' }}>{item.title}</h3>
                  <p style={{ color: 'var(--color-ink-mut)', fontSize: 'var(--text-body-sm)', lineHeight: '1.6', margin: 0 }}>{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 md:py-16" style={{ backgroundColor: 'var(--color-slate)', color: 'rgba(244,241,232,0.8)' }}>
        <div className="container mx-auto px-6" style={{ maxWidth: 'var(--container-max)' }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
            <div className="col-span-1 md:col-span-2">
              {farm?.logo_url ? (
                <img src={farm.logo_url} alt="" className="h-10 w-auto mb-4" aria-hidden="true" style={{ filter: 'brightness(0) invert(1)' }} />
              ) : (
                <span className="font-editorial text-2xl font-bold" style={{ color: 'var(--color-ivory)' }}>
                  BAHKANSO
                </span>
              )}
              <p className="text-sm max-w-xs" style={{ lineHeight: '1.6' }}>
                Projet agro-pastoral. Suivi partagé entre équipe de terrain et le responsable à distance.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4" style={{ color: 'var(--color-ivory)', fontSize: 'var(--text-label-lg)' }}>
                Navigation
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#le-projet" className="hover:text-ivory transition-colors underline underline-offset-2">Le projet</a></li>
                <li><a href="#nos-activites" className="hover:text-ivory transition-colors underline underline-offset-2">Nos activités</a></li>
                <li><a href="#notre-suivi" className="hover:text-ivory transition-colors underline underline-offset-2">Notre suivi</a></li>
                <li><a href="/login" className="hover:text-ivory transition-colors underline underline-offset-2">Espace de gestion</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4" style={{ color: 'var(--color-ivory)', fontSize: 'var(--text-label-lg)' }}>
                Liens utiles
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/login" className="hover:text-ivory transition-colors underline underline-offset-2">Connexion</a></li>
                <li><a href="#contact" className="hover:text-ivory transition-colors underline underline-offset-2">Contact</a></li>
                <li><a href="/mentions-legales" className="hover:text-ivory transition-colors underline underline-offset-2">Mentions légales</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-xs" style={{ borderColor: 'rgba(244,241,232,0.1)', color: 'rgba(244,241,232,0.5)' }}>
            © 2026 BAHKANSO — Projet agro-pastoral
          </div>
        </div>
      </footer>
    </div>
  );
}

export { LandingPagePrototype };