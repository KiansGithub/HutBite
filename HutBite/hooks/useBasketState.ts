/**
 * useBasketState - Pure state management for basket
 * Handles only state operations without business logic (100 lines max)
 */

import { useReducer, useCallback, useEffect, useRef } from 'react';
import type { BasketState, BasketAction } from '@/types/basket';
import type { IBasketItem } from '@/types/basket';
import { useStore } from '@/contexts/StoreContext';
import { BasketCalculationService } from '@/services/BasketCalculationService';

const initialState: BasketState = {
  items: [],
  isLoading: false,
  error: undefined,
};

function basketReducer(state: BasketState, action: BasketAction): BasketState {
  switch (action.type) {
    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, action.payload],
        error: undefined,
      };

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((item) => item.basketItemId !== action.payload),
        error: undefined,
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map((item) =>
          item.basketItemId === action.payload.basketItemId
            ? {
                ...item,
                quantity: action.payload.quantity.toString(),
                subtotal: BasketCalculationService.calculateItemSubtotal(item, action.payload.quantity),
              }
            : item
        ),
        error: undefined,
      };

    case 'EDIT_ITEM':
      return {
        ...state,
        items: state.items.map((item) =>
          item.basketItemId === action.payload.basketItemId
            ? {
                ...item,
                options: action.payload.options || [],
                price: action.payload.price,
                subtotal: BasketCalculationService.calculateItemSubtotal(
                  item,
                  parseInt(item.quantity, 10)
                ),
              }
            : item
        ),
        error: undefined,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'CLEAR_BASKET':
      return {
        ...initialState,
      };

    default:
      return state;
  }
}

export function useBasketState() {
  const [state, dispatch] = useReducer(basketReducer, initialState);
  const { nearestStoreId } = useStore();
  const previousStoreId = useRef<string | null>(null);

  // Clear basket when switching between different stores
  useEffect(() => {
    if (
      previousStoreId.current !== null &&
      nearestStoreId &&
      nearestStoreId !== previousStoreId.current &&
      state.items.length > 0
    ) {
      console.log(
        `🔄 Store changed from ${previousStoreId.current} to ${nearestStoreId}, clearing basket`
      );
      dispatch({ type: 'CLEAR_BASKET' });
    }
    previousStoreId.current = nearestStoreId;
  }, [nearestStoreId, state.items.length]);

  const addItem = useCallback((item: IBasketItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  }, []);

  const removeItem = useCallback((basketItemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: basketItemId });
  }, []);

  const updateQuantity = useCallback((basketItemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { basketItemId, quantity } });
  }, []);

  const editItem = useCallback((basketItemId: string, options: any[], price: string) => {
    dispatch({ type: 'EDIT_ITEM', payload: { basketItemId, options, price } });
  }, []);

  const clearBasket = useCallback(() => {
    dispatch({ type: 'CLEAR_BASKET' });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  return {
    // State
    items: state.items,
    isLoading: state.isLoading,
    error: state.error,
    // Actions
    addItem,
    removeItem,
    updateQuantity,
    editItem,
    clearBasket,
    setLoading,
    setError,
    // Store context
    currentStoreId: nearestStoreId,
  };
}
