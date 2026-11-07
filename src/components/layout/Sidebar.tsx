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
  ChevronDown, ChevronRight,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  module: ModuleKey;
  route?: string;
  children?: NavItem[];
}

// Une entrée par module. Les onglets internes (finance, surveillance, configuration…)
// restent gérés par les pages mères via ?tab= ; la Sidebar ne les duplique pas.
const ALL_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={20} />, module: 'dashboard', route: '/app/dashboard' },
  { id: 'exploitation', label: 'Exploitation', icon: <Sprout size={20} />, module: 'agriculture', route: '/app/exploitation' },
  { id: 'elevage', label: 'Élevage', icon: <Beef size={20} />, module: 'livestock', route: '/app/elevage' },
  {
    id: 'finance',
    label: 'Gestion financière',
    icon: <Briefcase size={20} />,
    module: 'finance',
    route: '/app/finance',
    children: [
      { id: 'finance-overview', label: 'Vue d\'ensemble', icon: <Briefcase size={16} />, module: 'finance', route: '/app/finance' },
      { id: 'inventory', label: 'Stocks', icon: <Image size={16} />, module: 'inventory', route: '/app/inventory' },
      { id: 'projects', label: 'Projets', icon: <Image size={16} />, module: 'projects', route: '/app/projects' },
      { id: 'suppliers', label: 'Fournisseurs', icon: <Truck size={16} />, module: 'suppliers', route: '/app/suppliers' },
    ],
  },
  {
    id: 'surveillance',
    label: 'Surveillance',
    icon: <ShieldAlert size={20} />,
    module: 'surveillance',
    route: '/app/surveillance',
    children: [
      { id: 'surveillance-alerts', label: 'Alertes', icon: <ShieldAlert size={16} />, module: 'surveillance', route: '/app/surveillance?tab=alertes' },
      { id: 'surveillance-events', label: 'Événements', icon: <ShieldAlert size={16} />, module: 'surveillance', route: '/app/surveillance?tab=evenements' },
    ],
  },
  { id: 'media', label: 'Médiathèque', icon: <Image size={20} />, module: 'media', route: '/app/media' },
  {
    id: 'configuration',
    label: 'Configuration',
    icon: <Settings size={20} />,
    module: 'configuration',
    route: '/app/configuration',
    children: [
      { id: 'config-general', label: 'Général', icon: <Settings size={16} />, module: 'configuration', route: '/app/configuration' },
      { id: 'users', label: 'Utilisateurs', icon: <Settings size={16} />, module: 'users', route: '/app/users' },
      { id: 'bailleurs', label: 'Bailleurs', icon: <Settings size={16} />, module: 'bailleurs', route: '/app/configuration/bailleurs' },
      { id: 'clients', label: 'Clients', icon: <Settings size={16} />, module: 'clients', route: '/app/configuration/clients' },
      { id: 'sites', label: 'Sites', icon: <Image size={16} />, module: 'configuration', route: '/app/configuration/sites' },
    ],
  },
];

const ROUTE_BY_ID: Record<string, string> = {};
for (const item of ALL_NAV_ITEMS) {
  if (item.route) ROUTE_BY_ID[item.id] = item.route;
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

  // Détermine si une route correspond à l'URL courante (gère les query strings)
  const isPathActive = (route: string): boolean => {
    const base = route.split('?')[0];
    if (location.pathname === base) return true;
    if (location.pathname.startsWith(base + '/')) return true;
    return false;
  };

  const isItemActive = (item: NavItem): boolean => {
    if (!item.route) return false;
    return isPathActive(item.route);
  };

  const isChildActive = (parent: NavItem): boolean => {
    return parent.children?.some(child => isItemActive(child)) ?? false;
  };

  // État d'expansion des items avec children
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    const expanded = new Set<string>();
    ALL_NAV_ITEMS.forEach(item => {
      if (item.children?.some(child => child.route && isPathActive(child.route))) {
        expanded.add(item.id);
      }
    });
    return expanded;
  });

  // Auto-expand quand l'URL change
  useEffect(() => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      ALL_NAV_ITEMS.forEach(item => {
        if (item.children?.some(child => child.route && isPathActive(child.route))) {
          next.add(item.id);
        }
      });
      return next;
    });
  }, [location.pathname, location.search]);

  // Filtrer les éléments de navigation selon les permissions du rôle
  const userRole = appUser?.role as UserRole;
  const accessibleModules = getAccessibleModules(userRole);
  const NAV_ITEMS = ALL_NAV_ITEMS.filter(item => accessibleModules.includes(item.module));

  // Fonction pour naviguer vers une page
  const handleNav = (route: string) => {
    navigate(route);
    onCloseMobile();
  };

  // Bascule l'expansion d'un item parent
  const toggleItem = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
            const isActive = isItemActive(item);
            const isExpanded = expandedItems.has(item.id);
            const hasChildren = item.children && item.children.length > 0;
            return (
              <div key={item.id} className="space-y-0.5">
                {hasChildren ? (
                  <button
                    onClick={() => toggleItem(item.id)}
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
                    <ChevronDown size={16} className={`ml-2 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (item.route) handleNav(item.route);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-inset ${
                      isActive
                        ? 'bg-surface-hover text-primary border-l-3 border-signal pl-2'
                        : 'text-primary/70 hover:bg-surface-hover hover:text-primary'
                    }`}
                  >
                    <span className={isActive ? 'text-primary' : 'text-primary/70'}>
                      {item.icon}
                    </span>
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                )}
                {hasChildren && isExpanded && (
                  <div className="ml-3 space-y-0.5">
                    {item.children!.map(child => {
                      const childActive = isItemActive(child);
                      return (
                        <div key={child.id}>
                          {child.route && (
                            <button
                              onClick={() => {
                                if (child.route) handleNav(child.route);
                              }}
                            className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-primary/70 hover:text-primary hover:bg-surface-hover transition-colors ${
                              childActive ? 'bg-surface-hover text-primary' : ''
                            }`}
                          >
                            <span>
                              <ChevronRight size={14} className="mr-1.5 shrink-0" />
                            </span>
                            <span className="flex-1 text-left">{child.label}</span>
                          </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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
