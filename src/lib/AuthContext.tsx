import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { AppUser } from './types';

interface AuthContextType {
  session: Session | null;
  authUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
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

  const loadAppUser = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('auth_id', uid)
      .maybeSingle();
    if (error) {
      console.error('Error loading app user:', error);
      return;
    }
    if (data) {
      setAppUser(data as AppUser);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadAppUser(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthUser(newSession?.user ?? null);
      if (newSession?.user) {
        (async () => {
          await loadAppUser(newSession.user.id);
          await supabase.from('app_users')
            .update({ last_login: new Date().toISOString() })
            .eq('auth_id', newSession.user.id);
        })();
      } else {
        setAppUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadAppUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { error: error.message };
    if (data.user) {
      await supabase.from('app_users')
        .update({ name })
        .eq('auth_id', data.user.id);
    }
    return { error: null };
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
