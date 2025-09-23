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
          store_id: string | null
          google_rating: number | null
          google_review_count: number | null
          receives_orders: boolean
          own_delivery: boolean
          store_hours: Json | null
          is_open: boolean | null
          opening_time: string | null
          closing_time: string | null
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
          store_id: string | null
          google_rating: number | null
          google_review_count: number | null
          receives_orders?: boolean
          own_delivery?: boolean
          store_hours?: Json | null
          is_open?: boolean | null
          opening_time?: string | null
          closing_time?: string | null
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
          store_id: string | null
          google_rating: number | null
          google_review_count: number | null
          receives_orders?: boolean
          own_delivery?: boolean
          store_hours?: Json | null
          is_open?: boolean | null
          opening_time?: string | null
          closing_time?: string | null
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
          cat_id: string | null;
          grp_id: string | null;
          pro_id: string | null;
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
          cat_id?: string | null;
          grp_id?: string | null;
          pro_id?: string | null;
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
          cat_id?: string | null;
          grp_id?: string | null;
          pro_id?: string | null;
        }
      }
      user_likes: {
        Row: {
          id: string 
          created_at: string 
          user_id: string 
          restaurant_id: string 
          content_type: 'menu_item' | 'ugc_video';
          content_id: string;
        }
        Insert: {
          id?: string 
          created_at?: string 
          user_id: string 
          restaurant_id: string 
          content_type: 'menu_item' | 'ugc_video';
          content_id: string;
        }
        Update: {
          id?: string 
          created_at?: string 
          user_id?: string 
          restaurant_id?: string 
          content_type?: 'menu_item' | 'ugc_video';
          content_id?: string;
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
      orders: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          order_id: string
          user_id: string | null
          restaurant_id: string
          store_id: string
          status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
          service_type: "delivery" | "collection"
          total_amount: number
          currency: string
          customer_email: string
          customer_first_name: string
          customer_last_name: string
          customer_phone: string
          customer_address: string | null
          customer_postal_code: string | null
          customer_city: string | null
          payment_method: string
          payment_id: string | null
          payment_status: "pending" | "completed" | "failed" | "refunded"
          expected_time: string | null
          confirmed_time: string | null
          item_count: number
          order_data: Json
          submission_response: Json | null
          error_message: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          order_id: string
          user_id?: string | null
          restaurant_id: string
          store_id: string
          status?: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
          service_type: "delivery" | "collection"
          total_amount: number
          currency?: string
          customer_email: string
          customer_first_name: string
          customer_last_name: string
          customer_phone: string
          customer_address?: string | null
          customer_postal_code?: string | null
          customer_city?: string | null
          payment_method: string
          payment_id?: string | null
          payment_status?: "pending" | "completed" | "failed" | "refunded"
          expected_time?: string | null
          confirmed_time?: string | null
          item_count: number
          order_data: Json
          submission_response?: Json | null
          error_message?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          order_id?: string
          user_id?: string | null
          restaurant_id?: string
          store_id?: string
          status?: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
          service_type?: "delivery" | "collection"
          total_amount?: number
          currency?: string
          customer_email?: string
          customer_first_name?: string
          customer_last_name?: string
          customer_phone?: string
          customer_address?: string | null
          customer_postal_code?: string | null
          customer_city?: string | null
          payment_method?: string
          payment_id?: string | null
          payment_status?: "pending" | "completed" | "failed" | "refunded"
          expected_time?: string | null
          confirmed_time?: string | null
          item_count?: number
          order_data?: Json
          submission_response?: Json | null
          error_message?: string | null
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