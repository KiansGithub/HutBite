import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import RestaurantMenuView from '@/components/RestaurantMenuView';

export default function MenuScreen() {
  const { id, storeId, cat_id, grp_id, pro_id, auto_add } = useLocalSearchParams<{ 
    id?: string;
    storeId?: string; 
    cat_id?: string;
    grp_id?: string; 
    pro_id?: string;
    auto_add?: string;
  }>();
  
  return (
    <RestaurantMenuView 
      restaurantId={id}
      storeId={storeId} 
      initialProductIds={cat_id && grp_id && pro_id ? {
        cat_id,
        grp_id, 
        pro_id,
        auto_add: auto_add === 'true'
      } : undefined}
    />
  );
}