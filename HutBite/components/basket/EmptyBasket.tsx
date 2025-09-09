import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, useTheme } from 'react-native-paper';
import { ThemedText } from '../ThemedText';
import { useRouter } from 'expo-router';
import { translate } from '@/constants/translations';

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
        router.push('/(tabs)/menu');
    };

    return (
        <View style={styles.container} testID={testID}>
            <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                    <ThemedText type="title" style={styles.title}>
                    {translate('yourBasketEmpty')}
                    </ThemedText>
                    <ThemedText style={styles.message}>
                    {translate('basketEmptyMessage')} 
                    </ThemedText>
                    <Button 
                      mode="contained"
                      onPress={handleBrowseMenu}
                      style={styles.button}
                      testID="browse-menu-button"
                    >
                        {translate('browseMenu')}
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