import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, Dimensions, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Video, ResizeMode } from 'expo-av';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Database } from '@/lib/supabase.d';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'];

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH} = Dimensions.get('window');

export default function FeedScreen() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [menuItems, setMenuItems] = useState<Record<string, MenuItem[]>>({});
    const [loading, setLoading] = useState(true);
    const { signOut } = useAuthStore();

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        try {
            const { data, error } = await supabase 
              .from('restaurants')
              .select('*')
              .order('created_at', { ascending: false });
            
            if (error) throw error; 
            setRestaurants(data || []);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
            Alert.alert('Error', 'Failed to load restaurants');
        } finally {
            setLoading(false);
        }
    };

    const handleOrder = (restaurant: Restaurant) => {
        // TODO: Implement deep linking ot order platforms 
        Alert.alert(
            'Order from ' + restaurant.name, 
            'Deep linking to order platform will be implement next',
            [{ text: 'OK'} ]
        );
    };

    const renderRestaurant = ({ item }: { item: Restaurant }) => {
        const restaurantMenuItems = menuItems[item.id] || [];
        const currentMenuItem = restaurantMenuItems[0];

        return (
            <View style={styles.restaurantCard}>

                {currentMenuItem?.video_url ? (
                    <Video 
                        source={{ uri: currentMenuItem.video_url }}
                        style={styles.video}
                        resizeMode={ResizeMode.COVER}
                        isLooping
                        shouldPlay={true}
                    />
                ): (
                    <View style={styles.videoPlaceholder}>
                        <Text style={styles.placeholderText}>No video available</Text>
                    </View>
                )}
                <View style={styles.overlay}>
                    <View style={styles.restaurantInfo}>
                        <Text style={styles.restaurantName}>{item.name}</Text>
                        <Text style={styles.restaurantDescription}>{item.description}</Text>
 
                        {currentMenuItem && (
                            <View style={styles.menuItemInfo}>
                                <Text style={styles.menuItemName}>{currentMenuItem.name}</Text>
                                <Text style={styles.menuItemDescription}>{currentMenuItem.description}</Text>
                                <Text style={styles.menuItemPrice}>${currentMenuItem.price.toFixed(2)}</Text>
                            </View>
                        )}
 
                        <TouchableOpacity
                            style={styles.orderButton}
                            onPress={() => handleOrder(item)}
                        >
                            <Text style={styles.orderButtonText}>Order Now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };
    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#FF6B35" />
            </View>
        );
    }

    return (
        <View style={styles.container}>

            <FlatList
              data={restaurants}
              renderItem={renderRestaurant}
              keyExtractor={(item) => item.id.toString()}
              pagingEnabled
              showsVerticalScrollIndicator={false}
              snapToAlignment="start"
              decelerationRate="fast"
              snapToInterval={SCREEN_HEIGHT}
            />
             <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
                <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, 
        backgroundColor: '#000'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20, 
        paddingTop: 60, 
        paddingBottom: 20, 
        backgroundColor: '#000',
    },
    headerTitle: {
        fontSize: 24, 
        fontWeight: 'bold',
        color: '#FF6B35'
    },
    signOutButton: {
        padding: 8,
    },
    signOutText: {
        color: '#fff',
        fontSize: 16,
    },
    feed: {
        flex: 1, 
    },
    restaurantCard: {
        height: SCREEN_HEIGHT - 100,
        justifyContent: 'space-between',
        padding: 20
    },
    restaurantInfo: {
        zIndex: 1,
    },
    restaurantName: {
        fontSize: 32, 
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8
    },
    restaurantDescription: {
        fontSize: 16, 
        color: '#ccc',
        marginBottom: 20
    },
    orderButton: {
        backgroundColor: '#FF6B35',
        borderRadius: 25, 
        paddingVertical: 12, 
        paddingHorizontal: 24, 
        alignSelf: 'flex-start'
    },
    orderButtonText: {
        color: '#fff',
        fontSize: 18, 
        fontWeight: '600'
    },
    menuItemInfo: {
        marginBottom: 16, 
        padding: 12, 
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8
    },
    menuItemName: {
        fontSize: 20, 
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4, 
    },
    menuItemDescription: {
        fontSize: 14, 
        color: '#ccc',
        marginBottom: 4, 
    },
    menuItemPrice: {
        fontSize: 18, 
        fontWeight: 'bold',
        color: '#FF6B35',
    },
    video: {
        flex: 1, 
        borderRadius: 12, 
        marginTop: 20
    },
    videoPlaceholder: {
        flex: 1, 
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#333',
        borderRadius: 12, 
        marginTop: 20
    },
    placeholderText: {
        color: '#999',
        fontSize: 18,
    },
    loadingContainer: {
        flex: 1, 
        justifyContent: 'center',
        alignItems: 'center',
    },
});