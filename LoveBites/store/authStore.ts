import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
 
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
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
    }
 
    return { error };
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