import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
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
      // Build a native/HTTPS deep-link redirect URI
      const redirectUri = makeRedirectUri({ scheme: 'livebites', path: '/auth/callback' });
      console.log('Redirect URI:', redirectUri);

      // Initiate OAuth
      const { data, error: initError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectUri },
      });
      if (initError) {
        console.error('OAuth init failed:', initError);
        return { error: initError };
      }

      // Open the browser for user sign-in
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
      if (result.type !== 'success') {
        return { error: { message: 'User cancelled or failed to authenticate' } };
      }

      // Parse the tokens from the redirect URL
      const { params } = QueryParams.getQueryParams(result.url);
      const { error: setErr } = await supabase.auth.setSession({
        access_token: params.access_token!, 
        refresh_token: params.refresh_token!,
      });
      if (setErr) {
        console.error('setSession error:', setErr);
        return { error: setErr };
      }

      // Success! onAuthStateChange will fire automatically
      return { error: null };
    } catch (err) {
      console.error('Unexpected OAuth error:', err);
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