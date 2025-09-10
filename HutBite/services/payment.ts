import { PaymentIntentRequest, PaymentIntentResponse, OrderSubmissionRequest } from '@/types/payment';

/**
 * Creates a payment intent by calling the backend API 
 * @param paymentDetails - The payment details including amount, currency, and customer info 
 * @returns A promise that resolves to the payment intent response 
 */
export const createPaymentIntent = async (
    paymentDetails: PaymentIntentRequest,
    stripeStoreUrl: string
): Promise<PaymentIntentResponse> => {
    try {

        console.log('Creating Payment Intent ', paymentDetails);

        console.log('stripeStoreUrl', stripeStoreUrl);

        if (!stripeStoreUrl) {
            throw new Error('Stripe store URL is not configured');
        }

        // Make the API call to create a payment intent 
        const response = await fetch(
            `${stripeStoreUrl}/api/create-paymentintent`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentDetails),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to create payment intent'}`);
        }

        const data = await response.json();

        if(!data.clientSecret) {
            throw new Error('Missing required fields from server response.');
        }
        
        console.log('returning client secret: ', data.clientSecret);
        return {
            clientSecret: data.clientSecret, 
        };
    } catch (error) {
        // Format and rethrow the error 
        console.error('Error creating payment intent:', error);

        if (error instanceof TypeError && error.message.includes('fetch')) {
            // Handle network errors 
            throw new Error('Network error. Please check your connection and try again.');
        }

        // Handle other errors 
        throw error instanceof Error ? error : new Error('Unknown error creating payment intent');
    }
};

// /**
//  * Submits the order to the backend after successful payment 
//  * @param orderDetails - The order details including items, customer info, and payment info 
//  * @returns A promise that resolves to the order confirmation 
//  */
// export const submitOrder = async (
// orderDetails: OrderSubmissionRequest
// ): Promise<{ orderId: string; status: string }> => {
//     // Implementation is done here 
// }
