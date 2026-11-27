import { test, beforeAll, afterAll } from 'vitest';
import { expect } from 'vitest';
import { adminClient, signInAs, authedClient, createTestUser } from './setup.mjs';

let siteA;
let siteB;
let comptableA;
let expenseA;
let expenseB;

beforeAll(async () => {
  // Créer 2 sites distincts
  const { data: sA } = await adminClient
    .from('sites')
    .insert({ name: 'Site A Test' })
    .select()
    .single();
  siteA = sA;
  const { data: sB } = await adminClient
    .from('sites')
    .insert({ name: 'Site B Test' })
    .select()
    .single();
  siteB = sB;

  // Créer un comptable rattaché au site A
  comptableA = await createTestUser('compta-siteA@test.local', 'Test1234!', 'comptable', siteA.id);

  // Créer 2 expenses : une sur le site A, une sur le site B (via admin, contourne RLS)
  const { data: eA } = await adminClient
    .from('expenses')
    .insert({
      reference: 'DEP-A-001',
      amount: 500,
      currency: 'XOF',
      status: 'brouillon',
      site_id: siteA.id,
      created_by: comptableA.appUser.id,
    })
    .select()
    .single();
  expenseA = eA;
  const { data: eB } = await adminClient
    .from('expenses')
    .insert({
      reference: 'DEP-B-001',
      amount: 700,
      currency: 'XOF',
      status: 'brouillon',
      site_id: siteB.id,
      created_by: comptableA.appUser.id,
    })
    .select()
    .single();
  expenseB = eB;
});

afterAll(async () => {
  // Nettoyage dans l'ordre inverse des FK
  if (expenseA) {
    await adminClient.from('expenses').delete().eq('id', expenseA.id);
  }
  if (expenseB) {
    await adminClient.from('expenses').delete().eq('id', expenseB.id);
  }
  if (comptableA?.appUser) {
    await adminClient.from('app_users').delete().eq('id', comptableA.appUser.id);
  }
  if (comptableA?.authUser) {
    await adminClient.auth.admin.deleteUser(comptableA.authUser.id);
  }
  if (siteA) {
    await adminClient.from('sites').delete().eq('id', siteA.id);
  }
  if (siteB) {
    await adminClient.from('sites').delete().eq('id', siteB.id);
  }
});

test('comptable du site A peut modifier une expense du site A', async () => {
  const token = await signInAs('compta-siteA@test.local', 'Test1234!');
  const client = await authedClient(token);
  const { error } = await client
    .from('expenses')
    .update({ amount: 550 })
    .eq('id', expenseA.id);
  expect(error).toBeNull();
});

test('comptable du site A ne peut PAS modifier une expense du site B (403)', async () => {
  const token = await signInAs('compta-siteA@test.local', 'Test1234!');
  const client = await authedClient(token);
  const { data, error } = await client
    .from('expenses')
    .update({ amount: 9999 })
    .eq('id', expenseB.id);
  expect(error).toBeNull();
  // RLS filtre les lignes : la dépense du site B n'est pas visible, 0 ligne mise à jour
  expect(data).toBeNull();
  // Le montant n'a pas changé (vérifié via admin qui contourne RLS)
  const { data: after } = await adminClient
    .from('expenses')
    .select('amount')
    .eq('id', expenseB.id)
    .single();
  expect(after.amount).toBe(700);
});

test('comptable du site A peut lire les expenses de son site', async () => {
  const token = await signInAs('compta-siteA@test.local', 'Test1234!');
  const client = await authedClient(token);
  const { data, error } = await client
    .from('expenses')
    .select('*')
    .eq('site_id', siteA.id);
  expect(error).toBeNull();
  expect(data.length).toBeGreaterThanOrEqual(1);
});

// ─── Tests négatifs RLS — arbitrage 2026-11-27 ──────────────────────

test('chef_chantier ne peut PAS SELECT les expenses de son site', async () => {
  const email = 'chef-siteA@test.local';
  await createTestUser(email, 'Test1234!', 'chef_chantier', siteA.id);
  const token = await signInAs(email, 'Test1234!');
  const client = await authedClient(token);
  const { data, error } = await client
    .from('expenses').select('id').eq('site_id', siteA.id);
  expect(error).toBeNull();
  expect(data).toHaveLength(0);
});

test('chef_chantier ne peut PAS WRITE une expense de son site', async () => {
  const token = await signInAs('chef-siteA@test.local', 'Test1234!');
  const client = await authedClient(token);
  const { error } = await client.from('expenses').insert({
    amount: 1000, site_id: siteA.id,
    reference: `TEST-CC-${Date.now()}`,
    status: 'brouillon',
    date: new Date().toISOString().slice(0, 10),
  });
  expect(error).not.toBeNull();
});

test('comptable ne peut PAS WRITE une expense', async () => {
  const token = await signInAs('compta-siteA@test.local', 'Test1234!');
  const client = await authedClient(token);
  const { error } = await client.from('expenses').insert({
    amount: 1000, site_id: siteA.id,
    reference: `TEST-COMPTA-${Date.now()}`,
    status: 'brouillon',
    date: new Date().toISOString().slice(0, 10),
  });
  expect(error).not.toBeNull();
});

test('responsable_chantier ne peut PAS WRITE une expense', async () => {
  const email = 'rchantier-siteA@test.local';
  await createTestUser(email, 'Test1234!', 'responsable_chantier', siteA.id);
  const token = await signInAs(email, 'Test1234!');
  const client = await authedClient(token);
  const { error } = await client.from('expenses').insert({
    amount: 1000, site_id: siteA.id,
    reference: `TEST-RC-${Date.now()}`,
    status: 'brouillon',
    date: new Date().toISOString().slice(0, 10),
  });
  expect(error).not.toBeNull();
});

test('propriétaire PEUT SELECT une expense d\'un autre site', async () => {
  const { error: fixtureErr } = await adminClient
    .from('expenses').insert({
      amount: 500, site_id: siteB.id,
      reference: `TEST-OWNER-B-${Date.now()}`,
      status: 'brouillon',
      date: new Date().toISOString().slice(0, 10),
    });
  expect(fixtureErr).toBeNull();

  const email = 'proprio@test.local';
  await createTestUser(email, 'Test1234!', 'propriétaire', siteA.id);
  const token = await signInAs(email, 'Test1234!');
  const client = await authedClient(token);
  const { data, error } = await client
    .from('expenses').select('id').eq('site_id', siteB.id);
  expect(error).toBeNull();
  expect(data.length).toBeGreaterThanOrEqual(1);
});
