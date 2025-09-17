import { useReducer, useCallback, useMemo, useEffect } from 'react';
import type { BasketState, BasketAction } from '../components/types';
import type { IBasketItem } from '../components/basket/types';
import type { IBaseProduct } from '@/types/product';
import type { IToppingSelection, IToppingGroup, ITopping } from '@/types/toppings';
import { buildImageUrl } from '@/utils/imageUtils';
import { IStoreInfo, useStore } from '@/contexts/StoreContext';
import { formatCurrency } from '@/utils/orderUtils';
import { calculateItemPrice, generateSimpleId } from '@/utils/basketUtils';
import { IOptionSelections } from '@/types/productOptions';
import { isStoreOpen, getStoreHoursMessage, isStoreClosingSoon, getStoreClosingMessage } from '@/utils/storeUtils';

const initialState: BasketState = {
    items: [],
    isLoading: false, 
    error: undefined, 
};

// utility function to safely parse price strings 
function parsePriceString(price: string): number {
    return parseFloat(price.replace(/[^0-9.-]+/g, '')) || 0;
}

// Calculate subtotal for a product with options 
function calculateProductSubtotal(
    basePrice: number, 
    currency: string,
    options: Array<{ price: string; quantity: number}> = []
): string {
    const optionsTotal = options.reduce((sum, option) => {
        return sum + (parsePriceString(option.price) * option.quantity);
    }, 0);
    return `£${(basePrice + optionsTotal).toFixed(2)}`;
}

