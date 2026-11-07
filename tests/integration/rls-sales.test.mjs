import { test, beforeAll, afterAll } from 'vitest';
import { expect } from 'vitest';
import { adminClient, signInAs, authedClient } from './setup.mjs';
import { setupFixtures, teardownFixtures } from './fixtures.mjs';

let fx;
let saleId;

beforeAll(async () => {
  fx = await setupFixtures();

  // Créer 1 vente sur le site du comptable
  const { data: sale, error } = await adminClient
    .from('sales')
    .insert({
      reference: 'VTE-TEST-001',
      date: new Date().toISOString().split('T')[0],
      total_amount: 5000,
      status: 'payée',
      site_id: fx.site.id,
      created_by: fx.admin.appUser.id
    })
    .select()
    .single();
  if (error) throw error;
  saleId = sale.id;
});

afterAll(async () => {
  if (saleId) {
    await adminClient.from('sales').delete().eq('id', saleId);
  }
  await teardownFixtures(fx);
});

test('comptable peut LIRE les sales de son site', async () => {
  const token = await signInAs('compta-helpers@test.local', 'Test1234!');
  const client = await authedClient(token);
  const { data, error } = await client
    .from('sales')
    .select('*')
    .eq('id', saleId);
  expect(error).toBeNull();
  expect(data.length).toBe(1);
});

test('comptable ne peut PAS modifier une sale', async () => {
  const token = await signInAs('compta-helpers@test.local', 'Test1234!');
  const client = await authedClient(token);
  const { error } = await client
    .from('sales')
    .update({ total_amount: 99999 })
    .eq('id', saleId);
  expect(error).not.toBeNull();
  expect(error.code).toBe('42501');
});

test('admin PEUT modifier une sale', async () => {
  const token = await signInAs('admin-helpers@test.local', 'Test1234!');
  const client = await authedClient(token);
  const { error } = await client
    .from('sales')
    .update({ total_amount: 7500 })
    .eq('id', saleId);
  expect(error).toBeNull();
});
