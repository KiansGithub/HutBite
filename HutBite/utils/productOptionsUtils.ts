import {
    IProductOption, 
    IOptionListID, 
    IProcessedProductOptions, 
    IProductOptionGroup, 
    IOptionSelections, 
    IOptionCompatibilityMap, 
    IFilteredOptionGroups,
    IOptionValidationState, 
    IOptionRequirements,
    IProductOptionValue
} from '@/types/productOptions';
import { IBaseProduct, IGroupedPrices } from '@/types/product';

// Cache for validation results 
const validationCache = new WeakMap<IOptionSelections, WeakMap<IOptionRequirements, IOptionValidationState>>();

// Error types for validation 
export type ValidationErrorType = 
    | 'MISSING_REQUIRED'
    | 'INVALID_COMBINATION'
    | 'INVALID_INPUT';

export class ValidationError extends Error {
    constructor(
        public type: ValidationErrorType,
        message: string
    ) {
        super(message);
        this.name = 'ValidationError';
    }
}

/**
 * Normalizes OptionList from the API which may be an object keyed by
 * option name or an array of Key/Value pairs.
 */
export function normalizeOptionList(optionList: any): IProductOption[] {
    if (!optionList) return [];
    if (Array.isArray(optionList)) {
        return optionList as IProductOption[];
    }
    if (typeof optionList === 'object') {
        return Object.entries(optionList).map(([key, value]) => ({
            Key: key,
            Value: value as IProductOptionValue,
        }));
    }
    return [];
}

/**
 * Normalizes OptionListIDs which may be returned either as an array
 * of {Key, Value} objects or an object keyed by option name.
 */
export function normalizeOptionListIDs(optionListIDs: any): IOptionListID[] {
    if (!optionListIDs) return [];
    if (Array.isArray(optionListIDs)) {
        return optionListIDs as IOptionListID[];
    }
    if (typeof optionListIDs === 'object') {
        return Object.entries(optionListIDs).map(([key, value]) => ({
            Key: key,
            Value: String(value),
        }));
    }
    return [];
}

/**
 * Processes product options data into a standardized format
 */
export function processProductOptions(
    product: IBaseProduct, 
    groupedPrices?: IGroupedPrices
): IProcessedProductOptions {
    if (!groupedPrices || !Array.isArray(groupedPrices.DePrices) || groupedPrices.DePrices.length === 0) {
        return {
            groups: [],
            validCombinations: {},
            requirements: { mandatoryKeys: [] }
        };
    }

    const allOptions: IProductOption[] = [];
    groupedPrices.DePrices.forEach(price => {
        if (price.DeMixOption?.OptionList) {
            allOptions.push(...normalizeOptionList(price.DeMixOption.OptionList));
        }
    });

    const isMandatory = groupedPrices.DePrices.some(price => price.IsOptionMandetory);

    // Group options by their categories 
    const groups = groupOptionsByKey(allOptions, isMandatory);
    console.log('Processed product options:', groups);

    // Extract requirements 
    const { requirements, validCombinations } = extractOptionRequirements(groupedPrices);

    console.log('Processed product options:', groups);
    console.log('Valid combinations:', validCombinations);
    console.log('Option requirements:', requirements);

    // Generate default selections if available 
    const defaultSelections = generateDefaultSelections(groups);
    console.log('Default selections:', defaultSelections);

    return {
        groups, 
        requirements, 
        validCombinations,
        defaultSelections
    };
} 

/**
 * Groups product options by their category key 
 */
export function groupOptionsByKey(
    options: IProductOption[],
    isRequired: boolean
): IProductOptionGroup[] {
    const groupMap = new Map<string, IProductOptionGroup>();

    options.forEach(option => {
        const existing = groupMap.get(option.Key);
        const optionId = option.Value.ID.toString();

        if (existing) {
            // Check for duplicates using both Key and Value.ID 
            const exists = existing.options.some(opt => 
                opt.ID.toString() === optionId
            );

            if (!exists) {
                existing.options.push(option.Value);
            }
        } else {
            groupMap.set(option.Key, {
                key: option.Key, 
                isRequired, 
                options: [option.Value]
            });
        }
    });

    return Array.from(groupMap.values());
}

/**
 * Validates the current option selections against requirements
 */
