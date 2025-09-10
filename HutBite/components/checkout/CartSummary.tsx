import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';

export const CartSummary = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cart Summary</Text>
      {/* Cart items will be rendered here */}
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
});
