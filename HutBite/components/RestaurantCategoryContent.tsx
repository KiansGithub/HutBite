import React, { useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { Text } from '@/components/Themed';
import { RestaurantProductList } from './RestaurantProductList';
import { IBaseProduct, MenuCategory } from '@/types/store';
import { IBasketItem } from '@/types/basket';
import Colors from '@/constants/Colors';

const colors = Colors.light;

interface RestaurantCategoryContentProps {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  categories: MenuCategory[];
  products: IBaseProduct[];
  selectedCategoryId: string | null;
  basketItems: IBasketItem[];
  onProductPress?: (product: IBaseProduct) => void;
  buildImageUrl: (imgUrl?: string) => string | null;
}

export function RestaurantCategoryContent({
  loading = false,
  error = null,
  onRetry,
  categories = [],
  products = [],
  selectedCategoryId,
  basketItems = [],
  onProductPress,
  buildImageUrl
}: RestaurantCategoryContentProps) {

  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) return [];
    return products.filter(product => product.CategoryID === selectedCategoryId);
  }, [products, selectedCategoryId]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator 
            animating 
            size="large"
            color={colors.primary}
          />
          <Text 
            style={[styles.loadingText, { color: colors.text }]}
          >
            Loading menu...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            {error}
          </Text>
          {onRetry && (
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.primary }]} 
              onPress={onRetry}
            >
              <Text style={[styles.retryButtonText, { color: colors.background }]}>
                Retry
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!selectedCategoryId ? (
        <View style={styles.centerContent}>
          <Text style={[styles.placeholderText, { color: colors.text }]}>
            Select a category to view menu items
          </Text>
        </View>
      ) : (
        <RestaurantProductList
          products={filteredProducts}
          basketItems={basketItems}
          onProductPress={onProductPress}
          buildImageUrl={buildImageUrl}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.7,
  },
});
