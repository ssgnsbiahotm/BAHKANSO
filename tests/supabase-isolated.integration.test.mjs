import assert from 'node:assert/strict';
import { lstatSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import test from 'node:test';
import {
  checkLocalTarget,
} from './local-target-guard.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const workdir = resolve(root, 'supabase/isolated');
const enabled = process.env.BAHKANSO_RUN_LOCAL_SUPABASE === '1';
const required = process.env.BAHKANSO_REQUIRE_LOCAL_SUPABASE === '1';
const password = 'Local-only-Test-Pass-2026!';
let integrationTestExecuted = false;
const linkedProjectRefPath = join(workdir, 'supabase', '.temp', 'project-ref');
const linkedProjectCachePath = join(workdir, 'supabase', '.temp', 'linked-project.json');
const accounts = [
  { email: 'owner-mission05@bahkanso.example.test', role: 'propriétaire', active: true },
  { email: 'admin-mission05@bahkanso.example.test', role: 'administrateur', active: true },
  { email: 'funder-mission05@bahkanso.example.test', role: 'financeur', active: true },
  { email: 'inactive-mission05@bahkanso.example.test', role: 'propriétaire', active: false },
  { email: 'unknown-role-mission05@bahkanso.example.test', role: 'role_inconnu', active: true },
];

function runCli(args, options = {}) {
  const result = spawnSync('npx', ['supabase', ...args], {
    cwd: root,
    encoding: 'utf8',
    ...options,
  });
  if (result.error) throw result.error;
  assert.equal(
    result.status,
    0,
    `supabase ${args.join(' ')} failed (exit ${result.status ?? 'unknown'})`,
  );
  return result.stdout;
}

function runPsqlFile(file, { captureTap = false } = {}) {
  const result = spawnSync('docker', [
    'exec', '-i', 'supabase_db_bahkanso-isolated-access-test',
    'psql', '-X', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres',
  ], {
    cwd: root,
    encoding: 'utf8',
    input: readFileSync(file, 'utf8'),
  });
  if (result.error) throw result.error;
  if (captureTap && process.env.BAHKANSO_TAP_RESULTS_FILE) {
    writeFileSync(process.env.BAHKANSO_TAP_RESULTS_FILE, result.stdout);
  }
  assert.equal(
    result.status,
    0,
    `local psql failed for ${file} (exit ${result.status ?? 'unknown'})`,
  );
  return result.stdout;
}

function runPsqlFileFromIsolatedProject(file, options) {
  return runPsqlFile(resolve(workdir, file), options);
}

function runPsqlQuery(sql) {
  const result = spawnSync('docker', [
    'exec', 'supabase_db_bahkanso-isolated-access-test',
    'psql', '-X', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres',
    '-Atc', sql,
  ], { cwd: root, encoding: 'utf8' });
  if (result.error) throw result.error;
  assert.equal(
    result.status,
    0,
    `local psql query failed (exit ${result.status ?? 'unknown'})`,
  );
  return result.stdout.trim();
}

function localClient(url, key) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function pathExists(path) {
  try {
    lstatSync(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

function localTargetEvidence() {
  const config = readFileSync(join(workdir, 'supabase', 'config.toml'), 'utf8');
  const projectIds = [...config.matchAll(/^\s*project_id\s*=\s*"([^"]*)"\s*$/gm)];

  return {
    localProjectId: projectIds.length === 1 ? projectIds[0][1] : null,
    linkProjectIdEnvironmentPresent: Object.hasOwn(process.env, 'SUPABASE_PROJECT_ID'),
    workdirEnvironmentPresent: Object.hasOwn(process.env, 'SUPABASE_WORKDIR'),
    projectRefFilePresent: pathExists(linkedProjectRefPath),
    linkedProjectCacheFilePresent: pathExists(linkedProjectCachePath),
  };
}

async function createSyntheticAccount(client, email) {
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { name: 'Compte synthétique de test' } },
  });
  if (!error && data.user) return data.user;

  const { data: signedIn, error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError || !signedIn.user) {
    throw error ?? signInError ?? new Error(`Could not create local test account ${email}`);
  }
  return signedIn.user;
}

test('candidate 010/011 et API locale respectent le parcours propriétaire en lecture seule', {
  skip: enabled ? false : 'requires the explicitly started isolated Supabase stack',
}, async () => {
  integrationTestExecuted = true;
  const statusOutput = runCli([
    'status', '--workdir', workdir, '--output', 'json',
  ]);
  const target = checkLocalTarget(statusOutput, localTargetEvidence());
  assert.ok(
    target.allowed,
    `Refusing local bootstrap because target safety could not be proven: ${JSON.stringify(target.diagnostic)}`,
  );
  const status = JSON.parse(statusOutput);
  const apiUrl = status.API_URL;
  const anonKey = status.ANON_KEY;
  assert.equal(new URL(apiUrl).hostname, '127.0.0.1');
  assert.equal(typeof apiUrl, 'string');
  assert.ok(typeof anonKey === 'string' && anonKey.length > 0, 'local public API key is present');
  assert.ok(anonKey !== status.SERVICE_ROLE_KEY, 'API assertions must never use the privileged key');

  runPsqlFile(resolve(workdir, 'fixture.sql'));
  runPsqlFile(resolve(workdir, 'auth_test_users.sql'));

  const authApi = await fetch(`${apiUrl}/auth/v1/health`);
  assert.equal(authApi.ok, true, 'local GoTrue health endpoint responds');

  const anonymous = localClient(apiUrl, anonKey);
  for (const account of accounts) {
    const user = await createSyntheticAccount(anonymous, account.email);
    assert.equal(user.email, account.email);
  }

  const quotedEmails = accounts.map(account => `'${account.email}'`).join(', ');
  assert.equal(
    runPsqlQuery(
      `SELECT count(*) FROM public.app_users WHERE email IN (${quotedEmails}) AND auth_id IS NOT NULL`,
    ),
    String(accounts.length),
    'GoTrue signup trigger creates the linked app profile',
  );

  runPsqlFile(resolve(workdir, 'bootstrap_profiles.sql'));
  runPsqlFile(resolve(root, 'supabase/candidates/010_access_foundation_candidate.sql'));
  runPsqlFile(resolve(root, 'supabase/candidates/011_owner_funding_read_candidate.sql'));
  const sqlTestOutput = runPsqlFileFromIsolatedProject(
    'supabase/tests/access.test.sql',
    { captureTap: true },
  );
  assert.match(sqlTestOutput, /^1\.\.34$/m);
  assert.doesNotMatch(sqlTestOutput, /^(?:not ok \d+|Bail out!)/m);
  const completedAssertions = [...sqlTestOutput.matchAll(/^ok (\d+) - /gm)]
    .map(([, number]) => Number(number));
  assert.deepEqual(completedAssertions, Array.from({ length: 34 }, (_, index) => index + 1));

  const clients = new Map();
  for (const account of accounts) {
    const client = localClient(apiUrl, anonKey);
    const { error } = await client.auth.signInWithPassword({ email: account.email, password });
    assert.equal(error, null, `local sign-in succeeds for ${account.email}`);
    clients.set(account.email, client);
  }

  const owner = clients.get('owner-mission05@bahkanso.example.test');
  const { data: ownerProfile, error: profileError } = await owner
    .from('app_users')
    .select('*')
    .maybeSingle();
  assert.equal(profileError, null);
  assert.equal(ownerProfile.role, 'propriétaire');
  assert.equal(ownerProfile.active, true);

  const fundingProjection = 'id, reference, funder_id, amount_sent, currency_sent, exchange_rate, amount_received, transfer_fees, date_sent, date_received, bank_reference, status, comment, funder:funders(name)';
  const { data: ownerRows, error: ownerReadError } = await owner
    .from('fundings')
    .select(fundingProjection);
  assert.equal(ownerReadError, null);
  assert.equal(ownerRows.length, 1);
  assert.equal(ownerRows[0].reference, 'TEST-FND-001');
  assert.equal(ownerRows[0].funder.name, 'Financeur synthétique');

  const admin = clients.get('admin-mission05@bahkanso.example.test');
  const funder = clients.get('funder-mission05@bahkanso.example.test');
  const inactive = clients.get('inactive-mission05@bahkanso.example.test');
  const unknown = clients.get('unknown-role-mission05@bahkanso.example.test');
  for (const [label, client] of [
    ['technical admin', admin],
    ['unlinked funder', funder],
    ['inactive owner', inactive],
    ['unknown role', unknown],
  ]) {
    const { data, error } = await client.from('fundings').select('id');
    assert.equal(error, null, `${label} request is handled by RLS`);
    assert.deepEqual(data, [], `${label} cannot see private funding`);
  }

  const { data: inserted, error: insertError } = await owner
    .from('fundings')
    .insert({
      id: '20000000-0000-4000-8000-000000000002',
      amount_sent: 1,
      date_sent: '2026-01-01',
    })
    .select('id');
  assert.ok(insertError);
  assert.equal(inserted, null);
  const { error: updateError } = await owner
    .from('fundings')
    .update({ comment: 'forbidden' })
    .eq('reference', 'TEST-FND-001');
  assert.ok(updateError);
  const { error: deleteError } = await owner
    .from('fundings')
    .delete()
    .eq('reference', 'TEST-FND-001');
  assert.ok(deleteError);

  const { error: selfRoleError } = await owner
    .from('app_users')
    .update({ role: 'administrateur' })
    .eq('id', ownerProfile.id);
  assert.ok(selfRoleError);
  const { data: unchangedProfile, error: unchangedProfileError } = await owner
    .from('app_users')
    .select('role, active')
    .single();
  assert.equal(unchangedProfileError, null);
  assert.deepEqual(unchangedProfile, { role: 'propriétaire', active: true });
  const { error: auditUpdateError } = await owner
    .from('audit_logs')
    .update({ action: 'forbidden' })
    .eq('id', '30000000-0000-4000-8000-000000000001');
  assert.ok(auditUpdateError);
  const { error: auditDeleteError } = await owner
    .from('audit_logs')
    .delete()
    .eq('id', '30000000-0000-4000-8000-000000000001');
  assert.ok(auditDeleteError);

  const { data: unchangedFundingRows, error: fundingCountError } = await owner
    .from('fundings')
    .select('id');
  assert.equal(fundingCountError, null);
  assert.equal(unchangedFundingRows.length, 1, 'forbidden API writes leave the funding count unchanged');
  const { data: unchanged, error: unchangedError } = await owner
    .from('fundings')
    .select('reference, comment')
    .eq('reference', 'TEST-FND-001')
    .single();
  assert.equal(unchangedError, null);
  assert.equal(unchanged.comment, 'Fixture synthétique locale');

  const newAccount = await createSyntheticAccount(anonymous, 'new-user-mission05@bahkanso.example.test');
  const pendingClient = localClient(apiUrl, anonKey);
  const { error: pendingSignInError } = await pendingClient.auth.signInWithPassword({
    email: 'new-user-mission05@bahkanso.example.test',
    password,
  });
  assert.equal(pendingSignInError, null);
  const { data: pendingProfile, error: pendingProfileError } = await pendingClient
    .from('app_users')
    .select('role, active')
    .eq('auth_id', newAccount.id)
    .single();
  assert.equal(pendingProfileError, null);
  assert.deepEqual(pendingProfile, { role: 'pending', active: false });

  assert.match(newAccount.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  runCli([
    'db', 'query', '--local', '--workdir', workdir,
    `DELETE FROM public.app_users WHERE auth_id = '${newAccount.id}'`,
  ]);
  const { data: missingProfileRows, error: missingProfileError } = await pendingClient
    .from('fundings')
    .select('id');
  assert.equal(missingProfileError, null);
  assert.deepEqual(missingProfileRows, [], 'an authenticated user without a profile has no funding access');

  runCli([
    'db', 'query', '--local', '--workdir', workdir,
    "UPDATE public.app_users SET active = false WHERE email = 'owner-mission05@bahkanso.example.test'",
  ]);
  try {
    const { data, error } = await owner.from('fundings').select('id');
    assert.equal(error, null);
    assert.deepEqual(data, [], 'an existing valid token loses access after profile deactivation');
  } finally {
    runCli([
      'db', 'query', '--local', '--workdir', workdir,
      "UPDATE public.app_users SET active = true WHERE email = 'owner-mission05@bahkanso.example.test'",
    ]);
  }
});

test('the required CI integration test cannot be skipped', {
  skip: !required,
}, () => {
  assert.equal(
    enabled,
    true,
    'CI requires BAHKANSO_RUN_LOCAL_SUPABASE=1; refusing to pass with a skipped Auth/API test',
  );
  assert.equal(
    integrationTestExecuted,
    true,
    'the Auth/API integration test itself must execute; a skipped test is not acceptable in CI',
  );
});
