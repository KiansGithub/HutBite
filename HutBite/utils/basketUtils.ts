import { IBaseProduct, IProductPrice } from '@/types/product';
import { IBasketItem, IBasketOption } from '@/types/basket';
import { IOptionSelections } from '@/types/productOptions';
import { IToppingSelection, ITopping, IToppingGroup } from '@/types/toppings';
import { normalizeOptionList, normalizeOptionListIDs } from './productOptionsUtils';

// Price calculation result interface
interface PriceCalculationResult { 
    basePrice: number; 
    optionsPrice: number; 
    toppingsPrice: number; 
    total: number; 
}

/**
 * Safely parse price strings to number 
 * @param price - Price string (e.g. "€10.99")
 * @returns Parsed number value
 */
export function parsePriceString(price: string): number {
    return parseFloat(price.replace(/[^0-9.-]+/g, '')) || 0;
}

/**
 * Format product options for basket 
 * @param options - Selected options 
 * @param product - Product with option definitions 
 * @returns Formatted options for basket
 */
export function formatOptionsForBasket(
    options: IOptionSelections, 
    product: IBaseProduct,
    optionCatId?: string
): IBasketOption[] {
    if (!options) return [];

    return Object.entries(options).map(([key, value]) => {
        // Skip if no value is selected 
        if (!value) {
            return {
                option_list_name: key, 
                ref: "",
                label: "None",
                price: `0.00`,
                quantity: 1
            };
        }

        let optionLabel = "Option";
        let grpId = '';

        // Ensure DeGroupedPrices exists and access DePrices directly
        const group = product.DeGroupedPrices;
        if (group?.DePrices) {
            let matchingOption = group.DePrices.find((option: IProductPrice) =>
                normalizeOptionListIDs(option?.DeMixOption?.OptionListIDs).some(
                    (opt: { Key: string; Value: string }) =>
                        opt?.Key === key && opt?.Value === value
                )
            );

            if (matchingOption?.DeMixOption?.OptionList) {
                const normalizedList = normalizeOptionList(matchingOption.DeMixOption.OptionList);
                const specificOption = normalizedList.find(opt => opt.Key === key);
                if (specificOption) {
                    optionLabel = `${specificOption.Value.Name}`;
                    grpId = specificOption.Value.GrpID;
                } else {
                    optionLabel = key;
                }
            }
        }

        const refValue = optionCatId && grpId ? `${optionCatId}-${grpId}-${value}` : (value ?? "");
        const option = {
            option_list_name: key,
            ref: refValue,
            label: optionLabel,
            price: `0.00`,
            quantity: 1
        };

        return option;
    });
}

/**
 * Format toppings for basket - only includes EXTRA portions beyond what's included
 * @param toppings - Selected toppings 
 * @param allToppingGroups - All available topping groups
 * @param product - Base product with original topping definitions
 * @returns Formatted toppings for basket (only extra portions)
 */
export function formatToppingsForBasket(
    toppings: IToppingSelection[],
    allToppingGroups?: IToppingGroup[],
    product?: IBaseProduct
): IBasketOption[] {
    if (!toppings || !toppings.length) return [];

    const basketOptions: IBasketOption[] = [];

    toppings.forEach(topping => {
        // Try to find actual topping name and details from groups if available
        let toppingName = topping.name;
        let catId = '';
        let grpId = '';

        if (allToppingGroups) {
            // Search through all topping groups to find topping by ID 
            for (const group of allToppingGroups) {
                const foundTopping = group.DeProducts.find(t => t.ID === topping.id);
                if (foundTopping) {
                    toppingName = toppingName || foundTopping.Name;
                    catId = foundTopping.CatID || group.CatID || '';
                    grpId = foundTopping.GrpID || group.ID || '';
                    break;
                }
            }
        }

        // Find the original topping definition from the product
        const originalTopping = product?.Toppings?.find(t => t.ID === topping.id);
        const originalPortion = originalTopping?.OrgPortion || 0;

        // Calculate extra portions (only add to basket if there are extras)
        const extraPortions = Math.max(0, topping.portions - originalPortion);

        // Calculate removed portions (only add to basket if there are removals)
        const removedPortions = Math.max(0, originalPortion - topping.portions);

        const refValue = catId && grpId ? `${catId}-${grpId}-${topping.id}` : topping.id;

        // Only add to basket if there are extra portions
        if (extraPortions > 0) {
            basketOptions.push({
                option_list_name: 'Topping',
                ref: refValue,
                label: toppingName || `Topping${topping.id}`,
                price: `0.00`,
                quantity: extraPortions, 
                isExtra: true
            });
        }

        // Add removed toppings to basket 
        if (removedPortions > 0) {
            basketOptions.push({
                option_list_name: 'Topping',
                ref: refValue,
                label: `No ${toppingName || `Topping${topping.id}`}`,
                price: `0.00`,
                quantity: removedPortions,
                isExtra: false,
                isRemoved: true
            });
        }
    });

    return basketOptions;
}

