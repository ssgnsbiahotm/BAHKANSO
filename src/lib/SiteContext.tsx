import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import type { Site } from './types';

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

const SiteContext = createContext<SiteContextType | null>(null);

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const { appUser } = useAuth();
  const { sites } = useData();
  const [currentSiteId, setCurrentSiteIdState] = useState<string | null>(null);

  const availableSites: SimpleSite[] = (sites || []).map((s: Site) => ({
    id: s.id,
    name: s.name,
    code: s.code ?? null,
  }));

  const isAdmin = appUser?.role === 'administrateur' || appUser?.role === 'propriétaire';

  useEffect(() => {
    const stored = localStorage.getItem('bahkanso.currentSiteId');
    if (stored && availableSites.some(s => s.id === stored)) {
      setCurrentSiteIdState(stored);
    } else if (!isAdmin && appUser?.site_id) {
      setCurrentSiteIdState(appUser.site_id);
    } else {
      setCurrentSiteIdState(null);
    }
  }, [appUser, isAdmin, availableSites.length]);

  const setCurrentSiteId = (id: string | null) => {
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
  };

  const currentSite = currentSiteId
    ? availableSites.find(s => s.id === currentSiteId) || null
    : null;

  const isGlobalView = currentSiteId === null && isAdmin;

  return (
    <SiteContext.Provider
      value={{
        currentSiteId,
        setCurrentSiteId,
        availableSites,
        currentSite,
        isGlobalView,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}
