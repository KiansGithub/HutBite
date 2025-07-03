import React, { useState } from 'react';
import {
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
  View,
} from 'react-native';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { useVideoManagement } from '@/hooks/useVideoManagement';
import { useViewabilityTracking } from '@/hooks/useViewabilityTracking';
import { RestaurantCard } from '@/components/RestaurantCard';
import { OrderLinksModal } from '@/components/OrderLinksModal';
import { useLocation } from '@/hooks/useLocation';
import { useSearch } from '@/hooks/useSearch';
// import AnalyticsService from '@/lib/analytics';

const { height: H } = Dimensions.get('window');

export default function FeedScreen() {
  const [orderLinks, setOrderLinks] = useState<Record<string, string> | null>(null);

  const { location, loading: locationLoading } = useLocation();
  const { restaurants: allRestaurants, menuItems, loading } = useRestaurantData();
  const { searchQuery, setSearchQuery, searchResults, isSearching } = useSearch(allRestaurants);

  // Use search results when searching, otherwise use all restaurants 
  const restaurants = isSearching? searchResults: allRestaurants;
  const { hIndex, vIndex, onViewableChange, updateHorizontalIndex } = useViewabilityTracking();

  useVideoManagement(restaurants, menuItems, vIndex);

  React.useEffect(() => {
    // AnalyticsService.logScreenView('Feed', 'MainScreen');
  }, []);

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
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        distance={item.distance}
      />
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        {locationLoading && (
          <Text style={styles.locationText}>Getting your location...</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
      {...!location && (
        <View style={styles.locationBanner}>
          <Text style={styles.locationBannerText}>
            Enable location for nearby restaurants
          </Text>
        </View>
      )}
        data={restaurants}
        pagingEnabled
        snapToInterval={H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        keyExtractor={(r) => r.id.toString()}
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
  locationText: {
    color: Colors.light.primary, 
    marginTop: 10, 
    fontSize: 16
  },
  locationBanner: {
    position: 'absolute',
    top: 50, 
    left: 20, 
    right: 20, 
    backgroundColor: 'rgba(255, 122, 0, 0.9)',
    padding: 10,
    borderRadius: 8, 
    zIndex: 1000, 
  },
  locationBannerText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14, 
    fontWeight: '600'
  },
});
