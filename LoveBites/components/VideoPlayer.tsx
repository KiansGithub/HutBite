import React, { useEffect, useState, useRef, useMemo } from 'react';
import { StyleSheet, TouchableWithoutFeedback, View, Text } from 'react-native';
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
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const playerRef       = useRef<ReturnType<typeof useVideoPlayer> | null>(null);
    const startedOnceRef  = useRef(false);   // only seek(0) on FIRST play

    const videoSource: VideoSource = useMemo(() => ({
        uri, 
        useCaching: true, 
        headers: {
            'User-Agent': 'LiveBites/1.0',
            'Accept': 'video/*'
        }
    }), [uri]);

    const player = useVideoPlayer(
        videoSource,
        p => {
            playerRef.current = p;
            p.loop = true; 
            p.muted = false; 
            p.bufferOptions = {
                minBufferForPlayback: 3.0,
                preferredForwardBufferDuration: 10,
                waitsToMinimizeStalling: true,
            };
        }
    );

    // Status tracking 
    const { status, error } = useEvent(player, 'statusChange', {
        status: player.status, 
        error: undefined, 
    });

    useEffect(() => {
        console.log('[Video Status]', {
            itemId, 
            status, 
            error: error?.message, 
            isVisible, 
            uri: uri.substring(0, 50) + '...'
        });

        switch (status) {
            case 'loading':
                setIsLoading(true);
                setHasError(false);
                break;
            case 'readyToPlay':
                setIsLoading(false);
                setHasError(false);
                break;
            case 'error':
                setHasError(true);
                setIsLoading(false);
                break;            
        }

        if (error) {
            console.log('[Video Error Details]', {
                itemId, 
                message: error.message, 
            });
            setHasError(true);
            setIsLoading(false);
        }
    }, [status, error, itemId, uri]);

    useEffect(() => {
        const p = playerRef.current;
        if (!p) return;
      
        const shouldPlay =
          isVisible && status === 'readyToPlay' && !hasError;
      
        // Seek to the beginning only the first time we ever start
        if (shouldPlay && !startedOnceRef.current) {
          p.currentTime = 0;
          startedOnceRef.current = true;
        }
      
        try {
          if (shouldPlay) {
            p.play();                 // returns void
            setIsPlaying(true);
          } else {
            p.pause();                // returns void
            setIsPlaying(false);
          }
        } catch (err) {
          console.log('[Video play/pause error]', err);
          setHasError(true);
        }
      }, [isVisible, status, hasError, uri]);

    // Cleanup on unmount 
    useEffect(() => {
        return () => {
            try {
                if (playerRef.current) {
                    playerRef.current.pause();
                    console.log('[Video Cleanup]', { itemId });
                }
            } catch (err) {
                console.log('[Video Cleanup Error]', { itemId, error: err });
            }
        };
    }, [itemId]);


    const handleTap = () => {
        const p = playerRef.current;
        if (!p) return;
      
        /* ──────────────
           retry on error
        ───────────────*/
        if (hasError) {
          setHasError(false);
          setIsLoading(true);
          startedOnceRef.current = false;   // allow seek(0) again on next play
          return;
        }
      
        /* ──────────────
           toggle play / pause
        ───────────────*/
        try {
          if (isPlaying) {
            p.pause();              // synchronous → returns void
            setIsPlaying(false);
          } else if (status === 'readyToPlay') {
            p.play();               // synchronous → returns void
            setIsPlaying(true);
          }
        } catch (err) {
          console.log('[Video toggle play error]', err);
          setHasError(true);
        }
      };

    // Error state
    if (hasError) {
        return (
            <TouchableWithoutFeedback onPress={handleTap}>
                <View style={[styles.errorContainer, { width, height }]}>
                    <Text style={styles.errorText}>Video unavailable</Text>
                    <Text style={styles.retryText}>Tap to retry</Text>
                </View>
            </TouchableWithoutFeedback>
        );
    }
 
    // Loading state
    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { width, height }]}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <TouchableWithoutFeedback onPress={handleTap}>
        <VideoView
          player={player}
          style={[styles.video, { width, height }]}
          contentFit="cover"
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          nativeControls={false}
          useExoShutter={false}
          surfaceType="textureView"
        />
        </TouchableWithoutFeedback>
      );
    };
     
    const styles = StyleSheet.create({
      video: {
        flex: 1,
      },
      errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
      },
      errorText: {
        color: '#fff',
        fontSize: 16, 
        marginBottom: 8,
      },
      retryText: {
        color: '#999',
        fontSize: 14,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
      },
      loadingText: {
        color: '#fff',
        fontSize: 16, 
      },
    });