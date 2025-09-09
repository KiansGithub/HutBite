/**
 * TypeScript interfaces for payment-related data structures
 */

/**
 * Payment intent request parameters 
 */
export interface PaymentIntentRequest {
    /**
     * Amount in cents (e.g., $10.00 = 1000)
     */
    amount: number; 

    /**
     * Currency code (e.g., 'usd', 'eur')
     */
    currency: string; 

    // /**
    //  * Customer email for receipt 
    //  */
    // customerEmail: string; 

    // /**
    //  * Customer name for payment 
    //  */
    // customerName: string; 

    // /**
    //  * Items being purchased 
    //  */
    // items: Array<{
    //     id: string; 
    //     name: string; 
    //     quantity: number; 
    //     price: number; 
    // }>;
}

/**
 * Payment intent response from Stripe API 
 */
export interface PaymentIntentResponse {
    /**
     * Client secret for the payment intent 
     */
    clientSecret: string; 

    // /**
    //  * Ephemeral key for the customer 
    //  */
    // ephemeralKey: string; 

    // /**
    //  * Stripe customer ID
    //  */
    // customerId: string; 
}

/**
 * Payment status enum 
 */
export enum PaymentStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    SUCCESS = 'success',
    FAILED = 'failed',
}

/**
 * Interface for PIN verification response
 */
export interface PinVerificationResponse {
    deMsgBody: string; 
    deMsgType: number; 
    dataObject: any; 
    winPizzaObject: any; 
}

/**
 * Interface for cash payment with PIN verification
 */
export interface CashPaymentRequest {
    phoneNumber: string; 
    pin: string; 
    customerDetails: {
        firstName: string; 
        lastName: string; 
        email: string; 
        phone: string; 
        address: string; 
        city: string; 
        postalCode: string; 
    };
}

/**
 * Order submission request 
 */
export interface OrderSubmissionRequest {
    orderId?: string; 
    paymentIntentId: string; 
    customerDetails: Record<string, string>; 
    items: Array<{ id: string; quantity: number; price: number }>;
    total: number; 
}