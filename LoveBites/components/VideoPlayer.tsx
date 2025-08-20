import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Animated as RNAnimated } from 'react-native';
import {
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  Text,
} from 'react-native';
import {
  useVideoPlayer,
  VideoView,
  clearVideoCacheAsync,
  type VideoSource,
} from 'expo-video';
import { useEvent } from 'expo';

interface VideoPlayerProps {
  uri: string;
  thumbUri: string;
  itemId: string;
  mode: 'play' | 'warm';
  width: number;
  height: number;
  onDoubleTapLike: () => void;
  onVideoFailed?: (itemId: string) => void;
}

const LOADING_TIMEOUT_MS = 12_000;
const MAX_RETRY_ATTEMPTS = 2;

/**
 * VideoPlayer with automatic cache‑busting retry logic.
 * – First attempt is cached.
 * – On any fatal error *or* loading stall (>12 s) the bad cache entry is cleared and the
 *   same URL is replayed once uncached with a throw‑away query param so ExoPlayer
 *   is forced to hit the network.
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  uri,
  thumbUri,
  itemId,
  mode,
  width,
  height, 
  onDoubleTapLike,
  onVideoFailed,
}) => {
  /*──────────────────────────────
    State & refs
  ──────────────────────────────*/
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [videoKey, setVideoKey] = useState(0); // force fresh <VideoView>

  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerRef = useRef<ReturnType<typeof useVideoPlayer> | null>(null);
  const startedOnceRef = useRef(false); // seek(0) only on very first warm play

  // thumbnail fade
  const [showThumb, setShowThumb] = useState(true);
  const opacity = useRef(new RNAnimated.Value(1)).current;

  const heartScale = useSharedValue(0);
  const heartStyle = useAnimatedStyle(() => ({
    opacity: heartScale.value,
    transform: [{ scale: heartScale.value }],
  }));
  
  const showHeart = () => {
    heartScale.value = 0;
    heartScale.value = withSpring(1, { damping: 8, stiffness: 120 });
    heartScale.value = withDelay(400, withTiming(0, { duration: 200 }));
  };

  // double tap = like/unlike
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(250)
    .onEnd(() => {
      if (hasError) {
        // use double-tap to trigger retry if in error state
        if (retryCount >= MAX_RETRY_ATTEMPTS) {
          onVideoFailed?.(itemId);
          return;
        }
        (async () => {
          try { await clearVideoCacheAsync(); } catch {}
          setRetryCount(prev => prev + 1);
          setVideoKey(prev => prev + 1);
          setHasError(false);
          setIsLoading(true);
        })();
        return;
      }
      runOnJS(showHeart)();
      runOnJS(onDoubleTapLike)();
    });

  /*──────────────────────────────
    Video source (cache‑busted on retry)
  ──────────────────────────────*/
  const videoSource: VideoSource = useMemo(() => {
    const cacheBuster = retryCount ? `${uri.includes('?') ? '&' : '?'}retry=${retryCount}` : '';
    return {
      uri: `${uri}${cacheBuster}`,
      useCaching: retryCount === 0, // first try cached, retries uncached
      preload: 'auto',
      headers: {
        'User-Agent': 'LiveBites/1.0',
        Accept: 'video/*',
      },
    };
  }, [uri, retryCount]);

  /*──────────────────────────────
    Player instance
  ──────────────────────────────*/
  const player = useVideoPlayer(videoSource, p => {
    playerRef.current = p;
    p.loop = true;
    p.muted = false;
    if (mode === 'play') {
      p.bufferOptions = {
        minBufferForPlayback: 0.5,
        preferredForwardBufferDuration: 2,
      };
    }
  });

  /* autoplay / pause when mode changes */
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    if (mode === 'play') {
      p.play();
      setIsPlaying(true);
    } else {
      p.pause();
      setIsPlaying(false);
    }
  }, [mode]);

  /* reset UI when we create a fresh player (after retry) */
  useEffect(() => {
    setIsPlaying(false);
    setHasError(false);
    setIsLoading(true);
    setShowThumb(true);
    startedOnceRef.current = false;
    opacity.setValue(1);
  }, [videoKey]);

  /*──────────────────────────────
    Status → UI state mapping
  ──────────────────────────────*/
  const { status, error } = useEvent(player, 'statusChange', {
    status: player.status,
    error: undefined,
  });

  // fake a stuck‑loading as error after timeout
  useEffect(() => {
    if (status === 'loading') {
      loadingTimerRef.current && clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = setTimeout(() => setHasError(true), LOADING_TIMEOUT_MS);
    } else {
      loadingTimerRef.current && clearTimeout(loadingTimerRef.current);
    }
  }, [status]);

  useEffect(() => {
    switch (status) {
      case 'loading':
        setIsLoading(true);
        setHasError(false);
        break;
      case 'readyToPlay':
        setIsLoading(false);
        setHasError(false);
        setRetryCount(0); // success – reset counter
        break;
      case 'error':
        setHasError(true);
        setIsLoading(false);
        break;
    }

    if (error) {
      console.error('[Video Error]', { itemId, retryCount, msg: error.message });
      setHasError(true);
      setIsLoading(false);
    }
  }, [status, error, itemId, retryCount]);

  /* fade out thumbnail when ready */
  useEffect(() => {
    if (status === 'readyToPlay') {
      if (mode === 'warm' && !startedOnceRef.current) {
        playerRef.current?.seekBy(0);
        startedOnceRef.current = true;
      }
      RNAnimated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setShowThumb(false));
    } else if (status === 'loading') {
      setShowThumb(true);
      opacity.setValue(1);
    }
  }, [status]);

  /* cleanup on unmount */
  useEffect(() => {
    return () => {
      try {
        loadingTimerRef.current && clearTimeout(loadingTimerRef.current);
        playerRef.current?.pause();
        playerRef.current = null;
      } catch {
        /* native player already disposed → ignore */
      }
    };
  }, []);

  /*──────────────────────────────
    Render
  ──────────────────────────────*/
  if (hasError && retryCount >= MAX_RETRY_ATTEMPTS) {
    return null;
  }

  if (hasError) {
    return (
      <GestureDetector gesture={Gesture.Exclusive(doubleTap)}>
        <View style={[styles.errorContainer, { width, height }]}>
          <Text style={styles.errorText}>Video unavailable</Text>
          <Text style={styles.retryText}>
            Tap to retry {retryCount > 0 ? `(${retryCount})` : ''}
          </Text>
        </View>
      </GestureDetector>
    );
  }

  return (
    <GestureDetector gesture={Gesture.Exclusive(doubleTap)}>
      <View style={{ width, height }}>
        <VideoView
          key={videoKey}
          player={player}
          style={[styles.video, { width, height }]}
          contentFit="cover"
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          nativeControls={false}
          useExoShutter
          surfaceType="textureView"
        />
  
        {/* Heart burst overlay INSIDE the same parent */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: height / 2 - 40,
              left: width / 2 - 40,
            },
            heartStyle,
          ]}
        >
          <Ionicons name="heart" size={80} color="#ff3040" />
        </Animated.View>
      </View>
    </GestureDetector>
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
});
