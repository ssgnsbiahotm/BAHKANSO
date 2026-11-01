import { useLocation, useNavigate, Link } from 'react-router-dom';

// Libellés affichés dans le fil d'Ariane, cohérents avec la Sidebar et les onglets.
const ROUTE_LABELS: Record<string, string> = {
  '/app/dashboard': 'Tableau de bord',
  '/app/exploitation': 'Exploitation',
  '/app/exploitation/parcelles': 'Parcelles',
  '/app/exploitation/campagnes': 'Campagnes',
  '/app/exploitation/operations': 'Opérations',
  '/app/exploitation/recoltes': 'Récoltes',
  '/app/elevage': 'Élevage',
  '/app/elevage/lots': 'Lots',
  '/app/elevage/animaux': 'Animaux',
  '/app/elevage/evenements': 'Événements',
  '/app/finance': 'Gestion financière',
  '/app/surveillance': 'Surveillance',
  '/app/configuration': 'Configuration',
  '/app/users': 'Utilisateurs',
  '/app/configuration/bailleurs': 'Bailleurs',
  '/app/configuration/clients': 'Clients',
  '/app/configuration/sites': 'Sites',
  '/app/media': 'Médiathèque',
  '/app/profile': 'Mon profil',
};

// Segments de route parents cliquables pour chaque destination.
const ROUTE_PARENTS: Record<string, string[]> = {
  '/app/exploitation/parcelles': ['/app/exploitation'],
  '/app/exploitation/campagnes': ['/app/exploitation'],
  '/app/exploitation/operations': ['/app/exploitation'],
  '/app/exploitation/recoltes': ['/app/exploitation'],
  '/app/elevage/lots': ['/app/elevage'],
  '/app/elevage/animaux': ['/app/elevage'],
  '/app/elevage/evenements': ['/app/elevage'],
  '/app/configuration/bailleurs': ['/app/configuration'],
  '/app/configuration/clients': ['/app/configuration'],
  '/app/configuration/sites': ['/app/configuration'],
};

export function Breadcrumb() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  // Aucun breadcrumb sur les routes de l'application mère ni sur les publiques.
  if (!pathname.startsWith('/app/')) {
    return null;
  }

  // Construit la liste des segments du fil d'Ariane, du plus général au plus précis.
  const segments: { label: string; route: string; isCurrent: boolean }[] = [];
  segments.push({ label: 'Tableau de bord', route: '/app/dashboard', isCurrent: false });

  const parents = ROUTE_PARENTS[pathname] || [];
  for (const parent of parents) {
    segments.push({ label: ROUTE_LABELS[parent] || parent, route: parent, isCurrent: false });
  }

  const currentLabel = ROUTE_LABELS[pathname] || pathname;
  segments.push({ label: currentLabel, route: pathname, isCurrent: true });

  // Un seul segment (ex: /app/dashboard seul) n'a pas besoin de fil d'Ariane.
  if (segments.length <= 1) {
    return null;
  }

  return (
    <nav className="px-4 py-2 text-xs text-primary/60 hidden sm:flex" aria-label="Fil d'Ariane">
      <ol className="flex flex-wrap items-center gap-1 text-primary/60">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          return (
            <li key={segment.route} className="flex items-center gap-1">
              {index > 0 && (
                <span className="text-primary/40">›</span>
              )}
              {isLast || !segment.route ? (
                <span className="text-primary font-medium">{segment.label}</span>
              ) : (
                <Link
                  to={segment.route}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(segment.route + location.search);
                  }}
                  className="text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
                >
                  {segment.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
