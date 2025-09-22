/**
 * useFeedData - Restaurant and feed data management
 * Handles restaurant data, search, location, and theme management
 */

import { useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRestaurantData, RestaurantWithDistance } from '@/hooks/useRestaurantData';
import { useLocation } from '@/hooks/useLocation';
import { useSearch } from '@/hooks/useSearch';
import { useColorScheme } from '@/components/useColorScheme';
import { useTabTheme } from '@/contexts/TabThemeContext';
import { useBasket } from '@/contexts/BasketContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, Dimensions, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

const { height: H } = Dimensions.get('screen');
const TAB_BAR_HEIGHT = Platform.OS === 'android' ? 45 : 80;

const dynamicStyles = (themeColors: any) => StyleSheet.create({
  container: { backgroundColor: themeColors.background },
  locationText: { color: themeColors.primary },
  locationBanner: { backgroundColor: themeColors.primary },
  locationBannerText: { color: '#fff' },
  noResultsText: { color: themeColors.text },
  noResultsSubtext: { color: themeColors.text, opacity: 0.7 },
});

const staticStyles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  noResultsContainer: {
    paddingTop: 0,
  },
  locationText: {
    marginTop: 10,
    fontSize: 16
  },
  locationBanner: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
  },
  locationBannerText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600'
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    textAlign: 'center'
  },
});

export function useFeedData() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { setTheme } = useTabTheme();
  const themeColors = Colors[colorScheme];
  const styles = { ...staticStyles, ...dynamicStyles(themeColors) };
  const bottomOffset = TAB_BAR_HEIGHT + insets.bottom;

  // Data hooks
  const { location, loading: locationLoading } = useLocation();
  const { 
    restaurants: allRestaurants, 
    feedContent, 
    loading, 
    reshuffleRestaurants 
  } = useRestaurantData();
  const { 
    searchQuery, 
    setSearchQuery, 
    searchResults, 
    isSearching, 
    setSearchType 
  } = useSearch(allRestaurants, []);
  const { addItem } = useBasket();

  // Set theme to dark when screen is focused
  useFocusEffect(
    useCallback(() => {
      setTheme('dark');
    }, [setTheme])
  );

  // Set search type to restaurants on mount
  useEffect(() => {
    setSearchType('restaurants');
  }, [setSearchType]);

  // Use search results when searching, otherwise use all restaurants
  const restaurants: RestaurantWithDistance[] = isSearching ? searchResults : allRestaurants;

  /**
   * Get current restaurant by index
   */
  const getCurrentRestaurant = useCallback((index: number): RestaurantWithDistance | undefined => {
    return restaurants[index];
  }, [restaurants]);

  /**
   * Get feed items for current restaurant
   */
  const getCurrentFeedItems = useCallback((restaurantId?: string) => {
    if (!restaurantId) return [];
    return feedContent[restaurantId] || [];
  }, [feedContent]);

  /**
   * Check if data is loading
   */
  const isDataLoading = loading || locationLoading;

  /**
   * Get loading message based on state
   */
  const getLoadingMessage = useCallback(() => {
    if (locationLoading) return 'Getting your location...';
    return 'Loading restaurants...';
  }, [locationLoading]);

  /**
   * Check if restaurants list is empty
   */
  const isEmpty = restaurants.length === 0;

  /**
   * Get empty state message
   */
  const getEmptyStateMessage = useCallback(() => {
    if (isSearching) {
      return {
        title: 'No restaurants found',
        subtitle: 'Try adjusting your search terms'
      };
    }
    return {
      title: 'No restaurants available',
      subtitle: 'Check back later for new restaurants'
    };
  }, [isSearching]);

  /**
   * Navigation helpers
   */
  const openMenuScreen = useCallback((restaurantId: string, itemId?: string) => {
    // This will be handled by FeedService.navigateToMenu
    return { restaurantId, itemId };
  }, []);

  return {
    // Data
    restaurants,
    allRestaurants,
    feedContent,
    location,
    
    // Loading states
    loading: isDataLoading,
    locationLoading,
    
    // Search
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    
    // Theme and styling
    themeColors,
    styles,
    bottomOffset,
    screenHeight: H,
    
    // Basket
    addItem,
    
    // Utility functions
    getCurrentRestaurant,
    getCurrentFeedItems,
    getLoadingMessage,
    isEmpty,
    getEmptyStateMessage,
    reshuffleRestaurants,
    openMenuScreen,
  };
}
