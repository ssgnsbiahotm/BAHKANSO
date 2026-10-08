import { useState } from 'react';
import {
  LayoutDashboard, Wallet, Landmark, Receipt, FileText, Sprout,
  Beef, HardHat, Package, Truck, FileBarChart, Bell, ScrollText,
  Users, Settings, ChevronDown, X, Globe, ChefHat,
} from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { Logo } from '@/components/ui/Logo';

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
  { id: 'fundings', label: 'Financements', icon: <Wallet size={20} />, children: [
    { id: 'fundings', label: 'Tous les financements' },
    { id: 'fundings?new', label: 'Nouveau financement' },
    { id: 'fundings?funder', label: 'Sources de financement' },
  ]},
  { id: 'treasury', label: 'Trésorerie', icon: <Landmark size={20} />, children: [
    { id: 'treasury', label: 'Comptes bancaires' },
    { id: 'treasury?cash', label: 'Caisses' },
    { id: 'treasury?movements', label: 'Mouvements' },
  ]},
  { id: 'expenses', label: 'Dépenses', icon: <Receipt size={20} />, children: [
    { id: 'expenses', label: 'Toutes les dépenses' },
    { id: 'expenses?new', label: 'Nouvelle dépense' },
    { id: 'expenses?pending', label: 'En attente' },
    { id: 'expenses?validated', label: 'Validées' },
    { id: 'expenses?rejected', label: 'Rejetées' },
  ]},
  { id: 'documents', label: 'Justificatifs', icon: <FileText size={20} />, children: [
    { id: 'documents', label: 'Tous les documents' },
    { id: 'documents?pending', label: 'À vérifier' },
    { id: 'documents?missing', label: 'Manquants' },
    { id: 'documents?verified', label: 'Vérifiés' },
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
  { id: 'recipes', label: 'Recettes', icon: <ChefHat size={20} /> },
  { id: 'reports', label: 'Rapports', icon: <FileBarChart size={20} /> },
  { id: 'alerts', label: 'Alertes', icon: <Bell size={20} /> },
  { id: 'audit', label: 'Audit', icon: <ScrollText size={20} /> },
  { id: 'users', label: 'Utilisateurs', icon: <Users size={20} /> },
  { id: 'settings', label: 'Paramètres', icon: <Settings size={20} /> },
  { id: 'site-content', label: 'Contenu du site', icon: <Globe size={20} /> },
];

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ currentPage, onNavigate, mobileOpen, onCloseMobile }: SidebarProps) {
  const { siteContent, farm } = useData();
  const [expanded, setExpanded] = useState<string | null>(null);
  const basePage = currentPage.split('?')[0];
  const branding = (siteContent.branding?.value as Record<string, string>) || {};

  const handleNav = (page: string) => {
    onNavigate(page);
    onCloseMobile();
  };

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onCloseMobile} />
      )}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 flex flex-col
        transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50">
          <Logo
            icon={branding.logoIcon || 'Sprout'}
            color={branding.logoColor || '#FFFFFF'}
            bgColor={branding.logoBgColor || '#16A34A'}
            size={40}
            imageUrl={farm?.logo_url}
          />
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">{branding.appName || 'Bahkanso'}</h1>
            <p className="text-slate-400 text-xs">{branding.appTagline || ''}</p>
          </div>
          <button onClick={onCloseMobile} className="ml-auto lg:hidden text-slate-400">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 scrollbar-thin">
          {NAV_ITEMS.map(item => {
            const isActive = basePage === item.id.split('?')[0];
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expanded === item.id || (isActive && expanded === null);
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
                      ? 'bg-green-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
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
                          currentPage === child.id
                            ? 'text-green-400 font-medium'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
        <div className="px-4 py-3 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 text-center">{branding.footerText || 'Bahkanso v1.0'} — {branding.footerSubtext || ''}</p>
        </div>
      </aside>
    </>
  );
}
