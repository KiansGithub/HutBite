import type { ReactNode } from 'react';
import type { IBasketItem } from './basket/types';
import type { Dispatch } from 'react';


/**
 * Props for the BasketIcon Component 
 * @property onPress - Optional callback function when basket is pressed 
 * @property testID - Optional test ID for testing purposes 
 */
export interface BasketIconProps {
    /** Optional callback function when basket is pressed */
    onPress?: () => void; 
    /** Optional test ID for testing purposes */
    testID?: string; 
    /** Number of items in basket to display in badge */
    itemCount?: number; 
}

/**
 * Props for the Header Component
 * @property centerText - Text to display in the center of the header 
 * @propery leftArrow - Optional component to override default navigation buttons on the left side
 * @property rightButton - Optional component to display on the right side
 */
export interface HeaderProps {
    /** Text displayed in the center of the header */
    centerText: string; 
    /** Optional component rendered on the left side */
    leftArrow?: ReactNode; 
}

/**
 * State interface for basket management 
 */
export interface BasketState {
    /** Array of items in the basket */
    items: IBasketItem[];
    /** Loading state of the basket */
    isLoading: boolean; 
    /** Error message if any */
    error?: string; 
}

/**
 * Actions available for basket management 
 */
export type BasketAction = 
    | { type: 'ADD_ITEM'; payload: IBasketItem }
    | { type: 'REMOVE_ITEM'; payload: string }
    | { type: 'UPDATE_QUANTITY'; payload: { basketItemId: string; quantity: number } }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'CLEAR_BASKET' }
    | { type: 'EDIT_ITEM'; payload: {
        basketItemId: string; 
        options?: Array<{
            option_list_name: string; 
            ref: string; 
            label: string; 
            price: string; 
            quantity: number; 
        }>;
        price: string; 
    }};



/**
 * Context type for basket management 
 */
export interface BasketContextType {
    state: BasketState; 
    dispatch: Dispatch<BasketAction>; 
}

/**
 * Props for the QuickAddButton Componenet 
 * @property onPress - Callback function when button is pressed 
 * @property disabled - Opitonal flag to disable the button 
 * @property size - Optional size for the button icon 
 * @property testID - Optional test ID for testing purposes
 */
export interface QuickAddButtonProps {
    onPress: () => void; 
    disabled?: boolean; 
    size?: number; 
    testID?: string; 
}