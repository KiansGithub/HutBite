import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { Button, Card, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Themed';
import { useBasket } from '@/contexts/BasketContext';
import { useStore } from '@/contexts/StoreContext';
import { ContactInfo } from '@/components/checkout/ContactInfo';
import { AddressForm } from '@/components/checkout/AddressForm';
import { StripePayment } from '@/components/checkout/StripePayment';
import Colors from '@/constants/Colors';
import { OrderType } from '@/types/store';
import { StripeProvider } from '@stripe/stripe-react-native';

interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  instructions: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { total, items, itemCount } = useBasket();
  const { storeInfo, urlForImages } = useStore();
  const params = useLocalSearchParams<{ orderType?: OrderType }>();
  const orderType = (params.orderType || 'DELIVERY') as OrderType;

  // Customer details state
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    instructions: '',
  });

  // Form validation state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cash'>('stripe');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Get store configuration
  const stripeApiKey = (storeInfo as any)?.cardPaymentInfo?.publishableKey || '';
  const stripeStoreUrl = (storeInfo as any)?.StoreURL || '';

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!customerDetails.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!customerDetails.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!customerDetails.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(customerDetails.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!customerDetails.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!isPhoneValid) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (orderType === 'DELIVERY') {
      if (!customerDetails.address.trim()) {
        newErrors.address = 'Address is required for delivery';
      }
      if (!customerDetails.city.trim()) {
        newErrors.city = 'City is required for delivery';
      }
      if (!customerDetails.postalCode.trim()) {
        newErrors.postalCode = 'Postal code is required for delivery';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update customer details
  const updateCustomerDetails = (field: keyof CustomerDetails, value: string) => {
    setCustomerDetails(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Payment success handler
  const handlePaymentSuccess = () => {
    setPaymentError(null);
    setIsSubmitting(false);
    router.replace('/payment-success');
  };

  // Payment error handler
  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    setPaymentError(error);
    setIsSubmitting(false);
  };

  // Validate before payment
  const validateBeforePayment = (): boolean => {
    const isValid = validateForm();
    if (isValid) {
      setPaymentError(null);
    }
    return isValid;
  };

  // Check if we have required data
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

  const CheckoutContent = () => (
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 200 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Order Type */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Order Type</Text>
              <Text style={styles.orderTypeText}>
                {orderType === 'DELIVERY' ? '🚚 Delivery' : '🏪 Collection'}
              </Text>
            </Card.Content>
          </Card>

          {/* Contact Information */}
          <ContactInfo
            firstName={customerDetails.firstName}
            lastName={customerDetails.lastName}
            email={customerDetails.email}
            errors={errors}
            onFirstNameChange={(text) => updateCustomerDetails('firstName', text)}
            onLastNameChange={(text) => updateCustomerDetails('lastName', text)}
            onEmailChange={(text) => updateCustomerDetails('email', text)}
          />

          {/* Address Form (for delivery) or Phone (for collection) */}
          <AddressForm
            address={customerDetails.address}
            city={customerDetails.city}
            postalCode={customerDetails.postalCode}
            instructions={customerDetails.instructions}
            phone={customerDetails.phone}
            errors={errors}
            onAddressChange={(text) => updateCustomerDetails('address', text)}
            onCityChange={(text) => updateCustomerDetails('city', text)}
            onPostalCodeChange={(text) => updateCustomerDetails('postalCode', text)}
            onInstructionsChange={(text) => updateCustomerDetails('instructions', text)}
            onPhoneChange={(text) => updateCustomerDetails('phone', text)}
            onPhoneValidityChange={setIsPhoneValid}
            isLoading={false}
            disabled={isSubmitting}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Payment Section */}
      <LinearGradient
        colors={[Colors.light.primaryStart, Colors.light.primaryEnd]}
        style={[styles.paymentSection, { paddingBottom: insets.bottom + 16 }]}
      >
        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{total}</Text>
        </View>

        <View style={styles.divider} />

        {/* Payment Method Selection */}
        <View style={styles.paymentOptions}>
          <Button
            mode={paymentMethod === 'stripe' ? 'contained' : 'outlined'}
            onPress={() => setPaymentMethod('stripe')}
            style={[
              styles.paymentMethodButton,
              paymentMethod === 'stripe' ? styles.activePaymentMethod : styles.inactivePaymentMethod
            ]}
            labelStyle={styles.paymentMethodLabel}
            icon="credit-card"
          >
            Card
          </Button>

          <Button
            mode={paymentMethod === 'cash' ? 'contained' : 'outlined'}
            onPress={() => setPaymentMethod('cash')}
            style={[
              styles.paymentMethodButton,
              styles.paymentMethodButtonRight,
              paymentMethod === 'cash' ? styles.activePaymentMethod : styles.inactivePaymentMethod
            ]}
            labelStyle={styles.paymentMethodLabel}
            icon="cash"
          >
            Cash
          </Button>
        </View>

        {/* Error Display */}
        {paymentError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{paymentError}</Text>
            <Button
              mode="outlined"
              onPress={() => setPaymentError(null)}
              style={styles.retryButton}
            >
              Try Again
            </Button>
          </View>
        )}

        <View style={styles.divider} />

          <StripePayment
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            onValidateBeforePayment={validateBeforePayment}
            customerDetails={{
              email: customerDetails.email,
              name: `${customerDetails.firstName} ${customerDetails.lastName}`,
              firstName: customerDetails.firstName,
              lastName: customerDetails.lastName,
              phone: customerDetails.phone,
              address: customerDetails.address,
              city: customerDetails.city,
              postalCode: customerDetails.postalCode,
            }}
            stripeApiKey={stripeApiKey}
            stripeStoreUrl={stripeStoreUrl}
            orderType={orderType}
            disabled={isSubmitting || items.length === 0}
          />
      </LinearGradient>
    </View>
  );

  // Wrap in StripeProvider if we have an API key
  if (stripeApiKey && paymentMethod === 'stripe') {
    return (
      <StripeProvider publishableKey={stripeApiKey}>
        <CheckoutContent />
      </StripeProvider>
    );
  }

  return <CheckoutContent />;
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
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerRight: {
    width: 40,
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
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(17,17,17,0.08)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.light.text,
  },
  orderTypeText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  paymentSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 16,
  },
  paymentOptions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  paymentMethodButton: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    borderRadius: 12,
  },
  paymentMethodButtonRight: {
    marginLeft: 12,
  },
  activePaymentMethod: {
    backgroundColor: '#fff',
  },
  inactivePaymentMethod: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  paymentMethodLabel: {
    fontWeight: '600',
  },
  errorContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    borderColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
    color: Colors.light.text,
  },
  backToMenuButton: {
    marginTop: 16,
  },
});
