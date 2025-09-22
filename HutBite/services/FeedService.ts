/**
 * FeedService - Business logic for feed operations
 * Handles feed data processing, navigation, and business rules
 */

import { router } from 'expo-router';
import { STORE_CONFIG } from '@/constants/api';
import { APP_CONFIG } from '@/constants/config';
import type { RestaurantWithDistance } from '@/hooks/useRestaurantData';
import type { FeedContentItem } from '@/types/feedContent';

export type VideoRowMode = 'play' | 'warm' | 'off';

export class FeedService {
  /**
   * Calculate video playback mode based on index and screen focus
   */
  static calculateVideoRowMode(
    index: number,
    vIndex: number,
    isScreenFocused: boolean
  ): VideoRowMode {
    if (!isScreenFocused) return 'off';
    
    if (index === vIndex) return 'play';
    if (index === vIndex + 1) return 'warm';
    
    return 'off';
  }

  /**
   * Check if item should be preloaded (within 2 items of current)
   */
  static shouldPreloadItem(index: number, vIndex: number): boolean {
    return Math.abs(index - vIndex) <= 2;
  }

  /**
   * Navigate to menu screen with optional item
   */
  static navigateToMenu(
    restaurantId: string,
    allRestaurants: RestaurantWithDistance[],
    itemId?: string
  ): void {
    const restaurant = allRestaurants.find(r => r.id === restaurantId);
    const storeId = restaurant?.store_id || STORE_CONFIG.TEST_STORE_ID;
    
    router.push({
      pathname: '/menu',
      params: { id: String(restaurantId), storeId, itemId },
    });
  }

  /**
   * Handle order press - navigate to menu or restaurant based on config
   */
  static handleOrderPress(
    restaurant: RestaurantWithDistance,
    selectedItem: FeedContentItem,
    allRestaurants: RestaurantWithDistance[]
  ): void {
    console.log('🛒 handleOrderPress called with:', { 
      restaurant: restaurant.name, 
      selectedItem 
    });

    // If ordering is disabled, navigate to restaurant page
    if (!APP_CONFIG.ORDERING_ENABLED) {
      router.push(`/restaurant/${restaurant.id}`);
      return;
    }

    // Navigate to menu with product IDs for auto-add functionality
    console.log('🧭 Navigating to menu screen with product IDs:', {
      cat_id: selectedItem.cat_id,
      grp_id: selectedItem.grp_id,
      pro_id: selectedItem.pro_id
    });
    
    const storeId = restaurant.store_id || STORE_CONFIG.TEST_STORE_ID;
    router.push({
      pathname: '/menu',
      params: { 
        id: String(restaurant.id), 
        storeId,
        cat_id: selectedItem.cat_id,
        grp_id: selectedItem.grp_id,
        pro_id: selectedItem.pro_id,
        auto_add: 'true'
      },
    });
  }

  /**
   * Get feed items for a specific restaurant
   */
  static getFeedItemsForRestaurant(
    restaurantId: string,
    feedContent: Record<string, FeedContentItem[]>
  ): FeedContentItem[] {
    return feedContent[restaurantId] || [];
  }

  /**
   * Find feed item by ID within restaurant's feed items
   */
  static findFeedItemById(
    feedItems: FeedContentItem[],
    itemId: string
  ): FeedContentItem | undefined {
    return feedItems.find(item => item.id === itemId);
  }

  /**
   * Calculate FlatList item layout for performance
   */
  static getItemLayout(screenHeight: number) {
    return (data: any, index: number) => ({
      length: screenHeight,
      offset: screenHeight * index,
      index,
    });
  }

  /**
   * Generate snap offsets for FlatList
   */
  static generateSnapOffsets(
    restaurants: RestaurantWithDistance[],
    screenHeight: number
  ): number[] {
    return restaurants.map((_, index) => index * screenHeight);
  }

  /**
   * Check if restaurants list is empty and determine empty state type
   */
  static getEmptyState(
    restaurants: RestaurantWithDistance[],
    isSearching: boolean
  ): 'searching' | 'no_restaurants' | null {
    if (restaurants.length === 0) {
      return isSearching ? 'searching' : 'no_restaurants';
    }
    return null;
  }

  /**
   * Validate restaurant data for rendering
   */
  static isValidRestaurant(restaurant: RestaurantWithDistance): boolean {
    return Boolean(restaurant && restaurant.id && restaurant.name);
  }

  /**
   * Get restaurant display name with fallback
   */
  static getRestaurantDisplayName(restaurant?: RestaurantWithDistance): string {
    return restaurant?.name || '';
  }

  /**
   * Calculate total feed items for current restaurant
   */
  static getTotalFeedItems(
    restaurant: RestaurantWithDistance | undefined,
    feedContent: Record<string, FeedContentItem[]>
  ): number {
    if (!restaurant) return 0;
    return feedContent[restaurant.id]?.length ?? 0;
  }

  /**
   * Performance optimization: FlatList configuration
   */
  static getFlatListConfig() {
    return {
      bounces: false,
      snapToAlignment: 'start' as const,
      decelerationRate: 'fast' as const,
      showsVerticalScrollIndicator: false,
      disableIntervalMomentum: true,
      scrollEventThrottle: 16,
      maxToRenderPerBatch: 2,
      windowSize: 2,
      initialNumToRender: 1,
      updateCellsBatchingPeriod: 50,
    };
  }
}
