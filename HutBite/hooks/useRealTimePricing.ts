import { useState, useEffect, useMemo } from 'react';
import { IBaseProduct } from '@/types/product';
import { IOptionSelections } from '@/types/productOptions';
import { IToppingSelection, ITopping } from '@/types/toppings';
import { calculateItemPrice } from '@/utils/basketUtils';
import { useStore } from '@/contexts/StoreContext';
import { formatCurrency, CurrencyCode } from '@/utils/orderUtils';

interface UseRealTimePricingProps {
    product: IBaseProduct; 
    selections: IOptionSelections; 
    toppingSelections: IToppingSelection[];
    availableToppings: ITopping[];
}

interface UseRealTimePricingReturn {
    currentPrice: number; 
    formattedPrice: string; 
    priceBreakdown: {
        basePrice: number; 
        optionsPrice: number; 
        toppingsPrice: number; 
        total: number; 
    };
}

export function useRealTimePricing({
    product, 
    selections, 
    toppingSelections, 
    availableToppings
}: UseRealTimePricingProps): UseRealTimePricingReturn {
    const { currency } = useStore();

    const priceBreakdown = useMemo(() => {
        return calculateItemPrice(
        product, 
        {
            options: selections, 
            toppings: toppingSelections,
        }, 
        toppingSelections, 
        availableToppings
    );
    }, [product, selections, toppingSelections, availableToppings]);

    const formattedPrice = useMemo(() => {
        return formatCurrency(priceBreakdown.total, {
            currency: currency as CurrencyCode, 
            showSymbol: true
        });
    }, [priceBreakdown.total, currency]);

    return {
        currentPrice: priceBreakdown.total, 
        formattedPrice, 
        priceBreakdown
    };
}