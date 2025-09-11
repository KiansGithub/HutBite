// components/checkout/CartSummary.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';
import { useBasket } from '@/contexts/BasketContext';
import Colors from '@/constants/Colors';

export const CartSummary = () => {
  const { items, itemCount, total } = useBasket();

  if (!items || items.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Cart Summary</Text>
        <Text style={styles.itemCount}>
          • {itemCount} item{itemCount === 1 ? '' : 's'}
        </Text>
      </View>

      {/* Items */}
      {items.map((item) => (
        <View key={item.id} style={styles.itemContainer}>
          <Text style={styles.quantity}>{item.quantity}×</Text>
          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>{item.product_name}</Text>
          </View>
          <Text style={styles.itemPrice}>{item.subtotal}</Text>
        </View>
      ))}

      {/* Subtotal Row */}
      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Subtotal</Text>
        <Text style={styles.footerValue}>{total}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 8,
    borderBottomColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  itemCount: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  quantity: {
    fontSize: 16,
    color: '#666',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
  },
  optionText: {
    fontSize: 13,
    color: Colors.light.medium,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
    marginTop: 12,
    paddingTop: 12,
  },
  footerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  footerValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
});
