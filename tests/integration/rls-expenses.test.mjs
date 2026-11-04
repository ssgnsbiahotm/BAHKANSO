import { test, beforeAll, afterAll } from 'vitest';
import { expect } from 'vitest';
import { adminClient, signInAs, authedClient } from './setup.mjs';
import { setupFixtures, teardownFixtures } from './fixtures.mjs';

let fx;

beforeAll(async () => {
  fx = await setupFixtures();

  // Créer 1 expense sur le site du comptable
  const { data: expense, error } = await adminClient
    .from('expenses')
    .insert({
      reference: 'DEP-TEST-001',
      date: new Date().toISOString().split('T')[0],
      amount: 500,
      currency: 'XOF',
      status: 'brouillon',
      site_id: fx.site.id,
      created_by: fx.admin.appUser.id
    })
    .select()
    .single();
  if (error) throw error;
  fx.expense = expense;
});

afterAll(async () => {
  if (fx.expense) {
    await adminClient.from('expenses').delete().eq('id', fx.expense.id);
  }
  await teardownFixtures(fx);
});

test('comptable peut LIRE les expenses de son site', async () => {
  const token = await signInAs('compta-helpers@test.local', 'Test1234!');
  const client = await authedClient(token);
  const { data, error } = await client
    .from('expenses')
    .select('*')
    .eq('id', fx.expense.id);
  expect(error).toBeNull();
  expect(data.length).toBe(1);
});

test('comptable ne peut PAS modifier une expense', async () => {
  const token = await signInAs('compta-helpers@test.local', 'Test1234!');
  const client = await authedClient(token);
  const { error } = await client
    .from('expenses')
    .update({ amount: 9999 })
    .eq('id', fx.expense.id);
  expect(error).not.toBeNull();
  expect(error.code).toBe('42501');
});

test('admin PEUT modifier une expense', async () => {
  const token = await signInAs('admin-helpers@test.local', 'Test1234!');
  const client = await authedClient(token);
  const { error } = await client
    .from('expenses')
    .update({ amount: 750 })
    .eq('id', fx.expense.id);
  expect(error).toBeNull();
});
