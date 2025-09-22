// app/(main)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { StoreProvider } from '@/contexts/StoreContext';
import { BasketProvider } from '@/contexts/BasketContext';
import { CheckoutProvider } from '@/contexts/CheckoutContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { PhoneVerificationProvider } from '@/contexts/PhoneVerificationContext';
import { BasketClearConfirmationProvider } from '@/contexts/BasketClearConfirmationContext';
import { DeliveryRangeProvider } from '@/contexts/DeliveryRangeContext';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function MainLayout() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <PhoneVerificationProvider>
          <ToastProvider>
            <BasketProvider>
              <CheckoutProvider>
                <BasketClearConfirmationProvider>
                  <DeliveryRangeProvider>
                    <Stack screenOptions={{ headerShown: false }}>
                      {/* Tabs root */}
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

                      {/* Flow screens OUTSIDE tabs */}
                      <Stack.Screen name="menu" options={{ headerShown: false, presentation: 'card' }} />
                      <Stack.Screen name="basket" options={{ headerShown: false, presentation: 'card' }} />
                      <Stack.Screen name="checkout" options={{ headerShown: false, presentation: 'card' }} />
                      <Stack.Screen name="payment-success" options={{ headerShown: false, presentation: 'card' }} />
                      <Stack.Screen name="edit-address" options={{ headerShown: false, presentation: 'card' }} />
                      <Stack.Screen name="edit-building-details" options={{ headerShown: false, presentation: 'card' }} />
                      <Stack.Screen name="edit-delivery-instructions" options={{ headerShown: false, presentation: 'card' }} />
                      <Stack.Screen name="edit-phone-number" options={{ headerShown: false, presentation: 'card' }} />

                      {/* Non-tab details */}
                      <Stack.Screen name="restaurant/[id]" options={{ headerShown: false }} />
                      <Stack.Screen name="menu/[id]" options={{ headerShown: false }} />
                    </Stack>
                  </DeliveryRangeProvider>
                </BasketClearConfirmationProvider>
              </CheckoutProvider>
            </BasketProvider>
          </ToastProvider>
        </PhoneVerificationProvider>
      </StoreProvider>
    </ErrorBoundary>
  );
}
