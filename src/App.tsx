import { AuthProvider } from '@/lib/AuthContext';
import { DataProvider } from '@/lib/DataContext';
import { ToastProvider } from '@/lib/Toast';
import { AppRoutes } from '@/routes/AppRoutes';
import { SmoothScroll } from '@/components/ui/SmoothScroll';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {

  return (
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DataProvider>
            <SmoothScroll>
            <AppRoutes />
          </SmoothScroll>
          </DataProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ToastProvider>
  );
}
