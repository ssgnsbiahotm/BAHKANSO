import { useSite } from '@/lib/SiteContext';

export function SiteSelector() {
  const { currentSiteId, setCurrentSiteId, availableSites, isGlobalView } = useSite();

  if (availableSites.length <= 1 && !isGlobalView) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="site-select" className="sr-only">
        Filtrer par site
      </label>
      <select
        id="site-select"
        value={currentSiteId || ''}
        onChange={(e) => setCurrentSiteId(e.target.value || null)}
        className="h-8 px-2 text-sm bg-surface border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent   "
        aria-label="Filtrer par site"
      >
        <option value="">Tous les sites</option>
        {availableSites.map((site) => (
          <option key={site.id} value={site.id}>
            {site.code ? `${site.code} — ` : ''}{site.name}
          </option>
        ))}
      </select>
      {isGlobalView && currentSiteId && (
        <button
          onClick={() => setCurrentSiteId(null)}
          className="h-8 px-2 text-xs text-muted hover:text-secondary  "
          aria-label="Voir tous les sites"
        >
          ×
        </button>
      )}
    </div>
  );
}