/**
 * Identify extra toppings in options 
 * @param options - Array of basket options 
 * @param product - Product with original toppings 
 * @returns Options with isExtra flag added to toppings
 */
export function identifyExtraToppings(options: IBasketOption[], product: IBaseProduct): IBasketOption[] {
    // Identify extra toppings 
    const finalOptions = options.map(option => {
        if (option.option_list_name === 'Topping') {
            // Find the topping definition from the product's original toppings 
            const originalTopping = product.Toppings?.find(t => {
                // Handle both direct ID match and ref format like "catId-grpId-toppingId"
                const toppingId = option.ref.includes('-') ? option.ref.split('-').pop() : option.ref; 
                return t.ID === toppingId; 
            });

            // A topping is "extra" if: 
            // 1. It's not in the original toppings list, OR 
            // 2. The quantity exceeds the original portion (OrgPortion)
            const originalPortion = originalTopping?.OrgPortion || 0;
            const isExtra = !originalTopping || option.quantity > originalPortion; 

            return { ...option, isExtra };
        }
        return option;
    });

    return finalOptions; 
}

/**
 * Get the product price from DePrice or DeGroupedPrices
 * @param product - The product object
 * @returns The product price or null if not found
 */
export const getProductPrice = (product: IBaseProduct): number | null => {
    // Case 1: If DePrice is a single value, return it 
    if (typeof product.DePrice === 'number' && product.DePrice !== 0) {
        return product.DePrice; 
    }

    // Case 2: If DeProducts exist, find the first available price 
    if (product.DeGroupedPrices && Array.isArray(product.DeGroupedPrices.DePrices) && product.DeGroupedPrices?.DePrices?.length > 0) {
        const firstPrice = product.DeGroupedPrices?.DePrices[0].Amount;
        if (typeof firstPrice === 'number') {
            return firstPrice;
        }
    }

    // Default fallback: return null
    return null;
};

/**
 * Find the correct price for a product based on selected options 
 * @param product - The product object 
 * @param selectedOptions - Object containing selected option IDs keyed by option name 
 * @returns The matching price amount or default product price if no match found 
 */
export function findProductPriceByOptions(
    product: IBaseProduct, 
    selectedOptions?: IOptionSelections
): number {
    // If no options selected or product has no grouped prices, return default price 
    if (!selectedOptions || !product.DeGroupedPrices?.DePrices || !product.DeGroupedPrices.DePrices.length) {
        return getProductPrice(product) ?? product.DePrice; 
    }
    
    // Remove Toppings from selected options before matching product prices
    const filteredOptions = Object.fromEntries(
        Object.entries(selectedOptions).filter(([key]) => key !== "Topping")
    );

    // When options refs include the option category and group ID (e.g. "2-900-101")
    // only the actual option value should be used for price matching
    const normalizedSelectedOptions = Object.fromEntries(
        Object.entries(filteredOptions).map(([key, value]) => {
            if (typeof value === 'string' && value.includes('-')) {
                const parts = value.split('-');
                return [key, parts[parts.length - 1]];
            }
            return [key, String(value)];
        })
    );

    // Find a price entry where all selected options match 
    const matchingPrice = product.DeGroupedPrices.DePrices.find(price => {
        // Skip entries without option information 
        if (!price.DeMixOption?.OptionListIDs) return false;

        // Convert selectedOptions values to strings for comparison 
        const selectedOptionsString = Object.fromEntries(
            Object.entries(normalizedSelectedOptions).map(([k, v]) => [k, String(v)])
        );

        // Check only Crust and Size match
        return Object.entries(selectedOptionsString).every(([key, value]) => {
            return normalizeOptionListIDs(price.DeMixOption?.OptionListIDs).some(
                opt => opt.Key === key && opt.Value === value
            );
        });
    });

    if (matchingPrice) {
        return matchingPrice.Amount; 
    }

    return getProductPrice(product) ?? product.DePrice; 
}

