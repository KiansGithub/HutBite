import { ITopping, IToppingSelection, IToppingValidationState } from "@/types/toppings";


/**
 * Calculates the total cost of selected toppings considering free topping allowance 
 * @param selections Current topping selections with portions 
 * @param toppings Available toppings with pricing 
 */


/**
 * Validates topping selections against business rules 
 * @param selections Current topping selections 
 * @returns Validation state object
 */
export const validateToppingSelections = (
    selections: IToppingSelection[]
): IToppingValidationState => {
    const invalidSelections: string[] = [];

    selections.forEach(selection => {
        if (selection.portions < 0 || selection.portions > 2) {
            invalidSelections.push(selection.id);
        };
    });

        return {
            isValid: invalidSelections.length === 0,
            errorMessage: invalidSelections.length > 0
                ? 'Portions must be between 0 and 4'
                : undefined,
            invalidSelections
        };
}

/**
 * Processes initial topping state into internal selection format
 * @param initialToppings Original topping selections 
 * @returns Processed topping selections 
 */
export const processToppingSelections = (
    initialToppings?: ITopping[],
    allToppings?: ITopping[]
): IToppingSelection[] => {
    if (!initialToppings) return [];

    return initialToppings.map(topping => {
        let toppingName = topping.Name; 

        // If name missing or looks like ID, try to find in allToppings 
        if (allToppings && (!toppingName || toppingName.includes('Topping'))) {
            const foundTopping = allToppings.find(t => t.ID === topping.ID);
            if (foundTopping) {
                toppingName = foundTopping.Name; 
            }
        }

        // Return selection with name included 
        return {
            id: topping.ID, 
            name: toppingName || `Topping`,
            portions: Math.min(Math.max(topping.OrgPortion, 0), 2)
        };
    });
};