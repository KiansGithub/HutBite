import React, { useState } from 'react';
import {
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
  View,
} from 'react-native';
import Colors from '@/constants/Colors';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { useVideoManagement } from '@/hooks/useVideoManagement';
import { useViewabilityTracking } from '@/hooks/useViewabilityTracking';
import { RestaurantCard } from '@/components/RestaurantCard';
import { OrderLinksModal } from '@/components/OrderLinksModal';

const { height: H } = Dimensions.get('window');

export default function FeedScreen() {
  const [orderLinks, setOrderLinks] = useState<Record<string, string> | null>(null);

  const { restaurants, menuItems, loading } = useRestaurantData();
  const { hIndex, vIndex, onViewableChange, updateHorizontalIndex } = useViewabilityTracking();

  useVideoManagement(restaurants, menuItems, vIndex);

  const renderRestaurant = ({ item, index }: { item: any; index: number }) => {
    const menu = menuItems[item.id] || [];
    const hCur = hIndex[item.id] ?? 0;
    const vVisible = index === vIndex;

    return (
      <RestaurantCard
        restaurant={item}
        menuItems={menu}
        horizontalIndex={hCur}
        isVisible={vVisible}
        onHorizontalScroll={(idx) => updateHorizontalIndex(item.id, idx)}
        onOrderPress={setOrderLinks}
      />
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

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

      <OrderLinksModal
        orderLinks={orderLinks}
        onClose={() => setOrderLinks(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
});