export function validateOptionSelections(
    selections: IOptionSelections, 
    requirements: IOptionRequirements
): IOptionValidationState {
    try {
        // Validate inputs 
        if (!selections || !requirements) {
            throw new ValidationError('INVALID_INPUT', 'Invalid validation inputs');
        }

        // Check cache for existing result 
        const selectionCache = validationCache.get(selections);
        if (selectionCache) {
            const cached = selectionCache.get(requirements);
            if (cached) {
                return cached;
            }
        }
    
        console.log('=== VALIDATION DEBUG START ===');
        console.log('Selections object:', selections);
        console.log('Requirements object:', requirements);
        console.log('Mandatory keys:', requirements.mandatoryKeys);
        
        // Debug each mandatory key
        requirements.mandatoryKeys.forEach(key => {
            const value = selections[key];
            console.log(`Key "${key}":`, {
                value: value,
                type: typeof value,
                isUndefined: value === undefined,
                isNull: value === null,
                isEmpty: value === '',
                isFalsy: !value,
                stringValue: String(value)
            });
        });

    const missingRequired = requirements.mandatoryKeys.filter(
        key => selections[key] === undefined || selections[key] === null || selections[key] === ''
    );

    console.log('Missing required keys:', missingRequired);

    const invalidCombinations = validateOptionCombinations(
        selections, 
        requirements.allowedCombinations
    );

    console.log('Invalid combinations:', invalidCombinations);

    const result = {
        isValid: missingRequired.length === 0 && !invalidCombinations?.length, 
        missingRequired, 
        invalidCombinations
    }

    console.log('Final validation result:', result);
    console.log('=== VALIDATION DEBUG END ===');

    // Cache result 
    if (!validationCache.has(selections)) {
        validationCache.set(selections, new WeakMap());
    }
    validationCache.get(selections)?.set(requirements, result);

    return result;
} catch (error) {
    if (error instanceof ValidationError) {
        throw error;
    }
    throw new ValidationError('INVALID_INPUT', 'Validation failed');
    }
}

/**
 * Formats validation errors into user-friendly messages
 */
export function formatValidationError(error: ValidationError): string {
    switch (error.type) {
        case 'MISSING_REQUIRED':
            return 'Please select required options';
        case 'INVALID_COMBINATION':
            return 'This combination is not valid';
        default:
            return 'There was an error validating your options';
    };
}

/**
 * Extracts option requirements from grouped prices 
 */
function extractOptionRequirements(groupedPrices: IGroupedPrices): {
    requirements: IOptionRequirements, 
    validCombinations: IOptionCompatibilityMap
} {
    const mandatoryKeys = new Set<string>();
    const allowedCombinations: { [key: string]: string[] } = {};
    const validCombinations: IOptionCompatibilityMap = {};

    if (!Array.isArray(groupedPrices.DePrices)) {
        console.error('DePrices is not an array:', groupedPrices.DePrices);
        return {
            requirements: {
                mandatoryKeys: Array.from(mandatoryKeys),
                allowedCombinations
            },
            validCombinations
        };
    }

    groupedPrices.DePrices.forEach((price) => {
        const optionList = normalizeOptionList(price.DeMixOption?.OptionList);
        if (price.IsOptionMandetory) {
            optionList.forEach((option: IProductOption) => {
                mandatoryKeys.add(option.Key);
            });
        }

        console.log("Price OPID:", price.OPID, "DeMixOption:", price.DeMixOption?.Name);

            // Extract valid combinations from each price option 
    if (price.DeMixOption?.OptionList) {
        const optionList = normalizeOptionList(price.DeMixOption.OptionList);

        // For each option in this combination 
        optionList.forEach((option: IProductOption) => {
            const key = option.Key; 
            const value = option.Value.ID; 

            // Initialize if this key doesn't exist yet 
            if(!validCombinations[key]) {
                validCombinations[key] = {};
            }

            // For each other option in this combination 
            optionList.forEach((otherOption: IProductOption) => {

                
                if (otherOption.Key !== key) {
                    const otherKey = otherOption.Key; 
                    const otherValue = otherOption.Value.ID; 

                    // Extra detailed log:
                    console.log(
                    `Adding combo: (${key}=${value}) <-> (${otherKey}=${otherValue}) ` +
                    `from price OPID=${price.OPID}`
                    );

                    // Initialize nested structure if needed 
                    if (!validCombinations[key][value]) {
                        validCombinations[key][value] = {};
                    }
                    if (!validCombinations[key][value][otherKey]) {
                        validCombinations[key][value][otherKey] = new Set();
                    }

                    // Add this as a valid combination 
                    validCombinations[key][value][otherKey].add(otherValue);
                }
            }); 
        });
    }
    });

    return {
        requirements: {
            mandatoryKeys: Array.from(mandatoryKeys),
            allowedCombinations
        },
        validCombinations
    };
}

