/**
 * ProductTransformService - Product transformation logic
 * Handles converting products to basket items and related transformations
 */

import type { IBasketItem } from '@/types/basket';
import type { IBaseProduct } from '@/types/product';
import type { IToppingSelection, ITopping } from '@/types/toppings';
import type { IOptionSelections } from '@/types/productOptions';
import { buildImageUrl } from '@/utils/imageUtils';
import { calculateItemPrice, generateSimpleId } from '@/utils/basketUtils';

export interface BasketOption {
  option_list_name: string;
  ref: string;
  label: string;
  price: string;
  quantity: number;
  isExtra?: boolean;
}

export class ProductTransformService {
  /**
   * Transform IBaseProduct to BasketItem format
   */
  static transformProductToBasketItem(
    product: IBaseProduct,
    urlForImages: string | undefined,
    currency: string,
    options: BasketOption[] = [],
    toppingSelections?: IToppingSelection[],
    availableToppings?: ITopping[]
  ): IBasketItem {
    console.log("📦 Transforming Product to Basket Item: ", {
      product: product.Name,
      options,
      toppings: toppingSelections,
      availableToppings
    });

    // Convert options array to options object for calculateItemPrice
    const optionsObject = options.reduce((acc, opt) => {
      acc[opt.option_list_name] = opt.ref;
      return acc;
    }, {} as IOptionSelections);

    // Use calculated price
    const calculatedPrice = calculateItemPrice(
      product,
      { options: optionsObject, toppings: toppingSelections },
      toppingSelections,
      availableToppings
    );

    const imageUrl = buildImageUrl(urlForImages, product.ImgUrl);
    const sku_ref = `${product.CatID || ''}-${product.GrpID || ''}-${product.ID || ''}`;

    // Identify extra toppings
    const finalOptions = this.processOptionsWithExtraFlags(options, product);

    return {
      basketItemId: generateSimpleId(),
      id: product.ID,
      product_name: product.Name,
      sku_ref: sku_ref || '',
      imageUrl: imageUrl,
      price: `${calculatedPrice.total.toFixed(2)} ${currency}`,
      quantity: '1',
      options: finalOptions,
      subtotal: `${calculatedPrice.total.toFixed(2)} ${currency}`,
      cat_id: product.CatID ?? null,
      grp_id: product.GrpID ?? null,
      pro_id: product.ID ?? null,
    };
  }

  /**
   * Process options and mark extra toppings
   */
  private static processOptionsWithExtraFlags(
    options: BasketOption[],
    product: IBaseProduct
  ): BasketOption[] {
    return options.map(option => {
      if (option.option_list_name === 'Topping') {
        const defaultTopping = product.Toppings?.find(t => t.ID === option.ref);
        const isExtra = !defaultTopping || option.quantity > (defaultTopping.OrgPortion || 0);
        return { ...option, isExtra };
      }
      return option;
    });
  }

  /**
   * Extract toppings from options array
   */
  static extractToppingsFromOptions(options: BasketOption[]): IToppingSelection[] {
    return options
      .filter(opt => opt.option_list_name === "Topping")
      .map(topping => ({
        id: topping.ref,
        name: topping.label,
        portions: topping.quantity
      }));
  }

  /**
   * Process and validate options array
   */
  static processOptions(options: BasketOption[]): BasketOption[] {
    const processedOptions = options || [];
    
    // Ensure all options have required fields with defaults
    processedOptions.forEach(option => {
      option.quantity = option.quantity || 1;
    });

    return processedOptions;
  }

  /**
   * Check if two basket items are identical (same product with same options)
   */
  static areItemsIdentical(item1: IBasketItem, item2: IBasketItem): boolean {
    // Check if it's the same product
    if (item1.id !== item2.id) return false;

    // Check if it has the same options
    if (item1.options.length !== item2.options.length) return false;

    // Compare each option
    const normalizeRef = (ref: string) => ref.split('-').pop() || ref;

    const optionsMatch = item2.options.every(newOption => {
      // For toppings, we need to check both ref and quantity
      if (newOption.option_list_name === "Topping") {
        return item1.options.some(existingOption =>
          existingOption.option_list_name === newOption.option_list_name &&
          normalizeRef(existingOption.ref) === normalizeRef(newOption.ref) &&
          existingOption.quantity === newOption.quantity
        );
      }

      // For other options, just check ref
      return item1.options.some(existingOption =>
        existingOption.option_list_name === newOption.option_list_name &&
        existingOption.ref === newOption.ref
      );
    });

    return optionsMatch;
  }

  /**
   * Find existing item in basket that matches the new item
   */
  static findExistingItem(items: IBasketItem[], newItem: IBasketItem): number {
    return items.findIndex(existingItem => 
      this.areItemsIdentical(existingItem, newItem)
    );
  }

  /**
   * Check if a product is a deal/offer
   */
  static isProductOffer(itemOrProduct: IBasketItem | IBaseProduct): boolean {
    return 'DeOfferItems' in itemOrProduct;
  }

  /**
   * Check if item is a product (has ID field) vs already a basket item
   */
  static isProduct(itemOrProduct: IBasketItem | IBaseProduct): itemOrProduct is IBaseProduct {
    return 'ID' in itemOrProduct;
  }
}
