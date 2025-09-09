import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Themed';

export interface EmptyBasketProps {
    /** Optional test ID for testing purposes */
    testID?: string; 
}

/**
 * Component to display when the basket is empty 
 */
export function EmptyBasket({ testID = 'empty-basket'}: EmptyBasketProps) {
    const router = useRouter();
    const theme = useTheme();
    const { colors } = theme; 

    const handleBrowseMenu = () => {
        router.push('/(main)/menu/[id]');
    };

    return (
        <View style={styles.container} testID={testID}>
            <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                    <Text style={styles.title}>
                    Your basket is empty
                    </Text>
                    <Text style={styles.message}>
                    Add some items to your basket to get started.
                    </Text>
                    <Button 
                      mode="contained"
                      onPress={handleBrowseMenu}
                      style={styles.button}
                      testID="browse-menu-button"
                    >
                        Browse Menu
                    </Button>
                </Card.Content>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, justifyContent: 'center' },
    card: { elevation: 4 },
    cardContent: { alignItems: 'center', padding: 16 },
    title: { marginBottom: 16, textAlign: 'center'},
    message: { marginBottom: 24, textAlign: 'center' },
    button: { marginTop: 8 },
});