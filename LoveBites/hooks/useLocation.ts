import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export const useLocation = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const timerId = setTimeout(() => {
      if (isMounted) {
        setError('Location timeout');
        setLoading(false);
      }
    }, 10_000);

    (async () => {
      try {
        // 1. Permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED) {
          throw new Error('Location permission denied');
        }

        // 2. Services enabled? (Android)
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          throw new Error('Location services disabled');
        }

        // 3. Instant fallback
        const lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown && isMounted) {
          setLocation({
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          });
        }

        // 4. Fresh, accurate fix
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (isMounted) {
          setLocation({
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
          });
        }
      } catch (err: any) {
        if (isMounted) setError(err.message ?? 'Failed to get location');
      } finally {
        if (isMounted) setLoading(false);
        clearTimeout(timerId);
      }
    })();

    return () => {
      isMounted = false;
      clearTimeout(timerId);
    };
  }, []);

  return { location, loading, error };
};