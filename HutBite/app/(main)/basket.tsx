import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useBasket } from '@/contexts/BasketContext';
import { BasketItem } from '@/components/basket/BasketItem';
import { EmptyBasket } from '@/components/basket/EmptyBasket';
import { BasketSummary } from '@/components/basket/BasketSummary';
import { CTAButton } from '@/components/CTAButton';
import { useColorScheme } from '@/components/useColorScheme';

const colors = Colors.light;

export default function BasketScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme];
  const {
    items,
    total,
    itemCount,
    removeItem,
    updateQuantity,
    editItem,
    clearBasket
  } = useBasket();

  const handleQuantityChange = (id: string, quantity: number) => {
    updateQuantity(id, quantity);
  };

  const handleRemoveItem = (id: string) => {
    removeItem(id);
  };

  const handleEditItem = (item: any) => {
    // Navigate back to menu with edit mode
    // This could be implemented later if needed
    console.log('Edit item:', item);
  };

  const handleCheckout = () => {
    // Implement checkout logic
    console.log('Proceed to checkout');
  };

  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Basket</Text>
          <View style={styles.headerRight} />
        </View>
        <EmptyBasket />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Basket</Text>
        <TouchableOpacity onPress={clearBasket} style={styles.clearButton}>
          <Text style={[styles.clearButtonText, { color: themeColors.primary }]}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => (
          <BasketItem
            key={item.basketItemId}
            item={item}
            onQuantityChange={handleQuantityChange}
            onRemove={handleRemoveItem}
            onEdit={handleEditItem}
            testID={`basket-item-${item.basketItemId}`}
          />
        ))}

        <BasketSummary
          totalItems={itemCount}
          totalPrice={total}
          testID="basket-summary"
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom, backgroundColor: themeColors.background }]}>
        <CTAButton
          title={`Checkout • ${total}`}
          onPress={handleCheckout}
          size="large"
          style={styles.checkoutButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkoutButton: {
    marginTop: 0,
  },
});
