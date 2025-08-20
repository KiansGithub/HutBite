import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import { Database } from '@/lib/supabase.d';
import { LinearGradient } from 'expo-linear-gradient';
import { LikeButton } from './LikeButton';
import { ShareButton } from './ShareButton';
import { FloatingActionRail } from '@/components/FloatingActionRail';
import { VideoCarousel } from './VideoCarousel';
import { MenuItemInfo } from './MenuItemInfo';
import { OrderButton } from './OrderButton';
import { FeedContentItem } from '@/types/feedContent';
import { useLikes } from '@/hooks/useLikes';
import { GoogleRating } from './GoogleRating';
import { RowMode } from '@/types/video';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'] & { id: string };

const { height: H, width: W } = Dimensions.get('screen');

interface RestaurantCardProps {
  restaurant: Restaurant;
  feedItems: FeedContentItem[];
  rowMode: RowMode;
  isVisible: boolean;
  onHorizontalScroll: (index: number) => void;
  onOrderPress: (orderLinks: Record<string, string> | null, restaurantId: string, menuItemId: string) => void;
  distance?: number; 
  isDescriptionExpanded: boolean; 
  setIsDescriptionExpanded: (expanded: boolean) => void; 
  resetTrigger: number;
  bottomOffset: number; 
}

const RestaurantCardComponent: React.FC<RestaurantCardProps> = ({
  restaurant,
  feedItems,
  isVisible,
  rowMode,
  onHorizontalScroll,
  onOrderPress,
  distance, 
  isDescriptionExpanded, 
  setIsDescriptionExpanded,
  resetTrigger,
  bottomOffset = 0
}) => {
  const [hIndex, setHIndex] = useState(0);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());

  // 🔒 Single source of truth for what the carousel renders
  const filteredFeedItems = useMemo(
    () => feedItems.filter(i => !failedIds.has(i.id)),
    [feedItems, failedIds]
  );

  // Clamp hIndex if list shrinks
  useEffect(() => {
    if (filteredFeedItems.length === 0) return;
    if (hIndex >= filteredFeedItems.length) {
      setHIndex(filteredFeedItems.length - 1);
    }
  }, [filteredFeedItems.length, hIndex]);

  const handleVideoFailed = useCallback((itemId: string) => {
    setFailedIds(prev => new Set(prev).add(itemId));
  }, []);

  const handleIndexChange = useCallback((index: number) => {
    setHIndex(index);
    onHorizontalScroll(index);
  }, [onHorizontalScroll]);

  const currentFeedItem = feedItems[hIndex];
  if (!currentFeedItem) {
    return <View style={styles.container} />;
  }  

  const { isLiked, loading: likeLoading, toggleLike, canLike } = useLikes({
    restaurantId: restaurant.id,
    contentType: currentFeedItem.type,
    contentId: currentFeedItem.id,
  });

  return (
    <View style={styles.container}>
      <VideoCarousel 
        feedItems={feedItems}
        rowMode={rowMode}
        currentIndex={hIndex}
        onIndexChange={handleIndexChange}
        resetTrigger={resetTrigger}
        onDoubleTapLike={() => {
          if (!canLike) return;
          toggleLike();
        }}
        onVideoFailed={handleVideoFailed}
      />
      

      {/* ──────────────── Bottom overlay ──────────────── */}
      <View
        pointerEvents="box-none"
        style={[styles.bottomOverlay, { paddingBottom: bottomOffset }]}
      >
        <View style={styles.menuItemInfo}>
        <GoogleRating 
            rating={restaurant.google_rating}
            reviewCount={restaurant.google_review_count}
          />
          <MenuItemInfo 
            restaurant={restaurant}
            feedItem={currentFeedItem}
          />
          <OrderButton 
            restaurant={restaurant}
            feedItem={currentFeedItem}
            onOrderPress={(orderLinks) => onOrderPress(orderLinks, restaurant.id, currentFeedItem.id)}
          />
        </View>
      </View>
      <FloatingActionRail>
      <LikeButton contentType={currentFeedItem.type}
          contentId={currentFeedItem.id}
          restaurantId={restaurant.id} 
          isLikedExternal={isLiked}
          loadingExternal={likeLoading}
          onPressExternal={toggleLike}
          />
  <ShareButton
    restaurantName={restaurant.name}
    menuItemTitle={currentFeedItem.title}
  />
</FloatingActionRail>
    </View>
  );
};

/* ─────────────────────── Styles ─────────────────────── */

const styles = StyleSheet.create({
  /* layout roots */
  container: { width: W, height: H },

  /* bottom overlay */
  bottomOverlay: {
    ...StyleSheet.absoluteFillObject,
    top: undefined,
    paddingTop: 120,
    paddingBottom: 100,
    paddingLeft: 8, // Shift content left
    paddingRight: 24, // Keep some padding from the right edge
    justifyContent: 'flex-end',
  },

  /* translucent card holding info + CTA */
  menuItemInfo: {
    // backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
});

export const RestaurantCard = React.memo(RestaurantCardComponent);