import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { IBasketItem } from '@/types/basket';

const lightColors = Colors.light;

interface PricingFooterProps {
  formattedPrice: string;
  canAddToBasket: boolean;
  isValid: boolean;
  isEditing: boolean;
  storeMessage?: string;
  onConfirm: () => void;
  existingItem?: IBasketItem;
}

export function PricingFooter({
  formattedPrice,
  canAddToBasket,
  isValid,
  isEditing,
  storeMessage,
  onConfirm,
  existingItem,
}: PricingFooterProps) {
  const getButtonText = () => {
    if (isEditing) {
      return 'Update Item';
    }
    return 'Add to Order';
  };

  const getButtonDisabled = () => {
    return !canAddToBasket || !isValid;
  };

  const getDisabledReason = () => {
    if (!canAddToBasket && storeMessage) {
      return storeMessage;
    }
    if (!isValid) {
      return 'Please select all required options';
    }
    return null;
  };

  const disabledReason = getDisabledReason();

  return (
    <View style={styles.container}>
      {disabledReason && (
        <View style={styles.messageContainer}>
          <Ionicons name="information-circle-outline" size={16} color={lightColors.warning} />
          <Text style={styles.messageText}>{disabledReason}</Text>
        </View>
      )}
      
      <View style={styles.footerContent}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total</Text>
          <Text style={styles.priceValue}>{formattedPrice}</Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.confirmButton,
            getButtonDisabled() && styles.confirmButtonDisabled,
          ]}
          onPress={onConfirm}
          disabled={getButtonDisabled()}
        >
          <Text style={[
            styles.confirmButtonText,
            getButtonDisabled() && styles.confirmButtonTextDisabled,
          ]}>
            {getButtonText()}
          </Text>
          {!getButtonDisabled() && (
            <Ionicons name="checkmark" size={20} color="white" style={styles.confirmIcon} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightColors.surface,
    borderTopWidth: 1,
    borderTopColor: lightColors.border,
    paddingBottom: 34, // Account for safe area
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: lightColors.warningBackground,
    borderBottomWidth: 1,
    borderBottomColor: lightColors.border,
  },
  messageText: {
    fontSize: 14,
    color: lightColors.warning,
    marginLeft: 8,
    flex: 1,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: lightColors.textSecondary,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: lightColors.text,
  },
  confirmButton: {
    backgroundColor: lightColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 140,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonDisabled: {
    backgroundColor: lightColors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  confirmButtonTextDisabled: {
    color: lightColors.textSecondary,
  },
  confirmIcon: {
    marginLeft: 8,
  },
});
