import { test, beforeAll, afterAll } from 'vitest';
import { expect } from 'vitest';
import { adminClient } from './setup.mjs';
import { setupFixtures, teardownFixtures } from './fixtures.mjs';
import {
  calculateMortalityRate,
  calculateAverageDailyGain,
} from '../../src/lib/kpi.ts';

let fx;
let farmId;
let siteId;

beforeAll(async () => {
  fx = await setupFixtures();
  siteId = fx.site.id;

  // Créer une ferme liée au site de test
  const { data: farm, error: farmErr } = await adminClient
    .from('farms')
    .insert({ name: 'Farm Test Livestock' })
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
});

beforeEach(async () => {
  // Chaque test part d'un journal propre pour cette ferme
  if (farmId) {
    await adminClient.from('event_journal').delete().eq('farm_id', farmId);
  }
});

afterAll(async () => {
  if (farmId) {
    await adminClient.from('event_journal').delete().eq('farm_id', farmId);
  }
  await teardownFixtures(fx);
});

function genId() {
  return (
    '00000000-0000-0000-0000-' +
    Math.floor(Math.random() * 1e12)
      .toString()
      .padStart(12, '0')
  );
}

test('calculateMortalityRate retourne le taux de mortalité', async () => {
  const today = new Date().toISOString().split('T')[0];

  // 3 naissances et 1 mort pour la ferme
  await adminClient.from('event_journal').insert([
    {
      farm_id: farmId,
      event_type: 'naissance',
      entity_type: 'animal',
      entity_id: genId(),
      amount: 0,
      currency: 'XOF',
      source_module: 'elevage',
      occurred_at: today,
      context: { description: 'Naissance veau 1' },
    },
    {
      farm_id: farmId,
      event_type: 'naissance',
      entity_type: 'animal',
      entity_id: genId(),
      amount: 0,
      currency: 'XOF',
      source_module: 'elevage',
      occurred_at: today,
      context: { description: 'Naissance veau 2' },
    },
    {
      farm_id: farmId,
      event_type: 'naissance',
      entity_type: 'animal',
      entity_id: genId(),
      amount: 0,
      currency: 'XOF',
      source_module: 'elevage',
      occurred_at: today,
      context: { description: 'Naissance veau 3' },
    },
    {
      farm_id: farmId,
      event_type: 'mort',
      entity_type: 'animal',
      entity_id: genId(),
      amount: 0,
      currency: 'XOF',
      source_module: 'elevage',
      occurred_at: today,
      context: { description: 'Mortalite veau 4' },
    },
  ]);

  const rate = await calculateMortalityRate(
    farmId,
    undefined,
    undefined,
    adminClient
  );
  expect(rate).toBe(25); // 1 mort / (3 naissances + 1 mort) * 100 = 25
});

test('calculateMortalityRate filtre par intervalle de dates', async () => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .split('T')[0];

  // Une naissance et une mort hier
  await adminClient.from('event_journal').insert([
    {
      farm_id: farmId,
      event_type: 'naissance',
      entity_type: 'animal',
      entity_id: genId(),
      amount: 0,
      currency: 'XOF',
      source_module: 'elevage',
      occurred_at: yesterday,
      context: { description: 'Naissance hier' },
    },
    {
      farm_id: farmId,
      event_type: 'mort',
      entity_type: 'animal',
      entity_id: genId(),
      amount: 0,
      currency: 'XOF',
      source_module: 'elevage',
      occurred_at: yesterday,
      context: { description: 'Mort hier' },
    },
    // Une naissance aujourd'hui
    {
      farm_id: farmId,
      event_type: 'naissance',
      entity_type: 'animal',
      entity_id: genId(),
      amount: 0,
      currency: 'XOF',
      source_module: 'elevage',
      occurred_at: today,
      context: { description: 'Naissance aujourd hui' },
    },
  ]);

  // Uniquement aujourd'hui : 0 naissance + 0 mort = 0
  const rateToday = await calculateMortalityRate(
    farmId,
    today,
    today,
    adminClient
  );
  expect(rateToday).toBe(0);

  // Uniquement hier : 1 mort / (1 naissance + 1 mort) * 100 = 50
  const rateYesterday = await calculateMortalityRate(
    farmId,
    yesterday,
    yesterday,
    adminClient
  );
  expect(rateYesterday).toBe(50);
});

test('calculateMortalityRate retourne 0 sans evenement', async () => {
  const rate = await calculateMortalityRate(
    farmId,
    undefined,
    undefined,
    adminClient
  );
  expect(rate).toBe(0);
});

test('calculateAverageDailyGain retourne le GMQ dun animal', async () => {
  // Créer un animal lié au site avec poids et date de naissance
  const birthDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]; // il y a 1 an

  const { data: animal, error: animalErr } = await adminClient
    .from('animals')
    .insert({
      identifier: 'BOV-TEST-ADG-' + Math.floor(Math.random() * 1e9),
      species: 'bovin',
      breed: "N'dama",
      sex: 'M',
      birth_date: birthDate,
      weight_kg: 365,
      site_id: siteId,
      status: 'actif',
    })
    .select()
    .single();
  if (animalErr) throw animalErr;

  const gmq = await calculateAverageDailyGain(farmId, undefined, adminClient);
  // 365 kg / 365 jours = 1 kg/jour (approximatif selon le jour exact)
  expect(gmq).toBeGreaterThan(0);
  expect(gmq).toBeLessThan(2);

  // Nettoyer
  await adminClient.from('animals').delete().eq('id', animal.id);
});

test('calculateAverageDailyGain retourne null sans animal', async () => {
  const gmq = await calculateAverageDailyGain(
    farmId,
    undefined,
    adminClient
  );
  expect(gmq).toBeNull();
});

test('calculateAverageDailyGain filtre par animal specifique', async () => {
  const birthDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]; // il y a 6 mois

  const { data: animal, error: animalErr } = await adminClient
    .from('animals')
    .insert({
      identifier:
        'BOV-TEST-ADG2-' + Math.floor(Math.random() * 1e9),
      species: 'bovin',
      breed: "N'dama",
      sex: 'F',
      birth_date: birthDate,
      weight_kg: 180,
      site_id: siteId,
      status: 'actif',
    })
    .select()
    .single();
  if (animalErr) throw animalErr;

  // Un autre animal sans poids (doit être ignoré)
  await adminClient.from('animals').insert({
    identifier: 'BOV-TEST-ADG3-' + Math.floor(Math.random() * 1e9),
    species: 'bovin',
    breed: "N'dama",
    sex: 'M',
    birth_date: birthDate,
    weight_kg: null,
    site_id: siteId,
    status: 'actif',
  });

  const gmq = await calculateAverageDailyGain(farmId, animal.id, adminClient);
  expect(gmq).toBeGreaterThan(0);

  // Nettoyer
  await adminClient.from('animals').delete().eq('id', animal.id);
});
