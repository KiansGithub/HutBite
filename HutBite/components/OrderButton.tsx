import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { Database } from '@/lib/supabase.d';
import { FeedContentItem } from '@/types/feedContent';
import { APP_CONFIG } from '@/constants/config';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

interface OrderButtonProps {
    restaurant: Restaurant, 
    feedItem: FeedContentItem, 
    onOrderPress: () => void;
    onMenuPress?: () => void;
}

export const OrderButton: React.FC<OrderButtonProps> = ({
    restaurant, 
    feedItem, 
    onOrderPress,
    onMenuPress,
}) => {
    const handlePress = () => {
        if (!APP_CONFIG.ORDERING_ENABLED) {
            // When ordering is disabled, always go to restaurant page
            onOrderPress();
        } else if (restaurant.receives_orders) {
            // When ordering is enabled and restaurant accepts orders, open menu modal
            onMenuPress?.();
        } else {
            // When ordering is enabled but restaurant doesn't accept orders, go to restaurant page
            onOrderPress();
        }
    };

    const handleMenuPress = () => {
        onMenuPress?.();
    };

    const buttonText = (APP_CONFIG.ORDERING_ENABLED && restaurant.receives_orders)
        ? 'Add to Basket'
        : 'View Restaurant';

    return (
        <View style={styles.buttonContainer}>
            {APP_CONFIG.ORDERING_ENABLED && restaurant.receives_orders && onMenuPress && (
                <TouchableOpacity 
                    style={styles.menuButton}
                    onPress={handleMenuPress}
                >
                    <Ionicons 
                        name="restaurant-outline" 
                        size={20} 
                        color="#fff" 
                    />
                </TouchableOpacity>
            )}
            
            <TouchableOpacity 
                style={[
                    styles.orderButton,
                    APP_CONFIG.ORDERING_ENABLED && restaurant.receives_orders && onMenuPress ? styles.orderButtonWithMenu : null
                ]}
                onPress={handlePress}
            >
                <Text style={styles.orderButtonText}>
                    {buttonText}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    orderButton: {
        flex: 1,
        backgroundColor: Colors.light.primary, 
        borderRadius: 30, 
        paddingVertical: 14, 
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, 
        shadowRadius: 6, 
        elevation: 3, 
    },
    orderButtonWithMenu: {
        // Slightly reduce flex when menu button is present
        flex: 0.85,
    },
    orderButtonText: {
        color: '#fff',
        fontSize: 18, 
        fontWeight: '700'
    },
    menuButton: {
        backgroundColor: Colors.light.primary,
        borderRadius: 30,
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 3,
    },
});