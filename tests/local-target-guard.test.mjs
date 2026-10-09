import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkLocalTarget,
  LOCAL_API_URL,
  LOCAL_DB_HOST,
  LOCAL_DB_PORT,
  LOCAL_PROJECT_ID,
} from './local-target-guard.mjs';

const evidence = {
  localProjectId: LOCAL_PROJECT_ID,
  linkProjectIdEnvironmentPresent: false,
  workdirEnvironmentPresent: false,
  projectRefFilePresent: false,
  linkedProjectCacheFilePresent: false,
};

function status(overrides = {}) {
  return JSON.stringify({
    API_URL: LOCAL_API_URL,
    DB_URL: `postgresql://postgres:synthetic-db-password@${LOCAL_DB_HOST}:${LOCAL_DB_PORT}/postgres`,
    ANON_KEY: 'synthetic-anon-key',
    SERVICE_ROLE_KEY: 'synthetic-service-role-key',
    ...overrides,
  });
}

test('le JSON status-values local sans linked_project est accepté sur preuves explicites', () => {
  const result = checkLocalTarget(status(), evidence, 'status-values-json');

  assert.equal(result.allowed, true);
  assert.deepEqual(result.diagnostic.linkedProject, {
    present: false,
    type: 'absent',
    isNull: false,
    isNonNull: false,
  });
  assert.equal(result.diagnostic.apiUrlMatchesLocal, true);
  assert.equal(result.diagnostic.dbUrlMatchesLocal, true);
});

test('le JSON structuré local avec linked_project null est accepté', () => {
  const result = checkLocalTarget(
    status({ linked_project: null }),
    evidence,
    'structured-json',
  );

  assert.equal(result.allowed, true);
  assert.deepEqual(result.diagnostic.linkedProject, {
    present: true,
    type: 'null',
    isNull: true,
    isNonNull: false,
  });
});

test('un champ linked_project absent est indéterminé en mode JSON structuré', () => {
  const result = checkLocalTarget(status(), evidence, 'structured-json');

  assert.equal(result.allowed, false);
});

test('une liaison distante explicite est refusée sans exposer sa référence', () => {
  const result = checkLocalTarget(
    status({ linked_project_ref: 'abcdefghijklmnopqrst' }),
    evidence,
    'status-values-json',
  );

  assert.equal(result.allowed, false);
  assert.deepEqual(result.diagnostic.linkedIndicatorsPresent, ['linked_project_ref']);
  assert.doesNotMatch(JSON.stringify(result.diagnostic), /abcdefghijklmnopqrst/);
});

test('une URL API distante ou un endpoint Postgres distant est refusé', () => {
  const remoteApi = checkLocalTarget(
    status({ API_URL: 'https://remote-project.supabase.co' }),
    evidence,
    'status-values-json',
  );
  const remoteDatabase = checkLocalTarget(
    status({ DB_URL: 'postgresql://postgres:secret@database.example.test:5432/postgres' }),
    evidence,
    'status-values-json',
  );

  assert.equal(remoteApi.allowed, false);
  assert.equal(remoteApi.diagnostic.apiUrlMatchesLocal, false);
  assert.equal(remoteDatabase.allowed, false);
  assert.equal(remoteDatabase.diagnostic.dbUrlMatchesLocal, false);
});

test('un port Postgres inattendu est refusé', () => {
  const result = checkLocalTarget(
    status({ DB_URL: `postgresql://postgres:secret@${LOCAL_DB_HOST}:5433/postgres` }),
    evidence,
    'status-values-json',
  );

  assert.equal(result.allowed, false);
  assert.equal(result.diagnostic.dbUrlMatchesLocal, false);
});

test('un JSON malformé est refusé sans recopier son contenu', () => {
  const result = checkLocalTarget('not-json synthetic-secret', evidence);

  assert.equal(result.allowed, false);
  assert.equal(result.diagnostic.statusJsonValid, false);
  assert.doesNotMatch(JSON.stringify(result.diagnostic), /synthetic-secret/);
});

test('une configuration de liaison ou un identifiant local inattendu est refusé', () => {
  for (const changedEvidence of [
    { ...evidence, linkProjectIdEnvironmentPresent: true },
    { ...evidence, workdirEnvironmentPresent: true },
    { ...evidence, projectRefFilePresent: true },
    { ...evidence, linkedProjectCacheFilePresent: true },
    { ...evidence, localProjectId: 'another-local-stack' },
  ]) {
    assert.equal(
      checkLocalTarget(status(), changedEvidence).allowed,
      false,
    );
  }
});

test('les diagnostics ne contiennent aucune valeur sensible du status', () => {
  const result = checkLocalTarget(
    status({
      DB_URL: 'postgresql://postgres:synthetic-db-password@127.0.0.1:56322/postgres',
      ANON_KEY: 'synthetic-anon-key',
      SERVICE_ROLE_KEY: 'synthetic-service-role-key',
      linked_project: {
        project_ref: 'synthetic-remote-project-ref',
        project_name: 'synthetic-private-project-name',
      },
    }),
    evidence,
    'status-values-json',
  );
  const diagnostic = JSON.stringify(result.diagnostic);

  assert.doesNotMatch(
    diagnostic,
    /synthetic-db-password|synthetic-anon-key|synthetic-service-role-key|synthetic-remote-project-ref|synthetic-private-project-name/,
  );
  assert.equal(result.diagnostic.linkedProject.present, true);
  assert.equal(result.diagnostic.linkedProject.type, 'object');
  assert.equal(result.diagnostic.linkedProject.isNonNull, true);
});
