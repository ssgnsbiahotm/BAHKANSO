import { test, beforeAll, afterAll } from 'vitest';
import { expect } from 'vitest';
import { adminClient, signInAs, authedClient } from './setup.mjs';
import { setupFixtures, teardownFixtures } from './fixtures.mjs';

let fx;
let otherFunder;

beforeAll(async () => {
  fx = await setupFixtures();

  // Créer un second funder (pas celui du financeur)
  const { data: of, error: ofErr } = await adminClient
    .from('funders')
    .insert({ name: 'Autre Funder' })
    .select()
    .single();
  if (ofErr) throw ofErr;
  otherFunder = of;

  // Créer 2 fundings :
  // - 1 pour le funder du financeur (visible par lui)
  // - 1 pour l'autre funder (invisible par le financeur)
  await adminClient.from('fundings').insert([
    {
      funder_id: fx.funder.id,
      amount_sent: 1000,
      currency_sent: 'XOF',
      date_sent: new Date().toISOString().split('T')[0],
      status: 'recu',
      site_id: fx.site.id
    },
    {
      funder_id: otherFunder.id,
      amount_sent: 2000,
      currency_sent: 'XOF',
      date_sent: new Date().toISOString().split('T')[0],
      status: 'recu',
      site_id: fx.site.id
    }
  ]);
});

afterAll(async () => {
  await adminClient.from('fundings').delete().eq('site_id', fx.site.id);
  if (otherFunder) {
    await adminClient.from('funders').delete().eq('id', otherFunder.id);
  }
  await teardownFixtures(fx);
});

test('financeur ne voit que son funding', async () => {
  const token = await signInAs('fin-helpers@test.local', 'Test1234!');
  const client = await authedClient(token);
  const { data, error } = await client
    .from('fundings')
    .select('*')
    .eq('site_id', fx.site.id);
  expect(error).toBeNull();
  expect(data.length).toBe(1);
  expect(data[0].funder_id).toBe(fx.funder.id);
});

test('financeur ne peut pas écrire sur un autre funder', async () => {
  const token = await signInAs('fin-helpers@test.local', 'Test1234!');
  const client = await authedClient(token);
  const { error } = await client.from('fundings').insert({
    funder_id: otherFunder.id,  // autre funder
    amount_sent: 500,
    currency_sent: 'XOF',
    date_sent: new Date().toISOString().split('T')[0],
    status: 'recu',
    site_id: fx.site.id
  });
  expect(error).not.toBeNull();
  expect(error.code).toBe('42501');
});
