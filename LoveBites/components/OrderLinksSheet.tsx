// OrderLinksSheet.tsx (no external bottom-sheet lib)
// Animated RN Modal drawer with cover image + sectioned layout.
import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Share,
  Platform,
  Alert,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  Easing,
  Linking,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';
import MapView, { Marker } from 'react-native-maps';
import { ClickTrackingService } from '@/lib/clickTracking';

type Coords = { lat: number; lng: number; address?: string; distanceMeters?: number };

interface Props {
  orderLinks: Record<string, string> | null;
  restaurantId?: string;
  restaurantName?: string;
  coords?: Coords;
  phone?: string | null;
  /** Optional hero image */
  coverImageUrl?: string | null;
  onClose: () => void;
}

const { height: SCREEN_H } = Dimensions.get('screen');
// A bit less tall than before
const SHEET_HEIGHT = Math.round(SCREEN_H * 0.86);
const DISMISS_THRESHOLD = 120;

export const OrderLinksSheet: React.FC<Props> = ({
  orderLinks,
  restaurantId,
  restaurantName,
  coords,
  phone,
  coverImageUrl,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  // animate backdrop and sheet translate
  const backdrop = useRef(new Animated.Value(0)).current; // 0..1
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // Local pill button used for "Directions" / "Call"
const Pill: React.FC<{ onPress: () => void; icon: any; label: string }> = ({
  onPress, icon, label,
}) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>
    <FontAwesome name={icon} size={16} color="#fff" />
    <Text style={styles.pillText}>{label}</Text>
  </Pressable>
);

  // mount → animate in
  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 16,
        stiffness: 160,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdrop, translateY]);

  const close = useCallback(() => {
    Haptics.selectionAsync();
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onClose();
    });
  }, [backdrop, translateY, onClose]);

  // drag to dismiss
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_evt, { dy }) => Math.abs(dy) > 2,
        onPanResponderMove: (_evt, { dy }) => {
          if (dy > 0) {
            translateY.setValue(Math.min(dy, SHEET_HEIGHT));
            backdrop.setValue(Math.max(0, 1 - dy / SHEET_HEIGHT));
          }
        },
        onPanResponderRelease: (_evt, { dy, vy }) => {
          if (dy > DismissTarget(dy, vy)) {
            close();
          } else {
            Animated.parallel([
              Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
              Animated.timing(backdrop, { toValue: 1, duration: 120, useNativeDriver: true }),
            ]).start();
          }
        },
      }),
    [translateY, backdrop, close]
  );

  const handleOpenLink = useCallback(
    async (platform: string, url: string) => {
      try {
        Haptics.selectionAsync();
        ClickTrackingService.trackOrderLinkClick({ restaurant_id: restaurantId, platform, url });
        await WebBrowser.openBrowserAsync(url, {
          dismissButtonStyle: 'close',
          controlsColor: Colors.light.primary,
          enableBarCollapsing: true,
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        });
      } catch {
        Alert.alert('Unable to open link', 'We couldn’t open this link right now.');
      }
    },
    [restaurantId]
  );

  const primaryUrl = orderLinks ? Object.values(orderLinks)[0] : undefined;

  const handleCopy = useCallback(async (url?: string) => {
    if (!url) return;
    await Clipboard.setStringAsync(url);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleShare = useCallback(async (url?: string) => {
    try {
      await Share.share({
        message:
          (restaurantName ? `${restaurantName}\n` : '') +
          (url ? url : ''),
      });
    } catch {}
  }, [restaurantName]);

  const handleDirections = useCallback(() => {
    if (!coords) return;
    const q = coords.address ? encodeURIComponent(coords.address) : `${coords.lat},${coords.lng}`;
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${q}`,
      android: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
    })!;
    Haptics.selectionAsync();
    WebBrowser.openBrowserAsync(url, { dismissButtonStyle: 'close' });
  }, [coords]);

  const handleCall = useCallback(() => {
    if (!phone) return;
    Haptics.selectionAsync();
    Linking.openURL(`tel:${phone}`);
  }, [phone]);

  // Backdrop style
  const backdropStyle = {
    opacity: backdrop.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] }),
  };

  // Sheet style
  const sheetStyle = { transform: [{ translateY }] };

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { height: SHEET_HEIGHT }, sheetStyle]} {...panResponder.panHandlers}>
        <View style={styles.handle} />

        {/* Scrollable content */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 16 + insets.bottom }]}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Cover image (optional) */}
          {coverImageUrl ? (
            <Image source={{ uri: coverImageUrl }} style={styles.cover} resizeMode="cover" />
          ) : null}

          {/* Title */}
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{restaurantName ?? 'Restaurant'}</Text>
            {!!coords?.address && <Text style={styles.subtitle} numberOfLines={2}>{coords.address}</Text>}
          </View>

          {/* Section: Get delivery from */}
          <SectionHeader text="Get delivery from" />
          {orderLinks && Object.keys(orderLinks).length > 0 ? (
            <View style={styles.linksGrid}>
              {Object.entries(orderLinks).map(([platform, url], i) => (
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

          {/* Section: Share */}
          <SectionHeader text="Share" />
          <View style={styles.shareRow}>
            <BigAction icon="clipboard" label="Copy link" onPress={() => handleCopy(primaryUrl)} />
            <BigAction icon="share-alt" label="Share" onPress={() => handleShare(primaryUrl)} />
          </View>

          {/* Section: Location */}
          {coords && (
            <>
              <SectionHeader text="Location" />
              <View style={styles.mapWrap}>
                <MapView
                  style={styles.map}
                  pointerEvents="none"
                  initialRegion={{
                    latitude: coords.lat,
                    longitude: coords.lng,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                >
                  <Marker coordinate={{ latitude: coords.lat, longitude: coords.lng }} />
                </MapView>

                <View style={styles.actionsRow}>
                  <Pill onPress={handleDirections} icon="map-signs" label="Directions" />
                  {!!phone && <Pill onPress={handleCall} icon="phone" label="Call" />}
                </View>
              </View>
            </>
          )}

          {/* Primary "Done" */}
          <Pressable onPress={close} style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
            <Text style={styles.primaryBtnText}>Done</Text>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

// ===== UI bits =====
const SectionHeader: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{text}</Text>
  </View>
);

const Tile: React.FC<{ icon: any; label: string; onPress: () => void }> = ({ icon, label, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
    <FontAwesome name={icon} size={18} color="#fff" />
    <Text style={styles.tileText}>{label}</Text>
  </Pressable>
);

const BigAction: React.FC<{ icon: any; label: string; onPress: () => void }> = ({ icon, label, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.bigAction, pressed && styles.pressed]}>
    <FontAwesome name={icon} size={18} color="#fff" />
    <Text style={styles.bigActionText}>{label}</Text>
  </Pressable>
);

// Helper for dismiss threshold
function DismissTarget(dy: number, vy: number) {
  if (vy > 1.2) return 40;
  if (vy > 0.8) return 80;
  return DISMISS_THRESHOLD;
}

// ===== Styles =====
const styles = StyleSheet.create({
  // Backdrop
  backdrop: { backgroundColor: '#000' },

  // Sheet
  sheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#141414',
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 44, height: 5, borderRadius: 3,
    backgroundColor: '#5b5b5b',
    marginTop: 10, marginBottom: 8,
  },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 16 },

  // Cover image
  cover: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },

  // Title block
  titleBlock: { marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },
  subtitle: { marginTop: 2, fontSize: 12, color: '#c8c8c8' },

  // Section header
  sectionHeader: { marginTop: 14, marginBottom: 8 },
  sectionHeaderText: { color: '#9c9c9c', fontWeight: '700', fontSize: 12, letterSpacing: 0.5 },

  // Delivery platforms
  linksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6, // gutters
    marginBottom: 6,
  },
  tile: {
    width: '50%',
    marginBottom: 12,
    // inner surface
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202020',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2c2c2c',
  },
  tileText: { color: '#fff', fontWeight: '600', marginLeft: 8, flexShrink: 1 },

  // Share row
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bigAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#202020',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2c2c2c',
    marginRight: 8,
  },
  bigActionText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  // last child removes right margin (manual since no :last-child)
  // You can do this in render if you prefer.

  // Map + actions
  mapWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#1f1f1f',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2a2a2a',
  },
  map: { height: 140, width: '100%' },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  // Pills (Directions / Call)
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: Colors?.light?.primary ?? '#ff7a00',
  },
  pillText: { fontWeight: '700', color: '#fff', marginLeft: 8 },

  // Empty links
  emptyLinks: { paddingVertical: 16, alignItems: 'center' },
  emptyTitle: { color: '#fff', fontWeight: '700', marginBottom: 6, fontSize: 16 },
  emptySub: { color: '#bdbdbd', fontSize: 13 },

  // Primary button
  primaryBtn: {
    marginTop: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors?.light?.primary ?? '#ff7a00',
    marginBottom: 6,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Pressed feedback
  pressed: { opacity: 0.85 },
});
