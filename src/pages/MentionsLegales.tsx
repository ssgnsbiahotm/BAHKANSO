import { Link } from 'react-router-dom';

export function MentionsLegales() {
  return (
    <div className="bk-page min-h-screen flex flex-col" lang="fr">
      <header className="bk-nav">
        <div className="bk-nav-inner">
          <Link to="/" className="bk-brand" aria-label="Accueil BAHKANSO">
            <div className="bk-brand-name">BAHKANSO</div>
          </Link>
          <a href="/" className="bk-cta">Retour à l'accueil</a>
        </div>
      </header>
      <main className="flex-1">
        <section className="bk-section bk-section-light">
          <div className="bk-container">
            <div className="bk-head">
              <h1>Mentions légales</h1>
              <p>Éditeur du site : BAHKANSO — Projet agro-pastoral.</p>
            </div>
            <div className="bk-project-text">
              <h3>Éditeur</h3>
              <p>
                BAHKANSO — Exploitation agro-pastorale, région du Bélier,
                Département de Dimbokro, Côte d'Ivoire.
              </p>
              <h3>Hébergement</h3>
              <p>
                Ce site est hébergé sur une plateforme de déploiement statique
                (Vite / Vercel-like). Aucune donnée personnelle n'est collectée
                sur cette page publique.
              </p>
              <h3>Contact</h3>
              <p>
                Pour toute question, utilisez la page de contact ou l'espace de
                gestion accessible depuis l'accueil.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="bk-footer">
        <div className="bk-footer-inner">
          <div>
            <Link to="/" className="bk-footer-brand" aria-label="Accueil BAHKANSO">
              <div className="bk-footer-brand-name">BAHKANSO</div>
            </Link>
            <p className="bk-footer-desc">
              Projet agro-pastoral. Suivi partagé entre l'équipe de terrain et
              le responsable à distance.
            </p>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <p className="bk-footer-copy">
              © {new Date().getFullYear()} BAHKANSO — Projet agro-pastoral
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
