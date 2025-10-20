import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Platform, Text } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { useStripe } from '@stripe/stripe-react-native';
import { useBasket } from '@/contexts/BasketContext';
import { useStore } from '@/contexts/StoreContext';
import { useCheckout } from '@/contexts/CheckoutContext';
import { submitOrder, formatOrderData } from '@/services/orderService';
import { saveOrderToDatabase } from '@/services/orderDatabaseService';
import { createPaymentIntent } from '@/services/payment';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import { OrderType } from '@/types/store';
import * as Linking from 'expo-linking';
import { sendOrderNotification } from '@/services/smsNotificationService';

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
    disabled?: boolean; 
}

export const StripePayment: React.FC<StripePaymentProps> = ({
    onPaymentSuccess, 
    onPaymentError, 
    onValidateBeforePayment,
    customerDetails,
    stripeApiKey, 
    stripeStoreUrl, 
    disabled = false, 
}) => {
    const [orderSubmitting, setOrderSubmitting] = useState(false);
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const { total, items } = useBasket();
    const { nearestStoreId } = useStore();
    const { orderType } = useCheckout();
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
    
    // Define the return URL for Stripe Payment Flow 
    // Check if running in expo go 
    const isRunningInExpo = Constants.executionEnvironment === 'storeClient';
    
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

            // Get current user for order tracking
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || null;

            // Get store information
            const storeId = nearestStoreId || 'store-1'; // Fallback to default store
            const restaurantId = storeId; // Use store ID as restaurant ID for now

            // Create payment details object 
            const paymentDetails = {
                paymentMethod: 'Stripe',
                paymentId: `stripe_${Date.now()}`,
                amount: total // Use total as-is since it's already formatted as "£8.90"
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
                orderType.toUpperCase() as OrderType, 
                storeId,
                total
            );

            console.log('📦 ORDER DATA - Formatted order:', {
                orderId: orderData.order_id,
                storeId,
                restaurantId,
                total,
                itemCount: items.length,
                userId
            });

            // Submit the order to external API
            const orderResult = await submitOrder(orderData, stripeStoreUrl);

            console.log('🚀 ORDER SUBMISSION - Result:', orderResult);

            // Save order to database regardless of external API result
            // This ensures we have a record even if external submission fails
            const databaseResult = await saveOrderToDatabase(
                orderData,
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
                orderType.toUpperCase() as OrderType,
                storeId,
                restaurantId,
                total,
                orderResult,
                userId
            );

            console.log('💾 DATABASE SAVE - Result:', databaseResult);

            setOrderSubmitting(false);

            // Send SMS notification after successful order (non-blocking)
            if (orderResult.success && databaseResult.success) {
                // Send SMS notification in background
                const smsData = {
                    restaurant_name: 'HutBite',
                    customer_name: `${customerDetails.firstName} ${customerDetails.lastName}`.trim() || 'Guest',
                    customer_phone: '+447756811243', // Hardcoded for testing as requested
                    order_amount: total,
                    order_ref: orderData.order_id
                };

                // Send SMS in background - don't block order success
                sendOrderNotification(smsData)
                    .then(smsResult => {
                        if (smsResult.success) {
                            console.log('✅ SMS sent successfully');
                        } else {
                            console.error('❌ SMS failed:', smsResult.error);
                        }
                    })
                    .catch(smsError => {
                        console.error('❌ SMS error:', smsError);
                    });

                console.log('✅ ORDER SUCCESS - Payment completed and order saved');
                onPaymentSuccess();
            } else if (!orderResult.success) {
                console.error('❌ PAYMENT FAILED - External order submission failed:', orderResult.error);
                const errorMsg = orderResult.error || 'Payment processing failed';
                onPaymentError(errorMsg);
            } else if (!databaseResult.success) {
                console.error('❌ DATABASE SAVE FAILED - Order not recorded:', databaseResult.error);
                const errorMsg = 'Order could not be saved. Please contact support.';
                onPaymentError(errorMsg);
            }

        } catch (error) {
            console.error("Payment error:", error);
            setErrorMessage(error instanceof Error ? error.message : 'Payment failed');
            onPaymentError(error instanceof Error ? error.message : 'Payment failed');
        } finally {
            setLoading(false);
            setOrderSubmitting(false);
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
                {loading ? 'Processing' : 'Pay'}
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%' },
    errorText: { color: 'red', marginBottom: 12, textAlign: 'center'},
    payButton: {  height: 48, justifyContent: 'center', borderRadius: 10 },
});