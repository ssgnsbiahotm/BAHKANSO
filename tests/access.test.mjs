import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  canLoadPrivateBusinessData,
  createAuthAccessController,
  createRequestEpoch,
  INITIAL_ACCESS_STATE,
  loadFundingRowsForAccess,
  resolveProfileAccess,
  SIGNED_OUT_ACCESS_STATE,
  visiblePrivateData,
} from '../src/lib/access.ts';
import {
  canAccessModule,
  defaultModuleForRole,
  hasPermission,
} from '../src/lib/permissions.ts';

const profile = (role = 'gestionnaire', active = true, funder_id = null) => ({
  id: 'profile-1',
  auth_id: 'auth-1',
  funder_id,
  name: 'Utilisateur',
  email: 'user@example.test',
  role,
  phone: null,
  active,
  last_login: null,
  created_at: '2026-01-01T00:00:00Z',
});

test('l’état initial distingue le chargement de session', () => {
  assert.equal(INITIAL_ACCESS_STATE.status, 'loading-session');
});

test('une session absente ne produit pas de profil autorisé', () => {
  assert.equal(resolveProfileAccess(null).status, 'profile-missing');
  assert.equal(SIGNED_OUT_ACCESS_STATE.status, 'signed-out');
  assert.equal(canLoadPrivateBusinessData(SIGNED_OUT_ACCESS_STATE), false);
  const controller = createAuthAccessController(() => {}, () => {});
  controller.signedOut();
  assert.equal(controller.getState().status, 'signed-out');
});

test('le profil absent, inactif ou de rôle inconnu reste refusé', () => {
  assert.equal(resolveProfileAccess(null).status, 'profile-missing');
  assert.equal(resolveProfileAccess(profile('gestionnaire', false)).status, 'profile-inactive');
  assert.deepEqual(resolveProfileAccess(profile('autre-role')), {
    status: 'role-unknown',
    role: 'autre-role',
  });
});

test('une erreur de chargement n’est pas assimilée à un profil absent', () => {
  assert.deepEqual(resolveProfileAccess(null, 'réseau indisponible'), {
    status: 'profile-error',
    error: 'réseau indisponible',
  });
  assert.equal(resolveProfileAccess(null, '').status, 'profile-error');
});

test('un profil actif reconnu est distingué d’un chargement en cours', () => {
  assert.deepEqual(resolveProfileAccess(profile()), {
    status: 'active',
    appUser: profile(),
  });
  assert.equal(canLoadPrivateBusinessData({ status: 'loading-profile' }), false);
  assert.equal(canLoadPrivateBusinessData(resolveProfileAccess(profile('propriétaire'))), true);
  assert.equal(canLoadPrivateBusinessData(resolveProfileAccess(profile('comptable'))), false);
  assert.equal(canLoadPrivateBusinessData(resolveProfileAccess(profile('gestionnaire'))), true);
  assert.equal(canLoadPrivateBusinessData(resolveProfileAccess(profile('administrateur'))), true);
});

test('un financeur sans liaison de financeur ne charge pas les financements', () => {
  const access = resolveProfileAccess(profile('financeur'));
  assert.equal(access.status, 'active');
  assert.equal(canLoadPrivateBusinessData(access), false);
  assert.equal(
    canLoadPrivateBusinessData(resolveProfileAccess(profile('financeur', true, 'funder-1'))),
    true,
  );
});

test('les rôles métier n’obtiennent pas de lecture des financements hors périmètre', () => {
  for (const role of [
    'responsable_agricole',
    'responsable_élevage',
    'responsable_chantier',
    'auditeur',
  ]) {
    const access = resolveProfileAccess(profile(role));
    assert.equal(canLoadPrivateBusinessData(access), false, role);
  }
});

test('la matrice autorise les modules par rôle et refuse les actions hors matrice', () => {
  assert.equal(defaultModuleForRole('propriétaire'), 'dashboard');
  assert.equal(canAccessModule('propriétaire', 'reports'), true);
  assert.equal(hasPermission('propriétaire', 'expenses', 'create'), false);
  assert.equal(hasPermission('administrateur', 'users', 'update'), true);
  assert.equal(hasPermission('administrateur', 'expenses', 'validate'), true);
  assert.equal(hasPermission('administrateur', 'audit', 'delete'), false);
  assert.equal(hasPermission('gestionnaire', 'expenses', 'create'), true);
  assert.equal(hasPermission('gestionnaire', 'expenses', 'validate'), false);
  assert.equal(hasPermission('gestionnaire', 'fundings', 'validate'), false);
  assert.equal(hasPermission('gestionnaire', 'treasury', 'update'), false);
  assert.equal(hasPermission('financeur', 'fundings', 'update'), false);
  assert.equal(canAccessModule('responsable_agricole', 'agriculture'), true);
  assert.equal(canAccessModule('responsable_agricole', 'livestock'), false);
  assert.equal(hasPermission('responsable_élevage', 'livestock', 'create'), true);
  assert.equal(canAccessModule('responsable_chantier', 'projects'), true);
  assert.equal(canAccessModule('financeur', 'expenses'), false);
  assert.equal(hasPermission('financeur', 'fundings', 'read'), true);
  assert.equal(defaultModuleForRole('auditeur'), null);
});

