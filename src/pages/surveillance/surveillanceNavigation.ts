export const SURVEILLANCE_TABS = ['alertes', 'evenements', 'historique'] as const;

export type SurveillanceTab = (typeof SURVEILLANCE_TABS)[number];

export function getSurveillanceTab(search: string): SurveillanceTab {
  const tab = new URLSearchParams(search).get('tab');
  return SURVEILLANCE_TABS.includes(tab as SurveillanceTab)
    ? (tab as SurveillanceTab)
    : 'alertes';
}

export function isSurveillanceRouteActive(pathname: string, search: string, route: string): boolean {
  const [routePath, routeQuery] = route.split('?');
  if (pathname !== routePath && !pathname.startsWith(`${routePath}/`)) return false;

  const expectedTab = new URLSearchParams(routeQuery || '').get('tab');
  if (!expectedTab) return true;

  return getSurveillanceTab(search) === expectedTab;
}
