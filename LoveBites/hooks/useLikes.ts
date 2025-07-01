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
    console.log('Restaurant ID:', restaurantId, 'Type:', typeof restaurantId);
    console.log('Menu Item ID:', menuItemId, 'Type:', typeof menuItemId);
    console.log('Current isLiked state:', isLiked);

    useEffect(() => {
        console.log('=== LIKES HOOK useEffect triggered ===');
        console.log('User exists:', !!user);
        console.log('Restaurant ID exists:', !!restaurantId);
        console.log('Menu Item ID exists:', !!menuItemId);

        if (user && restaurantId && menuItemId) {
            // Add a small delay to ensure auth is fully settled
            const timer = setTimeout(() => {
                checkLikeStatus();
            }, 100);
 
            return () => clearTimeout(timer);
        } else {
            console.log('Not checking like status - missing required data');
            setIsLiked(false);
            return undefined;
        }
    }, [user?.id, restaurantId, menuItemId]);

    const checkLikeStatus = async () => {
        if (!user?.id) {
            console.log('No user ID available for like check');
            setIsLiked(false);
            return;
        }

        console.log('=== CHECKING LIKE STATUS ===');
        console.log('Checking for user_id:', user.id);
        console.log('restaurant_id:', restaurantId);
        console.log('menu_item_id:', menuItemId);

        try {
            const { data, error } = await supabase 
              .from('user_likes')
              .select('id')
              .eq('user_id', user.id)
              .eq('restaurant_id', restaurantId.toString()) // Ensure string
              .eq('menu_item_id', menuItemId.toString()) // Ensure string
              .limit(1); // Just get one to check existence

              if (error) {
                console.error('Error checking like status:', error);
                setIsLiked(false);
                return;
            }
 
            const liked = Array.isArray(data) && data.length > 0;
            console.log('Raw data from query:', data);
            console.log('Setting isLiked to:', liked);
            setIsLiked(liked);
        } catch (err) {
            console.error('Exception in checkLikeStatus:', err);
            setIsLiked(false);
        }
    };

    const toggleLike = async () => {
        if (!user?.id || loading) {
            console.log('Cannot toggle like - no user or loading');
            return;
        }
 
        console.log('=== TOGGLING LIKE ===');
        console.log('Current isLiked:', isLiked);
        console.log('User ID:', user.id);
        console.log('Restaurant ID:', restaurantId);
        console.log('Menu Item ID:', menuItemId);

        setLoading(true);
        try {
            if (isLiked) {
                console.log('Removing like...');
                const { error } = await supabase
                  .from('user_likes')
                  .delete()
                  .eq('user_id', user.id)
                  .eq('restaurant_id', restaurantId.toString())
                  .eq('menu_item_id', menuItemId.toString());

                  if (error) throw error;
                setIsLiked(false);
                console.log('Successfully removed like');
            } else {
                console.log('Adding like...');
                const { error } = await supabase
                  .from('user_likes')
                  .insert({
                    id: uuid.v4() as string,
                    user_id: user.id,
                    restaurant_id: restaurantId.toString(),
                    menu_item_id: menuItemId.toString(),
                  });
                
                if (error) throw error; 
                setIsLiked(true);
                console.log('Successfully added like');
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