/**
 * Validates if selected option combinations are allowed 
 */
function validateOptionCombinations(
    selections: IOptionSelections, 
    allowedCombinations?: { [key: string]: string[] }
) : string[] | undefined {
    if (!allowedCombinations) return undefined; 

    return Object.entries(allowedCombinations)
        .filter(([key, allowed]) => {
            const selected = selections[key];
            return selected && !allowed.includes(selected);
        })
        .map(([key]) => key);
}

/**
 * Generates default selections for product option groups 
 * For required groups, selectes the first available option 
 * For optional groups, no selection is made 
 * 
 * @param groups - Array of product option groups 
 * @returns Object mapping option keyss to their default selected values
 */
export function generateDefaultSelections(groups: IProductOptionGroup[]): IOptionSelections {
    // Return empty object for empty/null groups
    if (!groups?.length) {
        return {};
    }

    // Reduce groups into selections object 
    return groups.reduce<IOptionSelections>((selections, group) => {
        if (!group.options?.length) return selections;

        // Only create default selections for required groups
        if (group.isRequired) {
            // Ensure unique options before selecting 
            const uniqueOptions = group.options.filter((opt, index, self) =>
                self.findIndex(o => o.ID === opt.ID) === index 
            );
        
            if (uniqueOptions.length > 0) {
                selections[group.key] = uniqueOptions[0].ID;
            }
        }
        
        return selections; 
    }, {});
}

/**
 * Gets compatible options for a specific group based on current selections 
 * 
 * @param groupKey - The key of the option group to filter 
 * @param selections - Current option selections 
 * @param validCombinations - Map of valid option combinations 
 * @param allOptions = All available options for the group 
 * @returns Array of compatible option values
 */
export function getCompatibleOptions(
    groupKey: string, 
    selections: IOptionSelections, 
    validCombinations: IOptionCompatibilityMap, 
    allOptions: IProductOptionValue[]
): IProductOptionValue[] {
    console.log(
        "getCompatibleOptions: groupKey =", groupKey, 
        "selections =", selections
    );

    const noOverallCombos = 
      !validCombinations ||
      Object.keys(validCombinations).length === 0 ||
      !selections || 
      Object.keys(selections).length === 0; 

      const groupIsEmpty = 
        validCombinations?.[groupKey] && 
        Object.keys(validCombinations[groupKey]).length === 0; 

    // If no valid combinations data or no selections, return all options 
    if (noOverallCombos || groupIsEmpty) {
            console.log("Returning all because validCombinations or selections are empty")
            return allOptions; 
        }
    
    // If this is the first selection (no other selections exist)
    const otherSelections = Object.entries(selections).filter(([key]) => key !== groupKey);
    console.log("otherSelections:", otherSelections);

    // Get all valid option IDs for this group based on other selections 
    const validOptionIds = new Set<string>();

    // For each existing selection, find compatible options for the current group 
    otherSelections.forEach(([otherKey, otherValue]) => {
        if (otherValue && validCombinations[otherKey]?.[otherValue]?.[groupKey]) {
            const compatibleIds = validCombinations[otherKey][otherValue][groupKey];

            // For the first selection, initialize the set 
            if (validOptionIds.size === 0) {
                compatibleIds.forEach(id => validOptionIds.add(id));
            } else {
                // For subsequent selections, keep only the intersection 
                const intersection = new Set<string>();
                compatibleIds.forEach(id => {
                    if (validOptionIds.has(id)) {
                        intersection.add(id);
                    }
                });
                // Replace with intersection 
                validOptionIds.clear();
                intersection.forEach(id => validOptionIds.add(id));
            }
        }
    });

    // FIlter options to onlu include valid ones 
    return allOptions.filter(option => validOptionIds.has(option.ID));
}

/**
 * Filters all option groups based on current selections 
 * 
 * @param groups - All option groups 
 * @param selections - Current option selections 
 * @param validCombinations - Map of valid option combinations 
 * @return Filtered option groups
 */
export function filterOptionsBySelection(
    groups: IProductOptionGroup[],
    selections: IOptionSelections, 
    validCombinations: IOptionCompatibilityMap,
    skipKeys: string[] = []
): IFilteredOptionGroups {
    return groups.reduce<IFilteredOptionGroups>((filtered, group) => {
       if (skipKeys.includes(group.key)) {
        filtered[group.key] = group.options;
       } else {
        filtered[group.key] = getCompatibleOptions(
            group.key, 
            selections, 
            validCombinations, 
            group.options,
        )
       }
        return filtered;
    }, {});
}