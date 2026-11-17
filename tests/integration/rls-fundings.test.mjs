import { test, beforeAll, afterAll } from 'vitest';
import { expect } from 'vitest';
import { adminClient, signInAs, authedClient } from './setup.mjs';
import { setupFixtures, teardownFixtures } from './fixtures.mjs';

let fx;
let siteB;

beforeAll(async () => {
  fx = await setupFixtures();

  // Créer un second site pour tester le blocage cross-site
  const { data: sb, error: sbErr } = await adminClient
    .from('sites')
    .insert({ name: 'Test Site B' })
    .select()
    .single();
  if (sbErr) throw sbErr;
  siteB = sb;

  // Créer 1 funding sur le site du financeur (visible par lui)
  await adminClient.from('fundings').insert({
    funder_id: fx.funder.id,
    amount_sent: 1000,
    currency_sent: 'XOF',
    date_sent: new Date().toISOString().split('T')[0],
    status: 'recu',
    site_id: fx.site.id
  });
});

afterAll(async () => {
  await adminClient.from('fundings').delete().eq('site_id', fx.site.id);
  await adminClient.from('fundings').delete().eq('site_id', siteB.id);
  if (siteB) {
    await adminClient.from('sites').delete().eq('id', siteB.id);
  }
  await teardownFixtures(fx);
});

test('financeur ne voit que son funding', async () => {
  const token = await signInAs(fx.financeur.appUser.email, 'Test1234!');
  const client = await authedClient(token);
  const { data, error } = await client
    .from('fundings')
    .select('*')
    .eq('site_id', fx.site.id);
  expect(error).toBeNull();
  expect(data.length).toBe(1);
  expect(data[0].funder_id).toBe(fx.funder.id);
});

test('financeur ne peut pas écrire sur un autre site (cross-site bloqué)', async () => {
  const token = await signInAs(fx.financeur.appUser.email, 'Test1234!');
  const client = await authedClient(token);
  const { data, error } = await client.from('fundings').insert({
    funder_id: fx.funder.id,
    amount_sent: 500,
    currency_sent: 'XOF',
    date_sent: new Date().toISOString().split('T')[0],
    status: 'recu',
    site_id: siteB.id  // autre site : doit être bloqué par RLS
  });
  // RLS filtre/blocke l'écriture : 0 ligne insérée, pas d'erreur 42501 nécessaire
  expect(data).toBeNull();
  // Le funding n'a pas été persistant (vérifié via admin qui contourne RLS)
  const { data: persisted } = await adminClient
    .from('fundings')
    .select('id')
    .eq('site_id', siteB.id);
  expect(persisted).toHaveLength(0);
});
