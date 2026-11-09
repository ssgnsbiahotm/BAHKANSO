import type { Campaign, Site } from '@/lib/types';
import type { KpiRaw } from './dashboard-data-source';

/**
 * État explicite d'un KPI héros.
 *
 * Règle absolue : aucune ligne source => null (no_data), jamais 0 affiché.
 * Seuils warn/crit non définis (défaut : tout en ok / no_data, à valider par le
 * responsable). Documenté dans docs/kpi-definitions.md.
 */
export type KpiStatus = 'idle' | 'loading' | 'no_data' | 'ok' | 'warn' | 'crit';

export interface KpiResult {
  value: number | null;
  unit: string;
  status: KpiStatus;
  hint: string;
  delta?: { value: number; label: string };
}

/**
 * Résultat net = entrees - sorties (FCFA).
 * Aucune ligne => no_data.
 */
export function mapNetResult(raw: KpiRaw): KpiResult {
  const hasLines = raw.entrees !== 0 || raw.sorties !== 0;
  if (!hasLines) {
    return {
      value: null,
      unit: 'FCFA',
      status: 'no_data',
      hint: 'Aucune recette ni dépense sur la période sélectionnée.',
    };
  }
  const value = raw.entrees - raw.sorties;
  return {
    value,
    unit: 'FCFA',
    status: 'ok',
    hint: `${formatSigned(value)} FCFA sur la période.`,
    delta: undefined,
  };
}

/**
 * Marge brute = (entrees - sorties) / entrees (pourcentage).
 * entrees = 0 ou aucune ligne => no_data (jamais 0.0% affiché à tort).
 */
export function mapGrossMargin(raw: KpiRaw): KpiResult {
  if (raw.entrees <= 0) {
    return {
      value: null,
      unit: '%',
      status: 'no_data',
      hint: 'Aucune recette sur la période : marge brute non calculable.',
    };
  }
  const value = ((raw.entrees - raw.sorties) / raw.entrees) * 100;
  return {
    value,
    unit: '%',
    status: 'ok',
    hint: `${value.toFixed(0)} % de marge brute sur la période.`,
    delta: undefined,
  };
}

/**
 * Rendement = Σ quantites recoltes / surface campagne active (kg/ha).
 * no_data si : site "Tous les sites", pas de campagne active, pas de recolte.
 */
export function mapYield(
  raw: KpiRaw,
  campaign: Campaign | null,
  siteId: string | 'all'
): KpiResult {
  if (siteId === 'all') {
    return {
      value: null,
      unit: 'kg/ha',
      status: 'no_data',
      hint: 'Rendement non applicable en vue multi-sites.',
    };
  }
  if (!campaign) {
    return {
      value: null,
      unit: 'kg/ha',
      status: 'no_data',
      hint: "Aucune campagne active sur ce site : rendement non calculable.",
    };
  }
  const totalQty = raw.recoltes.reduce((sum, r) => sum + r.quantity, 0);
  if (totalQty <= 0) {
    return {
      value: null,
      unit: 'kg/ha',
      status: 'no_data',
      hint: "Aucune récolte enregistrée sur la période pour cette campagne.",
    };
  }
  const surface = campaign.plot?.area_hectares ?? null;
  if (!surface || surface <= 0) {
    return {
      value: null,
      unit: 'kg/ha',
      status: 'no_data',
      hint: 'Surface de la parcelle inconnue : rendement non calculable.',
    };
  }
  const value = totalQty / surface;
  return {
    value,
    unit: 'kg/ha',
    status: 'ok',
    hint: `${value.toFixed(0)} kg/ha pour la campagne "${campaign.crop_name}".`,
    delta: undefined,
  };
}

/**
 * Alertes ouvertes = alertes du site avec status === 'ouverte'.
 * Même prédicat que la cloche / la Sidebar (garde-fou B).
 */
export function mapOpenAlerts(
  alerts: { id: string; status: string; severity: string }[]
): KpiResult {
  const ouvertes = alerts.filter((a) => a.status === 'ouverte');
  if (ouvertes.length === 0) {
    return {
      value: 0,
      unit: 'alerte',
      status: 'ok',
      hint: 'Aucune alerte ouverte sur ce site.',
    };
  }
  return {
    value: ouvertes.length,
    unit: 'alerte',
    status: 'warn',
    hint: `${ouvertes.length} alerte${ouvertes.length > 1 ? 's' : ''} ouverte${ouvertes.length > 1 ? 's' : ''} à traiter.`,
  };
}

function formatSigned(v: number): string {
  return v >= 0 ? `+${v}` : `${v}`;
}

/**
 * Résout la campagne active d'un site : status === 'en cours', sinon la plus
 * récente par year desc. Plusieurs actives => la plus récente.
 */
export function resolveActiveCampaign(
  campaigns: Campaign[],
  site: Site | null
): Campaign | null {
  const siteCampaigns = site
    ? campaigns.filter((c) => c.site_id === site.id)
    : campaigns;
  if (siteCampaigns.length === 0) return null;
  const enCours = siteCampaigns.filter((c) => c.status === 'en cours');
  const pool = enCours.length > 0 ? enCours : siteCampaigns;
  return pool.sort((a, b) => b.year - a.year)[0] ?? null;
}
