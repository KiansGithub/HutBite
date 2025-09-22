/**
 * useVideoPlayback - Video management and playback state
 * Handles video focus, screen state, and carousel controls
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useViewabilityTracking } from '@/hooks/useViewabilityTracking';
import { FlatList } from 'react-native';

export function useVideoPlayback() {
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [carouselResetTrigger, setCarouselResetTrigger] = useState(0);
  
  // Refs for tracking state changes
  const prevIsSearching = useRef<boolean>(false);
  const prevRestaurantId = useRef<string | null>(null);
  const listRef = useRef<FlatList<any>>(null);

  // Viewability tracking for video management
  const {
    vIndex,
    visibleHIndex,
    onViewableChange,
    updateHorizontalIndex,
    resetIndexes,
  } = useViewabilityTracking();

  // Viewability configuration for FlatList
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 5, // 5% threshold for visibility
  }).current;

  /**
   * Handle screen focus changes for video playback
   */
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  /**
   * Reset description expansion when vertical index changes
   */
  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [vIndex]);

  /**
   * Handle search state changes
   */
  const handleSearchStateChange = useCallback((
    isSearching: boolean,
    reshuffleRestaurants: () => void
  ) => {
    // Detect when search is cleared (was searching, now not searching)
    if (prevIsSearching.current && !isSearching) {
      reshuffleRestaurants();
    }
    prevIsSearching.current = isSearching;
  }, []);

  /**
   * Handle search results changes - scroll to top and reset indexes
   */
  const handleSearchResultsChange = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    resetIndexes();
  }, [resetIndexes]);

  /**
   * Reset carousel trigger (for forcing carousel resets)
   */
  const resetCarousel = useCallback(() => {
    setCarouselResetTrigger(prev => prev + 1);
  }, []);

  /**
   * Get current video state for a specific item
   */
  const getVideoState = useCallback((index: number) => {
    const isCurrent = index === vIndex;
    const isPreloaded = Math.abs(index - vIndex) <= 2;
    
    return {
      isCurrent,
      isPreloaded,
      isVisible: isCurrent && isScreenFocused,
    };
  }, [vIndex, isScreenFocused]);

  /**
   * Calculate video row mode for RestaurantCard
   */
  const getVideoRowMode = useCallback((index: number) => {
    if (!isScreenFocused) return 'off';
    if (index === vIndex) return 'play';
    if (index === vIndex + 1) return 'warm';
    return 'off';
  }, [isScreenFocused, vIndex]);

  /**
   * Handle horizontal scroll within video carousel
   */
  const handleHorizontalScroll = useCallback((restaurantId: string, idx: number) => {
    updateHorizontalIndex(restaurantId, idx);
  }, [updateHorizontalIndex]);

  return {
    // State
    isScreenFocused,
    isDescriptionExpanded,
    carouselResetTrigger,
    vIndex,
    visibleHIndex,
    
    // Refs
    listRef,
    viewabilityConfig,
    
    // Actions
    setIsDescriptionExpanded,
    resetCarousel,
    handleSearchStateChange,
    handleSearchResultsChange,
    handleHorizontalScroll,
    
    // Callbacks for FlatList
    onViewableChange,
    
    // Utility functions
    getVideoState,
    getVideoRowMode,
  };
}
