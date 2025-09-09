import React from 'react';
import { StyleSheet, FlatList, View } from 'react-native';
import { Text } from '@/components/Themed';
import { RestaurantProductCard } from './RestaurantProductCard';
import { IBaseProduct } from '@/types/store';
import Colors from '@/constants/Colors';
import { IBasketItem } from '@/types/basket';

const colors = Colors.light;

interface RestaurantProductListProps {
  products: IBaseProduct[];
  basketItems: IBasketItem[];
  onProductPress: (product: IBaseProduct) => void;
  buildImageUrl: (imgUrl?: string) => string | null;
}

export function RestaurantProductList({ 
  products, 
  basketItems = [], 
  onProductPress,
  buildImageUrl 
}: RestaurantProductListProps) {

  const renderItem = ({ item }: { item: IBaseProduct }) => {
    const basketItem = basketItems.find(bi => bi.productId === item.ID);
    const quantity = basketItem ? basketItem.quantity : 0;
    const imageUrl = buildImageUrl(item.ImgUrl);
    
    return (
      <RestaurantProductCard
        product={item}
        quantity={quantity}
        onPress={() => onProductPress(item)}
        imageUrl={imageUrl || undefined}
      />
    );
  };

  if (!products || products.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.text }]}>
          No products available in this category.
        </Text>
      </View>
    );
  }

  return (
    <FlatList 
      data={products}
      renderItem={renderItem}
      keyExtractor={(item, index) => `${item.ID}-${index}`}
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: 8,
    paddingBottom: 120, // Extra padding to ensure last item is fully visible above basket footer
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  separator: {
    height: 8,
  },
});
