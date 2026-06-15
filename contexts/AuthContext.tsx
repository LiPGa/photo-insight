import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_CALLBACK_PATH = '/auth/callback';

function getOAuthRedirectUrl() {
  return new URL(AUTH_CALLBACK_PATH, window.location.origin).toString();
}

function cleanAuthCallbackUrl() {
  const { pathname, search, hash } = window.location;
  const isAuthCallback = pathname === AUTH_CALLBACK_PATH;
  const hasAuthParams = search.includes('code=') || search.includes('error=') || hash.includes('access_token=');

  if (isAuthCallback || hasAuthParams) {
    window.history.replaceState({}, document.title, window.location.origin);
  }
}

function clearStoredAuthTokens() {
  try {
    const keysToRemove = Object.keys(localStorage).filter((key) => (
      key === 'photoinsight-auth' ||
      key === 'supabase.auth.token' ||
      (key.startsWith('sb-') && key.endsWith('-auth-token'))
    ));

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Failed to clear stored auth tokens:', error);
  }
}

function isRecoverableAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  return (
    message.includes('Invalid Refresh Token') ||
    message.includes('Refresh Token Not Found') ||
    message.includes('AuthRetryableFetchError') ||
    message.includes('Failed to fetch') ||
    message.includes('NetworkError')
  );
}

async function recoverFromBadAuthSession(error: unknown) {
  console.warn('Recovering from invalid auth session:', error);
  clearStoredAuthTokens();
  await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        if (isRecoverableAuthError(error)) {
          await recoverFromBadAuthSession(error);
        }
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session) {
        cleanAuthCallbackUrl();
      }
    }).catch(async (error) => {
      if (isRecoverableAuthError(error)) {
        await recoverFromBadAuthSession(error);
      }
      setSession(null);
      setUser(null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session) {
          cleanAuthCallbackUrl();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getOAuthRedirectUrl(),
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearStoredAuthTokens();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
