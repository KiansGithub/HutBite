import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';
import { Database } from './supabase';

const supabaseUrl = Constants.expoConfig?.extra?.SUPABASE_URL!; 
const supabaseAnonKey = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY!; 
if (!supabaseUrl || !supabaseAnonKey) throw new Error('Missing Supabase envs');

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Use AsyncStorage on native for session persistence 
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage }: {}), 
        persistSession: true, 
        autoRefreshToken: true, 
        detectSessionInUrl: false, 
    },
});

// Keep refresh only when app is active (battery friendly)