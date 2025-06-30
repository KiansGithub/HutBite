import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { useLocation } from '@/hooks/useLocation';

export default function MapScreen() {
    const { restaurants } = useRestaurantData();
    const { location } = useLocation();

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

    return (
        <View style={styles.container}>
            <MapView 
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={initialRegion}
              showsUserLocation={true}
              showsMyLocationButton={true}
            >
                {restaurants.map((restaurant) => (
                    <Marker 
                      key={restaurant.id}
                      coordinate={{
                        latitude: restaurant.latitude, 
                        longitude: restaurant.longitude, 
                      }}
                      title={restaurant.name}
                      description={restaurant.description || ''}
                    />
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
        flex: 1
    },
});