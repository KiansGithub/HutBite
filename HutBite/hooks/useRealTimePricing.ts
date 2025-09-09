import { useState, useEffect, useMemo } from 'react';
import { IBaseProduct } from '@/types/product';
import { IOptionSelections } from '@/types/productOptions';
import { IToppingSelection, ITopping } from '@/types/toppings';
import { calculateItemPrice } from '@/utils/basketUtils';
import { useStore } from '@/contexts/StoreContext';
import { formatCurrency } from '@/utils/orderUtils';

interface UseRealTimePricingProps {
    product: IBaseProduct; 
    selections: IOptionSelections; 
    toppingSelections: IToppingSelection[];
    availableToppings: ITopping[];
    quantity: number;
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
    availableToppings,
    quantity
}: UseRealTimePricingProps): UseRealTimePricingReturn {
    const { currency } = useStore();

    const priceBreakdown = useMemo(() => {
        const unitPrice = calculateItemPrice(
            product, 
            {
                options: selections, 
                toppings: toppingSelections,
            }, 
            toppingSelections, 
            availableToppings
        );
        
        // Multiply by quantity for total price
        return {
            basePrice: unitPrice.basePrice * quantity,
            optionsPrice: unitPrice.optionsPrice * quantity,
            toppingsPrice: unitPrice.toppingsPrice * quantity,
            total: unitPrice.total * quantity
        };
    }, [product, selections, toppingSelections, availableToppings, quantity]);

    const formattedPrice = useMemo(() => {
        return formatCurrency(priceBreakdown.total, currency);
    }, [priceBreakdown.total, currency]);

    return {
        currentPrice: priceBreakdown.total, 
        formattedPrice, 
        priceBreakdown
    };
}