import { APP_CONFIG } from '@/constants/config';
import { IBasketItem } from '@/types/basket';
import { OrderCustomerDetails } from '@/types/order';

/**
 * SMS Notification Service for HutBite 
 * Sends order notifications to customers via SMS
 */

interface SMSOrderData {
    restaurant_name: string; 
    customer_name: string; 
    customer_phone: string; 
    order_amount: string; 
    order_ref: string; 
    service_type: 'delivery' | 'collection';
    expected_time?: string; 
    items_summary?: string; 
    store_id?: string;
}

