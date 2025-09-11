// app/(main)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { StoreProvider } from '@/contexts/StoreContext';
import { BasketProvider } from '@/contexts/BasketContext';
import { CheckoutProvider } from '@/contexts/CheckoutContext';

export default function MainLayout() {
  return (
    <StoreProvider>
      <BasketProvider>
        <CheckoutProvider>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Tabs root */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Flow screens OUTSIDE tabs */}
            <Stack.Screen name="restaurant/[id]/menu" options={{ presentation: 'fullScreenModal', headerShown: false }} />
            <Stack.Screen name="basket" options={{ headerShown: false }} />
            <Stack.Screen name="checkout" options={{ headerShown: false }} />
            <Stack.Screen name="edit-address" options={{ headerShown: false }} />
            <Stack.Screen name="edit-building-details" options={{ headerShown: false }} />
            <Stack.Screen name="edit-delivery-instructions" options={{ headerShown: false }} />
            <Stack.Screen name="edit-phone-number" options={{ headerShown: false }} />

            {/* Non-tab details */}
            <Stack.Screen name="restaurant/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="menu/[id]" options={{ headerShown: false }} />
          </Stack>
        </CheckoutProvider>
      </BasketProvider>
    </StoreProvider>
  );
}
