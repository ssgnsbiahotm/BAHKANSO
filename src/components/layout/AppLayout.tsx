import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { FloatingActionButton } from '@/components/layout/FloatingActionButton';

// Libellés de page affichés dans l'en-tête, cohérents avec la Sidebar et le breadcrumb.
const PAGE_TITLES: Record<string, string> = {
  '/app/dashboard': 'Tableau de bord',
  '/app/exploitation': 'Exploitation agricole',
  '/app/elevage': 'Élevage',
  '/app/finance': 'Gestion financière',
  '/app/surveillance': 'Surveillance',
  '/app/configuration': 'Configuration',
  '/app/users': 'Utilisateurs',
  '/app/media': 'Médiathèque',
  '/app/profile': 'Mon profil',
};

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] || '';

  return (
    <div data-theme="app" className="flex min-h-screen bg-page">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-page">
        <Header
          onOpenMobile={() => setMobileOpen(true)}
          pageTitle={pageTitle}
        />
        <Breadcrumb />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      {location.pathname !== '/app/agriculture/plots' && (
        <FloatingActionButton
          onAction={(action) => {
            // À implémenter selon les besoins spécifiques après inspection du contrat
            console.log('Action:', action);
          }}
        />
      )}
    </div>
  );
}
