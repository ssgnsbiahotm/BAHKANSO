import { test, beforeAll, afterAll } from 'vitest';
import { expect } from 'vitest';
import { signInAs, authedClient } from './setup.mjs';
import { setupFixtures, teardownFixtures } from './fixtures.mjs';

let fx;

beforeAll(async () => {
  fx = await setupFixtures();
});

afterAll(async () => {
  await teardownFixtures(fx);
});

test('current_app_user_id() retourne l\'id du financeur', async () => {
  const token = await signInAs('fin-helpers@test.local', 'Test1234!');
  const client = await authedClient(token);
  const { data, error } = await client.rpc('current_app_user_id');
  expect(error).toBeNull();
  expect(data).toBe(fx.financeur.appUser.id);
});

test('current_user_role() retourne "financeur"', async () => {
  const token = await signInAs('fin-helpers@test.local', 'Test1234!');
  const client = await authedClient(token);
  const { data, error } = await client.rpc('current_user_role');
  expect(error).toBeNull();
  expect(data).toBe('financeur');
});

test('current_user_site_id() retourne le site du comptable', async () => {
  const token = await signInAs('compta-helpers@test.local', 'Test1234!');
  const client = await authedClient(token);
  const { data, error } = await client.rpc('current_user_site_id');
  expect(error).toBeNull();
  expect(data).toBe(fx.site.id);
});

test('current_user_funder_id() retourne le funder du financeur', async () => {
  const token = await signInAs('fin-helpers@test.local', 'Test1234!');
  const client = await authedClient(token);
  const { data, error } = await client.rpc('current_user_funder_id');
  expect(error).toBeNull();
  expect(data).toBe(fx.funder.id);
});

test('current_user_role() retourne "administrateur" pour l\'admin', async () => {
  const token = await signInAs('admin-helpers@test.local', 'Test1234!');
  const client = await authedClient(token);
  const { data } = await client.rpc('current_user_role');
  expect(data).toBe('administrateur');
});

test('current_user_funder_id() retourne NULL pour un comptable', async () => {
  const token = await signInAs('compta-helpers@test.local', 'Test1234!');
  const client = await authedClient(token);
  const { data } = await client.rpc('current_user_funder_id');
  expect(data).toBeNull();
});
