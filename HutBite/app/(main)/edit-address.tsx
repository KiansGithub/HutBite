import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Text } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useCheckout } from '@/contexts/CheckoutContext';
import { useStore } from '@/contexts/StoreContext';
import { addressyFind, addressyRetrieve, normalizePostcode, outwardCode } from '@/services/addressService';
import { AddressySuggestion } from '@/types/addressy';
import { DeliverabilityChecker } from '@/components/DeliverabilityChecker';
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
  const [showDeliverabilityCheck, setShowDeliverabilityCheck] = useState(false);
  const [addressSelected, setAddressSelected] = useState(false); // Track if address was properly selected

  // Initialize restaurant from store info
  useEffect(() => {
    if (storeInfo?.latitude && storeInfo?.longitude && !restaurant) {
      const restaurantData: Restaurant = {
        lat: parseFloat(storeInfo.latitude),
        lon: parseFloat(storeInfo.longitude)
      };
      setRestaurant(restaurantData);
    }
  }, [storeInfo, restaurant, setRestaurant]);

  // Initialize with existing address if available
  useEffect(() => {
    if (addressDetails.address || addressDetails.city || addressDetails.postalCode) {
      const existingAddress = [addressDetails.address, addressDetails.city, addressDetails.postalCode]
        .filter(Boolean)
        .join(', ');
      setQuery(existingAddress);
      setAddressSelected(true); // Mark as selected if we have existing address details
      
      // Show deliverability check if we have a postcode
      if (addressDetails.postalCode) {
        setShowDeliverabilityCheck(true);
      }
    }
  }, []);

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
    // If it's not a full address yet (e.g., Postcode/Street/Locality), drill down
    if (item.Type !== 'Address') {
      setContainerStack(item.Id); // next find() will search within this container
      setAddressSelected(false); // Reset address selection state
      return;
    }

    // Full Address → Retrieve full components
    const details = await addressyRetrieve(item.Id);
    if (!details) return;

    const line1 = (details.Line1 || '').trim();
    const line2 = (details.Line2 || '').trim();
    const line3 = (details.Line3 || '').trim();
    const city = (details.City || '').trim();
    const postalCode = (details.PostalCode || '').trim();
 
    // Build address string properly, avoiding leading commas
    const addressParts = [line1, line2, line3].filter(part => part.length > 0);
    const fullAddress = addressParts.join(', ');

    console.log('Setting address details in edit-address.tsx:', {
      address: fullAddress,
      city,
      postalCode,
    });

    // Update the query to show the selected address
    setQuery(`${fullAddress}, ${city}, ${postalCode}`);
    setAddressSelected(true); // Mark that a proper address was selected

    setAddressDetails({
      address: fullAddress,
      city,
      postalCode,
    });

    // Show deliverability check section
    setShowDeliverabilityCheck(true);
    
    // Clear suggestions
    setSuggestions([]);
  };

  const handleDeliverabilityChange = (deliverable: boolean, postcode: string) => {
    console.log('Deliverability changed in edit-address:', { deliverable, postcode });
    setDeliverabilityChecked(true);
    
    if (deliverable) {
      setDeliverabilityStatus('ok');
    } else {
      // The hook will set the appropriate status (out_of_range, invalid, error)
      // We just need to mark it as checked
    }
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

    if (showDeliverabilityCheck && deliverabilityStatus !== 'ok') {
      Alert.alert(
        'Delivery Check Required',
        'Please ensure your address is within our delivery area before continuing.'
      );
      return;
    }

    router.back();
  };

  const handleBackContainer = () => {
    // Reset container drill-down (go up one level). For simplicity, jump to root:
    setContainerStack(undefined);
    setSuggestions([]);
    if (query) runFind(query);
    setAddressSelected(false); // Reset address selection state
  };

  const canSave = addressSelected && (showDeliverabilityCheck ? 
    (deliverabilityStatus === 'ok' && deliverabilityChecked) : 
    true);

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

        {/* Deliverability Check Section */}
        {showDeliverabilityCheck && restaurant && addressDetails.postalCode && (
          <View style={styles.deliverabilitySection}>
            <Text style={styles.sectionTitle}>Delivery Area Check</Text>
            <DeliverabilityChecker
              restaurant={restaurant}
              radiusMiles={3}
              initialPostcode={addressDetails.postalCode}
              onDeliverabilityChange={handleDeliverabilityChange}
              placeholder="Postcode"
              style={styles.deliverabilityChecker}
            />
            
            {deliverabilityStatus === 'ok' && (
              <View style={styles.successMessage}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.successText}>Great! We deliver to this area.</Text>
              </View>
            )}
            
            {deliverabilityStatus === 'out_of_range' && (
              <View style={styles.errorMessage}>
                <Ionicons name="warning" size={20} color="#F59E0B" />
                <Text style={styles.errorText}>This address is outside our delivery area.</Text>
              </View>
            )}
            
            {(deliverabilityStatus === 'invalid' || deliverabilityStatus === 'error') && (
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
    fontSize: 16, fontWeight: 'bold',
  },
  deliverabilityChecker: {
    padding: 10,
  },
  successMessage: {
    flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10,
    backgroundColor: '#f0f0f0', borderRadius: 10,
  },
  successText: {
    fontSize: 14, color: '#10B981',
  },
  errorMessage: {
    flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10,
    backgroundColor: '#f0f0f0', borderRadius: 10,
  },
  errorText: {
    fontSize: 14, color: '#EF4444',
  },
});

export default EditAddressScreen;
