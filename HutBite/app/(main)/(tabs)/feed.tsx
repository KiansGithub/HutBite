import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
  View,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useRestaurantData, RestaurantWithDistance } from '@/hooks/useRestaurantData';
import { FeedContentItem } from '@/types/feedContent';
import { useViewabilityTracking } from '@/hooks/useViewabilityTracking';
import { RestaurantCard } from '@/components/RestaurantCard';
import { useLocation } from '@/hooks/useLocation';
import { useSearch } from '@/hooks/useSearch';
import { TopOverlay } from '@/components/TopOverlay';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import { useTabTheme } from '@/contexts/TabThemeContext';
import { useBasket } from '@/contexts/BasketContext';
import SignInNudge from '@/components/SignInNudge';
import { findProductByIds, productHasOptions } from '@/utils/productUtils';
import { supabase } from '@/lib/supabase';
import { STORE_CONFIG } from '@/constants/api';
import { getStoreProfile, getMenuCategories, getGroupsByCategory } from '@/services/apiService';
import { APP_CONFIG } from '@/constants/config';
import { IBaseProduct, MenuCategory } from '@/types/store';
import { useStore } from '@/contexts/StoreContext';

const { height: H } = Dimensions.get('screen');
const TAB_BAR_HEIGHT = Platform.OS === 'android' ? 45 : 80;

const dynamicStyles = (themeColors: any) => StyleSheet.create({
  container: { backgroundColor: themeColors.background },
  locationText: { color: themeColors.primary },
  locationBanner: { backgroundColor: themeColors.primary },
  locationBannerText: { color: '#fff' }, // White text on purple is good
  noResultsText: { color: themeColors.text },
  noResultsSubtext: { color: themeColors.text, opacity: 0.7 },
});

