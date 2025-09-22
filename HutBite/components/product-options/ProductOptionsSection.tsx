import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProductOptions } from '@/components/ProductOptions';
import { IOptionSelections } from '@/types/productOptions';
import Colors from '@/constants/Colors';

const lightColors = Colors.light;

interface ProductOptionsSectionProps {
  processedOptions: any;
  selections: IOptionSelections;
  onOptionSelect: (optionListName: string, value: string) => void;
}

export function ProductOptionsSection({
  processedOptions,
  selections,
  onOptionSelect,
}: ProductOptionsSectionProps) {
  if (!processedOptions?.groups?.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ProductOptions
        options={processedOptions}
        selections={selections}
        onOptionSelect={onOptionSelect}
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
