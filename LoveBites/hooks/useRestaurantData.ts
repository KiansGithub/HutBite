import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabase.d';
import { calculateDistance, shuffleArray } from '@/utils/distance';
import { getUniqueCuisines, getCuisineCounts } from '@/utils/cuisine';
import { useLocation } from './useLocation';
import { FeedContentItem, RestaurantFeedData } from '@/types/feedContent';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'] & { id: string };
type UGCVideo = Database['public']['Tables']['ugc_videos']['Row'] & { id: string };
export type RestaurantWithDistance = Restaurant & { distance?: number };

export const useRestaurantData = (searchResults?: Restaurant[]) => {
    const [restaurants, setRestaurants] = useState<RestaurantWithDistance[]>([]);
    const [feedContent, setFeedContent] = useState<RestaurantFeedData>({});
    const [loading, setLoading] = useState(true);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [reshuffleTrigger, setReshuffleTrigger] = useState(0);
    const { location, loading: locationLoading } = useLocation();
    const [menuItems, setMenuItems] = useState<Record<string, MenuItem[]>>({});

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

                const { data: ugcVideos } = await supabase 
                  .from('ugc_videos')
                  .select('*')
                
                const grouped: Record<string, MenuItem[]> = {};
                ms?.forEach(mi => {
                    (grouped[mi.restaurant_id] ??= []).push(mi as MenuItem);
                });

                // Set menu items grouped by restaurant
                setMenuItems(grouped);

                let sortedRestaurants = rs ?? [];

                // Create combined feed content 
                const combinedFeedContent: RestaurantFeedData = {};

                // Add menu items to feed content 
                ms?.forEach(menuItem => {
                    const feedItem: FeedContentItem = {
                        id: menuItem.id, 
                        type: 'menu_item',
                        restaurant_id: menuItem.restaurant_id, 
                        title: menuItem.name, 
                        description: menuItem.description, 
                        video_url: menuItem.video_url, 
                        thumb_url: menuItem.thumb_url, 
                        price: menuItem.price, 
                        created_at: menuItem.created_at, 
                        menu_item_id: menuItem.id, 
                    };

                    if (!combinedFeedContent[menuItem.restaurant_id]) {
                        combinedFeedContent[menuItem.restaurant_id] = [];
                    }
                    combinedFeedContent[menuItem.restaurant_id].push(feedItem);
                });

                // Add UGC videos to feed content 
                ugcVideos?.forEach(ugcVideo => {
                    console.log('Processing UGC video:', ugcVideo.id, 'for restaurant:', ugcVideo.restaurant_id);
                    const feedItem: FeedContentItem = {
                        id: ugcVideo.id, 
                        type: 'ugc_video',
                        restaurant_id: ugcVideo.restaurant_id, 
                        title: ugcVideo.title || 'User Video',
                        description: ugcVideo.description, 
                        video_url: ugcVideo.video_url, 
                        thumb_url: ugcVideo.thumb_url,
                        created_at: ugcVideo.created_at,
                        user_id: ugcVideo.user_id,
                        suggested_restaurant_name: ugcVideo.suggested_restaurant_name
                    }; 

                    if (!combinedFeedContent[ugcVideo.restaurant_id]) {
                        combinedFeedContent[ugcVideo.restaurant_id] = [];
                    }
                    combinedFeedContent[ugcVideo.restaurant_id].push(feedItem);
                });

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

                setFeedContent(combinedFeedContent);
                console.log('Final feed content:', combinedFeedContent);
                setDataLoaded(true);
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
        feedContent, 
        loading: loading || locationLoading || !dataLoaded,
        availableCuisines: getUniqueCuisines(restaurants),
        cuisineCounts: getCuisineCounts(restaurants),
        reshuffleRestaurants
    };
};