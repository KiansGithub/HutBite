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
 * Log all products in a specific category for debugging purposes
 * @param categories - Array of menu categories
 * @param catId - Category ID to log products for
 */
export const logProductsInCategory = (categories: any[], catId: string): void => {
    console.log(`🔍 Logging all products in category ${catId}:`);
    
    for (const category of categories) {
        if (category.ID === catId) {
            console.log(`📁 Found category: ${category.Name} (ID: ${category.ID})`);
            
            // Log products directly in category
            if (category.DeProducts && category.DeProducts.length > 0) {
                console.log(`📦 Direct products in category (${category.DeProducts.length}):`);
                category.DeProducts.forEach((product: IBaseProduct, index: number) => {
                    console.log(`  ${index + 1}. ${product.Name} (ID: ${product.ID})`);
                });
            }
            
            // Log products in groups
            if (category.DeGroups && category.DeGroups.length > 0) {
                console.log(`📂 Groups in category (${category.DeGroups.length}):`);
                category.DeGroups.forEach((group: any, groupIndex: number) => {
                    console.log(`  Group ${groupIndex + 1}: ${group.Name} (ID: ${group.ID})`);
                    if (group.DeProducts && group.DeProducts.length > 0) {
                        console.log(`    📦 Products in group (${group.DeProducts.length}):`);
                        group.DeProducts.forEach((product: IBaseProduct, prodIndex: number) => {
                            console.log(`      ${prodIndex + 1}. ${product.Name} (ID: ${product.ID})`);
                        });
                    } else {
                        console.log(`    ❌ No products in this group`);
                    }
                });
            } else {
                console.log(`❌ No groups in this category`);
            }
            return;
        }
    }
    console.log(`❌ Category ${catId} not found in menu data`);
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
    console.log(`🔍 Searching for product: catId=${catId}, grpId=${grpId}, proId=${proId}`);
    
    for (const category of categories) {
        if (category.ID === catId) {
            console.log(`✅ Found category: ${category.Name} (ID: ${category.ID})`);
            
            // Search in category groups
            if (category.DeGroups) {
                console.log(`🔍 Searching in ${category.DeGroups.length} groups...`);
                for (const group of category.DeGroups) {
                    console.log(`  Checking group: ${group.Name} (ID: ${group.ID})`);
                    if (group.ID === grpId) {
                        console.log(`✅ Found matching group: ${group.Name}`);
                        // Search in group products
                        if (group.DeProducts) {
                            console.log(`  🔍 Searching in ${group.DeProducts.length} products...`);
                            const product = group.DeProducts.find((p: IBaseProduct) => p.ID === proId);
                            if (product) {
                                console.log(`✅ Found product: ${product.Name} (ID: ${product.ID})`);
                                return product;
                            } else {
                                console.log(`❌ Product ${proId} not found in group products`);
                                console.log(`Available product IDs in this group:`, 
                                    group.DeProducts.map((p: IBaseProduct) => `${p.Name} (${p.ID})`));
                            }
                        } else {
                            console.log(`❌ No products in group ${group.Name}`);
                        }
                    }
                }
            }
            // Also search directly in category products if they exist
            if (category.DeProducts) {
                console.log(`🔍 Searching in ${category.DeProducts.length} direct category products...`);
                const product = category.DeProducts.find((p: IBaseProduct) => p.ID === proId);
                if (product) {
                    console.log(`✅ Found product in category: ${product.Name} (ID: ${product.ID})`);
                    return product;
                } else {
                    console.log(`❌ Product ${proId} not found in category products`);
                    console.log(`Available product IDs in category:`, 
                        category.DeProducts.map((p: IBaseProduct) => `${p.Name} (${p.ID})`));
                }
            }
            
            // If we found the category but not the product, log what we did find
            console.log(`❌ Product ${proId} not found in category ${catId}`);
            return null;
        }
    }
    
    console.log(`❌ Category ${catId} not found`);
    console.log(`Available category IDs:`, categories.map(cat => `${cat.Name} (${cat.ID})`));
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