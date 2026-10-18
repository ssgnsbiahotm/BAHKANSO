import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { Logo } from '@/components/ui/Logo';
import { RotatingCard } from '@/components/ui/RotatingCard';

import './LandingPage.css';

export function LandingPage() {
  const navigate = useNavigate();
  const { farm, siteContent } = useData();
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 60);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const goToLogin = () => {
    navigate('/login');
  };

  const hero = (siteContent?.hero?.value as Record<string, unknown> | undefined) || {};
  const heroImage = (hero.heroImage as string | undefined) || undefined;
  const heroAlt = (hero.heroAlt as string | undefined) || 'Bandeau d’accueil';
  const heroBadge = (hero.badge as string | undefined) || 'Projet agro-pastoral · Côte d’Ivoire';
  const heroTitle = (hero.title as string | undefined) || 'Un projet agricole, suivi de près.';
  const heroSubtitle = (hero.subtitle as string | undefined) || 'BAHKANSO rassemble les informations de notre exploitation pour que l’équipe de terrain et le responsable à distance travaillent avec les mêmes données.';
  const heroCtaPrimary = (hero.ctaPrimary as string | undefined) || 'Découvrir le projet';
  const heroCtaSecondary = (hero.ctaSecondary as string | undefined) || 'Espace de suivi';

  return (
    <div className="bk-page min-h-screen flex flex-col" lang="fr">
      {/* ==================== NAVIGATION ==================== */}
      <header className={`bk-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="bk-nav-inner">
          <a href="/" className="bk-brand" aria-label="Accueil BAHKANSO">
            <Logo
              icon="Sprout"
              color="#FFFFFF"
              bgColor="var(--bk-grass)"
              size={40}
              imageUrl={farm?.logo_url ?? null}
            />
            <div className="bk-brand-name">BAHKANSO</div>
          </a>

          <nav className="bk-nav-list">
            <a href="#projet">Le projet</a>
            <a href="#activites">Nos activités</a>
            <a href="#suivi">Notre suivi</a>
          </nav>

          <div className="flex items-center gap-3">
            <a href="/login" className="bk-cta" onClick={goToLogin}>
              Espace de suivi <ArrowRight size={16} />
            </a>
            <button className="bk-menu-toggle" aria-label="Ouvrir le menu" aria-expanded="false">
              <span className="block w-5 h-0.5 bg-current mb-1"></span>
              <span className="block w-5 h-0.5 bg-current mb-1"></span>
              <span className="block w-5 h-0.5 bg-current"></span>
            </button>
          </div>
        </div>
        <div className="bk-menu-mobile">
          <a href="#projet" className="block">Le projet</a>
          <a href="#activites" className="block">Nos activités</a>
          <a href="#suivi" className="block">Notre suivi</a>
          <a href="/login" className="bk-cta" style={{ display: 'block', textAlign: 'center', marginTop: '0.5rem' }} onClick={goToLogin}>
            Espace de suivi
          </a>
        </div>
      </header>

      <main>
        {/* ==================== HERO ==================== */}
        <section className="bk-hero" aria-label="Présentation du projet BAHKANSO">
          <div className="bk-hero-grid">
            <div className="bk-hero-text">
              <div className="bk-badge">
                <span>{heroBadge}</span>
              </div>
              <h1>{heroTitle}</h1>
              <p>{heroSubtitle}</p>
              <div className="bk-hero-actions" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '0.75rem' }}>
                <a href="#projet" className="bk-btn-primary" onClick={goToLogin}>
                  {heroCtaPrimary}
                </a>
                <a href="/login" className="bk-btn-outline" onClick={goToLogin}>
                  {heroCtaSecondary}
                </a>
              </div>
            </div>
            {heroImage ? (
              <div className="bk-hero-image">
                <img src={heroImage} alt={heroAlt} className="bk-hero-img" />
              </div>
            ) : (
              <div className="bk-hero-fallback">
                <p>Aucune image configurée pour le bandeau d’accueil.</p>
              </div>
            )}
          </div>
        </section>

        {/* ==================== LE PROJET ==================== */}
        <section id="projet" className="bk-section bk-section-light">
          <div className="bk-container">
            <div className="bk-head">
              <h2>Notre projet</h2>
              <p>
                Une exploitation agro-pastorale suivie entre le terrain et le
                responsable à distance.
              </p>
            </div>
            <div className="bk-project">
              <div className="bk-project-text">
                <h3>Objectif</h3>
                <p>
                  Centraliser le suivi des financements, des dépenses, des
                  activités d'élevage et de culture, ainsi que des chantiers,
                  afin que chaque acteur dispose d'une information commune et à
                  jour.
                </p>
                <h3>Organisation</h3>
                <p>
                  L'équipe de terrain gère les activités sur place. Le
                  responsable à distance envoie les fonds et suit l'avancement
                  depuis l'espace privé de l'application.
                </p>
                <h3>Ce qui est engagé</h3>
                <p>
                  La gestion des activités (élevage, cultures, aménagements) est
                  déjà opérationnelle dans l'application privée. Les détails
                  financiers restent réservés aux personnes autorisées.
                </p>
              </div>
              <div className="bk-project-card">
                <div className="bk-pc-block">
                  <span className="bk-pc-icon" aria-hidden="true">
                    🏡
                  </span>
                  <div className="bk-pc-body">
                    <h4>Sur le terrain</h4>
                    <p>Gestion des activités et des opérations au quotidien.</p>
                  </div>
                </div>
                <div className="bk-pc-block">
                  <span className="bk-pc-icon" aria-hidden="true">
                    🌍
                  </span>
                  <div className="bk-pc-body">
                    <h4>À distance</h4>
                    <p>Financement et suivi de l'avancement du projet.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== NOS ACTIVITÉS ==================== */}
        <section id="activites" className="bk-section bk-section-dark">
          <div className="bk-container">
            <div className="bk-head">
              <h2>Nos activités</h2>
              <p>
                Ce qui fait vivre le projet, entre élevage, cultures et
                aménagements.
              </p>
            </div>
            <div className="bk-activities-grid">
              <RotatingCard
                flipLabel="Voir le détail — Élevage"
                backLabel="Retour — Élevage"
                front={
                  <div className="bk-flip-card-content bk-flip-face-light">
                    <div className="bk-flip-head">
                      <h3 className="bk-flip-title bk-flip-title-light">Élevage</h3>
                      <span className="bk-flip-status bk-status-encours">En cours</span>
                    </div>
                    <p className="bk-flip-desc bk-flip-desc-light">
                      Suivi du cheptel, alimentation et santé des animaux.
                    </p>
                    <Link to="/app/livestock/animals" className="bk-flip-detail">
                      Voir le détail <ArrowRight size={14} />
                    </Link>
                  </div>
                }
                back={
                  <div className="bk-flip-card-content bk-flip-face-light">
                    <h3 className="bk-flip-back-title bk-flip-back-title-light">Élevage — détail</h3>
                    <p className="bk-flip-back-desc bk-flip-back-desc-light">
                      Registre des animaux et des lots, suivi des naissances,
                      acquisitions, ventes et événements sanitaires. Coûts
                      associés à chaque animal.
                    </p>
                    <div className="bk-flip-back-actions">
                      <Link to="/app/livestock/animals" className="bk-flip-back-link">
                        Consulter le cheptel <ArrowRight size={14} />
                      </Link>
                      <button className="bk-flip-back">
                        <ArrowLeft size={14} /> Retour
                      </button>
                    </div>
                  </div>
                }
              />
              <RotatingCard
                flipLabel="Voir le détail — Cultures"
                backLabel="Retour — Cultures"
                front={
                  <div className="bk-flip-card-content bk-flip-face-light">
                    <div className="bk-flip-head">
                      <h3 className="bk-flip-title bk-flip-title-light">Cultures</h3>
                      <span className="bk-flip-status bk-status-encours">En cours</span>
                    </div>
                    <p className="bk-flip-desc bk-flip-desc-light">
                      Gestion des parcelles, semis et suivi des récoltes.
                    </p>
                    <Link to="/app/agriculture/plots" className="bk-flip-detail">
                      Voir le détail <ArrowRight size={14} />
                    </Link>
                  </div>
                }
                back={
                  <div className="bk-flip-card-content bk-flip-face-light">
                    <h3 className="bk-flip-back-title bk-flip-back-title-light">Cultures — détail</h3>
                    <p className="bk-flip-back-desc bk-flip-back-desc-light">
                      Suivi des parcelles, des campagnes et des récoltes.
                      Opérations culturales et coûts associés par campagne.
                    </p>
                    <div className="bk-flip-back-actions">
                      <Link to="/app/agriculture/plots" className="bk-flip-back-link">
                        Consulter les parcelles <ArrowRight size={14} />
                      </Link>
                      <button className="bk-flip-back">
                        <ArrowLeft size={14} /> Retour
                      </button>
                    </div>
                  </div>
                }
              />
              <RotatingCard
                flipLabel="Voir le détail — Travaux"
                backLabel="Retour — Travaux"
                front={
                  <div className="bk-flip-card-content bk-flip-face-light">
                    <div className="bk-flip-head">
                      <h3 className="bk-flip-title bk-flip-title-light">Travaux</h3>
                      <span className="bk-flip-status bk-status-prevu">Prévu</span>
                    </div>
                    <p className="bk-flip-desc bk-flip-desc-light">
                      Aménagements, infrastructures et chantiers en cours.
                    </p>
                    <Link to="/app/projects" className="bk-flip-detail">
                      Voir le détail <ArrowRight size={14} />
                    </Link>
                  </div>
                }
                back={
                  <div className="bk-flip-card-content bk-flip-face-light">
                    <h3 className="bk-flip-back-title bk-flip-back-title-light">Travaux — détail</h3>
                    <p className="bk-flip-back-desc bk-flip-back-desc-light">
                      Suivi des projets et chantiers, budgétisation, avance des
                      travaux et état d'avancement de chaque étape.
                    </p>
                    <div className="bk-flip-back-actions">
                      <Link to="/app/projects" className="bk-flip-back-link">
                        Consulter les projets <ArrowRight size={14} />
                      </Link>
                      <button className="bk-flip-back">
                        <ArrowLeft size={14} /> Retour
                      </button>
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        </section>

        {/* ==================== NOTRE SUIVI ==================== */}
        <section id="suivi" className="bk-section bk-section-light">
          <div className="bk-container">
            <div className="bk-head">
              <h2>Une organisation claire entre financement et terrain</h2>
              <p>
                Quatre étapes pour garder le suivi fiable et accessible aux
                personnes autorisées.
              </p>
            </div>
            <div className="bk-timeline">
              <div className="bk-timeline-row">
                <div className="bk-timeline-step">
                  <span className="bk-ts-num">1</span>
                  <span className="bk-ts-icon" aria-hidden="true">
                    💰
                  </span>
                  <h4>Réception des fonds</h4>
                  <p>Les financements sont enregistrés dès réception.</p>
                </div>
                <div className="bk-timeline-connector" />
                <div className="bk-timeline-step">
                  <span className="bk-ts-num">2</span>
                  <span className="bk-ts-icon" aria-hidden="true">
                    📋
                  </span>
                  <h4>Affectation aux activités</h4>
                  <p>Chaque dépense est rattachée à un projet précis.</p>
                </div>
                <div className="bk-timeline-connector" />
                <div className="bk-timeline-step">
                  <span className="bk-ts-num">3</span>
                  <span className="bk-ts-icon" aria-hidden="true">
                    📎
                  </span>
                  <h4>Documentation</h4>
                  <p>Les pièces justificatives sont associées aux opérations.</p>
                </div>
                <div className="bk-timeline-connector" />
                <div className="bk-timeline-step">
                  <span className="bk-ts-num">4</span>
                  <span className="bk-ts-icon" aria-hidden="true">
                    🔍
                  </span>
                  <h4>Consultation</h4>
                  <p>
                    Le suivi est accessible dans l'espace privé selon les
                    rôles.
                  </p>
                </div>
              </div>
              <p className="bk-note">
                Les informations détaillées sont réservées aux personnes
                autorisées.
              </p>
            </div>
          </div>
        </section>

        {/* ==================== ACCÈS ET CONTACT ==================== */}
        <section id="contact" className="bk-section bk-section-dark">
          <div className="bk-container">
            <div className="bk-contact">
              <div className="bk-contact-col">
                <div className="bk-contact-card">
                  <div className="bk-contact-head">
                    <span className="bk-ch-icon" aria-hidden="true">
                      🔐
                    </span>
                    <h3>Espace de suivi</h3>
                  </div>
                  <p>
                    Retrouvez les financements, les dépenses et l'avancement du
                    projet.
                  </p>
                  <button className="bk-btn-primary" onClick={goToLogin}>
                    Accéder à l'espace de suivi <ArrowRight size={18} />
                  </button>
                </div>
              </div>
              <div className="bk-contact-col">
                {/* Aucun mécanisme de contact public confirmé dans le dépôt :
                    aucun faux formulaire n'est affiché. Uniquement le bouton
                    d'accès à l'espace de suivi, sur toute la largeur. */}
              </div>
            </div>
          </div>
        </section>

        {/* ==================== PIED DE PAGE ==================== */}
        <footer className="bk-footer">
          <div className="bk-footer-inner">
            <div>
              <a href="/" className="bk-footer-brand" aria-label="Accueil BAHKANSO">
                <Logo
                  icon="Sprout"
                  color="#FFFFFF"
                  bgColor="var(--bk-grass)"
                  size={32}
                  imageUrl={farm?.logo_url ?? null}
                />
                <div className="bk-footer-brand-name">BAHKANSO</div>
              </a>
              <p className="bk-footer-desc">
                Projet agro-pastoral. Suivi partagé entre l'équipe de terrain et
                le responsable à distance.
              </p>
              <ul className="bk-footer-nav">
                <li><a href="#projet">Le projet</a></li>
                <li><a href="#activites">Nos activités</a></li>
                <li><a href="#suivi">Notre suivi</a></li>
                <li><a href="/login">Espace de suivi</a></li>
              </ul>
            </div>
            <div>
              <p className="bk-footer-copy">
                © {new Date().getFullYear()} BAHKANSO — Projet agro-pastoral
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
