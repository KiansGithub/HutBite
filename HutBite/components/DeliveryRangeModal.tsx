import React from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { Database } from '@/lib/supabase.d';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

const { width: W } = Dimensions.get('window');

interface DeliveryRangeModalProps {
  visible: boolean;
  restaurant: Restaurant | null;
  distance?: number;
  onClose: () => void;
  onContinueAnyway: () => void;
}

export const DeliveryRangeModal: React.FC<DeliveryRangeModalProps> = ({
  visible,
  restaurant,
  distance,
  onClose,
  onContinueAnyway,
}) => {
  if (!restaurant) return null;

  const distanceText = distance ? `${distance.toFixed(1)} miles` : 'outside our delivery area';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name="location-outline" 
                    size={32} 
                    color={Colors.light.primary} 
                  />
                </View>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.content}>
                <Text style={styles.title}>Delivery Not Available</Text>
                
                <Text style={styles.description}>
                  <Text style={styles.restaurantName}>{restaurant.name}</Text> is {distanceText} away and doesn't deliver to your current location.
                </Text>

                <Text style={styles.suggestion}>
                  However, <Text style={styles.highlight}>collection is still available</Text>, or you can enter a different delivery address during checkout if you'd like to proceed.
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={styles.secondaryButton}
                  onPress={onClose}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={onContinueAnyway}
                >
                  <Text style={styles.primaryButtonText}>Continue Anyway</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: Math.min(W - 40, 400),
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 0,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.light.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4a4a4a',
    textAlign: 'center',
    marginBottom: 16,
  },
  restaurantName: {
    fontWeight: '600',
    color: Colors.light.primary,
  },
  suggestion: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  highlight: {
    fontWeight: '600',
    color: Colors.light.primary,
    fontStyle: 'normal',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
