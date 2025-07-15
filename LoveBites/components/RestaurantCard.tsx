import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
} from 'react-native';
import { Database } from '@/lib/supabase.d';
import { LinearGradient } from 'expo-linear-gradient';
import { LikeButton } from './LikeButton';
import { ShareButton } from './ShareButton';
import { FloatingActionRail } from '@/components/FloatingActionRail';
// import AnalyticsService from '@/lib/analytics';
import { VideoCarousel } from './VideoCarousel';
import { MenuItemInfo } from'./MenuItemInfo';
import { OrderButton } from './OrderButton';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'] & { id: string };

const { height: H, width: W } = Dimensions.get('screen');

interface RestaurantCardProps {
  restaurant: Restaurant;
  menuItems: MenuItem[];
  rowMode: string;
  isVisible: boolean;
  onHorizontalScroll: (index: number) => void;
  onOrderPress: (orderLinks: Record<string, string> | null) => void;
  distance?: number; 
  isDescriptionExpanded: boolean; 
  setIsDescriptionExpanded: (expanded: boolean) => void; 
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  menuItems,
  isVisible,
  rowMode,
  onHorizontalScroll,
  onOrderPress,
  distance, 
  isDescriptionExpanded, 
  setIsDescriptionExpanded
}) => {
  const [hIndex, setHIndex] = useState(0);
  const currentMenuItem = menuItems[hIndex];

  const handleIndexChange = (index: number) => {
    setHIndex(index);
  };

  if (!currentMenuItem) {
    return <View style={styles.container} />;
  }

  

  return (
    <View style={styles.container}>
      <VideoCarousel 
        menuItems={menuItems}
        rowMode={rowMode}
        onHorizontalScroll={onHorizontalScroll}
        currentIndex={hIndex}
        onIndexChange={handleIndexChange}
      />

      {/* ──────────────── Bottom overlay ──────────────── */}
      <LinearGradient
        pointerEvents="box-none"
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.bottomGradient}
      >
        <View style={styles.menuItemInfo}>
          <MenuItemInfo 
            restaurant={restaurant}
            menuItem={currentMenuItem}
          />
          <OrderButton 
            restaurant={restaurant}
            menuItem={currentMenuItem}
            onOrderPress={onOrderPress}
          />
        </View>
      </LinearGradient>
      <FloatingActionRail>
  <LikeButton restaurantId={restaurant.id} menuItemId={currentMenuItem.id} />
  <ShareButton
    restaurantName={restaurant.name}
    menuItemTitle={currentMenuItem.title}
  />
</FloatingActionRail>
    </View>
  );
};

/* ─────────────────────── Styles ─────────────────────── */

const styles = StyleSheet.create({
  /* layout roots */
  container: { width: W, height: H },

  /* bottom gradient */
  bottomGradient: {
    ...StyleSheet.absoluteFillObject,
    top: undefined,
    paddingTop: 120,
    paddingBottom: 48,
    paddingHorizontal: 24,
    justifyContent: 'flex-end',
  },

  /* translucent card holding info + CTA */
  menuItemInfo: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
});
