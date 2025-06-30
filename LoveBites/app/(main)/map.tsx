import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { useLocation } from '@/hooks/useLocation';
import { router } from 'expo-router';
 
export default function MapScreen() {
    const { restaurants, loading: restaurantsLoading } = useRestaurantData();
    const { location, loading: locationLoading } = useLocation();
 
    const loading = restaurantsLoading || locationLoading;
 
    // Filter restaurants with valid coordinates
    const validRestaurants = restaurants.filter(restaurant =>
        restaurant.latitude != null &&
        restaurant.longitude != null &&
        !isNaN(restaurant.latitude) &&
        !isNaN(restaurant.longitude)
    );
 
    const initialRegion = location ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    } : {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    };
 
    const handleMarkerPress = (restaurant: any) => {
        // Navigate to restaurant details - adjust route as needed
        router.push(`/restaurant/${restaurant.id}`);
    };
 
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Loading restaurants...</Text>
            </View>
        );
    }
 
    return (
        <View style={styles.container}>
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={initialRegion}
                showsUserLocation={true}
                showsMyLocationButton={true}
                showsCompass={true}
                showsScale={true}
                onMapReady={() => {
                    console.log('Map is ready');
                }}
                onRegionChangeComplete={(region) => {
                    console.log('Region changed:', region);
                }}
            >
                {validRestaurants.map((restaurant) => (
                    <Marker
                        key={restaurant.id}
                        coordinate={{
                            latitude: restaurant.latitude,
                            longitude: restaurant.longitude,
                        }}
                        title={restaurant.name}
                        description={restaurant.description || 'No description available'}
                        pinColor="#FF6B6B"
                        onPress={() => handleMarkerPress(restaurant)}
                    >
                        <Callout
                            style={styles.callout}
                            onPress={() => handleMarkerPress(restaurant)}
                        >
                            <View style={styles.calloutContainer}>
                                <Text style={styles.calloutTitle}>{restaurant.name}</Text>
                                <Text style={styles.calloutDescription} numberOfLines={2}>
                                    {restaurant.description || 'No description available'}
                                </Text>
                                <Text style={styles.calloutAction}>Tap to view menu</Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>
 
            {validRestaurants.length === 0 && !loading && (
                <View style={styles.noRestaurantsContainer}>
                    <Text style={styles.noRestaurantsText}>
                        No restaurants found in this area
                    </Text>
                </View>
            )}
 
            <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                    {validRestaurants.length} restaurant{validRestaurants.length !== 1 ? 's' : ''} found
                </Text>
            </View>
        </View>
    );
}
 
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    callout: {
        width: 200,
    },
    calloutContainer: {
        padding: 10,
        minWidth: 180,
    },
    calloutTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    calloutDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        lineHeight: 18,
    },
    calloutAction: {
        fontSize: 12,
        color: '#FF6B6B',
        fontWeight: '600',
        textAlign: 'center',
    },
    noRestaurantsContainer: {
        position: 'absolute',
        top: 100,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    noRestaurantsText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    statsContainer: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 12,
        borderRadius: 20,
        alignItems: 'center',
    },
    statsText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
});