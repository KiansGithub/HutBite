import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

const lightColors = Colors.light;

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  minQuantity?: number;
  maxQuantity?: number;
}

export function QuantitySelector({
  quantity,
  onQuantityChange,
  minQuantity = 1,
  maxQuantity = 99,
}: QuantitySelectorProps) {
  const handleDecrease = () => {
    if (quantity > minQuantity) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < maxQuantity) {
      onQuantityChange(quantity + 1);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Quantity</Text>
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={[
            styles.quantityButton,
            quantity <= minQuantity && styles.quantityButtonDisabled,
          ]}
          onPress={handleDecrease}
          disabled={quantity <= minQuantity}
        >
          <Ionicons
            name="remove"
            size={20}
            color={quantity <= minQuantity ? lightColors.textSecondary : lightColors.primary}
          />
        </TouchableOpacity>
        
        <View style={styles.quantityDisplay}>
          <Text style={styles.quantityText}>{quantity}</Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.quantityButton,
            quantity >= maxQuantity && styles.quantityButtonDisabled,
          ]}
          onPress={handleIncrease}
          disabled={quantity >= maxQuantity}
        >
          <Ionicons
            name="add"
            size={20}
            color={quantity >= maxQuantity ? lightColors.textSecondary : lightColors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: lightColors.surface,
    borderTopWidth: 1,
    borderTopColor: lightColors.border,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: lightColors.text,
    marginBottom: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: lightColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: lightColors.primary,
  },
  quantityButtonDisabled: {
    borderColor: lightColors.border,
    backgroundColor: lightColors.disabled,
  },
  quantityDisplay: {
    minWidth: 60,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: lightColors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: lightColors.border,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: lightColors.text,
  },
});
