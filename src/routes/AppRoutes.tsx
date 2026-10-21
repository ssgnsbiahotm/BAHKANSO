import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import { RequireAuth, RequireModule } from './authGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Suspense, type ComponentType, type PropsWithChildren } from 'react';
import type { ModuleKey, PermissionAction } from '@/lib/rbac';

// Lazy load all pages
const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const MentionsLegales = lazy(() => import('@/pages/MentionsLegales').then(m => ({ default: m.MentionsLegales })));
const Confidentialite = lazy(() => import('@/pages/Confidentialite').then(m => ({ default: m.Confidentialite })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const Configuration = lazy(() => import('@/pages/Configuration').then(m => ({ default: m.Configuration })));
const UsersPage = lazy(() => import('@/pages/UsersPage').then(m => ({ default: m.UsersPage })));
const Monitoring = lazy(() => import('@/pages/Monitoring').then(m => ({ default: m.Monitoring })));
const Surveillance = lazy(() => import('@/pages/Surveillance').then(m => ({ default: m.Surveillance })));
const Agriculture = lazy(() => import('@/pages/Agriculture').then(m => ({ default: m.Agriculture })));
const Livestock = lazy(() => import('@/pages/Livestock').then(m => ({ default: m.Livestock })));
const Inventory = lazy(() => import('@/pages/Inventory').then(m => ({ default: m.Inventory })));
const Projects = lazy(() => import('@/pages/Projects').then(m => ({ default: m.Projects })));
const Suppliers = lazy(() => import('@/pages/Suppliers').then(m => ({ default: m.Suppliers })));
const Media = lazy(() => import('@/pages/Media').then(m => ({ default: m.Media })));
const FinanceModule = lazy(() => import('@/modules/Finance').then(m => ({ default: m.FinanceModule })));
const SalesModule = lazy(() => import('@/modules/Sales').then(m => ({ default: m.SalesModule })));
const AnimalManage = lazy(() => import('@/pages/AnimalManage').then(m => ({ default: m.AnimalManage })));
const AnimalLotManage = lazy(() => import('@/pages/AnimalLotManage').then(m => ({ default: m.AnimalLotManage })));
const AnimalEventManage = lazy(() => import('@/pages/AnimalEventManage').then(m => ({ default: m.AnimalEventManage })));
const PlotManage = lazy(() => import('@/pages/PlotManage').then(m => ({ default: m.PlotManage })));
const CampaignManage = lazy(() => import('@/pages/CampaignManage').then(m => ({ default: m.CampaignManage })));
const HarvestManage = lazy(() => import('@/pages/HarvestManage').then(m => ({ default: m.HarvestManage })));
const CropOperationManage = lazy(() => import('@/pages/CropOperationManage').then(m => ({ default: m.CropOperationManage })));

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
const LoginPageSuspense = createSuspenseWrapper(LoginPage);
const MentionsLegalesSuspense = createSuspenseWrapper(MentionsLegales);
const ConfidentialiteSuspense = createSuspenseWrapper(Confidentialite);
const DashboardSuspense = createSuspenseWrapper(Dashboard);
const ProfilePageSuspense = createSuspenseWrapper(ProfilePage);
const ConfigurationSuspense = createSuspenseWrapper(Configuration);
const UsersPageSuspense = createSuspenseWrapper(UsersPage);
const MonitoringSuspense = createSuspenseWrapper(Monitoring);
const SurveillanceSuspense = createSuspenseWrapper(Surveillance);
const AgricultureSuspense = createSuspenseWrapper(Agriculture);
const LivestockSuspense = createSuspenseWrapper(Livestock);
const InventorySuspense = createSuspenseWrapper(Inventory);
const ProjectsSuspense = createSuspenseWrapper(Projects);
const SuppliersSuspense = createSuspenseWrapper(Suppliers);
const MediaSuspense = createSuspenseWrapper(Media);
const FinanceModuleSuspense = createSuspenseWrapper(FinanceModule);
const SalesModuleSuspense = createSuspenseWrapper(SalesModule);
const AnimalManageSuspense = createSuspenseWrapper(AnimalManage);
const AnimalLotManageSuspense = createSuspenseWrapper(AnimalLotManage);
const AnimalEventManageSuspense = createSuspenseWrapper(AnimalEventManage);
const PlotManageSuspense = createSuspenseWrapper(PlotManage);
const CampaignManageSuspense = createSuspenseWrapper(CampaignManage);
const HarvestManageSuspense = createSuspenseWrapper(HarvestManage);
const CropOperationManageSuspense = createSuspenseWrapper(CropOperationManage);

// eslint-disable-next-line react-refresh/only-export-components
export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <LandingPageSuspense />,
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
        path: 'users',
        element: (
          <RequireModule module="users" action="read">
            <UsersPageSuspense />
          </RequireModule>
        ),
      },
      { path: 'reports', element: <Navigate to="/app/monitoring" replace /> },
      { path: 'alerts', element: <Navigate to="/app/monitoring" replace /> },
      { path: 'audit', element: <Navigate to="/app/monitoring" replace /> },
      {
        path: 'monitoring',
        element: (
          <RequireModule module="monitoring" action="read">
            <MonitoringSuspense />
          </RequireModule>
        ),
      },
      {
        path: 'surveillance',
        element: (
          <RequireModule module="surveillance" action="read">
            <SurveillanceSuspense />
          </RequireModule>
        ),
      },
      {
        path: 'agriculture',
        element: (
          <RequireModule module="agriculture" action="read">
            <AgricultureSuspense />
          </RequireModule>
        ),
      },
      {
        path: 'agriculture/plots',
        element: (
          <RequireModule module="agriculture" action="read">
            <PlotManageSuspense />
          </RequireModule>
        ),
      },
      {
        path: 'agriculture/campaigns',
        element: (
          <RequireModule module="agriculture" action="read">
            <CampaignManageSuspense />
          </RequireModule>
        ),
      },
      {
        path: 'agriculture/operations',
        element: (
          <RequireModule module="agriculture" action="read">
            <CropOperationManageSuspense />
          </RequireModule>
        ),
      },
      {
        path: 'agriculture/harvests',
        element: (
          <RequireModule module="agriculture" action="read">
            <HarvestManageSuspense />
          </RequireModule>
        ),
      },
      {
        path: 'livestock',
        element: (
          <RequireModule module="livestock" action="read">
            <LivestockSuspense />
          </RequireModule>
        ),
      },
      {
        path: 'livestock/lots',
        element: (
          <RequireModule module="livestock" action="read">
            <AnimalLotManageSuspense />
          </RequireModule>
        ),
      },
      {
        path: 'livestock/animals',
        element: (
          <RequireModule module="livestock" action="read">
            <AnimalManageSuspense />
          </RequireModule>
        ),
      },
      {
        path: 'livestock/events',
        element: (
          <RequireModule module="livestock" action="read">
            <AnimalEventManageSuspense />
          </RequireModule>
        ),
      },
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
        element: (
          <RequireModule module="ventes" action="read">
            <SalesModuleSuspense />
          </RequireModule>
        ),
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