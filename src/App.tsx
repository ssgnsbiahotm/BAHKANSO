import { AuthProvider } from '@/lib/AuthContext';
import { DataProvider } from '@/lib/DataContext';
import { ToastProvider } from '@/lib/Toast';
import { AppRoutes } from '@/routes/AppRoutes';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <DataProvider>
          <AppRoutes />
        </DataProvider>
      </AuthProvider>
    </ToastProvider>
  );
}