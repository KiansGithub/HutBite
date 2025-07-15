import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { Database } from '@/lib/supabase.d';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'] & { id: string };

interface OrderButtonProps {
    restaurant: Restaurant, 
    menuItem: MenuItem, 
    onOrderPress: (orderLinks: Record<string, string> | null) => void; 
}

export const OrderButton: React.FC<OrderButtonProps> = ({
    restaurant, 
    menuItem, 
    onOrderPress, 
}) => {
    const handlePress = () => {
        onOrderPress(restaurant.order_links as Record<string, string> | null);
    };

    return (
        <TouchableOpacity 
          style={styles.orderButton}
          onPress={handlePress}
        >
            <Text style={styles.orderButtonText}>
                Order Now    |    £{menuItem.price.toFixed(2)}
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