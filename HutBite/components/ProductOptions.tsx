import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
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

export const ProductOptions: React.FC<ProductOptionsProps> = ({
  options,
  filteredOptions,
  selections,
  onOptionSelect,
}) => {
  if (!options.groups || options.groups.length === 0) return null;

  return (
    <View style={styles.container}>
      {options.groups.map((group) => {
        const displayOptions =
          filteredOptions && filteredOptions[group.key]
            ? filteredOptions[group.key]
            : group.options;

        if (displayOptions.length === 0) return null;

        return (
          <View key={group.key} style={styles.groupContainer}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>{group.key}</Text>
              {group.isRequired && <Text style={styles.requiredText}>Required</Text>}
            </View>

            <View>
              {displayOptions.map((option) => {
                const isSelected = String(selections[group.key] ?? '') === String(option.ID);
                return (
                  <TouchableRipple
                    key={option.ID}
                    onPress={() => onOptionSelect(group.key, option.ID)}
                    rippleColor={`${lightColors.primary}1A`} // subtle ripple
                    borderless={false}
                  >
                    <View
                      style={[
                        styles.optionContainer,
                        isSelected && styles.optionSelected, // only changes border color now
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionName,
                          isSelected && styles.optionNameSelected, // slight weight only; keeps text color
                        ]}
                        numberOfLines={2}
                      >
                        {option.Name}
                      </Text>

                      <View
                        style={[
                          styles.radioButton,
                          isSelected && styles.radioButtonSelected, // purple fill
                        ]}
                      >
                        {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
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
  container: { width: '100%' },

  groupContainer: { marginBottom: 20 },

  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: lightColors.text,
    letterSpacing: -0.2,
  },

  requiredText: {
    fontSize: 11,
    fontWeight: '500',
    color: lightColors.primary,
    backgroundColor: `${lightColors.primary}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },

  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 6,
    gap: 10,
  },

  // Selected state: subtle border emphasis
  optionSelected: {
    borderColor: lightColors.primary,
    borderWidth: 1,
  },

  optionName: {
    flex: 1,
    fontSize: 15,
    color: lightColors.text,
    lineHeight: 20,
  },

  // Minimal emphasis for selected state
  optionNameSelected: {
    fontWeight: '500',
  },

  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Clean selected state
  radioButtonSelected: {
    backgroundColor: lightColors.primary,
    borderColor: lightColors.primary,
  },
});
