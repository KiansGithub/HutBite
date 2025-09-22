/**
 * @fileoverview DeliverabilityChecker UI component
 * Provides a postcode input with real-time deliverability checking
 * Works in both React Native and Next.js/React environments
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useDeliverability, getDeliverabilityMessage, getDeliverabilityColor } from '@/hooks/useDeliverability';
import { Restaurant } from '@/types/deliverability';

interface DeliverabilityCheckerProps {
  restaurant: Restaurant;
  radiusMiles?: number;
  initialPostcode?: string;
  onDeliverabilityChange?: (deliverable: boolean, postcode: string) => void;
  placeholder?: string;
  style?: any;
  disabled?: boolean;
}

/**
 * DeliverabilityChecker component with postcode input and status display
 * @param restaurant - Restaurant location coordinates
 * @param radiusMiles - Delivery radius in miles (default: 3)
 * @param initialPostcode - Initial postcode value
 * @param onDeliverabilityChange - Callback when deliverability status changes
 * @param placeholder - Input placeholder text
 * @param style - Custom styles for the container
 * @param disabled - Whether the input is disabled
 * 
 * @example
 * <DeliverabilityChecker
 *   restaurant={{ lat: 51.69432, lon: -0.03441 }}
 *   radiusMiles={3}
 *   onDeliverabilityChange={(deliverable, postcode) => {
 *     console.log(`${postcode} is ${deliverable ? 'deliverable' : 'not deliverable'}`);
 *   }}
 * />
 */
export const DeliverabilityChecker: React.FC<DeliverabilityCheckerProps> = ({
  restaurant,
  radiusMiles = 3,
  initialPostcode = '',
  onDeliverabilityChange,
  placeholder = 'Enter your postcode',
  style,
  disabled = false
}) => {
  const [postcode, setPostcode] = useState(initialPostcode);
  const { status, data, error, check, isLoading } = useDeliverability(restaurant, radiusMiles);

  // Update postcode when initialPostcode changes
  useEffect(() => {
    setPostcode(initialPostcode);
    if (initialPostcode) {
      check(initialPostcode);
    }
  }, [initialPostcode, check]);

  // Notify parent component when deliverability changes
  useEffect(() => {
    if (onDeliverabilityChange && status !== 'idle' && status !== 'checking') {
      onDeliverabilityChange(status === 'ok', postcode);
    }
  }, [status, postcode, onDeliverabilityChange]);

  const handlePostcodeChange = (text: string) => {
    setPostcode(text);
    check(text);
  };

  const statusMessage = getDeliverabilityMessage(status, data, error);
  const statusColor = getDeliverabilityColor(status);

  const renderStatusIcon = () => {
    switch (status) {
      case 'checking':
        return (
          <ActivityIndicator 
            size="small" 
            color={Colors.light.primary} 
            style={styles.statusIcon}
          />
        );
      case 'ok':
        return (
          <Ionicons 
            name="checkmark-circle" 
            size={20} 
            color={statusColor} 
            style={styles.statusIcon}
          />
        );
      case 'out_of_range':
        return (
          <Ionicons 
            name="warning" 
            size={20} 
            color={statusColor} 
            style={styles.statusIcon}
          />
        );
      case 'invalid':
      case 'error':
        return (
          <Ionicons 
            name="close-circle" 
            size={20} 
            color={statusColor} 
            style={styles.statusIcon}
          />
        );
      default:
        return null;
    }
  };

  const renderStatusBadge = () => {
    if (status === 'idle' || !statusMessage) {
      return null;
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
        {renderStatusIcon()}
        <Text style={[styles.statusText, { color: statusColor }]}>
          {statusMessage}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            disabled && styles.disabledInput,
            status === 'ok' && styles.successInput,
            (status === 'invalid' || status === 'error') && styles.errorInput,
            (status === 'out_of_range') && styles.warningInput
          ]}
          value={postcode}
          onChangeText={handlePostcodeChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.light.tabIconDefault}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!disabled}
          maxLength={8} // UK postcodes are max 8 characters
          // React Native specific props (guarded for web compatibility)
          {...(Platform.OS !== 'web' && {
            textContentType: 'postalCode' as any,
            keyboardType: 'default' as any,
          })}
        />
        
        {/* Input status indicator */}
        <View style={styles.inputStatusContainer}>
          {isLoading && (
            <ActivityIndicator 
              size="small" 
              color={Colors.light.primary} 
            />
          )}
          {!isLoading && status === 'ok' && (
            <Ionicons 
              name="checkmark-circle" 
              size={20} 
              color={statusColor} 
            />
          )}
          {!isLoading && (status === 'invalid' || status === 'error' || status === 'out_of_range') && (
            <Ionicons 
              name={status === 'out_of_range' ? 'warning' : 'close-circle'} 
              size={20} 
              color={statusColor} 
            />
          )}
        </View>
      </View>

      {/* Status message badge */}
      {renderStatusBadge()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingRight: 50, // Space for status icon
    fontSize: 16,
    backgroundColor: Colors.light.background,
    color: Colors.light.text,
    // Web-specific styles
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none' as any,
    }),
  },
  disabledInput: {
    backgroundColor: Colors.light.card,
    color: Colors.light.tabIconDefault,
  },
  successInput: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  errorInput: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  warningInput: {
    borderColor: '#F59E0B',
    borderWidth: 2,
  },
  inputStatusContainer: {
    position: 'absolute',
    right: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  statusIcon: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});

export default DeliverabilityChecker;
