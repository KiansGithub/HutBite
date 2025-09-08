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


    console.log("options: ", options);


    console.log("product: ", product);


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
            console.log("group.DePrices: ", group.DePrices);
            
            let matchingOption = group.DePrices.find((option: IProductPrice) =>
                normalizeOptionListIDs(option?.DeMixOption?.OptionListIDs).some(
                    (opt: { Key: string; Value: string }) =>
                        opt?.Key === key && opt?.Value === value
                )
            );


            console.log("Matching option", matchingOption);


            if (matchingOption?.DeMixOption?.OptionList) {
                const normalizedList = normalizeOptionList(matchingOption.DeMixOption.OptionList);
                const specificOption = normalizedList.find(opt => opt.Key === key);
                if (specificOption) {
                    optionLabel = `${specificOption.Value.Name}`;
                    console.log("optionLabel", optionLabel);
                    grpId = specificOption.Value.GrpID;
                    console.log("grpId", grpId);
                } else {
                    optionLabel = key;
                    console.log("optionLabel", optionLabel);
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


        // Log cat ID and group ID for debugging
        console.log('Adding basket option', {
            optionCatId,
            grpId,
            option
        });


        return option;
    });
}


/**
 * Format toppings for basket 
 * @param toppings - Selected toppings 
 * @returns Formatted toppings for basket 
 */
export function formatToppingsForBasket(
    toppings: IToppingSelection[],
    allToppingGroups?: IToppingGroup[]
): IBasketOption[] {
    if (!toppings || !toppings.length) return [];


    return toppings.map(topping => {
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


        
        const refValue = catId && grpId ? `${catId}-${grpId}-${topping.id}` : topping.id;


        return {
            option_list_name: 'Topping',
            ref: refValue,
            label: toppingName || `Topping${topping.id}`,
            price: `0.00`,
            quantity: topping.portions
        };
    });
}


/**
 * Find the correct price for a product based on selected optiosn 
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
        return product.DePrice; 
    }
    
    // ✅ Remove Toppings from selected options before matching product prices
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


        // ✅ Check only Crust and Size match
        return Object.entries(selectedOptionsString).every(([key, value]) => {
            return normalizeOptionListIDs(price.DeMixOption?.OptionListIDs).some(
                opt => opt.Key === key && opt.Value === value
            );
        });
    });


    if (matchingPrice) {
        return matchingPrice.Amount; 
    }


    console.log(`No matching price found for product ${product.ID} with options`, normalizedSelectedOptions);
    return product.DePrice; 
}


export const calculateItemPrice = (
    product: IBaseProduct, 
    selections?: {
        options?: IOptionSelections; 
        toppings?: IToppingSelection[];
    },
    selectedToppings?: IToppingSelection[],
    availableToppings?: ITopping[],
): PriceCalculationResult => {
    console.log("💰 Calculating price for: ", {
        product: product.Name, 
        selections, 
        selectedToppings, 
        availableToppings,
    });


    let basePrice = product.DePrice; 
    let optionsPrice = 0; 
    let toppingsPrice = 0;


    if (selections?.options && Object.keys(selections.options).length > 0) {
        // Use the findProductPriceByOptions function to get the correct base price 
        basePrice = findProductPriceByOptions(product, selections.options);
    }


    // ✅ Find the selected size ID from option
    let selectedSizeId = selections?.options?.Size || selections?.options?.["Größe"];
    if (typeof selectedSizeId === 'string' && selectedSizeId.includes('-')) {
        selectedSizeId = selectedSizeId.split('-').pop() as string;
    }


    // Calculate toppings price based on selected size 
    if (selections?.toppings && selections.toppings.length > 0 && availableToppings) {
        console.log("🍕 Calculating price for selected toppings:", selections.toppings)


        toppingsPrice = selections.toppings.reduce((total, topping) => {


                // Find topping definition from product's toppings list 
                const toppingDefinition = availableToppings?.find(t => t.ID === topping.id);


                if (!toppingDefinition) {
                    console.warn(`No topping definition found for ID ${topping.id}`);
                    return total; 
                }


                console.log("Topping definition", toppingDefinition);


                // Try to find a size-based price first 
                let toppingPriceAmount: number | undefined; 


                if (selectedSizeId && toppingDefinition.DeGroupedPrices?.DePrices) {
                    const toppingPriceEntry = toppingDefinition.DeGroupedPrices.DePrices.find(price =>
                        normalizeOptionListIDs(price.DeMixOption?.OptionListIDs).some(
                            opt =>
                                (opt.Key === "Size" || opt.Key === "Größe") &&
                                opt.Value === selectedSizeId
                        )
                    );
                    toppingPriceAmount = toppingPriceEntry?.Amount; 
                }


                // Fallback to DePrice if no size or grouped price is available 
                if (toppingPriceAmount === undefined && toppingDefinition.DePrice !== undefined) {
                    toppingPriceAmount = toppingDefinition.DePrice; 
                    console.log(`⚠️ No size-based price found, falling back to DePrice: ${toppingPriceAmount}`)
                }


                if (toppingPriceAmount === undefined) {
                    console.warn(`No price found for topping ${topping.name}`);
                    return total; 
                }


                const originalPortion = product.Toppings?.filter(t => t.ID === topping.id).length ?? 0; 
                const chargeablePortion = Math.max(0, topping.portions - originalPortion);
                const portionPrice = toppingPriceAmount * chargeablePortion; 


                console.log(`💵 Topping ${topping.name}: ${chargeablePortion} x ${toppingPriceAmount} = ${portionPrice}`)


                return total + portionPrice; 
        }, 0);
    } 


    return {
        basePrice, 
        optionsPrice, 
        toppingsPrice, 
        total: basePrice + optionsPrice + toppingsPrice
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


    return `${total.toFixed(2)}`;
}


/**
 * Functioning for generating unique id 
 */
export function generateSimpleId(): string {
    return 'item-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5);
}


// Export all utiltiy functions 
export { PriceCalculationResult };
