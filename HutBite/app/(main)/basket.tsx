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
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const colors = Colors.light;

export default function BasketScreen() {
  const insets = useSafeAreaInsets();
  const topPad = (insets.top || 0) + 6;
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
    // Navigate to checkout screen with order type
    router.push({
      pathname: '(main)/checkout',
      params: { orderType: 'DELIVERY' } // You can make this dynamic based on user selection
    });
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
    {/* Gradient Header like the menu modal */}
    <StatusBar style="light" translucent backgroundColor="transparent" />
    <LinearGradient
      colors={[Colors.light.primaryStart, Colors.light.primaryEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradientTop, { paddingTop: (insets.top || 0) + 6 }]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Basket</Text>
          <Text style={styles.headerPill}>
            {itemCount} item{itemCount === 1 ? '' : 's'}
          </Text>
        </View>

        <TouchableOpacity onPress={clearBasket} style={styles.headerIcon}>
          <Ionicons name="trash-outline" size={20} color="#111" />
        </TouchableOpacity>
      </View>
    </LinearGradient>


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
  summaryStrip: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 92,           // sit just above the footer CTA (adjust if needed)
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    // subtle purple pill
    backgroundColor: 'rgba(113, 89, 193, 0.95)', // close to your primary, tweak if needed
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  summaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  gradientTop: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: 'hidden',
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerIcon: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(17,17,17,0.08)',
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 4 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerPill: {
    color: '#fff',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
}
})