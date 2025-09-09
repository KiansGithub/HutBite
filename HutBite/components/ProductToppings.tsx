import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, LayoutAnimation, Platform, UIManager, StyleSheet } from 'react-native';
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
      <TouchableRipple onPress={() => onChange(Math.max(0, value - 1))} style={styles.portionButton} borderless>
        <Ionicons name="remove-circle-outline" size={28} color={lightColors.tabIconDefault} />
      </TouchableRipple>
      <Text style={styles.portionValue}>{value}</Text>
      <TouchableRipple onPress={() => onChange(Math.min(3, value + 1))} style={styles.portionButton} borderless>
        <Ionicons name="add-circle" size={28} color={lightColors.primary} />
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

  if (!toppings || toppings.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {groupedToppings.map(({ groupInfo, toppings: groupToppings }) => (
        <View key={groupInfo.originalGroup} style={styles.toppingGroup}>
          <Text style={styles.toppingGroupTitle}>{groupInfo.originalGroup}</Text>
          {groupToppings.map((topping, index) => {
            const selection = selections.find((s) => s.id === topping.ID);
            const isLastItem = index === groupToppings.length - 1;
            return (
              <View
                key={topping.ID}
                style={[styles.toppingItem, isLastItem && styles.lastToppingItem]}
              >
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
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 16,
  },
  toppingGroup: {
    marginBottom: 24,
  },
  toppingGroupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: lightColors.text,
    marginBottom: 12,
  },
  toppingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: lightColors.border,
  },
  lastToppingItem: {
    borderBottomWidth: 0,
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
    borderRadius: 20,
    padding: 4,
  },
  portionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: lightColors.text,
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: 'center',
  },
});