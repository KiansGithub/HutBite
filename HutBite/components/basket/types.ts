import type { IBasketItem } from '@/types/basket';
import { IBaseProduct } from '@/types/product';
import type { IOptionSelections } from '@/types/productOptions';
import type { IToppingSelection } from '@/types/toppings';

/**
 * Props for the Basket component 
 */
export interface BasketProps {
    /** Array of items in the basket */
    items: IBasketItem[];
    /** Loading state of the basket */
    isLoading?: boolean; 
    /** Optional test ID for testing purposes */
    testID?: string; 
}

/**
 * Props for the BasketItem component 
 */
export interface BasketItemProps {
    /** The basket item to display */
    item: IBasketItem; 
    /** Callback when quantity is changed */
    onQuantityChange: (id: string, quantity: number) => void; 
    /** Callback when item is removed */
    onRemove: (id: string) => void; 
    
    onEdit: any;
    /** Optional test ID for testing purposes */
    testID?: string; 
}

/** State for empty basket display */
export interface EmptyBasketProps {
    /** Optional test ID for testing purposes */
    testID?: string; 
}

/**
 * Props for the BasketSummary component
 */
export interface BasketSummaryProps {
    /** Total number of items in the basket */
    totalItems: number; 
    /** Total price of all items in the basket */
    totalPrice: string; 
    /** Optiontal test ID for testing purposes */
    testID?: string; 
}

export type { IBasketItem } from '@/types/basket';