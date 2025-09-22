// components/restaurant/RestaurantMenuView.tsx
import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { FeedContentItem } from '@/types/feedContent';
import { ProductOptionsContent } from '@/components/ProductOptionsModal';
import { useBasket } from '@/contexts/BasketContext';
import { useStore } from '@/contexts/StoreContext';
import {
  formatOptionsForBasket,
  formatToppingsForBasket,
} from '@/utils/basketUtils';
import { handleSupabaseProductAddition } from '@/utils/productUtils';

// Import new separated components and hooks
import { useMenuData } from '@/hooks/useMenuData';
import { useMenuNavigation, InitialProductIds } from '@/hooks/useMenuNavigation';
import { MenuService, useMenuService } from '@/services/MenuService';
import { MenuHeader } from '@/components/MenuHeader';
import { MenuContent } from '@/components/MenuContent';

const colors = Colors.light;

export default function RestaurantMenuView({
  initialMenuItem,
  initialProductIds,
  storeId,
}: {
  initialMenuItem?: FeedContentItem;
  initialProductIds?: InitialProductIds;
  storeId?: string;
}) {
  const insets = useSafeAreaInsets();
  const topPad = (insets.top || 0) + 6;

  const { items, addItem, removeItem, updateQuantity, total } = useBasket();
  const { toppingGroups, optionCategoryId } = useStore();

  // Use the new hooks for data and navigation
  const {
    storeProfile,
    webSettings,
    categories,
    products,
    loading,
    error,
    loadMenuData,
    buildImageUrl,
    productCategories,
  } = useMenuData(storeId);

  const {
    route,
    activeCategory,
    activeProduct,
    setActiveCategory,
    handleBackPress,
    handleProductPress,
    handleOptionsConfirm,
    handleInitialProduct,
  } = useMenuNavigation(
    addItem,
    formatOptionsForBasket,
    formatToppingsForBasket,
    toppingGroups,
    optionCategoryId
  );

  // Use the menu service for business logic
  const { processedOptions, productToppings, hasToppings } = useMenuService(
    activeProduct,
    toppingGroups || []
  );

  // Set initial active category when products load
  useEffect(() => {
    if (productCategories.length > 0 && !activeCategory) {
      const firstCategoryId = MenuService.getFirstCategoryId(productCategories);
      setActiveCategory(firstCategoryId);
    }
  }, [productCategories, activeCategory, setActiveCategory]);

  // Handle initial product selection from feed
  useEffect(() => {
    handleInitialProduct(initialProductIds, products, loading);
  }, [initialProductIds, products, loading, handleInitialProduct]);

  // Supabase product addition handler
  const addSupabaseProduct = useCallback(
    (catId: string, grpId: string, proId: string) => {
      const result = MenuService.addSupabaseProduct(
        categories, 
        products, 
        catId, 
        grpId, 
        proId, 
        // Direct add callback 
        (product) => {
          addItem(product, []);
        },
        // Options required callback 
        (product) => {
          handleProductPress(product);
        }
      );

      if (!result.success) {
        console.error('Failed to add Supabase product:', result.message);
      }

      return result; 
    },
    [categories, products, addItem, handleProductPress]
  );

  const handleProductIncrement = useCallback((product: IBaseProduct) => {
    // For increment, we can directly add the product (same as handleProductPress for simple products)
    if (product.Modifiable && product.DeGroupedPrices) {
      // If product has options, open the options modal
      handleProductPress(product);
    } else {
      // Simple product, add directly
      addItem(product, []);
    }
  }, [addItem, handleProductPress]);

  const handleProductDecrement = useCallback((product: IBaseProduct) => {
    // Find the basket item for this product
    const basketItem = items.find(item => item.id === product.ID);
    if (basketItem) {
      const currentQuantity = parseInt(basketItem.quantity, 10);
      if (currentQuantity > 1) {
        // Decrement quantity by 1
        updateQuantity(basketItem.basketItemId, currentQuantity - 1);
      } else {
        // Remove item completely when quantity would become 0
        removeItem(basketItem.basketItemId);
      }
    }
  }, [items, removeItem, updateQuantity]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['left', 'right', 'bottom']}
    >
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* Header */}
      <MenuHeader
        storeProfile={storeProfile}
        route={route}
        topPadding={topPad}
        onBackPress={handleBackPress}
      />

      {/* Menu Content */}
      {route === 'menu' && (
        <MenuContent
          storeProfile={storeProfile}
          webSettings={webSettings}
          productCategories={productCategories}
          products={products}
          loading={loading}
          error={error}
          activeCategory={activeCategory}
          basketItems={items || []}
          basketTotal={total}
          onCategoryPress={setActiveCategory}
          onProductPress={handleProductPress}
          onRetry={loadMenuData}
          buildImageUrl={buildImageUrl}
          onProductIncrement={handleProductIncrement}
          onProductDecrement={handleProductDecrement}
        />
      )}

      {/* Options Modal */}
      {route === 'options' && activeProduct && (
        <ProductOptionsContent
          product={activeProduct}
          onDismiss={handleBackPress}
          onConfirm={handleOptionsConfirm}
          existingItem={undefined}
          onDelete={undefined}
          processedOptions={processedOptions}
          toppings={productToppings}
          hasToppings={hasToppings}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    zIndex: 1000 
  },
});
