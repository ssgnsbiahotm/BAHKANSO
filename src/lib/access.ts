import type { AppUser } from './types.ts';
import { ROLE_LABELS } from './constants.ts';

export const INITIAL_ACCESS_STATE = { status: 'loading-session' } as const;
export const SIGNED_OUT_ACCESS_STATE = { status: 'signed-out' } as const;

export type AccessState =
  | typeof INITIAL_ACCESS_STATE
  | { status: 'session-error'; error: string }
  | { status: 'signed-out' }
  | { status: 'loading-profile' }
  | { status: 'profile-error'; error: string }
  | { status: 'profile-missing' }
  | { status: 'profile-inactive' }
  | { status: 'role-unknown'; role: string }
  | { status: 'active'; appUser: AppUser };

const RECOGNIZED_ROLES = new Set(Object.keys(ROLE_LABELS));

export function resolveProfileAccess(
  profile: AppUser | null,
  error?: string,
): AccessState {
  if (error !== undefined) return { status: 'profile-error', error };
  if (!profile) return { status: 'profile-missing' };
  if (!profile.active) return { status: 'profile-inactive' };
  if (!RECOGNIZED_ROLES.has(profile.role)) {
    return { status: 'role-unknown', role: profile.role };
  }
  return { status: 'active', appUser: profile };
}

export function canLoadPrivateBusinessData(access: AccessState): boolean {
  return canReadFundings(access);
}

export function canReadFundings(access: AccessState): boolean {
  return access.status === 'active' && access.appUser.role === 'propriétaire';
}

export function visiblePrivateData<T>(access: AccessState, data: T, empty: T): T {
  return canLoadPrivateBusinessData(access) ? data : empty;
}

export function createRequestEpoch() {
  let current = 0;

  return {
    next() {
      current += 1;
      return current;
    },
    invalidate() {
      current += 1;
    },
    isCurrent(epoch: number) {
      return epoch === current;
    },
  };
}

export function createAuthAccessController(
  onStateChange: (state: AccessState) => void,
  onError: (error: unknown) => void,
) {
  const requestEpoch = createRequestEpoch();
  let state: AccessState = INITIAL_ACCESS_STATE;

  const publish = (nextState: AccessState) => {
    state = nextState;
    onStateChange(nextState);
  };

  const loadProfile = async (
    userId: string,
    fetchProfile: (id: string) => Promise<AppUser | null>,
  ): Promise<{ error: string | null }> => {
    const epoch = requestEpoch.next();
    publish({ status: 'loading-profile' });
    try {
      const profile = await fetchProfile(userId);
      if (!requestEpoch.isCurrent(epoch)) return { error: 'Revalidation annulée' };
      const nextState = resolveProfileAccess(profile);
      publish(nextState);
      if (nextState.status === 'active') return { error: null };
      if (nextState.status === 'profile-missing') return { error: 'Aucun profil applicatif lié' };
      if (nextState.status === 'profile-inactive') return { error: 'Le profil applicatif est désactivé' };
      if (nextState.status === 'role-unknown') return { error: 'Le rôle applicatif n’est pas reconnu' };
      return { error: 'Le profil applicatif ne peut pas être autorisé' };
    } catch (error) {
      onError(error);
      if (!requestEpoch.isCurrent(epoch)) return { error: 'Revalidation annulée' };
      const message = error instanceof Error && error.message
        ? error.message
        : 'Erreur inconnue lors du chargement du profil';
      publish(resolveProfileAccess(null, message));
      return { error: message };
    }
  };

  return {
    getState: () => state,
    loadProfile,
    sessionError(error: string) {
      requestEpoch.invalidate();
      publish({ status: 'session-error', error });
    },
    signedOut() {
      requestEpoch.invalidate();
      publish(SIGNED_OUT_ACCESS_STATE);
    },
    invalidate() {
      requestEpoch.invalidate();
    },
  };
}

export async function loadFundingRowsForAccess<T>(
  access: AccessState,
  fetchRows: () => Promise<T[]>,
  requestEpoch: ReturnType<typeof createRequestEpoch>,
  callbacks: {
    setRows: (rows: T[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    onError: (error: unknown) => void;
  },
) {
  if (!canReadFundings(access)) {
    requestEpoch.invalidate();
    callbacks.setRows([]);
    callbacks.setError(null);
    callbacks.setLoading(false);
    return;
  }

  const epoch = requestEpoch.next();
  callbacks.setRows([]);
  callbacks.setError(null);
  callbacks.setLoading(true);
  try {
    const rows = await fetchRows();
    if (requestEpoch.isCurrent(epoch)) callbacks.setRows(rows);
  } catch (error) {
    if (requestEpoch.isCurrent(epoch)) {
      callbacks.onError(error);
      callbacks.setError(error instanceof Error ? error.message : 'Erreur inconnue de chargement');
    }
  } finally {
    if (requestEpoch.isCurrent(epoch)) callbacks.setLoading(false);
  }
}
