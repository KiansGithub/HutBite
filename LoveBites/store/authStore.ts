import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
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
    console.log('🔍 SIGN IN: Starting sign in with email:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('🔍 SIGN IN: Response data:', data);
    console.log('🔍 SIGN IN: Response error:', error);
    console.log('🔍 SIGN IN: User from response:', data?.user);
    console.log('🔍 SIGN IN: Session from response:', data?.session);
 
    if (data.user && data.session) {
      console.log('🔍 SIGN IN: Setting user and session in store');
      set({ user: data.user, session: data.session });
      console.log('🔍 SIGN IN: Store updated successfully');
      // await AnalyticsService.logLogin('email');
      // await AnalyticsService.setUserId(data.user.id);
    } else {
      console.log('🔍 SIGN IN: No user or session in response');
    }
 
    return { error };
  },
 
  signUp: async (email: string, password: string) => {
    console.log('🔍 SIGN UP: Starting sign up with email:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log('🔍 SIGN UP: Response data:', data);
      console.log('🔍 SIGN UP: Response error:', error);
      console.log('🔍 SIGN UP: User from response:', data?.user);
      console.log('🔍 SIGN UP: Session from response:', data?.session);
 
    if (data.user && data.session) {
      console.log('🔍 SIGN UP: Setting user and session in store');
      set({ user: data.user, session: data.session });
      console.log('🔍 SIGN UP: Store updated successfully');
      // await AnalyticsService.logSignUp('email');
      // await AnalyticsService.setUserId(data.user.id);
    } else {
      console.log('🔍 SIGN UP: No user or session in response');
    }
    return { error };
  },

  signInWithProvider: async (provider: 'google' | 'apple') => {
    try {
      const { makeRedirectUri } = await import('expo-auth-session');
      const WebBrowser = await import('expo-web-browser');
      const Linking = await import('expo-linking');
 
      // Use the custom scheme for production, exp:// for development
      const redirectTo = 'livebites://auth/callback';
 
      console.log('Redirect URI:', redirectTo);
 
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });
 
      if (error) {
        console.error('OAuth initiation error:', error);
        return { error };
      }
 
      if (data?.url) {
        console.log('Opening OAuth URL:', data.url);
 
        const result = await WebBrowser.openAuthSessionAsync(
          data.url, 
          redirectTo, 
          { showInRecents: false }
        );
        console.log('[OAUTH] WebBrowser result →', result);

        // 2️⃣ If the user cancelled, bail out early
      if (result.type !== 'success') {
        return { error: { message: 'User cancelled' } };
      }

          // 3️⃣ The deep-link URL (with tokens) is right here:
        const redirectURL = result.url;
        console.log('[OAUTH] redirectURL →', redirectURL);

        const { params } = QueryParams.getQueryParams(redirectURL);
        console.log('[TOKENS] →', params)
 
        if (result.type === 'success' || result.type === 'cancel') {
          // Wait for the session to be established
          await new Promise(resolve => setTimeout(resolve, 2000));
 
          const { data: sessionData, error: setErr } = await supabase.auth.setSession({
            access_token: params.access_token, 
            refresh_token: params.refresh_token,
          });
          console.log('[SET-SESSION] data →', sessionData, 'err →', setErr);

          if (setErr) {
            return { error: setErr };
          }

          set({
            user: sessionData.session.user, 
            session: sessionData.session,
          });
          console.log('[AUTH] Signed in 🎉');
          return { error: null };
        } else {
          console.log('OAuth cancelled or failed:', result);
          return { error: { message: 'Authentication was cancelled' } };
        }
      }
 
      return { error: { message: 'No OAuth URL received' } };
    } catch (err) {
      console.error('OAuth error:', err);
      return { error: { message: 'Authentication failed. Please try again.' } };
    }
  },
 
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  debugAuthState: () => {
    const state = get();
    console.log('🔍 AUTH STORE STATE:');
    console.log('  User:', state.user);
    console.log('  Session:', state.session);
    console.log('  Loading:', state.loading);
    return state;
  },
 
  initialize: async () => {
    console.log('🔍 AUTH STORE: Starting initialization...');
    set({ loading: true });
 
    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔍 AUTH STORE: Retrieved session:', session);
    console.log('🔍 AUTH STORE: Session user:', session?.user);
 
    if (session) {
      console.log('🔍 AUTH STORE: Setting user from session');
      set({ user: session.user, session });
    } else {
      console.log('🔍 AUTH STORE: No session found');
    }
 
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔍 AUTH STORE: Auth state changed:', event);
      console.log('🔍 AUTH STORE: New session:', session);
      console.log('🔍 AUTH STORE: New user:', session?.user);
      set({
        user: session?.user ?? null,
        session,
        loading: false
      });
    });
 
    set({ loading: false });

    console.log('🔍 AUTH STORE: Initialization complete');
  },
}));