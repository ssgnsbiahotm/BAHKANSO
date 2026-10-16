import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { Configuration } from '@/pages/Configuration';
import { UsersPage } from '@/pages/UsersPage';
import { Monitoring } from '@/pages/Monitoring';
import { Agriculture } from '@/pages/Agriculture';
import { Livestock } from '@/pages/Livestock';
import { Inventory } from '@/pages/Inventory';
import { Treasury } from '@/modules/FinancialManagement/Treasury';
import { Projects } from '@/pages/Projects';
import { Expenses } from '@/modules/FinancialManagement/Expenses';
import { Documents } from '@/modules/FinancialManagement/Documents';
import { Suppliers } from '@/pages/Suppliers';
import { Media } from '@/pages/Media';
import { Fundings } from '@/modules/FinancialManagement/Fundings';
import { FundingCreate } from '@/modules/FinancialManagement/FundingCreate';
import { AnimalManage } from '@/pages/AnimalManage';
import { CashManage } from '@/modules/FinancialManagement/CashManage';
import { DocumentManage } from '@/modules/FinancialManagement/DocumentManage';
import { PlotManage } from '@/pages/PlotManage';
import { CampaignManage } from '@/pages/CampaignManage';
import { RequireAuth } from './authGuard';
import { AppLayout } from '@/components/layout/AppLayout';

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: (
      <LandingPage
        onEnter={() => { void appRouter.navigate('/app'); }}
        onLogin={() => { void appRouter.navigate('/login'); }}
      />
    ),
  },
  {
    path: '/login',
    element: (
      <LoginPage
        onLogin={() => { void appRouter.navigate('/app'); }}
        onBack={() => { void appRouter.navigate('/'); }}
      />
    ),
  },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Dashboard onNavigate={() => {}} /> },
      { path: 'dashboard', element: <Dashboard onNavigate={() => {}} /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'settings', element: <Navigate to="/app/configuration" replace /> },
      { path: 'site-content', element: <Navigate to="/app/configuration" replace /> },
      { path: 'configuration', element: <Configuration /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'reports', element: <Navigate to="/app/monitoring" replace /> },
      { path: 'alerts', element: <Navigate to="/app/monitoring" replace /> },
      { path: 'audit', element: <Navigate to="/app/monitoring" replace /> },
      { path: 'monitoring', element: <Monitoring /> },
      { path: 'agriculture', element: <Agriculture /> },
      { path: 'livestock', element: <Livestock /> },
      { path: 'inventory', element: <Inventory /> },
      { path: 'treasury', element: <Treasury /> },
      { path: 'projects', element: <Projects /> },
      { path: 'expenses', element: <Expenses /> },
      { path: 'documents', element: <Documents /> },
      { path: 'suppliers', element: <Suppliers /> },
      { path: 'media', element: <Media /> },
      { path: 'fundings', element: <Fundings /> },
      { path: 'fundings/new', element: <FundingCreate /> },
      { path: 'livestock/animals', element: <AnimalManage /> },
      { path: 'treasury/cash', element: <CashManage /> },
      { path: 'documents/manage', element: <DocumentManage /> },
      { path: 'agriculture/plots', element: <PlotManage /> },
      { path: 'agriculture/campaigns', element: <CampaignManage /> },
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