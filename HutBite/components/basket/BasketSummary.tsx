// components/basket/BasketSummary.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';

export interface BasketSummaryProps {
  totalItems: number;
  totalPrice: string;
  testID?: string;
}

/**
 * Purple gradient summary pill to match the menu header
 */
export function BasketSummary({
  totalItems,
  totalPrice,
  testID = 'basket-summary',
}: BasketSummaryProps) {
  return (
    <LinearGradient
      testID={testID}
      colors={[Colors.light.primaryStart, Colors.light.primaryEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.row}>
        <Text style={styles.label}>Items</Text>
        <Text style={styles.value}>{totalItems}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={[styles.label, styles.bold]}>Total</Text>
        <Text style={[styles.value, styles.bold]}>{totalPrice}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: 8,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.95,
  },
  value: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  bold: { fontWeight: '800' },
});
