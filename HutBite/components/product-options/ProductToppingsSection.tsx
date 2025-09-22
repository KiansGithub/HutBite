import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProductToppings } from '@/components/ProductToppings';
import { IToppingSelection, ITopping } from '@/types/toppings';
import Colors from '@/constants/Colors';

const lightColors = Colors.light;

interface ProductToppingsSectionProps {
  toppings: ITopping[];
  hasToppings: boolean;
  toppingSelections: IToppingSelection[];
  onToppingsChange: (selections: IToppingSelection[]) => void;
  maxAllowedToppings?: number;
}

export function ProductToppingsSection({
  toppings,
  hasToppings,
  toppingSelections,
  onToppingsChange,
  maxAllowedToppings = 9,
}: ProductToppingsSectionProps) {
  if (!hasToppings || !toppings?.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ProductToppings
        toppings={toppings}
        onToppingsChange={onToppingsChange}
        initialSelections={toppingSelections}
        maxAllowedToppings={maxAllowedToppings}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightColors.background,
    paddingVertical: 8,
  },
});
