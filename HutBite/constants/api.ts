// This will be dynamic based on the store, but we can have a base
const BASE_API_URL = 'http://Services.tgfpizza.com/WinPizzaMainServices/WinPizzaService20014.WebSubmitOrder.svc';

export const API = {
    BASE_URL: BASE_API_URL,
    ENDPOINTS: {
        GET_NEAREST_STORE: 'GetNearestStore',
        GET_STORE_PROFILE: 'GetStoreProfile',
        GET_WEB_SERVICES_ENDPOINT: 'GetWebServicesEndpoint',
        // Store-specific endpoints (prefixed with storeUrl/api/)
        UNIT_STATUS: 'UnitStatus',
        STORE_WEB_SETTING: 'StoreWebSetting',
        VERIFY_USER: 'VerifyUser',
        CATEGORIES: 'Categorys',
        GROUPS_IN_CATEGORY: 'GrpsInCat',
        GET_OFFERS: 'GetOffers',
        GET_MIN_DLV: 'GetMinDlv',
    },
};

export const AUTH = {
    HEADERS: {
        'Content-Type': 'application/json',
    },
};

/**
 * Builds a URL with query parameters.
 * @param endpoint - The API endpoint.
 * @param params - An object of query parameters.
 * @returns The full URL string.
 */
export const buildApiUrl = (endpoint: string, params: Record<string, string | number>): string => {
    const url = new URL(`${API.BASE_URL}/${endpoint}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, String(params[key])));
    return url.toString();
};
