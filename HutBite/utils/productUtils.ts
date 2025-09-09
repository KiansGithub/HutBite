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

/**
 * Find a product by its identifiers (CatID, GrpID, ID)
 * @param categories - Array of menu categories to search through
 * @param catId - Category ID
 * @param grpId - Group ID  
 * @param proId - Product ID
 * @returns Found product or null
 */
export const findProductByIds = (
    categories: any[], 
    catId: string, 
    grpId: string, 
    proId: string
): IBaseProduct | null => {
    for (const category of categories) {
        if (category.ID === catId) {
            // Search in category groups
            if (category.DeGroups) {
                for (const group of category.DeGroups) {
                    if (group.ID === grpId) {
                        // Search in group products
                        if (group.DeProducts) {
                            const product = group.DeProducts.find((p: IBaseProduct) => p.ID === proId);
                            if (product) return product;
                        }
                    }
                }
            }
            // Also search directly in category products if they exist
            if (category.DeProducts) {
                const product = category.DeProducts.find((p: IBaseProduct) => p.ID === proId);
                if (product) return product;
            }
        }
    }
    return null;
};

/**
 * Check if a product has options that require user selection
 * @param product - The product to check
 * @returns true if product has options, false otherwise
 */
export const productHasOptions = (product: IBaseProduct): boolean => {
    // Check if product has grouped prices with multiple options
    if (product.DeGroupedPrices?.DePrices && product.DeGroupedPrices.DePrices.length > 1) {
        return true;
    }
    
    // Check if product has option lists
    if (product.DeGroupedPrices?.DePrices?.[0]?.DeMixOption?.OptionList) {
        return true;
    }
    
    return false;
};