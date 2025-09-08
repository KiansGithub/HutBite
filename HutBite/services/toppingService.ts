import axios from 'axios';
import { useQuery } from 'react-query';
import { IBaseProduct } from '@/types/product';

// API response interfaces
interface IToppingResponse {
    Groups: IToppingGroupResponse[];
    Status: string; 
    ErrorMessage?: string; 
}

interface IToppingGroupResponse {
    ID: string; 
    Name: string; 
    Products: IBaseProduct[];
}

const TOPPING_API_URL = 'http://Services.tgfpizza.com/WinPizzaMainServices/WinPizzaService20014.WebSubmitOrder.svc/GrpsInCat';

/**
 * Fetches topping data from the API 
 *  @retursn Promse with topping data
 */
export async function fetchToppings(): Promise<IToppingResponse> {
    try {
        const params = {
            DataName: 'testdata',
            MenueID: 'TGFONLINE',
            CatID: '9',
            CatType: 'TOPPING'
        };

        const response = await axios.get<IToppingResponse>(TOPPING_API_URL, { params });

        if (response.data.Status !== 'Success') {
            throw new Error(response.data.ErrorMessage || 'Failed to fetch toppings');
        }

        return response.data; 
    } catch (error) {
        throw new Error('Failed to fetch toppings: ' + (error as Error).message);
    }
}

/**
 * React Query hook for fetching and caching toppings 
 */
export function useToppings() {
    return useQuery('toppings', fetchToppings, {
        staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
        cacheTime: 30 * 60 * 1000, // Cache for 30 minutes 
    });
}