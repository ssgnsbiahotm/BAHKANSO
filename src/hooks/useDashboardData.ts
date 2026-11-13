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
import type { TrendPoint } from '@/lib/dashboard/dashboard-data-source';

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
  const { sites, sourceStatus } = useData();
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
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);

  const fetchData = useCallback(async () => {
    // Sites pas encore chargés (idle, loading, undefined au mount, ou en erreur) =>
    // état loading, jamais de 0 ni de no_data prématuré.
    if (sourceStatus.sites !== 'success' && sourceStatus.sites !== 'error') {
      setRaw(null);
      setTrendData([]);
      setLoading(true);
      setTrendLoading(true);
      return;
    }
    // Sites chargés mais aucun farm_id résolu => aucune donnée, pas d'erreur de chargement.
    if (farmIds.length === 0 || periodStart === '' || periodEnd === '') {
      if (farmIds.length === 0 && periodStart !== '' && periodEnd !== '') {
        setRaw(null); // no_data : sites chargés, aucune ferme résolue
      } else {
        setRaw({ entrees: 0, sorties: 0, recoltes: [], alertesOuvertes: 0 }); // période invalide : comportement historique
      }
      setTrendData([]);
      setLoading(false);
      setTrendLoading(false);
      return;
    }
    setLoading(true);
    setTrendLoading(true);
    setError(null);
    try {
      const [kpis, trend] = await Promise.all([
        clientDataSource.getKpis(farmIds, periodStart, periodEnd),
        clientDataSource.getTrend(farmIds, 6),
      ]);
      setRaw(kpis);
      setTrendData(trend);
    } catch (err) {
      setError((err as { message?: string } | null)?.message ?? 'Erreur de chargement');
      setRaw(null);
      setTrendData([]);
    } finally {
      setLoading(false);
      setTrendLoading(false);
    }
  }, [farmIds, periodStart, periodEnd, sourceStatus.sites]);

  // Recharger quand le scope change.
  useEffect(() => {
    fetchData();
  }, [siteId, period, campaignId, farmIds.length, fetchData]);

  // Mappers KPI.
  // raw === null + loading === true => chargement en cours (sites pas encore chargés).
  // raw === null + loading === false => no_data (sites chargés, aucune ferme résolue).
  const kpiNetResult: KpiResult = useMemo(() => {
    if (!raw) return loading ? emptyResult('FCFA', 'Chargement…') : noDataResult('FCFA');
    return mapNetResult(raw);
  }, [raw, loading]);

  const kpiGrossMargin: KpiResult = useMemo(() => {
    if (!raw) return loading ? emptyResult('%', 'Chargement…') : noDataResult('%');
    return mapGrossMargin(raw);
  }, [raw, loading]);

  const kpiYield: KpiResult = useMemo(() => {
    if (!raw) return loading ? emptyResult('kg/ha', 'Chargement…') : noDataResult('kg/ha');
    return mapYield(raw, activeCampaign, siteId);
  }, [raw, loading, activeCampaign, siteId]);

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
    trendData,
    trendLoading,
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

function noDataResult(unit: string): KpiResult {
  return { value: null, unit, status: 'no_data' as KpiStatus, hint: 'Aucune donnée sur la période sélectionnée.' };
}
