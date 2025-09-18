/**
 * @fileoverview API Service Layer for HutBite Food Delivery App
 * 
 * This service handles all external API communications including:
 * - Store profile and configuration retrieval
 * - Menu data fetching (categories, groups, products)
 * - Store status and availability checks
 * - Stripe payment configuration
 * - Offer and deal management
 * 
 * All functions handle errors gracefully and return null/empty arrays on failure
 * to prevent app crashes and maintain user experience.
 * 
 * @author HutBite Team
 * @version 1.0.0
 */

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
import { ItemType } from '@/types/enums';

/**
 * Store status response from UnitStatus API
 * @interface IStoreStatusResponse
 * @property {boolean} isOpen - Whether the store is currently open for orders
 */
export interface IStoreStatusResponse {
    isOpen: boolean;
}

/**
 * Determines the correct StoreType based on the country code
 * @param postcode - Customer's postcode
 * @returns Correct StoreType
*/
// const getStoreType = (postcode: string): string => {
    // Check if postcode belongs to Germany or UK
//     const isGermany = /^[0-9]{5}$/.test(postcode);
//     return isGermany ? 'TGFPIZZAGERMANY' : 'TGFPIZZA';
// }

/**
 * Finds the nearest store based on postcode
 * @param postcode - Customer's postcode
 * @returns Promise with store ID or null if not found
 */
// export const findNearestStore = async (postcode: string): Promise<string | null> => {
//     try {
//         const storeType = getStoreType(postcode);

//         const url = buildApiUrl(API.ENDPOINTS.GET_NEAREST_STORE, {
//             Postcode: postcode,
//             StoreType: storeType
//         });

//         const response = await fetch(url, {
//             method: 'GET',
//             headers: AUTH.HEADERS
//         });

//         const xmlText = await response.text();

//         return new Promise<string | null>((resolve, reject) => {
//             parseString(xmlText, { explicitArray: false }, (err: any, result: IStoreResponse) => {
//                 if (err) {
//                     console.error('Error parsing XML:', err);
//                     reject(err);
//                     return;
//                 }

//                 const storeId = result.Stores.$.ID;
//                 resolve(storeId);
//             });
//         });
//     } catch (error) {
//         console.error('Error finding nearest store:', error);
//         return null;
//     }
// };

/**
 * Fetches comprehensive store profile information including contact details and configuration
 * 
 * @async
 * @function getStoreProfile
 * @param {string} storeId - Unique identifier for the store (e.g., 'ElCurioso-20161122')
 * @returns {Promise<IStoreProfile | null>} Store profile data or null if fetch fails
 * 
 * @example
 * ```typescript
 * const profile = await getStoreProfile('ElCurioso-20161122');
 * if (profile) {
 *   console.log(`Store: ${profile.StoreName} at ${profile.Address}`);
 *   console.log(`Phone: ${profile.Phone}`);
 * }
 * ```
 * 
 * @throws {Error} When store profile response is invalid or missing StoreURL
 * @since 1.0.0
 */
export const getStoreProfile = async (storeId: string): Promise<IStoreProfile | null> => {
    try {
        const url = buildApiUrl(API.ENDPOINTS.GET_STORE_PROFILE, { StoreID: storeId });
        console.log("Get store profile: ", url);
        const response = await fetch(url);
        const data = await response.json();

        // TODO: Remove hardcoded StoreURL for production
        // data.StoreURL = 'https://elcurioso.tgfpizza.com'; // for dev purposes 

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
 * Checks if a store is currently open or closed for orders
 * 
 * @async
 * @function getStoreStatus
 * @param {string} storeUrl - Base URL for the store's API (e.g., 'https://elcurioso.tgfpizza.com')
 * @returns {Promise<boolean | null>} True if store is CLOSED, false if OPEN, null on error
 * 
 * @example
 * ```typescript
 * const isClosed = await getStoreStatus('https://elcurioso.tgfpizza.com');
 * if (isClosed === true) {
 *   showClosedMessage();
 * } else if (isClosed === false) {
 *   allowOrdering();
 * }
 * ```
 * 
 * @note The API returns 'false' when store is open, 'true' when closed
 * @since 1.0.0
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
        // API returns 'false' for open, 'true' for closed
        return statusText.trim().toLowerCase() === 'false';
    } catch (error) {
        console.error('Error fetching store status:', error);
        return null;
    }
};

/**
 * Retrieves store web settings including Stripe payment configuration and image URLs
 * 
 * @async
 * @function getWebSettings
 * @param {string} storeUrl - Base URL for the store's API
 * @returns {Promise<IWebSettings | null>} Web settings including Stripe config or null on error
 * 
 * @example
 * ```typescript
 * const settings = await getWebSettings('https://elcurioso.tgfpizza.com');
 * if (settings) {
 *   initializeStripe(settings.cardPaymentInfo.publishableKey);
 *   setImageBaseUrl(settings.urlForImages);
 *   setMinDeliveryValue(settings.minDlvValue);
 * }
 * ```
 * 
 * @throws {Error} When web settings response is invalid or missing publishableKey
 * @since 1.0.0
 */
