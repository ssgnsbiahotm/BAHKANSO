/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { AppUser } from './types';
import { AccessState, createAuthAccessController } from './access';

interface AuthContextType {
  session: Session | null;
  authUser: User | null;
  appUser: AppUser | null;
  accessState: AccessState;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  refreshAppUser: () => Promise<{ error: string | null }>;
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
  const [, setAccessState] = useState<AccessState>({ status: 'loading-session' });
  const controllerRef = useRef<ReturnType<typeof createAuthAccessController> | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = createAuthAccessController(
      setAccessState,
      error => console.error('Error loading app user:', error),
    );
  }
  const accessController = controllerRef.current;
  const accessState = accessController.getState();

  const fetchProfile = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('auth_id', uid)
      .maybeSingle();
    if (error) throw error;
    return data as AppUser | null;
  }, []);

  useEffect(() => {
    let sessionEvents = 0;
    let mounted = true;
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      sessionEvents += 1;
      setSession(newSession);
      setAuthUser(newSession?.user ?? null);
      if (newSession?.user) {
        void accessController.loadProfile(newSession.user.id, fetchProfile);
      } else {
        accessController.signedOut();
      }
    });

    const initialSessionEvents = sessionEvents;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted || sessionEvents !== initialSessionEvents) return;
      if (error) {
        console.error('Error loading auth session:', error);
        accessController.sessionError(error.message || 'Erreur de chargement de la session');
        return;
      }
      const initialSession = data.session;
      setSession(initialSession);
      setAuthUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        void accessController.loadProfile(initialSession.user.id, fetchProfile);
      } else {
        accessController.signedOut();
      }
    }).catch(error => {
      if (!mounted || sessionEvents !== initialSessionEvents) return;
      console.error('Error loading auth session:', error);
      accessController.sessionError(
        error instanceof Error ? error.message : 'Erreur inconnue lors du chargement de la session',
      );
    });

    return () => {
      mounted = false;
      accessController.invalidate();
      authListener.subscription.unsubscribe();
    };
  }, [accessController, fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    accessController.signedOut();
    setSession(null);
    setAuthUser(null);
  }, [accessController]);

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
    if (!authUser) return { error: 'Aucune session active' };
    return accessController.loadProfile(authUser.id, fetchProfile);
  }, [accessController, authUser, fetchProfile]);

  const appUser = accessState.status === 'active' ? accessState.appUser : null;

  return (
    <AuthContext.Provider value={{
      session, authUser, appUser, accessState,
      signIn, signOut, resetPassword, updatePassword, refreshAppUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
