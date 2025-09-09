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

  groupContainer: { marginBottom: 24 },

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
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: lightColors.border,
    backgroundColor: '#fff',       // stays white even when selected
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },

  // Selected state: only emphasize the border; no fill change
  optionSelected: {
    borderColor: lightColors.primary,
  },

  optionName: {
    flex: 1,
    fontSize: 16,
    color: lightColors.text,
  },

  // Slight emphasis but keep same color to avoid overwhelm
  optionNameSelected: {
    fontWeight: '600',
  },

  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: lightColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Purple pill with white checkmark
  radioButtonSelected: {
    backgroundColor: lightColors.primary,
    borderColor: lightColors.primary,
  },
});
