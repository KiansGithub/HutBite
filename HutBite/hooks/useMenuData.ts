import { useState, useEffect, useCallback } from 'react';
import {
  getStoreProfile,
  getWebSettings,
  getMenuCategories,
  getGroupsByCategory,
  getToppings,
} from '@/services/apiService';
import { STORE_CONFIG } from '@/constants/api';
import type { IStoreProfile, IWebSettings, MenuCategory, IBaseProduct } from '@/types/store';
import { useStore } from '@/contexts/StoreContext';

export interface MenuData {
  storeProfile: IStoreProfile | null;
  webSettings: IWebSettings | null;
  categories: MenuCategory[];
  products: IBaseProduct[];
  loading: boolean;
  error: string | null;
}

export interface UseMenuDataReturn extends MenuData {
  loadMenuData: () => Promise<void>;
  buildImageUrl: (imgUrl?: string) => string | null;
  productCategories: MenuCategory[];
}

export function useMenuData(storeId?: string): UseMenuDataReturn {
  const [loading, setLoading] = useState(true);
  const [storeProfile, setStoreProfile] = useState<IStoreProfile | null>(null);
  const [webSettings, setWebSettings] = useState<IWebSettings | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [products, setProducts] = useState<IBaseProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { setStoreState } = useStore();

  const loadMenuData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const effectiveStoreId = storeId || STORE_CONFIG.TEST_STORE_ID;

      // Update StoreContext with the correct store ID
      setStoreState((prev) => ({ ...prev, nearestStoreId: effectiveStoreId }));

      const profile = await getStoreProfile(effectiveStoreId);
      if (!profile) throw new Error('Failed to fetch store profile');
      setStoreProfile(profile);

      const settings = await getWebSettings(profile.StoreURL);
      if (!settings) throw new Error('Failed to fetch web settings');
      setWebSettings(settings);

      const { categories: menuCategories, optionCatId, toppingCatId } = await getMenuCategories(
        profile.StoreURL,
        effectiveStoreId
      );
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
        optionCategoryId: optionCatId,
        toppingCategoryId: toppingCatId,
      }));

      // Only fetch toppings if we have a valid topping category ID
      if (toppingCatId) {
        const fetchedToppings = await getToppings(profile.StoreURL, effectiveStoreId, toppingCatId);
        setStoreState((prev) => ({ ...prev, toppingGroups: fetchedToppings }));
      } else {
        console.warn('No topping category found for store:', effectiveStoreId);
        setStoreState((prev) => ({ ...prev, toppingGroups: [] }));
      }

      const productCategories = menuCategories.filter((c) => c.CatType === 1);
      if (productCategories.length > 0) {
        const allProducts: IBaseProduct[] = [];
        for (const category of productCategories) {
          const groups = await getGroupsByCategory(profile.StoreURL, effectiveStoreId, category.ID);
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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  }, [storeId, setStoreState]);

  useEffect(() => {
    loadMenuData();
  }, [loadMenuData]);

  const buildImageUrl = useCallback(
    (imgUrl?: string) =>
      !imgUrl || !webSettings?.urlForImages ? null : `${webSettings.urlForImages}${imgUrl}`,
    [webSettings?.urlForImages]
  );

  const productCategories = categories.filter((c) => c.CatType === 1);

  return {
    storeProfile,
    webSettings,
    categories,
    products,
    loading,
    error,
    loadMenuData,
    buildImageUrl,
    productCategories,
  };
}
