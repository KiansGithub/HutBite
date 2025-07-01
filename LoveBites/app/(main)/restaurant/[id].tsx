import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
  View,
} from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { useVideoManagement } from '@/hooks/useVideoManagement';
import { RestaurantCard } from '@/components/RestaurantCard';
import { OrderLinksModal } from '@/components/OrderLinksModal';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
 
const { height: H, width: W } = Dimensions.get('window');
 
export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [orderLinks, setOrderLinks] = useState<Record<string, string> | null>(null);
  const [horizontalIndex, setHorizontalIndex] = useState(0);
 
  const { restaurants, menuItems, loading } = useRestaurantData();
 
  // Find the specific restaurant
  const restaurant = restaurants.find(r => r.id === id);
  const restaurantMenuItems = restaurant ? (menuItems[restaurant.id] || []) : [];
 
  // Create arrays for video management hook (expects arrays)
  const singleRestaurantArray = restaurant ? [restaurant] : [];
  const singleMenuItemsObject = restaurant ? { [restaurant.id]: restaurantMenuItems } : {};
 
  useVideoManagement(singleRestaurantArray, singleMenuItemsObject, 0);
 
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading restaurant...</Text>
      </View>
    );
  }
 
  if (!restaurant) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Restaurant not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
 
  if (restaurantMenuItems.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>No menu items available</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
 
  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity style={styles.backButtonTop} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
 
      <RestaurantCard
        restaurant={restaurant}
        menuItems={restaurantMenuItems}
        horizontalIndex={horizontalIndex}
        isVisible={true}
        onHorizontalScroll={setHorizontalIndex}
        onOrderPress={setOrderLinks}
      />
 
      <OrderLinksModal
        orderLinks={orderLinks}
        onClose={() => setOrderLinks(null)}
      />
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: Colors.light.primary,
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButtonTop: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 10,
  },
});