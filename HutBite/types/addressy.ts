/**
 * Represents an address suggestion from the Addressy API 
 */
export interface AddressySuggestion {
    Id: string; 
    Text: string; 
    Highlight: string; 
    Cursor: number; 
    Description: string; 
    Next: string;
    Format: string; 
    City?: string; 
    Province?: string; 
    PostalCode?: string; 
    Type: string; 
}

/**
 * Represents the response from the Addressy API 
 */
export interface AddressyResponse<T = AddressySuggestion> {
    Items: T[];
}

/*--- NEW type for the Retrieve payload ---*/
export interface AddressyRetrieveItem {
    Id: string; 
    Line1: string; 
    Line2?: string; 
    City: ClientTypes; 
    PostalCode: string; 
}

/**
 * Represents the extracted address components 
 */
export interface AddressComponents {
    address: string; 
    city: string; 
    postalCode: string; 
}