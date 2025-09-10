import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';
import { useBasket } from '@/contexts/BasketContext';

// Mock data as requested by the user
const mockCartItems = [
  {
    id: '1',
    name: 'L.E.S',
    description: 'Poppy Bagel',
    quantity: 1,
    price: 13.51,
  },
  {
    id: '2',
    name: 'Everything Bagel',
    description: 'Sliced',
    quantity: 1,
    price: 2.3,
  },
];

export const CartSummary = () => {
  // const { items } = useBasket(); // Will use mock data for now
  const items = mockCartItems;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cart Summary</Text>
        <Text style={styles.itemCount}>• {itemCount} items</Text>
      </View>
      {items.map((item) => (
        <View key={item.id} style={styles.itemContainer}>
          <Text style={styles.quantity}>{item.quantity}×</Text>
          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDescription}>{item.description}</Text>
          </View>
          <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8, // Adjusted padding
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
    alignItems: 'center',
    marginBottom: 16,
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
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
});
