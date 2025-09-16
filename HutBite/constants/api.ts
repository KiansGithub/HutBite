/**
 * API Base URLs and endpoints configuration 
 */
export const API = {
    BASE_URL: 'https://services.tgfpizza.com/ThirdPartyServices/StoreServices.svc/',
    ENDPOINTS: {
      GET_STORE_PROFILE: 'GetStoreProfile',
      GET_WEB_SETTINGS: 'GetWebSettings',
      GET_WEB_SERVICES_ENDPOINT: 'GetWebServicesEndPoint',
    //   GET_NEAREST_STORE: 'GetGermanyNereast_1',
      EXTRACT_MENU_CATEGORIES: 'ExtractOnlineMenu',
      HOST_URL_SUBMIT_ORDER: '/HostURLSubmitOrder',
      FINALIZE_ORDER: 'FinalizeOrder',
      LOAD_MENU: 'LoadMenuJson',
      GROUPS_IN_CATEGORY: 'GrpsInCat',
      TGFPIZZA_CALLBACK: 'tgfpizza_callback',
      GET_OFFERS: 'GetOffers'
    }
  } as const;

  /**
   * Development configuration - use DEVDATA storee for testing
   */
  const DEV_CONFIG = {
    STORE_ID: 'DEVDATA', // DEVDATA
    USE_DEV_STORE: false, 
  };

  /**
   * Default parameters for menu categories API endpoint
   */
  export const MENU_CATEGORIES_PARAMS = {
    DataName: 'testdata',
    MenueID: 'TGFONLINE',
    ImgDomain: '',
    Category: ''
  } as const;

  /**
   * Default parameters for groups in category API endpoint
   */
  export const GROUPS_PARAMS = {
    DataName: 'testdata',
    MenueID: 'TGFONLINE',
    CatType: 'PRODUCT'
  } as const;

  /**
   * Authentication configuration 
   */
  export const AUTH = {
    USERNAME: 'Mobileuser',
    PASSWORD: 'WinPizza1020',
    get HEADERS() {
        return {
            'Authorization': `Basic ${btoa(`${this.USERNAME}:${this.PASSWORD}`)}`,
            'Accept': 'application/xml',
        }
    }
  } as const; 

  /**
   * Store configuration constants 
   */
  export const STORE_CONFIG = {
    TEST_STORE_ID: 'DEVDATA', // ElCurioso-20161122 // TGFP-CHE-20171004 // DEVDATA
    GROUP_NAME: 'TGFPIZZAGERMANY', // TGFPIZZAGERMANY // TGFPIZZA
  } as const;

  /**
   * Helper function to build API URLs 
   */
  export const buildApiUrl = (endpoint: string, params: Record<string, string> = {}): string => {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&')
    return `${API.BASE_URL}${endpoint}${queryString ? '?' + queryString : ''}`;
  }