import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, TouchableWithoutFeedback, View, Text, Platform } from 'react-native';
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
    const visibilityTimeoutRef = useRef<NodeJS.Timeout>();
    const isInitializedRef = useRef(false);

    // Android-specific video source configuration 
    const videoSource: VideoSource = {
        uri,
        useCaching: true, 
        headers: {
            'User-Agent': 'LiveBites/1.0',
            ...(Platform.OS === 'android' && {
                'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
                'Accept-Encoding': 'identity'
            })
        }
    };

    const player = useVideoPlayer(videoSource, p => {
        playerRef.current = p;
        p.loop = true;
        p.muted = false;
 
        // Android-specific buffer configuration
        if (Platform.OS === 'android') {
            p.bufferOptions = {
                minBufferForPlayback: 2.0,
                preferredForwardBufferDuration: 15,
                waitsToMinimizeStalling: true,
            };
        } else {
            p.bufferOptions = {
                minBufferForPlayback: 1.0,
                preferredForwardBufferDuration: 10,
                waitsToMinimizeStalling: false,
            };
        }
    });

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
        isInitializedRef.current = false;
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
            platform: Platform.OS, 
            isInitialized: isInitializedRef.current
        });

        switch (status) {
            case 'loading':
                if (!isInitializedRef.current) {
                    setIsLoading(true);
                    setHasError(false);
                }
                break;
            case 'readyToPlay':
                setIsLoading(false);
                setHasError(false);
                if (!isInitializedRef.current) {
                    isInitializedRef.current = true;
                    console.log('[Video Initialized]', { itemId, platform: Platform.OS });
                }
                break;
            case 'error':
                setHasError(true);
                setIsLoading(false);
                isInitializedRef.current = false;
                break;            
        }

        if (error) {
            console.log('[Video Error Details]', {
                itemId,
                message: error.message,
                platform: Platform.OS
            });
            setHasError(true);
            setIsLoading(false);
            isInitializedRef.current = false;
        }
    }, [status, error, itemId]);

    useEffect(() => {
        // Clear any existing timeout
        if (visibilityTimeoutRef.current) {
            clearTimeout(visibilityTimeoutRef.current);
        }
 
        if (isVisible && !hasError && isInitializedRef.current) {
            // Debounce play action for Android
            const delay = Platform.OS === 'android' ? 200 : 100;
 
            visibilityTimeoutRef.current = setTimeout(() => {
                try {
                    if (playerRef.current && playerRef.current.status === 'readyToPlay') {
                        playerRef.current.currentTime = 0;
                        playerRef.current.play();
                        setIsPlaying(true);
                        console.log('[Video Play]', { itemId, platform: Platform.OS });
                    }
                } catch (err) {
                    console.log('[Video Play Error]', { itemId, error: err, platform: Platform.OS });
                }
            }, delay);
        } else if (!isVisible && isPlaying) {
            // Immediate pause when not visible
            try {
                if (playerRef.current) {
                    playerRef.current.pause();
                    setIsPlaying(false);
                    console.log('[Video Pause]', { itemId, platform: Platform.OS });
                }
            } catch (err) {
                console.log('[Video Pause Error]', { itemId, error: err, platform: Platform.OS });
            }
        }
 
        return () => {
            if (visibilityTimeoutRef.current) {
                clearTimeout(visibilityTimeoutRef.current);
            }
        };
    }, [isVisible, hasError, isPlaying, itemId]);

    // Cleanup on unmount 
    useEffect(() => {
        return () => {
            try {
                if (visibilityTimeoutRef.current) {
                    clearTimeout(visibilityTimeoutRef.current);
                }
                if (playerRef.current) {
                    playerRef.current.pause();
                    console.log('[Video Cleanup]', { itemId, platform: Platform.OS });
                }
            } catch (err) {
                console.log('[Video Cleanup Error]', { itemId, error: err, platform: Platform.OS });
            }
        };
    }, [itemId]);


    const handleTap = () => {
        if (hasError) {
            // Retry on error 
            setHasError(false);
            setIsLoading(true);
            isInitializedRef.current = false;
            try {
                if (playerRef.current) {
                    playerRef.current.currentTime = 0;
                    playerRef.current.play();
                    setIsPlaying(true);
                }
            } catch (err) {
                console.log('[Video Retry Error]', { itemId, error: err, platform: Platform.OS });
                setHasError(true);
            }
            return;
        }

        if (!isInitializedRef.current) {
            return; // Don't allow interaction until initialized
        }

        try {
            if (isPlaying) {
                playerRef.current?.pause();
                setIsPlaying(false);
            } else {
                player.play();
                setIsPlaying(true);
            }
        } catch (err) {
            console.log('[Video Toggle Error]', { itemId, error: err, platform: Platform.OS });
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
    if (isLoading || !isInitializedRef.current) {
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
                {...(Platform.OS === 'android' && {
                    useExoShutter: true,
                    surfaceType: "surfaceView"
                })}
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