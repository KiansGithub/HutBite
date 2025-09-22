import { IBasketItem } from '@/types/basket';
import { OrderType } from '@/types/store';
import { formatCurrency, generateOrderId, calculateExpectedTime } from '@/utils/orderUtils';
import { OrderCustomerDetails, OrderPaymentDetails, OrderSubmissionResponse } from '@/types/order';
import { validateOrderData, handleOrderSubmissionError } from '@/utils/errorHandling';

const toE164 = (phone?: string) =>
  phone ? phone.replace(/[^\d+]/g, '').replace(/^00/, '+') : undefined;

/**
 * Formats basket items, customer details, and payment info into the required order JSON structure 
 * @param items - Basket items 
 * @param customer - Customer details 
 * @param payment - Payment details 
 * @param orderType - Type of order (delivery or collection)
 * @param storeId - ID of the store 
 * @param total - Total cost of the order
 * @returns Formatted order data
 */
export const hubriseFormatOrderData = (
  items: IBasketItem[],
  customer: OrderCustomerDetails,
  payment: OrderPaymentDetails,
  orderType: OrderType,
  storeId: string,
  total: string,
) => {
  // The backend expects a simpler structure based on the Python code.
  const formattedItems = items.map(item => ({
    product_name: item.product_name,
    sku_ref: item.sku_ref,
    quantity: item.quantity,
    price: item.price, // Backend will format this as "8.50 GBP"
    options: (item.options || []).map(opt => ({
      option_list_name: opt.option_list_name, // The backend expects this field name
      name: opt.label, // The backend also requires a 'name' field
      ref: (opt as any).ref ?? undefined, 
      price: opt.price,
      quantity: opt.quantity ?? 1,
    })),
  }));

  const formattedPayments = [
    {
      name: payment.paymentMethod || 'Stripe',
      type: 'online',
      amount: total, // Backend will format this
    },
  ];

  const ref = generateOrderId();

  return {
    status: 'new',
    channel: 'hutbite',
    ref, 
    private_ref: ref, 
    service_type: orderType === 'DELIVERY' ? 'delivery' : 'collection',
    customer: {
      first_name: customer.firstName,
      last_name: customer.lastName,
      email: customer.email,
      phone: toE164(customer.phone),
      address_1: customer.address,
      city: customer.city,
      postal_code: customer.postalCode,
    },
    items: formattedItems,
    payments: formattedPayments,
    total: total,
  };
};


/**
 * Submits an order to the API endpoint 
 * @param orderData - Formatted order data 
 * @param storeUrl - URL of the store API 
 * @returns Promise with order submission response 
 */
export const hubriseSubmitOrder = async (orderData: any, storeUrl: string): Promise<OrderSubmissionResponse> => {
    try {
      // The backend is now responsible for validation.
      // const validation = validateOrderData(orderData);
      // if (!validation.isValid) {
      //   return { success: false, error: `Validation failed: ${validation.errors.join(', ')}` };
      // }

      // The user specified the backend is running on localhost.
      // We'll use a hardcoded URL for now, but this can be configured via `storeUrl` later.
      const endpoint = 'https://hutbiteintegrations.onrender.com/orders';

      console.log('Submitting to endpoint:', endpoint);
      console.log('Order Payload:\n', JSON.stringify(orderData, null, 2));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(orderData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `Request failed: ${response.status}`;
        try {
          const errorData = await response.json();
          // FastAPI validation errors are in `detail`
          const detail = errorData.detail;
          if (Array.isArray(detail)) {
            errorMessage = detail.map(e => `${e.loc.join(' -> ')}: ${e.msg}`).join('; ');
          } else if (typeof detail === 'string') {
            errorMessage = detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        console.error('Failed to submit order:', errorMessage);
        return { success: false, error: errorMessage };
      }

      const responseData = await response.json();
      console.log('Order submitted successfully:', responseData);

      return {
        success: true,
        orderId: responseData.id, // The backend returns the created order with an 'id'
      };

    } catch (error) {
        console.error('Error submitting order:', error);
        const errorMessage = handleOrderSubmissionError(error);
        return {
          success: false, 
          error: error instanceof Error ? error.message : errorMessage
        };
    }
}