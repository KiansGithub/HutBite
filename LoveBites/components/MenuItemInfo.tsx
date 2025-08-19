import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { Database } from '@/lib/supabase.d';
import { FeedContentItem } from '@/types/feedContent';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'] & { id: string };

interface MenuItemInfoProps {
    restaurant: Restaurant; 
    feedItem: FeedContentItem;
}

export const MenuItemInfo: React.FC<MenuItemInfoProps> = ({
    restaurant, 
    feedItem, 
}) => {
    const isUGC = feedItem.type === 'ugc_video';

    return (
        <View style={styles.container}>
          <Text style={styles.title}>{feedItem.title}</Text>
          {feedItem.description && (
            <Text style={styles.description}>{feedItem.description}</Text>
          )}
          {feedItem.price && !isUGC && (
            <Text style={styles.price}>${feedItem.price.toFixed(2)}</Text>
          )}
          {isUGC && (
            <Text style={styles.ugcLabel}>Community Video</Text>
          )}
        </View>
      );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 14, 
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    nameContainer: {
        flex: 1, 
        marginRight: 12, 
    },
    restaurantName: {
        fontSize: 14, 
        fontWeight: '500',
        color: 'rgba(255,255,255,0.75)',
        marginBottom: 2, 
    },
    menuItemName: {
        fontSize: 22, 
        fontWeight: '700',
        color: '#fff',
        flexShrink: 1
    },
    descriptionSection: {
        marginBottom: 14,
    },
    menuItemDescription: {
        fontSize: 14, 
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 18, 
        marginBottom: 4, 
    },
    expandButton: {
        alignSelf: 'flex-start'
    },
    expandButtonText: {
        fontSize: 12, 
        color: Colors.light.primary, 
        fontWeight: '600'
    },
});