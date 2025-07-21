import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { Database } from '@/lib/supabase.d';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'] & { id: string };

interface MenuItemInfoProps {
    restaurant: Restaurant; 
    menuItem: MenuItem; 
}

export const MenuItemInfo: React.FC<MenuItemInfoProps> = ({
    restaurant, 
    menuItem, 
}) => {
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    const truncateDescription = (text: string, maxLength: number = 80) => {
        if (text.length <= maxLength) return text; 

        const truncated = text.substring(0, maxLength);
        const lastSentenceEnd = Math.max(
            truncated.lastIndexOf('.'),
            truncated.lastIndexOf('!'),
            truncated.lastIndexOf('?')
        );

        if (lastSentenceEnd > 0) {
            return truncated.substring(0, lastSentenceEnd + 1);
        }

        const lastSpace = truncated.lastIndexOf('.');
        return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
    };

    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                <View style={styles.nameContainer}>
                    <Text style={styles.restaurantName}>{restaurant.name}</Text>
                    <Text numberOfLines={1} style={styles.menuItemName}>
                        {menuItem.title}
                    </Text>
                </View>
            </View>

            {menuItem.description && (
                <View style={styles.descriptionSection}>
                    <Text style={styles.menuItemDescription}>
                        {isDescriptionExpanded
                          ? menuItem.description 
                          : truncateDescription(menuItem.description)
                        }
                    </Text>
                    {menuItem.description.length > 80 && (
                        <TouchableOpacity 
                          onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          style={styles.expandButton}
                        >
                            <Text style={styles.expandButtonText}>
                                {isDescriptionExpanded ? 'View less': 'View more'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
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