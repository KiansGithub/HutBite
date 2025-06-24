import React from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Dimensions } from 'react-native';
import { Text } from '@/components/Themed';
import { VideoPlayer } from './VideoPlayer';
import Colors from '@/constants/Colors';
import { Database } from '@/lib/supabase.d';
import { LinearGradient } from 'expo-linear-gradient';
 
type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'] & { id: string };
 
const { height: H, width: W } = Dimensions.get('window');
 
interface RestaurantCardProps {
  restaurant: Restaurant;
  menuItems: MenuItem[];
  horizontalIndex: number;
  isVisible: boolean;
  onHorizontalScroll: (index: number) => void;
  onOrderPress: (orderLinks: Record<string, string> | null) => void;
}
 
export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  menuItems,
  horizontalIndex,
  isVisible,
  onHorizontalScroll,
  onOrderPress,
}) => {
  const currentMenuItem = menuItems[horizontalIndex];
 
  return (
    <View style={styles.container}>
      <FlatList
        data={menuItems}
        horizontal
        pagingEnabled
        keyExtractor={mi => mi.id.toString()}
        onMomentumScrollEnd={e => {
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

        <View style={styles.indicatorContainer} pointerEvents="none">
          {menuItems.map((_, idx) => (
            <View 
              key={idx}
              style={[styles.indicatorDot, idx === horizontalIndex && styles.indicatorDotActive]}
            />
          ))}
        </View>

        <View style={styles.restaurantBubble} pointerEvents="none">
          <Text style={styles.restaurantBubbleText}>{restaurant.name}</Text>
        </View>
        <LinearGradient
          pointerEvents="box-none"
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.bottomGradient}
        >
          {currentMenuItem && (
            <TouchableOpacity
            style={styles.menuItemInfo}
              onPress={() =>
                onOrderPress(restaurant.order_links as Record<string, string> | null)
              }
            >
              <Text style={styles.menuItemName}>{currentMenuItem.name}</Text>
              <Text style={styles.menuItemPrice}>£{currentMenuItem.price.toFixed(2)}</Text>
              <View style={styles.orderButton} pointerEvents="none">
                <Text style={styles.orderButtonText}>Order Now</Text>
                </View>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>
  );
};

const styles = StyleSheet.create({
  container: { width: W, height: H },
  videoContainer: { width: W, height: H },
  flatList: { width: W, height: H },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'transparent',
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 40,
    justifyContent: 'flex-end',
  },
  restaurantBubble: {
    position: 'absolute',
    top: 90,
    alignSelf: 'center',
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  restaurantBubbleText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  orderButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'flex-start',
  },
  orderButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  menuItemInfo: {
    marginBottom: 32,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 8,
    alignItems: 'center',
  },
  menuItemName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  menuItemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  videoPlaceholder: {
    width: W,
    height: H,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  placeholderText: { color: '#999', fontSize: 18 },
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
});