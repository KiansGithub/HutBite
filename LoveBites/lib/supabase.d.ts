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
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          order_links?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          order_links?: Json | null
        }
      }
      menu_items: {
        Row: {
          id: string
          created_at: string
          restaurant_id: string
          name: string
          description: string | null
          price: number
          video_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          restaurant_id: string
          name: string
          description?: string | null
          price: number
          video_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          restaurant_id?: string
          name?: string
          description?: string | null
          price?: number
          video_url?: string | null
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