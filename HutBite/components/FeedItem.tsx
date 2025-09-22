/**
 * FeedItem - Individual feed item component
 * Renders a single restaurant item in the feed with video carousel
 */

import React from 'react';
import { View, Dimensions } from 'react-native';
import { RestaurantCard } from '@/components/RestaurantCard';
import { FeedService } from '@/services/FeedService';
import type { RestaurantWithDistance } from '@/hooks/useRestaurantData';
import type { FeedContentItem } from '@/types/feedContent';

const { height: H } = Dimensions.get('screen');

export interface FeedItemProps {
  restaurant: RestaurantWithDistance;
  index: number;
  vIndex: number;
  isScreenFocused: boolean;
  feedItems: FeedContentItem[];
  isDescriptionExpanded: boolean;
  carouselResetTrigger: number;
  bottomOffset: number;
  onHorizontalScroll: (restaurantId: string, idx: number) => void;
  onOrderPress: (restaurant: RestaurantWithDistance, selectedItem: FeedContentItem) => void;
  onMenuPress: (restaurantId: string) => void;
  setIsDescriptionExpanded: (expanded: boolean) => void;
}

export function FeedItem({
  restaurant,
  index,
  vIndex,
  isScreenFocused,
  feedItems,
  isDescriptionExpanded,
  carouselResetTrigger,
  bottomOffset,
  onHorizontalScroll,
  onOrderPress,
  onMenuPress,
  setIsDescriptionExpanded,
}: FeedItemProps) {
  // Check if item should be rendered (performance optimization)
  const isCurrent = index === vIndex;
  const isPreloaded = FeedService.shouldPreloadItem(index, vIndex);

  // Don't render if not current and not preloaded
  if (!isCurrent && !isPreloaded) {
    return <View style={{ width: '100%', height: H }} />;
  }

  // Calculate video row mode
  const rowMode = FeedService.calculateVideoRowMode(index, vIndex, isScreenFocused);

  // Handle order press with feed item lookup
  const handleOrderPress = (menuItemId: string) => {
    const selectedItem = FeedService.findFeedItemById(feedItems, menuItemId);
    if (selectedItem) {
      onOrderPress(restaurant, selectedItem);
    }
  };

  // Handle horizontal scroll
  const handleHorizontalScroll = (idx: number) => {
    onHorizontalScroll(restaurant.id, idx);
  };

  return (
    <RestaurantCard
      restaurant={restaurant}
      feedItems={feedItems}
      rowMode={rowMode}
      isVisible={isCurrent && isScreenFocused}
      onHorizontalScroll={handleHorizontalScroll}
      onOrderPress={handleOrderPress}
      onMenuPress={onMenuPress}
      distance={restaurant.distance}
      isDescriptionExpanded={isCurrent ? isDescriptionExpanded : false}
      setIsDescriptionExpanded={setIsDescriptionExpanded}
      resetTrigger={carouselResetTrigger}
      bottomOffset={bottomOffset}
    />
  );
}
