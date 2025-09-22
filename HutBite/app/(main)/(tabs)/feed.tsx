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
import { FeedService } from '@/services/FeedService';
import type { RestaurantWithDistance } from '@/hooks/useRestaurantData';
import type { FeedContentItem } from '@/types/feedContent';

export default function FeedScreen() {
  // Data and state management
  const feedData = useFeedData();
  const videoPlayback = useVideoPlayback();

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

  // Handle order press
  const handleOrderPress = useCallback((
    restaurant: RestaurantWithDistance,
    selectedItem: FeedContentItem
  ) => {
    FeedService.handleOrderPress(restaurant, selectedItem, feedData.allRestaurants);
  }, [feedData.allRestaurants]);

  // Handle menu press
  const handleMenuPress = useCallback((restaurantId: string) => {
    FeedService.navigateToMenu(restaurantId, feedData.allRestaurants);
  }, [feedData.allRestaurants]);

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
