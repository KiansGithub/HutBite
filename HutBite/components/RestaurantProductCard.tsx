import React, { useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Animated } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { IBaseProduct } from '@/types/store';
import { useStore } from '@/contexts/StoreContext';
import { buildImageUrl } from '@/utils/imageUtils';
import { getProductPrice } from '@/utils/basketUtils';

const colors = Colors.light;

interface RestaurantProductCardProps {
  product: IBaseProduct;
  quantity: number;
  onPress: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export function RestaurantProductCard({ 
  product, 
  quantity, 
  onPress,
  onIncrement,
  onDecrement
}: RestaurantProductCardProps) {
  
  const { urlForImages } = useStore();
  const [scaleAnim] = useState(new Animated.Value(1));
  
  const imageUrl = product.ImgUrl ? buildImageUrl(urlForImages, product.ImgUrl) : null;
  
  const handleAddPress = () => {
    // Add a subtle bounce animation for feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
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

          <Text 
                style={[styles.price, { color: colors.text }]}
                numberOfLines={1}
              >
                £{getProductPrice(product)?.toFixed(2) || '0.00'}
              </Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.buttonContainer}>
        {quantity > 0 ? (
          <View style={[styles.quantityRow, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={onDecrement} 
            >
              <Ionicons name="remove" size={20} color={colors.text} />
            </TouchableOpacity>
            
            <Text style={[styles.quantityText, { color: colors.text }]}>{quantity}</Text>
            
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={onIncrement} 
            >
              <Ionicons name="add" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
              onPress={handleAddPress}
            >
              <Ionicons name="add" size={24} color={colors.text} />
              {/* Show a small badge if there are items in basket for this product */}
              {quantity > 0 && (
                <View style={[styles.quantityBadge, { backgroundColor: colors.error || '#FF6B6B' }]}>
                  <Text style={styles.quantityBadgeText}>{quantity}</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
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
    flexDirection: 'row-reverse',
    alignItems: 'stretch',
    overflow: 'hidden',
    minHeight: 120,
  },
  image: {
    width: 120,
    height: 120,
    borderBottomRightRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderTopLeftRadius: 0,
  },
  content: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    position: 'relative',
  },
  headerContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingRight: 50, // Make room for add button
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  price: {
    position: 'absolute',
    bottom: 8,
    left: 16,
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.9,
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
    bottom: 4,
    right: 4,
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
    position: 'relative',
  },
  quantityBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  quantityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
});
