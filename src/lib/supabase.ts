import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Les tokens de session ne doivent pas survivre à la fermeture du navigateur
// ni être accessibles depuis le stockage persistant d'un appareil partagé.
// sessionStorage reste accessible à JavaScript (comme toute SPA), mais limite
// la durée de vie de la session à l'onglet courant.
const authStorageKey = 'bahkanso-auth-session';
const browserSessionStorage = typeof window !== 'undefined' ? window.sessionStorage : undefined;

// Supprimer l'ancien emplacement par défaut utilisé par Supabase JS. On ne lit
// jamais sa valeur : les utilisateurs existants devront se reconnecter une fois.
if (typeof window !== 'undefined') {
  try {
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
    window.localStorage.removeItem(`sb-${projectRef}-auth-token`);
  } catch {
    // Une URL Supabase invalide sera signalée par createClient / la configuration.
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: browserSessionStorage,
    storageKey: authStorageKey,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
