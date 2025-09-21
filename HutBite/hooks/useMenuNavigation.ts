import { useState, useCallback, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import type { IBaseProduct } from '@/types/store';
import { FeedContentItem } from '@/types/feedContent';

export type MenuRoute = 'menu' | 'options';

export interface InitialProductIds {
  cat_id: string;
  grp_id: string;
  pro_id: string;
  auto_add: boolean;
}

export interface UseMenuNavigationReturn {
  route: MenuRoute;
  activeCategory: string | null;
  activeProduct: IBaseProduct | null;
  setRoute: (route: MenuRoute) => void;
  setActiveCategory: (categoryId: string | null) => void;
  setActiveProduct: (product: IBaseProduct | null) => void;
  handleBackPress: () => void;
  handleProductPress: (product: IBaseProduct) => void;
  handleOptionsConfirm: (selections: any) => void;
  handleInitialProduct: (
    initialProductIds: InitialProductIds | undefined,
    products: IBaseProduct[],
    loading: boolean
  ) => void;
}

export function useMenuNavigation(
  addItem: (product: IBaseProduct, options?: any[], toppings?: any, availableToppings?: any) => void,
  formatOptionsForBasket: (options: any, product: IBaseProduct, optionCategoryId?: string) => any[],
  formatToppingsForBasket: (toppings: any[], toppingGroups: any, product: IBaseProduct) => any[],
  toppingGroups: any,
  optionCategoryId: string | null
): UseMenuNavigationReturn {
  const [route, setRoute] = useState<MenuRoute>('menu');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeProduct, setActiveProduct] = useState<IBaseProduct | null>(null);

  // Add flag to track if initial product has been processed
  const initialProductProcessed = useRef(false);

  const handleBackPress = useCallback(() => {
    if (route === 'options') {
      setRoute('menu');
      setActiveProduct(null);
    } else {
      router.back();
    }
  }, [route]);

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

  const handleOptionsConfirm = useCallback(
    (selections: any) => {
      if (!activeProduct) return;

      const formattedOptions = formatOptionsForBasket(
        selections.options,
        activeProduct,
        optionCategoryId ?? undefined
      );
      const formattedToppings = formatToppingsForBasket(
        selections.toppings || [],
        toppingGroups,
        activeProduct
      );

      addItem(
        activeProduct,
        [...formattedOptions, ...formattedToppings],
        selections.toppings,
        selections.availableToppings
      );

      setRoute('menu');
      setActiveProduct(null);
    },
    [activeProduct, addItem, toppingGroups, optionCategoryId, formatOptionsForBasket, formatToppingsForBasket]
  );

  const handleInitialProduct = useCallback(
    (
      initialProductIds: InitialProductIds | undefined,
      products: IBaseProduct[],
      loading: boolean
    ) => {
      // Prevent processing initial product multiple times
      if (initialProductProcessed.current || !initialProductIds || products.length === 0 || loading) {
        return;
      }

      console.log('🎯 Looking for initial product with IDs:', initialProductIds);

      // Find the product by matching cat_id, grp_id, and pro_id
      const product = products.find(p => {
        // Check if this product matches the IDs from feed
        return p.CatID === initialProductIds.cat_id &&
               p.GrpID === initialProductIds.grp_id &&
               p.ID === initialProductIds.pro_id;
      });

      if (product) {
        console.log('✅ Found initial product:', product.Name);

        // Mark as processed to prevent future triggers
        initialProductProcessed.current = true;

        if (initialProductIds.auto_add) {
          // Trigger the same logic as handleProductPress
          handleProductPress(product);
        }
      } else {
        console.error('❌ Product not found with IDs:', initialProductIds);
        // Log available products for debugging
        console.log('Available products:', products.map(p => ({
          name: p.Name,
          CategoryID: p.CatID,
          GrpID: p.GrpID,
          ID: p.ID
        })));
      }
    },
    [handleProductPress]
  );

  return {
    route,
    activeCategory,
    activeProduct,
    setRoute,
    setActiveCategory,
    setActiveProduct,
    handleBackPress,
    handleProductPress,
    handleOptionsConfirm,
    handleInitialProduct,
  };
}
