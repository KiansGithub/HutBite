// components/restaurant/RestaurantMenuView.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import { FeedContentItem } from '@/types/feedContent';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  getStoreProfile,
  getWebSettings,
  getMenuCategories,
  getGroupsByCategory,
  getToppings,
} from '@/services/apiService';
import { LinearGradient } from 'expo-linear-gradient';
import { STORE_CONFIG } from '@/constants/api';
import type { IStoreProfile, IWebSettings, MenuCategory, IBaseProduct } from '@/types/store';
import { RestaurantCategoryHeader } from '@/components/RestaurantCategoryHeader';
import { RestaurantCategoryContent } from '@/components/RestaurantCategoryContent';
import { ProductOptionsContent } from '@/components/ProductOptionsModal';
import { useBasket } from '@/contexts/BasketContext';
import { useStore } from '@/contexts/StoreContext';
import {
  formatOptionsForBasket,
  formatToppingsForBasket,
} from '@/utils/basketUtils';
import { processProductOptions } from '@/utils/productOptionsUtils';

const colors = Colors.light;

export default function RestaurantMenuView({
  initialMenuItem,
}: {
  initialMenuItem?: FeedContentItem;
}) {
  const insets = useSafeAreaInsets();
  const topPad = (insets.top || 0) + 6;

  const [loading, setLoading] = useState(true);
  const [storeProfile, setStoreProfile] = useState<IStoreProfile | null>(null);
  const [webSettings, setWebSettings] = useState<IWebSettings | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [products, setProducts] = useState<IBaseProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // internal “route” inside this full-screen view
  const [route, setRoute] = useState<'menu' | 'options'>('menu');
  const [activeProduct, setActiveProduct] = useState<IBaseProduct | null>(null);

  const { items, addItem } = useBasket();
  const { setStoreState, toppingGroups } = useStore();

  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    try {
      setLoading(true);
      setError(null);

      const storeId = STORE_CONFIG.TEST_STORE_ID;

      const profile = await getStoreProfile(storeId);
      if (!profile) throw new Error('Failed to fetch store profile');
      setStoreProfile(profile);

      const settings = await getWebSettings(profile.StoreURL);
      if (!settings) throw new Error('Failed to fetch web settings');
      setWebSettings(settings);

      const menuCategories = await getMenuCategories(profile.StoreURL, storeId);
      if (!menuCategories || menuCategories.length === 0) {
        throw new Error('No menu categories available');
      }
      setCategories(menuCategories);

      setStoreState((prev) => ({
        ...prev,
        storeInfo: {
          name: profile.StoreName,
          address: profile.Address,
          phone: profile.Phone,
          isOpen: true,
          status: 1,
        },
        stripeStoreUrl: profile.StoreURL,
        stripeApiKey: settings.cardPaymentInfo.publishableKey,
        minDeliveryValue: settings.minDlvValue || 0,
        urlForImages: settings.urlForImages || '',
        currency: 'GBP',
      }));

      const fetchedToppings = await getToppings(profile.StoreURL, storeId);
      setStoreState((prev) => ({ ...prev, toppingGroups: fetchedToppings }));

      const productCategories = menuCategories.filter((c) => c.CatType === 1);
      if (productCategories.length > 0) {
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
        setProducts(allProducts);
        setActiveCategory(productCategories[0]?.ID ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const buildImageUrl = (imgUrl?: string) =>
    !imgUrl || !webSettings?.urlForImages ? null : `${webSettings.urlForImages}${imgUrl}`;

  const handleProductPress = useCallback(
    (product: IBaseProduct) => {
      if (product.Modifiable && product.DeGroupedPrices) {
        setActiveProduct(product);
        setRoute('options');
      } else {
        addItem(product, []); // direct add
      }
    },
    [addItem]
  );

  const processedOptions = useMemo(() => {
    if (!activeProduct?.DeGroupedPrices) return { groups: [] };
    return processProductOptions(activeProduct, activeProduct.DeGroupedPrices);
  }, [activeProduct]);

  const productToppings = useMemo(() => {
    if (!activeProduct?.ToppingGrpID) return [];
    const grp = (toppingGroups || []).find((g: any) => String(g.ID) === String(activeProduct.ToppingGrpID));
    return grp?.DeProducts || [];
  }, [activeProduct, toppingGroups]);

  const hasToppings = useMemo(
    () => Boolean(activeProduct?.ToppingGrpID && productToppings.length > 0),
    [activeProduct, productToppings]
  );

  const handleOptionsConfirm = useCallback(
    (selections: any) => {
      if (!activeProduct) return;

      const formattedOptions = formatOptionsForBasket(
        selections.options,
        activeProduct,
        activeProduct.CatID
      );
      const formattedToppings = formatToppingsForBasket(selections.toppings || [], toppingGroups);

      addItem(
        activeProduct,
        [...formattedOptions, ...formattedToppings],
        selections.toppings,
        selections.availableToppings
      );

      setRoute('menu');
      setActiveProduct(null);
    },
    [activeProduct, addItem, toppingGroups]
  );

  const productCategories = categories.filter((c) => c.CatType === 1);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['left', 'right', 'bottom']}
    >
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={[colors.primaryStart, colors.primaryEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientTop, { paddingTop: topPad }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => (route === 'options' ? (setRoute('menu'), setActiveProduct(null)) : router.back())}
            style={styles.headerIcon}
          >
            <Ionicons name={route === 'options' ? 'chevron-back' : 'close'} size={22} color="#111" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{storeProfile?.StoreName || 'Restaurant'}</Text>
            <Text style={styles.headerPill}>{route === 'options' ? 'Choose options' : 'Open'}</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="information-circle-outline" size={22} color="#111" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="share-outline" size={22} color="#111" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {route === 'menu' && (
        <>
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
          <View style={[styles.menuSection, { backgroundColor: colors.background }]} >
            <Text style={[styles.menuTitle, { color: colors.text }]}>MENU</Text>
            <Text style={[styles.menuSubtitle, { color: colors.text }]}>Available Today at 10:00 AM</Text>
          </View>

          {/* Category Header */}
          {!loading && !error && productCategories.length > 0 && (
            <RestaurantCategoryHeader
              categories={productCategories}
              selectedCategoryId={activeCategory}
              onCategoryPress={(id) => setActiveCategory(id)}
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
            <TouchableOpacity
              style={[styles.basketFooter, { backgroundColor: colors.primary }]}
              onPress={() => router.navigate('/(main)/basket')}
            >
              <View style={styles.basketInfo}>
                <Ionicons name="basket" size={20} color="#fff" />
                <Text style={styles.basketText}>{storeProfile?.StoreName || 'Restaurant'}</Text>
                <Text style={styles.basketCount}>{items.length}</Text>
              </View>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* OPTIONS */}
      {route === 'options' && activeProduct && (
        <ProductOptionsContent
          product={activeProduct}
          onDismiss={() => { setRoute('menu'); setActiveProduct(null); }}
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
  container: { flex: 1, zIndex: 1000 },
  gradientTop: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: 'hidden',
    paddingBottom: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  headerIcon: {
    height: 36, width: 36, borderRadius: 18,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(17,17,17,0.08)',
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 4 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerPill: {
    color: '#fff', fontSize: 12, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden',
  },
  headerRight: { flexDirection: 'row', gap: 8 },

  deliveryInfo: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20 },
  deliveryItem: { alignItems: 'center' },
  deliveryValue: { fontSize: 18, fontWeight: '700' },
  deliveryLabel: { fontSize: 12, marginTop: 2, opacity: 0.8 },

  menuSection: { paddingHorizontal: 16, paddingVertical: 16 },
  menuTitle: { fontSize: 16, fontWeight: '700' },
  menuSubtitle: { fontSize: 12, marginTop: 2, opacity: 0.8 },

  basketFooter: {
    paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: 16, marginBottom: 16, borderRadius: 25,
  },
  basketInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  basketText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8, flex: 1 },
  basketCount: {
    color: '#fff', fontSize: 16, fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
  },
});
