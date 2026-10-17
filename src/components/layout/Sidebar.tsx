import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '@/lib/DataContext';
import { Logo } from '@/components/ui/Logo';
// NOTE: Si l'erreur "Logo is not defined" persiste, redémarrer le serveur de développement pour vider le cache HMR
import {
  LayoutDashboard, Wallet, Landmark, Receipt, FileText, Sprout,
  Beef, HardHat, Package, Truck, FileBarChart, Bell, ScrollText,
  Users, Settings, ChevronDown, X, ChefHat, Image, Layout,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: { id: string; label: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={20} />, children: [
    { id: 'dashboard', label: 'Vue générale' },
    { id: 'dashboard?funder', label: 'Vue financeur' },
    { id: 'dashboard?alerts', label: 'Alertes' },
    { id: 'dashboard?activity', label: 'Activité récente' },
  ]},
  { id: 'finance', label: 'Finances', icon: <Wallet size={20} />, children: [
    { id: 'finance?tab=treasury', label: 'Trésorerie' },
    { id: 'finance?tab=fundings', label: 'Financements' },
    { id: 'finance?tab=expenses', label: 'Dépenses' },
    { id: 'finance?tab=documents', label: 'Justificatifs' },
  ]},
  { id: 'agriculture', label: 'Agriculture', icon: <Sprout size={20} />, children: [
    { id: 'agriculture', label: 'Exploitations' },
    { id: 'agriculture?plots', label: 'Parcelles' },
    { id: 'agriculture?campaigns', label: 'Campagnes' },
    { id: 'agriculture?operations', label: 'Opérations' },
    { id: 'agriculture?harvests', label: 'Récoltes' },
  ]},
  { id: 'livestock', label: 'Élevage', icon: <Beef size={20} />, children: [
    { id: 'livestock', label: 'Cheptel' },
    { id: 'livestock?lots', label: 'Lots' },
    { id: 'livestock?animals', label: 'Animaux' },
    { id: 'livestock?health', label: 'Santé animale' },
    { id: 'livestock?events', label: 'Événements' },
  ]},
  { id: 'projects', label: 'Projets & Chantiers', icon: <HardHat size={20} />, children: [
    { id: 'projects', label: 'Tous les projets' },
    { id: 'projects?ongoing', label: 'En cours' },
    { id: 'projects?completed', label: 'Terminés' },
  ]},
  { id: 'inventory', label: 'Stocks', icon: <Package size={20} />, children: [
    { id: 'inventory', label: 'Inventaire' },
    { id: 'inventory?movements', label: 'Mouvements' },
    { id: 'inventory?counts', label: 'Inventaires physiques' },
  ]},
  { id: 'suppliers', label: 'Fournisseurs', icon: <Truck size={20} /> },
  { id: 'media', label: 'Médias', icon: <Image size={20} /> },
  { id: 'monitoring', label: 'Surveillance', icon: <Layout size={20} />, children: [
    { id: 'monitoring', label: 'Tableau de bord' },
    { id: 'monitoring?audit', label: 'Audit' },
    { id: 'monitoring?alertes', label: 'Alertes' },
    { id: 'monitoring?rapports', label: 'Rapports' },
  ]},
  { id: 'users', label: 'Utilisateurs', icon: <Users size={20} /> },
  { id: 'configuration', label: 'Configuration', icon: <Settings size={20} /> },
];

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { siteContent, farm } = useData();
  const [expanded, setExpanded] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const branding = (siteContent.branding?.value as Record<string, string>) || {};

  // Fonction pour déterminer si un élément de navigation est actif
  const isNavActive = (navId: string): boolean => {
    // Cette fonction devra être améliorée pour prendre en compte les paramètres d'URL
    // Pour l'instant, on utilise une approche simplifiée
    return location.pathname.includes(navId.split('?')[0]);
  };

  const handleNav = (page: string) => {
    navigate(page);
    onCloseMobile();
  };

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onCloseMobile} />
      )}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 bg-white flex flex-col border-r border-slate-200
        transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200/50">
          <Logo
            icon={branding.logoIcon || 'Sprout'}
            color={branding.logoColor || '#FFFFFF'}
            bgColor={branding.logoBgColor || '#16A34A'}
            size={40}
            imageUrl={farm?.logo_url}
          />
          <div>
            <h1 className="text-slate-900 font-bold text-lg leading-tight">{branding.appName || 'Bahkanso'}</h1>
            <p className="text-slate-600 text-xs">{branding.appTagline || ''}</p>
          </div>
          <button onClick={onCloseMobile} className="ml-auto lg:hidden text-slate-600">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 scrollbar-thin">
          {NAV_ITEMS.map(item => {
            const isActive = isNavActive(item.id);
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expanded === item.id;
            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (hasChildren) {
                      setExpanded(prev => prev === item.id ? null : item.id);
                    } else {
                      handleNav(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-green-100 text-green-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className={isActive ? 'text-green-700' : 'text-slate-600'}>{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {hasChildren && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>
                {hasChildren && isExpanded && (
                  <div className="ml-6 mt-0.5 space-y-0.5 border-l border-slate-700/50 pl-3">
                    {item.children!.map(child => (
                      <button
                        key={child.id}
                        onClick={() => handleNav(child.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${
                          // Pour les sous-éléments, on vérifie si le chemin actuel contient l'ID
                          location.pathname.includes(child.id.split('?')[0])
                            ? 'text-green-700 font-medium'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-slate-200/50">
          <p className="text-xs text-slate-500 text-center">{branding.footerText || 'Bahkanso v1.0'} — {branding.footerSubtext || ''}</p>
        </div>
      </aside>
    </>
  );
}
