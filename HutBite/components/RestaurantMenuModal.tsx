import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { Database } from '@/lib/supabase.d';
import { FeedContentItem } from '@/types/feedContent';
import { getStoreProfile, getWebSettings, getMenuCategories, getGroupsByCategory, getToppings, getStoreStatus } from '@/services/apiService';
import { STORE_CONFIG } from '@/constants/api';
import type { IStoreProfile, IWebSettings, MenuCategory, IBaseProduct } from '@/types/store';
import { RestaurantCategoryHeader } from './RestaurantCategoryHeader';
import { RestaurantCategoryContent } from './RestaurantCategoryContent';
import { ProductOptionsModal } from './ProductOptionsModal';
import { IBasketItem } from '@/types/basket';
import { useBasket } from '@/contexts/BasketContext';
import { useStore } from '@/contexts/StoreContext';
import {
  calculateItemPrice,
  formatOptionsForBasket,
  formatToppingsForBasket,
} from '@/utils/basketUtils';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

const colors = Colors.light;

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
  console.log(' [RestaurantMenuModal] Component rendered with props:', { visible, restaurantId: restaurant?.id, restaurantName: restaurant?.name });
  
  const [loading, setLoading] = useState(true);
  const [storeProfile, setStoreProfile] = useState<IStoreProfile | null>(null);
  const [webSettings, setWebSettings] = useState<IWebSettings | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [products, setProducts] = useState<IBaseProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<IBaseProduct | null>(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);

  const { items, addItem, removeItem } = useBasket();
  const { setStoreState, toppingGroups } = useStore();
  const [isProductOptionsOpen, setIsProductOptionsOpen] = useState(false);

  useEffect(() => {
    console.log(' [RestaurantMenuModal] useEffect triggered:', { visible, restaurantId: restaurant?.id });
    if (visible && restaurant) {
      console.log(' [RestaurantMenuModal] Conditions met, calling loadMenuData');
      try {
        loadMenuData();
      } catch (error) {
        console.error(' [RestaurantMenuModal] Synchronous error calling loadMenuData:', error);
      }
    } else {
      console.log(' [RestaurantMenuModal] Conditions not met:', { visible, hasRestaurant: !!restaurant });
    }
  }, [visible, restaurant?.id]);

  const loadMenuData = async () => {
    console.log(' [RestaurantMenuModal] loadMenuData function called');
    if (!restaurant) {
      console.log(' [RestaurantMenuModal] No restaurant provided to loadMenuData');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      // Use DEVDATA store for testing
      const storeId = STORE_CONFIG.TEST_STORE_ID;
      console.log(' [RestaurantMenuModal] Starting to load menu data for storeId:', storeId);
      
      // Step 1: Get store profile
      console.log(' [RestaurantMenuModal] Step 1: Fetching store profile...');
      const profile = await getStoreProfile(storeId);
      console.log(' [RestaurantMenuModal] Store profile result:', profile);
      if (!profile) throw new Error('Failed to fetch store profile');
      setStoreProfile(profile);
      console.log(' [RestaurantMenuModal] Store profile set successfully');

      // Step 2: Get web settings
      console.log(' [RestaurantMenuModal] Step 2: Fetching web settings for URL:', profile.StoreURL);
      const settings = await getWebSettings(profile.StoreURL);
      console.log(' [RestaurantMenuModal] Web settings result:', settings);
      if (!settings) throw new Error('Failed to fetch web settings');
      setWebSettings(settings);
      console.log(' [RestaurantMenuModal] Web settings set successfully');

      // Step 3: Get menu categories
      console.log(' [RestaurantMenuModal] Step 3: Fetching menu categories...');
      const menuCategories = await getMenuCategories(profile.StoreURL, storeId);
      console.log(' [RestaurantMenuModal] Menu categories result:', menuCategories);
      console.log(' [RestaurantMenuModal] Menu categories count:', menuCategories?.length || 0);
      if (!menuCategories || menuCategories.length === 0) {
        throw new Error('No menu categories available');
      }
      setCategories(menuCategories);
      console.log(' [RestaurantMenuModal] Menu categories set successfully');

      // Step 4: Fetch and store store information for status functionality
      console.log(' [RestaurantMenuModal] Step 4: Fetching store information...');
      const storeInfo = {
        name: profile.StoreName,
        address: profile.Address,
        phone: profile.Phone,
        isOpen: true, // Will be updated by store status check
        status: 1 // Default to open, will be updated
      };
      
      // Fetch actual store status
      try {
        const storeStatus = await getStoreStatus(profile.StoreURL);
        if (storeStatus !== null) {
          storeInfo.isOpen = !storeStatus; // API returns true if closed, false if open
          storeInfo.status = storeStatus ? 0 : 1; // 0 = closed, 1 = open
        }
      } catch (error) {
        console.warn('Could not fetch store status, defaulting to open:', error);
      }
      
      setStoreState((prev) => ({ ...prev, storeInfo }));
      console.log(' [RestaurantMenuModal] Store info stored in context:', storeInfo);

      // Step 5: Fetch Toppings and store in context
      console.log(' [RestaurantMenuModal] Step 5: Fetching toppings...');
      const fetchedToppings = await getToppings(profile.StoreURL, storeId);
      setStoreState((prev) => ({ ...prev, toppingGroups: fetchedToppings }));
      console.log(' [RestaurantMenuModal] Toppings fetched and stored in context:', fetchedToppings.length);

      // Step 6: Load all product categories
      console.log(' [RestaurantMenuModal] Step 6: Loading all product categories...');
      const productCategories = menuCategories.filter(cat => cat.CatType === 1);
      console.log(' [RestaurantMenuModal] Product categories found:', productCategories.length);
      
      if (productCategories.length > 0) {
        const allProducts: IBaseProduct[] = [];
        
        for (const category of productCategories) {
          console.log(' [RestaurantMenuModal] Loading category:', category.Name);
          const categoryGroups = await getGroupsByCategory(profile.StoreURL, storeId, category.ID);
          
          categoryGroups.forEach((group) => {
            if (group.DeProducts) {
              // Add category ID to each product for filtering
              const productsWithCategory = group.DeProducts.map(product => ({
                ...product,
                CategoryID: category.ID,
                CategoryName: category.Name
              }));
              allProducts.push(...productsWithCategory);
            }
          });
        }
        
        console.log(' [RestaurantMenuModal] Total products from all categories:', allProducts.length);
        setProducts(allProducts);
        
        // Set first category as active by default
        if (productCategories.length > 0) {
          setActiveCategory(productCategories[0].ID);
        }
      } else {
        console.log(' [RestaurantMenuModal] No product categories found');
      }

      console.log(' [RestaurantMenuModal] Menu data loading completed successfully');
    } catch (error) {
      console.error(' [RestaurantMenuModal] Error loading menu data:', error);
      console.error(' [RestaurantMenuModal] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setError(error instanceof Error ? error.message : 'Failed to load menu');
    } finally {
      console.log(' [RestaurantMenuModal] Setting loading to false');
      setLoading(false);
    }
  };

  const buildImageUrl = (imgUrl?: string) => {
    if (!imgUrl || !webSettings?.urlForImages) return null;
    return `${webSettings.urlForImages}${imgUrl}`;
  };

  const handleProductPress = (product: IBaseProduct) => {
    if (product.Modifiable && product.DeGroupedPrices) {
      setSelectedProduct(product);
      setOptionsModalVisible(true);
      setIsProductOptionsOpen(true);
    } else {
      // For simple products without options, add directly to basket
      addItem(product, []);
    }
  };

  const handleOptionsConfirm = (selections: any) => {
    if (selectedProduct) {
      const formattedOptions = formatOptionsForBasket(
        selections.options,
        selectedProduct,
        selectedProduct.CatID
      );
      
      const formattedToppings = formatToppingsForBasket(
        selections.toppings || [],
        toppingGroups
      );

      // Combine options and toppings into a single options array
      const allOptions = [...formattedOptions, ...formattedToppings];

      addItem(
        selectedProduct,
        allOptions,
        selections.toppings,
        selections.availableToppings
      );
    }
    setOptionsModalVisible(false);
    setSelectedProduct(null);
    setIsProductOptionsOpen(false);
  };

  const handleCategoryPress = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  const productCategories = categories.filter(cat => cat.CatType === 1);

  return (
    <>
      <Modal
        visible={visible && !isProductOptionsOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { 
            backgroundColor: colors.background, 
            borderBottomColor: colors.tabIconDefault + '20' 
          }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Text style={[styles.restaurantName, { color: colors.text }]}>
                {storeProfile?.StoreName || restaurant?.name || 'Restaurant'}
              </Text>
              <Text style={[styles.restaurantStatus, { 
                color: colors.text, 
                backgroundColor: colors.tabIconDefault + '20' 
              }]}>
                Open
              </Text>
            </View>
            
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.infoButton}>
                <Ionicons name="information-circle-outline" size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton}>
                <Ionicons name="share-outline" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Delivery Info */}
          <View style={[styles.deliveryInfo, { backgroundColor: colors.tabIconDefault + '10' }]}>
            <View style={styles.deliveryItem}>
              <Text style={[styles.deliveryValue, { color: colors.text }]}>$0.00</Text>
              <Text style={[styles.deliveryLabel, { color: colors.text }]}>Delivery Fee</Text>
            </View>
            <View style={styles.deliveryItem}>
              <Text style={[styles.deliveryValue, { color: colors.text }]}>
                ${webSettings?.minDlvValue ? webSettings.minDlvValue.toFixed(2) : '10.00'}
              </Text>
              <Text style={[styles.deliveryLabel, { color: colors.text }]}>Minimum Order</Text>
            </View>
          </View>

          {/* Menu Section */}
          <View style={[styles.menuSection, { backgroundColor: colors.background }]}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>MENU</Text>
            <Text style={[styles.menuSubtitle, { color: colors.text }]}>Available Today at 10:00 AM</Text>
          </View>

          {/* Category Header */}
          {!loading && !error && productCategories.length > 0 && (
            <RestaurantCategoryHeader
              categories={productCategories}
              selectedCategoryId={activeCategory}
              onCategoryPress={handleCategoryPress}
            />
          )}

          {/* Category Content */}
          <RestaurantCategoryContent
            loading={loading}
            error={error}
            onRetry={loadMenuData}
            categories={productCategories}
            products={products}
            selectedCategoryId={activeCategory}
            basketItems={items || []}
            onProductPress={handleProductPress}
            buildImageUrl={buildImageUrl}
          />

          {/* Basket Footer */}
          {items && items.length > 0 && (
            <View style={[styles.basketFooter, { backgroundColor: colors.primary }]}>
              <View style={styles.basketInfo}>
                <Ionicons name="basket" size={20} color="#fff" />
                <Text style={styles.basketText}>
                  {storeProfile?.StoreName || restaurant?.name || 'Restaurant'}
                </Text>
                <Text style={styles.basketCount}>{items.length}</Text>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Product Options Modal */}
      {selectedProduct && (
        <ProductOptionsModal
          visible={optionsModalVisible}
          onDismiss={() => {
            setOptionsModalVisible(false);
            setSelectedProduct(null);
            setIsProductOptionsOpen(false);
          }}
          product={selectedProduct}
          onConfirm={handleOptionsConfirm}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  },
  restaurantStatus: {
    fontSize: 12,
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
  },
  deliveryItem: {
    alignItems: 'center',
  },
  deliveryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  deliveryLabel: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  menuSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
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
