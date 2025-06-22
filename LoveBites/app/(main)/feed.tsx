import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ViewToken,
  View,
} from 'react-native';
import Colors from '@/constants/Colors';
import { Text } from '@/components/Themed';
import {
  createVideoPlayer,
  useVideoPlayer,
  VideoView,
  type VideoPlayer,
  type VideoSource,
} from 'expo-video';
import { useEvent } from 'expo';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Database } from '@/lib/supabase.d';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type MenuItem   = Database['public']['Tables']['menu_items']['Row'] & { id: string };

const { height: H, width: W } = Dimensions.get('window');

export default function FeedScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuItems,   setMenuItems]   = useState<Record<string, MenuItem[]>>({});
  const [hIndex,      setHIndex]      = useState<Record<string, number>>({});
  const [vIndex,      setVIndex]      = useState(0);
  const [loading,     setLoading]     = useState(true);
  const { signOut } = useAuthStore();

  /* hidden players used only to warm the disk/network cache */
  const preloadPlayers = useRef<Record<string, VideoPlayer>>({}).current;

  /* fetch data ---------------------------------------------------- */
  useEffect(() => {
    (async () => {
      const { data: rs } = await supabase.from('restaurants').select('*')
                                         .order('created_at', { ascending: false });
      const { data: ms } = await supabase.from('menu_items').select('*');

      const grouped: Record<string, MenuItem[]> = {};
      ms?.forEach(mi => { (grouped[mi.restaurant_id] ??= []).push(mi as MenuItem); });

      setRestaurants(rs ?? []);
      setMenuItems(grouped);
      setLoading(false);
    })().catch(err => {
      console.error(err);
      Alert.alert('Error', 'Failed to load restaurants');
      setLoading(false);
    });
  }, []);

  /* preload the next row ----------------------------------------- */
  useEffect(() => {
    const nextRow = restaurants[vIndex + 1];
    if (!nextRow) return;
    const nextItem = menuItems[nextRow.id]?.[0];
    if (!nextItem || preloadPlayers[nextItem.id]) return;

    const src: VideoSource = {
      uri: nextItem.video_url,
      useCaching: true,
      bufferOptions: {
        minBufferForPlayback: 0.5,
        preferredForwardBufferDuration: 20,
        waitsToMinimizeStalling: true,
      },
    };
    preloadPlayers[nextItem.id] = createVideoPlayer(src); // starts buffering
  }, [vIndex, restaurants, menuItems]);

  /* vertical viewability ----------------------------------------- */
  const onViewableChange = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length) setVIndex(viewableItems[0].index ?? 0);
    }
  ).current;

  /* --------------- video card ----------------------------------- */
  const MenuItemVideo = ({
    uri,
    itemId,
    isVisible,
  }: {
    uri: string;
    itemId: string;
    isVisible: boolean;
  }) => {
    const source: VideoSource = {
      uri,
      useCaching: true,
    };

    const player = useVideoPlayer(
        { uri: uri as string, useCaching: true },
        p => {
        p.loop  = true;
        p.muted = true;
        p.bufferOptions = {
        minBufferForPlayback: 0.5,
        preferredForwardBufferDuration: 20,
        waitsToMinimizeStalling: true,
        };
        },
        );

    /* play / pause when visible */
    useEffect(() => {
      if (isVisible) {
        player.currentTime = 0;
        player.play();
      } else {
        player.pause();
      }
    }, [isVisible]);

    /* dev logging */
    const { status, error } = useEvent(player, 'statusChange', {
      status: player.status,
      error: undefined,
    });
    useEffect(() => {
      if (__DEV__) console.log('[expo-video]', status, error?.message);
    }, [status, error]);

    return (
      <VideoView
        key={uri}
        player={player}
        style={styles.video}
        contentFit="cover"
        allowsFullscreen
        allowsPictureInPicture
        useExoShutter={false}
        surfaceType="textureView"
      />
    );
  };

  /* render each restaurant row ----------------------------------- */
  const renderRestaurant = ({ item, index }: { item: Restaurant; index: number }) => {
    const menu     = menuItems[item.id] || [];
    const hCur     = hIndex[item.id] ?? 0;
    const vVisible = index === vIndex;

    return (
      <View style={styles.restaurantCard}>
        <FlatList
          data={menu}
          horizontal
          pagingEnabled
          keyExtractor={mi => mi.id.toString()}
          onMomentumScrollEnd={e => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / W);
            setHIndex(prev => ({ ...prev, [item.id]: idx }));
          }}
          renderItem={({ item: mi, index: hPos }) =>
            mi.video_url ? (
              <View style={{ width: W, height: H }}>
                <MenuItemVideo
                  uri={mi.video_url}
                  itemId={mi.id}
                  isVisible={vVisible && hPos === hCur}
                />
              </View>
            ) : (
              <View style={styles.videoPlaceholder}>
                <Text style={styles.placeholderText}>No video available</Text>
              </View>
            )
          }
          style={{ width: W, height: H }}
        />

        {/* overlay */}
        <View style={styles.overlay} pointerEvents="box-none">
          <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <View style={styles.restaurantInfo} pointerEvents="auto">
            <Text style={styles.restaurantName}>{item.name}</Text>
            <Text style={styles.restaurantDescription}>{item.description}</Text>

            {!!menu[hCur] && (
              <View style={styles.menuItemInfo}>
                <Text style={styles.menuItemName}>{menu[hCur].name}</Text>
                <Text style={styles.menuItemDescription}>{menu[hCur].description}</Text>
                <Text style={styles.menuItemPrice}>£{menu[hCur].price.toFixed(2)}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.orderButton}
              onPress={() =>
                Alert.alert(`Order from ${item.name}`, 'Deep-link coming soon')
              }>
              <Text style={styles.orderButtonText}>Order Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  /* spinner while loading ---------------------------------------- */
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  /* main render --------------------------------------------------- */
  return (
    <View style={styles.container}>
      <FlatList
        data={restaurants}
        pagingEnabled
        snapToInterval={H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        keyExtractor={r => r.id.toString()}
        renderItem={renderRestaurant}
        onViewableItemsChanged={onViewableChange}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 80 }}
      />
    </View>
  );
}

/* ------------------------------ styles -------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center:    { justifyContent: 'center', alignItems: 'center' },

  restaurantCard: { width: W, height: H },

  video: { width: W, height: H },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'transparent',
  },

  signOutButton: {
    padding: 8,
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
  },
  signOutText: { color: '#fff', fontSize: 16 },

  restaurantInfo: { zIndex: 1, backgroundColor: 'transparent' },
  restaurantName: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  restaurantDescription: { fontSize: 16, color: '#ccc', marginBottom: 20 },

  orderButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'flex-start',
  },
  orderButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },

  menuItemInfo: { marginBottom: 16, padding: 12, backgroundColor: 'transparent', borderRadius: 8 },
  menuItemName: { fontSize: 20, fontWeight: '600', color: '#fff', marginBottom: 4 },
  menuItemDescription: { fontSize: 14, color: '#ccc', marginBottom: 4 },
  menuItemPrice: { fontSize: 18, fontWeight: 'bold', color: Colors.light.primary },

  videoPlaceholder: {
    width: W,
    height: H,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  placeholderText: { color: '#999', fontSize: 18 },
});
