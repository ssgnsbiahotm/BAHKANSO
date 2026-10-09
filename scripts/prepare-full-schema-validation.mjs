import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const migrationFiles = [
  '20260929171038_001_core_tables.sql',
  '20260929171114_002_operational_tables.sql',
  '20261002203614_006_site_content.sql',
  '20261004122416_007_auth_and_rls_tightening.sql.sql',
  '20261005195209_008_recipes_and_rls_fixes.sql.sql',
  '20261005195221_009_storage_policies.sql.sql',
];
const siteContentSeedMarker = 'INSERT INTO site_content (key, value) VALUES\n';

function replaceExactlyOnce(text, searchValue, replacement, label) {
  const first = text.indexOf(searchValue);
  if (first < 0 || text.indexOf(searchValue, first + searchValue.length) >= 0) {
    throw new Error(`Expected exactly one ${label} in isolated Supabase config`);
  }
  return `${text.slice(0, first)}${replacement}${text.slice(first + searchValue.length)}`;
}

export function omitSiteContentDemoRows(source) {
  const first = source.indexOf(siteContentSeedMarker);
  if (first < 0 || source.indexOf(siteContentSeedMarker, first + siteContentSeedMarker.length) >= 0) {
    throw new Error('Expected exactly one site_content demo INSERT in migration 006');
  }

  const statementEnd = source.indexOf('ON CONFLICT (key) DO NOTHING;', first);
  if (statementEnd < 0 || source.slice(statementEnd + 'ON CONFLICT (key) DO NOTHING;'.length).trim() !== '') {
    throw new Error('Migration 006 demo INSERT no longer matches the reviewed terminal statement');
  }

  return `${source.slice(0, first)}-- CI-derived migration: omitted only the terminal site_content demo INSERT.\n`;
}

export function prepareFullSchemaProject(repositoryRoot, destination) {
  const target = resolve(destination);
  if (existsSync(target)) {
    throw new Error(`Full-schema workdir already exists: ${target}`);
  }

  const configSource = readFileSync(
    join(repositoryRoot, 'supabase/isolated/supabase/config.toml'),
    'utf8',
  );
  const config = replaceExactlyOnce(
    configSource,
    '[storage]\nenabled = false',
    '[storage]\nenabled = true',
    'Storage setting',
  );
  if (!config.includes('[db.seed]\nenabled = false')) {
    throw new Error('Demo seeds must remain disabled in the full-schema project');
  }

  const migrationsDirectory = join(target, 'supabase/migrations');
  mkdirSync(migrationsDirectory, { recursive: true });
  writeFileSync(join(target, 'supabase/config.toml'), config);

  for (const file of migrationFiles) {
    const sourcePath = join(repositoryRoot, 'supabase/migrations', file);
    const destinationPath = join(migrationsDirectory, file);
    if (file === '20261002203614_006_site_content.sql') {
      const source = readFileSync(sourcePath, 'utf8');
      writeFileSync(destinationPath, omitSiteContentDemoRows(source));
    } else {
      mkdirSync(dirname(destinationPath), { recursive: true });
      copyFileSync(sourcePath, destinationPath);
    }
  }

  return { workdir: target, migrationFiles: [...migrationFiles] };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const destination = process.argv[2];
  if (!destination) {
    throw new Error('Usage: node scripts/prepare-full-schema-validation.mjs <new-workdir>');
  }
  const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const result = prepareFullSchemaProject(repositoryRoot, destination);
  process.stdout.write(`BAHKANSO_FULL_SCHEMA_WORKDIR=${result.workdir}\n`);
}
