import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Platform, Text } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { useStripe } from '@stripe/stripe-react-native';
import { useBasket } from '@/contexts/BasketContext';
import { submitOrder, formatOrderData } from '@/services/orderService';
import { createPaymentIntent } from '@/services/payment';
import Constants from 'expo-constants';
import { OrderType } from '@/types/store';
import * as Linking from 'expo-linking';

interface StripePaymentProps {
    onPaymentSuccess: () => void; 
    onPaymentError: (error: string) => void; 
    onValidateBeforePayment?: () => boolean;
    customerDetails: {
        email: string; 
        name: string; 
        firstName: string; 
        lastName: string; 
        phone: string; 
        address: string; 
        city: string; 
        postalCode: string; 
    };
    stripeApiKey: string; 
    stripeStoreUrl: string; 
    orderType: OrderType; 
    disabled?: boolean; 
}

export const StripePayment: React.FC<StripePaymentProps> =({
    onPaymentSuccess, 
    onPaymentError, 
    onValidateBeforePayment,
    customerDetails,
    stripeApiKey, 
    stripeStoreUrl, 
    orderType = 'DELIVERY' as OrderType,
    disabled = false, 
}) => {
    const [orderSubmitting, setOrderSubmitting] = useState(false);
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const { total, items } = useBasket();
    const theme = useTheme();

    const [loading, setLoading] = useState(false);
    const [paymentSheetInitialized, setPaymentSheetInitialized] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Use one currency everywhere (UI shows GBP)
    const CURRENCY = 'gbp' as const;

    // Safely convert totals like "8.90", "£8.90", "8.90 GBP" → minor units (e.g., 890)
    const toMinorUnits = (val: string | number, currency: string = CURRENCY) => {
        const cleaned = typeof val === 'number' ? String(val) : val.replace(/[^0-9.-]+/g, '');
        const float = Number.parseFloat(cleaned);
        if (!Number.isFinite(float) || float <= 0) return 0;

        // GBP/EUR use 2 decimals; handle 0-decimal currencies if needed
        const zeroDecimal = /^(jpy|krw|clp|vnd|xaf|xof|xpf)$/i.test(currency);
        const factor = zeroDecimal ? 1 : 100;
        return Math.round(float * factor);
    };
    
    // Define thereturn URL for Stripe Payment Flow 
    // Check if running in expo go 
    const isRunningInExpo = Constants.executionEnvironment === 'storeClient';

    // For Expo Go, use the Expo URL scheme 
    const appScheme = isRunningInExpo 
        ? `exp`
        : (Constants.manifest?.scheme || 'hutbite');
    
    const returnUrl = Linking.createURL('payment-result');
    console.log('Return URL for Stripe:', returnUrl);
    
    console.log('StripeStoreUrl in pyment : ', stripeStoreUrl);
    console.log('StripeApiKey in  payment : ', stripeApiKey)

    // Initialize the payment sheet 
    const initializePaymentSheet = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage(null);

            if (!stripeApiKey) {
                throw new Error('Stripe API key is missing');
            }

            if (!stripeStoreUrl) {
                throw new Error('Stripe store URL is missing');
            }

            const amountInt = toMinorUnits(total, CURRENCY);
            if (!amountInt) {
                throw new Error(`Invalid amount: "${total}"`);
            }
            const { clientSecret } = await createPaymentIntent(
                { amount: amountInt, currency: CURRENCY },
                stripeStoreUrl
            );

            // Initialize the payment sheet 
            const { error } = await initPaymentSheet({
                merchantDisplayName: 'TGF Pizza',
                paymentIntentClientSecret: clientSecret, 
                allowsDelayedPaymentMethods: false, 
                returnURL: returnUrl
            });

            if (error) {
                throw new Error(error.message);
            }

            setPaymentSheetInitialized(true);
        } catch (error) {
            console.error('Error initializing payment sheet:', error);
            setErrorMessage(error instanceof Error ? error.message : 'Failed to initialize payment');
            onPaymentError(error instanceof Error ? error.message : 'Failed to initialize payment');
        } finally {
            setLoading(false);
        }
    }, [stripeApiKey, stripeStoreUrl, total, items, customerDetails, initPaymentSheet, onPaymentError]);

    // Present the payment sheet to the user 
    const handlePayment = async () => {
        try {
            setLoading(true);
            setErrorMessage(null);

            console.log('🔍 STRIPE PAYMENT - Starting payment process');
            console.log('🛒 Basket items count:', items.length);
            console.log('🛒 Basket total:', total);
            console.log('🛒 Basket items detail:', JSON.stringify(items, null, 2));
 
            if (!items || items.length === 0) {
                console.error('❌ STRIPE PAYMENT - Basket is empty at payment start');
                onPaymentError('Your basket is empty. Please add items before checkout.');
                setLoading(false);
                return;
            }

            // Validate before proceeding with payment
            if (onValidateBeforePayment && !onValidateBeforePayment()) {
                setLoading(false);
                return;
            }

            if (!paymentSheetInitialized) {
                await initializePaymentSheet();
            }

            const { error } = await presentPaymentSheet();

            const presentResult = await presentPaymentSheet();
            if (presentResult?.error) {
                if (presentResult.error.code === 'Canceled') {
                    setErrorMessage('Payment canceled');
                    return;
                }
                throw new Error(presentResult.error.message);
            }

            // Payment successful, now submit the order 
            setOrderSubmitting(true);

            // Create payment details object 
            const paymentDetails = {
                paymentMethod: 'Stripe',
                paymentId: `stripe_${Date.now()}`,
                amount: `${parseFloat(total).toFixed(2)} GBP`
            };

            // Format order data 
            const orderData = formatOrderData(
                items, 
                {
                    firstName: customerDetails.firstName, 
                    lastName: customerDetails.lastName, 
                    email: customerDetails.email, 
                    phone: customerDetails.phone, 
                    address: customerDetails.address, 
                    city: customerDetails.city, 
                    postalCode: customerDetails.postalCode, 
                },
                paymentDetails, 
                orderType, 
                'store-1',
                total
            );

            // Submit the order 
            const orderResult = await submitOrder(orderData, stripeStoreUrl);

            setOrderSubmitting(false);

            orderResult.success ? onPaymentSuccess() : onPaymentError(orderResult.error || 'Order submission failed');
        } catch (error) {
            console.error("Payment error:", error);
            setErrorMessage(error instanceof Error ? error.message : 'Payment failed');
            onPaymentError(error instanceof Error ? error.message : 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    // Initialize payment sheet when component mounts 
    useEffect(() => {
        if (stripeApiKey && stripeStoreUrl && !paymentSheetInitialized && !loading) {
            initializePaymentSheet();
        }
    }, [stripeApiKey, stripeStoreUrl, paymentSheetInitialized, loading, initializePaymentSheet]);

    return (
        <View style={styles.container} testID="stripe-payment">
            {errorMessage && (
                <Text style={styles.errorText} testID="payment-error">
                    {errorMessage}
                </Text>
            )}

            <Button 
              mode="contained"
              onPress={handlePayment}
              loading={loading}
              disabled={disabled || loading || !stripeApiKey || orderSubmitting}
              style={styles.payButton}
              testID="pay-button"
            >
                {loading ? 'Processing' : 'Pay with Card'}
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%' },
    errorText: { color: 'red', marginBottom: 12, textAlign: 'center'},
    payButton: {  height: 48, justifyContent: 'center', borderRadius: 10 },
});