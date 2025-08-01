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

                // Create a timeout promise that rejects
                const timeoutPromise = new Promise<Location.LocationObject>((_, reject) =>
                    setTimeout(() => reject(new Error('Location timeout')), 10000)
                );
 
                // Race the location request with timeout
                const currentLocation = await Promise.race([
                    Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                    }) as Promise<Location.LocationObject>,
                    timeoutPromise
                ]);
 
                // Now TypeScript knows currentLocation is LocationObject
                setLocation({
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                });
            } catch (err) {
                console.error('Error getting location:', err);
                setError('Failed to get location');
                // Don't block app if location fails
            } finally {
                setLoading(false);
            }
        };

        getLocation();
    }, []);

    return { location, loading, error };
}