// Transform IBaseProduct to BasketItem format 
function transformProductToBasketItem(
    product: IBaseProduct, 
    urlForImages: string | undefined, 
    currency: string,
    options: Array<{
        option_list_name: string; 
        ref: string; 
        label: string; 
        price: string; 
        quantity: number; 
    }> = [],
    toppingSelections?: IToppingSelection[],
    availableToppings?: ITopping[],
): IBasketItem {
    console.log("📦 Transforming Product to Basket Item: ", {
        product: product.Name, 
        options, 
        toppings: toppingSelections, 
        availableToppings
    });

    // COnvert options array to options object for calculateItemPrice 
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

    return {
        basketItemId: generateSimpleId(),
        id: product.ID, 
        product_name: product.Name, 
        sku_ref: sku_ref || '',
        imageUrl: imageUrl,
        price: `${calculatedPrice.total.toFixed(2)} ${currency}`,
        quantity: '1',
        options: options || [], 
        subtotal: `${calculatedPrice.total.toFixed(2)} ${currency}`,
        cat_id: product.CatID ?? null,
        grp_id: product.GrpID ?? null,
        pro_id: product.ID ?? null,
    }
}

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
                        subtotal: calculateItemSubtotal(item, action.payload.quantity),
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
                    subtotal: calculateItemSubtotal(
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

function calculateItemSubtotal(item: IBasketItem, newQuantity: number = 1): string {
    // Calculate base price 
    const basePrice = parsePriceString(item.price);
    
    
    // Calculate options total 
    const optionsTotal = item.options.reduce((sum, option) => {
        const optionPrice = parsePriceString(option.price);
        return sum + (optionPrice * option.quantity);
    }, 0);

    // Calculate total with quantity 
    const total = (basePrice + optionsTotal) * newQuantity; 

    return `${total.toFixed(2)}`;
}

export function useBasket() {
    const [state, dispatch] = useReducer(basketReducer, initialState);
    const { urlForImages, currency, storeInfo } = useStore();

    const addItem = useCallback((
        itemOrProduct: IBasketItem | IBaseProduct, 
        options?: Array<{option_list_name: string; ref: string; label: string; price: string; quantity: number}>,
        toppings?: IToppingSelection[],
        availableToppings?: ITopping[],
    ) => {
        console.log("🛒 addItem called with: ", {
            itemOrProduct, 
            options, 
            toppings
        });

        if ('DeOfferItems' in itemOrProduct) {
            console.log("Adding an Offer/Deal with selected items as options:", itemOrProduct);
        }

        if (storeInfo && !isStoreOpen(storeInfo)) {
            const message = getStoreHoursMessage(storeInfo); 
            setError(`Cannot add items: ${message}`);
            return;
        }

        // Ensure options is always an array 
        const processedOptions = options || [];

        const extractedToppings = (options || []).filter(opt => opt.option_list_name === "Topping")
            .map(topping => ({
                id: topping.ref, 
                name: topping.label, 
                portions: topping.quantity
            }));


        // If any options are missing required fields, add defaults 
        processedOptions.forEach(option => {
            option.quantity = option.quantity || 1; 
        });

        const item = 'ID' in itemOrProduct 
            ? transformProductToBasketItem(itemOrProduct, urlForImages, currency, options, toppings, availableToppings)
            : itemOrProduct; 
        
        // Check if this istem alreayd exists in the basket 
        const existingItemIndex = state.items.findIndex(existingItem => {
            // Check if its's the same product 
            if (existingItem.id !== item.id) return false; 

            // Check if it has the same option s
            if (existingItem.options.length !== item.options.length) return false; 

            // Compare each option 
            const normalizeRef = (ref: string) => ref.split('-').pop() || ref;

            const optionsMatch = item.options.every(newOption => {
                // For toppings, we need to check both ref and quantity
                if (newOption.option_list_name === "Topping") {
                    return existingItem.options.some(existingOption =>
                        existingOption.option_list_name === newOption.option_list_name &&
                        normalizeRef(existingOption.ref) === normalizeRef(newOption.ref) &&
                        existingOption.quantity === newOption.quantity
                    );
                }

                // For other options, just check ref 
                return existingItem.options.some(existingOption => 
                    existingOption.option_list_name === newOption.option_list_name && 
                    existingOption.ref === newOption.ref
                );
            });

            return optionsMatch; 
        });

        if (existingItemIndex >= 0) {
            // Item already exists, increase quantity 
            const currentQuantity = parseInt(state.items[existingItemIndex].quantity, 10);
            dispatch({
                type: 'UPDATE_QUANTITY',
                payload: {
                    basketItemId: state.items[existingItemIndex].basketItemId, 
                    quantity: currentQuantity + 1
                }
            });
        } else {
            // New item, add to basket 
            dispatch({ type: 'ADD_ITEM', payload: item});
        }
        }, [state.items, urlForImages]);

    const editItem = useCallback((
        basketItemId: string, 
        options?: Array<{
            option_list_name: string; 
            ref: string; 
            label: string; 
            price: string; 
            quantity: number; 
        }>, 
        toppings?: IToppingSelection[]
    ) => {
        // Implementation here
        dispatch({ type: 'EDIT_ITEM', payload: {
            basketItemId, 
            options: options || [], 
            price: '0.00'
        }});
    }, []);

    const removeItem = useCallback((basketItemId: string) => {
        dispatch({ type: 'REMOVE_ITEM', payload: basketItemId });
    }, []);

    const updateQuantity = useCallback((basketItemId: string, quantity: number) => {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { basketItemId, quantity } });
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

    // Calculate total basket value 
    const total = useMemo(() => {
        return '£' + state.items
          .reduce((sum, item) => {
            const itemTotal = parseFloat(item.subtotal.replace(/[^0-9.-]+/g, ''));
            return sum + itemTotal;
          }, 0)
          .toFixed(2);
    }, [state.items]);

    // Calculate total number of items 
    const itemCount = useMemo(() => {
        return state.items.reduce((count, item) => count + parseInt(item.quantity, 10), 0);
    }, [state.items]);

    // Check if basket meets minimum delivery value 
    const meetsMinDeliveryValue = useCallback((minValue: number): { valid: boolean; message?: string} => {
        const totalValue = parseFloat(total.replace(/[^0-9.-]+/g, ''));

        if (totalValue < minValue) {
            const difference = (minValue - totalValue).toFixed(2);
            return {
                valid: false, 
                message: `Your order doesn't meet the minimum delivery value of ${minValue.toFixed(2)}.
                Add ${difference} more to continue.`
            };
        }

        return { valid: true };
    }, [total]);

    return {
        // State
        items: state.items,
        isLoading: state.isLoading, 
        error: state.error,
        // Actions
        addItem, 
        editItem,
        removeItem, 
        updateQuantity, 
        clearBasket, 
        setLoading, 
        setError,
        total, 
        itemCount,
        meetsMinDeliveryValue
    };
}