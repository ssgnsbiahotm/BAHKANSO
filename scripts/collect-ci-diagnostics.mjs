import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function redactSensitiveText(value) {
  return value
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED_JWT]')
    .replace(/(\bBearer\s+)[^\s]+/gi, '$1[REDACTED]')
    .replace(
      /((?:https?|postgres(?:ql)?):\/\/[^:/\s]+):[^@/\s]+@/gi,
      '$1:[REDACTED]@',
    )
    .replace(
      /((?:"?(?:[a-z0-9]+[_ -])*(?:password|secret|token|key|credential)"?)\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
      '$1[REDACTED]',
    );
}

function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 5 * 1024 * 1024,
  });
  if (result.error) {
    return `${command} could not run (${result.error.code ?? 'unknown error'})\n`;
  }
  return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

async function writeRedacted(outputDirectory, fileName, value) {
  await writeFile(join(outputDirectory, fileName), redactSensitiveText(value));
}

async function collectDiagnostics() {
  const runnerTemp = process.env.RUNNER_TEMP;
  if (!runnerTemp) throw new Error('RUNNER_TEMP is required to collect CI diagnostics');

  const outputDirectory = join(runnerTemp, 'bahkanso-ci-diagnostics');
  const resultsDirectory = join(runnerTemp, 'ci-results');
  const projectName = 'bahkanso-isolated-access-test';
  const serviceNames = ['db', 'auth', 'rest', 'kong'];
  if (process.env.BAHKANSO_COLLECT_STORAGE_DIAGNOSTICS === '1') {
    serviceNames.push('storage');
  }

  await mkdir(outputDirectory, { recursive: true });

  await writeRedacted(
    outputDirectory,
    'container-states.txt',
    run('docker', [
      'ps', '-a',
      '--filter', `name=supabase_${projectName}`,
      '--format', '{{.Names}} {{.Status}}',
    ]),
  );

  for (const service of serviceNames) {
    const containerName = `supabase_${service}_${projectName}`;
    await writeRedacted(
      outputDirectory,
      `${service}-service.log`,
      run('docker', ['logs', '--tail', '200', containerName]),
    );
  }

  for (const [source, destination] of [
    [join(runnerTemp, 'supabase-start.log'), 'supabase-start.log'],
    [join(resultsDirectory, 'frontend-tests.log'), 'frontend-tests.log'],
    [join(resultsDirectory, 'integration-tests.log'), 'integration-tests.log'],
    [join(resultsDirectory, 'access.tap'), 'access.tap'],
  ]) {
    try {
      await writeRedacted(outputDirectory, destination, await readFile(source, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await collectDiagnostics();
}
