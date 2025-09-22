import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

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

    const handleBrowseMenu = () => {
        router.push('/(main)/(tabs)/feed');
    };

    return (
        <View style={styles.container} testID={testID}>
            <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                    <Ionicons name="basket-outline" size={48} color={Colors.light.primary} />
                </View>
            </View>
            
            <View style={styles.content}>
                <Text style={styles.title}>
                    Your basket is empty
                </Text>
                <Text style={styles.message}>
                    Browse our delicious menu and add some items to get started with your order.
                </Text>
                
                <Button 
                    mode="contained"
                    onPress={handleBrowseMenu}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                    testID="browse-menu-button"
                >
                    Browse Menu
                </Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        paddingHorizontal: 24,
        paddingVertical: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 32,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.light.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.light.primary + '20', // 20% opacity
        shadowColor: Colors.light.primary,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    content: {
        alignItems: 'center',
        maxWidth: 280,
    },
    title: { 
        fontSize: 24,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 16, 
        textAlign: 'center',
    },
    message: { 
        fontSize: 16,
        lineHeight: 24,
        color: Colors.light.tabIconDefault,
        marginBottom: 32, 
        textAlign: 'center',
    },
    button: { 
        borderRadius: 12,
        backgroundColor: Colors.light.primary,
        shadowColor: Colors.light.primary,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonContent: {
        paddingVertical: 4,
        paddingHorizontal: 16,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});