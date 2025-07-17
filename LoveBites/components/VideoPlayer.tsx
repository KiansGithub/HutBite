import React, { useEffect, useState, useRef, useMemo } from 'react';
import { StyleSheet, TouchableWithoutFeedback, View, Text, Animated } from 'react-native';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';
import { useEvent } from 'expo';
// import AnalyticsService from '@/lib/analytics';

interface VideoPlayerProps {
    uri: string; 
    thumbUri: string;
    itemId: string; 
    mode: 'play' | 'warm'
    width: number; 
    height: number; 
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    uri, 
    thumbUri,
    itemId, 
    mode,
    width, 
    height,
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const playerRef       = useRef<ReturnType<typeof useVideoPlayer> | null>(null);
    const startedOnceRef  = useRef(false);   // only seek(0) on FIRST play
    // thumbnail fade state 
    const [showThumb, setShowThumb] = useState(true);
    const opacity = useRef(new Animated.Value(1)).current; 

    const videoSource: VideoSource = useMemo(() => ({
      uri, 
      useCaching: true, 
      preload: 'auto',
      headers: {
        'User-Agent': 'LiveBites/1.0',
        'Accept': 'video/*',
      },
    }), [uri]);

    const player = useVideoPlayer(
      videoSource, 
      p => {
        playerRef.current = p; 
        p.loop = true; 
        p.muted = false; 
        p.bufferOptions = {
          minBufferForPlayback: 1.0, 
          preferredForwardBufferDuration: 10, 
          waitsToMinimizeStalling: false, 
        };
      }
    );

    useEffect(() => {
      const p = playerRef.current; 
      if (!p) return; 
      if (mode === 'play') {
        p.play();
      } else {
        p.pause();
      }
    }, [mode]);

    console.log('thumb uri: ', thumbUri);

    // Status tracking 
    const { status, error } = useEvent(player, 'statusChange', {
        status: player.status, 
        error: undefined, 
    });

    /* fade thumbnail when ready */
    useEffect(() => {
      if (status === 'readyToPlay') {
        Animated.timing(opacity, {
          toValue: 0, 
          duration: 250, 
          useNativeDriver: true,
        }).start(() => setShowThumb(false));
      } else if (status === 'loading') {
        setShowThumb(true);
        opacity.setValue(1);
      }
    }, [status, opacity]);

    useEffect(() => {
        console.log('[Video Status]', {
            itemId, 
            status, 
            error: error?.message, 
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
      return () => {
        // this will now only run when the entire component unmounts
        try {
          playerRef.current?.pause();
          console.log('[Video Cleanup on unmount]');
        } catch {
          // ignore: native player already gone
        }
      };
    }, []);  // ← empty deps


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
    return (
        <TouchableWithoutFeedback onPress={handleTap}>
          <View style={{ width, height }}>
        <VideoView
          player={player}
          style={[styles.video, { width, height }]}
          contentFit="cover"
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          nativeControls={false}
          useExoShutter={true}
          surfaceType="textureView"
        />

        {/* {showThumb && (
          <Animated.Image 
            source={{ uri: thumbUri }}
            style={{ position: 'absolute', width, height, opacity }}
            resizeMode="cover"
          />
        )} */}
        </View>
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