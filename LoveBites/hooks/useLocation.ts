import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

interface UserLocation {
    latitude: number; 
    longitude: number; 
}

export const useLocation = () => {
    const [location, setLocation] = useState<UserLocation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getLocation = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();

                if (status !== 'granted') {
                    setError('Location permission denied');
                    Alert.alert(
                        'Location Required',
                        'We need location access to show nearby restaurants. You can still browse all restaurants.',
                        [{ text: 'OK' }]
                    );
                    setLoading(false);
                    return;
                }

                const currentLocation = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced, 
                });

                setLocation({
                    latitude: currentLocation.coords.latitude, 
                    longitude: currentLocation.coords.longitude, 
                });
            } catch (err) {
                console.error('Error getting location:', err);
                setError('Failed to get location');
            } finally {
                setLoading(false);
            }
        };

        getLocation();
    }, []);

    return { location, loading, error };
}