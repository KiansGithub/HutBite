/**
 * useBasketValidation - Validation logic for basket operations
 * Handles store hours validation and business rules
 */

import { useCallback } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { isStoreOpen, getStoreStatusMessage } from '@/utils/storeHours';
import { BasketCalculationService } from '@/services/BasketCalculationService';

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export function useBasketValidation() {
  const { storeInfo } = useStore();

  /**
   * Validate if items can be added to basket (store hours check)
   */
  const validateAddItem = useCallback((): ValidationResult => {
    if (storeInfo && !isStoreOpen(storeInfo)) {
      const message = getStoreStatusMessage(storeInfo);
      return {
        isValid: false,
        message: `Cannot add items: ${message}`
      };
    }

    return { isValid: true };
  }, [storeInfo]);

  /**
   * Validate minimum delivery value
   */
  const validateMinimumDeliveryValue = useCallback((
    basketTotal: string,
    minValue: number
  ): ValidationResult => {
    const result = BasketCalculationService.validateMinimumDeliveryValue(basketTotal, minValue);
    return {
      isValid: result.valid,
      message: result.message
    };
  }, []);

  /**
   * Validate basket before checkout
   */
  const validateBasketForCheckout = useCallback((
    basketTotal: string,
    itemCount: number,
    minDeliveryValue?: number
  ): ValidationResult => {
    // Check if basket is empty
    if (itemCount === 0) {
      return {
        isValid: false,
        message: 'Your basket is empty. Add some items to continue.'
      };
    }

    // Check store hours
    const storeValidation = validateAddItem();
    if (!storeValidation.isValid) {
      return storeValidation;
    }

    // Check minimum delivery value if provided
    if (minDeliveryValue && minDeliveryValue > 0) {
      const minValueValidation = validateMinimumDeliveryValue(basketTotal, minDeliveryValue);
      if (!minValueValidation.isValid) {
        return minValueValidation;
      }
    }

    return { isValid: true };
  }, [validateAddItem, validateMinimumDeliveryValue]);

  /**
   * Validate item quantity (business rules)
   */
  const validateItemQuantity = useCallback((
    quantity: number,
    maxQuantity: number = 99
  ): ValidationResult => {
    if (quantity < 1) {
      return {
        isValid: false,
        message: 'Quantity must be at least 1'
      };
    }

    if (quantity > maxQuantity) {
      return {
        isValid: false,
        message: `Maximum quantity is ${maxQuantity}`
      };
    }

    return { isValid: true };
  }, []);

  /**
   * Validate basket size (prevent too many items)
   */
  const validateBasketSize = useCallback((
    currentItemCount: number,
    maxItems: number = 50
  ): ValidationResult => {
    if (currentItemCount >= maxItems) {
      return {
        isValid: false,
        message: `Maximum ${maxItems} items allowed in basket`
      };
    }

    return { isValid: true };
  }, []);

  return {
    validateAddItem,
    validateMinimumDeliveryValue,
    validateBasketForCheckout,
    validateItemQuantity,
    validateBasketSize,
  };
}
