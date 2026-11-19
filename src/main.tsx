import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

// Supprimer le cache API privé créé par les anciennes versions du service
// worker. Les réponses Supabase ne doivent pas être conservées dans Cache Storage.
if (typeof window !== 'undefined' && 'caches' in window) {
  void window.caches.delete('supabase-api');
}

registerSW({
  immediate: true,
  onNeedRefresh() {
    window.location.reload();
  },
  onOfflineReady() {
    console.log('App prête offline');
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Elément racine #root introuvable');
}
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
