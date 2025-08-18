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
          cuisines: string[]
          place_id: string | null
          google_rating: number | null
          google_review_count: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          order_links?: Json | null
          longitude?: number 
          latitude?: number
          cuisines?: string[]
          place_id: string | null
          google_rating: number | null
          google_review_count: number | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          order_links?: Json | null
          longitude?: number 
          latitude?: number
          cuisines?: string[]
          place_id: string | null
          google_rating: number | null
          google_review_count: number | null
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
      click_events: {
        Row: {
          id: string 
          created_at: string 
          user_id: string | null 
          restaurant_id: string | null 
          menu_item_id: string | null 
          platform: string | null 
          url: string | null 
          timestamp: string 
        }
        Insert: {
          id?: string 
          created_at?: string 
          user_id?: string | null 
          restaurant_id?: string | null 
          menu_item_id?: string | null 
          platform?: string | null 
          url?: string | null 
          timestamp?: string
        }
        Update: {
          id?: string 
          created_at?: string | null 
          restaurant_id?: string | null 
          menu_item_id?: string | null 
          platform?: string | null 
          url?: string | null 
          timestamp?: string 
        }
      }
      user_profiles: {
        Row: {
          id: string 
          user_id: string 
          handle: string | null 
          display_name: string | null 
          avatar_url: string | null 
          bio: string | null 
          is_private: boolean 
          created_at: string 
          updated_at: string 
        }
        Insert: {
          id?: string 
          user_id: string 
          handle?: string | null 
          display_name?: string | null 
          avatar_url?: string | null 
          bio?: string | null 
          is_private?: boolean 
          created_at?: string 
          updated_at?: string 
        }
        Update: {
          id?: string 
          user_id?: string 
          handle?: string | null 
          display_name?: string | null 
          avatar_url?: string | null 
          bio?: string | null 
          is_private?: boolean 
          created_at?: string 
          updated_at?: string 
        }
      }
      follows: {
        Row: {
          id: string 
          follower_id: string 
          followee_id: string 
          created_at: string 
        }
        Insert: {
          id?: string 
          follower_id: string 
          followee_id: string 
          created_at?: string 
        }
        Update: {
          id?: string 
          follower_id?: string 
          followee_id?: string 
          created_at?: string 
        }
      }
      blocks: {
        Row: {
          id: string 
          blocker_id: string 
          blocked_id: string 
          created_at: string 
        }
        Insert: {
          id?: string 
          blocker_id :string 
          blocked_id: string 
          created_at?: string 
        }
        Update: {
          id?: string 
          blocker_id?: string 
          blocked_id?: string 
          created_at?: string 
        }
      }
      reports: {
        Row: {
          id: string 
          reporter_id: string 
          target_type: 'user' | 'item' | 'like'
          target_id: string 
          reason: string 
          status: 'pending' | 'reviewed' | 'resolved'
          created_at: string 
        }
        Insert: {
          id?: string 
          reporter_id: string 
          target_type: 'user' | 'item' | 'like'
          target_id: string 
          reason: string 
          status?: 'pending' | 'reviewed' | 'resolved'
          created_at?: string 
        }
        Update: {
          id?: string 
          reporter_id?: string 
          target_type?: 'user' | 'item' | 'like'
          target_id?: string 
          reason?: string 
          status?: 'pending' | 'reviewed' | 'resolved'
          created_at?: string 
        }
      }
      ugc_videos: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          restaurant_id: string | null
          menu_item_id: string | null
          suggested_restaurant_name: string | null
          video_url: string
          thumb_url: string | null
          title: string
          description: string | null
          status: "pending" | "approved" | "rejected"
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          restaurant_id?: string | null
          menu_item_id?: string | null
          suggested_restaurant_name?: string | null
          video_url: string
          thumb_url?: string | null
          title: string
          description?: string | null
          status?: "pending" | "approved" | "rejected"
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          restaurant_id?: string | null
          menu_item_id?: string | null
          suggested_restaurant_name?: string | null
          video_url?: string
          thumb_url?: string | null
          title?: string
          description?: string | null
          status?: "pending" | "approved" | "rejected"
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