import React, { useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { IBaseProduct } from '@/types/store';

const colors = Colors.light;

interface RestaurantProductCardProps {
  product: IBaseProduct;
  quantity: number;
  onPress: () => void;
  imageUrl?: string;
}

export function RestaurantProductCard({ 
  product, 
  quantity, 
  onPress,
  imageUrl 
}: RestaurantProductCardProps) {
  
  const handleAddPress = () => {
    onPress();
  };

  return (
    <Card style={[styles.card, { backgroundColor: colors.background }]}>
      <TouchableOpacity onPress={handleAddPress} activeOpacity={0.7}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {imageUrl && (
            <Image 
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          )}
          
          <View style={[styles.content, { backgroundColor: colors.background }]}>
            <View style={[styles.headerContainer, { backgroundColor: colors.background }]}>
              <Text 
                style={[styles.name, { color: colors.text }]}
                numberOfLines={2}
              >
                {product.Name}
              </Text>
              <Text 
                style={[styles.price, { color: colors.text }]}
                numberOfLines={1}
              >
                ${product.Price ? product.Price.toFixed(2) : '0.00'}
              </Text>
            </View>

            {product.Description && (
              <Text 
                style={[styles.description, { color: colors.text }]}
                numberOfLines={3}
              >
                {product.Description}
              </Text>
            )}

            {product.IsNew && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.badgeText, { color: colors.background }]}>NEW</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
      
      <View style={styles.buttonContainer}>
        {quantity > 0 ? (
          <View style={[styles.quantityRow, { backgroundColor: colors.primary }]}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={onPress} // Decrement logic is handled in the parent
            >
              <Ionicons name="remove" size={20} color="#fff" />
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{quantity}</Text>
            
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={onPress} // Increment logic is handled in the parent
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddPress}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 16,
    elevation: 4,
    borderRadius: 16,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    minHeight: 120,
  },
  image: {
    width: 120,
    height: 120,
    borderBottomLeftRadius: 16,
    borderTopLeftRadius: 16,
  },
  content: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    position: 'relative',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingRight: 50, // Make room for add button
  },
  name: {
    flex: 1,
    marginRight: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 60,
    textAlign: 'right',
  },
  description: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
    opacity: 0.8,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 60,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 1,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    paddingHorizontal: 12,
    minWidth: 30,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
