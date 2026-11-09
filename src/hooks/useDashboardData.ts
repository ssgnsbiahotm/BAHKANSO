import { useCallback, useEffect, useMemo, useState } from 'react';
import { parsePeriod } from '@/lib/format';
import { useData } from '@/lib/DataContext';
import { useSite } from '@/lib/SiteContext';
import { useDashboardScope } from './useDashboardScope';
import { clientDataSource } from '@/lib/dashboard/dashboard-data-source';
import {
  mapNetResult,
  mapGrossMargin,
  mapYield,
  mapOpenAlerts,
  resolveActiveCampaign,
  type KpiResult,
  type KpiStatus,
} from '@/lib/dashboard/dashboard-mappers';

/**
 * Hook de données du Dashboard v2.
 *
 * Combine le scope (site/periode/campagne), la source de données (event_journal
 * via clientDataSource) et les mappers KPI purs.
 *
 * Chaque KPI retourne { value, unit, status, hint, delta?, href }.
 * Règle : aucune ligne source => no_data (value null), jamais 0 affiché.
 */
export function useDashboardData() {
  const {
    siteId,
    period,
    campaignId,
    setSiteId,
    setPeriod,
    setCampaignId,
    reset,
  } = useDashboardScope();
  const { sites } = useData();
  const { availableSites } = useSite();
  const { campaigns, alerts } = useData();

  // Résolution des farm_ids depuis le scope site.
  // siteId === 'all' => ferme-scopé sur tous les sites chargés (pas de lecture de farms).
  // siteId précis => farm_id de ce site via sites.find(...).farm_id.
  const farmIds = useMemo(() => {
    if (siteId === 'all' || !siteId) {
      return (sites || [])
        .map((s) => s.farm_id)
        .filter((f): f is string => Boolean(f));
    }
    const site = (sites || []).find((s) => s.id === siteId);
    return site && site.farm_id ? [site.farm_id] : [];
  }, [siteId, sites]);

  // Période : 'YYYY-MM' => bornes du mois.
  // Une période mal formée (URL non sanitisée) bascule sur une valeur sûre (no_data) au lieu de propager des dates invalides.
  const parsed = useMemo(() => parsePeriod(period), [period]);
  const periodStart = parsed?.periodStart ?? '';
  const periodEnd = parsed?.periodEnd ?? '';

  // Campagne active du site sélectionné (résolution auto si campaignId null).
  const activeCampaign = useMemo(() => {
    if (siteId === 'all' || !siteId) return null;
    const site = (sites || []).find((s) => s.id === siteId);
    return resolveActiveCampaign(campaigns || [], site ?? null);
  }, [siteId, sites, campaigns]);

  // Données brutes depuis la source (un aller-retour par scope).
  const [raw, setRaw] = useState<{
    entrees: number;
    sorties: number;
    recoltes: Array<{ quantity: number; campaignId: string | null }>;
    alertesOuvertes: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (farmIds.length === 0 || periodStart === '' || periodEnd === '') {
      setRaw({ entrees: 0, sorties: 0, recoltes: [], alertesOuvertes: 0 });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const kpis = await clientDataSource.getKpis(farmIds, periodStart, periodEnd);
      setRaw(kpis);
    } catch (err) {
      setError((err as { message?: string } | null)?.message ?? 'Erreur de chargement');
      setRaw(null);
    } finally {
      setLoading(false);
    }
  }, [farmIds, periodStart, periodEnd]);

  // Recharger quand le scope change.
  useEffect(() => {
    fetchData();
  }, [siteId, period, campaignId, farmIds.length, fetchData]);

  // Mappers KPI.
  const kpiNetResult: KpiResult = useMemo(() => {
    if (!raw) return emptyResult('FCFA', 'Chargement…');
    return mapNetResult(raw);
  }, [raw]);

  const kpiGrossMargin: KpiResult = useMemo(() => {
    if (!raw) return emptyResult('%', 'Chargement…');
    return mapGrossMargin(raw);
  }, [raw]);

  const kpiYield: KpiResult = useMemo(() => {
    if (!raw) return emptyResult('kg/ha', 'Chargement…');
    return mapYield(raw, activeCampaign, siteId);
  }, [raw, activeCampaign, siteId]);

  const kpiOpenAlerts: KpiResult = useMemo(() => {
    return mapOpenAlerts(alerts || []);
  }, [alerts]);

  return {
    // Scope
    siteId,
    period,
    campaignId,
    setSiteId,
    setPeriod,
    setCampaignId,
    reset,
    availableSites,
    // Données
    loading,
    error,
    // KPIs
    kpiNetResult,
    kpiGrossMargin,
    kpiYield,
    kpiOpenAlerts,
  };
}

function emptyResult(unit: string, hint: string): KpiResult {
  return { value: null, unit, status: 'loading' as KpiStatus, hint };
}
