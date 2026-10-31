import { AuthProvider } from '@/lib/AuthContext';
import { DataProvider, useData } from '@/lib/DataContext';
import { SiteProvider } from '@/lib/SiteContext';
import { ToastProvider } from '@/lib/Toast';
import { AppRoutes } from '@/routes/AppRoutes';
import { SmoothScroll } from '@/components/ui/SmoothScroll';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function FaviconProvider() {
  const { farm } = useData();

  useEffect(() => {
    // Remove any existing dynamic favicon links
    const existingLinks = document.querySelectorAll('link[rel="icon"][data-dynamic="true"]');
    existingLinks.forEach(link => link.remove());

    // Also handle apple-touch-icon
    const existingAppleLinks = document.querySelectorAll('link[rel="apple-touch-icon"][data-dynamic="true"]');
    existingAppleLinks.forEach(link => link.remove());

    // Preload link
    const existingPreload = document.querySelector('link[rel="preload"][as="image"][data-dynamic="true"]');
    if (existingPreload) existingPreload.remove();

    if (!farm?.favicon_url) {
      // Fallback to default logo.svg
      const defaultLink = document.createElement('link');
      defaultLink.rel = 'icon';
      defaultLink.type = 'image/svg+xml';
      defaultLink.href = '/logo.svg';
      defaultLink.setAttribute('data-dynamic', 'true');
      document.head.appendChild(defaultLink);
      return;
    }

    const faviconUrl = farm.favicon_url;

    // Determine type based on URL extension
    const getFaviconType = (url: string) => {
      if (url.endsWith('.svg')) return 'image/svg+xml';
      if (url.endsWith('.png')) return 'image/png';
      if (url.endsWith('.ico')) return 'image/x-icon';
      return 'image/svg+xml';
    };
    const faviconType = getFaviconType(faviconUrl);

    // Main favicon
    const iconLink = document.createElement('link');
    iconLink.rel = 'icon';
    iconLink.href = faviconUrl;
    iconLink.type = faviconType;
    iconLink.setAttribute('data-dynamic', 'true');
    document.head.appendChild(iconLink);

    // Apple touch icon (180x180)
    const appleLink = document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    appleLink.setAttribute('sizes', '180x180');
    appleLink.href = faviconUrl;
    appleLink.type = faviconType;
    appleLink.setAttribute('data-dynamic', 'true');
    document.head.appendChild(appleLink);

    // Preload for performance
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'image';
    preloadLink.type = faviconType;
    preloadLink.fetchPriority = 'high';
    preloadLink.href = faviconUrl;
    preloadLink.setAttribute('data-dynamic', 'true');
    document.head.appendChild(preloadLink);
  }, [farm?.favicon_url]);

  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DataProvider>
            <SiteProvider>
              <SmoothScroll>
                <FaviconProvider />
                <AppRoutes />
              </SmoothScroll>
            </SiteProvider>
          </DataProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ToastProvider>
  );
}
