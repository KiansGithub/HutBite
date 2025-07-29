import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabase.d';
import { calculateDistance, shuffleArray } from '@/utils/distance';
import { getUniqueCuisines, getCuisineCounts } from '@/utils/cuisine';
import { useLocation } from './useLocation';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'] & { id: string };
type RestaurantWithDistance = Restaurant & { distance?: number };

export const useRestaurantData = (searchResults?: Restaurant[]) => {
    const [restaurants, setRestaurants] = useState<RestaurantWithDistance[]>([]);
    const [menuItems, setMenuItems] = useState<Record<string, MenuItem[]>>({});
    const [loading, setLoading] = useState(true);
    const [reshuffleTrigger, setReshuffleTrigger] = useState(0);
    const { location, loading: locationLoading } = useLocation();

    const reshuffleRestaurants = useCallback(() => {
        setReshuffleTrigger(prev => prev + 1);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            // Don't fetch data until location loading is complete 
            if (locationLoading) {
                return; 
            }

            try {
                const { data: rs } = await supabase 
                  .from('restaurants')
                  .select('*')
                  .order('created_at', { ascending: false });
                
                const { data: ms } = await supabase 
                  .from('menu_items')
                  .select('*')
                
                const grouped: Record<string, MenuItem[]> = {};
                ms?.forEach(mi => {
                    (grouped[mi.restaurant_id] ??= []).push(mi as MenuItem);
                });

                let sortedRestaurants = rs ?? [];

                // Calculate distances for all restaurants if location is available 
                if (location) {
                    sortedRestaurants = sortedRestaurants.map(restaurant => {
                        if (
                            restaurant.longitude == null ||
                            restaurant.latitude == null ||
                            isNaN(restaurant.longitude) ||
                            isNaN(restaurant.latitude)
                        ) {
                            return { ...restaurant, distance: undefined };
                        }

                        const distance = calculateDistance(
                            location.latitude, 
                            location.longitude, 
                            restaurant.latitude, 
                            restaurant.longitude
                        );

                        return { ...restaurant, distance };
                    });
                }

                if (searchResults && searchResults.length > 0) {
                    sortedRestaurants = searchResults.map(restaurant => {
                        const existingRestaurant = sortedRestaurants.find(r => r.id === restaurant.id);
                        return existingRestaurant || restaurant; 
                    });
                } else if (location) {
                    const nearby: Restaurant[] = [];
                    const distant: Restaurant[] = [];

                    sortedRestaurants.forEach(restaurant => {
                        if (restaurant.distance === undefined) {
                            // Put restaurant into distant 
                            distant.push(restaurant);
                            return;
                        }

                        if (restaurant.distance <= 3) {
                            nearby.push(restaurant);
                        } else {
                            distant.push(restaurant);
                        }
                    });

                    sortedRestaurants = [
                        ...shuffleArray(nearby),
                        ...shuffleArray(distant)
                    ];
                } else {
                    sortedRestaurants = shuffleArray(sortedRestaurants);
                }

                setRestaurants(sortedRestaurants);

                setMenuItems(grouped);
            } catch (err) {
                console.error(err);
                Alert.alert('Error', 'Failed to load restaurants');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [location, locationLoading, searchResults, reshuffleTrigger]);

    return { 
        restaurants, 
        menuItems, 
        loading: loading || locationLoading,
        availableCuisines: getUniqueCuisines(restaurants),
        cuisineCounts: getCuisineCounts(restaurants),
        reshuffleRestaurants
    };
};