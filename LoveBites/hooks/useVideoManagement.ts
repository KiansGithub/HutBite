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

        const src: VideoSource = {
            uri: nextItem.video_url, 
            useCaching: true, 
            bufferOptions: {
                minBufferForPlayback: 0.5, 
                preferredForwardBufferDuration: 20, 
                waitsToMinimizeStalling: true, 
            },
        };

        preloadPlayers[nextItem.id] = createVideoPlayer(src);
    }, [vIndex, restaurants, menuItems]);

    return { preloadPlayers };
};