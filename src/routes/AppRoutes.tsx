import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { Configuration } from '@/pages/Configuration';
import { UsersPage } from '@/pages/UsersPage';
import { Monitoring } from '@/pages/Monitoring';
import { Agriculture } from '@/pages/Agriculture';
import { Livestock } from '@/pages/Livestock';
import { Inventory } from '@/pages/Inventory';
// import { Treasury } from '@/modules/FinancialManagement/Treasury'; // Supprimé dans le cadre de la refonte financière
import { Projects } from '@/pages/Projects';
// import { Expenses } from '@/modules/FinancialManagement/Expenses'; // Supprimé dans le cadre de la refonte financière
// import { Documents } from '@/modules/FinancialManagement/Documents'; // Supprimé dans le cadre de la refonte financière
import { Suppliers } from '@/pages/Suppliers';
import { Media } from '@/pages/Media';
// import { Fundings } from '@/modules/FinancialManagement/Fundings'; // Supprimé dans le cadre de la refonte financière
// import { FundingCreate } from '@/modules/FinancialManagement/FundingCreate'; // Supprimé dans le cadre de la refonte financière
import { AnimalManage } from '@/pages/AnimalManage';
// import { CashManage } from '@/modules/FinancialManagement/CashManage'; // Supprimé dans le cadre de la refonte financière
// import { DocumentManage } from '@/modules/FinancialManagement/DocumentManage'; // Supprimé dans le cadre de la refonte financière
import { AnimalLotManage } from '@/pages/AnimalLotManage';
import { AnimalEventManage } from '@/pages/AnimalEventManage';
import { PlotManage } from '@/pages/PlotManage';
import { CampaignManage } from '@/pages/CampaignManage';
import { HarvestManage } from '@/pages/HarvestManage';
import { CropOperationManage } from '@/pages/CropOperationManage';
import { RequireAuth } from './authGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { FinanceModule } from '@/modules/Finance';

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: (
      <LoginPage
        onLogin={() => { void appRouter.navigate('/app/dashboard'); }}
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
      { index: true, element: <Dashboard /> },
      { path: 'dashboard', element: <Dashboard /> },
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
      { path: 'projects', element: <Projects /> },
      { path: 'suppliers', element: <Suppliers /> },
      { path: 'media', element: <Media /> },
      { path: 'finance', element: <FinanceModule /> },
      { path: 'livestock/animals', element: <AnimalManage /> },
      { path: 'livestock/lots', element: <AnimalLotManage /> },
      { path: 'livestock/events', element: <AnimalEventManage /> },
      { path: 'agriculture/plots', element: <PlotManage /> },
      { path: 'agriculture/campaigns', element: <CampaignManage /> },
      { path: 'agriculture/harvests', element: <HarvestManage /> },
      { path: 'agriculture/operations', element: <CropOperationManage /> },
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