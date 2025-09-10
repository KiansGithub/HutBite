import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';

export const DeliveryDetails = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Details</Text>
      {/* Map and address details will go here */}
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
