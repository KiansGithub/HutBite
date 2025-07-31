import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
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
  deleteAccount: () => Promise<{ error: any | null}>;
  initialize: () => Promise<() => void>;
}

WebBrowser.maybeCompleteAuthSession();
 
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

  signInWithProvider: async (provider) => {
    // 1. Deep-link that brings the user back to the app.
    const redirectTo = makeRedirectUri({ scheme: 'livebites' });

    // 2. Ask Supabase for the provider URL (skip auto-redirect so we handle tokens ourselves)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) return { error };

    // 3. Open SFSafariViewController / Chrome Custom Tab
    const res = await WebBrowser.openAuthSessionAsync(data?.url ?? '', redirectTo);
    if (res.type !== 'success') return { error: { message: 'User cancelled' } };

    // 4. Grab tokens that Supabase put after the # fragment
    const { params } = QueryParams.getQueryParams(res.url);
    const { access_token, refresh_token } = params as Record<string, string>;
    if (!access_token || !refresh_token) return { error: { message: 'No tokens returned' } };

    // 5. Persist the session locally (supabase-js handles storage)
    const { error: setErr } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    return { error: setErr ?? null };
  },

 
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  deleteAccount: async () => {
    const { user } = get();
    if (!user) {
      return { error: { message: 'No user found '}};
    }

    try {
      // Delete user data from database tables 
      const userId = user.id; 

      // Delete user likes 
      const { error: likesError } = await supabase 
          .from('user_likes')
          .delete()
          .eq('user_id', userId);
        
      if (likesError) {
        console.error('Error deleting user likes:', likesError);
      }

      // Delete user account from supabase auth 
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

      // Clear local state 
      set({ user: null, session: null });

      return { error: null };
    } catch (error) {
      console.error('Erorr deleting account:', error);
      return { error };
    }
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
 
    // 1) Restore persisted session (if any)
    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔍 AUTH STORE: Retrieved session:', session);
    set({ session, user: session?.user ?? null });
 
    // 2) Subscribe to future auth events (login, logout, token refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      console.log('🔍 AUTH STORE: Auth state changed:', _event);
      console.log('🔍 AUTH STORE: New session:', sess);
      set({ session: sess ?? null, user: sess?.user ?? null, loading: false });
    });
 
    set({ loading: false });
    console.log('🔍 AUTH STORE: Initialization complete');
 
    // Return unsubscribe for callers that mount/unmount
    return () => sub.subscription.unsubscribe();
  },
}));