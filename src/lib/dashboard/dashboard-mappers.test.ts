import { describe, it, expect } from 'vitest';
import {
  mapNetResult,
  mapGrossMargin,
  mapYield,
  mapOpenAlerts,
  resolveActiveCampaign,
} from './dashboard-mappers';
import type { KpiRaw } from './dashboard-data-source';
import type { Campaign, Site } from '@/lib/types';

const rawEmpty: KpiRaw = { entrees: 0, sorties: 0, recoltes: [], alertesOuvertes: 0 };
const rawPartial: KpiRaw = { entrees: 100000, sorties: 40000, recoltes: [{ quantity: 1200, campaignId: 'camp-1' }], alertesOuvertes: 0 };
const rawRich: KpiRaw = { entrees: 500000, sorties: 200000, recoltes: [{ quantity: 3000, campaignId: 'camp-1' }, { quantity: 2000, campaignId: 'camp-1' }], alertesOuvertes: 0 };

describe('mapNetResult', () => {
  it('retourne no_data quand aucune ligne', () => {
    const r = mapNetResult(rawEmpty);
    expect(r.status).toBe('no_data');
    expect(r.value).toBeNull();
  });

  it('calcule entrees - sorties en FCFA', () => {
    const r = mapNetResult(rawPartial);
    expect(r.status).toBe('ok');
    expect(r.value).toBe(60000);
    expect(r.unit).toBe('FCFA');
  });
});

describe('mapGrossMargin', () => {
  it('retourne no_data quand pas de recettes', () => {
    const r = mapGrossMargin({ ...rawEmpty, entrees: 0, sorties: 50000 });
    expect(r.status).toBe('no_data');
    expect(r.value).toBeNull();
  });

  it('calcule (entrees - sorties) / entrees en %', () => {
    const r = mapGrossMargin(rawPartial);
    expect(r.status).toBe('ok');
    expect(r.value).toBeCloseTo(60, 1);
    expect(r.unit).toBe('%');
  });
});

describe('mapYield', () => {
  const campaign: Campaign = {
    id: 'camp-1',
    year: 2026,
    plot_id: 'plot-1',
    crop_name: 'Maïs',
    start_date: '2026-01-01',
    expected_harvest_date: '2026-06-01',
    harvest_cycle: 'annuel',
    budget: 100000,
    responsible: 'resp',
    status: 'en cours',
    site_id: 'site-1',
    plot: { id: 'plot-1', reference: 'REF-001', name: 'Parcelle A', site_id: 'site-1', area_hectares: 2, location: null, soil_type: null, status: 'actif', current_crop: 'Maïs' },
  };

  it('retourne no_data en vue multi-sites (siteId = all)', () => {
    const r = mapYield(rawRich, campaign, 'all');
    expect(r.status).toBe('no_data');
    expect(r.value).toBeNull();
  });

  it('retourne no_data sans campagne active', () => {
    const r = mapYield(rawRich, null, 'site-1');
    expect(r.status).toBe('no_data');
    expect(r.value).toBeNull();
  });

  it('retourne no_data sans récolte', () => {
    const r = mapYield(rawEmpty, campaign, 'site-1');
    expect(r.status).toBe('no_data');
    expect(r.value).toBeNull();
  });

  it('calcule kg/ha avec surface de parcelle', () => {
    const r = mapYield(rawRich, campaign, 'site-1');
    expect(r.status).toBe('ok');
    expect(r.value).toBeCloseTo(2500, 0); // 5000 kg / 2 ha
    expect(r.unit).toBe('kg/ha');
  });

  it('retourne no_data quand surface inconnue', () => {
    const noPlot: Campaign = { ...campaign, plot: null };
    const r = mapYield(rawRich, noPlot, 'site-1');
    expect(r.status).toBe('no_data');
    expect(r.value).toBeNull();
  });
});

describe('mapOpenAlerts', () => {
  it('retourne 0 et status ok sans alerte ouverte', () => {
    const r = mapOpenAlerts([
      { id: 'a1', status: 'cloturee', severity: 'high' },
    ]);
    expect(r.status).toBe('ok');
    expect(r.value).toBe(0);
  });

  it('compte les alertes ouvertes en status warn', () => {
    const r = mapOpenAlerts([
      { id: 'a1', status: 'ouverte', severity: 'high' },
      { id: 'a2', status: 'ouverte', severity: 'medium' },
    ]);
    expect(r.status).toBe('warn');
    expect(r.value).toBe(2);
  });
});

describe('resolveActiveCampaign', () => {
  const site: Site = { id: 'site-1', name: 'Site A', location: null, area_hectares: null, responsible: null, farm_id: 'farm-1', code: null, status: 'actif' };

  it('retourne null sans campagne', () => {
    const r = resolveActiveCampaign([], site);
    expect(r).toBeNull();
  });

  it('préfère la campagne en cours, sinon la plus récente', () => {
    const campaigns: Campaign[] = [
      { id: 'c1', year: 2025, plot_id: null, crop_name: 'Riz', start_date: null, expected_harvest_date: null, harvest_cycle: null, budget: 0, responsible: null, status: 'terminé', site_id: 'site-1' },
      { id: 'c2', year: 2026, plot_id: null, crop_name: 'Maïs', start_date: null, expected_harvest_date: null, harvest_cycle: null, budget: 0, responsible: null, status: 'en cours', site_id: 'site-1' },
      { id: 'c3', year: 2024, plot_id: null, crop_name: 'Manioc', start_date: null, expected_harvest_date: null, harvest_cycle: null, budget: 0, responsible: null, status: 'annulé', site_id: 'site-1' },
    ];
    const r = resolveActiveCampaign(campaigns, site);
    expect(r?.id).toBe('c2');
  });

  it('filtre par site_id', () => {
    const campaigns: Campaign[] = [
      { id: 'c1', year: 2026, plot_id: null, crop_name: 'Maïs', start_date: null, expected_harvest_date: null, harvest_cycle: null, budget: 0, responsible: null, status: 'en cours', site_id: 'site-2' },
    ];
    const r = resolveActiveCampaign(campaigns, site);
    expect(r).toBeNull();
  });
});
