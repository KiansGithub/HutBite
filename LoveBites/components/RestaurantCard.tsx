import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
} from 'react-native';
import { Database } from '@/lib/supabase.d';
import { LinearGradient } from 'expo-linear-gradient';
import { LikeButton } from './LikeButton';
import { ShareButton } from './ShareButton';
import { FloatingActionRail } from '@/components/FloatingActionRail';
import { VideoCarousel } from './VideoCarousel';
import { MenuItemInfo } from'./MenuItemInfo';
import { OrderButton } from './OrderButton';
import { FeedContentItem } from '@/types/feedContent';
import { useLikes } from '@/hooks/useLikes';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'] & { id: string };

const { height: H, width: W } = Dimensions.get('screen');

interface RestaurantCardProps {
  restaurant: Restaurant;
  feedItems: FeedContentItem[];
  rowMode: string;
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
  const currentFeedItem = feedItems[hIndex];

  if (!currentFeedItem) {
    return <View style={styles.container} />;
  }  

  const { isLiked, loading: likeLoading, toggleLike, canLike } = useLikes({
    restaurantId: restaurant.id,
    contentType: currentFeedItem.type,
    contentId: currentFeedItem.id,
  });

  const handleIndexChange = (index: number) => {
    setHIndex(index);
    onHorizontalScroll(index);
  };

  return (
    <View style={styles.container}>
      <VideoCarousel 
        feedItems={feedItems}
        rowMode={rowMode}
        onHorizontalScroll={onHorizontalScroll}
        currentIndex={hIndex}
        onIndexChange={handleIndexChange}
        resetTrigger={resetTrigger}
        onDoubleTapLike={() => {
          if (!canLike) return;
          toggleLike();
        }}
      />

      {/* ──────────────── Bottom overlay ──────────────── */}
      <LinearGradient
        pointerEvents="box-none"
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={[styles.bottomGradient, { paddingBottom: bottomOffset }]}
      >
        <View style={styles.menuItemInfo}>
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
      </LinearGradient>
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

  /* bottom gradient */
  bottomGradient: {
    ...StyleSheet.absoluteFillObject,
    top: undefined,
    paddingTop: 120,
    paddingBottom: 100,
    paddingHorizontal: 24,
    justifyContent: 'flex-end',
  },

  /* translucent card holding info + CTA */
  menuItemInfo: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
});

export const RestaurantCard = React.memo(RestaurantCardComponent);