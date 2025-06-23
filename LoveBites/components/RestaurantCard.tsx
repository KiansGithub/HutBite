import React from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Dimensions } from 'react-native';
import { Text } from '@/components/Themed';
import { VideoPlayer } from './VideoPlayer';
import Colors from '@/constants/Colors';
import { Database } from '@/lib/supabase.d';
 
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
  onSignOut: () => void;
}
 
export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  menuItems,
  horizontalIndex,
  isVisible,
  onHorizontalScroll,
  onOrderPress,
  onSignOut,
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
 
      <View style={styles.overlay} pointerEvents="box-none">
        <TouchableOpacity onPress={onSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
 
        <View style={styles.restaurantInfo} pointerEvents="auto">
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.restaurantDescription}>{restaurant.description}</Text>
 
          {currentMenuItem && (
            <View style={styles.menuItemInfo}>
              <Text style={styles.menuItemName}>{currentMenuItem.name}</Text>
              <Text style={styles.menuItemDescription}>{currentMenuItem.description}</Text>
              <Text style={styles.menuItemPrice}>£{currentMenuItem.price.toFixed(2)}</Text>
            </View>
          )}
 
          <TouchableOpacity
            style={styles.orderButton}
            onPress={() => onOrderPress(restaurant.order_links as Record<string, string> | null)}
          >
            <Text style={styles.orderButtonText}>Order Now</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  signOutButton: {
    padding: 8,
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
  },
  signOutText: { color: '#fff', fontSize: 16 },
  restaurantInfo: { zIndex: 1, backgroundColor: 'transparent' },
  restaurantName: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  restaurantDescription: { fontSize: 16, color: '#ccc', marginBottom: 20 },
  orderButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'flex-start',
  },
  orderButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  menuItemInfo: { marginBottom: 16, padding: 12, backgroundColor: 'transparent', borderRadius: 8 },
  menuItemName: { fontSize: 20, fontWeight: '600', color: '#fff', marginBottom: 4 },
  menuItemDescription: { fontSize: 14, color: '#ccc', marginBottom: 4 },
  menuItemPrice: { fontSize: 18, fontWeight: 'bold', color: Colors.light.primary },
  videoPlaceholder: {
    width: W,
    height: H,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  placeholderText: { color: '#999', fontSize: 18 },
});