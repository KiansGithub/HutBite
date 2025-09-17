import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import RestaurantMenuView from '@/components/RestaurantMenuView';

export default function MenuScreen() {
  const { storeId } = useLocalSearchParams<{ storeId?: string }>();
  return <RestaurantMenuView storeId={storeId} />;
}