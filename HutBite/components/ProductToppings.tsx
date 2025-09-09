import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Text, TouchableRipple, Checkbox } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { ITopping, IToppingSelection } from '@/types/toppings';
import { groupToppingsByDisplayGroup } from '@/utils/toppingGroupUtils';
import Colors from '@/constants/Colors';

const lightColors = Colors.light;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ProductToppingsProps {
  toppings: ITopping[];
  onToppingsChange: (selectedToppings: IToppingSelection[]) => void;
  initialSelections?: IToppingSelection[];
  maxAllowedToppings?: number;
}

const ToppingPortionControl = ({ value, onChange }) => {
  return (
    <View style={styles.portionControlContainer}>
      <TouchableRipple onPress={() => onChange(Math.max(0, value - 1))} style={styles.portionButton}>
        <Ionicons name="remove-circle-outline" size={26} color={lightColors.tabIconDefault} />
      </TouchableRipple>
      <Text style={styles.portionValue}>{value}</Text>
      <TouchableRipple onPress={() => onChange(Math.min(2, value + 1))} style={styles.portionButton}>
        <Ionicons name="add-circle" size={26} color={lightColors.primary} />
      </TouchableRipple>
    </View>
  );
};

export const ProductToppings: React.FC<ProductToppingsProps> = ({
  toppings,
  onToppingsChange,
  initialSelections = [],
}) => {
  const [selections, setSelections] = useState<IToppingSelection[]>(initialSelections);
  const [isExpanded, setIsExpanded] = useState(false);

  const groupedToppings = useMemo(() => groupToppingsByDisplayGroup(toppings), [toppings]);

  useEffect(() => {
    setSelections(initialSelections);
  }, [initialSelections]);

  useEffect(() => {
    onToppingsChange(selections);
  }, [selections, onToppingsChange]);

  const handlePortionChange = useCallback(
    (toppingId: string, newPortions: number) => {
      const topping = toppings.find((t) => t.ID === toppingId);
      if (!topping) return;

      setSelections((prev) => {
        const existingIndex = prev.findIndex((s) => s.id === toppingId);

        if (newPortions === 0) {
          if (existingIndex > -1) {
            return prev.filter((s) => s.id !== toppingId);
          }
          return prev;
        }

        if (existingIndex > -1) {
          const updatedSelections = [...prev];
          updatedSelections[existingIndex] = { ...updatedSelections[existingIndex], portions: newPortions };
          return updatedSelections;
        } else {
          return [...prev, { id: toppingId, name: topping.Name, portions: newPortions }];
        }
      });
    },
    [toppings]
  );

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const selectedCount = selections.reduce((acc, s) => acc + s.portions, 0);

  if (!toppings || toppings.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableRipple onPress={toggleExpand} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Add Toppings</Text>
            {selectedCount > 0 && (
              <Text style={styles.headerSubtitle}>{selectedCount} selected</Text>
            )}
          </View>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={lightColors.primary} />
        </View>
      </TouchableRipple>

      {isExpanded && (
        <View style={styles.toppingsList}>
          {groupedToppings.map(({ groupInfo, toppings: groupToppings }) => (
            <View key={groupInfo.originalGroup} style={styles.toppingGroup}>
              <Text style={styles.toppingGroupTitle}>{groupInfo.originalGroup}</Text>
              {groupToppings.map((topping) => {
                const selection = selections.find((s) => s.id === topping.ID);
                return (
                  <View key={topping.ID} style={styles.toppingItem}>
                    <Text style={styles.toppingName}>{topping.Name}</Text>
                    <ToppingPortionControl
                      value={selection ? selection.portions : 0}
                      onChange={(newPortions) => handlePortionChange(topping.ID, newPortions)}
                    />
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: lightColors.border,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: lightColors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: lightColors.tabIconDefault,
    marginTop: 2,
  },
  toppingsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  toppingGroup: {
    marginTop: 16,
  },
  toppingGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: lightColors.text,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: lightColors.border,
    paddingBottom: 8,
  },
  toppingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toppingName: {
    fontSize: 16,
    color: lightColors.text,
    flex: 1,
  },
  portionControlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portionButton: {
    padding: 4,
  },
  portionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: lightColors.text,
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
});