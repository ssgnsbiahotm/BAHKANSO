import { test, beforeAll, afterAll } from 'vitest';
import { expect } from 'vitest';
import { adminClient } from './setup.mjs';
import { setupFixtures, teardownFixtures } from './fixtures.mjs';
import { calculateYield } from '../../src/lib/kpi.ts';

let fx;

beforeAll(async () => {
  fx = await setupFixtures();

  // event_journal.farm_id référence public.farms(id).
  const { data: farm, error: farmErr } = await adminClient
    .from('farms')
    .insert({ name: 'Farm Test KPI' })
    .select()
    .single();
  if (farmErr) throw farmErr;

  const { error: siteErr } = await adminClient
    .from('sites')
    .update({ farm_id: farm.id })
    .eq('id', fx.site.id);
  if (siteErr) throw siteErr;

  fx.farm = farm;
});

afterAll(async () => {
  if (fx?.farm) {
    await adminClient.from('event_journal').delete().eq('farm_id', fx.farm.id);
  }
  await teardownFixtures(fx);
});

test('calculateYield retourne le rendement d\'une campagne (kg/ha)', async () => {
  // 1. Créer une parcelle liée au site de test
  const { data: plot, error: plotErr } = await adminClient
    .from('plots')
    .insert({
      name: 'Parcelle Test KPI',
      site_id: fx.site.id,
      area_hectares: 10,
      status: 'actif'
    })
    .select()
    .single();
  expect(plotErr).toBeNull();

  // 2. Créer une campagne liée à la parcelle
  const { data: campaign, error: campErr } = await adminClient
    .from('campaigns')
    .insert({
      year: 2026,
      plot_id: plot.id,
      crop_name: 'Maïs',
      status: 'planifié'
    })
    .select()
    .single();
  expect(campErr).toBeNull();

  // 3. Créer une récolte liée à la campagne.
  // Le trigger trg_log_harvest alimente event_journal avec context.campaign_id.
  const { data: harvest, error: harvestErr } = await adminClient
    .from('harvests')
    .insert({
      campaign_id: campaign.id,
      plot_id: plot.id,
      date: new Date().toISOString().split('T')[0],
      quantity: 5000,
      unit: 'kg'
    })
    .select()
    .single();
  expect(harvestErr).toBeNull();

  // 4. Le rendement attendu : 5000 kg / 10 ha = 500 kg/ha
  const yieldValue = await calculateYield(campaign.id, adminClient);
  expect(yieldValue).toBe(500);
});

test('calculateYield retourne null quand la campagne n\'existe pas', async () => {
  const yieldValue = await calculateYield(
    '00000000-0000-0000-0000-000000000000',
    adminClient
  );
  expect(yieldValue).toBeNull();
});

test('calculateYield retourne null quand la parcelle n\'a pas de surface', async () => {
  // Créer une parcelle sans surface valide et une campagne liée
  const { data: plot, error: plotErr } = await adminClient
    .from('plots')
    .insert({
      name: 'Parcelle Sans Surface',
      site_id: fx.site.id,
      area_hectares: 0,
      status: 'actif'
    })
    .select()
    .single();
  expect(plotErr).toBeNull();

  const { data: campaign, error: campErr } = await adminClient
    .from('campaigns')
    .insert({
      year: 2026,
      plot_id: plot.id,
      crop_name: 'Blé',
      status: 'planifié'
    })
    .select()
    .single();
  expect(campErr).toBeNull();

  const yieldValue = await calculateYield(campaign.id, adminClient);
  expect(yieldValue).toBeNull();
});
