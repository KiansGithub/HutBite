import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Text } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useCheckout } from '@/contexts/CheckoutContext';
import { useStore } from '@/contexts/StoreContext';
import { addressyFind, buildFromFindAddress, normalizePostcode, outwardCode } from '@/services/addressService';
import { AddressySuggestion } from '@/types/addressy';
import { useDeliverability } from '@/hooks/useDeliverability';
import { Restaurant } from '@/types/deliverability';
import debounce from 'lodash.debounce';

const EditAddressScreen = () => {
  const insets = useSafeAreaInsets();
  const { 
    setAddressDetails, 
    addressDetails,
    deliverabilityStatus,
    deliverabilityChecked,
    restaurant,
    setDeliverabilityStatus,
    setDeliverabilityChecked,
    setRestaurant
  } = useCheckout();
  const { storeInfo } = useStore();

  // Single text input for everything (postcode, street, full address)
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [containerStack, setContainerStack] = useState<string | undefined>(undefined); // drill-down container
  const [addressSelected, setAddressSelected] = useState(false); // Track if address was properly selected

  // Initialize restaurant from store info
  useEffect(() => {
    if (storeInfo?.latitude && storeInfo?.longitude && !restaurant) {
      const restaurantData: Restaurant = {
        lat: parseFloat(storeInfo.latitude),
        lon: parseFloat(storeInfo.longitude)
      };
      setRestaurant(restaurantData);
      console.log('Restaurant set from storeInfo:', restaurantData);
    }
  }, [storeInfo, restaurant, setRestaurant]);

  // Background deliverability checking hook
  const deliverabilityHook = useDeliverability(
    restaurant || { lat: 0, lon: 0 }, 
    3 // 3 mile radius
  );

  // Initialize with existing address if available
  useEffect(() => {
    if (addressDetails.address || addressDetails.city || addressDetails.postalCode) {
      const existingAddress = [addressDetails.address, addressDetails.city, addressDetails.postalCode]
        .filter(Boolean)
        .join(', ');
      setQuery(existingAddress);
      setAddressSelected(true); // Mark as selected if we have existing address details
      
      // Trigger background deliverability check if we have a postcode
      if (addressDetails.postalCode && restaurant) {
        console.log('Triggering initial deliverability check for:', addressDetails.postalCode);
        deliverabilityHook.check(addressDetails.postalCode);
      }
    }
  }, []);

  // Monitor deliverability hook status and update checkout context
  useEffect(() => {
    console.log('Deliverability hook status changed:', {
      status: deliverabilityHook.status,
      isLoading: deliverabilityHook.isLoading,
      data: deliverabilityHook.data
    });

    if (deliverabilityHook.status !== 'idle' && deliverabilityHook.status !== 'checking') {
      setDeliverabilityChecked(true);
      
      if (deliverabilityHook.status === 'ok') {
        setDeliverabilityStatus('ok');
        console.log(' Deliverability check passed');
      } else {
        setDeliverabilityStatus(deliverabilityHook.status);
        console.log(' Deliverability check failed:', deliverabilityHook.status);
      }
    }
  }, [deliverabilityHook.status, deliverabilityHook.isLoading, setDeliverabilityChecked, setDeliverabilityStatus]);

  const runFind = useCallback(async (text: string, container?: string) => {
    if (!text || text.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    const res = await addressyFind(text.trim(), container);
    setSuggestions(res);
    setLoading(false);
  }, []);

  const debouncedFind = useMemo(() => debounce(runFind, 280), [runFind]);

  useEffect(() => {
    debouncedFind(query, containerStack);
  }, [query, containerStack, debouncedFind]);

  const handleSuggestionPress = async (item: AddressySuggestion) => {
    // Drill-down container if not yet a full address
    if (item.Type !== 'Address') {
      setContainerStack(item.Id);
      setAddressSelected(false);
      return;
    }
  
    // 👉 Build a usable address from Find's Address item
    const details = buildFromFindAddress(item);
    if (!details) {
      Alert.alert('Address selection', 'Please choose a complete address from the list.');
      setAddressSelected(false);
      return;
    }
  
    const { line1, line2, line3, city, postalCode } = details;
  
    if (!line1 || !postalCode) {
      Alert.alert(
        'Address lookup',
        'We could not extract a full address or postcode. Please try another suggestion or enter it manually.'
      );
      setAddressSelected(false);
      return;
    }
  
    const addressParts = [line1, line2, line3].filter(Boolean);
    const fullAddress = addressParts.join(', ');
    const display = [fullAddress, city, postalCode].filter(Boolean).join(', ');
  
    // Show in input
    setQuery(display);
    setAddressSelected(true);
  
    // Persist to checkout context
    setAddressDetails({
      address: fullAddress,
      city,
      postalCode,
    });
  
    // Ensure restaurant coords exist
    if (!restaurant && storeInfo?.latitude && storeInfo?.longitude) {
      const restaurantData: Restaurant = {
        lat: parseFloat(storeInfo.latitude),
        lon: parseFloat(storeInfo.longitude),
      };
      setRestaurant(restaurantData);
      console.log('Restaurant set during address selection:', restaurantData);
    }
  
    // Kick off deliverability if we have postcode & restaurant
    if (postalCode && (restaurant || (storeInfo?.latitude && storeInfo?.longitude))) {
      const pc = postalCode.toUpperCase().replace(/\s+/, ' ');
      console.log('Starting automatic deliverability check for:', pc);
      deliverabilityHook.check(pc);
    }
  
    // Clear suggestions
    setSuggestions([]);
  };

  const handleBackContainer = () => {
    // Reset container drill-down (go up one level). For simplicity, jump to root:
    setContainerStack(undefined);
    setSuggestions([]);
    if (query) runFind(query);
    setAddressSelected(false); // Reset address selection state
  };

  const handleSaveAddress = () => {
    // Only allow saving if a proper address was selected and deliverability check passed (for delivery orders)
    if (!addressSelected) {
      Alert.alert(
        'Address Required',
        'Please select a complete address from the suggestions.'
      );
      return;
    }

    if (deliverabilityStatus !== 'ok' && deliverabilityChecked) {
      Alert.alert(
        'Delivery Check Required',
        'Please ensure your address is within our delivery area before continuing.'
      );
      return;
    }

    router.back();
  };

  const canSave = addressSelected && (deliverabilityChecked ? 
    (deliverabilityStatus === 'ok') : 
    true);

  console.log('Save button state:', {
    addressSelected,
    deliverabilityStatus,
    deliverabilityChecked,
    canSave
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="close" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Address</Text>
        <TouchableOpacity 
          onPress={handleSaveAddress} 
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          disabled={!canSave}
        >
          <Text style={[styles.saveButtonText, !canSave && styles.saveButtonTextDisabled]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Start typing your address or postcode"
          autoCapitalize="characters"
          value={query}
          onChangeText={setQuery}
        />

        {containerStack && (
          <TouchableOpacity onPress={handleBackContainer} style={styles.breadcrumb}>
            <Ionicons name="chevron-back" size={18} color={Colors.light.primary} />
            <Text style={{ color: Colors.light.primary }}>Back to wider results</Text>
          </TouchableOpacity>
        )}

        {loading && <ActivityIndicator style={{ marginVertical: 10 }} />}

        {suggestions.length > 0 && (
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={suggestions}
            keyExtractor={(it) => it.Id}
            style={styles.suggestions}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSuggestionPress(item)} style={styles.suggestionItem}>
                <Text>
                  {item.Text}
                  {item.Description ? `, ${item.Description}` : ''}
                </Text>
                <Text style={styles.typePill}>{item.Type}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Background Deliverability Status Display */}
        {addressSelected && addressDetails.postalCode && (
          <View style={styles.deliverabilitySection}>
            <Text style={styles.sectionTitle}>Delivery Area Status</Text>
            
            {deliverabilityHook.isLoading && (
              <View style={styles.statusMessage}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
                <Text style={styles.statusText}>Checking delivery area...</Text>
              </View>
            )}
            
            {deliverabilityStatus === 'ok' && deliverabilityChecked && (
              <View style={styles.successMessage}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.successText}>
                  Great! We deliver to this area.
                  {deliverabilityHook.data && ` (${deliverabilityHook.data.distance_miles.toFixed(1)} miles away)`}
                </Text>
              </View>
            )}
            
            {deliverabilityStatus === 'out_of_range' && deliverabilityChecked && (
              <View style={styles.errorMessage}>
                <Ionicons name="warning" size={20} color="#F59E0B" />
                <Text style={styles.errorText}>
                  This address is outside our delivery area.
                  {deliverabilityHook.data && ` (${deliverabilityHook.data.distance_miles.toFixed(1)} miles away, max 3 miles)`}
                </Text>
              </View>
            )}
            
            {(deliverabilityStatus === 'invalid' || deliverabilityStatus === 'error') && deliverabilityChecked && (
              <View style={styles.errorMessage}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
                <Text style={styles.errorText}>
                  {deliverabilityStatus === 'invalid' 
                    ? 'Please enter a valid postcode' 
                    : 'Unable to verify delivery area. Please try again.'}
                </Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.powered}>Suggestions powered by Addressy</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.light.border,
  },
  iconButton: { padding: 8 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  saveButton: {
    padding: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  saveButtonTextDisabled: {
    color: '#666',
  },
  formContainer: { padding: 20 },
  input: {
    backgroundColor: '#f0f0f0', borderRadius: 10, padding: 15, fontSize: 16,
  },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  suggestions: {
    backgroundColor: '#fff', borderRadius: 10, marginTop: 10, maxHeight: 280,
    borderColor: '#eee', borderWidth: 1,
  },
  suggestionItem: {
    padding: 14, borderBottomWidth: 1, borderBottomColor: '#eee',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  typePill: {
    fontSize: 12, opacity: 0.6,
  },
  powered: { marginTop: 10, fontSize: 12, opacity: 0.6 },
  deliverabilitySection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: 'bold', marginBottom: 10,
  },
  statusMessage: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12,
    backgroundColor: '#f0f0f0', borderRadius: 10,
  },
  statusText: {
    fontSize: 14, color: Colors.light.text,
  },
  successMessage: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12,
    backgroundColor: '#f0f9ff', borderRadius: 10, borderWidth: 1, borderColor: '#10B981',
  },
  successText: {
    fontSize: 14, color: '#10B981', flex: 1,
  },
  errorMessage: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12,
    backgroundColor: '#fef2f2', borderRadius: 10, borderWidth: 1, borderColor: '#F59E0B',
  },
  errorText: {
    fontSize: 14, color: '#EF4444', flex: 1,
  },
});

export default EditAddressScreen;
