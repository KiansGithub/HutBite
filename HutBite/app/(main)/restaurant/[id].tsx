// RestaurantScreen (fix: title no longer sits behind back button)
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
  Share,
  Platform,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import MapView, { Marker } from 'react-native-maps';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '@/lib/supabase';
import { ClickTrackingService } from '@/lib/clickTracking';

const { width: SCREEN_W } = Dimensions.get('screen');

const UI = {
  bg: '#F7F7FB',
  surface: '#FFFFFF',
  border: '#E7E9EE',
  text: '#0B1020',
  subtext: '#6E7385',
  muted: '#9CA3AF',
  accent: Colors?.light?.primary ?? '#5B8CFF',
  radius: 14,
  press: { opacity: 0.85 },
};

type Restaurant = {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  order_links?: Record<string, string> | null;
  phone?: string | null;
  address?: string;
  latitude?: number;
  longitude?: number;
};

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', id.toString())
          .single();
        if (error) throw error;
        setRestaurant(data);
      } catch (error) {
        console.error('Error fetching restaurant data:', error);
        Alert.alert('Error', 'Failed to load restaurant details');
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurantData();
  }, [id]);

  const hasImage = !!restaurant?.image_url;
  const headerHeight = 56 + insets.top;
  const headerSideWidth = 96; // reserve space left/right so centered title never overlaps buttons

  const headerTitle = useMemo(() => restaurant?.name ?? '', [restaurant?.name]);

  const handleOpenLink = useCallback(
    async (platform: string, url: string) => {
      try {
        Haptics.selectionAsync();
        ClickTrackingService.trackOrderLinkClick({
          restaurant_id: restaurant?.id,
          platform,
          url,
        });
        await WebBrowser.openBrowserAsync(url, {
          dismissButtonStyle: 'close',
          controlsColor: UI.accent,
          enableBarCollapsing: true,
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        });
      } catch {
        Alert.alert('Unable to open link', "We couldn't open this link right now.");
      }
    },
    [restaurant?.id]
  );

  const handleCopy = useCallback(async () => {
    if (!restaurant?.order_links) return;
    const primaryUrl = Object.values(restaurant.order_links)[0];
    if (primaryUrl) {
      await Clipboard.setStringAsync(primaryUrl);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Copied!', 'Link copied to clipboard');
    }
  }, [restaurant?.order_links]);

  const handleShare = useCallback(async () => {
    try {
      const primaryUrl = restaurant?.order_links ? Object.values(restaurant.order_links)[0] : '';
      await Share.share({
        message: `${restaurant?.name || 'Check out this restaurant'}\n${primaryUrl}`,
      });
    } catch {}
  }, [restaurant]);

  const handleDirections = useCallback(() => {
    if (!restaurant?.latitude || !restaurant?.longitude) return;
    const q = restaurant.address
      ? encodeURIComponent(restaurant.address)
      : `${restaurant.latitude},${restaurant.longitude}`;
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${q}`,
      android: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
    })!;
    Haptics.selectionAsync();
    WebBrowser.openBrowserAsync(url, { dismissButtonStyle: 'close' });
  }, [restaurant]);

  const handleCall = useCallback(() => {
    if (!restaurant?.phone) return;
    Haptics.selectionAsync();
    Linking.openURL(`tel:${restaurant.phone}`);
  }, [restaurant?.phone]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: UI.bg }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.container, styles.center]}>
            <ActivityIndicator size="large" color={UI.accent} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!id || typeof id !== 'string') {
    return (
      <View style={[styles.container, { backgroundColor: UI.bg }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.container, styles.center]}>
            <Text style={styles.errorText}>Invalid restaurant ID</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={[styles.container, { backgroundColor: UI.bg }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.container, styles.center]}>
            <Text style={styles.errorText}>Restaurant not found</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: UI.bg }]}>
      {/* Fixed Header with centered title */}
      <View style={[styles.headerOverlay, { paddingTop: insets.top, height: headerHeight }]}>
        <View style={styles.headerRow}>
          <View style={[styles.headerSide, { width: headerSideWidth }]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.iconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={22} color={UI.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerCenter}>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {headerTitle}
            </Text>
          </View>

          <View style={[styles.headerSide, { width: headerSideWidth, justifyContent: 'flex-end' }]}>
            <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
              <Ionicons name="share-outline" size={22} color={UI.text} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, styles.addButton]}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 16 + insets.bottom },
        ]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Spacer so content doesn't slide under header when no image */}
        {!hasImage && <View style={{ height: headerHeight }} />}

        {/* Cover image */}
        {hasImage && (
          <>
            <Image
              source={{ uri: restaurant.image_url! }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            {/* Pull up the card slightly over the image */}
            <View style={{ height: 0 }} />
          </>
        )}

        {/* Title block (kept for description/address; visual title is in header) */}
        <View
          style={[
            styles.contentCard,
            {
              marginTop: hasImage ? -24 : 0,
              paddingTop: hasImage ? 20 : 12,
            },
          ]}
        >
          {/* Accessible subtitle repeating name for screen readers (hidden visually if wanted) */}
          <Text style={[styles.title, { opacity: 0, height: 0 }]} accessibilityElementsHidden>
            {restaurant.name}
          </Text>

          {restaurant.address && (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color={UI.subtext} />
              <Text style={styles.subtitle}>{restaurant.address}</Text>
            </View>
          )}

          {restaurant.description && (
            <Text style={styles.description}>{restaurant.description}</Text>
          )}
        </View>

        {/* Order from section */}
        <View style={styles.contentCard}>
          <Text style={styles.sectionTitle}>Get delivery from</Text>
          {restaurant.order_links && Object.keys(restaurant.order_links).length > 0 ? (
            <View style={styles.linkGrid}>
              {Object.entries(restaurant.order_links).map(([platform, url], i) => (
                <Tile
                  key={`${platform}-${i}`}
                  icon="link"
                  label={platform}
                  onPress={() => handleOpenLink(platform, url)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyLinks}>
              <Text style={styles.emptyTitle}>No ordering links yet</Text>
              <Text style={styles.emptySub}>You can still call or get directions.</Text>
            </View>
          )}
        </View>

        {/* Location section */}
        {restaurant.latitude && restaurant.longitude && (
          <View style={styles.contentCard}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.mapWrap}>
              <MapView
                style={styles.map}
                pointerEvents="none"
                initialRegion={{
                  latitude: restaurant.latitude,
                  longitude: restaurant.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: restaurant.latitude,
                    longitude: restaurant.longitude,
                  }}
                />
              </MapView>

              <View style={styles.actionsRow}>
                <Pill onPress={handleDirections} icon="map-signs" label="Directions" />
                {restaurant.phone && <Pill onPress={handleCall} icon="phone" label="Call" />}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// UI Components
const Tile: React.FC<{ icon: any; label: string; onPress: () => void }> = ({
  icon,
  label,
  onPress,
}) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.tileInner, pressed && styles.pressed]}>
    <FontAwesome name={icon} size={18} color={UI.accent} />
    <Text style={styles.tileText}>{label}</Text>
  </Pressable>
);

const Pill: React.FC<{ onPress: () => void; icon: any; label: string }> = ({
  onPress,
  icon,
  label,
}) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>
    <FontAwesome name={icon} size={16} color="#fff" />
    <Text style={styles.pillText}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F0F0' },
  safeArea: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },

  // Header
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomColor: '#00000010',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 12,
  },
  headerSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    maxWidth: '100%',
    fontSize: 16,
    fontWeight: '700',
    color: UI.text,
  },
  addButton: {
    backgroundColor: '#FF6347',
  },

  scroll: { flex: 1 },

  heroImage: {
    width: '100%',
    height: SCREEN_W * 0.9,
  },

  content: { paddingBottom: 100 },

  contentCard: {
    backgroundColor: UI.surface,
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingBottom: 40,
  },

  title: { fontSize: 28, fontWeight: '800', color: UI.text, marginBottom: 8 },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  subtitle: {
    fontSize: 16,
    color: UI.subtext,
    marginLeft: 8,
  },

  description: {
    fontSize: 16,
    color: UI.subtext,
    lineHeight: 24,
    marginTop: 8,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: UI.text,
    marginTop: 24,
    marginBottom: 16,
  },

  linkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tileInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7FB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: UI.radius,
    gap: 12,
  },
  tileText: { fontSize: 16, fontWeight: '600', color: UI.text },

  emptyLinks: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#F7F7FB',
    borderRadius: UI.radius,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: UI.text },
  emptySub: { fontSize: 14, color: UI.muted, marginTop: 4 },

  // Map
  mapWrap: {
    height: 200,
    borderRadius: UI.radius,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  actionsRow: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
    gap: 8,
  },
  pillText: {
    color: '#fff',
    fontWeight: '600',
  },

  errorText: { color: UI.text, fontSize: 18, fontWeight: '600' },

  pressed: UI.press,
});
