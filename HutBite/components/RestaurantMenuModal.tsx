import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { Database } from '@/lib/supabase.d';
import { supabase } from '@/lib/supabase';
import { FeedContentItem } from '@/types/feedContent';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'] & { id: string };

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RestaurantMenuModalProps {
  visible: boolean;
  onClose: () => void;
  restaurant?: Restaurant;
  initialMenuItem?: FeedContentItem;
}

export const RestaurantMenuModal: React.FC<RestaurantMenuModalProps> = ({
  visible,
  onClose,
  restaurant,
  initialMenuItem,
}) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [basketItems, setBasketItems] = useState<Record<string, number>>({});

  useEffect(() => {
    if (visible && restaurant) {
      fetchMenuItems();
    }
  }, [visible, restaurant?.id]);

  const fetchMenuItems = async () => {
    if (!restaurant) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToBasket = (itemId: string) => {
    setBasketItems(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const removeFromBasket = (itemId: string) => {
    setBasketItems(prev => {
      const newCount = (prev[itemId] || 0) - 1;
      if (newCount <= 0) {
        const { [itemId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: newCount };
    });
  };

  const getTotalItems = () => {
    return Object.values(basketItems).reduce((sum, count) => sum + count, 0);
  };

  const renderMenuItem = (item: MenuItem) => {
    const quantity = basketItems[item.id] || 0;
    
    return (
      <View key={item.id} style={styles.menuItem}>
        <View style={styles.menuItemContent}>
          <View style={styles.menuItemInfo}>
            <Text style={styles.menuItemTitle}>{item.title || 'Menu Item'}</Text>
            {item.description && (
              <Text style={styles.menuItemDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <Text style={styles.menuItemPrice}>
              ${item.price ? item.price.toFixed(2) : '0.00'}
            </Text>
          </View>
          
          {item.thumb_url && (
            <Image 
              source={{ uri: item.thumb_url }} 
              style={styles.menuItemImage}
              resizeMode="cover"
            />
          )}
        </View>
        
        <View style={styles.quantityControls}>
          {quantity > 0 ? (
            <View style={styles.quantityRow}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => removeFromBasket(item.id)}
              >
                <Ionicons name="remove" size={20} color="#fff" />
              </TouchableOpacity>
              
              <Text style={styles.quantityText}>{quantity}</Text>
              
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => addToBasket(item.id)}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => addToBasket(item.id)}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.restaurantName}>{restaurant?.name || 'Restaurant'}</Text>
            <Text style={styles.restaurantStatus}>Open</Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.infoButton}>
              <Ionicons name="information-circle-outline" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Info */}
        <View style={styles.deliveryInfo}>
          <View style={styles.deliveryItem}>
            <Text style={styles.deliveryValue}>$0.00</Text>
            <Text style={styles.deliveryLabel}>Delivery Fee</Text>
          </View>
          <View style={styles.deliveryItem}>
            <Text style={styles.deliveryValue}>$10</Text>
            <Text style={styles.deliveryLabel}>Minimum Order</Text>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>MENU</Text>
          <Text style={styles.menuSubtitle}>Available Today at 10:00 AM</Text>
        </View>

        {/* Menu Items */}
        <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
          ) : (
            menuItems.map(renderMenuItem)
          )}
        </ScrollView>

        {/* Basket Footer */}
        {getTotalItems() > 0 && (
          <View style={styles.basketFooter}>
            <View style={styles.basketInfo}>
              <Ionicons name="basket" size={20} color="#fff" />
              <Text style={styles.basketText}>{restaurant?.name || 'Restaurant'}</Text>
              <Text style={styles.basketCount}>{getTotalItems()}</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  restaurantStatus: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  infoButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  deliveryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: '#f9f9f9',
  },
  deliveryItem: {
    alignItems: 'center',
  },
  deliveryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  deliveryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  menuSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  menuList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemContent: {
    flexDirection: 'row',
    padding: 16,
  },
  menuItemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  quantityControls: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'flex-end',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 25,
    paddingHorizontal: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    paddingHorizontal: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basketFooter: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 25,
  },
  basketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  basketText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  basketCount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
