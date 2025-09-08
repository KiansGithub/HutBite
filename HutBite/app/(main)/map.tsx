import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, Alert, Platform, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout} from 'react-native-maps';
import { router } from 'expo-router';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { useLocation } from '@/hooks/useLocation';
import { Text } from 'react-native';
import { Database } from '@/lib/supabase.d';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useTabTheme } from '@/contexts/TabThemeContext';
import { useFocusEffect } from '@react-navigation/native';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type RestaurantWithDistance = Restaurant & { distance?: number };

export default function MapScreen() {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme];
    const { setTheme } = useTabTheme();

    const { restaurants, loading } = useRestaurantData();
    const { location } = useLocation();
    const [mapReady, setMapReady] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            setTheme('light');
        }, [setTheme])
    );

    // Function to offset duplicate coordinates slightly
    const offsetDuplicateCoordinates = (restaurants: RestaurantWithDistance[]): RestaurantWithDistance[] => {
        const coordinateMap = new Map<string, number>();
 
        return restaurants.map(restaurant => {
            const coordKey = `${restaurant.latitude},${restaurant.longitude}`;
            const count = coordinateMap.get(coordKey) || 0;
            coordinateMap.set(coordKey, count + 1);
 
            if (count > 0) {
                // Offset by a small amount (roughly 10 meters)
                const offset = count * 0.0001;
                return {
                    ...restaurant,
                    latitude: restaurant.latitude + offset,
                    longitude: restaurant.longitude + offset
                };
            }
 
            return restaurant;
        });
    };
 
    const validRestaurants = useMemo(() => {
 
        const filtered = restaurants.filter(restaurant => {
            const hasValidLat = restaurant.latitude != null &&
                               !isNaN(Number(restaurant.latitude)) &&
                               isFinite(Number(restaurant.latitude));
            const hasValidLng = restaurant.longitude != null &&
                               !isNaN(Number(restaurant.longitude)) &&
                               isFinite(Number(restaurant.longitude));
 
            const isValid = hasValidLat && hasValidLng;
            return isValid;
        });
 
        // Handle duplicate coordinates
        const offsetRestaurants = offsetDuplicateCoordinates(filtered);
 
        return offsetRestaurants;
    }, [restaurants]);

    const initialRegion = useMemo(() => {
        if (location) {
            return {
                latitude: location.latitude, 
                longitude: location.longitude, 
                latitudeDelta: 0.0922, 
                longitudeDelta: 0.0421, 
            };
        }

        if (validRestaurants.length > 0) {
            const firstRestaurant = validRestaurants[0];
            return {
                latitude: firstRestaurant.latitude, 
                longitude: firstRestaurant.longitude, 
                latitudeDelta: 0.0922, 
                longitudeDelta: 0.042, 
            };
        }

        return {
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            
            longitudeDelta: 0.0421,
        }; 
    }, [location, validRestaurants]);

    const handleMarkerPress = (restaurantId: string) => {
        router.push(`/(main)/restaurant/${restaurantId}`);
    };

    if (loading || restaurants.length === 0) {
        return (
            <View style={styles.loadingContainer} testID="loading-indicator">
                <ActivityIndicator size="large" color={themeColors.primary} />
                <Text style={styles.loadingText}>Loading map...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {!mapReady && (
                <View style={styles.mapLoadingOverlay}>
                <ActivityIndicator size="large" color={themeColors.primary} />
                <Text style={styles.loadingText}>Preparing map...</Text>
            </View>
            )}
            <MapView
                style={styles.map}
                initialRegion={initialRegion}
                showsUserLocation={!!location}
                showsMyLocationButton={!!location}
                onMapReady={() => {
                    console.log('Map is ready');
                    setMapReady(true);
                }}
                loadingEnabled={true}
                loadingIndicatorColor={themeColors.primary}
                loadingBackgroundColor="#f5f5f5"
                key={`map-${validRestaurants.length}`}
            >
                {validRestaurants.map((restaurant, index) => {
                    const lat = Number(restaurant.latitude);
                    const lng = Number(restaurant.longitude);
 
                    return (
                        <Marker
                            key={restaurant.id}
                            coordinate={{
                                latitude: lat,
                                longitude: lng,
                            }}
                            pinColor="purple"
                            title={restaurant.name}
                            description={restaurant.distance ? `${restaurant.distance.toFixed(1)} mi away` : 'Restaurant'}
                            tracksViewChanges={false}
                            stopPropagation={true}
                        >
                            <Callout 
                                onPress={() => handleMarkerPress(restaurant.id)}
                                style={Platform.OS === 'android' ? styles.calloutContainer : undefined}
                            >
                                <View style={[
                                    styles.callout,
                                    Platform.OS === 'android' && styles.calloutAndroid
                                ]}>
                                    <Text style={styles.calloutTitle} numberOfLines={2}>{restaurant.name}</Text>
                                    {restaurant.distance && (
                                        <Text style={styles.calloutDistance} numberOfLines={1}>
                                            {restaurant.distance.toFixed(1)} mi away
                                        </Text>
                                    )}
                                    <Text style={[styles.calloutTap, { color: themeColors.primary }]} numberOfLines={1}>Tap to view menu</Text>
                                </View>
                            </Callout>
                        </Marker>
                    );
                })}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, 
    },
    map: {
        flex: 1, 
    },
    loadingContainer: {
        flex: 1, 
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    mapLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    calloutContainer: {
        // Android-specific container styling
        width: 220,
        height: 90,
    },
    callout: {
        minWidth: 200, 
        maxWidth: 220,
        padding: 10, 
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    calloutAndroid: {
        // Android-specific callout styling
        width: 200,
        justifyContent: 'flex-start',
    },
    calloutTitle: {
        fontSize: 16, 
        fontWeight: 'bold',
        marginBottom: 4, 
        color: '#000',
        flexShrink: 1,
    },
    calloutDistance: {
        fontSize: 14, 
        color: '#666',
        marginBottom: 4, 
        flexShrink: 1,
    },
    calloutTap: {
        fontSize: 12, 
        fontStyle: 'italic',
        flexShrink: 1,
    },
});