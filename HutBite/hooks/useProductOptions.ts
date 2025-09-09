import { useState, useCallback, useMemo, useEffect } from 'react';
import {
    IProcessedProductOptions, 
    IOptionSelections, 
    IOptionValidationState,
    IFilteredOptionGroups
} from '@/types/productOptions';
import {
    validateOptionSelections, 
    ValidationError, 
    formatValidationError,
    filterOptionsBySelection, 
    getCompatibleOptions
} from '@/utils/productOptionsUtils';

interface UseProductOptionsProps {
    options: IProcessedProductOptions; 
    initialSelections?: IOptionSelections; 
    onSelectionsChange?: (selections: IOptionSelections, isValid: boolean) => void; 
}

interface UseProductOptionsReturn {
    selections: IOptionSelections; 
    validationState: IOptionValidationState; 
    loading: boolean; 
    filteredOptions: IFilteredOptionGroups;
    error: string | null; 
    handleOptionSelect: (groupKey: string, value: string) => void; 
    handleOptionChange: (key: string, value: string) => void; 
    resetError: () => void; 
    retryLastOperation: () => void; 
}

export function useProductOptions({
    options, 
    initialSelections, 
    onSelectionsChange
}: UseProductOptionsProps): UseProductOptionsReturn {
    // State management 
    const [selections, setSelections] = useState<IOptionSelections>(() => {
        // Determine initial state based on editing mode vs new item
        if (initialSelections && Object.keys(initialSelections).length > 0) {
            return initialSelections;
        }
        return options.defaultSelections || {};
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filteredOptions, setFilteredOptions] = useState<IFilteredOptionGroups>(
        options.groups.reduce((acc, group) => ({ ...acc, [group.key]: group.options }), {})
    );
    const [lastOperation, setLastOperation] = useState<(() => void) | null>(null);

    // This effect handles the initialization of selections.
    // It correctly applies initialSelections for editing or defaultSelections for new items.
    useEffect(() => {
        const isEditing = initialSelections && Object.keys(initialSelections).length > 0;
        const hasDefaults = options.defaultSelections && Object.keys(options.defaultSelections).length > 0;

        if (isEditing) {
            // If in edit mode, apply the existing selections.
            setSelections(initialSelections);

            // Update filtered options based on initial selections 
            if(options.validCombinations) {
                const filtered = filterOptionsBySelection(
                    options.groups, initialSelections, options.validCombinations, ["Size", "Größe"]
                );
                setFilteredOptions(filtered);
            }
        } else if (hasDefaults && Object.keys(selections).length === 0) {
            // If creating a new item and no selections exist yet, apply defaults.
            setSelections(options.defaultSelections || {});
        }
    }, [initialSelections, options.defaultSelections, options.groups, options.validCombinations]);

    // Memoized validation state 
    const validationState = useMemo(() => {
        console.log('=== USEPRODUCTOPTIONS VALIDATION START ===');
        console.log('Current selections:', selections);
        console.log('Options requirements:', options.requirements);
        console.log('Options groups:', options.groups);
        
        try {
            const result = validateOptionSelections(selections, options.requirements);
            console.log('Validation result from validateOptionSelections:', result);
            return result;
        } catch (err) {
            console.error('Validation error in useProductOptions:', err);
            if (err instanceof ValidationError) {
                setError(formatValidationError(err));
            } else {
                setError('Validation failed. Please try again.');
            }
            return {
                isValid: false, 
                missingRequired: [],
                invalidCombinations: []
            };
        } finally {
            console.log('=== USEPRODUCTOPTIONS VALIDATION END ===');
        }
    }, [selections, options.requirements]);

    // Notify parent of selection changes 
    useEffect(() => {
        console.log('Selections updated:', selections);
        onSelectionsChange?.(selections, validationState.isValid);
    }, [selections, validationState.isValid, onSelectionsChange]);

    // Update filtered options when selections change 
    useEffect(() => {
        if (options.validCombinations) {
            const filtered = filterOptionsBySelection(
                options.groups, 
                selections, 
                options.validCombinations,
                ["Size", "Größe"]
            );
            setFilteredOptions(filtered);
        }
    }, [selections, options.groups, options.validCombinations]);

    // Reset incompatible selections when a parent option changes 
    const resetIncompatibleSelections = useCallback((changedKey: string, newValue: string) => {
        if (!options.validCombinations) return {};

        const validCombinations = options.validCombinations;

        const resetSelections: IOptionSelections = {};
        Object.keys(selections).forEach(key => {
            if (key !== changedKey) {
                const compatibleOptions = getCompatibleOptions(
                    key, { [changedKey]: newValue }, 
                    validCombinations, 
                    options.groups.find(g => g.key === key)?.options || []
                );
                if (!compatibleOptions.some(opt => opt.ID === selections[key])) {
                    resetSelections[key] = compatibleOptions.length > 0 ? compatibleOptions[0].ID : null; 
                }
            }
        });
        return resetSelections; 
    }, [selections, options.validCombinations, options.groups]);

    // Memoized handlers 
    const handleOptionSelect = useCallback((groupKey: string, value: string) => {
        console.log('Option selected:', groupKey, value);
        const operation = () => {
            setLoading(true);
            setError(null);
            try {
                setSelections(prev => ({
                    ...prev, 
                    [groupKey]: value,
                    ...resetIncompatibleSelections(groupKey, value)
                }));
                setFilteredOptions(prev => ({
                    ...prev
                }));
            } catch (err) {
                setError('Failed to select option. Please try again.');
                console.error('Error selection option:', err);
            } finally {
                setLoading(false);
            }
        };
        setLastOperation(() => operation);
        operation();
    }, [resetIncompatibleSelections]);

    const handleOptionChange = useCallback((key: string, value: string) => {
        console.log('Option changed:', key, value);
        const operation = () => {
            setLoading(true);
            setError(null);
            try {
                setSelections(prev => ({ ...prev, [key]: value }));

                // Reset incompatible selections 
                setSelections(prev => ({
                    ...prev, 
                    ...resetIncompatibleSelections(key, value)
                }));
            } catch (err) {
                setError('Failed to update selection. Please try again.');
                console.error('Error updating selection:', err);
            } finally {
                setLoading(false);
            }
        };
        setLastOperation(() => operation);
        operation();
    }, [resetIncompatibleSelections]);

    const resetError = useCallback(() => setError(null), []);
    const retryLastOperation = useCallback(() => {
        lastOperation?.();
    }, [lastOperation]);

    return { selections, validationState, loading, error, filteredOptions, handleOptionSelect, handleOptionChange, resetError, retryLastOperation };
}