import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/contexts/StoreContext';
import { STORE_CONFIG } from '@/constants/api';

const { width: SCREEN_W } = Dimensions.get('screen');

const UI = {
  bg: '#F7F7FB',
  surface: '#FFFFFF',
  border: '#E7E9EE',
  text: '#0B1020',
  subtext: '#6E7385',
  accent: Colors?.light?.primary ?? '#5B8CFF',
  radius: 14,
};

type Restaurant = {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  address?: string;
};

export default function MenuScreen() {
  const { id, storeId } = useLocalSearchParams<{ id: string; storeId?: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const { selectStore, loading: storeLoading, error: storeError } = useStore();

  useEffect(() => {
    const fetchRestaurantAndStoreData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Fetch restaurant details from Supabase
        const { data, error } = await supabase
          .from('restaurants')
          .select('id, name, description, image_url, address')
          .eq('id', id.toString())
          .single();

        if (error) throw error;
        setRestaurant(data);

        // Fetch store settings from your backend
        if (data?.id) {
          const effectiveStoreId = storeId || data.store_id || STORE_CONFIG.TEST_STORE_ID;
          await selectStore(effectiveStoreId);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load restaurant details.');
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurantAndStoreData();
  }, [id, selectStore]);

  useEffect(() => {
    if (storeError) {
      Alert.alert('Error loading store', storeError);
    }
  }, [storeError]);

  const headerTitle = useMemo(() => restaurant?.name ?? '', [restaurant?.name]);

  if (loading || storeLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={UI.accent} />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>Restaurant not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        {/* Header with Close Button */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close-circle" size={32} color={UI.subtext} />
          </TouchableOpacity>
        </View>

        {/* Restaurant Info */}
        <View style={styles.infoSection}>
          <Text style={styles.title}>{headerTitle}</Text>
          {restaurant.address && (
            <Text style={styles.subtitle}>{restaurant.address}</Text>
          )}
        </View>

        {/* Menu Placeholder */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Menu</Text>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Menu items will be listed here.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.bg,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: 'flex-end',
  },
  closeButton: {
    marginTop: 10,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: UI.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: UI.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: UI.subtext,
  },
  menuSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: UI.text,
    marginBottom: 16,
  },
  placeholder: {
    padding: 40,
    backgroundColor: UI.surface,
    borderRadius: UI.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: UI.muted,
  },
});
