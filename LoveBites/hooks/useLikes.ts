import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import uuid from 'react-native-uuid';

interface UseLikesProps {
    restaurantId: string; 
    menuItemId: string; 
}

export const useLikes = ({ restaurantId, menuItemId }: UseLikesProps) => {
    const [isLiked, setIsLiked] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user } = useAuthStore();

    // Debug: Log detailed user state
    console.log('=== LIKES HOOK DEBUG ===');
    console.log('User object:', user);
    console.log('User ID:', user?.id);
    console.log('User email:', user?.email);
    console.log('Can like:', !!user);
    console.log('Restaurant ID:', restaurantId);
    console.log('Menu Item ID:', menuItemId);

    useEffect(() => {
        if (user && restaurantId && menuItemId) {
            checkLikeStatus();
        }
    }, [user, restaurantId, menuItemId]);

    const checkLikeStatus = async () => {
        if (!user) return; 

        try {
            const { data, error } = await supabase 
              .from('user_likes')
              .select('id')
              .eq('user_id', user.id)
              .eq('restaurant_id', restaurantId)
              .eq('menu_item_id', menuItemId)
              .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error checking like status:', error);
            return;
        }

        setIsLiked(!!data);
        } catch (err) {
            console.error('Error checking like status:', err);
        }
    };

    const toggleLike = async () => {
        if (!user || loading) return; 

        setLoading(true);
        try {
            if (isLiked) {
                const { error } = await supabase 
                  .from('user_likes')
                  .delete()
                  .eq('user_id', user.id)
                  .eq('restaurant_id', restaurantId)
                  .eq('menu_item_id', menuItemId);

                  if (error) throw error; 
                  setIsLiked(false);
            } else {
                const { error } = await supabase 
                  .from('user_likes')
                  .insert({
                    id: uuid.v4() as string,
                    user_id: user.id, 
                    restaurant_id: restaurantId, 
                    menu_item_id: menuItemId, 
                  });
                
                if (error) throw error; 
                setIsLiked(true);
            }
        } catch (err) {
            console.error('Error toggling like:', err);
        } finally {
            setLoading(false);
        }
    };

    return {
        isLiked, 
        loading, 
        toggleLike, 
        canLike: !!user
    };
};