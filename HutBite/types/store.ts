import {
    IBaseProduct,
} from './product';

/**
 * Represents the possible order types
 */
export type OrderType = 'DELIVERY' | 'COLLECTION'

/**
 * Store profile information returned from the API
 */
export interface IStoreProfile {
    StoreURL: string;
    Phone: string;
    Address?: string;
    StoreName?: string;
    OpeningTime?: string;
    CloseingTime?: string;
    Status?: number;
}

/**
 * Web settings containing Stripe payment configuration
 */
export interface IWebSettings {
    cardPaymentInfo: {
        publishableKey: string;
        secretKey?: string;
        currency?: string;
    };
    urlForImages?: string;
    additionalSettings?: Record<string, unknown>;
    minDlvValue?: number;
}

/**
 * Menu service endpoint response
 */
export interface IMenuSRV {
    MenuSRV: string;
}

/**
 * XML store response structure
 */
export interface IStoreResponse {
    Stores: {
        $: {
            ID: string;
        };
    };
}

/**
 * Store closing check response
 */
export interface IStoreClosedResponse {
    isStoreClosed: boolean;
}

/**
 * Main component state interface
 */
export interface IStoreState {
    loading: boolean;
    postcode: string;
    nearestStoreId: string;
    storePhone: string;
    orderType: OrderType | '';
}

/**
 * Menu category information returned from the API
 */
export interface MenuCategory {
    ID: string;
    Name: string;
    Description: string | null;
    ImgUrl: string | null;
    IsActive: boolean;
    SoloInStore: boolean;
    ViewOrder: number;
    CatType: number;
    DeGroup: string | null;
    DeServer: string | null;
    DisplyAble: boolean;
    IsHNH: boolean;
}

/**
 * Menu group information returned from the groups API
 */
export interface MenuGroup {
    ID: string;
    Name: string;
    Description: string;
    ImgUrl: string | null;
    IsActive: boolean;
    SoloInStore: boolean;
    ViewOrder: number;
    CatID: string;
    DeProducts: IBaseProduct[];
    Displayable: boolean;
    GrpType: string;
    Min4DLV: number;
}

/**
 * Header mode options for the DynamicHeader Component
 */
export type HeaderMode = 'back' | 'store';

/**
 * Store information displayed in teh header panel
 */
export interface StoreDisplayInfo {
    name: string;
    address: string;
}

/**
 * Response structure for groups in category API endpoint
 */
export type GroupsResponse = {
    /**
     * Array of menu groups within a category
     */
    groups: MenuGroup[];
}

/**
 * Response structure for GetMinDlv API endpoint
 */
export interface IGetMinDlvResponse {
    deMsgBody: string;
    deMsgType: number;
    dataObject: number;
    winPizzaObject: number;
}

// Re-export product interfaces
export {
    IBaseProduct,
};
