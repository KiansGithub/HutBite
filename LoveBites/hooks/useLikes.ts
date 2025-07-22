import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import uuid from 'react-native-uuid';

// Cache to prevent duplicate API calls 
const likeCache = new Map<string, boolean>();
const pendingRequests = new Map<string, Promise<boolean>>();

interface UseLikesProps {
    restaurantId: string; 
    menuItemId: string; 
}

export const useLikes = ({ restaurantId, menuItemId }: UseLikesProps) => {
    const [isLiked, setIsLiked] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user } = useAuthStore();
    const mountedRef = useRef(true);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        mountedRef.current = true; 
        return () => {
            mountedRef.current = false 
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Create cache key 
    const cacheKey = user?.id ? `${user.id}-${restaurantId}-${menuItemId}` : null;

    const checkLikeStatus = useCallback(async (): Promise<boolean> => {
        if (!user?.id || !restaurantId || !menuItemId || !cacheKey) {
            return false;
        }

        // Check cache first 
        if (likeCache.has(cacheKey)) {
            return likeCache.get(cacheKey)!;
        }

        // Check if request is already pending 
        if (pendingRequests.has(cacheKey)) {
            return pendingRequests.get(cacheKey)!; 
        }

        // Create new request 
        const requestPromise = (async () => {
            try {
                // Create abort controller for this request 
                const abortController = new AbortController();
                abortControllerRef.current = abortController; 

                const { data, error } = await supabase 
                    .from('user_likes')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('restaurant_id', String(restaurantId))
                    .eq('menu_item_id', String(menuItemId))
                    .limit(1)
                    .abortSignal(abortController.signal);
                
                if (error) {
                    console.error('Error checing like status:', error);
                    return false;
                }

                const liked = Array.isArray(data) && data.length > 0; 

                // Cache the result 
                likeCache.set(cacheKey, liked);

                return liked;
            } catch (err: any) {
                if (err.name === 'AbortError') {
                    console.log('Like check aborted');
                    return false; 
                }

                console.error('Exception in checkLikeStatus:', err);
                return false; 
            } finally {
                // Clean up pending request 
                pendingRequests.delete(cacheKey);
                abortControllerRef.current = null; 
            }
        })();

        // Store pending request 
        pendingRequests.set(cacheKey, requestPromise);

        return requestPromise; 
    }, [user?.id, restaurantId, menuItemId, cacheKey]);

    // Load initial like status 
    useEffect(() => {
        if (!user?.id || !restaurantId || !menuItemId) {
            setIsLiked(false);
            return;
        }

        let isCancelled = false; 

        const loadLikeStatus = async () => {
            try {
                const liked = await checkLikeStatus();
                if (!isCancelled && mountedRef.current) {
                    setIsLiked(liked);
                }
            } catch (err) {
                console.error('Error loading like status:', err);
                if (!isCancelled && mountedRef.current) {
                    setIsLiked(false);
                }
            }
        };

        loadLikeStatus();

        return () => {
            isCancelled = true; 
        };
    }, [user?.id, restaurantId, menuItemId, checkLikeStatus]);

    const toggleLike = useCallback(async () => {
        if (!user?.id || !restaurantId || !menuItemId || loading || !cacheKey) {
            return;
        }

        if (!mountedRef.current) return; 
        
        setLoading(true);

        // Optimistic update 
        const newLikedState = !isLiked; 
        setIsLiked(newLikedState);
        likeCache.set(cacheKey, newLikedState);

        try {
            const restaurantIdStr = String(restaurantId);
            const menuItemIdStr = String(menuItemId);

            if (isLiked) {
                // Remove like 
                const { error } = await supabase 
                  .from('user_likes')
                  .delete()
                  .eq('user_id', user.id)
                  .eq('restaurant_id', restaurantIdStr)
                  .eq('menu_item_id', menuItemIdStr);

                  if (error) throw error; 
            } else {
                // Add like 
                let likeId: string 
                try {
                    const generatedId = uuid.v4();
                    likeId = typeof generatedId === 'string' ? generatedId : String(generatedId);
                } catch (uuidError) {
                    likeId = `like_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                }

                const { error } = await supabase 
                    .from('user_likes')
                    .insert({
                        id: likeId, 
                        user_id: user.id, 
                        restaurant_id: restaurantIdStr, 
                        menu_item_id: menuItemIdStr, 
                    });

                if (error) throw error; 
            }
        } catch (err) {
            console.error('Error toggling like:', err);

            // Revert optimistic update on error 
            if (mountedRef.current) {
                setIsLiked(isLiked);
                likeCache.set(cacheKey, isLiked);
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [user?.id, restaurantId, menuItemId, loading, isLiked, cacheKey]);

    return {
        isLiked, 
        loading, 
        toggleLike, 
        canLike: !!user?.id && !!restaurantId && !!menuItemId
    };
};