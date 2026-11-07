import { useNavigate, useLocation } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/ui/Logo';
import { getAccessibleModules, type ModuleKey, type UserRole } from '@/lib/rbac';
// NOTE: Si l'erreur "Logo is not defined" persiste, redémarrer le serveur de développement pour vider le cache HMR
import {
  LayoutDashboard, Sprout, Beef, Image, Settings, ShieldAlert, X, Briefcase, Truck,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  module: ModuleKey;
  route: string;
}

// Une entrée par module. Les onglets internes (finance, surveillance, configuration…)
// restent gérés par les pages mères via ?tab= ; la Sidebar ne les duplique pas.
const ALL_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={20} />, module: 'dashboard', route: '/app/dashboard' },
  { id: 'exploitation', label: 'Exploitation', icon: <Sprout size={20} />, module: 'agriculture', route: '/app/exploitation' },
  { id: 'elevage', label: 'Élevage', icon: <Beef size={20} />, module: 'livestock', route: '/app/elevage' },
  { id: 'finance', label: 'Gestion financière', icon: <Briefcase size={20} />, module: 'finance', route: '/app/finance' },
  { id: 'suppliers', label: 'Fournisseurs', icon: <Truck size={20} />, module: 'suppliers', route: '/app/suppliers' },
  { id: 'surveillance', label: 'Surveillance', icon: <ShieldAlert size={20} />, module: 'surveillance', route: '/app/surveillance' },
  { id: 'media', label: 'Médiathèque', icon: <Image size={20} />, module: 'media', route: '/app/media' },
  { id: 'configuration', label: 'Configuration', icon: <Settings size={20} />, module: 'configuration', route: '/app/configuration' },
  { id: 'users', label: 'Utilisateurs', icon: <Settings size={20} />, module: 'users', route: '/app/users' },
  { id: 'bailleurs', label: 'Bailleurs', icon: <Settings size={20} />, module: 'bailleurs', route: '/app/configuration/bailleurs' },
  { id: 'clients', label: 'Clients', icon: <Settings size={20} />, module: 'clients', route: '/app/configuration/clients' },
  { id: 'sites', label: 'Sites', icon: <Image size={20} />, module: 'configuration', route: '/app/configuration/sites' },
];

const ROUTE_BY_ID: Record<string, string> = {};
for (const item of ALL_NAV_ITEMS) {
  ROUTE_BY_ID[item.id] = item.route;
}

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { siteContent, farm } = useData();
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const branding = (siteContent.branding?.value as Record<string, string>) || {};
  const [alertCount, setAlertCount] = useState(0);

  // Filtrer les éléments de navigation selon les permissions du rôle
  const userRole = appUser?.role as UserRole;
  const accessibleModules = getAccessibleModules(userRole);
  const NAV_ITEMS = ALL_NAV_ITEMS.filter(item => accessibleModules.includes(item.module));

  // L'item actif est celui dont la route correspond exactement, ou, à défaut,
  // le module parent dont la route est le plus long préfixe de l'URL courante.
  const activeItem = useMemo(() => {
    const exact = NAV_ITEMS.find(item => item.route === location.pathname);
    if (exact) return exact;
    const prefixes = NAV_ITEMS.filter(item => location.pathname.startsWith(item.route + '/'));
    return prefixes.reduce((best, cur) => (cur.route.length > best.route.length ? cur : best), prefixes[0]);
  }, [NAV_ITEMS, location.pathname]);

  // Fonction pour naviguer vers une page
  const handleNav = (route: string) => {
    navigate(route);
    onCloseMobile();
  };

  useEffect(() => {
    async function fetchAlertCount() {
      try {
        const { data: alerts, error } = await supabase
          .from('alerts')
          .select('status')
          .eq('status', 'ouverte');

        if (error) throw error;
        setAlertCount(alerts?.length || 0);
      } catch (err) {
        console.error('Erreur récupération alertes:', err);
        setAlertCount(0);
      }
    }
    fetchAlertCount();
  }, []);

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-surface/80 lg:hidden" onClick={onCloseMobile} />
      )}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 bg-surface flex flex-col border-r border-default/10
        transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-default/10">
          <Logo
            icon={branding.logoIcon || 'Sprout'}
            color="#F4F1E8"
            bgColor="#B9D86B"
            size={40}
            imageUrl={farm?.logo_url}
          />
          <div>
            <div className="text-primary font-bold text-lg leading-tight">{branding.appName || 'Bahkanso'}</div>
            <p className="text-primary/70 text-xs">{branding.appTagline || ''}</p>
          </div>
          <button onClick={onCloseMobile} className="ml-auto lg:hidden text-primary/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal" aria-label="Fermer le menu">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 scrollbar-thin">
          {NAV_ITEMS.map(item => {
            const isActive = activeItem?.id === item.id;
            return (
              <div key={item.id}>
                <button
                  onClick={() => handleNav(item.route)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-inset ${
                    isActive
                      ? 'bg-surface-hover text-primary border-l-3 border-signal pl-2'
                      : 'text-primary/70 hover:bg-surface-hover hover:text-primary'
                  }`}
                >
                  <span className={isActive ? 'text-primary' : 'text-primary/70'}>
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left">
                    {item.label}
                    {item.id === 'surveillance' && alertCount > 0 && (
                      <span className="bg-danger-soft text-danger rounded px-2 py-1 text-xs ml-1">
                        {alertCount}
                      </span>
                    )}
                  </span>
                </button>
              </div>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-default/10">
          <p className="text-xs text-primary/50 text-center">{branding.footerText || 'Bahkanso v1.0'} — {branding.footerSubtext || ''}</p>
          {appUser && (
            <p className="text-xs text-primary/50 text-center mt-1 capitalize">
              Rôle : {appUser.role.replace('_', ' ')}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
