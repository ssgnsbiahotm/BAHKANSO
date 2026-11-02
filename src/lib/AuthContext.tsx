import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { AppUser } from './types';
import { logAudit } from './types';

interface AuthContextType {
  session: Session | null;
  authUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null; emailRequiresConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  refreshAppUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [appUserLoading, setAppUserLoading] = useState(false);

  const loadAppUser = useCallback(async (uid: string): Promise<AppUser | null> => {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('auth_id', uid)
      .maybeSingle();
    if (error) {
      console.error('Error loading app user:', error);
      return null;
    }
    setAppUser(data as AppUser);
    return data as AppUser;
  }, []);

  const resolveAppUser = useCallback(async (uid: string) => {
    setAppUserLoading(true);
    const user = await loadAppUser(uid);
    if (!user) setAppUser(null);
    setAppUserLoading(false);
    return user;
  }, [loadAppUser]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setSession(data.session);
      setAuthUser(data.session?.user ?? null);
      if (data.session?.user) {
        await resolveAppUser(data.session.user.id);
      }
      if (!cancelled) setLoading(false);
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (cancelled) return;
      setSession(newSession);
      setAuthUser(newSession?.user ?? null);
      if (newSession?.user) {
        await resolveAppUser(newSession.user.id);
        await supabase.from('app_users')
          .update({ last_login: new Date().toISOString() })
          .eq('auth_id', newSession.user.id);
      } else {
        setAppUser(null);
        setAppUserLoading(false);
      }
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, [resolveAppUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    // Recharger appUser immédiatement après le login pour que RequireAuth
    // puisse autoriser l'accès sans dépendre d'un setTimeout artificiel.
    const newUser = data?.user ?? null;
    setAuthUser(newUser);
    if (newUser) await resolveAppUser(newUser.id);
    return { error: null };
  }, [resolveAppUser]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { error: error.message };

    // Le trigger handle_new_user() crée déjà la ligne app_users avec le nom
    // depuis raw_user_meta_data. Pas besoin d'un update supplémentaire depuis
    // le client (évite les blocages RLS si l'email confirmation est requise
    // et qu'aucune session n'est encore établie).

    // Journal d'audit (best effort, ne bloque pas l'inscription si ça échoue)
    try {
      if (data.user) {
        await logAudit(
          name,
          'user_signup',
         'app_users',
          data.user.id,
          `Nouveau compte créé : ${email}`
        );
      }
    } catch {
      // Ignore audit errors during signup
    }

    return {
      error: null,
      emailRequiresConfirmation: data.user ? !data.user.email_confirmed_at : false,
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAppUser(null);
    setSession(null);
    setAuthUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const refreshAppUser = useCallback(async () => {
    if (authUser) await loadAppUser(authUser.id);
  }, [authUser, loadAppUser]);

  return (
    <AuthContext.Provider value={{
      session, authUser, appUser, loading,
      signIn, signUp, signOut, resetPassword, updatePassword, refreshAppUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
