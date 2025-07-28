import React, { useEffect, useState, useCallback } from 'react';
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
    Dimensions
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome} from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import MapView, { Marker } from 'react-native-maps';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '@/lib/supabase';
import { ClickTrackingService } from '@/lib/clickTracking';
import { StylesOrDefault } from 'react-native-reanimated';

const { width: SCREEN_W } = Dimensions.get('screen');

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
                    .eq('id', id)
                    .single();

                if (error) throw error; 
                setRestaurant(data);
            } catch (error) {
                console.error('Error fetching restaurant data:', error);
                Alert.alert('Error', 'Failed to laod restaurant details');
            } finally {
                setLoading(false);
            }
        };
        fetchRestaurantData();
    }, [id]);

    const handleOpenLink = useCallback(
        async (platform: string, url: string) => {
            try {
                Haptics.selectionAsync();
                ClickTrackingService.trackOrderLinkClick({
                    restaurant_id: restaurant?.id, 
                    platform, 
                    url
                });
                await WebBrowser.openBrowserAsync(url, {
                    dismissButtonStyle: 'close',
                    controlsColor: Colors.light.primary, 
                    enableBarCollapsing: true, 
                    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET, 
                });
            } catch {
                Alert.alert('Unable to open link', 'We couldn\'t open this link right now.');
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
        WebBrowser.openBrowserAsync(url, { dismissButtonStyle: 'close'});
    }, [restaurant]);

    const handleCall = useCallback(() => {
        if (!restaurant?.phone) return; 
        Haptics.selectionAsync();
        Linking.openURL(`tel:${restaurant.phone}`);
    }, [restaurant?.phone]);

    if (!restaurant) {
        return (
            <LinearGradient 
                colors={['#FF512F', '#F09819', '#FFB347']}
                start={{ x: 0, y: 0}}
                end={{ x: 1, y: 1}}
                style={styles.container}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={[styles.container, styles.center]}>
                        <Text style={styles.errorText}>Restaurant not found</Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView 
                style={styles.scroll}
                contentContainerStyle={[styles.content, { paddingBottom: 16 + insets.bottom }]}
                bounces={false}
                showsVerticalScrollIndicator={false}
            >
                {/* Cover image */}
                {restaurant.image_url && (
                    <Image 
                        source={{ uri: restaurant.image_url }}
                        style={styles.cover}
                        resizeMode="cover"
                    />
                )}

                {/* Title block */}
                <View style={styles.titleBlock}>
                    <Text style={styles.title}>{restaurant.name}</Text>
                    {restaurant.address && (
                        <Text style={styles.subtitle} numberOfLines={2}>
                            {restaurant.address}
                        </Text>
                    )}
                    {restaurant.description && (
                        <Text style={styles.description} numberOfLines={3}>
                            {restaurant.description}
                        </Text>
                    )}
                </View>

                {/* Order from section */}
                <SectionHeader text="Get delivery from" />
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

                {/* Share section */}
                <SectionHeader text="Share" />
                <View style={styles.shareRow}>
                    <BigAction icon="clipboard" label="Copy link" onPress={handleCopy} />
                    <BigAction icon="share-alt" label="Share" onPress={handleShare} />
                </View>

                {/* Location section */}
                {restaurant.latitude && restaurant.longitude && (
                    <>
                        <SectionHeader text="Location" />
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
                                <Marker coordinate={{
                                    latitude: restaurant.latitude, 
                                    longitude: restaurant.longitude
                                }} />
                            </MapView>

                            <View style={styles.actionsRow}>
                                <Pill onPress={handleDirections} icon="map-signs" label="Directions" />
                                {restaurant.phone && (
                                    <Pill onPress={handleCall} icon="phone" label="Call" />
                                )}
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Header overlay */}
            <LinearGradient 
                colors={['rgba(0,0,0,0.8)', 'transparent']}
                style={[styles.headerOverlay, { paddingTop: insets.top}]}
                pointerEvents="box-none"
            >
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {restaurant.name}
                    </Text>
                </View>
            </LinearGradient>
        </View>
    );
}

// UI Components 
const SectionHeader: React.FC<{text: string}> = ({ text }) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{text}</Text>
    </View>
);

const Tile: React.FC<{ icon: any; label: string; onPress: () => void }> = ({
    icon, label, onPress 
}) => (
    <Pressable 
        onPress={onPress}
        style={({ pressed }) => [styles.tileInner, pressed && styles.pressed]}
    >
        <FontAwesome name={icon} size={18} color="#fff" />
        <Text style={styles.tileText}>{label}</Text>
    </Pressable>
);

const BigAction: React.FC<{ icon: any; label: string; onPress: () => void}> = ({
    icon, label, onPress
}) => (
    <Pressable 
        onPress={onPress}
        style={({ pressed }) => [styles.bigAction, pressed && styles.pressed]}
    >
        <FontAwesome name={icon} size={18} color="#fff" />
        <Text style={styles.bigActionText}>{label}</Text>
    </Pressable>
);

const Pill: React.FC<{ onPress: () => void; icon: any; label: string}> = ({
    onPress, icon, label, 
}) => (
    <Pressable 
        onPress={onPress}
        style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
    >
        <FontAwesome name={icon} size={16} color="#fff" />
        <Text style={styles.pillText}>{label}</Text>
    </Pressable>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#141414'}, 
    safeArea: { flex: 1},
    center: { justifyContent: 'center', alignItems: 'center'},

    // Header overlay 
    headerOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, 
        paddingBottom: 20, 
        zIndex: 10, 
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20, 
        paddingVertical: 16, 
        justifyContent: 'space-between'
    },
    backButton: { padding: 8 },
    headerTitle: {
        fontSize: 18, 
        fontWeight: '700',
        color: '#fff',
        flex: 1, 
        textAlign: 'center',
        marginHorizontal: 16, 
    },
    placeholder: { width: 40 },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 16, paddingTop: 100 },
    cover: {
        width: '100%',
        height: 200, 
        borderRadius: 12, 
        marginBottom: 16, 
    },
    titleBlock: { marginBottom: 8 },
    title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#c8c8c8', marginBottom: 8},
    description: { fontSize: 16, color: '#e8e8e8', lineHeight: 22},

    sectionHeader: { marginTop: 24, marginBottom: 12 },
    sectionHeaderText: {
        color: '#9c9c9c',
        fontWeight: '700',
        fontSize: 13, 
        letterSpacing: 0.5, 
        textTransform: 'uppercase'
    },

    linkGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
        marginBottom: 6, 
    },
    tileInner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#202020',
        borderRadius: 12, 
        paddingVertical: 16, 
        paddingHorizontal: 16, 
        borderWidth: StyleSheet.hairlineWidth, 
        borderColor: '#2c2c2c',
    },
    tileText: { color: '#fff', fontWeight: '600', marginLeft: 10, flexShrink: 1 },

    shareRow: {
        flexDirection: 'row',
        marginBottom: 4, 
        gap: 12, 
    },
    bigAction: {
        flex: 1, 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16, 
        borderRadius: 12, 
        backgroundColor: '#202020',
        borderWidth: StyleSheet.hairlineWidth, 
        borderColor: '#2c2c2c',
    },
    bigActionText: { color: '#fff', fontWeight: '700', marginLeft: 10 },

    mapWrap: {
        borderRadius: 12, 
        overflow: 'hidden',
        marginBottom: 14, 
        backgroundColor: '#1f1f1f',
        borderWidth: StyleSheet.hairlineWidth, 
        borderColor: '#2a2a2a', 
    },
    map: { height: 160, width: '100%' },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16, 
        paddingVertical: 12, 
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12, 
        paddingHorizontal: 16, 
        borderRadius: 999, 
        backgroundColor: Colors?.light?.primary ?? '#ff7a00',
    },
    pillText: { fontWeight: '700', color: '#fff', marginLeft: 8},
    emptyLinks: { paddingVertical: 20, alignItems: 'center' },
    emptyTitle: { color: '#fff', fontWeight: '700', marginBottom: 6, fontSize: 16 },
    emptySub: { color: '#bdbdbd', fontSize: 14 },

    // Error state 
    errorText: { color: '#fff', fontSize: 18, fontWeight: '600'}, 

    pressed: { opacity: 0.85 },
})