/**
 * BasketCalculationService - Pure price calculation logic
 * Handles all basket-related calculations without side effects
 */

import type { IBasketItem } from '@/types/basket';

export class BasketCalculationService {
  /**
   * Safely parse price strings, removing currency symbols
   */
  static parsePriceString(price: string): number {
    return parseFloat(price.replace(/[^0-9.-]+/g, '')) || 0;
  }

  /**
   * Calculate subtotal for a product with options
   */
  static calculateProductSubtotal(
    basePrice: number,
    currency: string,
    options: Array<{ price: string; quantity: number }> = []
  ): string {
    const optionsTotal = options.reduce((sum, option) => {
      return sum + (this.parsePriceString(option.price) * option.quantity);
    }, 0);
    return `£${(basePrice + optionsTotal).toFixed(2)}`;
  }

  /**
   * Calculate subtotal for a basket item with new quantity
   */
  static calculateItemSubtotal(item: IBasketItem, newQuantity: number = 1): string {
    // Calculate base price
    const basePrice = this.parsePriceString(item.price);

    // Calculate options total
    const optionsTotal = item.options.reduce((sum, option) => {
      const optionPrice = this.parsePriceString(option.price);
      return sum + (optionPrice * option.quantity);
    }, 0);

    // Calculate total with quantity
    const total = (basePrice + optionsTotal) * newQuantity;

    return `£${total.toFixed(2)}`;
  }

  /**
   * Calculate total basket value
   */
  static calculateBasketTotal(items: IBasketItem[]): string {
    const total = items.reduce((sum, item) => {
      const itemTotal = this.parsePriceString(item.subtotal);
      return sum + itemTotal;
    }, 0);
    
    return `£${total.toFixed(2)}`;
  }

  /**
   * Calculate total number of items in basket
   */
  static calculateItemCount(items: IBasketItem[]): number {
    return items.reduce((count, item) => count + parseInt(item.quantity, 10), 0);
  }

  /**
   * Check if basket meets minimum delivery value
   */
  static validateMinimumDeliveryValue(
    total: string,
    minValue: number
  ): { valid: boolean; message?: string } {
    const totalValue = this.parsePriceString(total);

    if (totalValue < minValue) {
      const difference = (minValue - totalValue).toFixed(2);
      return {
        valid: false,
        message: `Your order doesn't meet the minimum delivery value of £${minValue.toFixed(2)}. Add £${difference} more to continue.`
      };
    }

    return { valid: true };
  }

  /**
   * Calculate delivery fee based on basket total and store settings
   */
  static calculateDeliveryFee(
    basketTotal: string,
    freeDeliveryThreshold?: number,
    standardDeliveryFee?: number
  ): number {
    if (!freeDeliveryThreshold || !standardDeliveryFee) return 0;
    
    const total = this.parsePriceString(basketTotal);
    return total >= freeDeliveryThreshold ? 0 : standardDeliveryFee;
  }

  /**
   * Calculate final order total including delivery
   */
  static calculateOrderTotal(basketTotal: string, deliveryFee: number): string {
    const total = this.parsePriceString(basketTotal) + deliveryFee;
    return `£${total.toFixed(2)}`;
  }
}
