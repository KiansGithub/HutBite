import { Database } from '@/lib/supabase.d';

export type MenuItem = Database['public']['Tables']['menu_items']['Row'] & { id: string };
export type UGCVideo = Database['public']['Tables']['ugc_videos']['Row'] & { id: string };

export type FeedContentItem = {
    id: string; 
    type: 'menu_item' |'ugc_video';
    restaurant_id: string; 
    title: string; 
    description?: string | null; 
    video_url: string | null;
    thumb_url?: string | null; 
    price?: number; 
    created_at: string; 
    user_id?: string; 
    suggested_restaurant_name?: string | null; 
};

export type RestaurantFeedData = Record<string, FeedContentItem[]>;