import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabase.d';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'] & { id: string };

export const useRestaurantData = () => {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [menuItems, setMenuItems] = useState<Record<string, MenuItem[]>>({});
    const [loading, setLoading] = useState(true);

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

                setRestaurants(rs ?? []);
                setMenuItems(grouped);
            } catch (err) {
                console.error(err);
                Alert.alert('Error', 'Failed to load restaurants');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { restaurants, menuItems, loading };
};