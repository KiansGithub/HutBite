import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    Image, 
    TouchableOpacity, 
    SafeAreaView, 
    ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from '@/components/GlassPanel';
import Colors from '@/constants/Colors';
import { ScrollViewStyleReset } from 'expo-router/html';

export default function RestaurantScreen() {
    const { id, menuItem } = useLocalSearchParams<{ id: any; menuItem?: string }>();
    const [restaurant, setRestaurant] = useState<any>(null);
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: Fetch restaurant data and menu items based on the id 
        // This is a placeholder - replace with your actual data fetching logic 
        const fetchRestaurantData = async () => {
            try {
                setLoading(true);
                // Replace with your actual API calls 
                // const restaurantData = await fetchRestaurant(id);
                // const menuData = await fetchMenuItems(id);
                // setRestaurant(restaurantData);
                // setMenuItems(menuData);

                // Placeholder data 
                setRestaurant({
                    id, 
                    name: 'Restaurant Name',
                    description: 'Restaurant description...',
                    image_url: null
                });
                setMenuItems([])
            } catch (error) {
                console.error('Error fetching restaurant data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchRestaurantData();
        }
    }, [id]);

    useEffect(() => {
        // Scroll to specific menu item if provided 
        if (menuItem && menuItems.length > 0) {
            // TODO: Implement scrolling to specific menu item 
            console.log('Scroll to menu item:', menuItem);
        }
    }, [menuItem, menuItems]);

    if (loading) {
        return (
            <LinearGradient 
                colors={['#FF512F', '#F09819', '#FFB347']}
                start={{ x: 0, y: 0}}
                end={{ x: 1, y: 1}}
                style={styles.container}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={[styles.container, styles.center]}>
                        <ActivityIndicator size="large" color="#fff" />
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient 
            colors={['#FF512F', '#F09819', '#FFB347']}
            start={{ x: 0, y: 0}}
            end={{ x: 1, y: 1}}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity 
                       style={styles.backButton}
                       onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{restaurant?.name || 'Restaurant'}</Text>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {restaurant?.image_url && (
                        <Image source={{ uri: restaurant.image_url }} style={styles.restaurantImage} />
                    )}

                    <GlassPanel style={styles.infoPanel}>
                        <Text style={styles.restaurantName}>{restaurant?.name}</Text>
                        {restaurant?.description && (
                            <Text style={styles.restaurantDescription}>{restaurant.description}</Text>
                        )}
                    </GlassPanel>

                    <View style={styles.menuSection}>
                        <Text style={styles.sectionTitle}>Menu Items</Text>
                        {menuItems.length > 0 ? (
                            menuItems.map((item, index) => (
                                <GlassPanel key={item.id || index} style={styles.menuItemCard}>
                                    <View style={styles.menuItemContent}>
                                        <View style={styles.menuItemInfo}>
                                            <Text style={styles.menuItemTitle}>{item.title}</Text>
                                            {item.description && (
                                                <Text style={styles.menuItemDescription}>{item.description}</Text>
                                            )}
                                            {item.price && (
                                                <Text style={styles.menuItemPrice}>${item.price}</Text>
                                            )}
                                        </View>
                                        {item.thumb_url && (
                                            <Image source={{ uri: item.thumb_url }} style={styles.menuItemImage} />
                                        )}
                                    </View>
                                </GlassPanel>
                            ))
                        ) : (
                            <GlassPanel style={styles.emptyPanel}>
                                <Text style={styles.emptyText}>No menu items available</Text>
                            </GlassPanel>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
} 

const styles = StyleSheet.create({
    container: {
        flex: 1, 
    },
    safeArea: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20, 
        paddingVertical: 16, 
        justifyContent: 'space-between'
    },
    backButton: {
        padding: 8, 
    },
    headerTitle: {
        fontSize: 18, 
        fontWeight: '700',
        color: '#fff',
        flex: 1, 
        textAlign: 'center',
    },
    placeholder: {
        width: 40, 
    },
    content: {
        flex: 1, 
        paddingHorizontal: 20, 
    },
    restaurantImage: {
        width: '100%',
        height: 200, 
        borderRadius: 12, 
        marginBottom: 16
    },
    infoPanel: {
        padding: 20, 
        marginBottom: 20
    },
    restaurantName: {
        fontSize: 24, 
        fontWeight: '700',
        color: '#ff',
        marginBottom: 8,
    },
    restaurantDescription: {
        fontSize: 16, 
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 22, 
    },
    menuSection: {
        marginBottom: 20, 
    },
    sectionTitle: {
        fontSize: 20, 
        fontWeight: '700',
        color: '#fff',
        marginBottom: 16, 
    },
    menuItemCard: {
        padding: 16, 
        marginBottom: 12, 
    },
    menuItemContent: { 
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemInfo: {
        flex: 1, 
    },
    menuItemTitle: {
        fontSize: 18, 
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4, 
    },
    menuItemDescription: {
        fontSize: 14, 
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 8, 
        lineHeight: 18, 
    },
    menuItemPrice: {
        fontSize: 16, 
        fontWeight: '700',
        color: Colors.light.primary, 
    }, 
    menuItemImage: {
        width: 60, 
        height: 60, 
        borderRadius: 8, 
        marginLeft: 12, 
    },
    emptyPanel: {
        padding: 20, 
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16, 
        color: 'rgba(255,255,255,0.7)',
    },
});