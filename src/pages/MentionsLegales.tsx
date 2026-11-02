import { Link } from 'react-router-dom';

export function MentionsLegales() {
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
              <h1 className="text-2xl font-bold text-primary mb-2">Mentions légales</h1>
              <p className="text-secondary">Éditeur du site : Soma Souleymane — BAHKANSO.</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Éditeur</h3>
              <p className="text-muted">
                Soma Souleymane, particulier, éditeur et responsable de la publication.
                Localisation : Sikensi, Côte d’Ivoire.
                Adresse postale complète : à renseigner avant publication.
              </p>
              <h3 className="text-lg font-semibold text-primary mt-4">Hébergement</h3>
              <p className="text-muted">
                Le site bahkanso.surge.sh est publié au moyen du service Surge (surge.sh).
                L’identité juridique et l’adresse de l’hébergeur restent à renseigner.
                L’application utilise également Supabase pour des services
                de données et d’authentification.
              </p>
              <h3 className="text-lg font-semibold text-primary mt-4">Objet du service</h3>
              <p className="text-muted">
                Bahkanso permet de présenter le projet agro-pastoral et de
                suivre les opérations enregistrées dans son espace de gestion.
                Une dépense saisie ou un justificatif déposé ne constitue pas,
                à lui seul, une certification de son authenticité ou une
                vérification indépendante de sa réalisation sur le terrain.
              </p>
              <h3 className="text-lg font-semibold text-primary mt-4">Contenus et utilisation</h3>
              <p className="text-muted">
                Les contenus du site appartiennent à leurs titulaires respectifs.
                Leur réutilisation doit respecter les droits applicables.
                Les utilisateurs doivent uniquement transmettre des documents
                qu’ils sont autorisés à utiliser et respecter les permissions
                de leur compte.
              </p>
              <h3 className="text-lg font-semibold text-primary mt-4">Disponibilité et informations</h3>
              <p className="text-muted">
                Le service peut être interrompu pour maintenance, incident
                technique ou difficulté de connexion. Les informations affichées
                dépendent des données enregistrées et de leur mise à jour.
                Les décisions importantes nécessitent des vérifications auprès
                des responsables et des documents de terrain.
                Ces indications n’excluent pas les responsabilités qui ne
                peuvent être écartées en vertu du droit applicable.
              </p>
              <p className="text-muted">
                Consultez également la{' '}
                <Link to="/confidentialite" className="underline underline-offset-4">
                  politique de confidentialité
                </Link>.
              </p>
              <h3 className="text-lg font-semibold text-primary mt-4">Contact</h3>
              <p className="text-muted">
                Pour toute question :
                {' '}<a href="mailto:ssgnabia@gmail.com" className="underline">ssgnabia@gmail.com</a>.
                Téléphone :
                {' '}<a href="tel:+2250707381563" className="underline">+225 07 07 38 15 63</a>.
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
