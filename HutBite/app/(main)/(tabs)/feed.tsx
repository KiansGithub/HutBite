/**
 * FeedScreen - Main feed screen component
 * Displays restaurant feed with video content in a vertical scrollable list
 */

import React, { useCallback, useEffect } from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import { Text } from '@/components/Themed';
import { TopOverlay } from '@/components/TopOverlay';
import { FeedItem } from '@/components/FeedItem';
import SignInNudge from '@/components/SignInNudge';
import { useFeedData } from '@/hooks/useFeedData';
import { useVideoPlayback } from '@/hooks/useVideoPlayback';
import { useBasket } from '@/hooks/useBasket';
import { useStore } from '@/contexts/StoreContext';
import { useBasketClearConfirmation } from '@/contexts/BasketClearConfirmationContext';
import { FeedService } from '@/services/FeedService';
import { router } from 'expo-router';
import { STORE_CONFIG } from '@/constants/api';
import { APP_CONFIG } from '@/constants/config';
import type { RestaurantWithDistance } from '@/hooks/useRestaurantData';
import type { FeedContentItem } from '@/types/feedContent';

export default function FeedScreen() {
  // Data and state management
  const feedData = useFeedData();
  const videoPlayback = useVideoPlayback();
  const { items, itemCount, currentStoreId, clearBasket } = useBasket();
  const { storeInfo, setStoreState } = useStore();
  const { showConfirmation } = useBasketClearConfirmation();

  // Debug basket state changes
  useEffect(() => {
    console.log('🛒 BASKET STATE CHANGED:', {
      itemCount,
      currentStoreId,
      basketItems: items,
      storeInfoName: storeInfo?.name,
      timestamp: new Date().toISOString()
    });
  }, [items, itemCount, currentStoreId, storeInfo?.name]);

  // Handle search state changes
  useEffect(() => {
    videoPlayback.handleSearchStateChange(
      feedData.isSearching,
      feedData.reshuffleRestaurants
    );
  }, [feedData.isSearching, feedData.reshuffleRestaurants, videoPlayback]);

  // Handle search results changes - pass isSearching parameter
  useEffect(() => {
    videoPlayback.handleSearchResultsChange(feedData.isSearching);
  }, [feedData.searchResults, feedData.isSearching, videoPlayback]);

  // Check if navigation should show basket confirmation
  const checkBasketConflict = useCallback((
    targetRestaurant: RestaurantWithDistance,
    onProceed: () => void
  ) => {
    const targetStoreId = targetRestaurant.store_id || STORE_CONFIG.TEST_STORE_ID;
    
    console.log('🔍 checkBasketConflict DEBUG:', {
      itemCount,
      currentStoreId,
      targetStoreId,
      targetRestaurantName: targetRestaurant.name,
      targetRestaurantStoreId: targetRestaurant.store_id,
      TEST_STORE_ID: STORE_CONFIG.TEST_STORE_ID,
      basketItems: items,
      storeInfoName: storeInfo?.name,
      shouldShowConfirmation: itemCount > 0 && currentStoreId !== targetStoreId
    });
    
    // No confirmation needed if no items in basket or same store
    if (itemCount === 0 || currentStoreId === targetStoreId) {
      console.log('🟢 No confirmation needed:', {
        reason: itemCount === 0 ? 'No items in basket' : 'Same store',
        itemCount,
        currentStoreId,
        targetStoreId
      });
      onProceed();
      return;
    }

    // Get current store name for confirmation
    const currentStoreName = storeInfo?.name || 'Current Restaurant';
    const newStoreName = targetRestaurant.name;

    console.log('🚨 Basket conflict detected:', {
      currentStoreId,
      targetStoreId,
      itemCount,
      currentStoreName,
      newStoreName
    });

    // Show confirmation modal
    showConfirmation({
      currentStoreName,
      newStoreName,
      itemCount,
      onConfirm: () => {
        console.log('🗑️ User confirmed basket clear, clearing basket and updating store context');
        
        // Clear basket first
        clearBasket();
        
        // Update store context to new store
        setStoreState(prev => ({
          ...prev,
          nearestStoreId: targetStoreId
        }));
        
        // Then proceed with navigation
        onProceed();
      }
    });
  }, [itemCount, currentStoreId, storeInfo?.name, showConfirmation, items, clearBasket, setStoreState]);

  // Handle order press with basket confirmation
  const handleOrderPress = useCallback((
    restaurant: RestaurantWithDistance,
    selectedItem: FeedContentItem
  ) => {
    console.log('🚀 handleOrderPress CALLED:', {
      restaurantName: restaurant.name,
      restaurantId: restaurant.id,
      selectedItemId: selectedItem.id,
      timestamp: new Date().toISOString()
    });

    const proceedWithOrder = () => {
      console.log('🛒 handleOrderPress proceeding with:', { 
        restaurant: restaurant.name, 
        selectedItem 
      });

      // Update store context to target restaurant
      const storeId = restaurant.store_id || STORE_CONFIG.TEST_STORE_ID;
      setStoreState(prev => ({
        ...prev,
        nearestStoreId: storeId
      }));

      // If ordering is disabled, navigate to restaurant page
      if (!restaurant.receives_orders) {
        router.push(`/restaurant/${restaurant.id}`);
        return;
      }

      // Navigate to menu with product IDs for auto-add functionality
      console.log('🧭 Navigating to menu screen with product IDs:', {
        cat_id: selectedItem.cat_id,
        grp_id: selectedItem.grp_id,
        pro_id: selectedItem.pro_id
      });
      
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
    };

    checkBasketConflict(restaurant, proceedWithOrder);
  }, [checkBasketConflict, setStoreState]);

  // Handle menu press with basket confirmation
  const handleMenuPress = useCallback((restaurantId: string) => {
    console.log('🚀 handleMenuPress CALLED:', {
      restaurantId,
      timestamp: new Date().toISOString()
    });

    const restaurant = feedData.allRestaurants.find(r => r.id === restaurantId);
    if (!restaurant) return;

    const proceedWithMenu = () => {
      const storeId = restaurant.store_id || STORE_CONFIG.TEST_STORE_ID;
      
      // Update store context to target restaurant
      setStoreState(prev => ({
        ...prev,
        nearestStoreId: storeId
      }));
      
      router.push({
        pathname: '/menu',
        params: { id: String(restaurantId), storeId },
      });
    };

    checkBasketConflict(restaurant, proceedWithMenu);
  }, [feedData.allRestaurants, checkBasketConflict, setStoreState]);

  // Render individual restaurant item
  const renderRestaurant = useCallback(
    ({ item, index }: { item: RestaurantWithDistance; index: number }) => {
      const feedItems = FeedService.getFeedItemsForRestaurant(item.id, feedData.feedContent);

      return (
        <FeedItem
          restaurant={item}
          index={index}
          vIndex={videoPlayback.vIndex}
          isScreenFocused={videoPlayback.isScreenFocused}
          feedItems={feedItems}
          isDescriptionExpanded={videoPlayback.isDescriptionExpanded}
          carouselResetTrigger={videoPlayback.carouselResetTrigger}
          bottomOffset={feedData.bottomOffset}
          onHorizontalScroll={videoPlayback.handleHorizontalScroll}
          onOrderPress={handleOrderPress}
          onMenuPress={handleMenuPress}
          setIsDescriptionExpanded={videoPlayback.setIsDescriptionExpanded}
        />
      );
    },
    [
      feedData.feedContent,
      feedData.bottomOffset,
      videoPlayback.vIndex,
      videoPlayback.isScreenFocused,
      videoPlayback.isDescriptionExpanded,
      videoPlayback.carouselResetTrigger,
      videoPlayback.handleHorizontalScroll,
      videoPlayback.setIsDescriptionExpanded,
      handleOrderPress,
      handleMenuPress,
    ]
  );

  // Get FlatList configuration
  const flatListConfig = FeedService.getFlatListConfig();
  const getItemLayout = FeedService.getItemLayout(feedData.screenHeight);
  const snapOffsets = FeedService.generateSnapOffsets(feedData.restaurants, feedData.screenHeight);

  // Loading state
  if (feedData.loading) {
    return (
      <View style={[feedData.styles.container, feedData.styles.center, { flex: 1, paddingBottom: 88 }]}>
        <ActivityIndicator size="large" color={feedData.themeColors.primary} />
        <Text style={feedData.styles.locationText}>
          {feedData.getLoadingMessage()}
        </Text>
      </View>
    );
  }

  // Get current restaurant for overlay
  const currentRestaurant = feedData.getCurrentRestaurant(videoPlayback.vIndex);
  const currentFeedItems = feedData.getCurrentFeedItems(currentRestaurant?.id);

  return (
    <View style={feedData.styles.container}>
      {/* Top overlay with search and restaurant info */}
      <TopOverlay
        restaurantName={FeedService.getRestaurantDisplayName(currentRestaurant)}
        distance={currentRestaurant?.distance}
        currentIndex={videoPlayback.visibleHIndex}
        totalItems={FeedService.getTotalFeedItems(currentRestaurant, feedData.feedContent)}
        searchQuery={feedData.searchQuery}
        onSearchQueryChange={feedData.setSearchQuery}
        onCategoryPress={(category) => feedData.setSearchQuery(category)}
      />

      {/* Main content */}
      {feedData.isEmpty ? (
        <View style={[feedData.styles.container, feedData.styles.center, feedData.styles.noResultsContainer]}>
          <Text style={feedData.styles.noResultsText}>
            {feedData.getEmptyStateMessage().title}
          </Text>
          <Text style={feedData.styles.noResultsSubtext}>
            {feedData.getEmptyStateMessage().subtitle}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={videoPlayback.listRef}
          data={feedData.restaurants}
          testID="restaurant-flatlist"
          keyExtractor={(r) => r.id.toString()}
          renderItem={renderRestaurant}
          onViewableItemsChanged={videoPlayback.onViewableChange}
          viewabilityConfig={videoPlayback.viewabilityConfig}
          getItemLayout={getItemLayout}
          snapToOffsets={snapOffsets}
          {...flatListConfig}
        />
      )}

      {/* Location banner */}
      {!feedData.location && (
        <View style={feedData.styles.locationBanner}>
          <Text style={feedData.styles.locationBannerText}>
            Enable location for nearby restaurants
          </Text>
        </View>
      )}

      {/* Sign in nudge */}
      <SignInNudge topOverlayHeight={88} />
    </View>
  );
}
