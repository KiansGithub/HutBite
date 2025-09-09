import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { RadioButton, HelperText, Text, TouchableRipple } from 'react-native-paper';

import { IProcessedProductOptions, IOptionSelections, IFilteredOptionGroups } from '@/types/productOptions';
import Colors from '@/constants/Colors';

const lightColors = Colors.light;

interface ProductOptionsProps {
  options: IProcessedProductOptions;
  filteredOptions?: IFilteredOptionGroups;
  selections: IOptionSelections;
  onOptionSelect: (groupKey: string, value: string) => void;
}

export const ProductOptions: React.FC<ProductOptionsProps> = ({ options, filteredOptions, selections, onOptionSelect }) => {
  if (!options.groups || options.groups.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {options.groups.map((group) => {
        const displayOptions =
          filteredOptions && filteredOptions[group.key]
            ? filteredOptions[group.key]
            : group.options;

        if (displayOptions.length === 0) {
          return null; // Don't render group if no options are available
        }

        return (
          <View key={group.key} style={styles.groupContainer}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>{group.key}</Text>
              {group.isRequired && <Text style={styles.requiredText}>Required</Text>}
            </View>
            <RadioButton.Group
              onValueChange={(value) => onOptionSelect(group.key, value)}
              value={selections[group.key]}
            >
              {displayOptions.map((option) => (
                <TouchableRipple key={option.ID} onPress={() => onOptionSelect(group.key, option.ID)}>
                  <View style={styles.optionContainer}>
                    <Text style={styles.optionName}>{option.Name}</Text>
                    <RadioButton.Android value={option.ID} color={lightColors.primary} />
                  </View>
                </TouchableRipple>
              ))}
            </RadioButton.Group>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  groupContainer: {
    marginBottom: 24,
    backgroundColor: lightColors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: lightColors.border,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: lightColors.text,
  },
  requiredText: {
    fontSize: 12,
    fontWeight: '500',
    color: lightColors.primary,
    backgroundColor: `${lightColors.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: lightColors.border,
  },
  optionName: {
    fontSize: 16,
    color: lightColors.text,
    flex: 1,
  },
});