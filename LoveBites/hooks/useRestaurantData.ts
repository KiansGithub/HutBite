import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabase.d';
import { calculateDistance, shuffleArray } from '@/utils/distance';
import { useLocation } from './useLocation';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'] & { id: string };

export const useRestaurantData = (searchResults?: Restaurant[]) => {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [menuItems, setMenuItems] = useState<Record<string, MenuItem[]>>({});
    const [loading, setLoading] = useState(true);
    const { location } = useLocation();

    useEffect(() => {
        const fetchData = async () => {
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

                if (searchResults && searchResults.length > 0) {
                    sortedRestaurants = searchResults; 
                } else if (location) {
                    const nearby: Restaurant[] = [];
                    const distant: Restaurant[] = [];

                    sortedRestaurants.forEach(restaurant => {
                        // Validate restaurant coordinates 
                        if (
                            restaurant.longitude == null || 
                            restaurant.latitude == null || 
                            isNaN(restaurant.longitude) || 
                            isNaN(restaurant.latitude)
                        ) {
                            // Put restaurant into distant 
                            distant.push(restaurant);
                            return;
                        }
                        const distance = calculateDistance(
                            location.latitude, 
                            location.longitude, 
                            restaurant.latitude, 
                            restaurant.longitude
                        );

                        if (distance <= 3) {
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
    }, [location, searchResults]);

    return { restaurants, menuItems, loading };
};