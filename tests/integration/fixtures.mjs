import { adminClient, createTestUser, signInAs, authedClient } from './setup.mjs';

export async function setupFixtures() {
  // Suffixe unique par run pour éviter les collisions d'emails entre
  // fichiers de test (Supabase auth normalise les emails en minuscules,
  // et auth.uid() est dérivé de l'email : des emails fixes partagés entre
  // plusieurs fichiers de test provoqueraient un désalignement d'auth_uid).
  const runSuffix = Date.now().toString(36);

  const makeEmail = (base) => `${base}-${runSuffix}@test.local`;

  const financeurEmail = makeEmail('fin-helpers');
  const comptableEmail = makeEmail('compta-helpers');
  const adminEmail = makeEmail('admin-helpers');

  // Nettoyage préventif des utilisateurs de test de runs précédents
  // (à la fois dans app_users et dans auth.users, car createUser
  //  échoue si l'email existe déjà côté auth)
  const testEmails = [financeurEmail, comptableEmail, adminEmail];
  for (const email of testEmails) {
    const { data: users } = await adminClient.auth.admin.listUsers();
    const existing = users?.users?.find((u) => u.email?.toLowerCase() === email);
    if (existing) {
      await adminClient.auth.admin.deleteUser(existing.id);
    }
  }
  await adminClient.from('app_users').delete().like('email', '%@test.local');

  // Chauffer le cache de schéma supabase-js sur toutes les tables utilisées
  // par les tests, pour éviter les erreurs "column not found in schema cache"
  // sur le premier accès d'une table après un db reset.
  await Promise.all([
    adminClient.from('sites').select('*').limit(1),
    adminClient.from('app_users').select('*').limit(1),
    adminClient.from('funders').select('*').limit(1),
    adminClient.from('farms').select('*').limit(1),
    adminClient.from('campaigns').select('*').limit(1),
    adminClient.from('plots').select('*').limit(1),
    adminClient.from('harvests').select('*').limit(1),
    adminClient.from('sales').select('*').limit(1),
    adminClient.from('expenses').select('*').limit(1),
    adminClient.from('event_journal').select('*').limit(1),
    adminClient.from('animals').select('*').limit(1),
    adminClient.from('projects').select('*').limit(1),
    adminClient.from('project_steps').select('*').limit(1),
    adminClient.from('crop_operations').select('*').limit(1),
  ]);

  // 1. Créer un site
  const { data: site, error: siteErr } = await adminClient
    .from('sites')
    .insert({ name: 'Test Site Helpers' })
    .select()
    .single();
  if (siteErr) throw siteErr;

  // 2. Créer 3 app_users avec rôles différents
  const financeur = await createTestUser(
    financeurEmail, 'Test1234!', 'financeur', site.id
  );
  const comptable = await createTestUser(
    comptableEmail, 'Test1234!', 'comptable', site.id
  );
  const admin = await createTestUser(
    adminEmail, 'Test1234!', 'administrateur', site.id
  );

  // 3. Créer un funder lié au financeur
  const { data: funder, error: funderErr } = await adminClient
    .from('funders')
    .insert({ name: 'Funder Test', user_id: financeur.appUser.id })
    .select()
    .single();
  if (funderErr) throw funderErr;

  return { site, financeur, comptable, admin, funder };
}

export async function teardownFixtures(fx) {
  // Supprimer dans l'ordre inverse des FK
  if (fx.funder) {
    await adminClient.from('funders').delete().eq('id', fx.funder.id);
  }
  for (const u of [fx.financeur, fx.comptable, fx.admin]) {
    if (u?.appUser) {
      await adminClient.from('app_users').delete().eq('id', u.appUser.id);
    }
    if (u?.authUser) {
      await adminClient.auth.admin.deleteUser(u.authUser.id);
    }
  }
  if (fx.site) {
    await adminClient.from('sites').delete().eq('id', fx.site.id);
  }
}
