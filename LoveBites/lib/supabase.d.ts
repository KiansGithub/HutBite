export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
 
export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          order_links: Json | null
          longitude: number
          latitude: number 
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          order_links?: Json | null
          longitude?: number 
          latitude?: number
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          order_links?: Json | null
          longitude?: number 
          latitude?: number
        }
      }
      menu_items: {
        Row: {
          id: string
          created_at: string
          restaurant_id: string
          title: string
          description: string | null
          price: number
          video_url: string | null
          thumb_url: string | null;
        }
        Insert: {
          id?: string
          created_at?: string
          restaurant_id: string
          title: string
          description?: string | null
          price: number
          video_url?: string | null
          thumb_url?: string | null; 
        }
        Update: {
          id?: string
          created_at?: string
          restaurant_id?: string
          title?: string
          description?: string | null
          price?: number
          video_url?: string | null
          thumb_url?: string | null; 
        }
      }
      user_likes: {
        Row: {
          id: string 
          created_at: string 
          user_id: string 
          restaurant_id: string 
          menu_item_id: string
        }
        Insert: {
          id?: string 
          created_at?: string 
          user_id: string 
          restaurant_id: string 
          menu_item_id: string
        }
        Update: {
          id?: string 
          created_at?: string 
          user_id?: string 
          restaurant_id?: string 
          menu_item_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}