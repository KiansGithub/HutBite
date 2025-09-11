// app/(main)/restaurant/[id]/menu.tsx
import React from 'react';
import RestaurantMenuView from '@/components/RestaurantMenuView';
import { useLocalSearchParams } from 'expo-router';

export default function RestaurantMenuScreen() {
  // We accept the id (for future use/analytics), but the view fetches menu from your API config.
  const { id, itemId } = useLocalSearchParams<{ id: string; itemId?: string }>();
  return <RestaurantMenuView initialMenuItem={undefined} />;
}
    