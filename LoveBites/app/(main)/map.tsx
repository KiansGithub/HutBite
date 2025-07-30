import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
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

  /* ---------- helpers ---------- */

  const offsetDuplicateCoordinates = (list: RestaurantWithDistance[]) => {
    const seen = new Map<string, number>();
    return list.map(r => {
      const key = `${r.latitude},${r.longitude}`;
      const count = seen.get(key) ?? 0;
      seen.set(key, count + 1);
      if (count === 0) return r;

      // offset ~10 m per duplicate
      const bump = count * 0.0001;
      return { ...r, latitude: r.latitude + bump, longitude: r.longitude + bump };
    });
  };

  /* ---------- data ---------- */

  const validRestaurants = useMemo(() => {
    const filtered = restaurants.filter(r =>
      r.latitude != null &&
      r.longitude != null &&
      isFinite(+r.latitude) &&
      isFinite(+r.longitude)
    );
    return offsetDuplicateCoordinates(filtered);
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
    if (validRestaurants.length) {
      const f = validRestaurants[0];
      return {
        latitude: +f.latitude!,
        longitude: +f.longitude!,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }
    return {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  }, [location, validRestaurants]);

  const navigateToRestaurant = (id: string) =>
    router.push(`/(main)/restaurant/${id}`);

  if (loading || !restaurants.length) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  /* ---------- render ---------- */

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={!!location}
        showsMyLocationButton={!!location}
      >
        {validRestaurants.map(r => {
          const lat = +r.latitude!;
          const lng = +r.longitude!;

          return (
            <Marker
              key={r.id}
              coordinate={{ latitude: lat, longitude: lng }}
              calloutAnchor={{ x: 0.5, y: 0 }}      // bubble sits just above the pin
              onCalloutPress={() => navigateToRestaurant(r.id)} // ← works on both OSes
              tracksViewChanges={false}
              accessibilityLabel={`${r.name}, ${r.distance?.toFixed(1) ?? ''} miles`}
            >
              <Callout tooltip>
                <View style={styles.bubble}>
                  <Text style={styles.name}>{r.name}</Text>
                  {r.distance && (
                    <Text style={styles.distance}>
                      {r.distance.toFixed(1)} mi away
                    </Text>
                  )}
                  <Text style={styles.hint}>Tap to view menu</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  bubble: {
    minWidth: 200,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    elevation: 2,                           // subtle shadow (Android)
  },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  distance: { fontSize: 14, color: '#666', marginBottom: 4 },
  hint: { fontSize: 12, color: '#FF7A00', fontStyle: 'italic' },
});
