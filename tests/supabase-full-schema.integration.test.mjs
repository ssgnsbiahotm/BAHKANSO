import assert from 'node:assert/strict';
import { lstatSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import test from 'node:test';
import {
  checkLocalTarget,
  LOCAL_PROJECT_ID,
} from './local-target-guard.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const workdir = process.env.BAHKANSO_FULL_SCHEMA_WORKDIR;
const enabled = process.env.BAHKANSO_RUN_FULL_SCHEMA === '1';
const required = process.env.BAHKANSO_REQUIRE_FULL_SCHEMA === '1';
const password = 'Full-Schema-Local-Test-2026!';
let fullSchemaTestExecuted = false;
const accounts = [
  'full-owner@bahkanso.example.test',
  'full-admin@bahkanso.example.test',
  'full-funder@bahkanso.example.test',
  'full-inactive@bahkanso.example.test',
  'full-unknown@bahkanso.example.test',
  'full-no-profile@bahkanso.example.test',
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
    'exec', '-i', `supabase_db_${LOCAL_PROJECT_ID}`,
    'psql', '-X', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres',
  ], {
    cwd: root,
    encoding: 'utf8',
    input: readFileSync(file, 'utf8'),
  });
  if (result.error) throw result.error;
  if (captureTap && process.env.BAHKANSO_FULL_SCHEMA_TAP_RESULTS_FILE) {
    writeFileSync(process.env.BAHKANSO_FULL_SCHEMA_TAP_RESULTS_FILE, result.stdout);
  }
  assert.equal(
    result.status,
    0,
    `local psql failed for ${file} (exit ${result.status ?? 'unknown'})`,
  );
  return result.stdout;
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
  const configPath = join(workdir, 'supabase', 'config.toml');
  const config = readFileSync(configPath, 'utf8');
  const projectIds = [...config.matchAll(/^\s*project_id\s*=\s*"([^"]*)"\s*$/gm)];

  return {
    localProjectId: projectIds.length === 1 ? projectIds[0][1] : null,
    linkProjectIdEnvironmentPresent: Object.hasOwn(process.env, 'SUPABASE_PROJECT_ID'),
    workdirEnvironmentPresent: Object.hasOwn(process.env, 'SUPABASE_WORKDIR'),
    projectRefFilePresent: pathExists(join(workdir, 'supabase', '.temp', 'project-ref')),
    linkedProjectCacheFilePresent: pathExists(
      join(workdir, 'supabase', '.temp', 'linked-project.json'),
    ),
  };
}

function localClient(url, key) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function createSyntheticAccount(url, key, email) {
  const { data, error } = await localClient(url, key).auth.signUp({
    email,
    password,
    options: { data: { name: 'Compte synthétique full-schema' } },
  });
  assert.equal(error, null, `local Auth creates synthetic account ${email}`);
  assert.ok(data.user, `local Auth returns synthetic account ${email}`);
  return data.user;
}

async function signedInClient(url, key, email) {
  const client = localClient(url, key);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  assert.equal(error, null, `local Auth sign-in succeeds for ${email}`);
  assert.ok(data.user);
  return { client, user: data.user };
}

