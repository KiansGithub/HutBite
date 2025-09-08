import { parseString } from 'xml2js';
import { API, AUTH, buildApiUrl } from '@/constants/api';
import type {
    IStoreProfile,
    IWebSettings,
    IMenuSRV,
    IStoreResponse,
    OrderType,
    IStoreClosedResponse,
    MenuCategory,
    MenuGroup,
    IGetMinDlvResponse,
    IBaseProduct
} from '@/types/store';
import type { IToppingGroup } from '@/types/toppings';

/**
 * Store status response from UnitStatus API
 */
export interface IStoreStatusResponse {
    isOpen: boolean;
}

/**
 * Determines the correct StoreType based on the country code
 * @param postcode - Customer's postcode
 * @returns Correct StoreType
*/
const getStoreType = (postcode: string): string => {
    // Check if postcode belongs to Germany or UK
    const isGermany = /^[0-9]{5}$/.test(postcode);
    return isGermany ? 'TGFPIZZAGERMANY' : 'TGFPIZZA';
}

/**
 * Finds the nearest store based on postcode
 * @param postcode - Customer's postcode
 * @returns Promise with store ID or null if not found
 */
export const findNearestStore = async (postcode: string): Promise<string | null> => {
    try {
        const storeType = getStoreType(postcode);

        const url = buildApiUrl(API.ENDPOINTS.GET_NEAREST_STORE, {
            Postcode: postcode,
            StoreType: storeType
        });

        const response = await fetch(url, {
            method: 'GET',
            headers: AUTH.HEADERS
        });

        const xmlText = await response.text();

        return new Promise<string | null>((resolve, reject) => {
            parseString(xmlText, { explicitArray: false }, (err, result: IStoreResponse) => {
                if (err) {
                    console.error('Error parsing XML:', err);
                    reject(err);
                    return;
                }

                const storeId = result.Stores.$.ID;
                resolve(storeId);
            });
        });
    } catch (error) {
        console.error('Error finding nearest store:', error);
        return null;
    }
};

/**
 * Fetches store profile information
 * @param storeId - Store identifier
 * @returns Promise with store profile data
 */
export const getStoreProfile = async (storeId: string): Promise<IStoreProfile | null> => {
    try {
        const url = buildApiUrl(API.ENDPOINTS.GET_STORE_PROFILE, { StoreID: storeId });
        const response = await fetch(url);
        const data = await response.json();

        if (!data?.StoreURL) {
            throw new Error('Invalid store profile response');
        }

        return {
            StoreURL: data.StoreURL,
            Phone: data.Phone,
            Address: data.Address,
            StoreName: data.StoreName,
        };
    } catch (error) {
        console.error('Error fetching store profile:', error);
        return null;
    }
};

/**
 * Fetches store opening/closing status
 * @param storeUrl - Base URL for the store
 * @returns Promise with store status information (true if closed, false if open)
 */
export const getStoreStatus = async (storeUrl: string): Promise<boolean | null> => {
    try {
        const url = `${storeUrl}/api/UnitStatus`;

        const response = await fetch(url, {
            method: 'GET',
            headers: AUTH.HEADERS
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const statusText = await response.text();
        return statusText.trim().toLowerCase() === 'false';
    } catch (error) {
        console.error('Error fetching store status:', error);
        return null;
    }
};

/**
 * Fetches web setting including Stripe configuration
 * @param storeUrl - Base URL for the store
 * @returns Promise with web settings data
 */
export const getWebSettings = async (storeUrl: string): Promise<IWebSettings | null> => {
    try {
        const url = `${storeUrl}/api/StoreWebSetting`;
        const response = await fetch(url);
        const data = await response.json();
        if (!data?.cardPaymentInfo?.publishableKey) {
            throw new Error('Invalid web settings response');
        }

        return {
            cardPaymentInfo: {
                publishableKey: data.cardPaymentInfo.publishableKey
            },
            additionalSettings: data.additionalSettings,
            urlForImages: data.urlForImages,
            minDlvValue: data.minDlvValue
        };
    } catch (error) {
        console.error('Error fetching web settings: ', error);
        return null;
    }
};

/**
 * Fetches menu categories from the menu service
 * @param stripeStoreUrl - Base URL for the store
 * @param storeId - Store identifier
 * @returns Promise with array of menu categories
 */
export const getMenuCategories = async (
    stripeStoreUrl: string,
    storeId: string
): Promise<MenuCategory[]> => {
    try {
        const url = `${stripeStoreUrl}/api/Categorys?StoreID=${storeId}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: AUTH.HEADERS,
        });

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error('Invalid menu categories response format');
        }

        return data;
    } catch (error) {
        console.error('Error fetching menu categories:', error);
        return [];
    }
}

/**
 * Fetches groups within a category from the menu service
 * @param stripeStoreUrl - The store's specific API URL
 * @param storeId - ID of the store
 * @param categoryId - ID of the category to fetch groups for
 * @returns Promise with array of menu groups
 */
export const getGroupsByCategory = async (
    stripeStoreUrl: string,
    storeId: string,
    categoryId: string,
) : Promise<MenuGroup[]> => {
    try {
        const fullUrl = `${stripeStoreUrl}/api/${API.ENDPOINTS.GROUPS_IN_CATEGORY}` +
            `?StoreID=${storeId}&CatType=PRODUCT&CatID=${categoryId}`;

        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: AUTH.HEADERS
        });

        if(!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return Array.isArray(data) ? data: [];
    } catch (error) {
        console.error('Error fetching category groups:', error);
        return [];
    }
};

/**
 * Fetches all toppings
 */
export const getToppings = async(
    stripeStoreUrl: string,
    storeId: string
) : Promise<IToppingGroup[]> => {
    try {
        const fullUrl = `${stripeStoreUrl}/api/${API.ENDPOINTS.GROUPS_IN_CATEGORY}` +
            `?StoreID=${storeId}&CatType=TOPPING&CatID=9`;

        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: AUTH.HEADERS
        });

        if(!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data as IToppingGroup[];
    } catch (error) {
        console.error('Error fetching toppings:', error);
        return [];
    }
}

/**
 * Fetches offers from the GetOffers API endpoint
 * @param stripeStoreUrl - Base URL for the store
 * @param storeId - Store identifier
 * @returns Promise with array of offer products
 */
export const getOffers = async (stripeStoreUrl: string, storeId: string): Promise<IBaseProduct[]> => {
    try {
        const url = `${stripeStoreUrl}/api/${API.ENDPOINTS.GET_OFFERS}?StoreID=${storeId}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: AUTH.HEADERS
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.winPizzaObject) {
            return [];
        }

        const offersData = JSON.parse(data.winPizzaObject);
        let dealProducts: IBaseProduct[] =[];

        if (offersData.DeGroup && Array.isArray(offersData.DeGroup)) {
            offersData.DeGroup.forEach((group: any) => {
                if (group.DeProducts && Array.isArray(group.DeProducts)) {
                    dealProducts = dealProducts.concat(group.DeProducts);
                }
            });
        }

        return dealProducts;
    } catch (error) {
        console.error('Error fetching offers:', error);
        return [];
    }
};
