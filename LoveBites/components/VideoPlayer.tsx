import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';
import { useEvent } from 'expo';
// import AnalyticsService from '@/lib/analytics';

interface VideoPlayerProps {
    uri: string; 
    itemId: string; 
    isVisible: boolean; 
    width: number; 
    height: number; 
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    uri, 
    itemId, 
    isVisible, 
    width, 
    height,
}) => {
    const player = useVideoPlayer(
        { uri, useCaching: true },
        p => {
            p.loop = true; 
            p.muted = true; 
            p.bufferOptions = {
                minBufferForPlayback: 0.5, 
                preferredForwardBufferDuration: 20, 
                waitsToMinimizeStalling: true, 
            };
        }
    );

    useEffect(() => {
        if (isVisible) {
            player.currentTime = 0; 
            player.play();
            // AnalyticsService.logVideoPlay(uri, itemId);
        } else {
            player.pause();
        }
    }, [isVisible]);

    const { status, error } = useEvent(player, 'statusChange', {
        status: player.status, 
        error: undefined, 
    });

    useEffect(() => {
        if (__DEV__) console.log('[expo-video]', status, error?.message);

        if (error) {
            // AnalyticsService.logError(`Video error: ${error.message}`, `Video ID: ${itemId}`);
        }
    }, [status, error]);

    return (
        <VideoView
          key={uri}
          player={player}
          style={[styles.video, { width, height }]}
          contentFit="contain"
          allowsFullscreen
          allowsPictureInPicture
          useExoShutter={false}
          surfaceType="textureView"
        />
      );
    };
     
    const styles = StyleSheet.create({
      video: {
        flex: 1,
      },
    });