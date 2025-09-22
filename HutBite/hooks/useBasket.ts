/**
 * useBasket - Orchestrated basket hook
 * Combines state management, calculations, transformations, and validation
 */

import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import type { IBasketItem } from '@/types/basket';
import type { IBaseProduct } from '@/types/product';
import type { IToppingSelection, ITopping } from '@/types/toppings';
import { useStore } from '@/contexts/StoreContext';
import { useBasketState } from './useBasketState';
import { useBasketValidation } from './useBasketValidation';
import { BasketCalculationService } from '@/services/BasketCalculationService';
import { ProductTransformService, type BasketOption } from '@/services/ProductTransformService';

export function useBasket() {
  const { urlForImages, currency, nearestStoreId } = useStore();
  const basketState = useBasketState();
  const validation = useBasketValidation();
  const previousStoreId = useRef<string | null>(null);

  // State for basket clear confirmation 
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [pendingStoreId, setPendingStoreId] = useState<string | null>(null);

  // Calculate derived values using memoization
  const total = useMemo(() => {
    return BasketCalculationService.calculateBasketTotal(basketState.items);
  }, [basketState.items]);

  const itemCount = useMemo(() => {
    return BasketCalculationService.calculateItemCount(basketState.items);
  }, [basketState.items]);

  // Clear basket when switching between different stores
  useEffect(() => {
    if (
      previousStoreId.current !== null &&
      nearestStoreId &&
      nearestStoreId !== previousStoreId.current &&
      basketState.items.length > 0
    ) {
      console.log(
        `🔄 Store change detected from ${previousStoreId.current} to ${nearestStoreId}, showing confirmation`
      );
      setPendingStoreId(nearestStoreId);
      setShowClearConfirmation(true);
      return; // Don't update previousStoreId yet
    }
    previousStoreId.current = nearestStoreId;
  }, [nearestStoreId, basketState.items.length]);

  // Handle confirmation modal actions
  const handleClearConfirm = useCallback(() => {
    basketState.clearBasket();
    previousStoreId.current = pendingStoreId;
    setShowClearConfirmation(false);
    setPendingStoreId(null);
  }, [basketState.clearBasket, pendingStoreId]);
 
  const handleClearCancel = useCallback(() => {
    setShowClearConfirmation(false);
    setPendingStoreId(null);
    // Keep the previous store ID unchanged
  }, []);

  // Enhanced addItem with business logic
  const addItem = useCallback((
    itemOrProduct: IBasketItem | IBaseProduct,
    options?: BasketOption[],
    toppings?: IToppingSelection[],
    availableToppings?: ITopping[],
  ) => {
    console.log("🛒 addItem called with: ", {
      itemOrProduct,
      options,
      toppings
    });

    // Validate if we can add items (store hours, etc.)
    const addValidation = validation.validateAddItem();
    if (!addValidation.isValid) {
      basketState.setError(addValidation.message || 'Cannot add item');
      return;
    }

    // Check for offers/deals
    if (ProductTransformService.isProductOffer(itemOrProduct)) {
      console.log("Adding an Offer/Deal with selected items as options:", itemOrProduct);
    }

    // Process options
    const processedOptions = ProductTransformService.processOptions(options || []);

    // Transform product to basket item if needed
    const item = ProductTransformService.isProduct(itemOrProduct)
      ? ProductTransformService.transformProductToBasketItem(
          itemOrProduct,
          urlForImages,
          currency,
          processedOptions,
          toppings,
          availableToppings
        )
      : itemOrProduct;

    // Check if item already exists in basket
    const existingItemIndex = ProductTransformService.findExistingItem(basketState.items, item);

    if (existingItemIndex >= 0) {
      // Item already exists, increase quantity
      const currentQuantity = parseInt(basketState.items[existingItemIndex].quantity, 10);
      basketState.updateQuantity(
        basketState.items[existingItemIndex].basketItemId,
        currentQuantity + 1
      );
    } else {
      // New item, add to basket
      basketState.addItem(item);
    }
  }, [
    basketState,
    validation,
    urlForImages,
    currency
  ]);

  // Enhanced editItem with validation
  const editItem = useCallback((
    basketItemId: string,
    options?: BasketOption[],
    toppings?: IToppingSelection[]
  ) => {
    // Find the item to edit
    const item = basketState.items.find(i => i.basketItemId === basketItemId);
    if (!item) {
      basketState.setError('Item not found');
      return;
    }

    // Process new options
    const processedOptions = ProductTransformService.processOptions(options || []);
    
    // Calculate new price (simplified - you might want to enhance this)
    const newPrice = '0.00'; // TODO: Implement proper price recalculation
    
    basketState.editItem(basketItemId, processedOptions, newPrice);
  }, [basketState]);

  // Validation wrapper for minimum delivery value
  const meetsMinDeliveryValue = useCallback((minValue: number) => {
    return validation.validateMinimumDeliveryValue(total, minValue);
  }, [validation, total]);

  // Validation for checkout
  const validateForCheckout = useCallback((minDeliveryValue?: number) => {
    return validation.validateBasketForCheckout(total, itemCount, minDeliveryValue);
  }, [validation, total, itemCount]);

  return {
    // State
    items: basketState.items,
    isLoading: basketState.isLoading,
    error: basketState.error,
    total,
    itemCount,
    currentStoreId: nearestStoreId,

    // Basket clear confirmation
    showClearConfirmation,
    pendingStoreId,
    handleClearConfirm,
    handleClearCancel,

    // Actions
    addItem,
    editItem,
    removeItem: basketState.removeItem,
    updateQuantity: basketState.updateQuantity,
    clearBasket: basketState.clearBasket,
    setLoading: basketState.setLoading,
    setError: basketState.setError,

    // Validation
    meetsMinDeliveryValue,
    validateForCheckout,

    // Utilities (for backward compatibility)
    getFormattedBasketData: () => basketState.items,
    resetBasket: basketState.clearBasket,
  };
}