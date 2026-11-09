import { useState, useCallback, useEffect } from 'react';
import { useSite } from '@/lib/SiteContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

export type DashboardSiteScope = string | 'all'; // siteId ou 'all'

export interface DashboardScope {
  siteId: DashboardSiteScope;
  period: string; // 'YYYY-MM'
  campaignId: string | null; // null = auto (résolu par l'appelant)
  setSiteId: (id: DashboardSiteScope) => void;
  setPeriod: (period: string) => void;
  setCampaignId: (id: string | null) => void;
  reset: () => void;
}

/**
 * Contexte global du Dashboard v2 : site + période + campagne,
 * synchronisé avec l'URL (?site=&periode=&campagne=) et le navigateur.
 *
 * Défauts : site = sélection du header (useSite), période = mois courant,
 * campagne = auto (null, résolu côté appelant via la campagne active du site).
 */
export function useDashboardScope(): DashboardScope {
  const { currentSiteId, setCurrentSiteId } = useSite();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [siteId, setSiteIdState] = useState<DashboardSiteScope>(
    searchParams.get('site') || currentSiteId || 'all'
  );
  const [period, setPeriodState] = useState<string>(
    searchParams.get('periode') || defaultPeriod()
  );
  const [campaignId, setCampaignIdState] = useState<string | null>(
    searchParams.get('campagne') || null
  );

  // Synchroniser l'URL à chaque changement de scope.
  const syncUrl = useCallback(
    (nextSiteId: DashboardSiteScope, nextPeriod: string, nextCampaignId: string | null) => {
      const params = new URLSearchParams();
      if (nextSiteId !== 'all' && nextSiteId) params.set('site', nextSiteId);
      params.set('periode', nextPeriod);
      if (nextCampaignId) params.set('campagne', nextCampaignId);
      setSearchParams(params, { replace: true });
      navigate(`?${params.toString()}`);
    },
    [setSearchParams, navigate]
  );

  const setSiteId = useCallback(
    (id: DashboardSiteScope) => {
      setSiteIdState(id);
      if (id === 'all' || !id) {
        setCurrentSiteId(null);
      } else {
        setCurrentSiteId(id);
      }
      syncUrl(id, period, campaignId);
    },
    [period, campaignId, setCurrentSiteId, syncUrl]
  );

  const setPeriod = useCallback(
    (nextPeriod: string) => {
      setPeriodState(nextPeriod);
      syncUrl(siteId, nextPeriod, campaignId);
    },
    [siteId, campaignId, syncUrl]
  );

  const setCampaignId = useCallback(
    (nextCampaignId: string | null) => {
      setCampaignIdState(nextCampaignId);
      syncUrl(siteId, period, nextCampaignId);
    },
    [siteId, period, syncUrl]
  );

  const reset = useCallback(() => {
    setSiteIdState(currentSiteId || 'all');
    setPeriodState(defaultPeriod());
    setCampaignIdState(null);
    setCurrentSiteId(currentSiteId || null);
    syncUrl(currentSiteId || 'all', defaultPeriod(), null);
  }, [currentSiteId, setCurrentSiteId, syncUrl]);

  // Initialiser depuis l'URL / le site du header au mount.
  useEffect(() => {
    const urlSite = searchParams.get('site');
    const urlPeriod = searchParams.get('periode');
    const urlCampagne = searchParams.get('campagne');

    if (urlSite !== null || urlPeriod !== null || urlCampagne !== null) {
      setSiteIdState(urlSite || currentSiteId || 'all');
      setPeriodState(urlPeriod || defaultPeriod());
      setCampaignIdState(urlCampagne || null);
      if (urlSite === '' || urlSite === null) {
        setCurrentSiteId(null);
      } else if (urlSite) {
        setCurrentSiteId(urlSite);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { siteId, period, campaignId, setSiteId, setPeriod, setCampaignId, reset };
}

function defaultPeriod(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
