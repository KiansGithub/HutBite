import React, { useEffect, useState, useRef } from 'react';
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
    const playerRef = useRef<any>(null);

    const player = useVideoPlayer(
        { 
            uri, 
            useCaching: true,
            headers: {
                'User-Agent': 'LiveBites/1.0'
            }
        },
        p => {
            playerRef.current = p;
            p.loop = true; 
            p.muted = false; 
            p.bufferOptions = {
                minBufferForPlayback: 3.0, 
                preferredForwardBufferDuration: 15, 
                waitsToMinimizeStalling: true, 
            };
        }
    );

    useEvent(player, 'error', nativeError => {
        console.log('[Video ERROR DETAILS]', {
            itemId, 
            uri, 
            error: nativeError, 
            errorMessage: nativeError?.message || 'Unknown error',
            errorCode: nativeError?.code || 'No code'
        });
        setHasError(true);
        setIsLoading(false);
        // AnalyticsService.logError(`Video error: ${nativeError?.message || 'Unknown'}`, `Video ID: ${itemId}, URI: ${uri}`);
    });

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
                stack: error.stack
            });
            setHasError(true);
            setIsLoading(false);
        }
    }, [status, error, itemId, uri]);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
      
        if (isVisible && !hasError) {
          timeoutId = setTimeout(() => {
            if (!player) return;
            player.currentTime = 0;
            player.play();
            setIsPlaying(true);
          }, 200); // Slightly increase delay to let rendering settle
        } else {
          timeoutId = setTimeout(() => {
            if (!player) return;
            player.pause();
            setIsPlaying(false);
          }, 100); 
        }
      
        return () => {
          clearTimeout(timeoutId);
        };
      }, [isVisible, hasError]);

    // Cleanup on unmount 
    useEffect(() => {
        return () => {
            try {
                if (playerRef.current) {
                    playerRef.current.pause();
                    console.log('[Video Cleanup]', { itemId, error: err });
                }
            } catch (err) {
                console.log('[Video Cleanup Error]', { itemId, error: err });
            }
        };
    }, [itemId]);


    const handleTap = () => {
        if (hasError) {
            // Retry on error 
            setHasError(false);
            setIsLoading(true);
            try {
                player.currentTime = 0; 
                player.play();
                setIsPlaying(true);
            } catch (err) {
                console.log('[Video Retry Error]', { itemId, error: err });
                setHasError(true);
            }
            return;
        }

        try {
            if (isPlaying) {
                player.pause();
                setIsPlaying(false);
            } else {
                player.play();
                setIsPlaying(true);
            }
        } catch (err) {
            console.log('[Video Toggle Error]', { itemId, error: err });
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
          contentFit="contain"
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          nativeControls={false}
          useExoShutter={true}
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