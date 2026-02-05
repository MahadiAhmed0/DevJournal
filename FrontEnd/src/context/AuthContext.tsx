import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { authApi } from '@/lib/axios';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Extract a human-readable message from Supabase or Axios errors */
function getErrorMessage(error: unknown): string {
  // Supabase AuthError
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as AuthError).message;
  }
  // Axios error with backend message
  if (error && typeof error === 'object' && 'response' in error) {
    const res = (error as { response?: { data?: { message?: string } } }).response;
    if (res?.data?.message) {
      return Array.isArray(res.data.message) ? res.data.message[0] : res.data.message;
    }
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session from localStorage
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      // Authenticate directly with Supabase — the returned session JWT is
      // what the backend SupabaseAuthGuard validates on every request.
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Session & user are set by the onAuthStateChange listener above.
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    try {
      // Call backend /auth/signup which creates the Supabase user with
      // username metadata and validates username uniqueness.
      await authApi.signUp({ email, password, username });

      // Now sign in via Supabase client to establish the local session.
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
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
