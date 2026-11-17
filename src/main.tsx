import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

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
