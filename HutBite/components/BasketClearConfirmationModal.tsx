import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

const { width } = Dimensions.get('window');
const colors = Colors.light;

interface BasketClearConfirmationModalProps {
  visible: boolean;
  currentStoreName: string;
  newStoreName: string;
  itemCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BasketClearConfirmationModal({
  visible,
  currentStoreName,
  newStoreName,
  itemCount,
  onConfirm,
  onCancel,
}: BasketClearConfirmationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Warning Icon */}
          <View style={styles.iconContainer}>
            <Ionicons 
              name="warning" 
              size={48} 
              color={colors.warning || '#FF9500'} 
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Switch Restaurant?</Text>

          {/* Message */}
          <Text style={styles.message}>
            You have {itemCount} item{itemCount !== 1 ? 's' : ''} from{' '}
            <Text style={styles.storeName}>{currentStoreName}</Text> in your basket.
          </Text>
          
          <Text style={styles.submessage}>
            Switching to <Text style={styles.storeName}>{newStoreName}</Text> will clear your current basket.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Keep Basket</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.confirmButton]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>Switch Restaurant</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: width - 40,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  submessage: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  storeName: {
    fontWeight: '600',
    color: colors.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.lightGray || '#F5F5F5',
    borderWidth: 1,
    borderColor: colors.gray || '#E0E0E0',
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
});
