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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
 
    if (data.user && data.session) {
      set({ user: data.user, session: data.session });
      // await AnalyticsService.logLogin('email');
      // await AnalyticsService.setUserId(data.user.id);
    } else {
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
    } else {
    }
    return { error };
  },

  signInWithProvider: async (provider) => {
    // 1. Deep-link that brings the user back to the app.
    const redirectTo = makeRedirectUri({ scheme: 'hutbite' });

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
    // IMPORTANT: This function's logic needs to be moved to a Supabase Edge Function.
    // Calling admin functions from the client-side is a major security risk.
    console.warn('deleteAccount must be implemented via a secure Edge Function.');
    // Example: const { error } = await supabase.functions.invoke('delete-user');
    // For now, this function will do nothing to prevent security issues.
    return { error: { message: 'This feature is not securely implemented yet.' } };
  },

  debugAuthState: () => {
    const state = get();
    return state;
  },
 
  initialize: async () => {
    // No need to set loading: true here, onAuthStateChange will handle it.

    // 1) Subscribe to auth events. The callback will be called
    //    immediately with the initial session state.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      set({ session: sess ?? null, user: sess?.user ?? null, loading: false });
    });

    // Return unsubscribe for callers that mount/unmount
    return () => sub.subscription.unsubscribe();
  },
}));