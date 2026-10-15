import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { UsersPage } from '@/pages/UsersPage';
import { Reports } from '@/pages/Reports';
import { Alerts } from '@/pages/Alerts';
import { Audit } from '@/pages/Audit';
import { Agriculture } from '@/pages/Agriculture';
import { Livestock } from '@/pages/Livestock';
import { Inventory } from '@/pages/Inventory';
import { Treasury } from '@/pages/Treasury';
import { Projects } from '@/pages/Projects';
import { Expenses } from '@/pages/Expenses';
import { Documents } from '@/pages/Documents';
import { Suppliers } from '@/pages/Suppliers';
import { Recipes } from '@/pages/Recipes';
import { SiteContentEditor } from '@/pages/SiteContentEditor';
import { Fundings } from '@/pages/Fundings';
import { FundingCreate } from '@/pages/FundingCreate';
import { AnimalManage } from '@/pages/AnimalManage';
import { CashManage } from '@/pages/CashManage';
import { DocumentManage } from '@/pages/DocumentManage';
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
      { path: 'settings', element: <SettingsPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'reports', element: <Reports /> },
      { path: 'alerts', element: <Alerts /> },
      { path: 'audit', element: <Audit /> },
      { path: 'agriculture', element: <Agriculture /> },
      { path: 'livestock', element: <Livestock /> },
      { path: 'inventory', element: <Inventory /> },
      { path: 'treasury', element: <Treasury /> },
      { path: 'projects', element: <Projects /> },
      { path: 'expenses', element: <Expenses /> },
      { path: 'documents', element: <Documents /> },
      { path: 'suppliers', element: <Suppliers /> },
      { path: 'recipes', element: <Recipes /> },
      { path: 'site-content', element: <SiteContentEditor /> },
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