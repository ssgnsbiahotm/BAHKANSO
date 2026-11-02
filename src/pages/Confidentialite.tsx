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
                La consultation du site et l’utilisation de ses services peuvent
                entraîner le traitement de données techniques de connexion.
                Dans l’espace de gestion, les données peuvent comprendre
                l’identité et les coordonnées des utilisateurs, leur rôle,
                ainsi que les informations personnelles présentes dans les
                opérations et justificatifs enregistrés.
                L’inventaire des données techniques traitées par les
                prestataires reste à compléter.
              </p>
              <h3 className="text-lg font-semibold text-primary mt-4">Espace de gestion</h3>
              <p className="text-muted">
                L’espace de gestion est destiné aux utilisateurs autorisés.
                Les informations servent à administrer les comptes et à
                suivre les activités de l’exploitation.
                Les données accessibles doivent correspondre aux
                autorisations de chaque utilisateur.
                La présence d’une connexion et de rôles ne constitue
                pas, à elle seule, une certification de sécurité.
              </p>
              <section id="cookies" aria-labelledby="cookies-titre" className="space-y-3 mt-6">
                <h2 id="cookies-titre" className="text-lg font-semibold text-primary">
                  Cookies et stockage local
                </h2>
                <p className="text-muted">
                  Cette rubrique décrit les mécanismes identifiés dans le
                  code examiné. L’inventaire des stockages et des services
                  tiers reste à confirmer par une vérification du site
                  dans le navigateur.
                </p>
                <h3 className="font-semibold text-primary">Site sélectionné</h3>
                <p className="text-muted">
                  La plateforme utilise le stockage local du navigateur
                  sous la clé bahkanso.currentSiteId pour mémoriser
                  le site d’exploitation sélectionné.
                  Le code examiné ne prévoit pas de durée d’expiration
                  automatique pour cette valeur.
                </p>
                <h3 className="font-semibold text-primary">Session de connexion</h3>
                <p className="text-muted">
                  Le client Supabase est configuré pour conserver la session
                  de connexion. Le mécanisme de stockage et les durées
                  effectives de session restent à préciser après vérification.
                  Sur un appareil partagé, utilisez la fonction de déconnexion
                  après votre utilisation.
                </p>
                <h3 className="font-semibold text-primary">Cache de l’application</h3>
                <p className="text-muted">
                  La configuration PWA prévoit un cache de ressources et
                  une règle de cache pour certaines requêtes vers Supabase,
                  avec une durée maximale configurée de 24 heures.
                  Cela ne signifie pas que toutes les données sont conservées
                  ni que toutes les fonctions sont disponibles hors connexion.
                  Le contenu réellement mis en cache et son effacement
                  à la déconnexion restent à vérifier.
                </p>
                <h3 className="font-semibold text-primary">Mesure d’audience et publicité</h3>
                <p className="text-muted">
                  La recherche effectuée dans les fichiers examinés n’a pas
                  identifié les outils de mesure d’audience ou de publicité
                  recherchés. Ce constat ne garantit pas l’absence de tout
                  traceur ou de toute requête vers un service tiers.
                </p>
                <h3 className="font-semibold text-primary">Gestion des données du navigateur</h3>
                <p className="text-muted">
                  Vous pouvez utiliser les réglages de votre navigateur pour
                  supprimer les données du site. Selon les éléments supprimés,
                  cette action peut effacer des préférences ou interrompre
                  votre session. Elle ne constitue pas une demande de suppression
                  des données conservées sur les serveurs.
                </p>
              </section>
              <section id="securite" aria-labelledby="securite-titre" className="space-y-3 mt-6">
                <h2 id="securite-titre" className="text-lg font-semibold text-primary">
                  Sécurité et utilisation des comptes
                </h2>
                <p className="text-muted">
                  Les consignes suivantes concernent l’utilisation de
                  l’espace de gestion. Elles ne constituent pas une
                  certification des protections techniques de la plateforme.
                </p>
                <h3 className="font-semibold text-primary">Compte personnel</h3>
                <p className="text-muted">
                  Ne partagez pas vos identifiants. Respectez les autorisations
                  attribuées à votre compte et ne tentez pas de consulter
                  ou de modifier des informations qui ne vous sont pas destinées.
                  Sur un appareil partagé, déconnectez-vous après utilisation.
                </p>
                <h3 className="font-semibold text-primary">Documents et justificatifs</h3>
                <p className="text-muted">
                  Transmettez uniquement les documents nécessaires au suivi
                  des opérations et que vous êtes autorisé à utiliser.
                  Évitez les informations personnelles sans rapport avec
                  l’opération. Un document déposé ne devient pas pour autant
                  authentifié ou validé.
                </p>
                <h3 className="font-semibold text-primary">Signaler un problème</h3>
                <p className="text-muted">
                  En cas de perte d’un appareil connecté, d’accès suspect
                  ou de découverte d’un problème de sécurité, contactez
                  le responsable à{' '}
                  <a href="mailto:ssgnabia@gmail.com" className="underline underline-offset-4">
                    ssgnabia@gmail.com
                  </a>.
                  Précisez la date, la page concernée et les faits observés,
                  sans transmettre de mot de passe, de code de connexion
                  ou de données personnelles inutiles.
                </p>
                <p className="text-muted">
                  N’exploitez pas un problème pour consulter, copier,
                  modifier ou supprimer les données d’autrui.
                  Si une capture est nécessaire au signalement,
                  masquez les informations sensibles.
                </p>
              </section>
              <h3 className="text-lg font-semibold text-primary mt-4">Contact</h3>
              <p className="text-muted">
                Pour toute question concernant vos données ou pour adresser une
                demande d’accès, de rectification ou de suppression,
                contactez Soma Souleymane :
                {' '}<a href="mailto:ssgnabia@gmail.com" className="underline">
                  ssgnabia@gmail.com
                </a>.
                La demande sera examinée selon les règles applicables.
                Ne transmettez pas de mot de passe ou de code de connexion.
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
