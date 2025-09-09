import { useState, useCallback } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { ITopping, IToppingGroup } from '@/types/toppings';
import { GROUPS_PARAMS } from '@/constants/api';
import { normalizeOptionList } from '@/utils/productOptionsUtils';

interface UseToppingsReturn {
    getAllToppings: () => ITopping[];
    getAllToppingGroups: () => IToppingGroup[];
    getToppingsByGroup: (groupId: string) => ITopping[];
    isLoading: boolean; 
    error: Error | null;
}

export const useToppings = (): UseToppingsReturn => {
    const storeState = useStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Get all toppings from all groups 
    const getAllToppings = useCallback(() => {
        try {
            setIsLoading(true);
            setError(null);

            if(!storeState.toppingGroups) {
                throw new Error('Topping groups not available');
            }

            const allToppings = storeState.toppingGroups.flatMap(
                (group) => group.DeProducts
            );

            return allToppings;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to get toppings'));
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [storeState.toppingGroups]);

    // Get all topping groups 
    const getAllToppingGroups = useCallback((): IToppingGroup[] => {
        try {
            setIsLoading(true);
            setError(null);

            return storeState.toppingGroups || [];
        } catch (err) {
            setError(err instanceof Error ? error : new Error('Failed to get topping groups'));
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [storeState.toppingGroups]);

    // Get toppings by specific group 
    const getToppingsByGroup = useCallback((groupId: string): ITopping[] => {
        try {
            setIsLoading(true);
            setError(null);

            if (!storeState.toppingGroups) {
                throw new Error('Topping groups not available');
            }

            const group = storeState.toppingGroups.find((g: IToppingGroup) => g.ID === groupId);
            if (!group) {
                throw new Error(`Topping group ${groupId} not found`);
            }

            return group.DeProducts.map((topping: any) => ({
                ...topping,
                displayGroup: group.Name || 'Other',
                prices: topping.DeGroupPrices?.DePrices.map((price: any) => {
                    const normalizedList = normalizeOptionList(price.DeMixOption?.OptionList);
                    const firstOption = normalizedList[0];
                    return {
                        Amount: price.Amount,
                        SizeID: firstOption?.Value?.ID ?? '',
                        SizeName: price.DeMixOption?.Name ?? '',
                        OnlineName: firstOption?.Value?.OnlineName,
                        IsOptionMandatory: price.IsOptionMandetory ?? false,
                        OPID: price.OPID ?? '',
                    };
                }) || []
            })) as ITopping[];
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to get toppings for group'));
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [storeState.toppingGroups]);

    return {
        getAllToppings, 
        getAllToppingGroups,
        getToppingsByGroup, 
        isLoading, 
        error
    }
}