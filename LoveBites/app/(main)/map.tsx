import React, { useMemo } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import MapView, { Marker, Callout} from 'react-native-maps';
import { router } from 'expo-router';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { useLocation } from '@/hooks/useLocation';
import { Text } from 'react-native';
import { Database } from '@/lib/supabase.d';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type RestaurantWithDistance = Restaurant & { distance?: number };

export default function MapScreen() {
    const { restaurants, loading } = useRestaurantData();
    const { location } = useLocation();

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
        console.log('Total restaurants from hook:', restaurants.length);
 
        const filtered = restaurants.filter(restaurant => {
            const hasValidLat = restaurant.latitude != null &&
                               !isNaN(Number(restaurant.latitude)) &&
                               isFinite(Number(restaurant.latitude));
            const hasValidLng = restaurant.longitude != null &&
                               !isNaN(Number(restaurant.longitude)) &&
                               isFinite(Number(restaurant.longitude));
 
            const isValid = hasValidLat && hasValidLng;
 
            if (!isValid) {
                console.log('Invalid restaurant coordinates:', {
                    name: restaurant.name,
                    lat: restaurant.latitude,
                    lng: restaurant.longitude,
                    hasValidLat,
                    hasValidLng
                });
            } else {
                console.log('Valid restaurant:', {
                    name: restaurant.name,
                    lat: Number(restaurant.latitude),
                    lng: Number(restaurant.longitude)
                });
            }
 
            return isValid;
        });
 
        console.log('Valid restaurants for map:', filtered.length);
        console.log('Valid restaurant names:', filtered.map(r => r.name));
 
        // Handle duplicate coordinates
        const offsetRestaurants = offsetDuplicateCoordinates(filtered);
        console.log('Restaurants after coordinate offsetting:', offsetRestaurants.length);
 
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
            <View style={styles.loadingContainer}>
                <Text>Loading map...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={initialRegion}
                showsUserLocation={!!location}
                showsMyLocationButton={!!location}
                key={`map-${validRestaurants.length}-${Date.now()}`}
            >
                {validRestaurants.map((restaurant, index) => {
                    const lat = Number(restaurant.latitude);
                    const lng = Number(restaurant.longitude);
 
                    console.log(`Rendering marker ${index + 1}:`, {
                        name: restaurant.name,
                        lat,
                        lng,
                        id: restaurant.id
                    });
 
                    return (
                        <Marker
                            key={restaurant.id}
                            coordinate={{
                                latitude: lat,
                                longitude: lng,
                            }}
                            title={restaurant.name}
                            description={restaurant.distance ? `${restaurant.distance.toFixed(1)} mi away` : 'Restaurant'}
                            tracksViewChanges={true}
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
                                    <Text style={styles.calloutTap} numberOfLines={1}>Tap to view menu</Text>
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
        backgroundColor: '#000',
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
        height: 70,
        justifyContent: 'space-between',
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
        color: '#FF7A00', 
        fontStyle: 'italic',
        flexShrink: 1,
    },
});