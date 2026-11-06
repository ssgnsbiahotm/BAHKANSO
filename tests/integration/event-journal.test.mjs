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

  expect(journal.length).toBe(1);
  expect(journal[0].event_type).toBe('depense');
  expect(journal[0].entity_type).toBe('expense');
  expect(journal[0].entity_id).toBe(expense.id);
  expect(journal[0].source_module).toBe('finance');
  expect(journal[0].amount).toBe(1000);
});

afterAll(async () => {
  // Nettoyer la dépense de test et le journal pour cette ferme
  if (fx?.farm) {
    await adminClient.from('event_journal').delete().eq('farm_id', fx.farm.id);
  }
  await teardownFixtures(fx);
});
