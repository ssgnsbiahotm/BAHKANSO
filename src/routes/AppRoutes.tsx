import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import { RequireAuth, RequireModule } from './authGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Suspense, type ComponentType } from 'react';

// Lazy load all pages
const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LandingPagePrototype = lazy(() => import('@/pages/LandingPagePrototype').then(m => ({ default: m.LandingPagePrototype })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const MentionsLegales = lazy(() => import('@/pages/MentionsLegales').then(m => ({ default: m.MentionsLegales })));
const Confidentialite = lazy(() => import('@/pages/Confidentialite').then(m => ({ default: m.Confidentialite })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const DashboardV2 = lazy(() => import('@/pages/DashboardV2').then(m => ({ default: m.DashboardV2 })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const Configuration = lazy(() => import('@/pages/Configuration').then(m => ({ default: m.Configuration })));
const UsersPage = lazy(() => import('@/pages/UsersPage').then(m => ({ default: m.UsersPage })));
const SurveillancePage = lazy(() => import('@/pages/surveillance/SurveillancePage').then(m => ({ default: m.SurveillancePage })));
const ExploitationModule = lazy(() => import('@/pages/exploitation/ExploitationModule').then(m => ({ default: m.ExploitationModule })));
const ElevageModule = lazy(() => import('@/pages/elevage/ElevageModule').then(m => ({ default: m.ElevageModule })));
const Inventory = lazy(() => import('@/pages/Inventory').then(m => ({ default: m.Inventory })));
const Projects = lazy(() => import('@/pages/Projects').then(m => ({ default: m.Projects })));
const Suppliers = lazy(() => import('@/pages/Suppliers').then(m => ({ default: m.Suppliers })));
const Media = lazy(() => import('@/pages/Media').then(m => ({ default: m.Media })));
const FinanceModule = lazy(() => import('@/modules/Finance').then(m => ({ default: m.FinanceModule })));
const AnimalEventManage = lazy(() => import('@/pages/AnimalEventManage').then(m => ({ default: m.AnimalEventManage })));
const ParcellesPage = lazy(() => import('@/pages/exploitation/ParcellesPage').then(m => ({ default: m.ParcellesPage })));
const SitesPage = lazy(() => import('@/pages/configuration/SitesPage').then(m => ({ default: m.SitesPage })));
const SitesPageSuspense = createSuspenseWrapper(SitesPage);
const RecoltesPage = lazy(() => import('@/pages/exploitation/RecoltesPage').then(m => ({ default: m.RecoltesPage })));
const RecoltesPageSuspense = createSuspenseWrapper(RecoltesPage);

const JournalCulturePage = lazy(() => import("@/pages/exploitation/JournalCulturePage").then(m => ({ default: m.JournalCulturePage })));
const JournalCulturePageSuspense = createSuspenseWrapper(JournalCulturePage);

const LotsPage = lazy(() => import('@/pages/exploitation/LotsPage').then(m => ({ default: m.LotsPage })));
const LotsPageSuspense = createSuspenseWrapper(LotsPage);
const AnimauxPage = lazy(() => import('@/pages/exploitation/AnimauxPage').then(m => ({ default: m.AnimauxPage })));
const AnimauxPageSuspense = createSuspenseWrapper(AnimauxPage);
const BailleursPage = lazy(() => import('@/pages/configuration/BailleursPage').then(m => ({ default: m.BailleursPage })));
const BailleursPageSuspense = createSuspenseWrapper(BailleursPage);

// Clients page
const ClientsPage = lazy(() => import('@/pages/configuration/ClientsPage').then(m => ({ default: m.ClientsPage })));
const ClientsPageSuspense = createSuspenseWrapper(ClientsPage);

// Créer les composants wrapper avec Suspense
function createSuspenseWrapper(Component: ComponentType<Record<string, unknown>>) {
  const Wrapper = () => (
    <Suspense fallback={<PageSkeleton />}>
      <Component />
    </Suspense>
  );
  Wrapper.displayName = `withSuspense(${Component.displayName || Component.name || 'Component'})`;
  return Wrapper;
}

const LandingPageSuspense = createSuspenseWrapper(LandingPage);
const LandingPagePrototypeSuspense = createSuspenseWrapper(LandingPagePrototype);
const LoginPageSuspense = createSuspenseWrapper(LoginPage);
const MentionsLegalesSuspense = createSuspenseWrapper(MentionsLegales);
const ConfidentialiteSuspense = createSuspenseWrapper(Confidentialite);
const DashboardSuspense = createSuspenseWrapper(Dashboard);
const DashboardV2Suspense = createSuspenseWrapper(DashboardV2);
const ProfilePageSuspense = createSuspenseWrapper(ProfilePage);
const ConfigurationSuspense = createSuspenseWrapper(Configuration);
const UsersPageSuspense = createSuspenseWrapper(UsersPage);
const SurveillancePageSuspense = createSuspenseWrapper(SurveillancePage);
const ExploitationModuleSuspense = createSuspenseWrapper(ExploitationModule);
const ElevageModuleSuspense = createSuspenseWrapper(ElevageModule);
const InventorySuspense = createSuspenseWrapper(Inventory);
const ProjectsSuspense = createSuspenseWrapper(Projects);
const SuppliersSuspense = createSuspenseWrapper(Suppliers);
const MediaSuspense = createSuspenseWrapper(Media);
const FinanceModuleSuspense = createSuspenseWrapper(FinanceModule);
const AnimalEventManageSuspense = createSuspenseWrapper(AnimalEventManage);

// Campagnes page
const CampagnesPage = lazy(() => import('@/pages/exploitation/CampagnesPage').then(m => ({ default: m.CampagnesPage })));
const CampagnesPageSuspense = createSuspenseWrapper(CampagnesPage);

const OperationsPage = lazy(() => import('@/pages/exploitation/OperationsPage').then(m => ({ default: m.OperationsPage })));
const OperationsPageSuspense = createSuspenseWrapper(OperationsPage);
const ParcellesPageSuspense = createSuspenseWrapper(ParcellesPage);


const dashboardV2Enabled = localStorage.getItem('bahkanso.dashboard_v2') === 'true';

// eslint-disable-next-line react-refresh/only-export-components
export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <LandingPageSuspense />,
  },
  {
    path: '/prototype',
    element: <LandingPagePrototypeSuspense />,
  },
  {
    path: '/login',
    element: <LoginPageSuspense />,
  },
  {
    path: '/mentions-legales',
    element: <MentionsLegalesSuspense />,
  },
  {
    path: '/confidentialite',
    element: <ConfidentialiteSuspense />,
  },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardSuspense /> },
      { path: 'dashboard', element: <DashboardSuspense /> },
      ...(dashboardV2Enabled
        ? [
            {
              path: 'dashboard-v2',
              element: <DashboardV2Suspense />,
            },
          ]
        : []),
      { path: 'profile', element: <ProfilePageSuspense /> },
      { path: 'settings', element: <Navigate to="/app/configuration" replace /> },
      { path: 'site-content', element: <Navigate to="/app/configuration" replace /> },
      {
        path: 'configuration',
        element: (
          <RequireModule module="configuration" action="read">
            <ConfigurationSuspense />
          </RequireModule>
        ),
      },
      {
        path: 'configuration/clients',
        element: (
          <RequireModule module="configuration" action="read">
            <ClientsPageSuspense />
          </RequireModule>
        ),
      },
      {
        path: 'configuration/bailleurs',
        element: (
          <RequireModule module="configuration" action="read">
            <BailleursPageSuspense />
          </RequireModule>
        ),
      },
      {
        path: 'configuration/sites',
        element: (
          <RequireModule module="configuration" action="read">
            <SitesPageSuspense />
          </RequireModule>
        ),
      },
      {
        path: 'users',
        element: (
          <RequireModule module="users" action="read">
            <UsersPageSuspense />
          </RequireModule>
        ),
      },
      { path: 'reports', element: <Navigate to="/app/surveillance?tab=historique" replace /> },
      { path: 'alerts', element: <Navigate to="/app/surveillance?tab=alertes" replace /> },
      { path: 'audit', element: <Navigate to="/app/surveillance?tab=historique" replace /> },
      {
        path: 'surveillance',
        element: (
          <RequireModule module="surveillance" action="read">
            <SurveillancePageSuspense />
          </RequireModule>
        ),
      },
      { path: 'monitoring', element: <Navigate to="/app/surveillance?tab=alertes" replace /> },
      {
        path: 'exploitation',
        element: (
          <RequireModule module="agriculture" action="read">
            <ExploitationModuleSuspense />
          </RequireModule>
        ),
        children: [
          { index: true, element: <Navigate to="/app/exploitation/parcelles" replace /> },
          {
            path: 'parcelles',
            element: (
              <RequireModule module="agriculture" action="read">
                <ParcellesPageSuspense />
              </RequireModule>
            ),
          },
          {
            path: 'campagnes',
            element: (
              <RequireModule module="agriculture" action="read">
                <CampagnesPageSuspense />
              </RequireModule>
            ),
          },
          {
            path: 'operations',
            element: (
              <RequireModule module="agriculture" action="read">
                <OperationsPageSuspense />
              </RequireModule>
            ),
          },
          {
            path: 'recoltes',
            element: (
              <RequireModule module="agriculture" action="read">
                <RecoltesPageSuspense />
              </RequireModule>
            ),
          },
          {
            path: 'journal/:plotId',
            element: (
              <RequireModule module="agriculture" action="read">
                <JournalCulturePageSuspense />
              </RequireModule>
            ),
          },
        ],
      },
      {
        path: 'elevage',
        element: (
          <RequireModule module="livestock" action="read">
            <ElevageModuleSuspense />
          </RequireModule>
        ),
        children: [
          { index: true, element: <Navigate to="/app/elevage/lots" replace /> },
          {
            path: 'lots',
            element: (
              <RequireModule module="livestock" action="read">
                <LotsPageSuspense />
              </RequireModule>
            ),
          },
          {
            path: 'animaux',
            element: (
              <RequireModule module="livestock" action="read">
                <AnimauxPageSuspense />
              </RequireModule>
            ),
          },
          {
            path: 'evenements',
            element: (
              <RequireModule module="livestock" action="read">
                <AnimalEventManageSuspense />
              </RequireModule>
            ),
          },
        ],
      },
      { path: 'livestock', element: <Navigate to="/app/elevage" replace /> },
      { path: 'livestock/events', element: <Navigate to="/app/elevage?tab=evenements" replace /> },
      {
        path: 'exploitation/lots',
        element: <Navigate to="/app/elevage?tab=lots" replace />,
      },
      {
        path: 'exploitation/animaux',
        element: <Navigate to="/app/elevage?tab=animaux" replace />,
      },
      { path: 'agriculture', element: <Navigate to="/app/exploitation" replace /> },
      { path: 'agriculture/plots', element: <Navigate to="/app/exploitation?tab=parcelles" replace /> },
      { path: 'agriculture/campaigns', element: <Navigate to="/app/exploitation?tab=campagnes" replace /> },
      { path: 'agriculture/operations', element: <Navigate to="/app/exploitation?tab=operations" replace /> },
      { path: 'agriculture/harvests', element: <Navigate to="/app/exploitation?tab=recoltes" replace /> },
      {
        path: 'inventory',
        element: (
          <RequireModule module="inventory" action="read">
            <InventorySuspense />
          </RequireModule>
        ),
      },
      {
        path: 'projects',
        element: (
          <RequireModule module="projects" action="read">
            <ProjectsSuspense />
          </RequireModule>
        ),
      },
      {
        path: 'suppliers',
        element: (
          <RequireModule module="suppliers" action="read">
            <SuppliersSuspense />
          </RequireModule>
        ),
      },
      {
        path: 'media',
        element: (
          <RequireModule module="media" action="read">
            <MediaSuspense />
          </RequireModule>
        ),
      },
      {
        path: 'finance',
        element: (
          <RequireModule module="finance" action="read">
            <FinanceModuleSuspense />
          </RequireModule>
        ),
      },
      {
        path: 'ventes',
        element: <Navigate to="/app/finance?tab=ventes" replace />,
      },
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export function AppRoutes() {
  return <RouterProvider router={appRouter} />;
}
