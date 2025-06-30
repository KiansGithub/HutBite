import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
// import { AnalyticsService } from '@/lib/analytics';
 
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithProvider: (
    provider: 'google' | 'apple'
  ) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}
 
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
 
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
 
    if (data.user && data.session) {
      set({ user: data.user, session: data.session });
      // await AnalyticsService.logLogin('email');
      // await AnalyticsService.setUserId(data.user.id);
    }
 
    return { error };
  },
 
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
 
    if (data.user && data.session) {
      set({ user: data.user, session: data.session });
      // await AnalyticsService.logSignUp('email');
      // await AnalyticsService.setUserId(data.user.id);
    }
    return { error };
  },

  signInWithProvider: async (provider: 'google' | 'apple') => {
    try {
      const { makeRedirectUri } = await import('expo-auth-session');
      const WebBrowser = await import('expo-web-browser');
 
      const redirectTo = makeRedirectUri();
      console.log('Redirect URI:', redirectTo);
 
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
 
      if (error) {
        console.error('OAuth initiation error:', error);
        return { error };
      }
 
      if (data?.url) {
        console.log('Opening OAuth URL:', data.url);
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
 
        console.log('OAuth result:', result);
 
        if (result.type === 'success') {
          // Wait a moment for the session to be established
          await new Promise(resolve => setTimeout(resolve, 1000));
 
          // Try to get the session multiple times if needed
          let attempts = 0;
          let session = null;
 
          while (attempts < 5 && !session) {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
 
            if (sessionError) {
              console.error('Session error:', sessionError);
              return { error: sessionError };
            }
 
            if (sessionData.session) {
              session = sessionData.session;
              break;
            }
 
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 500));
          }
 
          if (session) {
            console.log('OAuth success, setting session');
            set({ user: session.user, session });
            return { error: null };
          } else {
            console.error('No session found after OAuth');
            return { error: { message: 'Authentication completed but no session found' } };
          }
        } else {
          console.log('OAuth cancelled or failed:', result);
          return { error: { message: 'OAuth flow cancelled or failed' } };
        }
      }
 
      return { error: { message: 'No OAuth URL received' } };
    } catch (err) {
      console.error('OAuth error:', err);
      return { error: { message: 'OAuth flow failed' } };
    }
  },
 
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },
 
  initialize: async () => {
    set({ loading: true });
 
    const { data: { session } } = await supabase.auth.getSession();
 
    if (session) {
      set({ user: session.user, session });
    }
 
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user ?? null,
        session,
        loading: false
      });
    });
 
    set({ loading: false });
  },
}));