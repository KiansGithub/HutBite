import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { RadioButton, Text, TouchableRipple } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

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
            <View>
              {displayOptions.map((option) => {
                const isSelected = selections[group.key] === option.ID;
                return (
                  <TouchableRipple key={option.ID} onPress={() => onOptionSelect(group.key, option.ID)}>
                    <View style={[styles.optionContainer, isSelected && styles.optionSelected]}>
                      <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>{option.Name}</Text>
                      <View style={[styles.radioButtonContainer, isSelected && styles.radioButtonSelected]}>
                        {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
                      </View>
                    </View>
                  </TouchableRipple>
                );
              })}
            </View>
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
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 20,
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: lightColors.border,
    borderRadius: 12,
    marginBottom: 10,
  },
  optionSelected: {
    backgroundColor: lightColors.primary,
    borderColor: lightColors.primary,
  },
  optionName: {
    fontSize: 16,
    color: lightColors.text,
    flex: 1,
  },
  optionNameSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  radioButtonContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: lightColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: lightColors.primary,
    borderColor: '#fff',
  },
});