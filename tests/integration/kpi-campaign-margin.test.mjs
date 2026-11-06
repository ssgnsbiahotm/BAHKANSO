import { test, beforeAll, afterAll } from 'vitest';
import { expect } from 'vitest';
import { adminClient } from './setup.mjs';
import { setupFixtures, teardownFixtures } from './fixtures.mjs';
import { calculateCampaignMargin } from '../../src/lib/kpi.ts';

let fx;
let farmId;
let siteId;
let campaignId;

beforeAll(async () => {
  fx = await setupFixtures();
  siteId = fx.site.id;

  // Créer une ferme liée au site de test
  const { data: farm, error: farmErr } = await adminClient
    .from('farms')
    .insert({ name: 'Farm Test Campaign Margin' })
    .select()
    .single();
  if (farmErr) throw farmErr;

  // Lier le site à cette ferme
  const { error: siteErr } = await adminClient
    .from('sites')
    .update({ farm_id: farm.id })
    .eq('id', siteId);
  if (siteErr) throw siteErr;

  farmId = farm.id;

  // Créer une campagne liée à cette ferme
  const { data: campaign, error: campErr } = await adminClient
    .from('campaigns')
    .insert({ name: 'Campagne Test Marge', farm_id: farmId })
    .select()
    .single();
  if (campErr) throw campErr;

  campaignId = campaign.id;
});

beforeEach(async () => {
  // Chaque test part d'une base propre pour cette campagne
  if (campaignId) {
    await adminClient
      .from('crop_operations')
      .delete()
      .eq('campaign_id', campaignId);
    await adminClient.from('harvests').delete().eq('campaign_id', campaignId);
  }
});

afterAll(async () => {
  if (campaignId) {
    await adminClient
      .from('crop_operations')
      .delete()
      .eq('campaign_id', campaignId);
    await adminClient.from('harvests').delete().eq('campaign_id', campaignId);
  }
  await teardownFixtures(fx);
});

test('calculateCampaignMargin retourne recettes moins depenses', async () => {
  // 2 recoltes : 1500 + 2500 = 4000 de recettes
  await adminClient.from('harvests').insert([
    { campaign_id: campaignId, revenue: 1500, quantity: 100 },
    { campaign_id: campaignId, revenue: 2500, quantity: 150 },
  ]);

  // 2 operations culturales : (300 + 100) + (200 + 50) = 650 de depenses
  await adminClient.from('crop_operations').insert([
    { campaign_id: campaignId, cost: 300, labor_cost: 100 },
    { campaign_id: campaignId, cost: 200, labor_cost: 50 },
  ]);

  const margin = await calculateCampaignMargin(campaignId, adminClient);
  expect(margin).toBe(3350); // 4000 - 650 = 3350
});

test('calculateCampaignMargin retourne 0 sans aucune donnee', async () => {
  const margin = await calculateCampaignMargin(campaignId, adminClient);
  expect(margin).toBe(0);
});

test('calculateCampaignMargin ignore les donnees dune autre campagne', async () => {
  // Creer une autre campagne avec ses propres donnees
  const { data: otherCamp } = await adminClient
    .from('campaigns')
    .insert({ name: 'Autre Campagne', farm_id: farmId })
    .select()
    .single();

  await adminClient.from('harvests').insert([
    { campaign_id: otherCamp.id, revenue: 9999, quantity: 10 },
  ]);
  await adminClient.from('crop_operations').insert([
    { campaign_id: otherCamp.id, cost: 100, labor_cost: 10 },
  ]);

  // La campagne de test reste a 0
  const margin = await calculateCampaignMargin(campaignId, adminClient);
  expect(margin).toBe(0);

  // Nettoyer lautre campagne
  await adminClient.from('harvests').delete().eq('campaign_id', otherCamp.id);
  await adminClient
    .from('crop_operations')
    .delete()
    .eq('campaign_id', otherCamp.id);
  await adminClient.from('campaigns').delete().eq('id', otherCamp.id);
});

test('calculateCampaignMargin avec seulement des recettes', async () => {
  await adminClient.from('harvests').insert([
    { campaign_id: campaignId, revenue: 5000, quantity: 200 },
  ]);

  const margin = await calculateCampaignMargin(campaignId, adminClient);
  expect(margin).toBe(5000);
});
