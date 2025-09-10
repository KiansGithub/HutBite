import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';

export const OrderSummary = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Summary</Text>
      <View style={styles.row}>
        <Text>Subtotal</Text>
        <Text>$0.00</Text>
      </View>
      <View style={styles.row}>
        <Text>Delivery Fee</Text>
        <Text>$0.00</Text>
      </View>
      <View style={styles.row}>
        <Text>Fees & Estimated Tax</Text>
        <Text>$0.00</Text>
      </View>
      <View style={styles.row}>
        <Text>Courier Tip</Text>
        <Text>$0.00</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalRow: {
    borderTopWidth: 1,
    borderColor: '#ccc',
    paddingTop: 10,
    marginTop: 10,
  },
  totalText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
