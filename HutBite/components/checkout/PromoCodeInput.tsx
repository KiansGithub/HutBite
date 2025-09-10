import React from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { Text } from '@/components/Themed';

export const PromoCodeInput = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Promo code</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter promo code"
      />
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
  },
});
