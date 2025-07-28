import React, { useMemo } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, Callout} from 'react-native-maps';
import { router } from 'expo-router';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { useLocation } from '@/hooks/useLocation';
import { Text } from 'react-native';

export default function MapScreen() {
    const { restaurants, loading } = useRestaurantData();
    const { location } = useLocation();

    const validRestaurants = useMemo(() => {
        return restaurants.filter(restaurant =>
            restaurant.latitude != null && 
            restaurant.longitude != null &&
            !isNaN(restaurant.latitude) &&
            !isNaN(restaurant.longitude)
        );
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
        router.push('/(main)/restaurant/${restaurantId}');
    };

    if (loading) {
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
            >
                {validRestaurants.map((restaurant) => (
                    <Marker 
                        key={restaurant.id}
                        coordinate={{
                            latitude: restaurant.latitude, 
                            longitude: restaurant.longitude, 
                        }}
                        tracksViewChanges={false}
                    >
                        <Callout onPress={() => handleMarkerPress(restaurant.id)}>
                            <View style={styles.callout}>
                                <Text style={styles.calloutTitle}>{restaurant.name}</Text>
                                {restaurant.distance && (
                                    <Text style={styles.calloutDistance}>
                                        {restaurant.distance.toFixed(1)} mi away 
                                    </Text>
                                )}
                                <Text style={styles.calloutTap}>Tap to view menu</Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}
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
    callout: {
        minWidth: 200, 
        padding: 10, 
    },
    calloutTitle: {
        fontSize: 16, 
        fontWeight: 'bold',
        marginBottom: 4, 
    },
    calloutDistance: {
        fontSize: 14, 
        color: '#666',
        marginBottom: 4, 
    },
    calloutTap: {
        fontSize: 12, 
        color: '#FF7A00', 
        fontStyle: 'italic',
    },
});