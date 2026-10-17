import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, Lock, Landmark } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { Logo } from '@/components/ui/Logo';
import { RotatingCard } from '@/components/ui/RotatingCard';

import './LandingPage.css';

export function LandingPage() {
  const navigate = useNavigate();
  const { farm } = useData();
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

  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

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
          <div className="bk-hero-content">
            <div className="bk-badge">
              <span aria-hidden="true">🌿</span>
              Projet agro-pastoral · Côte d'Ivoire
            </div>
            <h1>Un projet agricole, suivi de près.</h1>
            <p>
              BAHKANSO rassemble les informations de notre exploitation pour que
              l'équipe de terrain et le responsable à distance travaillent avec
              les mêmes données.
            </p>
            <div className="bk-hero-actions">
              <a href="#projet" className="bk-btn-primary" onClick={goToLogin}>
                Découvrir le projet <ArrowRight size={18} />
              </a>
              <a href="/login" className="bk-btn-outline" onClick={goToLogin}>
                Espace de suivi <ArrowRight size={18} />
              </a>
            </div>
            <div className="bk-trust">
              <div className="bk-trust-item">
                <Check size={14} aria-hidden="true" />
                <span>
                  <b>Dépenses documentées</b> — chaque opération peut être associée à ses justificatifs.
                </span>
              </div>
              <div className="bk-trust-item">
                <Lock size={14} aria-hidden="true" />
                <span>
                  <b>Accès sécurisé par rôle</b> — les informations détaillées sont réservées aux personnes autorisées.
                </span>
              </div>
              <div className="bk-trust-item">
                <Landmark size={14} aria-hidden="true" />
                <span>
                  <b>Suivi partagé</b> — financements, activités et avancée consultés par tous les acteurs du projet.
                </span>
              </div>
            </div>
          </div>

          <div className="bk-hero-visual">
            <div className="bk-visual-box">
              <span className="bk-illu" aria-hidden="true">
                🌾🐓🏗️
              </span>
              <span>Illustration — votre photo de terrain ici</span>
            </div>
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
                  <div className="bk-flip-card-content">
                    <div className="bk-flip-head">
                      <span className="bk-flip-icon" aria-hidden="true">
                        🐓
                      </span>
                      <h3 className="bk-flip-title">Élevage</h3>
                      <span className="bk-flip-status bk-status-encours">En cours</span>
                    </div>
                    <p className="bk-flip-desc">
                      Suivi du cheptel, alimentation et santé des animaux.
                    </p>
                    <a href="/livestock/animals" className="bk-flip-detail" onClick={stop}>
                      Voir le détail <ArrowRight size={14} />
                    </a>
                  </div>
                }
                back={
                  <div className="bk-flip-card-content">
                    <h3 className="bk-flip-back-title">Élevage — détail</h3>
                    <p className="bk-flip-back-desc">
                      Registre des animaux et des lots, suivi des naissances,
                      acquisitions, ventes et événements sanitaires. Coûts
                      associés à chaque animal.
                    </p>
                    <div className="bk-flip-back-actions">
                      <a href="/livestock/animals" className="bk-flip-back-link" onClick={stop}>
                        Consulter le cheptel <ArrowRight size={14} />
                      </a>
                      <button className="bk-flip-back" onClick={stop}>
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
                  <div className="bk-flip-card-content">
                    <div className="bk-flip-head">
                      <span className="bk-flip-icon" aria-hidden="true">
                        🌾
                      </span>
                      <h3 className="bk-flip-title">Cultures</h3>
                      <span className="bk-flip-status bk-status-encours">En cours</span>
                    </div>
                    <p className="bk-flip-desc">
                      Gestion des parcelles, semis et suivi des récoltes.
                    </p>
                    <a href="/agriculture/plots" className="bk-flip-detail" onClick={stop}>
                      Voir le détail <ArrowRight size={14} />
                    </a>
                  </div>
                }
                back={
                  <div className="bk-flip-card-content">
                    <h3 className="bk-flip-back-title">Cultures — détail</h3>
                    <p className="bk-flip-back-desc">
                      Suivi des parcelles, des campagnes et des récoltes.
                      Opérations culturales et coûts associés par campagne.
                    </p>
                    <div className="bk-flip-back-actions">
                      <a href="/agriculture/plots" className="bk-flip-back-link" onClick={stop}>
                        Consulter les parcelles <ArrowRight size={14} />
                      </a>
                      <button className="bk-flip-back" onClick={stop}>
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
                  <div className="bk-flip-card-content">
                    <div className="bk-flip-head">
                      <span className="bk-flip-icon" aria-hidden="true">
                        🏗️
                      </span>
                      <h3 className="bk-flip-title">Travaux</h3>
                      <span className="bk-flip-status bk-status-prevu">Prévu</span>
                    </div>
                    <p className="bk-flip-desc">
                      Aménagements, infrastructures et chantiers en cours.
                    </p>
                    <a href="/projects" className="bk-flip-detail" onClick={stop}>
                      Voir le détail <ArrowRight size={14} />
                    </a>
                  </div>
                }
                back={
                  <div className="bk-flip-card-content">
                    <h3 className="bk-flip-back-title">Travaux — détail</h3>
                    <p className="bk-flip-back-desc">
                      Suivi des projets et chantiers, budgétisation, avance des
                      travaux et état d'avancement de chaque étape.
                    </p>
                    <div className="bk-flip-back-actions">
                      <a href="/projects" className="bk-flip-back-link" onClick={stop}>
                        Consulter les projets <ArrowRight size={14} />
                      </a>
                      <button className="bk-flip-back" onClick={stop}>
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
