import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

import { registerPushToken } from '@/lib/push-notifications';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/database';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextValue {
  session: Session | null;
  profile: User | null;
  /** Whether the role-specific worker_profiles/employer_profiles row exists yet. Null while unknown. */
  hasProfileDetails: boolean | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [hasProfileDetails, setHasProfileDetails] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error) {
      console.warn('Failed to load user profile:', error.message);
      setProfile(null);
      setHasProfileDetails(null);
      return;
    }
    setProfile(data as User);
    registerPushToken(userId).catch((err) => console.warn('Failed to register push token:', err));

    if (data.role === 'worker' || data.role === 'employer') {
      const table = data.role === 'employer' ? 'employer_profiles' : 'worker_profiles';
      const { data: details } = await supabase.from(table).select('user_id').eq('user_id', userId).maybeSingle();
      setHasProfileDetails(!!details);
    } else {
      setHasProfileDetails(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession?.user) {
        fetchProfile(initialSession.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
        setHasProfileDetails(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUpWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const redirectTo = makeRedirectUri({ scheme: 'extraisler', path: 'auth/callback' });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data?.url) throw new Error('Google OAuth URL alınamadı.');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !result.url) return;

    const url = new URL(result.url.replace('#', '?'));
    const accessToken = url.searchParams.get('access_token');
    const refreshToken = url.searchParams.get('refresh_token');
    if (accessToken && refreshToken) {
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (setSessionError) throw setSessionError;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const refreshProfile = async () => {
    // Reads the live user instead of the closured `session` state: called
    // right after actions like signup that update auth state asynchronously,
    // a stale closure here would silently skip the refresh.
    const { data } = await supabase.auth.getUser();
    if (data.user) await fetchProfile(data.user.id);
  };

  const value: AuthContextValue = {
    session,
    profile,
    hasProfileDetails,
    loading,
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
