import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';

export const TipSelector = () => {
  const tipOptions = [1, 3, 5];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Show your driver some love</Text>
      <View style={styles.optionsContainer}>
        {tipOptions.map((tip) => (
          <TouchableOpacity key={tip} style={styles.tipOption}>
            <Text>${tip.toFixed(2)}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.tipOption}>
          <Text>Other</Text>
        </TouchableOpacity>
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
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tipOption: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
});