export default function FeedScreen() {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [carouselResetTrigger, setCarouselResetTrigger] = useState(0);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { setTheme } = useTabTheme();
  const themeColors = Colors[colorScheme];
  const styles = { ...staticStyles, ...dynamicStyles(themeColors) };
  const bottomOffset = TAB_BAR_HEIGHT + insets.bottom;
  const { location, loading: locationLoading } = useLocation();
  const { restaurants: allRestaurants, feedContent, loading, reshuffleRestaurants } = useRestaurantData();
  const { searchQuery, setSearchQuery, searchResults, isSearching, setSearchType } = useSearch(allRestaurants, []);
  const { addItem } = useBasket();

  const openMenuScreen = useCallback((restaurantId: string, itemId?: string) => {
    const restaurant = allRestaurants.find(r => r.id === restaurantId);
    const storeId = restaurant?.store_id || STORE_CONFIG.TEST_STORE_ID;
    router.push({
      pathname: '/menu',   // ← route to the new screen
      params: { id: String(restaurantId), storeId, itemId },
    });
  }, [allRestaurants]);

  // Track previous search state to detect when search is cleared
  const prevIsSearching = useRef(isSearching);
  // Track previous restaurant to only reset carousel when restaurant changes
  const prevRestaurantId = useRef<string | null>(null);

  // Use search results when searching, otherwise use all restaurants
  const restaurants: RestaurantWithDistance[] = isSearching ? searchResults : allRestaurants;

  // Ref to control scrolling when search results change
  const listRef = useRef<FlatList<any>>(null);
  const {
    vIndex,
    visibleHIndex,
    onViewableChange,
    updateHorizontalIndex,
    resetIndexes,
  } = useViewabilityTracking();

  useFocusEffect(
    useCallback(() => {
      setTheme('dark');
    }, [setTheme])
  );

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      // On focus do nothing special here
      return () => {
        // On blur: ensure menu modal is closed so it doesn't overlay other screens
        setMenuModalVisible(false);
        setSelectedRestaurant(null);
        setSelectedMenuItem(undefined);
      };
    }, [])
  );

  /* one stable object – create it once with useRef */
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 5, // 5 % for percent fields
  }).current;

  React.useEffect(() => {
    // Detect when search is cleared (was searching, now not searching)
    if (prevIsSearching.current && !isSearching) {
      reshuffleRestaurants();
    }
    prevIsSearching.current = isSearching;
  }, [isSearching, reshuffleRestaurants]);

  React.useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    resetIndexes();
  }, [searchResults]);

  React.useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [vIndex]);

  React.useEffect(() => {
    // AnalyticsService.logScreenView('Feed', 'MainScreen');
  }, []);

  React.useEffect(() => {
    setSearchType('restaurants');
  }, [setSearchType]);

  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantWithDistance | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<FeedContentItem | undefined>(undefined);
  const [menuDataCache, setMenuDataCache] = useState<{[restaurantId: string]: {categories: MenuCategory[], products: IBaseProduct[]}}>({});
  const { setStoreState } = useStore();

  const loadMenuDataForRestaurant = useCallback(async (restaurant: RestaurantWithDistance) => {
    // Check if we already have menu data cached 
    if (menuDataCache[restaurant.id]) {
      return menuDataCache[restaurant.id];
    }

    try {
      const storeId = restaurant.store_id || STORE_CONFIG.TEST_STORE_ID; 

      const profile = await getStoreProfile(storeId);
      if (!profile) throw new Error('Failed to fetch store profile');

      const { categories: menuCategories } = await getMenuCategories(profile.StoreURL, storeId);
      if (!menuCategories || menuCategories.length === 0) {
        throw new Error('No menu categories available');
      }

      const productCategories = menuCategories.filter((c) => c.CatType === 1);
      const allProducts: IBaseProduct[] = [];

      for (const category of productCategories) {
        const groups = await getGroupsByCategory(profile.StoreURL, storeId, category.ID);
        groups.forEach((g) => {
          if (g.DeProducts) {
            const withCat = g.DeProducts.map((p) => ({
              ...p, 
              CategoryID: category.ID, 
              CategoryName: category.Name, 
            }));
            allProducts.push(...withCat);
          }
        });
      }

      const menuData = { categories: menuCategories, products: allProducts };
      setMenuDataCache(prev => ({ ...prev, [restaurant.id]: menuData }));
      return menuData; 
    } catch (error) {
      console.error('Failed to load menu data:', error);
      return null; 
    }
  }, [menuDataCache]);

  const handleOrderPress = useCallback(async (
    restaurant: RestaurantWithDistance,
    selectedItem: FeedContentItem 
  ) => {
    console.log('🛒 handleOrderPress called with:', { restaurant: restaurant.name, selectedItem });
 
    if (!APP_CONFIG.ORDERING_ENABLED) {
      router.push(`/restaurant/${restaurant.id}`);
      return;
    }
 
    // Load menu data for this restaurant
    console.log('📋 Loading menu data for restaurant:', restaurant.id);
    const menuData = await loadMenuDataForRestaurant(restaurant);
    if (!menuData) {
      console.error('Failed to load menu data for restaurant');
      return;
    }

    // Set store context for this restaurant
    const storeId = restaurant.store_id || STORE_CONFIG.TEST_STORE_ID;
    setStoreState((prev) => ({ 
      ...prev, 
      nearestStoreId: storeId,
      categories: menuData.categories
    }));
 
    console.log('📋 Menu data loaded, searching for product with IDs:', {
      cat_id: selectedItem.cat_id,
      grp_id: selectedItem.grp_id,
      pro_id: selectedItem.pro_id
    });
 
    // Find the product using Supabase IDs
    const product = findProductByIds(
      menuData.categories,
      selectedItem.cat_id,
      selectedItem.grp_id,
      selectedItem.pro_id
    );
 
    if (!product) {
      console.error('Product not found:', {
        cat_id: selectedItem.cat_id,
        grp_id: selectedItem.grp_id,
        pro_id: selectedItem.pro_id
      });
      return;
    }
 
    console.log('✅ Product found:', product.Name);
 
    // Check if product requires options
    const requiresOptions = product.Modifiable &&
      (product.DeGroupedPrices?.DePrices?.length > 1 ||
       product.ToppingGrpID ||
       productHasOptions(product));
 
    console.log('🔧 Product requires options:', requiresOptions);
 
    if (!requiresOptions) {
      // Add directly to basket with correct parameters
      console.log('➕ Adding product directly to basket');
      addItem(product, [], [], []); // product, options, toppings, availableToppings
    }
 
    // Always navigate to menu after adding (or if options required)
    console.log('🧭 Navigating to menu screen');
    openMenuScreen(restaurant.id, selectedItem.id);
  }, [loadMenuDataForRestaurant, openMenuScreen, addItem, setStoreState]);

  const handleMenuPress = useCallback((restaurantId: string) => {
    openMenuScreen(restaurantId);
  }, [openMenuScreen]);

  const renderRestaurant = useCallback(
    ({ item, index }: { item: RestaurantWithDistance; index: number }) => {
      const feedItems = feedContent[item.id] || [];
      const isCurrent = index === vIndex;
      const isPreloaded = Math.abs(index - vIndex) <= 2;

      if (!isCurrent && !isPreloaded) {
        return <View style={{ width: '100%', height: H }} />;
      }

      const rowMode = !isScreenFocused
        ? 'off'
        : index === vIndex
          ? 'play'
          : index === vIndex + 1
            ? 'warm'
            : 'off';

      return (
        <RestaurantCard
          restaurant={item}
          feedItems={feedItems}
          rowMode={rowMode}
          isVisible={isCurrent && isScreenFocused}
          onHorizontalScroll={(idx) => updateHorizontalIndex(item.id, idx)}
          onOrderPress={(menuItemId) => handleOrderPress(item, feedItems.find(item => item.id === menuItemId))}
          onMenuPress={handleMenuPress}
          distance={item.distance}
          isDescriptionExpanded={isCurrent ? isDescriptionExpanded : false}
          setIsDescriptionExpanded={setIsDescriptionExpanded}
          resetTrigger={carouselResetTrigger}
          bottomOffset={bottomOffset}
        />
      );
    },
    [feedContent, vIndex, carouselResetTrigger, updateHorizontalIndex, handleOrderPress, isScreenFocused, bottomOffset]
  );

  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: H,
      offset: H * index,
      index,
    }),
    []
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { flex: 1, paddingBottom: 88 }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        {locationLoading && (
          <Text style={styles.locationText}>Getting your location...</Text>
        )}
        {!locationLoading && (
          <Text style={styles.locationText}>Loading restaurants...</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* TopOverlay at page level */}
      <TopOverlay
        restaurantName={restaurants[vIndex]?.name || ''}
        distance={restaurants[vIndex]?.distance}
        currentIndex={visibleHIndex}
        totalItems={feedContent[restaurants[vIndex]?.id]?.length ?? 0}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onCategoryPress={(category) => setSearchQuery(category)}
      />

      {isSearching && restaurants.length === 0 ? (
        <View style={[styles.container, styles.center, styles.noResultsContainer]}>
          <Text style={styles.noResultsText}>No restaurants found</Text>
          <Text style={styles.noResultsSubtext}>
            Try adjusting your search terms
          </Text>
        </View>
      ) : !isSearching && restaurants.length === 0 ? (
        <View style={[styles.container, styles.center]}>
          <Text style={styles.noResultsText}>No restaurants available</Text>
          <Text style={styles.noResultsSubtext}>
            Check back later for new restaurants
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={restaurants}
          testID="restaurant-flatlist"
          bounces={false}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          keyExtractor={(r) => r.id.toString()}
          renderItem={renderRestaurant}
          onViewableItemsChanged={onViewableChange}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={getItemLayout}
          snapToOffsets={restaurants.map((_, index) => index * H)}
          disableIntervalMomentum={true}
          scrollEventThrottle={16}
          maxToRenderPerBatch={2}
          windowSize={2}
          initialNumToRender={1}
          updateCellsBatchingPeriod={50}
        />
      )}

      {!location && (
        <View style={styles.locationBanner}>
          <Text style={styles.locationBannerText}>
            Enable location for nearby restaurants
          </Text>
        </View>
      )}

      <SignInNudge topOverlayHeight={88} />
    </View>
  );
}

const staticStyles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  noResultsContainer: {
    paddingTop: 0,
  },
  locationText: {
    marginTop: 10,
    fontSize: 16
  },
  locationBanner: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
  },
  locationBannerText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600'
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    textAlign: 'center'
  },
  signInNudge: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  nudgeTitle: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  nudgeButton: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  nudgeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
