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

const toId = (v: any) => (v == null ? null : String(v));

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
    const [selections, setSelections] = useState<IOptionSelections>(
        initialSelections || {}
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filteredOptions, setFilteredOptions] = useState<IFilteredOptionGroups>(
        options?.groups?.reduce((acc, group) => ({ ...acc, [group.key]: group.options }), {}) || {}
      );
      useEffect(() => {
        setFilteredOptions(
          options?.groups?.reduce(
            (acc, group) => ({ ...acc, [group.key]: group.options }),
            {}
          ) || {}
        );
      }, [options?.groups]);
    const [lastOperation, setLastOperation] = useState<(() => void) | null>(null);

    useEffect(() => {
        if (initialSelections && Object.keys(initialSelections).length > 0) {
          const normalized = Object.fromEntries(
            Object.entries(initialSelections).map(([k, v]) => [k, String(v)])
          );
          setSelections(normalized);
        }
      }, [initialSelections]);
      
    // Apply defaults: processed -> required groups -> fallback(all groups)
useEffect(() => {
    const isNewItem = !initialSelections || Object.keys(initialSelections).length === 0;
    if (!isNewItem) return;
  
    // 1) Prefer processed defaults if present
    const ds = options?.defaultSelections ?? {};
    if (Object.keys(ds).length > 0) {
      const normalized = Object.fromEntries(
        Object.entries(ds).map(([k, v]) => [k, String(v)])
      );
      setSelections(normalized);
      return;
    }
  
    // 2) If you *do* want to prefer "required" when available, keep this block.
    //    BUT in your data required is empty, so it will skip to step 3 anyway.
    const requiredFirsts = Object.fromEntries(
      (options?.groups ?? [])
        .filter(g => g.isRequired && g.options && g.options.length)
        .map(g => [g.key, String(g.options[0].ID)])
    );
    if (Object.keys(requiredFirsts).length > 0) {
      setSelections(requiredFirsts);
      return;
    }
  
    // 3) Fallback: pick the first option for *every* group
    const allFirsts = Object.fromEntries(
      (options?.groups ?? [])
        .filter(g => g.options && g.options.length)
        .map(g => [g.key, String(g.options[0].ID)])
    );
    if (Object.keys(allFirsts).length > 0) {
      setSelections(allFirsts);
    }
  }, [options?.defaultSelections, options?.groups, initialSelections]);

    // Memoized validation state 
    const validationState = useMemo(() => {
        try {
            const result = validateOptionSelections(selections, options.requirements);
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
        }
    }, [selections, options.requirements]);

    // Notify parent of selection changes 
    useEffect(() => {
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

    const resetIncompatibleSelections = useCallback((changedKey: string, newValue: string) => {
        if (!options.validCombinations) return {};
        const v = String(newValue);
        const resetSelections: IOptionSelections = {};
        Object.keys(selections).forEach(key => {
          if (key !== changedKey) {
            const allOptions = options.groups.find(g => g.key === key)?.options || [];
            const compatible = getCompatibleOptions(key, { [changedKey]: v }, options.validCombinations, allOptions);
            const current = String(selections[key] ?? '');
            const stillValid = compatible.some(opt => String(opt.ID) === current);
            if (!stillValid) {
              resetSelections[key] = compatible.length ? String(compatible[0].ID) : null;
            }
          }
        });
        return resetSelections;
      }, [selections, options.validCombinations, options.groups]);

    const handleOptionSelect = useCallback((groupKey: string, value: string) => {
        const v = String(value);
        const operation = () => {
          setLoading(true);
          setError(null);
          try {
            setSelections(prev => ({
              ...prev,
              [groupKey]: v,
              ...resetIncompatibleSelections(groupKey, v),
            }));
            setFilteredOptions(prev => ({ ...prev }));
          } finally {
            setLoading(false);
          }
        };
        setLastOperation(() => operation);
        operation();
      }, [resetIncompatibleSelections]);
      
      const handleOptionChange = useCallback((key: string, value: string) => {
        const v = String(value);
        const operation = () => {
          setLoading(true);
          setError(null);
          try {
            const resets = resetIncompatibleSelections(key, v);
            setSelections(prev => ({ ...prev, [key]: v, ...resets }));
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