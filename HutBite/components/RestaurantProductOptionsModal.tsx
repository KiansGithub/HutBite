import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { IBaseProduct } from '@/types/store';

const colors = Colors.light;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ProductOption {
  id: string;
  name: string;
  price?: number;
  selected?: boolean;
}

interface ProductOptionGroup {
  id: string;
  name: string;
  required?: boolean;
  multiSelect?: boolean;
  options: ProductOption[];
}

interface RestaurantProductOptionsModalProps {
  visible: boolean;
  onDismiss: () => void;
  product: IBaseProduct;
  onConfirm: (selections: any) => void;
  imageUrl?: string;
}

export function RestaurantProductOptionsModal({
  visible,
  onDismiss,
  product,
  onConfirm,
  imageUrl,
}: RestaurantProductOptionsModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);

  // Mock option groups - in real implementation, these would come from product.DeGroupedPrices
  const optionGroups: ProductOptionGroup[] = [
    {
      id: 'size',
      name: 'Size',
      required: true,
      multiSelect: false,
      options: [
        { id: 'small', name: 'Small', price: 0 },
        { id: 'medium', name: 'Medium', price: 2.50 },
        { id: 'large', name: 'Large', price: 5.00 },
      ],
    },
    {
      id: 'toppings',
      name: 'Extra Toppings',
      required: false,
      multiSelect: true,
      options: [
        { id: 'cheese', name: 'Extra Cheese', price: 1.50 },
        { id: 'pepperoni', name: 'Pepperoni', price: 2.00 },
        { id: 'mushrooms', name: 'Mushrooms', price: 1.00 },
        { id: 'olives', name: 'Olives', price: 1.00 },
      ],
    },
  ];

  useEffect(() => {
    if (visible) {
      // Reset selections when modal opens
      setSelectedOptions({});
      setQuantity(1);
    }
  }, [visible]);

  const handleOptionSelect = (groupId: string, optionId: string) => {
    const group = optionGroups.find(g => g.id === groupId);
    if (!group) return;

    setSelectedOptions(prev => {
      const currentSelections = prev[groupId] || [];
      
      if (group.multiSelect) {
        // Toggle selection for multi-select groups
        if (currentSelections.includes(optionId)) {
          return {
            ...prev,
            [groupId]: currentSelections.filter(id => id !== optionId),
          };
        } else {
          return {
            ...prev,
            [groupId]: [...currentSelections, optionId],
          };
        }
      } else {
        // Single selection for radio groups
        return {
          ...prev,
          [groupId]: [optionId],
        };
      }
    });
  };

  const calculateTotalPrice = () => {
    let total = product.Price || 0;
    
    optionGroups.forEach(group => {
      const selections = selectedOptions[group.id] || [];
      selections.forEach(optionId => {
        const option = group.options.find(o => o.id === optionId);
        if (option?.price) {
          total += option.price;
        }
      });
    });
    
    return total * quantity;
  };

  const canConfirm = () => {
    // Check if all required groups have selections
    return optionGroups.every(group => {
      if (!group.required) return true;
      const selections = selectedOptions[group.id] || [];
      return selections.length > 0;
    });
  };

  const handleConfirm = () => {
    if (!canConfirm()) return;
    
    onConfirm({
      options: selectedOptions,
      quantity,
      totalPrice: calculateTotalPrice(),
    });
  };

  const renderOptionGroup = (group: ProductOptionGroup) => (
    <View key={group.id} style={styles.optionGroup}>
      <View style={styles.groupHeader}>
        <Text style={[styles.groupTitle, { color: colors.text }]}>
          {group.name}
        </Text>
        {group.required && (
          <Text style={[styles.requiredLabel, { color: colors.primary }]}>
            Required
          </Text>
        )}
      </View>
      
      {group.options.map(option => {
        const isSelected = (selectedOptions[group.id] || []).includes(option.id);
        
        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionItem,
              { borderBottomColor: colors.tabIconDefault + '20' },
              isSelected && { backgroundColor: colors.primary + '10' },
            ]}
            onPress={() => handleOptionSelect(group.id, option.id)}
          >
            <View style={styles.optionInfo}>
              <Text style={[styles.optionName, { color: colors.text }]}>
                {option.name}
              </Text>
              {option.price && option.price > 0 && (
                <Text style={[styles.optionPrice, { color: colors.text }]}>
                  +${option.price.toFixed(2)}
                </Text>
              )}
            </View>
            
            <View style={[
              styles.selectionIndicator,
              { borderColor: colors.primary },
              isSelected && { backgroundColor: colors.primary },
            ]}>
              {isSelected && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.tabIconDefault + '20' }]}>
          <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Customize Order
          </Text>
          
          <View style={styles.headerSpacer} />
        </View>

        {/* Product Info */}
        <View style={[styles.productInfo, { backgroundColor: colors.background }]}>
          {imageUrl && (
            <Image source={{ uri: imageUrl }} style={styles.productImage} />
          )}
          <View style={styles.productDetails}>
            <Text style={[styles.productName, { color: colors.text }]}>
              {product.Name}
            </Text>
            {product.Description && (
              <Text style={[styles.productDescription, { color: colors.text }]}>
                {product.Description}
              </Text>
            )}
          </View>
        </View>

        {/* Options */}
        <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
          {optionGroups.map(renderOptionGroup)}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.tabIconDefault + '20' }]}>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[styles.quantityButton, { backgroundColor: colors.primary }]}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Ionicons name="remove" size={20} color="#fff" />
            </TouchableOpacity>
            
            <Text style={[styles.quantityText, { color: colors.text }]}>
              {quantity}
            </Text>
            
            <TouchableOpacity
              style={[styles.quantityButton, { backgroundColor: colors.primary }]}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={[
              styles.confirmButton,
              { backgroundColor: canConfirm() ? colors.primary : colors.tabIconDefault },
            ]}
            onPress={handleConfirm}
            disabled={!canConfirm()}
          >
            <Text style={[styles.confirmButtonText, { color: '#fff' }]}>
              Add to Basket • ${calculateTotalPrice().toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  productInfo: {
    flexDirection: 'row',
    padding: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  optionGroup: {
    marginBottom: 24,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  requiredLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 4,
  },
  optionInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionName: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: 'center',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
