import React, { useState } from 'react';
import { StyleSheet, View, Animated, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Themed';
import { ExpandableSearchBar } from './ExpandableSearchBar';
import { COMMON_CUISINES } from '@/utils/cuisine';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface TopOverlayProps {
    restaurantName: string; 
    distance?: number; 
    currentIndex: number; 
    totalItems: number; 
    searchQuery: string; 
    onSearchQueryChange: (text: string) => void; 
    onCategoryPress: (category: string) => void; 
}

const dynamicStyles = (themeColors) => StyleSheet.create({
    indicatorDot: {
        backgroundColor: themeColors.text,
        opacity: 0.4,
    },
    indicatorDotActive: {
        backgroundColor: themeColors.primary,
        opacity: 1,
    },
    distanceBadge: {
        backgroundColor: themeColors.primary,
    },
    categoryButton: {
        backgroundColor: themeColors.card, 
        borderColor: themeColors.border, 
    },
    categoryText: {
        color: themeColors.text,
    },
});

export const TopOverlay: React.FC<TopOverlayProps> = ({
    restaurantName, 
    distance, 
    currentIndex, 
    totalItems, 
    searchQuery, 
    onSearchQueryChange,
    onCategoryPress,
}) => {
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [shouldFocus, setShouldFocus] = useState(true);
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme];
    const styles = dynamicStyles(themeColors);
    
    const handleSearchExpand = () => {
      setShouldFocus(true);
        setSearchExpanded(true);
    };

    const handleSearchCollapse = () => {
      setShouldFocus(true);
        setSearchExpanded(false);
    };

    const handleCategoryPress = (category: string) => {
      setShouldFocus(false);
      onCategoryPress(category);
      setSearchExpanded(true);
    }

    return (
        <View style={staticStyles.container} pointerEvents="box-none">
            <View 
              style={[
                staticStyles.indicatorContainer, 
                searchExpanded && staticStyles.indicatorContainerExpanded
              ]}
              pointerEvents="none"
            >
                {Array.from({ length: totalItems }).map((_, idx) => (
                    <View 
                      key={idx}
                      style={[
                        staticStyles.indicatorDot, 
                        styles.indicatorDot,
                        idx === currentIndex && styles.indicatorDotActive, 
                      ]}
                    />
                ))}
            </View>

            {/*Category buttons - only show when search not expanded */}
            {!searchExpanded && (
              <ScrollView 
              horizontal
    showsHorizontalScrollIndicator={false}
    style={staticStyles.categoryContainer}
    contentContainerStyle={staticStyles.categoryContent}
    scrollEventThrottle={16}
    nestedScrollEnabled
              >
                {COMMON_CUISINES.slice(0, Platform.OS === 'android' ? 4 : 8).map((cuisine) => (
                  <TouchableOpacity 
                      key={cuisine}
                      style={[staticStyles.categoryButton, styles.categoryButton]}
                      onPress={() => handleCategoryPress(cuisine)}
                  >
                    <Text style={[staticStyles.categoryText, styles.categoryText]}>
                      {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Restaurant info - hidden when search expanded */}
            {!searchExpanded && distance !== undefined && (

                <View style={staticStyles.restaurantInfoContainer} pointerEvents="none">
                        <View style={[staticStyles.distanceBadge, styles.distanceBadge]}>
                        <Ionicons
                              name="location-outline"
                              size={12}
                              color="#fff"
                              style={staticStyles.distanceBadgeIcon}
                            />
                            <Text style={staticStyles.distanceBadgeText}>
                              {distance < 1 ? '<1' : distance.toFixed(1)} mi
                            </Text>
                        </View>
                </View>
            )}

            {/* Search bar */}
      <ExpandableSearchBar
        value={searchQuery}
        onChangeText={onSearchQueryChange}
        onClear={() => onSearchQueryChange('')}
        onExpand={handleSearchExpand}
        onCollapse={handleSearchCollapse}
        expanded={searchExpanded}
        autoFocus={shouldFocus}
        style={staticStyles.searchBarContainer}
      />
        </View>
    )
}

const staticStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 20, 
    },

    /* Indicator dots */
    indicatorContainer: {
        position: 'absolute',
        top: 60, 
        left: 0, 
        right: 0, 
        flexDirection: 'row',
        justifyContent: 'center',
    },
    indicatorContainerExpanded: {
        top: 40, 
    },
    indicatorDot: {
        width: 8, 
        height: 8, 
        borderRadius: 4, 
        marginHorizontal: 4, 
    },
    indicatorDotActive: {},

    /* Restaurant info container */
    restaurantInfoContainer: {
        position: 'absolute',
        top: 110, 
        left: 0, 
        right: 0, 
        alignItems: 'center',
        zIndex: 15, 
    },

    /* Restaurant name bubble */
    // restaurantBubble: {
    //     paddingVertical: 6, 
    //     paddingHorizontal: 18, 
    //     borderRadius: 20, 
    //     backgroundColor: 'rgba(0,0,0,0.6)',
    //     marginBottom: 8, 
    // },
    // restaurantBubbleText: {
    //     color: '#fff',
    //     fontSize: 18, 
    //     fontWeight: '600'
    // },
     /* Distance badge */
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  distanceBadgeIcon: {
    marginRight: 4,
  },
  distanceBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
 
  /* Search bar container */
  searchBarContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    paddingHorizontal: 0,
    paddingVertical: 0,
    zIndex: 30
  },

  /* Category buttons */
  categoryContainer: {
    position: 'absolute',
    top: 75,
    left: 0, 
    right: 0, 
    maxHeight: 32, 
    zIndex: 25
  },
  categoryContent: {
    paddingHorizontal: 20
  },
  categoryButton: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginHorizontal: 4,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  categoryText: {
    fontSize: 11, 
    fontWeight: '500',
  },
  androidElevation: {
    elevation: 10,         // Android hit‑test stacking
  },
})