import axios from 'axios';
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
        const response = await axios.post(
            `${stripeStoreUrl}/api/create-paymentintent`,
            paymentDetails, 
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if(!response.data.clientSecret) {
            throw new Error('Missing required fields from server response.');
        }
        
        console.log('returning clietn secret: ', response.data.clientSecret);
        return {
            clientSecret: response.data.clientSecret, 
        };
    } catch (error) {
        // Format and rethrow the error 
        console.error('Error creating payment intent:', error);

        if (axios.isAxiosError(error)) {
            // Handle Axios errors 
            const errorMessage = error.response?.data?.message || error.message || 'Failed to create payment intent';
            throw new Error(errorMessage);
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
