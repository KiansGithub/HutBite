import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import uuid from 'react-native-uuid';


interface CacheEntry {
    value: boolean; 
    expiry: number; 
}

const CACHE_TTL = 5 * 60 * 1000;
const likeCache = new Map<string, CacheEntry>();

const pendingRequests = new Map<string, Promise<boolean>>();

const purgeCacheEntry = (key: string) => {
    likeCache.delete(key);
    pendingRequests.delete(key);
};

const purgeExpiredCache = () => {
    const now = Date.now();
    for (const [key, entry] of likeCache.entries()) {
        if (now > entry.expiry) {
            purgeCacheEntry(key);
        }
    }
};

interface UseLikesProps {
    contentType: 'menu_item' | 'ugc_video';
    contentId: string;
    restaurantId: string;
}

export const useLikes = ({ contentType, contentId, restaurantId }: UseLikesProps) => {
    const [isLiked, setIsLiked] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user } = useAuthStore();
    const mountedRef = useRef(true);
    const abortControllerRef = useRef<AbortController | null>(null);
    const loadingRef = useRef(false);
    const queuedToggleRef = useRef<boolean | null>(null);

    useEffect(() => {
        mountedRef.current = true; 
        return () => {
            mountedRef.current = false 
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const cacheKey = useMemo(() => {
        return user?.id ? `${user.id}-${contentType}-${String(contentId)}` : null;
    }, [user?.id, contentType, contentId]);

    const checkLikeStatus = useCallback(async (): Promise<boolean> => {
        if (!user?.id || !contentId || !cacheKey) {
            return false;
        }

        // Check cache first 
        purgeExpiredCache();
 
        const cached = likeCache.get(cacheKey);
        if (cached && Date.now() < cached.expiry) {
            return cached.value;
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
                    .eq('content_type', contentType)
                    .eq('content_id', String(contentId))
                    .limit(1)
                    .abortSignal(abortController.signal);
                
                if (error) {
                    console.error('Error checing like status:', error);
                    return false;
                }

                const liked = Array.isArray(data) && data.length > 0; 

                likeCache.set(cacheKey, {
                    value: liked,
                    expiry: Date.now() + CACHE_TTL
                });

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
    }, [user?.id, restaurantId, contentId, cacheKey]);

    // Load initial like status 
    useEffect(() => {
        if (!user?.id || !restaurantId || !contentId) {
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
    }, [user?.id, contentType, contentId, checkLikeStatus]);

    const toggleLike = useCallback(async () => {
        if (!user?.id || !contentId || !cacheKey) {
            return;
        }

        if (!mountedRef.current) return;
 
        if (loadingRef.current) {
            queuedToggleRef.current = !isLiked;
            return;
        }
 
        loadingRef.current = true;
        
        setLoading(true);

        // Optimistic update 
        const prevLiked = isLiked;
        const newLikedState = !prevLiked;
        setIsLiked(newLikedState);
        likeCache.set(cacheKey, {
            value: newLikedState,
            expiry: Date.now() + CACHE_TTL
        });

        try {
            const contentIdStr = String(contentId);
            const restaurantIdStr = String(restaurantId);

            if (prevLiked) {
                const { error } = await supabase
                  .from('user_likes')
                  .delete()
                  .eq('user_id', user.id)
                  .eq('restaurant_id', restaurantIdStr)
                  .eq('content_type', contentType)
                  .eq('content_id', contentIdStr);

                  if (error) throw error; 
            } else {
                // Add like 
                let likeId: string 
                try {
                    const generatedId = uuid.v4();
                    likeId = typeof generatedId === 'string' ? generatedId : String(generatedId);
                } catch (uuidError) {
                    likeId = `like_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
                }

                const { error } = await supabase 
                    .from('user_likes')
                    .insert({
                        id: likeId, 
                        user_id: user.id, 
                        restaurant_id: restaurantIdStr, 
                        content_type: contentType,
                        content_id: contentIdStr,
                    });

                if (error) throw error; 
            }
        } catch (err) {
            console.error('Error toggling like:', err);

            // Revert optimistic update on error 
            if (mountedRef.current) {
                setIsLiked(prevLiked);
                likeCache.set(cacheKey, {
                    value: prevLiked,
                    expiry: Date.now() + CACHE_TTL
                });
            }
        } finally {
            loadingRef.current = false;
            if (mountedRef.current) {
                setLoading(false);
            }

            if (queuedToggleRef.current !== null && mountedRef.current) {
                const queuedState = queuedToggleRef.current;
                queuedToggleRef.current = null;
 
                if (queuedState !== isLiked) {
                    setTimeout(() => toggleLike(), 0);
                }
            }
        }
    }, [user?.id, restaurantId, contentId, loading, isLiked, cacheKey]);

    const forceRefresh = useCallback(async () => {
        if (!cacheKey) return;
 
        purgeCacheEntry(cacheKey);
 
        try {
            const liked = await checkLikeStatus();
            if (mountedRef.current) {
                setIsLiked(liked);
            }
        } catch (err) {
            console.error('Error in forceRefresh:', err);
        }
    }, [cacheKey, checkLikeStatus]);

    return {
        isLiked, 
        loading, 
        toggleLike, 
        forceRefresh,
        canLike: !!user?.id && !!restaurantId && !!contentId
    };
};