test('historical full-schema migrations satisfy candidates 010/011 and access tests', {
  skip: enabled ? false : 'requires the explicitly started full-schema local Supabase project',
}, async () => {
  fullSchemaTestExecuted = true;
  assert.ok(workdir, 'full-schema workdir is configured');
  const statusOutput = runCli(['status', '--workdir', workdir, '--output', 'json']);
  const target = checkLocalTarget(statusOutput, localTargetEvidence());
  assert.ok(
    target.allowed,
    `Refusing full-schema bootstrap because target safety could not be proven: ${JSON.stringify(target.diagnostic)}`,
  );

  runCli(['migration', 'up', '--local', '--workdir', workdir]);

  const status = JSON.parse(statusOutput);
  const apiUrl = status.API_URL;
  const anonKey = status.ANON_KEY;
  assert.equal(typeof apiUrl, 'string');
  assert.ok(typeof anonKey === 'string' && anonKey.length > 0);
  assert.ok(anonKey !== status.SERVICE_ROLE_KEY);

  for (const email of accounts) {
    await createSyntheticAccount(apiUrl, anonKey, email);
  }

  runPsqlFile(resolve(root, 'supabase/full-schema-validation/bootstrap.sql'));
  for (const candidate of [
    'supabase/candidates/010_access_foundation_candidate.sql',
    'supabase/candidates/011_owner_funding_read_candidate.sql',
  ]) {
    runCli([
      'db', 'query', '--local', '--workdir', workdir,
      readFileSync(resolve(root, candidate), 'utf8'),
    ]);
  }

  const tapOutput = runPsqlFile(
    resolve(root, 'supabase/full-schema-validation/access.test.sql'),
    { captureTap: true },
  );
  assert.match(tapOutput, /^1\.\.37$/m);
  assert.doesNotMatch(tapOutput, /^(?:not ok \d+|Bail out!)/m);
  assert.doesNotMatch(tapOutput, /^ok \d+ - .*# SKIP\b/m);
  const completedAssertions = [...tapOutput.matchAll(/^ok (\d+) - /gm)]
    .map(([, number]) => Number(number));
  assert.deepEqual(completedAssertions, Array.from({ length: 37 }, (_, index) => index + 1));

  const owner = await signedInClient(apiUrl, anonKey, 'full-owner@bahkanso.example.test');
  const { data: profile, error: profileError } = await owner.client
    .from('app_users')
    .select('role, active')
    .single();
  assert.equal(profileError, null);
  assert.deepEqual(profile, { role: 'propriétaire', active: true });

  const fundingProjection = [
    'id', 'reference', 'funder_id', 'amount_sent', 'currency_sent',
    'exchange_rate', 'amount_received', 'transfer_fees', 'date_sent',
    'date_received', 'bank_reference', 'status', 'comment',
  ].join(', ');
  const { data: ownerRows, error: ownerReadError } = await owner.client
    .from('fundings')
    .select(fundingProjection);
  assert.equal(ownerReadError, null);
  assert.equal(ownerRows.length, 1);
  assert.equal(ownerRows[0].reference, 'FULL-SCHEMA-FND-001');

  const ownerUpdate = await owner.client
    .from('fundings')
    .update({ comment: 'forbidden API change' })
    .eq('reference', 'FULL-SCHEMA-FND-001')
    .select('id');
  assert.ok(ownerUpdate.error, 'owner funding UPDATE is explicitly refused over PostgREST');
  const { data: unchangedFunding, error: unchangedFundingError } = await owner.client
    .from('fundings')
    .select('comment')
    .eq('reference', 'FULL-SCHEMA-FND-001')
    .single();
  assert.equal(unchangedFundingError, null);
  assert.equal(unchangedFunding.comment, 'Donnée synthétique pour validation locale');

  for (const email of [
    'full-admin@bahkanso.example.test',
    'full-funder@bahkanso.example.test',
    'full-inactive@bahkanso.example.test',
    'full-unknown@bahkanso.example.test',
    'full-no-profile@bahkanso.example.test',
  ]) {
    const { client } = await signedInClient(apiUrl, anonKey, email);
    const { data, error } = await client.from('fundings').select('id');
    assert.equal(error, null, `${email} receives a filtered RLS response`);
    assert.deepEqual(data, [], `${email} cannot read the private funding row`);
  }

  const pending = await createSyntheticAccount(
    apiUrl,
    anonKey,
    'full-pending-after-candidate@bahkanso.example.test',
  );
  const { client: pendingClient } = await signedInClient(
    apiUrl,
    anonKey,
    'full-pending-after-candidate@bahkanso.example.test',
  );
  const { data: pendingProfile, error: pendingProfileError } = await pendingClient
    .from('app_users')
    .select('role, active, auth_id')
    .eq('auth_id', pending.id)
    .single();
  assert.equal(pendingProfileError, null);
  assert.deepEqual(pendingProfile, {
    role: 'pending',
    active: false,
    auth_id: pending.id,
  });

  const anonymous = localClient(apiUrl, anonKey);
  const { error: anonymousContentError } = await anonymous
    .from('site_content')
    .select('key')
    .limit(1);
  assert.ok(anonymousContentError, 'public site content remains inaccessible through anon');
});

test('the required full-schema CI integration test cannot be skipped', {
  skip: !required,
}, () => {
  assert.equal(
    enabled,
    true,
    'CI requires BAHKANSO_RUN_FULL_SCHEMA=1; refusing to pass with a skipped full-schema test',
  );
  assert.equal(
    fullSchemaTestExecuted,
    true,
    'the full-schema integration test itself must execute in required CI mode',
  );
});
