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
import { useViewabilityTracking } from '@/hooks/useViewabilityTracking';
import { RestaurantCard } from '@/components/RestaurantCard';
import { OrderLinksModal } from '@/components/OrderLinksModal';
import { useLocation } from '@/hooks/useLocation';
import { useSearch } from '@/hooks/useSearch';
import { TopOverlay } from '@/components/TopOverlay';
// import AnalyticsService from '@/lib/analytics';

const { height: H } = Dimensions.get('screen');

export default function FeedScreen() {
  const [orderLinks, setOrderLinks] = useState<Record<string, string> | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const { location, loading: locationLoading } = useLocation();
  const { restaurants: allRestaurants, menuItems, loading } = useRestaurantData();
  const { searchQuery, setSearchQuery, searchResults, isSearching } = useSearch(allRestaurants);

  // Use search results when searching, otherwise use all restaurants 
  const restaurants = isSearching? searchResults: allRestaurants;
  const {
       vIndex,
       visibleHIndex,
       onViewableChange,
       updateHorizontalIndex,
     } = useViewabilityTracking();

  React.useEffect(() => {
    setIsDescriptionExpanded(false);
 }, [vIndex]);

  React.useEffect(() => {
    // AnalyticsService.logScreenView('Feed', 'MainScreen');
  }, []);

  const renderRestaurant = ({ item, index }: { item: any; index: number }) => {
    const menu = menuItems[item.id] || [];
    const isCurrent = index === vIndex; 
    const isPreloaded = Math.abs(index - vIndex) === 1;

    if (!isCurrent && !isPreloaded) {
      return <View style={{ width: '100%', height: H }} />;
    }

    return (
      <RestaurantCard
        restaurant={item}
        menuItems={menu}
        rowMode={isCurrent ? 'play' : 'warm'}
        isVisible={true}
        onHorizontalScroll={(idx) => updateHorizontalIndex(item.id, idx)}
        onOrderPress={setOrderLinks}
        distance={item.distance}
        isDescriptionExpanded={isDescriptionExpanded}
        setIsDescriptionExpanded={setIsDescriptionExpanded}
      />
    );
  };

  const getItemLayout = (data: any, index: number) => ({
    length: H, 
    offset: H * index, 
    index, 
  });

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
      {/* TopOverlay at page level */}
      <TopOverlay
        restaurantName={restaurants[vIndex]?.name || ''}
        distance={restaurants[vIndex]?.distance}
        currentIndex={visibleHIndex}
        totalItems={menuItems[restaurants[vIndex]?.id]?.length ?? 0}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />

{isSearching && restaurants.length === 0 ? (
        <View style={[styles.container, styles.center, styles.noResultsContainer]}>
          <Text style={styles.noResultsText}>No restaurants found</Text>
          <Text style={styles.noResultsSubtext}>
            Try adjusting your search terms
          </Text>
        </View>
      ) : !isSearching && restaurants.length === 0 ? (
        <View style={[styles.container, styles.center]}>
          <Text style={styles.noResultsText}>No restaurants available</Text>
          <Text style={styles.noResultsSubtext}>
            Check back later for new restaurants
          </Text>
        </View>
      ) : (
        <FlatList
          data={restaurants}
          pagingEnabled
          bounces={false}
          snapToInterval={H}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          keyExtractor={(r) => r.id.toString()}
          renderItem={renderRestaurant}
          onViewableItemsChanged={onViewableChange}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 80 }}
          getItemLayout={getItemLayout}
          snapToOffsets={restaurants.map((_, index) => index * H)}
          disableIntervalMomentum={true}
          scrollEventThrottle={16}
          maxToRenderPerBatch={7}
          windowSize={7}
          initialNumToRender={3}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={false}
        />
      )}

      {!location && (
            <View style={styles.locationBanner}>
              <Text style={styles.locationBannerText}>
                Enable location for nearby restaurants
              </Text>
            </View>
          )}

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
  noResultsContainer: {
    paddingTop: 0, 
  },
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
  noResultsText: {
    color: '#fff',
    fontSize: 18, 
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8, 
  },
  noResultsSubtext: {
    color: '#999',
    fontSize: 14, 
    textAlign: 'center'
  },
});
