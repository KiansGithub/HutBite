import { supabase } from '@/lib/supabase';
import { IBasketItem } from '@/types/basket';
import { OrderCustomerDetails, OrderPaymentDetails, OrderSubmissionResponse } from '@/types/order';
import { OrderType } from '@/types/store';
import { Database } from '@/lib/supabase';

type OrderInsert = Database['public']['Tables']['orders']['Insert'];

/**
 * Saves order data to the Supabase orders table
 * @param orderData - The formatted order data from formatOrderData
 * @param items - Original basket items
 * @param customer - Customer details
 * @param payment - Payment details
 * @param orderType - Type of order (delivery or collection)
 * @param storeId - ID of the store
 * @param restaurantId - ID of the restaurant
 * @param total - Total cost of the order
 * @param submissionResponse - Response from order submission API
 * @param userId - Optional user ID for authenticated users
 * @returns Promise with database save result
 */
export const saveOrderToDatabase = async (
  orderData: any,
  items: IBasketItem[],
  customer: OrderCustomerDetails,
  payment: OrderPaymentDetails,
  orderType: OrderType,
  storeId: string,
  restaurantId: string,
  total: string,
  submissionResponse?: OrderSubmissionResponse,
  userId?: string | null
): Promise<{ success: boolean; error?: string; orderId?: string }> => {
  try {
    // Extract numeric total from formatted string (e.g., "£12.34" -> 12.34)
    const numericTotal = parseFloat(total.replace(/[^0-9.-]+/g, '')) || 0;
    
    // Calculate item count
    const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    
    // Determine payment status based on submission response
    let paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' = 'pending';
    if (submissionResponse) {
      paymentStatus = submissionResponse.success ? 'completed' : 'failed';
    }

    // Prepare order record for database
    const orderRecord: OrderInsert = {
      order_id: orderData.order_id,
      user_id: userId || null,
      restaurant_id: restaurantId,
      store_id: storeId,
      status: 'pending',
      service_type: orderType === 'DELIVERY' ? 'delivery' : 'collection',
      total_amount: numericTotal,
      currency: 'GBP',
      customer_email: customer.email,
      customer_first_name: customer.firstName,
      customer_last_name: customer.lastName,
      customer_phone: customer.phone,
      customer_address: customer.address || null,
      customer_postal_code: customer.postalCode || null,
      customer_city: customer.city || null,
      payment_method: payment.paymentMethod || 'stripe',
      payment_id: payment.paymentId || null,
      payment_status: paymentStatus,
      expected_time: orderData.new_state?.expected_time || null,
      confirmed_time: null,
      item_count: itemCount,
      order_data: orderData as any, // Store complete order JSON
      submission_response: submissionResponse ? (submissionResponse as any) : null,
      error_message: submissionResponse && !submissionResponse.success ? submissionResponse.error : null
    };

    console.log('Saving order to database:', {
      orderId: orderRecord.order_id,
      storeId: orderRecord.store_id,
      restaurantId: orderRecord.restaurant_id,
      total: orderRecord.total_amount,
      itemCount: orderRecord.item_count,
      serviceType: orderRecord.service_type,
      paymentStatus: orderRecord.payment_status
    });

    // Insert order into database
    const { data, error } = await supabase
      .from('orders')
      .insert(orderRecord)
      .select('id, order_id')
      .single();

    if (error) {
      console.error('Failed to save order to database:', error);
      return {
        success: false,
        error: `Database error: ${error.message}`
      };
    }

    console.log('Order saved successfully to database:', data);
    
    return {
      success: true,
      orderId: data.order_id
    };

  } catch (error) {
    console.error('Error saving order to database:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
};

/**
 * Updates order status in the database
 * @param orderId - The order ID to update
 * @param status - New status for the order
 * @param confirmedTime - Optional confirmed time for status updates
 * @returns Promise with update result
 */
export const updateOrderStatus = async (
  orderId: string,
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled',
  confirmedTime?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updateData: any = { status };
    
    if (confirmedTime) {
      updateData.confirmed_time = confirmedTime;
    }
    
    if (status === 'confirmed' && !confirmedTime) {
      updateData.confirmed_time = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('order_id', orderId);

    if (error) {
      console.error('Failed to update order status:', error);
      return {
        success: false,
        error: `Database error: ${error.message}`
      };
    }

    console.log(`Order ${orderId} status updated to ${status}`);
    
    return { success: true };

  } catch (error) {
    console.error('Error updating order status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
};

/**
 * Updates payment status for an order
 * @param orderId - The order ID to update
 * @param paymentStatus - New payment status
 * @param paymentId - Optional payment ID
 * @returns Promise with update result
 */
export const updateOrderPaymentStatus = async (
  orderId: string,
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded',
  paymentId?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updateData: any = { payment_status: paymentStatus };
    
    if (paymentId) {
      updateData.payment_id = paymentId;
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('order_id', orderId);

    if (error) {
      console.error('Failed to update payment status:', error);
      return {
        success: false,
        error: `Database error: ${error.message}`
      };
    }

    console.log(`Order ${orderId} payment status updated to ${paymentStatus}`);
    
    return { success: true };

  } catch (error) {
    console.error('Error updating payment status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
};

/**
 * Retrieves order history for a user
 * @param userId - User ID to get orders for
 * @param limit - Maximum number of orders to return
 * @returns Promise with user's order history
 */
export const getUserOrderHistory = async (
  userId: string,
  limit: number = 20
): Promise<{ success: boolean; orders?: any[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get user order history:', error);
      return {
        success: false,
        error: `Database error: ${error.message}`
      };
    }

    return {
      success: true,
      orders: data
    };

  } catch (error) {
    console.error('Error getting user order history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
};

/**
 * Gets the most recent order (for MVP - single order view)
 * @param userId - Optional user ID for authenticated users
 * @returns Promise with the most recent order
 */
export const getMostRecentOrder = async (
  userId?: string | null
): Promise<{ success: boolean; order?: any; error?: string }> => {
  try {
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    // If userId is provided, filter by user_id, otherwise get the most recent order regardless of user
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get most recent order:', error);
      return {
        success: false,
        error: `Database error: ${error.message}`
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'No orders found'
      };
    }

    return {
      success: true,
      order: data[0]
    };

  } catch (error) {
    console.error('Error getting most recent order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
};
