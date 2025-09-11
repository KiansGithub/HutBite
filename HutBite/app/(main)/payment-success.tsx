import React from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Themed';

import { useBasket } from '@/contexts/BasketContext';
import Colors from '@/constants/Colors';

export default function PaymentSuccessScreen() {
  const insets = useSafeAreaInsets();
  const { clearBasket, total } = useBasket();

  const handleContinue = () => {
    clearBasket();
    router.replace('/feed');
  };

  const handleViewOrders = () => {
    clearBasket();
    router.replace('/orders');
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.light.background }]}>
      <StatusBar backgroundColor="transparent" translucent />

      {/* Header */}
      <LinearGradient
        colors={[Colors.light.primaryStart, Colors.light.primaryEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientHeader, { paddingTop: insets.top + 6 }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerIcon} />

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Order Confirmed</Text>
            <Text style={styles.headerSubtitle}>Thank you for your order!</Text>
          </View>

          <View style={styles.headerIcon} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </View>
        </View>

        {/* Success Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successMessage}>
            Your order has been confirmed and is being prepared. You'll receive updates on your order status.
          </Text>
        </View>

        {/* Order Details Card */}
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderTitle}>Order Summary</Text>
            <Text style={styles.orderTotal}>{total}</Text>
          </View>

          <View style={styles.orderDetail}>
            <Ionicons name="time-outline" size={20} color={Colors.light.primary} />
            <Text style={styles.orderDetailText}>Estimated delivery: 25-35 minutes</Text>
          </View>

          <View style={styles.orderDetail}>
            <Ionicons name="receipt-outline" size={20} color={Colors.light.primary} />
            <Text style={styles.orderDetailText}>Order confirmation sent to your email</Text>
          </View>
        </View>

        {/* What's Next */}
        <View style={styles.nextStepsCard}>
          <Text style={styles.nextStepsTitle}>What's Next?</Text>
          <View style={styles.nextStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Restaurant confirms your order</Text>
          </View>
          <View style={styles.nextStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Your food is being prepared</Text>
          </View>
          <View style={styles.nextStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Driver picks up and delivers to you</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          mode="outlined"
          onPress={handleViewOrders}
          style={styles.secondaryButton}
          labelStyle={styles.secondaryButtonText}
        >
          View My Orders
        </Button>

        <Button
          mode="contained"
          onPress={handleContinue}
          style={styles.primaryButton}
          labelStyle={styles.primaryButtonText}
        >
          Continue Shopping
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientHeader: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: 'hidden',
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerIcon: {
    height: 36,
    width: 36,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  successIconContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: Colors.light.text,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  orderCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  orderDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderDetailText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 12,
    opacity: 0.8,
  },
  nextStepsCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  nextStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  stepText: {
    fontSize: 14,
    color: Colors.light.text,
    opacity: 0.8,
    flex: 1,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderColor: Colors.light.primary,
  },
  secondaryButtonText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
