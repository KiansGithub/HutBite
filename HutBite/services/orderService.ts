import { IBasketItem } from '@/types/basket';
import { OrderType } from '@/types/store';
import { formatCurrency, generateOrderId, calculateExpectedTime } from '@/utils/orderUtils';
import { OrderCustomerDetails, OrderPaymentDetails, OrderSubmissionResponse } from '@/types/order';
import { validateOrderData, handleOrderSubmissionError } from '@/utils/errorHandling';

/**
 * Formats basket items, customer details, and payment info into the required order JSON structure 
 * @param items - Basket items 
 * @param customer - Customer details 
 * @param payment - Payment details 
 * @param orderType - Type of order (delivery or collection)
 * @param storeId - ID of the store 
 * @returns Formatted order data
 */
export const formatOrderData = (
  items: IBasketItem[],
  customer: OrderCustomerDetails,
  payment: OrderPaymentDetails,
  orderType: OrderType,
  storeId: string,
  total: string,
) => {
  const orderId = generateOrderId();
  const expectedTime = calculateExpectedTime();
  const currency = 'EUR';
  const createdAt = new Date().toISOString();

  // helpers
  const toNumber = (v: any) =>
    typeof v === 'string' ? parseFloat(v.replace(/[^0-9.-]+/g, '')) : Number(v || 0);
  const money = (v: any) => `${toNumber(v).toFixed(2)} ${currency}`;
  const toQty = (v: any) => Number(v) || 0;

  // build one canonical lines array from basket
  const lines = (items || []).map((item) => {
    const unit = toNumber(item.price);
    const quantity = toQty(item.quantity);
    const subtotalNum = unit * quantity;

    return {
      // identifiers
      id: item.id ?? item.pro_id ?? item.sku_ref ?? item.product_name,
      product_id: item.pro_id ?? item.id,
      sku_ref: item.sku_ref,
      name: item.product_name ?? (item as any).name ?? '',

      // amounts (numeric + human-readable)
      unit_price: unit,                 // numeric
      price: money(unit),               // "12.34 EUR"
      quantity,                         // numeric
      quantity_str: String(quantity),   // string variant
      subtotal_num: subtotalNum,        // numeric
      subtotal: money(subtotalNum),     // "24.68 EUR"

      // extras
      options: item.options || [],
      cat_id: (item as any).cat_id,
      grp_id: (item as any).grp_id,

      // keep your previous shape compatibility
      private_ref: null,
      sku_name: item.product_name ?? (item as any).name ?? '',
      tax_rate: null,
      customer_notes: null,
      points_earned: null,
      points_used: null,
      deleted: false,
      deal_line: {
        deal_key: null,
        position: null,
        label: null,
        pricing_effect: null,
        pricing_value: null,
      },
    };
  }).filter(l => l.quantity > 0);

  console.log('Format order data total:', total);

  return {
    // ─────────────────────────────────────────────────────────
    // Top-level fields
    // ─────────────────────────────────────────────────────────
    id: orderId,
    resource_type: 'order',
    event_type: 'create',
    created_at: createdAt,
    order_id: orderId,
    resource_id: orderId,
    location_id: storeId,

    // 🔑 Mirror items at the top level so your validator finds them
    items: lines,
    orderLines: lines,
    lines,

    // ─────────────────────────────────────────────────────────
    // new_state field (kept intact, but uses normalized lines)
    // ─────────────────────────────────────────────────────────
    new_state: {
      id: orderId,
      location_id: storeId,
      ref: null,
      private_ref: null,
      status: 'new',
      service_type: orderType === 'DELIVERY' ? 'delivery' : 'collection',
      service_type_ref: orderType === 'DELIVERY' ? '1001' : '1002',
      created_at: createdAt,
      created_by: 'Developer Tools',
      channel: 'TGFONLINE',
      expected_time: expectedTime,
      confirmed_time: null,
      customer_notes: null,
      seller_notes: null,
      collection_code: null,
      coupon_codes: [],
      total: money(total),
      total_discrepancy: null,
      payment_discrepancy: null,

      // Keep your existing item shape here too
      items: lines.map((l) => ({
        id: l.id,
        private_ref: null,
        product_name: l.name,
        sku_name: l.sku_name,
        sku_ref: l.sku_ref,
        price: l.price,                   // "12.34 EUR"
        quantity: String(l.quantity),     // string (as before)
        subtotal: l.subtotal,             // "24.68 EUR"
        tax_rate: null,
        customer_notes: null,
        points_earned: null,
        points_used: null,
        options: l.options,
        deleted: false,
        deal_line: l.deal_line,
      })),

      deals: { '0': { name: null, ref: null } },
      discounts: [],
      charges: [],

      payments: [
        {
          id: payment.paymentId || `payment_${Date.now()}`,
          private_ref: null,
          type: 'online',
          name: payment.paymentMethod || 'Cash',
          ref: null,
          amount: money((payment as any).amount ?? total), // normalize once
          info: null,
          deleted: false,
        },
      ],

      customer: {
        id: null,
        customer_list_id: null,
        anonymised: false,
        private_ref: null,
        email: customer.email,
        first_name: customer.firstName,
        last_name: customer.lastName,
        gender: null,
        birth_date: null,
        company_name: null,
        phone: customer.phone,
        phone_access_code: null,
        address_1: customer.address,
        address_2: null,
        postal_code: customer.postalCode,
        city: customer.city,
        state: null,
        country: 'DE',
        latitude: null,
        longitude: null,
        delivery_notes: null,
        sms_marketing: false,
        email_marketing: false,
        nb_orders: 1,
        order_total: money(total),
        first_order_date: createdAt,
        last_order_date: createdAt,
        loyalty_cards: [],
        custom_fields: {},
      },

      delivery: null,
      loyalty_operations: [],
      custom_fields: {},
    },

    // ─────────────────────────────────────────────────────────
    // The rest of the top-level fields
    // ─────────────────────────────────────────────────────────
    user_id: null,
    account_id: null,
    app_instance_id: null,
  };
};


