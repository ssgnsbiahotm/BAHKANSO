import { test, beforeAll, afterAll } from 'vitest';
import { expect } from 'vitest';
import { adminClient, signInAs, authedClient } from './setup.mjs';
import { setupFixtures, teardownFixtures } from './fixtures.mjs';

let fx;

beforeAll(async () => {
  fx = await setupFixtures();

  // event_journal.farm_id référence public.farms(id). Il faut donc une ferme
  // liée au site pour pouvoir filtrer le journal par farm_id.
  const { data: farm, error: farmErr } = await adminClient
    .from('farms')
    .insert({ name: 'Farm Test Journal' })
    .select()
    .single();
  if (farmErr) throw farmErr;

  // Lier le site à cette ferme
  const { error: siteErr } = await adminClient
    .from('sites')
    .update({ farm_id: farm.id })
    .eq('id', fx.site.id);
  if (siteErr) throw siteErr;

  fx.farm = farm;
});

afterAll(async () => {
  // Nettoyer le journal d'événements pour cette ferme
  if (fx?.farm) {
    await adminClient.from('event_journal').delete().eq('farm_id', fx.farm.id);
  }
  await teardownFixtures(fx);
});

test('le journal doit être alimenté après création d\'une dépense', async () => {
  const token = await signInAs('admin-helpers@test.local', 'Test1234!');
  const client = await authedClient(token);

  // 1. Créer une dépense (référence unique pour éviter les conflits entre runs parallèles)
  const reference = `DEP-JOURNAL-${Date.now()}`;
  const { error: expErr, data: expense } = await client.from('expenses').insert({
    reference,
    date: new Date().toISOString().split('T')[0],
    amount: 1000,
    currency: 'XOF',
    status: 'brouillon',
    site_id: fx.site.id,
    created_by: fx.admin.appUser.id
  }).select().single();
  expect(expErr).toBeNull();

  // 2. Vérifier que le journal est alimenté par le trigger
  const { data: journal, error: jErr } = await adminClient
    .from('event_journal')
    .select('*')
    .eq('farm_id', fx.farm.id);

  expect(jErr).toBeNull();

  const depenseEvents = journal.filter((e) => e.event_type === 'depense');
  expect(depenseEvents.length).toBeGreaterThanOrEqual(1);
  expect(depenseEvents[0].entity_type).toBe('expense');
  expect(depenseEvents[0].source_module).toBe('finance');
});

test('la récolte alimente le journal après création', async () => {
  const { data: harvest, error: hErr } = await adminClient
    .from('harvests')
    .insert({
      site_id: fx.site.id,
      date: new Date().toISOString().split('T')[0],
      quantity: 500,
      unit: 'kg'
    })
    .select()
    .single();
  expect(hErr).toBeNull();

  const { data: journal, error: jErr } = await adminClient
    .from('event_journal')
    .select('*')
    .eq('farm_id', fx.farm.id);

  expect(jErr).toBeNull();

  const recolteEvents = journal.filter((e) => e.event_type === 'recolte');
  expect(recolteEvents.length).toBeGreaterThanOrEqual(1);
  expect(recolteEvents[0].entity_type).toBe('harvest');
  expect(recolteEvents[0].entity_id).toBe(harvest.id);
  expect(recolteEvents[0].source_module).toBe('culture');
  expect(recolteEvents[0].quantity).toBe(500);
});

test('la vente alimente le journal après création', async () => {
  const { data: sale, error: sErr } = await adminClient
    .from('sales')
    .insert({
      site_id: fx.site.id,
      date: new Date().toISOString().split('T')[0],
      total_amount: 2500,
      status: 'payée',
      created_by: fx.admin.appUser.id
    })
    .select()
    .single();
  expect(sErr).toBeNull();

  const { data: journal, error: jErr } = await adminClient
    .from('event_journal')
    .select('*')
    .eq('farm_id', fx.farm.id);

  expect(jErr).toBeNull();

  const recetteEvents = journal.filter((e) => e.event_type === 'recette');
  expect(recetteEvents.length).toBeGreaterThanOrEqual(1);
  expect(recetteEvents[0].entity_type).toBe('sale');
  expect(recetteEvents[0].entity_id).toBe(sale.id);
  expect(recetteEvents[0].source_module).toBe('finance');
  expect(recetteEvents[0].amount).toBe(2500);
});

afterAll(async () => {
  // Nettoyer le journal pour cette ferme
  if (fx?.farm) {
    await adminClient.from('event_journal').delete().eq('farm_id', fx.farm.id);
  }
  await teardownFixtures(fx);
});
