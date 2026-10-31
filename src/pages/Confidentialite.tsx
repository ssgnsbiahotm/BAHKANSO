import { Link } from 'react-router-dom';

export function Confidentialite() {
  return (
    <div className="min-h-screen flex flex-col bg-page text-primary" lang="fr">
      <header className="sticky top-0 z-20 bg-surface border-b border-default px-4 lg:px-6 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2" aria-label="Accueil BAHKANSO">
            <div className="font-bold text-lg text-primary">BAHKANSO</div>
          </Link>
          <a href="/" className="text-sm text-accent-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary" aria-label="Retour à l'accueil">
            Retour à l'accueil
          </a>
        </div>
      </header>
      <main className="flex-1">
        <section className="px-4 lg:px-6 py-8 max-w-3xl mx-auto">
          <div className="bg-surface border border-default rounded-xl p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-primary mb-2">Confidentialité</h1>
              <p className="text-secondary">Vos données, notre engagement.</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Données collectées</h3>
              <p className="text-muted">
                La page d'accueil publique ne collecte aucune donnée personnelle.
                Les informations affichées proviennent du contenu éditorial du
                projet (site_content) et ne concernent pas les utilisateurs.
              </p>
              <h3 className="text-lg font-semibold text-primary mt-4">Espace de gestion</h3>
              <p className="text-muted">
                L'espace de gestion privé (/app) est réservé aux personnes authentifiées. Il contient les données opérationnelles de l'exploitation (financements, activités, suivi). L'accès est protégé par authentification et contrôlé par rôles.
              </p>
              <h3 className="text-lg font-semibold text-primary mt-4">Contact</h3>
              <p className="text-muted">
                Pour exercer vos droits ou poser une question sur la confidentialité, contactez le responsable du projet depuis l'espace de gestion.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-surface border-t border-default px-4 lg:px-6 py-6 mt-auto">
        <div className="max-w-3xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-4">
          <div>
            <Link to="/" className="flex items-center gap-2" aria-label="Accueil BAHKANSO">
              <div className="font-bold text-lg text-primary">BAHKANSO</div>
            </Link>
            <p className="text-sm text-muted mt-1">Projet agro-pastoral. Suivi partagé entre l'équipe de terrain et le responsable à distance.</p>
          </div>
          <p className="text-xs text-muted">© {new Date().getFullYear()} BAHKANSO — Projet agro-pastoral</p>
        </div>
      </footer>
    </div>
  );
}
