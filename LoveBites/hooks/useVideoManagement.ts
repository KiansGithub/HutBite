import { useRef, useEffect } from 'react';
import { createVideoPlayer, type VideoPlayer, type VideoSource } from 'expo-video';
import { Database } from '@/lib/supabase.d';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'] & { id: string };

export const useVideoManagement = (
    restaurants: Restaurant[],
    menuItems: Record<string, MenuItem[]>,
    vIndex: number
) => {
    const preloadPlayers = useRef<Record<string, VideoPlayer>>({}).current; 

    useEffect(() => {
        const nextRow = restaurants[vIndex + 1];
        if (!nextRow) return; 

        const nextItem = menuItems[nextRow.id]?.[0];
        if (!nextItem || preloadPlayers[nextItem.id]) return; 

        // Clean up old preloaded players to free memory
        const currentKeys = Object.keys(preloadPlayers);
        if (currentKeys.length > 2) { // Keep max 2 preloaded videos
            const oldestKey = currentKeys[0];
            try {
                preloadPlayers[oldestKey]?.pause();
                delete preloadPlayers[oldestKey];
            } catch (err) {
                console.log('[Preload Cleanup Error]', err);
            }
        }

        const src: VideoSource = {
            uri: nextItem.video_url, 
            useCaching: true, 
            bufferOptions: {
                minBufferForPlayback: 0.5, 
                preferredForwardBufferDuration: 20, 
                waitsToMinimizeStalling: true, 
            },
        };

        try {
            preloadPlayers[nextItem.id] = createVideoPlayer(src);
        } catch (err) {
            console.log('[Preload Creation Error]', { itemId: nextItem.id, error: err });
        }
    }, [vIndex, restaurants, menuItems]);

     // Cleanup on unmount
     useEffect(() => {
        return () => {
            Object.values(preloadPlayers).forEach(player => {
                try {
                    player?.pause();
                } catch (err) {
                    console.log('[Cleanup Error]', err);
                }
            });
        };
    }, []);

    return { preloadPlayers };
};