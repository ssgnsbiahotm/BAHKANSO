import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { prepareFullSchemaProject } from '../scripts/prepare-full-schema-validation.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);
const expectedMigrations = [
  '20260929171038_001_core_tables.sql',
  '20260929171114_002_operational_tables.sql',
  '20261002203614_006_site_content.sql',
  '20261004122416_007_auth_and_rls_tightening.sql.sql',
  '20261005195209_008_recipes_and_rls_fixes.sql.sql',
  '20261005195221_009_storage_policies.sql.sql',
];

test('the full-schema workdir copies only reviewed structural migrations and omits demo seeds', () => {
  const parent = mkdtempSync(join(tmpdir(), 'bahkanso-full-schema-plan-'));
  const destination = join(parent, 'project');
  try {
    const plan = prepareFullSchemaProject(root, destination);
    const migrationDirectory = join(destination, 'supabase/migrations');
    assert.deepEqual(readdirSync(migrationDirectory).sort(), [...expectedMigrations].sort());
    assert.deepEqual(plan.migrationFiles, expectedMigrations);

    for (const file of expectedMigrations.filter(name => !name.startsWith('20261002203614'))) {
      assert.equal(
        readFileSync(join(migrationDirectory, file), 'utf8'),
        readFileSync(join(root, 'supabase/migrations', file), 'utf8'),
        `${file} must be copied byte-for-byte`,
      );
    }

    const sourceSiteContent = readFileSync(
      join(root, 'supabase/migrations/20261002203614_006_site_content.sql'),
      'utf8',
    );
    const derivedSiteContent = readFileSync(
      join(migrationDirectory, '20261002203614_006_site_content.sql'),
      'utf8',
    );
    const demoInsertOffset = sourceSiteContent.indexOf(
      'INSERT INTO site_content (key, value) VALUES\n',
    );
    assert.equal(
      derivedSiteContent,
      `${sourceSiteContent.slice(0, demoInsertOffset)}-- CI-derived migration: omitted only the terminal site_content demo INSERT.\n`,
    );
    assert.match(derivedSiteContent, /omitted only the terminal site_content demo INSERT/);
    assert.doesNotMatch(derivedSiteContent, /INSERT INTO site_content/);
    assert.match(derivedSiteContent, /CREATE TABLE IF NOT EXISTS site_content/);

    const config = readFileSync(join(destination, 'supabase/config.toml'), 'utf8');
    assert.match(config, /\[db\.migrations\]\nenabled = false/);
    assert.match(config, /\[db\.seed\]\nenabled = false/);
    assert.match(config, /\[storage\]\nenabled = true/);
    assert.match(config, /project_id = "bahkanso-isolated-access-test"/);
    assert.doesNotMatch(config, /SUPABASE_ACCESS_TOKEN|SUPABASE_DB_PASSWORD/);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});
