import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import type { Site } from './types';
import type { UserRole } from './rbac';

interface SimpleSite {
  id: string;
  name: string;
  code: string | null;
}

interface SiteContextType {
  currentSiteId: string | null;
  setCurrentSiteId: (id: string | null) => void;
  availableSites: SimpleSite[];
  currentSite: SimpleSite | null;
  isGlobalView: boolean;
}

export const SiteContext = createContext<SiteContextType | null>(null);

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}

// Rôles site-scoped — doivent obligatoirement avoir un site_id.
// Cross-site exemptés : administrateur, propriétaire, financeur.
const SITE_REQUIRED_ROLES: ReadonlyArray<UserRole> = [
  'gestionnaire',
  'comptable',
  'responsable_agricole',
  'responsable_élevage',
  'responsable_chantier',
  'chef_chantier',
  'auditeur',
];

function NoSiteAssignedScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
        <p className="text-4xl mb-4" aria-hidden="true">⚠️</p>
        <h1 className="text-xl font-semibold mb-2">Aucun site assigné</h1>
        <p className="text-gray-600 mb-6">
          Votre compte n'est rattaché à aucun site.
          Contactez votre administrateur pour finaliser la configuration.
        </p>
        <button
          type="button"
          onClick={() => { window.location.href = '/login'; }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const { appUser } = useAuth();
  const { sites } = useData();
  const [currentSiteId, setCurrentSiteIdState] = useState<string | null>(null);

  const availableSites: SimpleSite[] = useMemo(
    () => (sites || []).map((s: Site) => ({
      id: s.id,
      name: s.name,
      code: s.code ?? null,
    })),
    [sites],
  );

  const isAdmin = appUser?.role === 'administrateur' || appUser?.role === 'propriétaire';

  const requiresSite = !!appUser
    && !appUser.site_id
    && SITE_REQUIRED_ROLES.includes(appUser.role as UserRole);

  useEffect(() => {
    if (!isAdmin) {
      // Non-admins pinnés sur leur propre site — localStorage ignoré pour
      // éviter qu'un user voie les données d'un autre site via manipulation.
      setCurrentSiteIdState(appUser?.site_id || null);
      return;
    }
    const stored = localStorage.getItem('bahkanso.currentSiteId');
    setCurrentSiteIdState(
      stored && availableSites.some(s => s.id === stored) ? stored : null,
    );
  }, [appUser, isAdmin, availableSites]);

  const setCurrentSiteId = useCallback((id: string | null) => {
    if (!isAdmin) {
      setCurrentSiteIdState(appUser?.site_id || null);
      return;
    }
    setCurrentSiteIdState(id);
    if (id) {
      localStorage.setItem('bahkanso.currentSiteId', id);
    } else {
      localStorage.removeItem('bahkanso.currentSiteId');
    }
  }, [isAdmin, appUser?.site_id]);

  const currentSite = useMemo(
    () => (currentSiteId
      ? availableSites.find(s => s.id === currentSiteId) || null
      : null),
    [currentSiteId, availableSites],
  );

  const isGlobalView = currentSiteId === null && isAdmin;

  const value = useMemo<SiteContextType>(
    () => ({
      currentSiteId,
      setCurrentSiteId,
      availableSites,
      currentSite,
      isGlobalView,
    }),
    [currentSiteId, setCurrentSiteId, availableSites, currentSite, isGlobalView],
  );

  if (requiresSite) {
    return <NoSiteAssignedScreen />;
  }

  return (
    <SiteContext.Provider value={value}>
      {children}
    </SiteContext.Provider>
  );
}
