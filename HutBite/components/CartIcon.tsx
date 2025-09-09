import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBasket } from '@/contexts/BasketContext';

interface CartIconProps {
  onPress: () => void;
}

export const CartIcon: React.FC<CartIconProps> = ({ onPress }) => {
  const { itemCount } = useBasket();

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Ionicons name="cart" size={28} color="black" />
      {itemCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{itemCount}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 5,
  },
  badge: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});