import { useEffect, useState } from 'react';
import { useData } from '@/lib/DataContext';
import { Logo } from '@/components/ui/Logo';
import '@/styles/components.css';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const { farm } = useData();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-night text-ivory">
      {/* HEADER */}
      <header
        className={`fixed top-0 left-0 right-0 z-[var(--z-sticky)] transition-all duration-300 ${scrolled ? 'bg-slate-700 border-b border-slate-600 shadow-sm' : 'bg-transparent'}`}
        role="banner"
      >
        <div className="container mx-auto px-6 py-4 flex justify-between items-center" style={{ maxWidth: 'var(--container-max)' }}>
          <a href="/" className="flex items-center gap-3" aria-label="BAHKANSO - Accueil">
            {farm?.logo_url ? (
              <img
                src={farm.logo_url}
                alt=""
                className={`h-10 w-auto transition-opacity ${!scrolled ? 'opacity-0' : 'opacity-100'}`}
                aria-hidden="true"
                style={{ filter: !scrolled ? 'brightness(0) invert(1)' : 'none' }}
              />
            ) : (
              <span className="font-editorial text-2xl font-bold text-ivory">BAHKANSO</span>
            )}
          </a>
            <nav className="hidden md:flex gap-8" aria-label="Navigation principale">
              {['Le projet', 'Nos activités', 'Notre suivi'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  className={`text-sm font-medium transition-colors ${scrolled ? 'text-ink' : 'text-slate-400'}`}
                >
                  {item}
                </a>
              ))}
            </nav>
        </div>
      </header>

      {/* HERO — Identité éditoriale, sans image stock */}
      <section
        aria-labelledby="hero-title"
        style={{
          position: 'relative',
          minHeight: 'clamp(60vh, 80vh, 90vh)',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--color-night)',
          overflow: 'hidden',
        }}
      >
        {/* Pattern de fond subtil SVG */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.03,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L34 15H44L36 21L40 31L30 26L20 31L24 21L16 15H26Z' fill='none' stroke='%23B9D86B' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '120px 120px',
          }}
        />
        {/* Gradient de bord */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(17,26,24,0) 0%, rgba(17,26,24,0.3) 60%, rgba(17,26,24,0.6) 100%)',
            pointerEvents: 'none',
          }}
        />
        <div className="container mx-auto px-6 relative" style={{ zIndex: 2, maxWidth: 'var(--container-max)' }}>
          <div className="max-w-3xl">
            <p id="hero-overline" className="font-mono text-sm tracking-widest uppercase mb-6" style={{ color: 'rgba(244,241,232,0.6)' }}>
              Plateforme de gouvernance agro-pastorale
            </p>
            <h1 id="hero-title" className="font-editorial leading-[1.1] mb-6" style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              lineHeight: '1.1',
              color: 'var(--color-ivory)',
              fontWeight: '800',
              letterSpacing: '-0.02em',
            }}>
              Pilotez vos investissements agro-pastoraux en toute transparence
            </h1>
            <p className="mb-10 max-w-[60ch]" style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              lineHeight: '1.7',
              color: 'rgba(244,241,232,0.85)',
            }}>
              Bahkanso connecte les opérations, les preuves et les résultats. Suivez chaque franc investi, depuis le financement jusqu'au résultat sur le terrain.
            </p>
            <div className="flex flex-col sm:flex-row gap-4" role="group" aria-label="Actions principales">
              <a
                href="#le-projet"
                className="module-btn module-btn-primary module-btn-lg text-center"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  borderColor: 'var(--accent-primary)',
                  color: 'var(--text-on-accent)',
                }}
              >
                Découvrir le projet
              </a>
              <a
                href="/login"
                className="module-btn module-btn-secondary module-btn-lg text-center"
                style={{
                  backgroundColor: 'var(--bg-surface-raised)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              >
                Espace de gestion
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* NOS ACTIVITÉS — Grille asymétrique */}
      <section id="nos-activites" aria-labelledby="activites-title" className="py-16 md:py-24" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="container mx-auto px-6" style={{ maxWidth: 'var(--container-max)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p id="activites-overline" className="font-mono text-sm uppercase tracking-wider mb-4" style={{ color: 'var(--color-ink-mut)' }}>
                Nos activités
              </p>
              <h2 id="activites-title" className="font-editorial leading-tight mb-6" style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                color: 'var(--color-ink)',
                fontWeight: '700',
              }}>
                Ce qui fait vivre l'exploitation
              </h2>
              <p className="mb-8 max-w-[45ch]" style={{
                fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
                lineHeight: '1.7',
                color: 'var(--color-ink-mut)',
              }}>
                Trois métiers, une même exigence de traçabilité : les cultures, l'élevage et les aménagements sont pilotés depuis la même plateforme, par la même équipe, avec les mêmes données.
              </p>
            </div>
            <div className="lg:col-span-7">
              <div className="space-y-6" role="list" aria-label="Activités principales">
                {[
                  { id: '01', title: 'Cultures', desc: 'Suivi des semis à la récolte, parcelle par parcelle, avec saisie terrain en temps réel.', link: 'Voir le suivi des cultures', href: '/app/agriculture' },
                  { id: '02', title: 'Élevage', desc: 'Alimentation, état de santé et événements de chaque animal, tracés dans le temps.', link: 'Voir le suivi d\'élevage', href: '/app/livestock' },
                  { id: '03', title: 'Travaux', desc: "Suivi des chantiers d'aménagements et d'infrastructures, de la planification à la réception.", link: 'Voir les chantiers', href: '/app/projects' },
                ].map((item, i) => (
                  <article
                    key={item.id}
                    className="module-section group"
                    style={{
                      padding: 'var(--space-6)',
                      borderLeftWidth: '4px',
                      borderLeftColor: i === 0 ? 'var(--accent-primary)' : 'transparent',
                      transition: 'border-color var(--duration-300) var(--ease-out), box-shadow var(--duration-300) var(--ease-out)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderLeftColor = 'var(--accent-primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderLeftColor = i === 0 ? 'var(--accent-primary)' : 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
                    role="listitem"
                  >
                    <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                      <span className="font-mono text-sm self-start mt-1 shrink-0" style={{ color: 'var(--color-ink-dim)' }}>{item.id}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-sans font-medium mb-2" style={{
                          fontSize: 'clamp(1.125rem, 2vw, 1.25rem)',
                          color: 'var(--color-ink)',
                        }}>
                          {item.title}
                        </h3>
                        <p className="mb-4" style={{
                          color: 'var(--color-ink-mut)',
                          lineHeight: '1.6',
                        }}>
                          {item.desc}
                        </p>
                        <a
                          href={item.href}
                          className="module-view-all-link inline-flex items-center gap-2"
                          style={{
                            color: 'var(--accent-primary)',
                            fontSize: 'var(--text-label-md)',
                          }}
                        >
                          {item.link}
                          <span aria-hidden="true" style={{ transition: 'transform var(--duration-200) var(--ease-out)' }}>→</span>
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POURQUOI BAHKANSO — KPI Cards */}
      <section id="pourquoi" aria-labelledby="pourquoi-title" className="py-16 md:py-24" style={{ backgroundColor: 'var(--color-night)', color: 'var(--color-ivory)' }}>
        <div className="container mx-auto px-6" style={{ maxWidth: 'var(--container-max)' }}>
          <div className="max-w-3xl mb-12 md:mb-16">
            <p id="pourquoi-overline" className="font-mono text-sm uppercase tracking-wider mb-4" style={{ color: 'rgba(244,241,232,0.5)' }}>
              Pourquoi Bahkanso
            </p>
            <h2 id="pourquoi-title" className="font-editorial leading-tight" style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
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
                  backgroundColor: 'var(--bg-surface-raised)',
                  borderColor: 'var(--border-default)',
                }}
              >
                <div className="module-kpi-header">
                  <span className="font-mono text-sm" style={{ color: 'var(--color-terra)' }}>{item.id}</span>
                </div>
                <div className="module-kpi-body">
                  <h3 className="module-kpi-label" style={{ color: 'var(--color-ink-mut)' }}>{item.title}</h3>
                  <p style={{ color: 'rgba(244,241,232,0.7)', fontSize: 'var(--text-body-sm)', lineHeight: '1.6', margin: 0 }}>{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* NOTRE SUIVI — Timeline verticale */}
      <section id="notre-suivi" aria-labelledby="suivi-title" className="py-16 md:py-24" style={{ backgroundColor: 'var(--color-night)', color: 'var(--color-ivory)', borderTop: '1px solid rgba(244,241,232,0.1)' }}>
        <div className="container mx-auto px-6" style={{ maxWidth: 'var(--container-max)' }}>
          <div className="mb-12 md:mb-16">
            <p id="suivi-overline" className="font-mono text-sm uppercase tracking-wider mb-4" style={{ color: 'rgba(244,241,232,0.5)' }}>
              Notre suivi
            </p>
            <h2 id="suivi-title" className="font-editorial leading-tight" style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '700',
            }}>
              Transparence et traçabilité<br/>à chaque étape
            </h2>
          </div>
          <div className="max-w-2xl">
            <ol className="relative" style={{ paddingLeft: 'var(--space-10)', borderLeft: '2px solid rgba(244,241,232,0.15)' }} aria-label="Étapes du cycle de suivi">
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
                    paddingLeft: 'var(--space-6)',
                    paddingBottom: index === 3 ? '0' : 'var(--space-12)',
                    position: 'relative',
                  }}
                >
                  <div
                    className="absolute"
                    style={{
                      left: 'calc(var(--space-10) * -1)',
                      top: '0',
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-night)',
                      border: '2px solid var(--color-signal)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      zIndex: 1,
                    }}
                    aria-hidden="true"
                  >
                    <span className="font-mono text-sm" style={{ color: 'var(--color-signal)' }}>{step.id}</span>
                  </div>
                  <h3 className="font-sans font-medium mb-2" style={{
                    fontSize: 'clamp(1.125rem, 2vw, 1.25rem)',
                    color: 'var(--color-ivory)',
                  }}>
                    {step.title}
                  </h3>
                  <p style={{ color: 'rgba(244,241,232,0.7)', lineHeight: '1.6', maxWidth: '55ch' }}>
                    {step.desc}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* NOTRE PROJET — Éditorial */}
      <section id="le-projet" aria-labelledby="projet-title" className="py-16 md:py-24" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="container mx-auto px-6" style={{ maxWidth: 'var(--container-max)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div>
              <p id="projet-overline" className="font-mono text-sm uppercase tracking-wider mb-4" style={{ color: 'var(--color-ink-mut)' }}>
                Notre projet
              </p>
              <h2 id="projet-title" className="font-editorial leading-tight mb-8" style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                color: 'var(--color-ink)',
                fontWeight: '700',
              }}>
                Une plateforme pour piloter l'exploitation
              </h2>
              <p className="mb-6" style={{
                fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
                lineHeight: '1.7',
                color: 'var(--color-ink-mut)',
              }}>
                BAHKANSO centralise le suivi des financements, des dépenses, des activités d'élevage et de culture, ainsi que des chantiers, afin que chaque acteur dispose d'une information commune et à jour.
              </p>
              <div className="space-y-6 mt-12" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-8)' }}>
                <div>
                  <h4 className="font-sans font-medium mb-2" style={{ color: 'var(--color-ink)', fontSize: 'var(--text-label-lg)' }}>
                    Objectif
                  </h4>
                  <p className="text-sm" style={{ color: 'var(--color-ink-mut)', lineHeight: '1.6' }}>
                    Centraliser le suivi des financements, des dépenses, des activités d'élevage et de culture, ainsi que des chantiers, afin que chaque acteur dispose d'une information commune et à jour.
                  </p>
                </div>
                <div>
                  <h4 className="font-sans font-medium mb-2" style={{ color: 'var(--color-ink)', fontSize: 'var(--text-label-lg)' }}>
                    Organisation
                  </h4>
                  <p className="text-sm" style={{ color: 'var(--color-ink-mut)', lineHeight: '1.6' }}>
                    L'équipe de terrain gère les activités sur place. Le responsable à distance envoie les fonds et suit l'avancement depuis l'espace privé de l'application.
                  </p>
                </div>
              </div>
            </div>
            <div className="module-section" style={{ padding: 'var(--space-8)' }}>
              <p className="font-mono text-sm uppercase tracking-wider mb-6" style={{ color: 'var(--color-ink-mut)' }}>
                Fonctionnalités opérationnelles
              </p>
              <ul className="space-y-4" role="list">
                {[
                  { title: 'Suivi des parcelles', desc: 'Gestion parcelle par parcelle : semis, intrants, récoltes, rendements.' },
                  { title: 'Campagnes culturales', desc: 'Planification, budgets, exécution et clôture de chaque campagne.' },
                  { title: 'Cheptel & santé animale', desc: 'Inventaire animaux, alimentation, traitements, événements de vie.' },
                  { title: 'Dépenses & financements', desc: 'Traçabilité complète des flux : envois fonds, achats, justificatifs.' },
                  { title: 'Ventes & commercialisation', desc: 'Enregistrement des ventes, prix, acheteurs, facturation.' },
                  { title: 'Chantiers & infrastructures', desc: "Suivi des travaux d'aménagement, de la planification à la réception." },
                ].map((feat, i) => (
                  <li key={i} className="border-t border-ink/10 pt-4 first:border-0 first:pt-0" style={{ borderColor: 'var(--border-subtle)' }}>
                    <h4 className="font-sans font-medium text-sm mb-1" style={{ color: 'var(--color-ink)' }}>{feat.title}</h4>
                    <p className="text-xs" style={{ color: 'var(--color-ink-mut)', lineHeight: '1.5' }}>{feat.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT / CONCLUSION */}
      <section id="contact" aria-labelledby="contact-title" className="py-16 md:py-24" style={{ backgroundColor: 'var(--bg-page)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container mx-auto px-6" style={{ maxWidth: 'var(--container-max)' }}>
          <div className="max-w-3xl">
            <h2 id="contact-title" className="font-editorial leading-tight mb-6" style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              color: 'var(--color-ink)',
              fontWeight: '700',
            }}>
              Suivez l'exploitation en temps réel
            </h2>
            <p className="mb-10 max-w-2xl" style={{
              fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
              lineHeight: '1.7',
              color: 'var(--color-ink-mut)',
            }}>
              BAHKANSO centralise le suivi des financements, des dépenses, de l'élevage, des cultures et des chantiers — une information commune, à jour, partagée entre le terrain et le responsable à distance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-12 md:mb-16" role="group" aria-label="Actions de contact">
              <a
                href="#le-projet"
                className="module-btn module-btn-primary module-btn-lg text-center"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  borderColor: 'var(--accent-primary)',
                  color: 'var(--text-on-accent)',
                }}
              >
                Découvrir le projet
              </a>
              <a
                href="/login"
                className="module-btn module-btn-secondary module-btn-lg text-center"
                style={{
                  backgroundColor: 'var(--bg-surface-raised)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              >
                Espace de gestion
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-8)' }}>
              <div>
                <h4 className="font-mono text-sm uppercase mb-2" style={{ color: 'var(--color-ink-dim)' }}>
                  Espace gestion
                </h4>
                <a href="/login" className="underline underline-offset-2 transition-colors text-sm" style={{ color: 'var(--color-ink)' }}>
                  Connexion à l'espace privé
                </a>
              </div>
              <div>
                <h4 className="font-mono text-sm uppercase mb-2" style={{ color: 'var(--color-ink-dim)' }}>
                  Localisation
                </h4>
                <p className="text-sm" style={{ color: 'var(--color-ink)', lineHeight: '1.6' }}>
                  Cocody, Palais de Justice<br/>Abidjan, Côte d'Ivoire
                </p>
              </div>
              <div>
                <h4 className="font-mono text-sm uppercase mb-2" style={{ color: 'var(--color-ink-dim)' }}>
                  Horaires
                </h4>
                <p className="text-sm" style={{ color: 'var(--color-ink)', lineHeight: '1.6' }}>
                  Lundi au Vendredi, 8h - 18h (GMT)<br/>Responsable disponible 24/7
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 md:py-16" style={{ backgroundColor: 'var(--color-night)', color: 'rgba(244,241,232,0.7)' }}>
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

export { LandingPage };
