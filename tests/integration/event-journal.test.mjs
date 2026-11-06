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

test.fails('le journal doit être alimenté après création d\'une dépense', async () => {
  const token = await signInAs('admin-helpers@test.local', 'Test1234!');
  const client = await authedClient(token);

  // 1. Créer une dépense
  const { error: expErr } = await client.from('expenses').insert({
    reference: 'DEP-JOURNAL-TEST',
    date: new Date().toISOString().split('T')[0],
    amount: 1000,
    currency: 'XOF',
    status: 'brouillon',
    site_id: fx.site.id,
    created_by: fx.admin.appUser.id
  });
  expect(expErr).toBeNull();

  // 2. Vérifier que le journal est alimenté (ce qui va échouer : pas de trigger encore)
  const { data: journal, error: jErr } = await adminClient
    .from('event_journal')
    .select('*')
    .eq('farm_id', fx.farm.id);

  expect(jErr).toBeNull();

  // On s'attend à avoir 1 événement 'depense' — ÉCHEC attendu (journal vide)
  expect(journal.length).toBe(1);
  expect(journal[0].event_type).toBe('depense');
  expect(journal[0].source_module).toBe('finance');
  expect(journal[0].amount).toBe(1000);
});
