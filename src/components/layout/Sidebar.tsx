import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/ui/Logo';
import { getAccessibleModules, type ModuleKey, type UserRole } from '@/lib/rbac';
// NOTE: Si l'erreur "Logo is not defined" persiste, redémarrer le serveur de développement pour vider le cache HMR
import {
  LayoutDashboard, Sprout, Beef, Image, Settings, ShieldAlert, X, Briefcase, Users, UserCircle, MapPin,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  module: ModuleKey;
  children?: { id: string; label: string; module: ModuleKey }[];
}

const ALL_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={20} />, module: 'dashboard' },
  { id: 'agriculture', label: 'Exploitation', icon: <Sprout size={20} />, module: 'agriculture', children: [
    { id: 'agriculture?plots', label: 'Parcelles', module: 'agriculture' },
    { id: 'agriculture?campaigns', label: 'Campagnes', module: 'agriculture' },
    { id: 'agriculture?operations', label: 'Opérations', module: 'agriculture' },
    { id: 'agriculture?harvests', label: 'Récoltes', module: 'agriculture' },
  ]},
  { id: 'livestock', label: 'Élevage', icon: <Beef size={20} />, module: 'livestock', children: [
    { id: 'livestock/lots', label: 'Lots', module: 'livestock' },
    { id: 'livestock/animals', label: 'Animaux', module: 'livestock' },
    { id: 'livestock/events', label: 'Événements', module: 'livestock' },
  ]},
  { id: 'finance', label: 'Gestion', icon: <Briefcase size={20} />, module: 'finance', children: [
    { id: 'finance', label: 'Finances', module: 'finance' },
    { id: 'inventory', label: 'Stocks', module: 'inventory' },
    { id: 'projects', label: 'Projets', module: 'projects' },
    { id: 'suppliers', label: 'Fournisseurs', module: 'suppliers' },
  ]},
  { id: 'monitoring', label: 'Surveillance', icon: <ShieldAlert size={20} />, module: 'monitoring', children: [
    { id: 'monitoring', label: 'Alertes', module: 'monitoring' },
    { id: 'surveillance', label: 'Événements', module: 'surveillance' },
  ]},
  { id: 'media', label: 'Médias', icon: <Image size={20} />, module: 'media' },
  { id: 'configuration', label: 'Configuration', icon: <Settings size={20} />, module: 'configuration', children: [
    { id: 'config-general', label: 'Général', module: 'configuration' },
    { id: 'users', label: 'Utilisateurs', module: 'users' },
    { id: 'bailleurs', label: 'Bailleurs', module: 'bailleurs' },
    { id: 'clients', label: 'Clients', module: 'clients' },
    { id: 'sites', label: 'Sites', module: 'configuration' },
  ]},
];

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

  // Fonction pour déterminer si un élément de navigation est actif
  const isNavActive = (navId: string): boolean => {
    return location.pathname.includes(navId.split('?')[0]);
  };

  const handleNav = (page: string) => {
    let target = page;

    const routeMap: Record<string, string> = {
      dashboard: '/app/dashboard',
      finance: '/app/finance',
      agriculture: '/app/agriculture',
      'agriculture?plots': '/app/agriculture/plots',
      'agriculture?campaigns': '/app/agriculture/campaigns',
      'agriculture?operations': '/app/agriculture/operations',
      'agriculture?harvests': '/app/agriculture/harvests',
      livestock: '/app/livestock',
      'livestock/lots': '/app/livestock/lots',
      'livestock/animals': '/app/livestock/animals',
      'livestock/events': '/app/livestock/events',
      projects: '/app/projects',
      inventory: '/app/inventory',
      suppliers: '/app/suppliers',
      media: '/app/media',
      monitoring: '/app/monitoring',
      surveillance: '/app/surveillance',
      users: '/app/users',
      configuration: '/app/configuration',
      bailleurs: '/app/configuration/bailleurs',
      clients: '/app/configuration/clients',
    };

    target = routeMap[page] || `/app/${page}`;
    navigate(target);
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
  }, [supabase]);

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-slate/80 lg:hidden" onClick={onCloseMobile} />
      )}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 bg-slate flex flex-col border-r border-ivory/10
        transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-ivory/10">
          <Logo
            icon={branding.logoIcon || 'Sprout'}
            color="#F4F1E8" // exception logo, cf. design-system
            bgColor="#B9D86B" // exception logo, cf. design-system
            size={40}
            imageUrl={farm?.logo_url}
          />
          <div>
            <h1 className="text-ivory font-bold text-lg leading-tight">{branding.appName || 'Bahkanso'}</h1>
            <p className="text-ivory/70 text-xs">{branding.appTagline || ''}</p>
          </div>
          <button onClick={onCloseMobile} className="ml-auto lg:hidden text-ivory/70">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 scrollbar-thin">
          {NAV_ITEMS.map(item => {
            const isActive = isNavActive(item.id);
            const hasChildren = item.children && item.children.length > 0;
            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (hasChildren) {
                      handleNav(item.id);
                    } else {
                      handleNav(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-hover text-ivory border-l-3 border-signal pl-2'
                      : 'text-ivory/70 hover:bg-slate-hover hover:text-ivory'
                  }`}
                >
                  <span className={isActive ? 'text-ivory' : 'text-ivory/70'}>{item.icon}</span>
                  <span className="flex-1 text-left">
                    {item.label}
                    {item.id === 'surveillance' && alertCount > 0 && (
                      <span className="bg-red-100 text-red-600 rounded px-2 py-1 text-xs ml-1">
                        {alertCount}
                      </span>
                    )}
                  </span>
                </button>
              </div>
            );
          })}
          {/* Site navigation item hardcodé EN DUR entre Utilisateurs et Bailleurs de fonds */}
          <div key="sites">
            <button
              onClick={() => handleNav('configuration/sites')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                isNavActive('configuration/sites')
                  ? 'bg-slate-hover text-ivory border-l-3 border-signal pl-2'
                  : 'text-ivory/70 hover:bg-slate-hover hover:text-ivory'
              }`}
            >
              <span className={isNavActive('configuration/sites') ? 'text-ivory' : 'text-ivory/70'}>
                <MapPin size={20} />
              </span>
              <span className="flex-1 text-left">Sites</span>
            </button>
          </div>
        </nav>
        <div className="px-4 py-3 border-t border-ivory/10">
          <p className="text-xs text-ivory/50 text-center">{branding.footerText || 'Bahkanso v1.0'} — {branding.footerSubtext || ''}</p>
          {appUser && (
            <p className="text-xs text-ivory/50 text-center mt-1 capitalize">
              Rôle : {appUser.role.replace('_', ' ')}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
