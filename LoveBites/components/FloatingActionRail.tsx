import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
    children: React.ReactNode; 
}

/** Right-hand vertical rail that keeps its children spaced nicely */
export const FloatingActionRail: React.FC<Props> = ({ children }) => {
    const insets = useSafeAreaInsets();
    return (
        <View 
          pointerEvents='box-none'
          style={[
            styles.rail,
            { top: '65%', right: insets.right + 16, transform: [{ translateY: -50 }] },
          ]}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    rail: {
        position: 'absolute',
        alignItems: 'center',
        gap: 12,
    },
});