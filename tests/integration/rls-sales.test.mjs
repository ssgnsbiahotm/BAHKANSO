import { test, beforeAll, afterAll } from 'vitest';
import { expect } from 'vitest';
import { adminClient, signInAs, authedClient } from './setup.mjs';
import { setupFixtures, teardownFixtures } from './fixtures.mjs';

let fx;
let siteB;
let saleId;
let saleBSiteId;
let saleSiteId; // site_id réellement stocké (peut différer de fx.site.id par défaut/trigger)

beforeAll(async () => {
  fx = await setupFixtures();

  // Second site pour tester le blocage cross-site
  const { data: sb, error: sbErr } = await adminClient
    .from('sites')
    .insert({ name: 'Test Site B Sales' })
    .select()
    .single();
  if (sbErr) throw sbErr;
  siteB = sb;

  // Vente sur le site du comptable (site A)
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
    .select('id')
    .single();
  if (error) throw error;
  saleId = sale.id;

  // Lire le site_id réellement stocké (le .select() d'insert renvoie l'écho
  // des valeurs d'entrée, pas la ligne stockée après déclencheurs).
  const { data: stored } = await adminClient
    .from('sales')
    .select('site_id')
    .eq('id', saleId)
    .single();
  saleSiteId = stored?.site_id ?? null;

  // Aligner le site du comptable sur le site de la vente, afin que
  // current_user_site_id() corresponde à la vente lors du test de lecture.
  if (saleSiteId && saleSiteId !== fx.comptable.appUser.site_id) {
    await adminClient
      .from('app_users')
      .update({ site_id: saleSiteId })
      .eq('id', fx.comptable.appUser.id);
  }

  // Vente sur l'autre site (site B)
  const { data: saleB, error: saleBErr } = await adminClient
    .from('sales')
    .insert({
      reference: 'VTE-TEST-002',
      date: new Date().toISOString().split('T')[0],
      total_amount: 8000,
      status: 'payée',
      site_id: siteB.id,
      created_by: fx.admin.appUser.id
    })
    .select()
    .single();
  if (saleBErr) throw saleBErr;
  saleBSiteId = saleB.id;
});

afterAll(async () => {
  if (saleId) {
    await adminClient.from('sales').delete().eq('id', saleId);
  }
  if (saleBSiteId) {
    await adminClient.from('sales').delete().eq('id', saleBSiteId);
  }
  await teardownFixtures(fx);
});

test('comptable peut LIRE les sales de son site', async () => {
  const token = await signInAs(fx.comptable.appUser.email, 'Test1234!');
  const client = await authedClient(token);
  const { data, error } = await client
    .from('sales')
    .select('*')
    .eq('id', saleId);
  expect(error).toBeNull();
  expect(data.length).toBe(1);
});

test('comptable ne peut PAS modifier une vente d un autre site', async () => {
  const token = await signInAs(fx.comptable.appUser.email, 'Test1234!');
  const client = await authedClient(token);
  const { data, error } = await client
    .from('sales')
    .update({ total_amount: 99999 })
    .eq('id', saleBSiteId);
  // RLS filtre : la vente de l autre site n est pas visible, 0 ligne modifiee
  expect(data).toBeNull();
  // Le montant n a pas change (verifie via admin qui contourne RLS)
  const { data: after } = await adminClient
    .from('sales')
    .select('total_amount')
    .eq('id', saleBSiteId)
    .single();
  expect(after.total_amount).toBe(8000);
});

test('admin PEUT modifier une sale', async () => {
  const token = await signInAs(fx.admin.appUser.email, 'Test1234!');
  const client = await authedClient(token);
  const { error } = await client
    .from('sales')
    .update({ total_amount: 7500 })
    .eq('id', saleId);
  expect(error).toBeNull();
});
