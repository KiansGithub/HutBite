import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface ToppingPortionControlProps {
    value: number; 
    onChange: (value: number) => void;
    min?: number;
    max?: number;
}

export const ToppingPortionControl: React.FC<ToppingPortionControlProps> = ({
    value, 
    onChange, 
    min = 0,
    max = 2
}) => {
    const theme = useTheme();

    return (
        <View style={[
            styles.container,
            { backgroundColor: theme.colors.primary }
        ]}>
            <Text style={[
                styles.valueText,
                { color: theme.colors.onPrimary }
            ]}>
                {value}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        minWidth: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    valueText: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    valueContainer: {
        minWidth: 32, 
        height: 32, 
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 4,
        marginHorizontal: 4,
    },
});