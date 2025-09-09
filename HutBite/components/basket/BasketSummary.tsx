import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import { Text } from '@/components/Themed';

export interface BasketSummaryProps {
    /** Total number of items in the basket */
    totalItems: number; 
    /** Total price of all items in the basket */
    totalPrice: string; 
    /** Optional test ID for testing purposes */
    testID?: string; 
}

/**
 * Component to display a summary of the basket contents
 */
export function BasketSummary({
    totalItems, 
    totalPrice, 
    testID = 'basket-summary'
}: BasketSummaryProps) {
    const theme = useTheme();

    return (
        <Card style={styles.container} testID={testID}>
            <Card.Content>
                <View style={styles.row}>
                    <Text>Items</Text>
                    <Text>{totalItems}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                    <Text style={{ fontWeight: 'bold' }}>Total</Text>
                    <Text style={{ fontWeight: 'bold' }}>{totalPrice}</Text>
                </View>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8, 
    },
    divider: {
        borderBottomWidth: 1, 
        borderBottomColor: '#e0e0e0',
        marginVertical: 8, 
    },
});