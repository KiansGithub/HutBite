import { APP_CONFIG } from '@/constants/config';

/**
 * SMS Notification Service for HutBite 
 * Sends order notifications to customers via SMS
 */

interface SMSOrderData {
    restaurant_name: string;
    customer_name: string;
    customer_phone: string;
    order_amount: string;
    order_ref: string | null;
}

/**
 * Sends SMS notification after successful order submission
 * @param orderData - Order data for SMS notification
 * @returns Promise with SMS send result
 */
export const sendOrderNotification = async (orderData: SMSOrderData): Promise<{ success: boolean; error?: string }> => {
    try {
        const endpoint = `${process.env.EXPO_PUBLIC_BACKEND_URL}/sms/send-order-notification`;
        
        console.log('📱 SMS NOTIFICATION - Sending to:', endpoint);
        console.log('📱 SMS DATA:', orderData);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ SMS failed - HTTP error:', response.status, errorText);
            return {
                success: false,
                error: `SMS API error: ${response.status} ${errorText}`
            };
        }

        const result = await response.json();
        console.log('✅ SMS sent successfully:', result);
        
        return {
            success: true
        };

    } catch (error) {
        console.error('❌ SMS failed - Network error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown SMS error'
        };
    }
};

/**
 * Test SMS notification function for debugging
 */
export const testSMSNotification = async (): Promise<void> => {
    const testData: SMSOrderData = {
        restaurant_name: 'HutBite',
        customer_name: 'Test Customer',
        customer_phone: '+447756811243',
        order_amount: '£15.99',
        order_ref: 'TEST_ORDER_123'
    };

    console.log('🧪 Testing SMS notification...');
    const result = await sendOrderNotification(testData);
    
    if (result.success) {
        console.log('✅ Test SMS sent successfully');
    } else {
        console.error('❌ Test SMS failed:', result.error);
    }
};

