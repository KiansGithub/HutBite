/**
 * Interface for basket item options
 */
export interface IBasketOption {
    option_list_name: string; 
    ref: string; 
    label: string; 
    price: string; 
    quantity: number; 
    isExtra?: boolean; // Flag for extra toppings
    isRemoved?: boolean; // Flag for removed toppings
}

/**
 * Interface for basket items 
 */
export interface IBasketItem {
    basketItemId: string;
    id: string; 
    product_name: string; 
    imageUrl: string | null;
    sku_ref: string; 
    price: string; 
    quantity: string; 
    subtotal: string; 
    options: IBasketOption[];
    cat_id: string | null;
    grp_id: string | null;
    pro_id: string | null;
    min4dlv?: string; 
}

/**
 * Interface for basket
 */
export interface IBasket {
    channel: string; // should be mobile 
    ref: string; 
    private_ref: string;
    status: string;
    collection_code: string; 
    items: IBasketItem[];
    discounts: any[];
    charges: any[];
    payments: Array<{
        type: string; 
        name: string; 
        ref: null;
        amount: string;
    }>;
    customer: {
        first_name: string; 
        last_name: string; 
        phone: string; 
        email: string;
        address_1: string; 
        postal_code: string; 
        city: string; 
    };
    service_type: "delivery" | "collection";
    service_type_ref: null;
}