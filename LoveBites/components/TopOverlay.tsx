import React, { useState } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { Text } from '@/components/Themed';
import { ExpandableSearchBar } from './ExpandableSearchBar';

interface TopOverlayProps {
    restaurantName: string; 
    distance?: number; 
    currentIndex: number; 
    totalItems: number; 
    searchQuery: string; 
    onSearchQueryChange: (text: string) => void; 
}

export const TopOverlay: React.FC<TopOverlayProps> = ({
    restaurantName, 
    distance, 
    currentIndex, 
    totalItems, 
    searchQuery, 
    onSearchQueryChange,
}) => {
    const [searchExpanded, setSearchExpanded] = useState(false);
    
    const handleSearchExpand = () => {
        setSearchExpanded(true);
    };

    const handleSearchCollapse = () => {
        setSearchExpanded(false);
    };

    return (
        <View style={styles.container} pointerEvents="box-none">
            <View 
              style={[
                styles.indicatorContainer, 
                searchExpanded && styles.indicatorContainerExpanded
              ]}
              pointerEvents="none"
            >
                {Array.from({ length: totalItems }).map((_, idx) => (
                    <View 
                      key={idx}
                      style={[
                        styles.indicatorDot, 
                        idx === currentIndex && styles.indicatorDotActive, 
                      ]}
                    />
                ))}
            </View>

            {/* Restaurant info - hidden when search expanded */}
            {!searchExpanded && (
                <View style={styles.restaurantInfoContainer} pointerEvents="none">
                    <View style={styles.restaurantBubble}>
                        <Text style={styles.restaurantBubbleText}>{restaurantName}</Text>
                    </View>

                    {distance !== undefined && (
                        <View style={styles.distanceBadge}>
                        <Text style={styles.distanceBadgeText}>
                          {distance < 1 ? '<1' : distance.toFixed(1)} mi
                        </Text>
                      </View>
                    )}
                </View>
            )}

            {/* Search bar */}
      <ExpandableSearchBar
        value={searchQuery}
        onChangeText={onSearchQueryChange}
        onClear={() => onSearchQueryChange('')}
        onExpand={handleSearchExpand}
        onCollapse={handleSearchCollapse}
        style={styles.searchBarContainer}
      />
        </View>
    )
}

const styles = StyleSheet.create({
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
        backgroundColor: '#777',
        marginHorizontal: 4, 
    },
    indicatorDotActive: {
        backgroundColor: '#fff'
    },

    /* Restaurant info container */
    restaurantInfoContainer: {
        position: 'absolute',
        top: 90, 
        left: 0, 
        right: 0, 
        alignItems: 'center'
    },

    /* Restaurant name bubble */
    restaurantBubble: {
        paddingVertical: 6, 
        paddingHorizontal: 18, 
        borderRadius: 20, 
        backgroundColor: 'rgba(0,0,0,0.6)',
        marginBottom: 8, 
    },
    restaurantBubbleText: {
        color: '#fff',
        fontSize: 18, 
        fontWeight: '600'
    },
     /* Distance badge */
  distanceBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 122, 0, 0.9)',
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
  },
})