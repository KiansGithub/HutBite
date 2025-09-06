import { supabase } from './supabase';
import { useAuthStore } from '@/store/authStore';

interface ClickEventData {
    restaurant_id?: string | null; 
    menu_item_id?: string | null; 
    platform: string; 
    url: string; 
}

export class ClickTrackingService {
    static async trackOrderLinkClick(data: ClickEventData): Promise<void> {
        try {
            const { user } = useAuthStore.getState();

            const clickEvent = {
                user_id: user?.id || null, 
                restaurant_id: data.restaurant_id || null, 
                menu_item_id: data.menu_item_id || null, 
                platform: data.platform, 
                url: data.url
            };

            const { error } = await supabase 
              .from('click_events')
              .insert([clickEvent]);

            if (error) {
                console.error('Failed to track click event:', error);
            }
        } catch (err) {
            console.error('Unexpected error tracking click event:', err);
        }
    }
}