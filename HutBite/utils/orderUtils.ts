/**
 * Utility functions for order processing
 */

/**
 * Formats a number as a currency string 
 * @param amount - The amount to format 
 * @param currency - The currency code (e.g., EUR, GBP)
 * @returns Formatted currency string (e.g., "10.95 EUR")
 */
export const formatCurrency = (amount: number, currency: string): string => {
    return `${amount.toFixed(2)} ${currency}`;
};

/**
 * Generates a unique order ID 
 * @returns A unique order ID string
 */
export const generateOrderId = (): string => {
    // Generate a random string of alphanumeric cahracters 
    const randomPart = Math.random().toString(36).substring(2, 8);

    // Combine with timestamp for uniquness 
    const timestamp = Date.now().toString(36);

    return `${randomPart}${timestamp.substring(timestamp.length - 4)}`;
};

/**
 * Calculates the expected delivery or collection time 
 * @param orderType - Optional order type to adjust timing (default: adds 45 minutes)
 * @returns ISO string of the expected time
 */
export const calculateExpectedTime = (orderType?: 'DELIVERY' | 'COLLECTION'): string => {
    const now = new Date();

    // Add appropriate minutes based on order type 
    // Delivery typically takes longer than collection 
    const minutesToAdd = orderType === 'COLLECTION' ? 30 : 45; 

    const expectedTime = new Date(now.getTime() + minutesToAdd * 60000);
    return expectedTime.toISOString();
};

/**
 * Transforms a price string to a number 
 * @param priceString - Price string (e.g., "€10.95" or "10.95 EUR")
 * @returns Price as a number
 */
export const parsePrice = (priceString: string): number => {
    // Remove currency symbols and non-numeric characters except decimal point 
    const numericString = priceString.replace(/[^0-9.]/g, '');
    return parseFloat(numericString) || 0; 
};

/**
  * Calculates the total price after applying any additional charges.
 * Service charges are currently disabled.
 * @param subtotal - The subtotal before additional charges
 * @returns The total price
 */
export const calculateTotalWithCharges = (
    subtotal: number
): number => {
    return subtotal;
};