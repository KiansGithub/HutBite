import { useState, useCallback } from 'react';
import { Database } from '@/lib/supabase.d';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

export const useMenuModal = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

    const openMenu = useCallback((restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant);
        setIsVisible(true);
    }, []);

    const closeMenu = useCallback(() => {
        setIsVisible(false);
        setSelectedRestaurant(null);
    }, []);

    return {
        isVisible,
        selectedRestaurant,
        openMenu,
        closeMenu,
    };
};
