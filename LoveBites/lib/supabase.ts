import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.SUPABASE_URL; 
const supabaseAnonKey = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
    public: {
        Tables: {
            restaurants: {
                Row: {
                  id: string;
                  name: string;
                  description: string;
                  image_url: string;
                  order_links: Record<string, string>;
                  created_at: string;
                };
                Insert: {
                  id?: string;
                  name: string;
                  description: string;
                  image_url: string;
                  order_links: Record<string, string>;
                  created_at?: string;
                };
                Update: {
                  id?: string;
                  name?: string;
                  description?: string;
                  image_url?: string;
                  order_links?: Record<string, string>;
                  created_at?: string;
                };
              };
              menu_items: {
                Row: {
                  id: string;
                  restaurant_id: string;
                  name: string;
                  description: string;
                  price: number;
                  video_url: string;
                  created_at: string;
                };
                Insert: {
                  id?: string;
                  restaurant_id: string;
                  name: string;
                  description: string;
                  price: number;
                  video_url: string;
                  created_at?: string;
                };
                Update: {
                  id?: string;
                  restaurant_id?: string;
                  name?: string;
                  description?: string;
                  price?: number;
                  video_url?: string;
                  created_at?: string;
                };
              };
            };
          };
        };
    