export const getWebSettings = async (storeUrl: string): Promise<IWebSettings | null> => {
    try {
        const url = `${storeUrl}/api/StoreWebSetting`;
        console.log("Get web settings: ", url);
        const response = await fetch(url);
        const data = await response.json();
        if (!data?.cardPaymentInfo?.publishableKey) {
            throw new Error('Invalid web settings response');
        }

        console.log("stripe publishable key: ", data.cardPaymentInfo.publishableKey);

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
 * Fetches all menu categories for a specific store
 * 
 * @async
 * @function getMenuCategories
 * @param {string} stripeStoreUrl - Store-specific API base URL
 * @param {string} storeId - Unique store identifier
 * @returns {Promise<{ categories: MenuCategory[]; optionCatId: string | null; }>} Array of menu categories and optionCatId, empty array on error
 * 
 * @example
 * ```typescript
 * const categories = await getMenuCategories('https://elcurioso.tgfpizza.com', 'ElCurioso-20161122');
 * categories.forEach(category => {
 *   console.log(`Category: ${category.name} (ID: ${category.id})`);
 * });
 * ```
 * 
 * @deprecated Consider using API.ENDPOINTS.GROUPS_IN_CATEGORY for consistency
 * @todo Update to use centralized API constants instead of hardcoded endpoint
 * @since 1.0.0
 */
export const getMenuCategories = async (
    stripeStoreUrl: string,
    storeId: string
): Promise<{ categories: MenuCategory[]; optionCatId: string | null; }> => {
    try {
        // TODO: Update to use API.ENDPOINTS.GROUPS_IN_CATEGORY for consistency
        const url = `${stripeStoreUrl}/api/Categorys?StoreID=${storeId}`;

        console.log("Get menu categories: ", url);
        const response = await fetch(url, {
            method: 'GET',
            headers: AUTH.HEADERS,
        });

        const data = await response.json();

        console.log("categories from store", JSON.stringify(data, null, 2));

        if (!Array.isArray(data)) {
            throw new Error('Invalid menu categories response format');
        }

        const optionCategory = data.find((category: MenuCategory) => category.CatType === ItemType.OPTION);
        const optionCatId = optionCategory ? optionCategory.ID : null;
        console.log('Found option category ID: ', optionCatId);

        return { categories: data, optionCatId };
    } catch (error) {
        console.error('Error fetching menu categories:', error);
        return { categories: [], optionCatId: null };
    }
}

/**
 * Fetches all product groups within a specific menu category
 * 
 * @async
 * @function getGroupsByCategory
 * @param {string} stripeStoreUrl - Store-specific API base URL
 * @param {string} storeId - Unique store identifier
 * @param {string} categoryId - ID of the category to fetch groups for
 * @returns {Promise<MenuGroup[]>} Array of menu groups, empty array on error
 * 
 * @example
 * ```typescript
 * const groups = await getGroupsByCategory(
 *   'https://elcurioso.tgfpizza.com', 
 *   'ElCurioso-20161122', 
 *   'pizza-category-id'
 * );
 * groups.forEach(group => {
 *   console.log(`Group: ${group.name} - ${group.products.length} products`);
 * });
 * ```
 * 
 * @since 1.0.0
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
 * Fetches all available toppings for menu customization
 * 
 * @async
 * @function getToppings
 * @param {string} stripeStoreUrl - Store-specific API base URL
 * @param {string} storeId - Unique store identifier
 * @returns {Promise<IToppingGroup[]>} Array of topping groups, empty array on error
 * 
 * @example
 * ```typescript
 * const toppings = await getToppings('https://elcurioso.tgfpizza.com', 'ElCurioso-20161122');
 * toppings.forEach(group => {
 *   console.log(`Topping Group: ${group.name}`);
 *   group.toppings.forEach(topping => {
 *     console.log(`  - ${topping.name}: $${topping.price}`);
 *   });
 * });
 * ```
 * 
 * @note Uses hardcoded CatID=9 for topping category
 * @todo Make topping category ID configurable
 * @since 1.0.0
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
 * Fetches current offers and deals from the store
 * 
 * @async
 * @function getOffers
 * @param {string} stripeStoreUrl - Store-specific API base URL
 * @param {string} storeId - Unique store identifier
 * @returns {Promise<IBaseProduct[]>} Array of offer products, empty array on error
 * 
 * @example
 * ```typescript
 * const offers = await getOffers('https://elcurioso.tgfpizza.com', 'ElCurioso-20161122');
 * offers.forEach(offer => {
 *   console.log(`Deal: ${offer.name} - ${offer.discountPercent}% off`);
 * });
 * ```
 * 
 * @note Parses winPizzaObject JSON string from API response
 * @since 1.0.0
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

        // Parse the JSON string within the response
        const offersData = JSON.parse(data.winPizzaObject);
        let dealProducts: IBaseProduct[] =[];

        // Extract products from nested group structure
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
