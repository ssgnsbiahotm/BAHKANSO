import { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { DataProvider, useData } from '@/lib/DataContext';
import { canReadFundings } from '@/lib/access';
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
  const { appUser, authUser, accessState, signOut } = useAuth();
  const { loading: dataLoading, error: dataError, refresh } = useData();
  const [view, setView] = useState<AppView>('landing');
  const [page, setPage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthenticated = accessState.status === 'active' && !!(authUser && appUser);

  if (accessState.status === 'loading-session' || accessState.status === 'loading-profile') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingState message="Chargement..." />
      </div>
    );
  }

  const accessMessage = (() => {
    switch (accessState.status) {
      case 'profile-error':
        return `Impossible de vérifier votre habilitation : ${accessState.error}`;
      case 'session-error':
        return `Impossible de charger la session : ${accessState.error}`;
      case 'profile-missing':
        return 'Aucun profil applicatif n’est lié à ce compte. Contactez l’administrateur.';
      case 'profile-inactive':
        return 'Ce profil est désactivé. Contactez l’administrateur.';
      case 'role-unknown':
        return `Le rôle « ${accessState.role} » n’est pas reconnu. Contactez l’administrateur.`;
      default:
        return null;
    }
  })();

  if (accessMessage && (authUser || accessState.status === 'session-error')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-lg rounded-xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Accès non disponible</h1>
          <p className="mt-3 text-sm text-slate-600">{accessMessage}</p>
          <button
            onClick={() => {
              if (authUser) {
                void signOut()
                  .then(() => setView('landing'))
                  .catch(error => console.error('Error signing out:', error));
              } else {
                setView('landing');
              }
            }}
            className="mt-6 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white"
          >
            {authUser ? 'Fermer la session' : 'Retour'}
          </button>
        </div>
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

  if (accessState.status !== 'active') return null;
  const activeUser = accessState.appUser;

  if (page === 'profile') {
    return (
      <div>
        <div className="border-b bg-white px-4 py-3">
          <button
            onClick={() => setPage('dashboard')}
            className="text-sm font-medium text-green-700 hover:underline"
          >
            Retour à l’état d’habilitation
          </button>
        </div>
        <ProfilePage />
      </div>
    );
  }

  if (!canReadFundings(accessState)) {
    const message = activeUser.role === 'administrateur'
      ? 'Les écrans d’administration des comptes et habilitations ne sont pas encore reliés à une procédure contrôlée. Aucune donnée métier n’a été chargée.'
      : activeUser.role === 'financeur'
        ? 'Votre lien entre compte, profil financeur et financements n’est pas configuré. Aucun accès métier global ne sera accordé.'
        : ['responsable_agricole', 'responsable_élevage', 'responsable_chantier'].includes(activeUser.role)
          ? 'Votre périmètre opérationnel n’est pas configuré. Aucun accès métier global ne sera accordé.'
          : 'Les autorisations par domaine et opération ne sont pas encore appliquées dans l’interface. Aucune donnée métier n’a été chargée.';
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-lg rounded-xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Habilitation ou périmètre non configuré</h1>
          <p className="mt-3 text-sm text-slate-600">{message}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => setPage('profile')}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Mon profil
            </button>
            <button
              onClick={() => {
                void signOut()
                  .then(() => setView('landing'))
                  .catch(error => console.error('Error signing out:', error));
              }}
              className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white"
            >
              Fermer la session
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingState message="Chargement de Bahkanso..." />
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-lg rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Données métier indisponibles</h1>
          <p className="mt-3 text-sm text-slate-600">
            Les données privées n’ont pas pu être chargées. Aucun écran métier ne sera affiché.
          </p>
          <p className="mt-2 break-words text-xs text-slate-500">{dataError}</p>
          <button
            onClick={refresh}
            className="mt-6 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (activeUser.role === 'propriétaire') {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="flex items-center justify-between border-b bg-white px-4 py-3">
          <div>
            <p className="font-semibold text-slate-900">BAHKANSO</p>
            <p className="text-xs text-slate-500">Espace propriétaire · lecture seule</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">{activeUser.name}</span>
            <button
              onClick={() => setPage(page === 'profile' ? 'fundings' : 'profile')}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              {page === 'profile' ? 'Financements' : 'Mon profil'}
            </button>
            <button
              onClick={() => {
                void signOut().catch(error => console.error('Error signing out:', error));
              }}
              className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white"
            >
              Déconnexion
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-2 py-3 lg:px-4">
          {page === 'profile' ? <ProfilePage /> : <Fundings />}
        </main>
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
    <div className="app-shell flex min-h-screen">
      <Sidebar
        currentPage={page}
        onNavigate={setPage}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenMobile={() => setMobileOpen(true)} onNavigate={setPage} />
        <main className="app-content flex-1 overflow-y-auto px-2 py-3 lg:px-4">
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
