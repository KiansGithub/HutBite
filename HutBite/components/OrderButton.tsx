import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { Database } from '@/lib/supabase.d';
import { FeedContentItem } from '@/types/feedContent';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

interface OrderButtonProps {
    restaurant: Restaurant, 
    feedItem: FeedContentItem, 
    onOrderPress: () => void; 
}

export const OrderButton: React.FC<OrderButtonProps> = ({
    restaurant, 
    feedItem, 
    onOrderPress, 
}) => {
    const handlePress = () => {
        onOrderPress();
    };

    const buttonText = restaurant.receives_orders ? 'Add to Basket' : 'View Restaurant';

    return (
        <TouchableOpacity 
          style={styles.orderButton}
          onPress={handlePress}
        >
            <Text style={styles.orderButtonText}>
                {buttonText}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    orderButton: {
        alignSelf: 'stretch',
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
    orderButtonText: {
        color: '#fff',
        fontSize: 18, 
        fontWeight: '700'
    },
});