/**
 * Calculate the price for a basket item 
 * @param product - The product object 
 * @param selections - Object containing selected options and toppings 
 * @param selectedToppings - Array of selected toppings (kept for signature compatibility)
 * @param availableToppings - Array of available toppings (kept for signature compatibility)
 * @returns Price calculation result 
 */
export const calculateItemPrice = (
    product: IBaseProduct,
    selections?: {
      options?: IOptionSelections;
      toppings?: IToppingSelection[];
    },
    selectedToppings?: IToppingSelection[],          // kept for signature compatibility
    availableToppings?: ITopping[],
  ): PriceCalculationResult => {
    let basePrice = getProductPrice(product) ?? product.DePrice;
    let optionsPrice = 0;
    let toppingsPrice = 0;

    // If options are selected, use them to resolve the base price
    if (selections?.options && Object.keys(selections.options).length > 0) {
      basePrice = findProductPriceByOptions(product, selections.options);
    }

    // Resolve selected size (handles refs like "2-900-101")
    let selectedSizeId = selections?.options?.Size || selections?.options?.["Größe"];
    if (typeof selectedSizeId === "string" && selectedSizeId.includes("-")) {
      selectedSizeId = selectedSizeId.split("-").pop() as string;
    }

    // --- Toppings price -------------------------------------------------------
    if (selections?.toppings && selections.toppings.length > 0 && availableToppings) {
      toppingsPrice = selections.toppings.reduce((total, topping) => {
        // Catalog definition (has prices)
        const toppingDefinition = availableToppings.find(t => t.ID === topping.id);
        if (!toppingDefinition) {
          return total;
        }

        // Resolve unit price for this topping, preferring size-specific
        let toppingPriceAmount: number | undefined;

        if (selectedSizeId && toppingDefinition.DeGroupedPrices?.DePrices) {
          const priceEntry = toppingDefinition.DeGroupedPrices.DePrices.find(price =>
            normalizeOptionListIDs(price.DeMixOption?.OptionListIDs).some(
              opt => (opt.Key === "Size" || opt.Key === "Größe") && opt.Value === selectedSizeId
            )
          );
          toppingPriceAmount = priceEntry?.Amount;
        }

        // Fallbacks
        if (toppingPriceAmount === undefined && toppingDefinition.DeGroupedPrices?.DePrices?.length > 0) {
          const firstPrice = toppingDefinition.DeGroupedPrices.DePrices[0].Amount;
          if (typeof firstPrice === "number") toppingPriceAmount = firstPrice;
        }
        if (toppingPriceAmount === undefined && toppingDefinition.DePrice !== undefined) {
          toppingPriceAmount = toppingDefinition.DePrice;
        }
        if (toppingPriceAmount === undefined) {
          return total;
        }

        // Included (free) portions: prefer product-level mapping, then catalog
        const includedFromProduct =
          product.Toppings?.find(pt => pt.ID === topping.id)?.OrgPortion;
        const includedFromCatalog = toppingDefinition.OrgPortion;

        const originalPortion =
          (includedFromProduct ?? includedFromCatalog ?? 0);

        // Bill only the extra above what's included
        const chargeablePortion = Math.max(0, topping.portions - originalPortion);
        const portionPrice = toppingPriceAmount * chargeablePortion;

        return total + portionPrice;
      }, 0);
    }

    return {
      basePrice,
      optionsPrice,
      toppingsPrice,
      total: basePrice + optionsPrice + toppingsPrice,
    };
};

/**
 * Calculate subtotal for a basket item 
 * @param item - Basket item 
 * @param newQuantity - New quantity (optional)
 * @returns Formatted subtotal price string 
 */
export function calculateItemSubtotal(item: IBasketItem, newQuantity?: number): string {
    // Use provided quantity or item's current quantity 
    const quantity = newQuantity !== undefined ? newQuantity: parseInt(item.quantity, 10);

    // Calculate base price 
    const basePrice = parsePriceString(item.price);

    // Calculate options total 
    const optionsTotal = item.options.reduce((sum, option) => {
        const optionPrice = parsePriceString(option.price);
        return sum + (optionPrice * option.quantity);
    }, 0);

    // Calculate total with quantity 
    const total = (basePrice + optionsTotal) * quantity; 

    return `£${total.toFixed(2)}`;
}

/**
 * Functioning for generating unique id 
 */
export function generateSimpleId(): string {
    return 'item-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5);
}

// Export all utility functions 
export { PriceCalculationResult };
