import { test, beforeAll, afterAll } from 'vitest';
import { expect } from 'vitest';
import { adminClient } from './setup.mjs';
import { setupFixtures, teardownFixtures } from './fixtures.mjs';
import {
  calculateGrossMargin,
  calculateCostPerUnit,
} from '../../src/lib/kpi.ts';

let fx;
let farmId;

beforeAll(async () => {
  fx = await setupFixtures();

  // Créer une ferme liée au site de test pour pouvoir filtrer le journal par farm_id
  const { data: farm, error: farmErr } = await adminClient
    .from('farms')
    .insert({ name: 'Farm Test Finance' })
    .select()
    .single();
  if (farmErr) throw farmErr;

  const { error: siteErr } = await adminClient
    .from('sites')
    .update({ farm_id: farm.id })
    .eq('id', fx.site.id);
  if (siteErr) throw siteErr;

  farmId = farm.id;
});

beforeEach(async () => {
  // Chaque test part d'un journal propre pour cette ferme (évite les fuites entre tests)
  if (farmId) {
    await adminClient.from('event_journal').delete().eq('farm_id', farmId);
  }
});

afterAll(async () => {
  // Nettoyer le journal d'événements pour cette ferme
  if (farmId) {
    await adminClient.from('event_journal').delete().eq('farm_id', farmId);
  }
  await teardownFixtures(fx);
});

test('calculateGrossMargin retourne recettes moins dépenses', async () => {
  const today = new Date().toISOString().split('T')[0];

  // 2 recettes et 1 dépense pour la ferme de test
  await adminClient.from('event_journal').insert([
    {
      farm_id: farmId,
      event_type: 'recette',
      entity_type: 'sale',
      entity_id: '00000000-0000-0000-0000-000000000001',
      amount: 1000,
      currency: 'XOF',
      source_module: 'finance',
      occurred_at: today,
    },
    {
      farm_id: farmId,
      event_type: 'recette',
      entity_type: 'sale',
      entity_id: '00000000-0000-0000-0000-000000000002',
      amount: 2000,
      currency: 'XOF',
      source_module: 'finance',
      occurred_at: today,
    },
    {
      farm_id: farmId,
      event_type: 'depense',
      entity_type: 'expense',
      entity_id: '00000000-0000-0000-0000-000000000003',
      amount: 500,
      currency: 'XOF',
      source_module: 'finance',
      occurred_at: today,
    },
  ]);

  const margin = await calculateGrossMargin(farmId, undefined, undefined, adminClient);
  expect(margin).toBe(2500); // 1000 + 2000 - 500
});

test('calculateGrossMargin filtre par intervalle de dates', async () => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .split('T')[0];

  // Une dépense hier et une recette aujourd'hui
  await adminClient.from('event_journal').insert([
    {
      farm_id: farmId,
      event_type: 'depense',
      entity_type: 'expense',
      entity_id: '00000000-0000-0000-0000-000000000010',
      amount: 300,
      currency: 'XOF',
      source_module: 'finance',
      occurred_at: yesterday,
    },
    {
      farm_id: farmId,
      event_type: 'recette',
      entity_type: 'sale',
      entity_id: '00000000-0000-0000-0000-000000000011',
      amount: 800,
      currency: 'XOF',
      source_module: 'finance',
      occurred_at: today,
    },
  ]);

  // Uniquement aujourd'hui : 800 - 0 = 800
  const marginToday = await calculateGrossMargin(farmId, today, today, adminClient);
  expect(marginToday).toBe(800);

  // Uniquement hier : 0 - 300 = -300
  const marginYesterday = await calculateGrossMargin(farmId, yesterday, yesterday, adminClient);
  expect(marginYesterday).toBe(-300);
});

test('calculateCostPerUnit retourne dépenses divisé par quantité produite', async () => {
  const today = new Date().toISOString().split('T')[0];
  const campaignId = '00000000-0000-0000-0000-000000000050';

  // 1000 de dépenses et 50 kg de récoltes pour la campagne
  await adminClient.from('event_journal').insert([
    {
      farm_id: farmId,
      event_type: 'depense',
      entity_type: 'expense',
      entity_id: '00000000-0000-0000-0000-000000000020',
      amount: 1000,
      currency: 'XOF',
      source_module: 'finance',
      context: { campaign_id: campaignId },
      occurred_at: today,
    },
    {
      farm_id: farmId,
      event_type: 'recolte',
      entity_type: 'harvest',
      entity_id: '00000000-0000-0000-0000-000000000021',
      quantity: 50,
      unit: 'kg',
      currency: 'XOF',
      source_module: 'culture',
      context: { campaign_id: campaignId },
      occurred_at: today,
    },
  ]);

  const cost = await calculateCostPerUnit(farmId, campaignId, adminClient);
  expect(cost).toBe(20); // 1000 / 50
});

test('calculateCostPerUnit retourne null quand aucune quantité produite', async () => {
  const today = new Date().toISOString().split('T')[0];
  const campaignId = '00000000-0000-0000-0000-000000000060';

  // Des dépenses mais pas de récoltes
  const { data: insData, error: insErr } = await adminClient
    .from('event_journal')
    .insert({
      farm_id: farmId,
      event_type: 'depense',
      entity_type: 'expense',
      entity_id: '00000000-0000-0000-0000-000000000030',
      amount: 500,
      currency: 'XOF',
      source_module: 'finance',
      context: { campaign_id: campaignId },
      occurred_at: today,
    })
    .select();

  const cost = await calculateCostPerUnit(farmId, campaignId, adminClient);
  expect(cost).toBeNull();
});

test('calculateCostPerUnit ignore les événements d\'autres fermes', async () => {
  const today = new Date().toISOString().split('T')[0];

  // Propres recettes/dépenses pour farmId
  await adminClient.from('event_journal').insert([
    {
      farm_id: farmId,
      event_type: 'recette',
      entity_type: 'sale',
      entity_id: '00000000-0000-0000-0000-000000000041',
      amount: 2000,
      currency: 'XOF',
      source_module: 'finance',
      occurred_at: today,
    },
    {
      farm_id: farmId,
      event_type: 'depense',
      entity_type: 'expense',
      entity_id: '00000000-0000-0000-0000-000000000042',
      amount: 500,
      currency: 'XOF',
      source_module: 'finance',
      occurred_at: today,
    },
  ]);

  // Une dépense pour une autre ferme (doit être ignorée)
  const { data: otherFarm } = await adminClient
    .from('farms')
    .insert({ name: 'Farm Autre' })
    .select()
    .single();

  await adminClient.from('event_journal').insert([
    {
      farm_id: otherFarm.id,
      event_type: 'depense',
      entity_type: 'expense',
      entity_id: '00000000-0000-0000-0000-000000000040',
      amount: 9999,
      currency: 'XOF',
      source_module: 'finance',
      occurred_at: today,
    },
  ]);

  const margin = await calculateGrossMargin(farmId, undefined, undefined, adminClient);
  expect(margin).toBe(1500); // 2000 - 500, l'autre ferme ignorée

  await adminClient.from('farms').delete().eq('id', otherFarm.id);
});
