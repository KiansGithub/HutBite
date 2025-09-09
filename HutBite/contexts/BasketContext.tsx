import React, { createContext, useContext, ReactNode } from 'react';
import { useBasket as useBasketHook } from '@/hooks/useBasket';
import type { IBasketItem } from '@/types/basket';
import type { IBaseProduct } from '@/types/product';
import { IToppingSelection, IToppingGroup, ITopping } from '@/types/toppings';
import { useToppings } from '@/hooks/useToppings';
import { useStore } from './StoreContext';

/**
 * Interface for the basket context values 
 */
interface BasketContextValue {
    // State 
    items: IBasketItem[];
    isLoading: boolean; 
    error?: string; 
    total: string; 
    itemCount: number; 
    currentStoreId?: string;
    resetBasket: () => void; 
    editItem: (
        id: string, 
        options: Array<{
            option_list_name: string; 
            ref: string; 
            label: string; 
            price: string; 
            quantity: number;
        }>,
        toppings?: IToppingSelection[]
    ) => void;
    getFormattedBasketData: () => IBasketItem[];

    // Actions 
    addItem: (
        itemOrProduct: IBasketItem | IBaseProduct, 
        options: Array<{
            option_list_name: string; 
            ref: string; 
            label: string; 
            price: string; 
            quantity: number; 
        }>,
        toppings?: IToppingSelection[],
        availableToppings?: ITopping[]
    ) => void; 
    removeItem: (id: string) => void; 
    updateQuantity: (id: string, quantity: number) => void; 
    clearBasket: () => void; 
    setLoading: (loading: boolean) => void; 
    setError: (error: string) => void;
}

// Create context with initial empty values 
const BasketContext = createContext<BasketContextValue | undefined>(undefined);

/**
 * Props for the BasketProvider component
 */
interface BasketProviderProps {
    children: ReactNode; 
}

/**
 * const { showToast } = useToast();
 * Provider component for basket state 
 */
export function BasketProvider({ children }: BasketProviderProps) {

    const { getAllToppingGroups } = useToppings();
    
    const {
        items, isLoading, error, total, itemCount, currentStoreId,
        addItem, removeItem, updateQuantity, 
        clearBasket, setLoading, setError, editItem
    }= useBasketHook();

    // Function to get formatted basket data for oder submission 
    const getFormattedBasketData = () => {
        return items.map((item: any) => ({
            ...item, 
            price: item.price.startsWith('€') ? item.price : `€${item.price}`,
            subtotal: item.subtotal.startsWith('€') ? item.subtotal : `€${item.subtotal}`
        }));
    };

    const basketValues: BasketContextValue = { items, isLoading, error, total, itemCount, currentStoreId, editItem, addItem, removeItem, updateQuantity, 
        clearBasket, setLoading, setError , resetBasket: clearBasket, getFormattedBasketData
    };

    const { urlForImages } = useStore();

    return (
    <BasketContext.Provider value={basketValues}>
        {children}
    </BasketContext.Provider>
    );
}

/**
 * Hook to access basket context
 */
export function useBasket(): BasketContextValue {
    const context = useContext(BasketContext);
    if (context === undefined) {
        throw new Error('useBasket must be used within a BasketProvider');
    }
    return context; 
}