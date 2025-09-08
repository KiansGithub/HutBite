import { IBaseProduct } from '@/types/product';

export const getProductPrice = (product: IBaseProduct): number | null => {
    // Case 1: If DePrice is a single value, return it 
    if (typeof product.DePrice === 'number' && product.DePrice !== 0) {
        return product.DePrice; 
    }

    // Case 2: If DeProducts exist, find the first available price 
    if (product.DeGroupedPrices && Array.isArray(product.DeGroupedPrices.DePrices) &&product.DeGroupedPrices?.DePrices?.length > 0) {
        const firstPrice = product.DeGroupedPrices?.DePrices[0].Amount;
        console.log("Extracted Price from DeGroupedPrices:", firstPrice);
        if (typeof firstPrice === 'number') {
            return firstPrice
        }
    }

    // Default fallback: return null
    return null;
};