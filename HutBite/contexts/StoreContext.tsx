import React, { createContext, useState, useContext } from 'react';
import type { MenuCategory, MenuGroup, IBaseProduct } from '@/types/store';
import { IOptionSelections } from '@/types/productOptions';
import { ITopping, IToppingGroup } from '@/types/toppings';
import { IBasket } from '@/types/basket';
import { isStoreOpen, getStoreStatusMessage, isOrderingDisabled, type StoreHours } from '@/utils/storeHours';
import { APP_CONFIG } from '@/constants/config';

// Interface for storeInfo 
export interface IStoreInfo {
    name?: string; 
    address?: string; 
    postalCode?: string; 
    openingTime?: string; 
    closingTime?: string; 
    status?: number;
    openingHours?: string; 
    isOpen?: boolean; 
    closingIn?: number; 
}

// Define the shape of the state that will be shared across the app. 
interface StoreState {
    postcode: string; 
    nearestStoreId: string; 
    storePhone: string; 
    currency: string; 
    storeInfo?: {
        name?: string;
        address?: string;
        postalCode?: string;
        latitude?: string;
        longitude?: string;
        status?: number;
        openingHours?: string;
        isOpen?: boolean | null;
        closingIn?: number;
        opening_time?: string | null;
        closing_time?: string | null;
    };
    urlForImages: string;
    isStoreInfoVisible: boolean;
    stripeStoreUrl: string; 
    error: string | null;
    selectedCategoryId: string | null;
    minDeliveryValue: number; 
    stripeApiKey: string; 
    own_delivery: boolean;
    menuSRV: string; 
    orderType: string; 
    categories: MenuCategory[];
    groups: MenuGroup[];
    toppingGroups: IToppingGroup[];
    deliveryCharge: number; 
    serviceCharge: number; 
    selectedGroupId: string | null;
    optionCategoryId: string | null;
    toppingCategoryId: string | null;
    loading: boolean; 
    storeClosedMode: boolean;
}

// Extends the StoreState to include the `setStoreState function 
// which allows components to update the shared state.
interface StoreContextType extends StoreState {
    setStoreState: React.Dispatch<React.SetStateAction<StoreState>>; 
    handleError: (errorMessage: string) => void;
    selectStore: (storeId: string) => Promise<void>;
    isCurrentStoreOpen: () => boolean;
    getStoreStatus: () => string;
    canOrder: () => boolean;
}

// Define the default state values for the context
const defaultState: StoreState = {
    postcode: '',
    nearestStoreId: '',
    storePhone: '',
    currency: '',
    storeInfo: undefined,
    urlForImages: '',
    isStoreInfoVisible: false,
    stripeStoreUrl: '',
    error: null,
    selectedCategoryId: null,
    stripeApiKey: '',
    minDeliveryValue: 0,
    own_delivery: false,
    menuSRV: '',
    orderType: '',
    groups: [],
    toppingGroups: [],
    deliveryCharge: APP_CONFIG.DELIVERY_FEE, 
    serviceCharge: 0,
    selectedGroupId: null,
    optionCategoryId: null,
    toppingCategoryId: null,
    categories: [],  // Placeholder for menu categories.
    loading: false,
    storeClosedMode: false,
};

// Create the context with the default state and a placeholder `setStoreState function.
// The `createContext` function initializes a context object.
const StoreContext = createContext<StoreContextType>({
    ...defaultState, 
    setStoreState: () => {},
    handleError: () => {},
    selectStore: () => Promise.resolve(),
    isCurrentStoreOpen: () => false,
    getStoreStatus: () => '',
    canOrder: () => false,
});

// Define the StoreProvider component, which wraps the app and provides the shared state.
export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Use React's useState to manage the store state within the provider.
    const [storeState, setStoreState] = useState(defaultState);

    // Utility method to handle errors in the store context 
    const handleError = (errorMessage: string) => {
        setStoreState(prev => ({ ...prev, error: errorMessage}));
    }

    // Method to select and load store data
    const selectStore = async (storeId: string) => {
        try {
            setStoreState(prev => ({ ...prev, loading: true, error: null }));
 
            // This would be implemented based on your store selection logic
            // For now, just update the nearestStoreId
            setStoreState(prev => ({
                ...prev,
                nearestStoreId: storeId,
                loading: false
            }));
        } catch (error) {
            handleError(error instanceof Error ? error.message : 'Failed to select store');
            setStoreState(prev => ({ ...prev, loading: false }));
        }
    };

    // Method to check if the current store is open
    const isCurrentStoreOpen = () => {
        if (!storeState.storeInfo) return false;
        return isStoreOpen(storeState.storeInfo);
    };

    // Method to get the store status message
    const getStoreStatus = () => {
        if (!storeState.storeInfo) return '';
        return getStoreStatusMessage(storeState.storeInfo);
    };

    // Method to check if ordering is disabled
    const canOrder = () => {
        if (!storeState.storeInfo) return false;
        return !isOrderingDisabled(storeState.storeInfo);
    };

    // Provide the store state and the `setStoreState` function to child components.
    return (
        <StoreContext.Provider value={{ 
            ...storeState, 
            setStoreState, 
            handleError, 
            selectStore, 
            isCurrentStoreOpen,
            getStoreStatus,
            canOrder,
            }}>
            {children}
        </StoreContext.Provider>
    );
};

// Create a custom hook to easily access the Store
export const useStore = () => useContext(StoreContext);