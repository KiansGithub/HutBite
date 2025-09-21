import { useMemo } from 'react';
import type { IBaseProduct } from '@/types/store';
import { processProductOptions } from '@/utils/productOptionsUtils';
import { handleSupabaseProductAddition } from '@/utils/productUtils';
import {
  formatOptionsForBasket,
  formatToppingsForBasket,
} from '@/utils/basketUtils';

/**
 * MenuService - Business logic for menu operations
 * Handles product processing, option management, and basket integration
 */
export class MenuService {
  /**
   * Process product options for display in the options modal
   */
  static processProductOptions(product: IBaseProduct | null) {
    if (!product?.DeGroupedPrices) return { groups: [] };
    return processProductOptions(product, product.DeGroupedPrices);
  }

  /**
   * Get toppings for a specific product
   */
  static getProductToppings(product: IBaseProduct | null, toppingGroups: any[]) {
    if (!product?.ToppingGrpID) return [];
    const grp = (toppingGroups || []).find((g: any) => String(g.ID) === String(product.ToppingGrpID));
    return grp?.DeProducts || [];
  }

  /**
   * Check if a product has toppings available
   */
  static hasProductToppings(product: IBaseProduct | null, productToppings: any[]) {
    return Boolean(product?.ToppingGrpID && productToppings.length > 0);
  }

  /**
   * Format options and toppings for basket addition
   */
  static formatSelectionsForBasket(
    selections: any,
    product: IBaseProduct,
    optionCategoryId: string | null,
    toppingGroups: any[]
  ) {
    const formattedOptions = formatOptionsForBasket(
      selections.options,
      product,
      optionCategoryId ?? undefined
    );
    
    const formattedToppings = formatToppingsForBasket(
      selections.toppings || [],
      toppingGroups,
      product
    );

    return {
      options: formattedOptions,
      toppings: formattedToppings,
      allFormatted: [...formattedOptions, ...formattedToppings],
    };
  }

  /**
   * Handle adding a Supabase product to the basket
   */
  static addSupabaseProduct(
    categories: any[],
    products: IBaseProduct[],
    catId: string,
    grpId: string,
    proId: string,
    onDirectAdd: (product: IBaseProduct) => void,
    onOptionsRequired: (product: IBaseProduct) => void
  ) {
    return handleSupabaseProductAddition(
      categories,
      products,
      catId,
      grpId,
      proId,
      onDirectAdd,
      onOptionsRequired
    );
  }

  /**
   * Find a product by its IDs (used for initial product selection from feed)
   */
  static findProductByIds(
    products: IBaseProduct[],
    catId: string,
    grpId: string,
    proId: string
  ): IBaseProduct | null {
    return products.find(p => {
      return p.CatID === catId && 
             p.GrpID === grpId && 
             p.ID === proId;
    }) || null;
  }

  /**
   * Check if a product requires options selection
   */
  static requiresOptions(product: IBaseProduct): boolean {
    return Boolean(product.Modifiable && product.DeGroupedPrices);
  }

  /**
   * Get the first product category ID from a list of categories
   */
  static getFirstCategoryId(categories: any[]): string | null {
    const productCategories = categories.filter((c) => c.CatType === 1);
    return productCategories.length > 0 ? productCategories[0].ID : null;
  }

  /**
   * Validate if menu data is ready for display
   */
  static isMenuDataReady(
    loading: boolean,
    error: string | null,
    categories: any[],
    products: IBaseProduct[]
  ): boolean {
    return !loading && !error && categories.length > 0 && products.length > 0;
  }

  /**
   * Get debug information for product lookup
   */
  static getProductDebugInfo(products: IBaseProduct[]) {
    return products.map(p => ({
      name: p.Name,
      CategoryID: p.CatID,
      GrpID: p.GrpID,
      ID: p.ID
    }));
  }
}

/**
 * Hook for using menu business logic with memoization
 */
export function useMenuService(
  activeProduct: IBaseProduct | null,
  toppingGroups: any[]
) {
  const processedOptions = useMemo(() => {
    return MenuService.processProductOptions(activeProduct);
  }, [activeProduct]);

  const productToppings = useMemo(() => {
    return MenuService.getProductToppings(activeProduct, toppingGroups);
  }, [activeProduct, toppingGroups]);

  const hasToppings = useMemo(() => {
    return MenuService.hasProductToppings(activeProduct, productToppings);
  }, [activeProduct, productToppings]);

  return {
    processedOptions,
    productToppings,
    hasToppings,
  };
}
