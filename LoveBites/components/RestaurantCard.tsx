import React from 'react';
import {
  StyleSheet,
  FlatList,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { Text } from '@/components/Themed';
import { VideoPlayer } from './VideoPlayer';
import Colors from '@/constants/Colors';
import { Database } from '@/lib/supabase.d';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLikes } from '@/hooks/useLikes';
import { LikeButton } from './LikeButton';
import { ExpandableSearchBar } from './ExpandableSearchBar';
// import AnalyticsService from '@/lib/analytics';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type MenuItem =
  Database['public']['Tables']['menu_items']['Row'] & { id: string };

const { height: H, width: W } = Dimensions.get('window');

interface RestaurantCardProps {
  restaurant: Restaurant;
  menuItems: MenuItem[];
  horizontalIndex: number;
  isVisible: boolean;
  onHorizontalScroll: (index: number) => void;
  onOrderPress: (orderLinks: Record<string, string> | null) => void;
  searchQuery: string;
  onSearchQueryChange: (text: string) => void;
  distance?: number; 
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  menuItems,
  horizontalIndex,
  isVisible,
  onHorizontalScroll,
  onOrderPress,
  searchQuery,
  onSearchQueryChange,
  distance, 
}) => {
  const currentMenuItem = menuItems[horizontalIndex];

  return (
    <View style={styles.container}>
      {/* ──────────────── Media carousel ──────────────── */}
      <FlatList
        data={menuItems}
        horizontal
        pagingEnabled
        keyExtractor={(mi) => mi.id.toString()}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / W);
          onHorizontalScroll(idx);
        }}
        renderItem={({ item: mi, index: hPos }) =>
          mi.video_url ? (
            <View style={styles.videoContainer}>
              <VideoPlayer
                uri={mi.video_url}
                itemId={mi.id}
                isVisible={isVisible && hPos === horizontalIndex}
                width={W}
                height={H}
              />
            </View>
          ) : (
            <View style={styles.videoPlaceholder}>
              <Text style={styles.placeholderText}>No video available</Text>
            </View>
          )
        }
        style={styles.flatList}
      />

      {/* ──────────────── Paging dots ──────────────── */}
      <View style={styles.indicatorContainer} pointerEvents="none">
        {menuItems.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.indicatorDot,
              idx === horizontalIndex && styles.indicatorDotActive,
            ]}
          />
        ))}
      </View>
      <ExpandableSearchBar
    value={searchQuery}
    onChangeText={onSearchQueryChange}
    onClear={() => onSearchQueryChange('')}
  />

      {/* ──────────────── Restaurant name ──────────────── */}
      <View style={styles.restaurantBubble} pointerEvents="none">
        <Text style={styles.restaurantBubbleText}>{restaurant.name}</Text>
      </View>

     {/* ──────────────── Distance badge ──────────────── */}
     {distance !== undefined && (
      <View style={styles.distanceBadge} pointerEvents="none">
        <Text style={styles.distanceBadgeText}>
          {distance < 1 ? '<1' : distance.toFixed(1)} mi
        </Text>
      </View>
     )}

      {/* ──────────────── Bottom overlay ──────────────── */}
      <LinearGradient
        pointerEvents="box-none"
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.bottomGradient}
      >
        {currentMenuItem && (
          <View style={styles.menuItemInfo}>
            {/* name + price on one row */}
            <View style={styles.topRow}>
              <Text numberOfLines={1} style={styles.menuItemName}>
                {currentMenuItem.title}
              </Text>
              <Text style={styles.menuItemPrice}>
                £{currentMenuItem.price.toFixed(2)}
              </Text>
            </View>

            {/* full-width button below */}
            <TouchableOpacity
              style={styles.orderButton}
              onPress={() => {
                // AnalyticsService.logCustomEvent('order_button_click', {
                //   restaurant_id: restaurant.id.toString(),
                //   restaurant_name: restaurant.name, 
                //   menu_item_id: currentMenuItem.id.toString(),
                //   menu_item_name: currentMenuItem.title, 
                //   menu_item_price: currentMenuItem.price
                // });
                onOrderPress(restaurant.order_links as Record<
                  string,
                  string
                > | null)
              }}
            >
              <Text style={styles.orderButtonText}>Order Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Like button */}
        {currentMenuItem && (
          <LikeButton 
            restaurantId={restaurant.id}
            menuItemId={currentMenuItem.id}
          />
        )}
      </LinearGradient>
    </View>
  );
};

/* ─────────────────────── Styles ─────────────────────── */

const styles = StyleSheet.create({
  /* layout roots */
  container: { width: W, height: H },
  videoContainer: { width: W, height: H },
  flatList: { width: W, height: H },

  /* indicator dots */
  indicatorContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#777',
    marginHorizontal: 4,
  },
  indicatorDotActive: { backgroundColor: '#fff' },

  /* restaurant name bubble */
  restaurantBubble: {
    position: 'absolute',
    top: 90,
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  restaurantBubbleText: { color: '#fff', fontSize: 18, fontWeight: '600' },

  /* distance badge */
  distanceBadge: {
    position: 'absolute',
    top: 125, 
    alignSelf: 'center',
    paddingVertical: 4, 
    paddingHorizontal: 12, 
    borderRadius: 12, 
    backgroundColor: 'rgba(255, 122, 0, 0.9)'
  },
  distanceBadgeText: {
    color: '#fff',
    fontSize: 12, 
    fontWeight: '600'
  },

  /* bottom gradient */
  bottomGradient: {
    ...StyleSheet.absoluteFillObject,
    top: undefined,
    paddingTop: 120,
    paddingBottom: 48,
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

  /* row for name + price */
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  menuItemName: { fontSize: 22, fontWeight: '700', color: '#fff', flexShrink: 1 },
  menuItemPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.primary,
    marginLeft: 12,
  },

  /* full-width centred CTA */
  orderButton: {
    alignSelf: 'stretch',
    backgroundColor: Colors.light.primary,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  orderButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  /* search bar */
  searchBarWrapper: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
  searchBarContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },

  /* like button */
  likeButton: {
    position: 'absolute',
    right: 24,
    top: H * 0.35,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },

  /* placeholders */
  videoPlaceholder: {
    width: W,
    height: H,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  placeholderText: { color: '#999', fontSize: 18 },
  /* pill matching restaurantBubble, but interactive */
searchBubble: {
  position: 'absolute',
  top: 88,          // same “level” as the name
  right: 20,
  borderRadius: 20,
  paddingVertical: 4,
  paddingHorizontal: 6,
  pointerEvents: "box-none",
  zIndex: 10,
  flexDirection: 'row',
  alignItems: 'center',
},

/* trims default padding from ExpandableSearchBar’s root */
searchBarInner: {
  paddingHorizontal: 0,
  paddingVertical: 0,
},
});
