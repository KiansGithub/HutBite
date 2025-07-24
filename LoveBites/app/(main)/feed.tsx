import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
  View,
  Image
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
import AnalyticsService from '@/lib/analytics';

const { height: H } = Dimensions.get('screen');

export default function FeedScreen() {
  const [modalData, setModalData] = useState<{
    orderLinks: Record<string, string> | null; 
    restaurantId: string; 
    menuItemId: string; 
  } | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [carouselResetTrigger, setCarouselResetTrigger] = useState(0);

  const { location, loading: locationLoading } = useLocation();
  const { restaurants: allRestaurants, menuItems, loading, reshuffleRestaurants } = useRestaurantData();
  const { searchQuery, setSearchQuery, searchResults, isSearching } = useSearch(allRestaurants);

  // Track previous search state to detect when search is cleared
  const prevIsSearching = useRef(isSearching);
  // Track previous restaurant to only reset carousel when restaurant changes 
  const prevRestaurantId = useRef<string | null>(null);

  // Use search results when searching, otherwise use all restaurants 
  const restaurants = isSearching? searchResults: allRestaurants;

  // Ref to control scrolling when search results change 
  const listRef = useRef<FlatList<any>>(null);
  const {
       vIndex,
       visibleHIndex,
       onViewableChange,
       updateHorizontalIndex,
       resetIndexes,
     } = useViewabilityTracking();

     /* one stable object – create it once with useRef */
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 5,        // 5 % for percent fields
  }).current;

  React.useEffect(() => {
    // Detect when search is cleared (was searching, now not searching)
    if (prevIsSearching.current && !isSearching) {
      reshuffleRestaurants();
    }
    prevIsSearching.current = isSearching;
  }, [isSearching, reshuffleRestaurants]);

  React.useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    resetIndexes();
  }, [searchResults]);

  React.useEffect(() => {
    setIsDescriptionExpanded(false);
 }, [vIndex]);

  React.useEffect(() => {
    AnalyticsService.logScreenView('Feed', 'MainScreen');
  }, []);

  const handleOrderPress = (
    orderLinks: Record<string, string> | null, 
    restaurantId: string, 
    menuItemId: string
  ) => {
    setModalData({ orderLinks, restaurantId, menuItemId });
  };

  const renderRestaurant = useCallback(
    ({ item, index }: { item: any; index: number }) => {
    const menu = menuItems[item.id] || [];
    const isCurrent = index === vIndex; 
    const isPreloaded = Math.abs(index - vIndex) <= 2;

    if (!isCurrent && !isPreloaded) {
      return <View style={{ width: '100%', height: H }} />;
    }

    return (
      <RestaurantCard
        restaurant={item}
        menuItems={menu}
        rowMode={isCurrent ? 'play' 
                 : isPreloaded ? 'warm'
                 : 'off'
                }
        isVisible={isCurrent}
        onHorizontalScroll={(idx) => updateHorizontalIndex(item.id, idx)}
        onOrderPress={handleOrderPress}
        distance={item.distance}
        isDescriptionExpanded={isCurrent ? isDescriptionExpanded : false}
        setIsDescriptionExpanded={setIsDescriptionExpanded}
        resetTrigger={carouselResetTrigger}
      />
    );
  },
  [menuItems, vIndex, carouselResetTrigger, updateHorizontalIndex, handleOrderPress]);

  const getItemLayout = useCallback(
    (data: any, index: number) => ({
    length: H, 
    offset: H * index, 
    index, 
  }),
  []
);

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
        onCategoryPress={(category) => setSearchQuery(category)}
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
          ref={listRef}
          data={restaurants}
          bounces={false}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          keyExtractor={(r) => r.id.toString()}
          renderItem={renderRestaurant}
          onViewableItemsChanged={onViewableChange}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={getItemLayout}
          snapToOffsets={restaurants.map((_, index) => index * H)}
          disableIntervalMomentum={true}
          scrollEventThrottle={16}
          maxToRenderPerBatch={3}
          windowSize={3}
          initialNumToRender={1}
          updateCellsBatchingPeriod={100}
          removeClippedSubviews={true}
        />
      )}

      {!location && (
            <View style={styles.locationBanner}>
              <Text style={styles.locationBannerText}>
                Enable location for nearby restaurants
              </Text>
            </View>
          )}

      {modalData && (
        <OrderLinksModal 
          orderLinks={modalData.orderLinks}
          restaurantId={modalData.restaurantId}
          menuItemId={modalData.menuItemId}
          onClose={() => setModalData(null)}
        />
      )}
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
