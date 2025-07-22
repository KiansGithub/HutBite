import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  Text,
  Animated,
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
}

const LOADING_TIMEOUT_MS = 12_000;

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
  const opacity = useRef(new Animated.Value(1)).current;

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
      Animated.timing(opacity, {
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
        playerRef.current?.pause();
      } catch {
        /* native player already disposed → ignore */
      }
    };
  }, []);

  /*──────────────────────────────
    Tap behaviour (play/pause or retry)
  ──────────────────────────────*/
  const handleTap = async () => {
    const p = playerRef.current;
    if (!p) return;

    /* retry path */
    if (hasError) {
      console.log('[Video Retry]', { itemId, attempt: retryCount + 1 });
      try {
        await clearVideoCacheAsync();
      } catch (e) {
        console.warn('failed to clear cache', e);
      }
      setRetryCount(prev => prev + 1);
      setVideoKey(prev => prev + 1);
      return;
    }

    /* normal play / pause toggle */
    try {
      if (isPlaying) {
        p.pause();
        setIsPlaying(false);
      } else if (status === 'readyToPlay') {
        p.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.log('[Video toggle play error]', err);
      setHasError(true);
    }
  };

  /*──────────────────────────────
    Render
  ──────────────────────────────*/
  if (hasError) {
    return (
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={[styles.errorContainer, { width, height }]}>
          <Text style={styles.errorText}>Video unavailable</Text>
          <Text style={styles.retryText}>
            Tap to retry {retryCount > 0 ? `(${retryCount})` : ''}
          </Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={{ width, height }}>
        <VideoView
          key={videoKey}
          player={player}
          style={[styles.video, { width, height }]}
          contentFit="cover"
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          nativeControls={false}
          useExoShutter={true}
          surfaceType="textureView"
        />
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
});
