import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { APP_CONFIG } from '@/constants/config';
import type { IStoreProfile, IWebSettings, MenuCategory, IBaseProduct } from '@/types/store';
import type { IBasketItem } from '@/types/basket';
import { RestaurantCategoryHeader } from '@/components/RestaurantCategoryHeader';
import { RestaurantCategoryContent } from '@/components/RestaurantCategoryContent';
import { useStore } from '@/contexts/StoreContext';

const colors = Colors.light;

export interface MenuContentProps {
  storeProfile: IStoreProfile | null;
  webSettings: IWebSettings | null;
  productCategories: MenuCategory[];
  products: IBaseProduct[];
  loading: boolean;
  error: string | null;
  activeCategory: string | null;
  basketItems: IBasketItem[];
  basketTotal: string;
  onCategoryPress: (categoryId: string) => void;
  onProductPress: (product: IBaseProduct) => void;
  onProductIncrement?: (product: IBaseProduct) => void;
  onProductDecrement?: (product: IBaseProduct) => void;
  onRetry: () => void;
  buildImageUrl: (imgUrl?: string) => string | null;
}

export function MenuContent({
  storeProfile,
  webSettings,
  productCategories,
  products,
  loading,
  error,
  activeCategory,
  basketItems,
  basketTotal,
  onCategoryPress,
  onProductPress,
  onProductIncrement,
  onProductDecrement,
  onRetry,
  buildImageUrl,
}: MenuContentProps) {
  const { isCurrentStoreOpen, getStoreStatus, canOrder } = useStore();
  
  const storeOpen = isCurrentStoreOpen();
  const storeStatusMessage = getStoreStatus();
  const orderingEnabled = canOrder();

  return (
    <>
      {/* Delivery Info */}
      <View style={[styles.deliveryInfo, { backgroundColor: colors.tabIconDefault + '10' }]}>
        <View style={styles.deliveryItem}>
          <Text style={[styles.deliveryValue, { color: colors.text }]}>£{APP_CONFIG.DELIVERY_FEE.toFixed(2)}</Text>
          <Text style={[styles.deliveryLabel, { color: colors.text }]}>Delivery Fee</Text>
        </View>
        <View style={styles.deliveryItem}>
          <Text style={[styles.deliveryValue, { color: colors.text }]}>
            £{webSettings?.minDlvValue ? webSettings.minDlvValue.toFixed(2) : '10.00'}
          </Text>
          <Text style={[styles.deliveryLabel, { color: colors.text }]}>Minimum Order</Text>
        </View>
      </View>

      {/* Store Status Section */}
      <View style={[styles.menuSection, { backgroundColor: colors.background }]}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>MENU</Text>
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusIndicator, 
            { backgroundColor: storeOpen ? '#4CAF50' : '#F44336' }
          ]} />
          <Text style={[
            styles.menuSubtitle, 
            { color: storeOpen ? colors.text : '#F44336' }
          ]}>
            {storeStatusMessage || (storeOpen ? 'Open Now' : 'Closed')}
          </Text>
        </View>
        {!storeOpen && (
          <Text style={[styles.closedMessage, { color: '#F44336' }]}>
            Items cannot be added to basket while store is closed
          </Text>
        )}
      </View>

      {/* Category Header */}
      {!loading && !error && productCategories.length > 0 && (
        <RestaurantCategoryHeader
          categories={productCategories}
          selectedCategoryId={activeCategory}
          onCategoryPress={onCategoryPress}
        />
      )}

      {/* Category Content */}
      <RestaurantCategoryContent
        loading={loading}
        error={error}
        onRetry={onRetry}
        categories={productCategories}
        products={products}
        selectedCategoryId={activeCategory}
        basketItems={basketItems || []}
        onProductPress={orderingEnabled ? onProductPress : undefined}
        onProductIncrement={orderingEnabled ? onProductIncrement : undefined}
        onProductDecrement={orderingEnabled ? onProductDecrement : undefined}
        buildImageUrl={buildImageUrl}
      />

      {/* Basket Footer */}
      {basketItems && basketItems.length > 0 && (
        <TouchableOpacity
          style={[styles.basketFooter, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(main)/basket')}
        >
          <View style={styles.basketInfo}>
            <Ionicons name="basket" size={20} color="#fff" />
            <Text style={styles.basketText}>{basketTotal}</Text>
            <Text style={styles.basketCount}>{basketItems.length}</Text>
          </View>
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  deliveryInfo: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    paddingVertical: 20 
  },
  deliveryItem: { 
    alignItems: 'center' 
  },
  deliveryValue: { 
    fontSize: 18, 
    fontWeight: '700' 
  },
  deliveryLabel: { 
    fontSize: 12, 
    marginTop: 2, 
    opacity: 0.8 
  },

  menuSection: { 
    paddingHorizontal: 16, 
    paddingVertical: 16 
  },
  menuTitle: { 
    fontSize: 16, 
    fontWeight: '700' 
  },
  menuSubtitle: { 
    fontSize: 12, 
    marginTop: 2, 
    opacity: 0.8 
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  closedMessage: {
    fontSize: 12,
    marginTop: 8,
  },

  basketFooter: {
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    marginHorizontal: 16, 
    marginBottom: 16, 
    borderRadius: 25,
  },
  basketInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  basketText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600', 
    marginLeft: 8, 
    flex: 1 
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
