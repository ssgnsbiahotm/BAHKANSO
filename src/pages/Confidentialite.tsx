import { Link } from 'react-router-dom';

export function Confidentialite() {
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
              <h1>Confidentialité</h1>
              <p>Vos données, notre engagement.</p>
            </div>
            <div className="bk-project-text">
              <h3>Données collectées</h3>
              <p>
                La page d'accueil publique ne collecte aucune donnée personnelle.
                Les informations affichées proviennent du contenu éditorial du
                projet (site_content) et ne concernent pas les utilisateurs.
              </p>
              <h3>Espace de gestion</h3>
              <p>
                L'espace de gestion privé (/app) est réservé aux personnes
                authentifiées. Il contient les données opérationnelles de
                l'exploitation (financements, activités, suivi). L'accès est
                protégé par authentification et contrôlé par rôles.
              </p>
              <h3>Contact</h3>
              <p>
                Pour exercer vos droits ou poser une question sur la
                confidentialité, contactez le responsable du projet depuis
                l'espace de gestion.
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
