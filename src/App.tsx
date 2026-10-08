import { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { DataProvider, useData } from '@/lib/DataContext';
import { ToastProvider } from '@/lib/Toast';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { FloatingActionButton } from '@/components/layout/FloatingActionButton';
import { Dashboard } from '@/pages/Dashboard';
import { Fundings } from '@/pages/Fundings';
import { Treasury } from '@/pages/Treasury';
import { Expenses } from '@/pages/Expenses';
import { Documents } from '@/pages/Documents';
import { Agriculture } from '@/pages/Agriculture';
import { Livestock } from '@/pages/Livestock';
import { Projects } from '@/pages/Projects';
import { Inventory } from '@/pages/Inventory';
import { Suppliers } from '@/pages/Suppliers';
import { Reports } from '@/pages/Reports';
import { Alerts } from '@/pages/Alerts';
import { Audit } from '@/pages/Audit';
import { UsersPage } from '@/pages/UsersPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SiteContentEditor } from '@/pages/SiteContentEditor';
import { Recipes } from '@/pages/Recipes';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { LoadingState } from '@/components/ui/EmptyState';

type AppView = 'landing' | 'login' | 'app';

function AppContent() {
  const { appUser, authUser, loading: authLoading } = useAuth();
  const { loading: dataLoading } = useData();
  const [view, setView] = useState<AppView>('landing');
  const [page, setPage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthenticated = !!(authUser && appUser);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingState message="Chargement..." />
      </div>
    );
  }

  if (view === 'landing') {
    return (
      <LandingPage
        onEnter={() => {
          if (isAuthenticated) {
            setView('app');
          } else {
            setView('login');
          }
        }}
        onLogin={() => setView('login')}
      />
    );
  }

  if (view === 'login') {
    if (isAuthenticated) {
      setView('app');
      return null;
    }
    return (
      <LoginPage
        onLogin={() => setView('app')}
        onBack={() => setView('landing')}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={() => setView('app')}
        onBack={() => setView('landing')}
      />
    );
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingState message="Chargement de Bahkanso..." />
      </div>
    );
  }

  const basePage = page.split('?')[0];

  const renderPage = () => {
    switch (basePage) {
      case 'dashboard': return <Dashboard onNavigate={setPage} />;
      case 'fundings': return <Fundings />;
      case 'treasury': return <Treasury />;
      case 'expenses': return <Expenses />;
      case 'documents': return <Documents />;
      case 'agriculture': return <Agriculture />;
      case 'livestock': return <Livestock />;
      case 'projects': return <Projects />;
      case 'inventory': return <Inventory />;
      case 'suppliers': return <Suppliers />;
      case 'reports': return <Reports />;
      case 'alerts': return <Alerts />;
      case 'audit': return <Audit />;
      case 'users': return <UsersPage />;
      case 'settings': return <SettingsPage />;
      case 'profile': return <ProfilePage />;
      case 'site-content': return <SiteContentEditor />;
      case 'recipes': return <Recipes />;
      default: return <Dashboard onNavigate={setPage} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        currentPage={page}
        onNavigate={setPage}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenMobile={() => setMobileOpen(true)} onNavigate={setPage} />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
      <FloatingActionButton onAction={(action) => {
        if (action === 'expense') setPage('expenses?new');
        else if (action === 'document') setPage('documents');
        else if (action === 'activity') setPage('agriculture?operations');
        else if (action === 'stock') setPage('inventory?movements');
        else if (action === 'animal') setPage('livestock?animals');
        else if (action === 'project') setPage('projects');
      }} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