/**
 * Submits an order to the API endpoint 
 * @param orderData - Formatted order data 
 * @param storeUrl - URL of the store API 
 * @returns Promise with order submission response 
 */
export const submitOrder = async (orderData: any, storeUrl: string): Promise<OrderSubmissionResponse> => {
    try {
      // Validate order data before submission 
      const validation = validateOrderData(orderData);
      if (!validation.isValid) {
        console.error('Order validation failed:', validation.errors);
        return {
          success: false, 
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      const endpoint = `${storeUrl}/api/tgfpizza_callback`;
        const orderJson = JSON.stringify(orderData, null, 2);

        // Log endpoint and payload as a copyable JSON string
        console.log('Submitting to endpoint:', endpoint);
        console.log('Full order JSON:\n', orderJson);

        // Add timeout to prevent hanging requests 
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        let response: Response; 
        try {
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(orderData),
            signal: controller.signal,
          });
        } catch (fetchError) {
          clearTimeout(timeoutId);

          if (fetchError instanceof Error) {
            if (fetchError.name === 'AbortError') {
              console.error('Order submission timed out');
              return { success: false, error: 'Request timed out. Please try again.'};
            }

            if (fetchError.message.includes('network') || fetchError.message.includes('fetch')) {
              console.error('Network error during order submission:', fetchError);
              return { success: false, error: 'Network error. Please check your connection and try again.'};
            }
          }

          throw fetchError; 
        }

        clearTimeout(timeoutId);
 
        if (!response.ok) {
            console.error('Failed to submit order with status:', response.status, response.statusText);

            let errorMessage = `Request failed: ${response.status}`;

            // Try to get more specific error information from response 
            try {
              const errorData = await response.json();
              if (errorData.error) {
                errorMessage = errorData.error; 
              } else if (errorData.message) {
                errorMessage = errorData.message; 
              }
            } catch (parseError) {
              // If we can't parse the error response, use the status text
              errorMessage = response.statusText || errorMessage; 
            }

            return { success: false, error: errorMessage };
        }

        // Parse JSON response from API 
        let data; 
        try {
          data = await response.json();
          console.log('Order submitted successfully:', data);
        } catch (parseError) {
          console.error('Failed to parse response JSON:', parseError);
          return { success: false, error: 'Invalid response from server'};
        }

        // If there's a winpizza object in response, parse it further 
        let extractedOrderId = orderData.order_id; 
        if (data.winPizzaObject) {
            try {
                const parsedWinPizzaObject = JSON.parse(data.winPizzaObject);
                console.log('Parsed winPizzaObject:', parsedWinPizzaObject);

                // Example: If order ID is in `parsedWinPizzaObject.ID`, use it
                extractedOrderId = parsedWinPizzaObject?.ID || extractedOrderId; 
            } catch (parseError) {
                console.error('Error parsing winPizzaObject:', parseError);
            }
        }

        return {
            success: true, 
            orderId: extractedOrderId
        };
    } catch (error) {
        console.error('Error submitting order:', error);
        

        // Use the enhanced error handling 
        const errorMessage = handleOrderSubmissionError(error);

        return {
          success: false, 
          error: error instanceof Error ? error.message : errorMessage
        };
    }
}