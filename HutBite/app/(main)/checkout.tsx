// app/(main)/checkout.tsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Themed';

import { useBasket } from '@/contexts/BasketContext';
import { useStore } from '@/contexts/StoreContext';
import { CheckoutProvider, useCheckout } from '@/contexts/CheckoutContext';

import { CartSummary } from '@/components/checkout/CartSummary';
import { DeliveryDetails } from '@/components/checkout/DeliveryDetails';
import { PromoCodeInput } from '@/components/checkout/PromoCodeInput';
import { TipSelector } from '@/components/checkout/TipSelector';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { StripePayment } from '@/components/checkout/StripePayment';

import Colors from '@/constants/Colors';
import { OrderType } from '@/types/store';
import { StripeProvider } from '@stripe/stripe-react-native';

function CheckoutInner() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { total, items, itemCount } = useBasket();
  const { stripeStoreUrl, stripeApiKey } = useStore();

  const { orderType, setOrderType, validate, getCheckoutPayload } = useCheckout();
  const params = useLocalSearchParams<{ orderType?: OrderType }>();

  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Apply route param orderType into context on mount/param change
  useEffect(() => {
    const incoming = (params.orderType || orderType || 'DELIVERY') as OrderType;
    if (incoming !== orderType) setOrderType(incoming);
  }, [params.orderType]);

  // Empty basket screen
  if (!items || items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.light.background }]}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your basket is empty</Text>
          <Button mode="contained" onPress={() => router.back()} style={styles.backToMenuButton}>
            Back to Menu
          </Button>
        </View>
      </View>
    );
  }

  // Stripe handlers
  const handlePaymentSuccess = () => {
    setPaymentError(null);
    setIsSubmitting(false);
    router.replace('/payment-success');
  };

  const handlePaymentError = (err: string) => {
    setPaymentError(err);
    setIsSubmitting(false);
  };

  const onValidateBeforePayment = (): boolean => {
    const { ok, errors } = validate();
    if (!ok) {
      const first = Object.values(errors)[0];
      setPaymentError(first || 'Please fix the highlighted fields.');
    } else {
      setPaymentError(null);
    }
    return ok;
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.light.background }]}>
      <StatusBar backgroundColor="transparent" translucent />

      {/* Header */}
      <LinearGradient
        colors={[Colors.light.primaryStart, Colors.light.primaryEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.gradientHeader, { paddingTop: insets.top + 6 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <Ionicons name="chevron-back" size={22} color="#111" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Checkout</Text>
            <Text style={styles.headerSubtitle}>
              {itemCount} item{itemCount === 1 ? '' : 's'} • {total}
            </Text>
          </View>

          <View style={styles.headerIcon} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 200 }]}
          showsVerticalScrollIndicator={false}
        >
          <CartSummary />
          <DeliveryDetails />
          <PromoCodeInput />
          <TipSelector />
          <OrderSummary />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Payment Section */}
      <View style={[styles.paymentContainer, { paddingBottom: insets.bottom + 16 }]}>
        {paymentError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{paymentError}</Text>
            <Button mode="outlined" onPress={() => setPaymentError(null)} style={styles.retryButton}>
              Try Again
            </Button>
          </View>
        )}

        {stripeApiKey ? (
          <StripePayment
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            onValidateBeforePayment={onValidateBeforePayment}
            // If your Stripe/BE accepts metadata/payload, derive it here:
            customerDetails={(() => {
              const payload = getCheckoutPayload();
              return {
                email: payload.contact.email,
                name: `${payload.contact.firstName} ${payload.contact.lastName}`.trim(),
                firstName: payload.contact.firstName,
                lastName: payload.contact.lastName,
                phone: payload.contact.phone,
                address: payload.addressDetails.address,
                city: payload.addressDetails.city,
                postalCode: payload.addressDetails.postalCode,
              };
            })()}
            stripeApiKey={stripeApiKey}
            stripeStoreUrl={stripeStoreUrl}
            orderType={orderType}
            disabled={isSubmitting || items.length === 0}
          />
        ) : (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentMethodLabel}>Loading…</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function CheckoutScreen() {
  const { stripeApiKey } = useStore();
  // Wrap with CheckoutProvider (and StripeProvider if key exists)
  if (stripeApiKey) {
    return (
      <StripeProvider publishableKey={stripeApiKey}>
        <CheckoutProvider>
          <CheckoutInner />
        </CheckoutProvider>
      </StripeProvider>
    );
  }
  return (
    <CheckoutProvider>
      <CheckoutInner />
    </CheckoutProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.light.border,
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerRight: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 12, color: '#fff', opacity: 0.8 },
  gradientHeader: { borderBottomLeftRadius: 18, borderBottomRightRadius: 18, overflow: 'hidden', paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  headerIcon: {
    height: 36, width: 36, borderRadius: 18,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(17,17,17,0.08)',
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 4 },
  content: { flex: 1 },
  contentContainer: { padding: 16 },
  paymentContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, backgroundColor: Colors.light.background,
  },
  paymentSection: { marginHorizontal: 16, marginBottom: 16 },
  paymentMethodLabel: { fontWeight: '600' },
  errorContainer: { alignItems: 'center', marginBottom: 16 },
  errorText: { color: Colors.light.error, textAlign: 'center', marginBottom: 8 },
  retryButton: { borderColor: Colors.light.primary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 18, marginBottom: 24, textAlign: 'center', color: Colors.light.text },
  backToMenuButton: { marginTop: 16 },
});