test('une réponse privée tardive est invalidée après refus ou déconnexion', () => {
  const epoch = createRequestEpoch();
  const request = epoch.next();
  epoch.invalidate();
  assert.equal(epoch.isCurrent(request), false);
});

test('les données déjà chargées sont immédiatement masquées après déconnexion ou refus', () => {
  const cached = { expenses: ['privée'], profiles: ['privé'] };
  const empty = { expenses: [], profiles: [] };
  assert.deepEqual(visiblePrivateData(SIGNED_OUT_ACCESS_STATE, cached, empty), empty);
  assert.deepEqual(
    visiblePrivateData(resolveProfileAccess(profile('financeur')), cached, empty),
    empty,
  );
});

test('le contrôleur Auth publie un profil actif puis refuse une erreur de revalidation', async () => {
  const states = [];
  const errors = [];
  const controller = createAuthAccessController(state => states.push(state), error => errors.push(error));

  await controller.loadProfile('auth-1', async () => profile('propriétaire'));
  assert.equal(controller.getState().status, 'active');
  await controller.loadProfile('auth-1', async () => {
    throw new Error('réseau indisponible');
  });

  assert.deepEqual(states.map(state => state.status), ['loading-profile', 'active', 'loading-profile', 'profile-error']);
  assert.equal(controller.getState().status, 'profile-error');
  assert.equal(controller.getState().error, 'réseau indisponible');
  assert.equal(errors.length, 1);
});

test('une déconnexion purge les financements chargés et invalide la réponse tardive', async () => {
  const access = resolveProfileAccess(profile('propriétaire'));
  const epoch = createRequestEpoch();
  let rows = [{ id: 'already-loaded' }];
  let loading = false;
  let resolveRequest;
  const pending = loadFundingRowsForAccess(
    access,
    () => new Promise(resolve => { resolveRequest = resolve; }),
    epoch,
    {
      setRows: value => { rows = value; },
      setLoading: value => { loading = value; },
      setError: () => {},
      onError: error => { throw error; },
    },
  );
  assert.deepEqual(rows, []);
  assert.equal(loading, true);

  await loadFundingRowsForAccess(SIGNED_OUT_ACCESS_STATE, async () => [], epoch, {
    setRows: value => { rows = value; },
    setLoading: value => { loading = value; },
    setError: () => {},
    onError: error => { throw error; },
  });
  assert.deepEqual(rows, []);
  assert.equal(loading, false);

  resolveRequest([{ id: 'late-private-row' }]);
  await pending;
  assert.deepEqual(rows, []);
});

test('une réponse de profil tardive ne réautorise pas une session terminée', async () => {
  const states = [];
  const controller = createAuthAccessController(state => states.push(state), () => {});
  let resolveProfileRequest;
  const pending = controller.loadProfile('auth-1', () => new Promise(resolve => {
    resolveProfileRequest = resolve;
  }));

  controller.signedOut();
  resolveProfileRequest(profile('propriétaire'));
  await pending;

  assert.equal(controller.getState().status, 'signed-out');
  assert.equal(states.at(-1).status, 'signed-out');
});

test('le financeur sans périmètre ne déclenche aucune lecture de financements', async () => {
  let requests = 0;
  const rows = ['private'];
  let visibleRows = rows;
  await loadFundingRowsForAccess(resolveProfileAccess(profile('financeur')), async () => {
    requests += 1;
    return ['private'];
  }, createRequestEpoch(), {
    setRows: value => { visibleRows = value; },
    setLoading: () => {},
    setError: () => {},
    onError: error => { throw error; },
  });
  assert.equal(requests, 0);
  assert.deepEqual(visibleRows, []);
});

test('l’interface de connexion ne propose plus d’inscription libre', async () => {
  const loginPage = await readFile(new URL('../src/pages/LoginPage.tsx', import.meta.url), 'utf8');
  const authContext = await readFile(new URL('../src/lib/AuthContext.tsx', import.meta.url), 'utf8');
  const usersPage = await readFile(new URL('../src/pages/UsersPage.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(loginPage, /signup|signUp|S'inscrire/i);
  assert.doesNotMatch(authContext, /signUp|auth\.signUp/);
  assert.match(loginPage, /L’accès à Bahkanso est administré/);
  assert.doesNotMatch(usersPage, /\.from\(['"]app_users['"]\)\.(insert|update|delete)/);
});
